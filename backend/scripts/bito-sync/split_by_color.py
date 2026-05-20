"""Split multi-color products into per-color products (Bito-style).

Each Product currently has 0..N ProductColor child rows. The desired schema
matches Bito ERP: every color is its own Product row, no ProductColor.

Strategy for each Product `P` with `N >= 1` colors:
  1. Pick a deterministic "primary" color `Cp` (lowest bitoSku, ties broken by
     nameRu). The original `P` is UPDATED in place to represent `Cp`. Its
     `id` is preserved so any external references (cart/orders/favorites) keep
     working.
  2. For each remaining color `Ci`, INSERT a brand-new Product row.
  3. Move `product_images` from `P` to the per-color products by matching the
     image URL against each color's numeric bitoSku prefix. Images that match
     no color stay on `P` (the primary).
  4. Move `product_warehouse_stocks` from `P` to the per-color products by
     matching `bitoProductId` exactly.
  5. DELETE all `product_colors` rows for `P` (cascaded by deleting the
     parent? no — product_colors_productId_fkey is ON DELETE CASCADE only
     when the parent is deleted, so we delete explicitly).

For each color, the derived product fields are:
  * code:   bitoSku stem (numeric prefix stripped), e.g. `B-19-white`.
            Fallback: `<old_code>-<bitoSku>` if stem is missing/numeric.
  * slug:   lower(code), with `-<6 hex>` suffix if needed for uniqueness.
  * nameRu: `<root> <color>` where root and color come from the SKU stem
            (e.g. `B-19 white`, `C-6 light-pink`). Fallback: `<old_name>`.
  * bitoSku, bitoProductId, bitoNumber: from the color row.
  * price/oldPrice: P.price + Ci.priceModifier (same for oldPrice).
  * inStock, stockQuantity: from color row.
  * everything else (descriptionRu, material, dimensions, packaging,
    categoryId, isActive, isFeatured, isNew, setQuantity, isSpecialOffer):
    inherited from `P`.

Constraints honored:
  * products.code  UNIQUE — collisions get a `-2` `-3` … suffix.
  * products.slug  UNIQUE — collisions get a short random hex suffix.
  * products.bitoProductId UNIQUE — each color already has a unique
    bitoProductId; the primary keeps the original product's bitoProductId
    (which equals the primary color's bitoProductId by construction).

Run:
    cd backend/scripts/bito-sync
    python split_by_color.py --dry-run
    python split_by_color.py --apply
"""
from __future__ import annotations

import argparse
import os
import re
import secrets
import sys
from typing import Any, Dict, List, Optional, Set, Tuple

import psycopg2
import psycopg2.extras


# ---------- helpers ----------

# Curated list of color tokens that can appear in a SKU after the root.
# Matches grouping.py (kept in sync deliberately, but parsing a SKU stem
# is dash-separated rather than space-separated).
COLOR_WORDS = {
    "white", "black", "red", "blue", "green", "yellow", "orange",
    "pink", "purple", "violet", "gray", "grey", "brown", "beige",
    "gold", "silver", "cream", "ivory", "olive", "lime", "mint",
    "peach", "coral", "rose", "magenta", "cyan", "navy", "teal",
    "fuchsia", "lavender", "khaki", "burgundy", "wine", "coffee",
    "chocolate", "tan", "salmon", "turquoise", "amber", "champagne",
    "pearl", "rust", "wenge", "antique", "moss", "mocco", "mocha",
    "nature", "natural", "mix",
    "eucalyptus", "eucalptus", "ucalptus",
    "cactus",
    "light", "dark", "bright", "soft", "hot",
}


def split_sku_stem(stem: str) -> Tuple[str, Optional[str]]:
    """Split SKU stem like 'B-19-white' or 'C-6-light-pink' into (root, color).

    Walks dash-separated tokens from the right, collecting color tokens
    (modifiers like `light`/`dark` are also color tokens here). Returns
    (root, color) or (root, None) if the stem has no recognised color tail.
    """
    if not stem:
        return stem, None
    tokens = stem.split("-")
    color_start = len(tokens)
    for i in range(len(tokens) - 1, -1, -1):
        if tokens[i].lower() in COLOR_WORDS:
            color_start = i
            continue
        break
    if color_start in (0, len(tokens)):
        return stem, None
    root = "-".join(tokens[:color_start])
    color = "-".join(tokens[color_start:])
    return root, color


def gen_cuid_like_id() -> str:
    """Generate a 25-char id that mimics Prisma's `cuid()`."""
    return "c" + secrets.token_hex(12)


_NUM_PREFIX_RE = re.compile(r"^(\d+)(?:-(.+))?$")


def derive_for_color(
    p_code: str,
    p_name: str,
    color_sku: Optional[str],
    color_name: str,
    color_id: str,
) -> Tuple[str, str, str]:
    """Return (new_code, new_name, numeric_bito_number) for a color row.

    Falls back gracefully when the SKU has no English color tail.
    """
    sku = (color_sku or "").strip()
    m = _NUM_PREFIX_RE.match(sku) if sku else None
    bito_number = m.group(1) if m else ""
    stem = m.group(2) if m else sku
    stem = stem or ""

    if stem and not stem.isdigit():
        # Got a non-trivial stem
        new_code = stem
        root, color = split_sku_stem(stem)
        if color:
            new_name = f"{root} {color.replace('-', ' ')}"
        else:
            # Stem has no color tail — use the stem as both code and name
            new_name = stem.replace("-", " ")
    else:
        # No usable stem — fall back to product code + bito number or color id
        suffix = bito_number or color_id[:6]
        new_code = f"{p_code}-{suffix}"
        new_name = f"{p_name} {color_name}".strip()

    return new_code, new_name, bito_number


def slug_from_code(code: str) -> str:
    return code.lower().replace("/", "-")


def hex_suffix() -> str:
    return secrets.token_hex(3)  # 6 chars


# ---------- DB helpers ----------


def load_all_codes_and_slugs(conn) -> Tuple[Set[str], Set[str]]:
    with conn.cursor() as cur:
        cur.execute("SELECT LOWER(code) FROM products")
        codes = {r[0] for r in cur.fetchall()}
        cur.execute("SELECT LOWER(slug) FROM products")
        slugs = {r[0] for r in cur.fetchall()}
    return codes, slugs


def cleanup_conflicting_shells(conn, dry_run: bool) -> Dict[str, int]:
    """Delete empty shell products whose bitoProductId conflicts with a color.

    Some Bito-product groups exist in Supabase as two rows: one canonical row
    that owns the `product_colors` (e.g. `B-10-2` with a `Белый` color), and
    a leftover "shell" row (e.g. `B-10 white`) with 0 colors whose
    `bitoProductId` happens to equal that color's `bitoProductId`.

    Splitting would fail when it tries to INSERT a new per-color product
    with the conflicting `bitoProductId`. We resolve this by:
      1. Moving any `product_images` from the shell to the canonical row
         (so the edited photo isn't lost).
      2. Moving any `product_warehouse_stocks` from the shell to the canonical row.
      3. Deleting the shell row.

    Shells with references in cart/order/favorites are skipped with a warning.
    """
    stats = {"shells_found": 0, "deleted": 0, "skipped_unsafe": 0,
             "images_moved": 0, "stocks_moved": 0}
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT pc."bitoProductId"     AS bito_id,
                   pc."productId"         AS keeper_id,
                   p.id                   AS shell_id,
                   p.code                 AS shell_code,
                   (SELECT COUNT(*) FROM product_colors WHERE "productId" = p.id) AS shell_colors
            FROM product_colors pc
            JOIN products p
              ON p."bitoProductId" = pc."bitoProductId"
             AND p.id <> pc."productId"
            WHERE (SELECT COUNT(*) FROM product_colors WHERE "productId" = p.id) = 0
            """
        )
        shells = cur.fetchall()

    stats["shells_found"] = len(shells)
    print(f"  Found {len(shells)} empty shell products with conflicting bitoProductId")
    if shells[:10]:
        print("  Samples (shell_code -> keeper for that color):")
        for s in shells[:10]:
            print(f"    {s['shell_code']!r:>16}  ->  keeper_id={s['keeper_id']}")

    if dry_run:
        return stats

    with conn.cursor() as cur:
        for s in shells:
            shell_id, keeper_id = s["shell_id"], s["keeper_id"]
            # Safety check
            unsafe = False
            for table, col in [
                ("cart_items", "productId"),
                ("order_items", "productId"),
                ("favorites", "productId"),
                ("product_variants", "productId"),
                ("promotion_products", "productId"),
            ]:
                cur.execute(f'SELECT COUNT(*) FROM {table} WHERE "{col}" = %s', (shell_id,))
                if cur.fetchone()[0]:
                    unsafe = True
                    break
            if unsafe:
                stats["skipped_unsafe"] += 1
                continue
            cur.execute(
                'UPDATE product_images SET "productId" = %s WHERE "productId" = %s',
                (keeper_id, shell_id),
            )
            stats["images_moved"] += cur.rowcount
            cur.execute(
                'UPDATE product_warehouse_stocks SET "productId" = %s WHERE "productId" = %s',
                (keeper_id, shell_id),
            )
            stats["stocks_moved"] += cur.rowcount
            cur.execute('DELETE FROM products WHERE id = %s', (shell_id,))
            stats["deleted"] += 1
        conn.commit()

    print(
        f"  Deleted {stats['deleted']} shells. "
        f"Moved {stats['images_moved']} images, {stats['stocks_moved']} stocks. "
        f"Skipped {stats['skipped_unsafe']} unsafe."
    )
    return stats


def fetch_multicolor_products(conn) -> List[Dict[str, Any]]:
    """Return every product that has >= 1 product_colors row, with its colors."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT p.id, p.code, p.slug, p."nameRu", p."nameUz",
                   p."descriptionRu", p."descriptionUz", p."categoryId",
                   p.price, p."oldPrice", p.material, p.dimensions,
                   p."setQuantity", p.packaging, p."isActive", p."isFeatured",
                   p."isNew", p."isSpecialOffer", p."bitoProductId",
                   p."bitoSku", p."bitoNumber"
            FROM products p
            WHERE EXISTS (SELECT 1 FROM product_colors pc WHERE pc."productId" = p.id)
            ORDER BY p.code
            """
        )
        products = cur.fetchall()

        cur.execute(
            """
            SELECT id, "productId", "nameRu", "nameUz", "hexCode",
                   image, "inStock", "priceModifier", "bitoProductId",
                   "bitoSku", "stockQuantity"
            FROM product_colors
            ORDER BY "productId", "bitoSku", "nameRu"
            """
        )
        by_pid: Dict[str, List[Dict[str, Any]]] = {}
        for c in cur.fetchall():
            by_pid.setdefault(c["productId"], []).append(c)

    for p in products:
        p["colors"] = by_pid.get(p["id"], [])
    return products


def numeric_sku_prefix(sku: Optional[str]) -> Optional[str]:
    if not sku:
        return None
    m = _NUM_PREFIX_RE.match(sku)
    return m.group(1) if m else None


def split_one(
    conn,
    product: Dict[str, Any],
    used_codes: Set[str],
    used_slugs: Set[str],
    dry_run: bool,
) -> Tuple[int, int, int]:
    """Split one product P into N per-color products.

    Returns (new_inserts, images_moved, stocks_moved).
    """
    colors = product["colors"]
    if not colors:
        return (0, 0, 0)

    # Pick primary deterministically (lowest bitoSku, then nameRu)
    colors_sorted = sorted(
        colors,
        key=lambda c: ((c["bitoSku"] or ""), c["nameRu"] or ""),
    )
    primary = colors_sorted[0]
    rest = colors_sorted[1:]

    # Pre-compute new (code, name) for every color
    derived: List[Tuple[Dict[str, Any], str, str, str]] = []
    for c in colors_sorted:
        code, name, bito_num = derive_for_color(
            product["code"],
            product["nameRu"],
            c["bitoSku"],
            c["nameRu"],
            c["id"],
        )
        # Resolve code collision
        low = code.lower()
        suffix_n = 2
        while low in used_codes:
            code = f"{code}-{suffix_n}"
            low = code.lower()
            suffix_n += 1
        used_codes.add(low)
        derived.append((c, code, name, bito_num))

    new_inserts = 0
    images_moved = 0
    stocks_moved = 0

    if dry_run:
        return (len(rest), 0, 0)

    with conn.cursor() as cur:
        # Step 1: UPDATE the original product P to be the primary color
        c, code, name, bito_num = derived[0]
        slug = slug_from_code(code)
        low = slug.lower()
        while low in used_slugs:
            slug = f"{slug_from_code(code)}-{hex_suffix()}"
            low = slug.lower()
        used_slugs.add(low)

        cur.execute(
            """
            UPDATE products SET
                code = %s,
                slug = %s,
                "nameRu" = %s,
                "nameUz" = %s,
                price = %s,
                "oldPrice" = %s,
                "inStock" = %s,
                "stockQuantity" = %s,
                "bitoProductId" = %s,
                "bitoSku" = %s,
                "bitoNumber" = %s,
                "updatedAt" = NOW()
            WHERE id = %s
            """,
            (
                code,
                slug,
                name,
                name,
                (product["price"] or 0) + (c["priceModifier"] or 0),
                None if product["oldPrice"] is None
                else product["oldPrice"] + (c["priceModifier"] or 0),
                c["inStock"],
                c["stockQuantity"],
                c["bitoProductId"],
                c["bitoSku"],
                bito_num or None,
                product["id"],
            ),
        )

        # Step 2: INSERT new products for the rest of colors
        color_id_to_product_id: Dict[str, str] = {primary["id"]: product["id"]}
        for c, code, name, bito_num in derived[1:]:
            slug = slug_from_code(code)
            low = slug.lower()
            while low in used_slugs:
                slug = f"{slug_from_code(code)}-{hex_suffix()}"
                low = slug.lower()
            used_slugs.add(low)
            new_id = gen_cuid_like_id()

            cur.execute(
                """
                INSERT INTO products
                  (id, code, slug, "nameRu", "nameUz",
                   "descriptionRu", "descriptionUz", "categoryId",
                   price, "oldPrice", material, dimensions, "inStock",
                   "stockQuantity", "setQuantity", packaging, "isActive",
                   "isFeatured", "isNew", "viewCount", "createdAt",
                   "updatedAt", "isSpecialOffer", "bitoProductId",
                   "bitoSku", "bitoNumber")
                VALUES
                  (%s, %s, %s, %s, %s,
                   %s, %s, %s,
                   %s, %s, %s, %s, %s,
                   %s, %s, %s, %s,
                   %s, %s, 0, NOW(),
                   NOW(), %s, %s,
                   %s, %s)
                """,
                (
                    new_id, code, slug, name, name,
                    product["descriptionRu"], product["descriptionUz"], product["categoryId"],
                    (product["price"] or 0) + (c["priceModifier"] or 0),
                    None if product["oldPrice"] is None
                    else product["oldPrice"] + (c["priceModifier"] or 0),
                    product["material"], psycopg2.extras.Json(product["dimensions"]) if product["dimensions"] is not None else None,
                    c["inStock"],
                    c["stockQuantity"], product["setQuantity"],
                    psycopg2.extras.Json(product["packaging"]) if product["packaging"] is not None else None,
                    product["isActive"],
                    product["isFeatured"], product["isNew"],
                    product["isSpecialOffer"], c["bitoProductId"],
                    c["bitoSku"], bito_num or None,
                ),
            )
            new_inserts += 1
            color_id_to_product_id[c["id"]] = new_id

        # Step 3: Move images by numeric SKU prefix match
        # Build mapping: numeric_prefix -> target product id
        prefix_to_pid: Dict[str, str] = {}
        for c in colors_sorted:
            np_ = numeric_sku_prefix(c["bitoSku"])
            if np_:
                prefix_to_pid[np_] = color_id_to_product_id[c["id"]]

        if prefix_to_pid:
            cur.execute(
                'SELECT id, url FROM product_images WHERE "productId" = %s',
                (product["id"],),
            )
            for img_id, url in cur.fetchall():
                for prefix, target_pid in prefix_to_pid.items():
                    if f"/{prefix}-" in url or url.split("/")[-1].startswith(prefix + "-"):
                        if target_pid != product["id"]:
                            cur.execute(
                                'UPDATE product_images SET "productId" = %s WHERE id = %s',
                                (target_pid, img_id),
                            )
                            images_moved += 1
                        break

        # Step 4: Move warehouse stocks by bitoProductId
        for c in rest:
            target_pid = color_id_to_product_id[c["id"]]
            cur.execute(
                """
                UPDATE product_warehouse_stocks
                   SET "productId" = %s
                 WHERE "productId" = %s AND "bitoProductId" = %s
                """,
                (target_pid, product["id"], c["bitoProductId"]),
            )
            stocks_moved += cur.rowcount

        # Step 5: Delete all product_colors of this product
        cur.execute(
            'DELETE FROM product_colors WHERE "productId" = %s',
            (product["id"],),
        )

    return (new_inserts, images_moved, stocks_moved)


# ---------- main ----------


def main() -> None:
    parser = argparse.ArgumentParser(description="Split multi-color products into per-color products")
    parser.add_argument("--apply", action="store_true", help="Apply changes (default: dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--limit", type=int, default=0, help="Process at most N products (0 = all)")
    args = parser.parse_args()
    dry_run = not args.apply

    if dry_run:
        print("=== DRY RUN MODE (use --apply to execute) ===\n")
    else:
        print("=== APPLYING CHANGES ===\n")

    dsn = os.environ.get("SUPABASE_DSN")
    if not dsn:
        print("ERROR: SUPABASE_DSN not set")
        sys.exit(1)

    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    print("--- Phase 0: Cleanup conflicting empty shells ---")
    cleanup_conflicting_shells(conn, dry_run)
    print()

    print("--- Phase 1: Split multi-color products into per-color products ---")
    products = fetch_multicolor_products(conn)
    if args.limit:
        products = products[: args.limit]
    print(f"Found {len(products)} products with at least 1 product_color row")
    print(f"  -> they have {sum(len(p['colors']) for p in products)} total colors")
    print()

    # Show a few derivations
    print("--- Derivation samples ---")
    sample_count = 0
    for p in products:
        if sample_count >= 8:
            break
        if len(p["colors"]) >= 2:
            print(f"  {p['code']!r} ({len(p['colors'])} colors)")
            for c in p["colors"][:6]:
                new_code, new_name, _ = derive_for_color(
                    p["code"], p["nameRu"], c["bitoSku"], c["nameRu"], c["id"]
                )
                print(
                    f"    color sku={c['bitoSku']!r:>30}  "
                    f"-> code={new_code!r:>26}  name={new_name!r}"
                )
            sample_count += 1
    print()

    used_codes, used_slugs = load_all_codes_and_slugs(conn)

    totals = {"products_new": 0, "products_kept": 0, "images_moved": 0, "stocks_moved": 0}
    n_processed = 0
    for p in products:
        n_new, n_img, n_stk = split_one(conn, p, used_codes, used_slugs, dry_run)
        totals["products_new"] += n_new
        totals["products_kept"] += 1  # the original P always survives as primary
        totals["images_moved"] += n_img
        totals["stocks_moved"] += n_stk
        n_processed += 1
        if n_processed % 25 == 0:
            if not dry_run:
                conn.commit()
            print(f"  ... processed {n_processed}/{len(products)} products")

    if not dry_run:
        conn.commit()

    print()
    print("--- Totals ---")
    print(
        f"  Source products processed:   {n_processed}\n"
        f"  Primary rows kept (UPDATE):  {totals['products_kept']}\n"
        f"  New rows inserted:           {totals['products_new']}\n"
        f"  Images moved:                {totals['images_moved']}\n"
        f"  Warehouse stocks moved:      {totals['stocks_moved']}\n"
    )

    conn.close()
    print("=== DONE ===")


if __name__ == "__main__":
    main()
