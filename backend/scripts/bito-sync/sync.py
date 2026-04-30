"""Bito ERP -> Supabase one-directional sync.

Phases (run in order):
  1. Warehouses  (Bito 6 -> bito_warehouses)
  2. Categories  (Bito 39 -> categories, smart RU/UZ names)
  3. Products    (Bito 1812 -> products + product_colors, variant A grouping)
                 - Match existing Supabase products by code (preserves curated
                   nameRu/nameUz/slug/description/photos).
                 - Create new products for groups that have no Supabase match.
  4. Stock       (Bito _warehouses[*] -> product_warehouse_stocks
                 + sum into products.stockQuantity)
  5. Prices      (Bito narxi UZS -> products.price)
  6. Customers   (Bito 245 -> bito_customers)
  7. Employees   (Bito 7   -> bito_employees)

Run modes:
    python sync.py --dry-run            (default; prints planned changes, no writes)
    python sync.py --apply              (executes writes inside a transaction)
    python sync.py --apply --skip-stock (etc; selective)

Env required:
    BITO_BASE_URL, BITO_API_KEY, BITO_PRICE_ID
    SUPABASE_DSN
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

# Make sibling modules importable when running `python sync.py` directly.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import psycopg2  # noqa: E402
import psycopg2.extras  # noqa: E402

from bito_client import BitoClient  # noqa: E402
from categories import smart_slug, smart_translate  # noqa: E402
from grouping import (  # noqa: E402
    color_label_ru_uz,
    group_products,
    normalize_root,
    split_root_color,
)
from matching import Matcher, expand_keys, supabase_keys  # noqa: E402


REPO_ROOT = Path(__file__).resolve().parents[3]


# ------------------------- helpers -------------------------


def cuid() -> str:
    """Quasi-cuid (just a unique TEXT id) — Prisma-compatible enough for inserts."""
    return "c" + uuid.uuid4().hex[:24]


def slugify(s: str, suffix: str = "") -> str:
    s = (s or "").lower().replace("'", "").replace("’", "").replace("`", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    if suffix:
        s = f"{s}-{suffix}" if s else suffix
    return s or "item"


def parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000 if value > 1e12 else value, tz=timezone.utc)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def title_case_root(root_norm: str) -> str:
    """Pretty-print a normalized root (e.g. `b-1` -> `B-1`, `0278-140` -> `0278-140`)."""
    if not root_norm:
        return root_norm
    parts = re.split(r"([\s\-/])", root_norm)
    out = []
    for p in parts:
        if p in (" ", "-", "/"):
            out.append(p)
        elif p.isalpha():
            out.append(p.upper() if len(p) <= 2 else p.capitalize())
        else:
            out.append(p)
    return "".join(out)


# ------------------------- DB helpers -------------------------


@contextmanager
def db_connect(dsn: str):
    conn = psycopg2.connect(dsn)
    try:
        yield conn
    finally:
        conn.close()


def fetch_supabase_products(cur) -> List[Dict[str, Any]]:
    cur.execute(
        """
        SELECT id, code, slug, "nameRu", "nameUz", "categoryId", price, "stockQuantity",
               "inStock", "bitoProductId", "bitoSku", "bitoNumber"
        FROM products
        """
    )
    return [dict(r) for r in cur.fetchall()]


def fetch_supabase_categories(cur) -> List[Dict[str, Any]]:
    cur.execute(
        """SELECT id, slug, "nameRu", "nameUz", "bitoCategoryId" FROM categories"""
    )
    return [dict(r) for r in cur.fetchall()]


def fetch_supabase_warehouses(cur) -> List[Dict[str, Any]]:
    cur.execute('SELECT id, "bitoId", name FROM bito_warehouses')
    return [dict(r) for r in cur.fetchall()]


# ------------------------- phase 1: warehouses -------------------------


def sync_warehouses(client: BitoClient, conn, dry_run: bool, log: List[str]) -> Dict[str, str]:
    """Returns: {bito_warehouse_id: supabase_warehouse_id}"""
    bito_whs = client.warehouses()
    log.append(f"[warehouses] fetched {len(bito_whs)} from Bito")

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        existing = fetch_supabase_warehouses(cur)
    existing_by_bito = {w["bitoId"]: w for w in existing}

    bito_to_supa: Dict[str, str] = {}
    inserts, updates = 0, 0
    now = datetime.now(timezone.utc)

    with conn.cursor() as cur:
        for w in bito_whs:
            bid = w["_id"]
            name = w.get("name", "")
            code = w.get("code")
            is_main = bool(w.get("is_main", False))
            is_default = bool(w.get("is_default", False))
            if bid in existing_by_bito:
                row = existing_by_bito[bid]
                bito_to_supa[bid] = row["id"]
                if not dry_run:
                    cur.execute(
                        """UPDATE bito_warehouses
                           SET name=%s, code=%s, "isMain"=%s, "isDefault"=%s, "updatedAt"=%s
                           WHERE "bitoId"=%s""",
                        (name, code, is_main, is_default, now, bid),
                    )
                updates += 1
            else:
                new_id = cuid()
                bito_to_supa[bid] = new_id
                if not dry_run:
                    cur.execute(
                        """INSERT INTO bito_warehouses (id, "bitoId", name, code, "isMain", "isDefault", "isActive", "sortOrder", "createdAt", "updatedAt")
                           VALUES (%s, %s, %s, %s, %s, %s, true, 0, %s, %s)""",
                        (new_id, bid, name, code, is_main, is_default, now, now),
                    )
                inserts += 1

    log.append(f"[warehouses] {inserts} new, {updates} updated (dry_run={dry_run})")
    return bito_to_supa


# ------------------------- phase 2: categories -------------------------


def sync_categories(client: BitoClient, conn, dry_run: bool, log: List[str]) -> Dict[str, str]:
    """Returns: {bito_category_id: supabase_category_id}"""
    bito_cats = client.categories()
    log.append(f"[categories] fetched {len(bito_cats)} from Bito")

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        existing = fetch_supabase_categories(cur)
    existing_by_bito = {c["bitoCategoryId"]: c for c in existing if c.get("bitoCategoryId")}
    existing_by_slug = {c["slug"]: c for c in existing}
    used_slugs = set(existing_by_slug.keys())

    bito_to_supa: Dict[str, str] = {}
    inserts, updates = 0, 0
    now = datetime.now(timezone.utc)

    with conn.cursor() as cur:
        # First pass: insert / update self
        for cat in bito_cats:
            bid = cat["_id"]
            name_uz_source = cat.get("name") or ""
            ru, uz = smart_translate(name_uz_source)
            slug = smart_slug(name_uz_source, bid)
            i = 1
            base_slug = slug
            while slug in used_slugs and existing_by_slug.get(slug, {}).get("bitoCategoryId") not in (None, bid):
                i += 1
                slug = f"{base_slug}-{i}"
            used_slugs.add(slug)

            parent_bid = cat.get("parent_id") or None

            if bid in existing_by_bito:
                row = existing_by_bito[bid]
                bito_to_supa[bid] = row["id"]
                if not dry_run:
                    cur.execute(
                        """UPDATE categories
                           SET "nameRu"=%s, "nameUz"=%s, "bitoParentId"=%s, "updatedAt"=%s
                           WHERE "bitoCategoryId"=%s""",
                        (ru, uz, parent_bid, now, bid),
                    )
                updates += 1
            else:
                new_id = cuid()
                bito_to_supa[bid] = new_id
                if not dry_run:
                    cur.execute(
                        """INSERT INTO categories (id, slug, "nameRu", "nameUz", "sortOrder", "isActive", "bitoCategoryId", "bitoParentId", "createdAt", "updatedAt")
                           VALUES (%s, %s, %s, %s, 0, true, %s, %s, %s, %s)""",
                        (new_id, slug, ru, uz, bid, parent_bid, now, now),
                    )
                inserts += 1

    log.append(f"[categories] {inserts} new, {updates} updated (dry_run={dry_run})")
    return bito_to_supa


# ------------------------- phase 3 + 4 + 5: products / stock / prices -------------------------


def pick_price_for_product(price_items_by_pid: Dict[str, Dict[str, Any]], bito_id: str) -> Optional[int]:
    """Return integer UZS price for a Bito product id, or None."""
    item = price_items_by_pid.get(bito_id)
    if not item:
        return None
    val = item.get("price") or item.get("amount") or item.get("value")
    if val is None:
        return None
    try:
        return int(round(float(val)))
    except (TypeError, ValueError):
        return None


def sum_stock(product: Dict[str, Any]) -> Tuple[int, Dict[str, Dict[str, int]]]:
    """Return (total_amount, {warehouse_bito_id: {amount, booked, in_transit, in_trash}})."""
    wmap: Dict[str, Dict[str, int]] = {}
    total = 0
    for wid, w in (product.get("_warehouses") or {}).items():
        amount = int(w.get("amount") or 0)
        booked = int(w.get("booked") or 0)
        in_transit = int(w.get("in_transit") or 0)
        in_trash = int(w.get("in_trash") or 0)
        wmap[wid] = {
            "amount": amount,
            "booked": booked,
            "in_transit": in_transit,
            "in_trash": in_trash,
        }
        total += amount
    return total, wmap


def sync_products(
    client: BitoClient,
    conn,
    dry_run: bool,
    log: List[str],
    skip_prices: bool = False,
    skip_stock: bool = False,
    wh_map: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Sync products + colors + per-warehouse stock + prices.

    Strategy (variant A):
      - Group Bito products by normalized root.
      - For each group:
          * Single Bito product, no color suffix -> Supabase product (no colors)
          * Single Bito product WITH color suffix -> Supabase product (1 color)
          * Multiple Bito products -> Supabase product + N colors
      - Match each Bito group root to existing Supabase product by code.
        If found, update price/stock/bitoProductId without touching curated fields.
        If not found, create new Supabase product with smart names.
    """
    bito_products = client.products()
    log.append(f"[products] fetched {len(bito_products)} from Bito")

    # Price index: narxi UZS
    price_items: Dict[str, Dict[str, Any]] = {}
    if not skip_prices:
        price_id = os.environ.get("BITO_PRICE_ID", "6706187e485b322ea8c90155")
        log.append(f"[prices] fetching price items for price_id={price_id}")
        try:
            for it in client.price_items(price_id):
                pid = it.get("product_id") or (it.get("product") or {}).get("_id")
                if pid:
                    price_items[pid] = it
        except Exception as e:
            log.append(f"[prices] WARNING: failed to fetch price items: {e}")
    log.append(f"[prices] indexed {len(price_items)} price entries")

    # Read current Supabase state
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        supa_products = fetch_supabase_products(cur)
        supa_categories = fetch_supabase_categories(cur)
        cat_by_bito = {c["bitoCategoryId"]: c for c in supa_categories if c.get("bitoCategoryId")}
        cur.execute(
            """SELECT id, "productId", "nameRu", "nameUz", "bitoProductId" FROM product_colors"""
        )
        existing_colors = [dict(r) for r in cur.fetchall()]
        cur.execute('SELECT id, "bitoId" FROM bito_warehouses')
        wh_index = {r[1]: r[0] for r in cur.fetchall()}
    if wh_map:
        # Override with the mapping returned by sync_warehouses (covers dry-run)
        wh_index = {**wh_index, **wh_map}

    matcher = Matcher(supa_products)
    used_slugs = {p["slug"] for p in supa_products}
    used_codes = {p["code"] for p in supa_products}

    groups = group_products(bito_products)

    # Phase A: try to match each Bito GROUP by its root code (variant A).
    # If Supabase has a product whose code matches the root (no color suffix),
    # the whole group becomes that Supabase product with N color rows.
    used_supa_ids: Set[str] = set()
    group_match: Dict[str, Dict[str, Any]] = {}  # root_norm -> supabase_product
    for root_norm, items in groups.items():
        if not root_norm:
            continue
        hit = matcher.find(root_norm)
        if hit and hit["id"] not in used_supa_ids:
            group_match[root_norm] = hit
            used_supa_ids.add(hit["id"])

    # Phase B: for Bito products NOT in a matched group, try 1:1 match by full
    # name. Used when Supabase has each color as a separate product
    # (MIAMI-64(black/gold), MIAMI-64(brown/gold), ...).
    one_to_one: Dict[str, Dict[str, Any]] = {}  # bito_id -> supabase_product
    for root_norm, items in groups.items():
        if root_norm in group_match:
            continue  # whole group handled at root level
        for color, bp in items:
            candidates: List[str] = [bp.get("name", "")]
            if bp.get("number"):
                candidates.append(bp["number"])
            if bp.get("sku"):
                candidates.append(bp["sku"])
            hit = matcher.find(*candidates)
            if hit and hit["id"] not in used_supa_ids:
                one_to_one[bp["_id"]] = hit
                used_supa_ids.add(hit["id"])

    log.append(f"[products] phase A: root group matches = {len(group_match)}")
    log.append(f"[products] phase B: 1:1 matches      = {len(one_to_one)}")

    plan = {
        "groups_total": len(groups),
        "matched_existing": 0,
        "matched_one_to_one": len(one_to_one),
        "new_products": 0,
        "color_rows_total": 0,
        "stock_rows_total": 0,
        "skipped_no_price": 0,
        "warnings": [],
    }
    samples_matched: List[str] = []
    samples_new: List[str] = []

    now = datetime.now(timezone.utc)

    def write_warehouse_stock(cur, supa_id: str, p: Dict[str, Any], wmap: Dict[str, Dict[str, int]]) -> None:
        bito_pid = p["_id"]
        for wh_bid, vals in wmap.items():
            wh_supa_id = wh_index.get(wh_bid)
            if not wh_supa_id:
                plan["warnings"].append(f"unknown warehouse {wh_bid} for {p.get('name', '?')}")
                continue
            plan["stock_rows_total"] += 1
            if not dry_run:
                cur.execute(
                    """INSERT INTO product_warehouse_stocks (
                        id, "productId", "warehouseId", "bitoProductId",
                        amount, booked, "inTransit", "inTrash", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT ("bitoProductId", "warehouseId") DO UPDATE
                      SET amount=EXCLUDED.amount,
                          booked=EXCLUDED.booked,
                          "inTransit"=EXCLUDED."inTransit",
                          "inTrash"=EXCLUDED."inTrash",
                          "productId"=EXCLUDED."productId",
                          "updatedAt"=EXCLUDED."updatedAt" """,
                    (
                        cuid(), supa_id, wh_supa_id, bito_pid,
                        vals["amount"], vals["booked"],
                        vals["in_transit"], vals["in_trash"], now,
                    ),
                )

    with conn.cursor() as cur:
        # ============== Phase 1: 1:1 linked products (don't group) ==============
        for bito_id, supa in one_to_one.items():
            bp = next(p for p in bito_products if p["_id"] == bito_id)
            total_stock, wmap = sum_stock(bp)
            price = pick_price_for_product(price_items, bito_id)
            plan["matched_existing"] += 1
            samples_matched.append(f"{bp['name']!r:<45} -> Supabase {supa['code']} (1:1)")
            fields = ['"bitoProductId"=%s', '"bitoSku"=%s', '"bitoNumber"=%s',
                      '"stockQuantity"=%s', '"inStock"=%s', '"updatedAt"=%s']
            params: List[Any] = [bito_id, bp.get("sku"), bp.get("number"),
                                 total_stock, total_stock > 0, now]
            if price is not None and price > 0:
                fields.insert(0, "price=%s")
                params.insert(0, price)
            params.append(supa["id"])
            if not dry_run:
                cur.execute(
                    f"UPDATE products SET {', '.join(fields)} WHERE id=%s",
                    params,
                )
            if not skip_stock:
                write_warehouse_stock(cur, supa["id"], bp, wmap)

        # ============== Phase 2: group remaining Bito products ==============
        for root_norm, items in groups.items():
            # Skip items that already got a 1:1 link in phase B
            remaining_items = [(c, p) for (c, p) in items if p["_id"] not in one_to_one]
            if not remaining_items:
                continue
            colors = sorted(remaining_items, key=lambda x: (x[0] or "", x[1].get("name", "")))
            first = colors[0][1]

            # Use the group match found in phase A (None if no Supabase product)
            existing_supa = group_match.get(root_norm)

            # Build aggregated stock + price for the group
            total_stock = 0
            best_price: Optional[int] = None
            wh_rows_for_group: List[Tuple[Dict[str, Any], Optional[str], Dict[str, Dict[str, int]]]] = []
            for color, p in colors:
                t, wmap = sum_stock(p)
                total_stock += t
                wh_rows_for_group.append((p, color, wmap))
                price = pick_price_for_product(price_items, p["_id"])
                if price is not None and price > 0 and (best_price is None or price > best_price):
                    best_price = price

            # Resolve category: take from first item's category if mapped
            category_supa_id: Optional[str] = None
            cat_bito = first.get("category")
            if cat_bito and isinstance(cat_bito, dict):
                cat_bid = cat_bito.get("_id")
                if cat_bid and cat_bid in cat_by_bito:
                    category_supa_id = cat_by_bito[cat_bid]["id"]

            if existing_supa:
                used_supa_ids.add(existing_supa["id"])
                supa_id = existing_supa["id"]
                plan["matched_existing"] += 1
                samples_matched.append(
                    f"{first['name']!r:<45} -> Supabase {existing_supa['code']}"
                )
                # Update only Bito-managed fields
                fields = ["\"bitoProductId\"=%s", "\"bitoSku\"=%s", "\"bitoNumber\"=%s",
                          "\"stockQuantity\"=%s", "\"inStock\"=%s", "\"updatedAt\"=%s"]
                params: List[Any] = [first["_id"], first.get("sku"), first.get("number"),
                                     total_stock, total_stock > 0, now]
                if best_price is not None:
                    fields.insert(0, "price=%s")
                    params.insert(0, best_price)
                params.append(supa_id)
                if not dry_run:
                    cur.execute(
                        f"UPDATE products SET {', '.join(fields)} WHERE id=%s",
                        params,
                    )
            else:
                # Create new Supabase product
                code = title_case_root(root_norm)
                # Avoid clashing with manual codes
                base_code = code
                i = 2
                while code.lower() in {c.lower() for c in used_codes}:
                    code = f"{base_code}-{i}"
                    i += 1
                used_codes.add(code)

                # Smart RU/UZ name: capitalized root
                name_display = code  # business uses codes as names (no human-readable name in Bito)
                ru = name_display
                uz = name_display

                slug = slugify(name_display, suffix=first["_id"][-6:])
                while slug in used_slugs:
                    slug = slugify(name_display, suffix=uuid.uuid4().hex[:6])
                used_slugs.add(slug)

                supa_id = cuid()
                plan["new_products"] += 1
                samples_new.append(f"{first['name']!r:<45} -> NEW {code} (slug={slug})")
                if not dry_run:
                    cur.execute(
                        """INSERT INTO products (
                            id, code, slug, "nameRu", "nameUz", "categoryId", price,
                            "inStock", "stockQuantity", "setQuantity", "isActive",
                            "isFeatured", "isNew", "viewCount",
                            "bitoProductId", "bitoSku", "bitoNumber",
                            "createdAt", "updatedAt"
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, 1, true,
                            false, false, 0,
                            %s, %s, %s,
                            %s, %s
                        )""",
                        (
                            supa_id, code, slug, ru, uz, category_supa_id,
                            best_price or 0,
                            total_stock > 0, total_stock,
                            first["_id"], first.get("sku"), first.get("number"),
                            now, now,
                        ),
                    )

            # ----- product_colors -----
            multi = len(colors) > 1
            if multi:
                for color_label, p in colors:
                    if not color_label:
                        # No color suffix on this child -> name it "Default"
                        color_label = "default"
                    ru_c, uz_c = color_label_ru_uz(color_label)
                    bito_pid = p["_id"]
                    sku = p.get("sku")
                    t, _ = sum_stock(p)
                    plan["color_rows_total"] += 1
                    if not dry_run:
                        # upsert by bitoProductId
                        cur.execute(
                            """INSERT INTO product_colors (id, "productId", "nameRu", "nameUz", "inStock", "priceModifier", "bitoProductId", "bitoSku", "stockQuantity")
                               VALUES (%s, %s, %s, %s, %s, 0, %s, %s, %s)
                               ON CONFLICT ("bitoProductId") DO UPDATE
                                 SET "productId"=EXCLUDED."productId",
                                     "nameRu"=EXCLUDED."nameRu",
                                     "nameUz"=EXCLUDED."nameUz",
                                     "inStock"=EXCLUDED."inStock",
                                     "stockQuantity"=EXCLUDED."stockQuantity",
                                     "bitoSku"=EXCLUDED."bitoSku" """,
                            (cuid(), supa_id, ru_c, uz_c, t > 0, bito_pid, sku, t),
                        )

            # ----- per-warehouse stock -----
            if not skip_stock:
                for p, color_label, wmap in wh_rows_for_group:
                    write_warehouse_stock(cur, supa_id, p, wmap)

    log.append(
        f"[products] groups={plan['groups_total']} matched={plan['matched_existing']} "
        f"new={plan['new_products']} colors={plan['color_rows_total']} "
        f"stock_rows={plan['stock_rows_total']} (dry_run={dry_run})"
    )
    return {
        "plan": plan,
        "samples_matched": samples_matched[:30],
        "samples_new": samples_new[:30],
    }


# ------------------------- phase 6: customers -------------------------


def sync_customers(client: BitoClient, conn, dry_run: bool, log: List[str]) -> Dict[str, int]:
    customers = client.customers()
    log.append(f"[customers] fetched {len(customers)} from Bito")

    inserts, updates = 0, 0
    now = datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute('SELECT "bitoId" FROM bito_customers')
        existing = {r[0] for r in cur.fetchall()}

        for c in customers:
            bid = c["_id"]
            name = c.get("name", "") or ""
            phone = c.get("phone")
            extras = c.get("extra_phones") or []
            card = c.get("card_number")
            cat = c.get("category_id")
            resp = c.get("responsible_id")
            total_sale = int(c.get("total_sale") or 0)
            avg_sale = int(c.get("avg_sale") or 0)
            point = int(c.get("point") or 0)
            balance = int(c.get("balance") or 0)
            balance_currency = (c.get("balance_currency") or {}).get("name") if isinstance(c.get("balance_currency"), dict) else c.get("balance_currency")
            ctype = c.get("type") or (c.get("customer_type") or {}).get("name") if isinstance(c.get("customer_type"), dict) else c.get("customer_type")
            bito_created = parse_dt(c.get("created_at"))
            bito_updated = parse_dt(c.get("updated_at"))
            if bid in existing:
                updates += 1
                if not dry_run:
                    cur.execute(
                        """UPDATE bito_customers SET
                            type=%s, name=%s, phone=%s, "extraPhones"=%s, "cardNumber"=%s,
                            "bitoCategoryId"=%s, "responsibleId"=%s,
                            "totalSale"=%s, "avgSale"=%s, point=%s, balance=%s, "balanceCurrency"=%s,
                            "rawData"=%s, "bitoUpdatedAt"=%s, "updatedAt"=%s
                          WHERE "bitoId"=%s""",
                        (
                            str(ctype) if ctype else None, name, phone,
                            psycopg2.extras.Json(extras), card, cat, resp,
                            total_sale, avg_sale, point, balance, balance_currency,
                            psycopg2.extras.Json(c), bito_updated, now, bid,
                        ),
                    )
            else:
                inserts += 1
                if not dry_run:
                    cur.execute(
                        """INSERT INTO bito_customers (
                            id, "bitoId", type, name, phone, "extraPhones", "cardNumber",
                            "bitoCategoryId", "responsibleId",
                            "totalSale", "avgSale", point, balance, "balanceCurrency",
                            "isActive", "rawData", "bitoCreatedAt", "bitoUpdatedAt",
                            "createdAt", "updatedAt"
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s,
                            %s, %s,
                            %s, %s, %s, %s, %s,
                            true, %s, %s, %s,
                            %s, %s
                        )""",
                        (
                            cuid(), bid, str(ctype) if ctype else None, name, phone,
                            psycopg2.extras.Json(extras), card, cat, resp,
                            total_sale, avg_sale, point, balance, balance_currency,
                            psycopg2.extras.Json(c), bito_created, bito_updated, now, now,
                        ),
                    )

    log.append(f"[customers] {inserts} new, {updates} updated (dry_run={dry_run})")
    return {"inserts": inserts, "updates": updates}


# ------------------------- phase 7: employees -------------------------


def sync_employees(client: BitoClient, conn, dry_run: bool, log: List[str]) -> Dict[str, int]:
    employees = client.employees()
    log.append(f"[employees] fetched {len(employees)} from Bito")

    inserts, updates = 0, 0
    now = datetime.now(timezone.utc)
    with conn.cursor() as cur:
        cur.execute('SELECT "bitoId" FROM bito_employees')
        existing = {r[0] for r in cur.fetchall()}
        for e in employees:
            bid = e["_id"]
            full_name = e.get("name") or e.get("full_name") or e.get("username") or "Без имени"
            phone = e.get("phone")
            number = e.get("number")
            position = e.get("position") or {}
            position_id = position.get("_id") if isinstance(position, dict) else None
            position_name = position.get("name") if isinstance(position, dict) else None
            role = e.get("role") or {}
            role_id = role.get("_id") if isinstance(role, dict) else None
            role_name = role.get("name") if isinstance(role, dict) else None
            bito_created = parse_dt(e.get("created_at"))
            bito_updated = parse_dt(e.get("updated_at"))
            if bid in existing:
                updates += 1
                if not dry_run:
                    cur.execute(
                        """UPDATE bito_employees SET
                              "fullName"=%s, phone=%s, number=%s,
                              "positionId"=%s, "positionName"=%s, "roleId"=%s, "roleName"=%s,
                              "rawData"=%s, "bitoUpdatedAt"=%s, "updatedAt"=%s
                           WHERE "bitoId"=%s""",
                        (full_name, phone, number, position_id, position_name, role_id, role_name,
                         psycopg2.extras.Json(e), bito_updated, now, bid),
                    )
            else:
                inserts += 1
                if not dry_run:
                    cur.execute(
                        """INSERT INTO bito_employees (
                              id, "bitoId", "fullName", phone, number,
                              "positionId", "positionName", "roleId", "roleName",
                              "isActive", "rawData", "bitoCreatedAt", "bitoUpdatedAt",
                              "createdAt", "updatedAt"
                           ) VALUES (
                              %s, %s, %s, %s, %s,
                              %s, %s, %s, %s,
                              true, %s, %s, %s,
                              %s, %s
                           )""",
                        (cuid(), bid, full_name, phone, number,
                         position_id, position_name, role_id, role_name,
                         psycopg2.extras.Json(e), bito_created, bito_updated, now, now),
                    )

    log.append(f"[employees] {inserts} new, {updates} updated (dry_run={dry_run})")
    return {"inserts": inserts, "updates": updates}


# ------------------------- audit: sync run -------------------------


def record_run(conn, dry_run: bool, log: List[str], stats: Dict[str, Any], status: str, error: Optional[str]) -> None:
    if dry_run:
        return
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO bito_sync_runs (id, "startedAt", "finishedAt", status, "dryRun", stats, "errorLog")
               VALUES (%s, NOW(), NOW(), %s, %s, %s, %s)""",
            (cuid(), status, dry_run, psycopg2.extras.Json({"log": log, "stats": stats}), error),
        )


# ------------------------- main -------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Bito -> Supabase sync")
    parser.add_argument("--apply", action="store_true", help="Apply changes (default is dry-run)")
    parser.add_argument("--skip-warehouses", action="store_true")
    parser.add_argument("--skip-categories", action="store_true")
    parser.add_argument("--skip-products", action="store_true")
    parser.add_argument("--skip-stock", action="store_true")
    parser.add_argument("--skip-prices", action="store_true")
    parser.add_argument("--skip-customers", action="store_true")
    parser.add_argument("--skip-employees", action="store_true")
    parser.add_argument("--report-out", default=None,
                        help="Path to write JSON report (default: stdout summary only)")
    args = parser.parse_args()

    dry_run = not args.apply

    bito = BitoClient()
    dsn = os.environ["SUPABASE_DSN"]

    log: List[str] = []
    stats: Dict[str, Any] = {}
    error: Optional[str] = None
    status = "ok"

    log.append(f"=== Bito sync start (dry_run={dry_run}) ===")
    t0 = time.time()
    with db_connect(dsn) as conn:
        try:
            wh_map: Dict[str, str] = {}
            if not args.skip_warehouses:
                wh_map = sync_warehouses(bito, conn, dry_run, log)
                stats["warehouses"] = {"count": len(wh_map)}
            if not args.skip_categories:
                stats["categories"] = sync_categories(bito, conn, dry_run, log)
            if not args.skip_products:
                stats["products"] = sync_products(
                    bito, conn, dry_run, log,
                    skip_prices=args.skip_prices,
                    skip_stock=args.skip_stock,
                    wh_map=wh_map,
                )
            if not args.skip_customers:
                stats["customers"] = sync_customers(bito, conn, dry_run, log)
            if not args.skip_employees:
                stats["employees"] = sync_employees(bito, conn, dry_run, log)
            if not dry_run:
                conn.commit()
        except Exception as e:
            conn.rollback()
            status = "error"
            error = repr(e)
            log.append(f"ERROR: {e!r}")
            raise
        finally:
            elapsed = time.time() - t0
            log.append(f"=== done in {elapsed:.1f}s, status={status} ===")
            try:
                record_run(conn, dry_run, log, stats, status, error)
                if not dry_run:
                    conn.commit()
            except Exception:
                pass

    out = {
        "dry_run": dry_run,
        "status": status,
        "elapsed_seconds": round(elapsed, 1),
        "log": log,
        "stats": stats,
        "error": error,
    }
    if args.report_out:
        Path(args.report_out).write_text(json.dumps(out, ensure_ascii=False, indent=2, default=str))

    print("\n".join(log))


if __name__ == "__main__":
    main()
