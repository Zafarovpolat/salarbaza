"""Bito ERP -> Supabase one-directional sync (unified).

Replaces the previous sync.py + sync_stock.py split. One script, two modes:

  --mode=incremental  (default, fast ~10-20s, safe to run hourly via cron)
    Phases run: warehouses + categories + products (UPDATE only) + stock + prices.
    Does NOT: create new products / categories / customers / employees.
    Always: keeps categoryId in sync with Bito (so when a manager moves a
    Bito product to a different category, the site reflects it next run).

  --mode=full         (slower ~30s, run once a day or after Bito catalog edits)
    Same as incremental, plus: creates new products for Bito items that have
    no Supabase match; syncs customers + employees.

Both modes write to bito_sync_runs for audit. Both are diff-aware: a UPDATE
is only emitted when at least one value actually changed, so a "no-op" run
makes near-zero load on the Postgres pooler.

Data model assumption (post split-by-color migration, salarbaza#15):
    1 Bito product (`_id`) = 1 Supabase product (`bitoProductId`).
    The product_colors table is empty and no longer maintained by sync.

Env required:
    BITO_BASE_URL, BITO_API_KEY, BITO_PRICE_ID
    SUPABASE_DSN  (or DATABASE_URL)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import string
import sys
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

import psycopg2  # noqa: E402
import psycopg2.extras  # noqa: E402

from bito_client import BitoClient  # noqa: E402
from categories import smart_slug, smart_translate  # noqa: E402
from matching import Matcher  # noqa: E402


# ------------------------- helpers -------------------------


_CUID_ALPHABET = string.ascii_lowercase + string.digits


def cuid() -> str:
    """Cuid-like id (matches Prisma's @default(cuid()))."""
    return "c" + "".join(secrets.choice(_CUID_ALPHABET) for _ in range(24))


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


@contextmanager
def db_connect(dsn: str, statement_timeout_ms: int = 30000):
    """Open a psycopg2 connection with a hard statement_timeout.

    The timeout protects the Supabase pooler from a single sync hanging on a
    slow query and blocking real user traffic. 30s is plenty for any single
    statement we emit (largest is the COPY of warehouse stocks, ~7K rows).
    """
    conn = psycopg2.connect(dsn, connect_timeout=15)
    try:
        with conn.cursor() as cur:
            cur.execute("SET statement_timeout = %s", (statement_timeout_ms,))
        conn.commit()
        yield conn
    finally:
        try:
            conn.close()
        except Exception:
            pass


# ------------------------- bito helpers -------------------------


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
        amount = int((w or {}).get("amount") or 0)
        booked = int((w or {}).get("booked") or 0)
        in_transit = int((w or {}).get("in_transit") or 0)
        in_trash = int((w or {}).get("in_trash") or 0)
        wmap[wid] = {
            "amount": amount,
            "booked": booked,
            "in_transit": in_transit,
            "in_trash": in_trash,
        }
        total += amount
    return total, wmap


def fetch_bito_prices(client: BitoClient) -> Dict[str, int]:
    """Returns {bitoProductId: priceUZS}."""
    price_id = os.environ.get("BITO_PRICE_ID", "6706187e485b322ea8c90155")
    items = client.price_items(price_id)
    out: Dict[str, int] = {}
    for it in items:
        bid = (
            it.get("product_id")
            or it.get("productId")
            or (it.get("product") or {}).get("_id")
        )
        val = it.get("amount") or it.get("price") or it.get("value")
        if not bid or val is None:
            continue
        try:
            out[bid] = int(round(float(val)))
        except (TypeError, ValueError):
            continue
    return out


# ------------------------- phase 1: warehouses -------------------------


def sync_warehouses(client: BitoClient, conn, dry_run: bool, log: List[str]) -> Dict[str, str]:
    """Returns: {bito_warehouse_id: supabase_warehouse_id}."""
    bito_whs = client.warehouses()
    log.append(f"[warehouses] fetched {len(bito_whs)} from Bito")

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute('SELECT id, "bitoId", name, code, "isMain", "isDefault" FROM bito_warehouses')
        existing = [dict(r) for r in cur.fetchall()]
    existing_by_bito = {w["bitoId"]: w for w in existing}

    bito_to_supa: Dict[str, str] = {}
    inserts, updates = 0, 0
    now = datetime.now(timezone.utc)

    with conn.cursor() as cur:
        for w in bito_whs:
            bid = w["_id"]
            name = w.get("name", "") or ""
            code = w.get("code")
            is_main = bool(w.get("is_main"))
            is_default = bool(w.get("is_default"))
            row = existing_by_bito.get(bid)
            if row:
                bito_to_supa[bid] = row["id"]
                if (
                    row.get("name") != name
                    or row.get("code") != code
                    or bool(row.get("isMain")) != is_main
                    or bool(row.get("isDefault")) != is_default
                ):
                    updates += 1
                    if not dry_run:
                        cur.execute(
                            """UPDATE bito_warehouses
                               SET name=%s, code=%s, "isMain"=%s, "isDefault"=%s, "updatedAt"=%s
                               WHERE "bitoId"=%s""",
                            (name, code, is_main, is_default, now, bid),
                        )
            else:
                new_id = cuid()
                bito_to_supa[bid] = new_id
                inserts += 1
                if not dry_run:
                    cur.execute(
                        """INSERT INTO bito_warehouses
                            (id, "bitoId", name, code, "isMain", "isDefault", "isActive", "sortOrder", "createdAt", "updatedAt")
                           VALUES (%s, %s, %s, %s, %s, %s, true, 0, %s, %s)""",
                        (new_id, bid, name, code, is_main, is_default, now, now),
                    )

    log.append(f"[warehouses] {inserts} new, {updates} updated (dry_run={dry_run})")
    return bito_to_supa


# ------------------------- phase 2: categories -------------------------


def sync_categories(
    client: BitoClient,
    conn,
    dry_run: bool,
    log: List[str],
    create_new: bool = True,
) -> Dict[str, str]:
    """Returns: {bito_category_id: supabase_category_id}.

    In incremental mode (`create_new=False`) we only refresh the
    name/parent links of categories that already exist, so a renamed Bito
    category propagates to the site without risk of creating duplicate empty
    categories. New Bito categories appear once a `--mode=full` run lands.
    """
    bito_cats = client.categories()
    log.append(f"[categories] fetched {len(bito_cats)} from Bito")

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """SELECT id, slug, "nameRu", "nameUz", "bitoCategoryId", "bitoParentId"
               FROM categories"""
        )
        existing = [dict(r) for r in cur.fetchall()]
    existing_by_bito = {c["bitoCategoryId"]: c for c in existing if c.get("bitoCategoryId")}
    existing_by_slug = {c["slug"]: c for c in existing}
    used_slugs = set(existing_by_slug.keys())

    bito_to_supa: Dict[str, str] = {}
    inserts, updates = 0, 0
    now = datetime.now(timezone.utc)

    with conn.cursor() as cur:
        for cat in bito_cats:
            bid = cat["_id"]
            name_uz_source = cat.get("name") or ""
            ru, uz = smart_translate(name_uz_source)
            parent_bid = cat.get("parent_id") or None

            row = existing_by_bito.get(bid)
            if row:
                bito_to_supa[bid] = row["id"]
                # Diff-only update
                if (
                    row.get("nameRu") != ru
                    or row.get("nameUz") != uz
                    or (row.get("bitoParentId") or None) != parent_bid
                ):
                    updates += 1
                    if not dry_run:
                        cur.execute(
                            """UPDATE categories
                               SET "nameRu"=%s, "nameUz"=%s, "bitoParentId"=%s, "updatedAt"=%s
                               WHERE "bitoCategoryId"=%s""",
                            (ru, uz, parent_bid, now, bid),
                        )
            elif create_new:
                slug = smart_slug(name_uz_source, bid)
                base_slug = slug
                i = 1
                while slug in used_slugs:
                    i += 1
                    slug = f"{base_slug}-{i}"
                used_slugs.add(slug)
                new_id = cuid()
                bito_to_supa[bid] = new_id
                inserts += 1
                if not dry_run:
                    cur.execute(
                        """INSERT INTO categories
                            (id, slug, "nameRu", "nameUz", "sortOrder", "isActive", "bitoCategoryId", "bitoParentId", "createdAt", "updatedAt")
                           VALUES (%s, %s, %s, %s, 0, true, %s, %s, %s, %s)""",
                        (new_id, slug, ru, uz, bid, parent_bid, now, now),
                    )

    log.append(f"[categories] {inserts} new, {updates} updated (dry_run={dry_run}, create_new={create_new})")
    return bito_to_supa


# ------------------------- phase 3: products -------------------------


def fetch_supabase_products(cur) -> List[Dict[str, Any]]:
    cur.execute(
        """
        SELECT id, code, slug, "nameRu", "nameUz", "categoryId", price, "stockQuantity",
               "inStock", "bitoProductId", "bitoSku", "bitoNumber"
        FROM products
        """
    )
    return [dict(r) for r in cur.fetchall()]


def sync_products(
    client: BitoClient,
    conn,
    dry_run: bool,
    log: List[str],
    *,
    mode: str,                       # "full" or "incremental"
    wh_map: Dict[str, str],
    cat_map: Dict[str, str],
    skip_prices: bool = False,
    skip_stock: bool = False,
) -> Dict[str, Any]:
    """Sync Bito products into Supabase. 1 Bito SKU = 1 Supabase product.

    Matching priority (per Bito product):
        1. products.bitoProductId == bito._id          (strongest)
        2. products.bitoSku       == bito.sku          (re-link)
    Anything still unmatched after both is "new" — created only in full mode.

    Update set (every matched product, every run):
        bitoProductId, bitoSku, bitoNumber,
        stockQuantity, inStock, price (if Bito has one),
        categoryId   ← NEW: keeps Supabase category in sync with Bito moves.

    Curated fields (nameRu/nameUz/slug/descriptions/images/isFeatured/isNew/
    viewCount/isActive) are never overwritten.
    """
    bito_products = client.products()
    log.append(f"[products] fetched {len(bito_products)} from Bito")

    price_items: Dict[str, Dict[str, Any]] = {}
    if not skip_prices:
        price_id = os.environ.get("BITO_PRICE_ID", "6706187e485b322ea8c90155")
        try:
            for it in client.price_items(price_id):
                pid = it.get("product_id") or (it.get("product") or {}).get("_id")
                if pid:
                    price_items[pid] = it
        except Exception as e:
            log.append(f"[prices] WARNING: failed to fetch price items: {e}")
    log.append(f"[prices] indexed {len(price_items)} price entries")

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        supa_products = fetch_supabase_products(cur)

    by_bito_pid = {p["bitoProductId"]: p for p in supa_products if p.get("bitoProductId")}
    by_bito_sku = {p["bitoSku"]: p for p in supa_products if p.get("bitoSku") and not p.get("bitoProductId")}
    matcher = Matcher(supa_products) if mode == "full" else None
    used_supa_ids: Set[str] = set()
    used_slugs = {p["slug"] for p in supa_products if p.get("slug")}
    used_codes = {p["code"] for p in supa_products if p.get("code")}

    plan: Dict[str, Any] = {
        "bito_total": len(bito_products),
        "matched_by_pid": 0,
        "matched_by_sku": 0,
        "matched_by_name": 0,
        "updated": 0,
        "category_moved": 0,
        "created": 0,
        "skipped_unmatched": 0,
        "stock_rows": 0,
        "warnings": [],
    }
    samples_matched: List[str] = []
    samples_new: List[str] = []
    samples_moved: List[str] = []

    now = datetime.now(timezone.utc)

    # ---- prepare batched UPDATE rows for products ----
    # We collect all per-product diffs then emit a single execute_values per
    # column-set so a 1927-row sync emits 1-3 batched UPDATEs, not 1927 single
    # statements (much friendlier to the Supabase pooler).
    update_rows: List[Tuple[Any, ...]] = []

    # ---- prepare batched UPSERT rows for warehouse stocks ----
    wh_upsert_rows: List[Tuple[Any, ...]] = []

    # ---- prepare INSERT rows for new products (full mode) ----
    insert_rows: List[Tuple[Any, ...]] = []

    def resolve_category_supa_id(bp: Dict[str, Any]) -> Optional[str]:
        cat_bito = bp.get("category")
        if not (cat_bito and isinstance(cat_bito, dict)):
            return None
        cat_bid = cat_bito.get("_id")
        if not cat_bid:
            return None
        return cat_map.get(cat_bid)

    for bp in bito_products:
        bito_id = bp["_id"]
        bito_sku = bp.get("sku")
        bito_number = bp.get("number")
        total_stock, wmap = sum_stock(bp)
        in_stock = total_stock > 0
        price = pick_price_for_product(price_items, bito_id) if not skip_prices else None
        new_cat = resolve_category_supa_id(bp)

        # ---- find the supabase row ----
        supa = by_bito_pid.get(bito_id)
        if supa:
            plan["matched_by_pid"] += 1
        else:
            supa = by_bito_sku.get(bito_sku) if bito_sku else None
            if supa:
                plan["matched_by_sku"] += 1

        if supa and supa["id"] in used_supa_ids:
            # Two Bito products fighting for the same Supabase row.
            # Skip the loser (we already linked the winner). Should be rare
            # after the split-by-color migration; log it for visibility.
            plan["warnings"].append(
                f"duplicate-link: bito={bito_id} ({bp.get('name')}) wants supa={supa['id']} (already taken)"
            )
            plan["skipped_unmatched"] += 1
            continue

        if supa is None and mode == "full":
            # Fall back to name-based fuzzy match (used to be Phase B).
            candidates = [bp.get("name") or ""]
            if bito_number:
                candidates.append(bito_number)
            if bito_sku:
                candidates.append(bito_sku)
            hit = matcher.find(*candidates) if matcher else None
            if hit and hit["id"] not in used_supa_ids:
                supa = hit
                plan["matched_by_name"] += 1

        if supa is None:
            if mode != "full":
                plan["skipped_unmatched"] += 1
                continue
            # Create new Supabase product (full mode only).
            base_code = bp.get("name") or bito_sku or bito_id
            code = base_code
            i = 2
            while code in used_codes:
                code = f"{base_code}-{i}"
                i += 1
            used_codes.add(code)
            slug = slugify(code, suffix=bito_id[-6:])
            while slug in used_slugs:
                slug = slugify(code, suffix=uuid.uuid4().hex[:6])
            used_slugs.add(slug)
            new_id = cuid()
            insert_rows.append(
                (
                    new_id, code, slug, code, code, new_cat,
                    price or 0, in_stock, total_stock,
                    bito_id, bito_sku, bito_number,
                    now, now,
                )
            )
            plan["created"] += 1
            samples_new.append(f"NEW: bito={bp.get('name')!r} -> code={code} cat={new_cat}")
            # Stage stock rows for the new product as well.
            for wh_bid, vals in wmap.items():
                wh_supa_id = wh_map.get(wh_bid)
                if not wh_supa_id:
                    continue
                wh_upsert_rows.append(
                    (
                        cuid(), new_id, wh_supa_id, bito_id,
                        vals["amount"], vals["booked"],
                        vals["in_transit"], vals["in_trash"], now,
                    )
                )
                plan["stock_rows"] += 1
            continue

        # ---- matched: stage diff-only UPDATE ----
        used_supa_ids.add(supa["id"])

        cur_price = supa.get("price")
        new_price = price if (price is not None and price > 0) else cur_price

        changed = (
            (supa.get("bitoProductId") or None) != bito_id
            or (supa.get("bitoSku") or None) != bito_sku
            or (supa.get("bitoNumber") or None) != bito_number
            or int(supa.get("stockQuantity") or 0) != total_stock
            or bool(supa.get("inStock")) != in_stock
            or (new_price is not None and int(supa.get("price") or 0) != int(new_price))
            or (new_cat is not None and (supa.get("categoryId") or None) != new_cat)
        )
        moved = new_cat is not None and (supa.get("categoryId") or None) != new_cat
        if moved:
            plan["category_moved"] += 1
            samples_moved.append(
                f"{supa.get('code')!r} ({supa['id'][:8]}…): {supa.get('categoryId')} -> {new_cat}"
            )

        if changed:
            plan["updated"] += 1
            samples_matched.append(
                f"UPD: bito={bp.get('name')!r} -> supa={supa.get('code')} stock={total_stock} price={new_price}"
            )
            update_rows.append(
                (
                    supa["id"],
                    bito_id,
                    bito_sku,
                    bito_number,
                    total_stock,
                    in_stock,
                    int(new_price) if new_price is not None else None,
                    new_cat if new_cat is not None else supa.get("categoryId"),
                    now,
                )
            )

        if not skip_stock:
            for wh_bid, vals in wmap.items():
                wh_supa_id = wh_map.get(wh_bid)
                if not wh_supa_id:
                    plan["warnings"].append(f"unknown warehouse {wh_bid} for {bp.get('name', '?')}")
                    continue
                wh_upsert_rows.append(
                    (
                        cuid(), supa["id"], wh_supa_id, bito_id,
                        vals["amount"], vals["booked"],
                        vals["in_transit"], vals["in_trash"], now,
                    )
                )
                plan["stock_rows"] += 1

    # ---- execute batched writes ----
    if not dry_run:
        with conn.cursor() as cur:
            if update_rows:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    UPDATE products AS p SET
                        "bitoProductId" = u.bito_pid,
                        "bitoSku"       = u.bito_sku,
                        "bitoNumber"    = u.bito_number,
                        "stockQuantity" = u.qty,
                        "inStock"       = u.in_stock,
                        price           = COALESCE(u.price, p.price),
                        "categoryId"    = u.cat_id,
                        "updatedAt"     = u.now
                    FROM (VALUES %s) AS u(id, bito_pid, bito_sku, bito_number, qty, in_stock, price, cat_id, now)
                    WHERE p.id = u.id
                    """,
                    update_rows,
                    template="(%s, %s, %s, %s, %s::int, %s::bool, %s::int, %s, %s::timestamptz)",
                    page_size=500,
                )
            if insert_rows:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO products (
                        id, code, slug, "nameRu", "nameUz", "categoryId",
                        price, "inStock", "stockQuantity", "setQuantity",
                        "isActive", "isFeatured", "isNew", "viewCount",
                        "bitoProductId", "bitoSku", "bitoNumber",
                        "createdAt", "updatedAt"
                    ) VALUES %s
                    """,
                    insert_rows,
                    template=(
                        "(%s, %s, %s, %s, %s, %s, "
                        "%s, %s, %s, 1, "
                        "true, false, false, 0, "
                        "%s, %s, %s, "
                        "%s, %s)"
                    ),
                    page_size=200,
                )
            if wh_upsert_rows and not skip_stock:
                # Dedupe by (bitoProductId, warehouseId) keeping the last row
                # — execute_values would otherwise error on duplicates inside
                # the single statement.
                seen: Dict[Tuple[str, str], Tuple[Any, ...]] = {}
                for row in wh_upsert_rows:
                    seen[(row[3], row[2])] = row
                rows = list(seen.values())
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO product_warehouse_stocks
                        (id, "productId", "warehouseId", "bitoProductId",
                         amount, booked, "inTransit", "inTrash", "updatedAt")
                    VALUES %s
                    ON CONFLICT ("bitoProductId", "warehouseId") DO UPDATE
                      SET amount      = EXCLUDED.amount,
                          booked      = EXCLUDED.booked,
                          "inTransit" = EXCLUDED."inTransit",
                          "inTrash"   = EXCLUDED."inTrash",
                          "productId" = EXCLUDED."productId",
                          "updatedAt" = EXCLUDED."updatedAt"
                    """,
                    rows,
                    template="(%s, %s, %s, %s, %s::int, %s::int, %s::int, %s::int, %s::timestamptz)",
                    page_size=500,
                )

    log.append(
        f"[products] mode={mode} matched_pid={plan['matched_by_pid']} "
        f"matched_sku={plan['matched_by_sku']} matched_name={plan['matched_by_name']} "
        f"updated={plan['updated']} category_moved={plan['category_moved']} "
        f"created={plan['created']} skipped={plan['skipped_unmatched']} "
        f"stock_rows={plan['stock_rows']} (dry_run={dry_run})"
    )
    return {
        "plan": plan,
        "samples_matched": samples_matched[:20],
        "samples_new": samples_new[:20],
        "samples_moved": samples_moved[:20],
    }


# ------------------------- phase 6: customers (full only) -------------------------


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
            bc = c.get("balance_currency")
            balance_currency = bc.get("name") if isinstance(bc, dict) else bc
            ct = c.get("type") or c.get("customer_type")
            ctype = ct.get("name") if isinstance(ct, dict) else ct
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
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s,
                                  %s, %s,
                                  %s, %s, %s, %s, %s,
                                  true, %s, %s, %s,
                                  %s, %s)""",
                        (
                            cuid(), bid, str(ctype) if ctype else None, name, phone,
                            psycopg2.extras.Json(extras), card, cat, resp,
                            total_sale, avg_sale, point, balance, balance_currency,
                            psycopg2.extras.Json(c), bito_created, bito_updated, now, now,
                        ),
                    )
    log.append(f"[customers] {inserts} new, {updates} updated (dry_run={dry_run})")
    return {"inserts": inserts, "updates": updates}


# ------------------------- phase 7: employees (full only) -------------------------


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
                           ) VALUES (%s, %s, %s, %s, %s,
                                     %s, %s, %s, %s,
                                     true, %s, %s, %s,
                                     %s, %s)""",
                        (cuid(), bid, full_name, phone, number,
                         position_id, position_name, role_id, role_name,
                         psycopg2.extras.Json(e), bito_created, bito_updated, now, now),
                    )
    log.append(f"[employees] {inserts} new, {updates} updated (dry_run={dry_run})")
    return {"inserts": inserts, "updates": updates}


# ------------------------- audit -------------------------


def record_run(conn, dry_run: bool, log: List[str], stats: Dict[str, Any], status: str, error: Optional[str], mode: str) -> None:
    if dry_run:
        return
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO bito_sync_runs
                (id, "startedAt", "finishedAt", status, "dryRun", stats, "errorLog")
               VALUES (%s, NOW(), NOW(), %s, %s, %s, %s)""",
            (
                cuid(),
                status,
                dry_run,
                psycopg2.extras.Json({"mode": mode, "log": log, "stats": stats}),
                error,
            ),
        )


# ------------------------- main -------------------------


def _is_supabase_tenant_missing(err: Exception) -> bool:
    """Detect the case where the whole Supabase project is paused/deleted.

    The pooler returns "Tenant or user not found" instead of a normal connect
    failure. We treat this as a soft skip — record nothing, exit 0 — so cron
    doesn't spam failure emails while the user restores the project.
    """
    msg = str(err)
    return "Tenant or user not found" in msg or "NXDOMAIN" in msg


def main() -> int:
    parser = argparse.ArgumentParser(description="Bito -> Supabase sync (unified)")
    parser.add_argument(
        "--mode", choices=["full", "incremental"], default="incremental",
        help="incremental (default): UPDATE-only, safe for hourly cron. "
             "full: also creates new products + syncs customers/employees.",
    )
    parser.add_argument("--apply", action="store_true",
                        help="Apply changes (default is dry-run)")
    parser.add_argument("--skip-warehouses", action="store_true")
    parser.add_argument("--skip-categories", action="store_true")
    parser.add_argument("--skip-products", action="store_true")
    parser.add_argument("--skip-stock", action="store_true")
    parser.add_argument("--skip-prices", action="store_true")
    parser.add_argument("--skip-customers", action="store_true")
    parser.add_argument("--skip-employees", action="store_true")
    parser.add_argument("--statement-timeout", type=int, default=30000,
                        help="Postgres statement_timeout in ms (default 30s)")
    parser.add_argument("--report-out", default=None,
                        help="Path to write JSON report (default: stdout summary only)")
    args = parser.parse_args()

    dry_run = not args.apply
    dsn = os.environ.get("SUPABASE_DSN") or os.environ.get("DATABASE_URL")
    if not dsn:
        print("FATAL: SUPABASE_DSN or DATABASE_URL must be set", file=sys.stderr)
        return 2

    bito = BitoClient()

    log: List[str] = []
    stats: Dict[str, Any] = {"mode": args.mode}
    error: Optional[str] = None
    status = "ok"

    log.append(f"=== Bito sync start (mode={args.mode} dry_run={dry_run}) ===")
    t0 = time.time()

    try:
        conn_ctx = db_connect(dsn, statement_timeout_ms=args.statement_timeout)
    except psycopg2.OperationalError as e:
        if _is_supabase_tenant_missing(e):
            print(f"[skip] Supabase project unreachable ({e}). Exiting 0.", file=sys.stderr)
            return 0
        raise

    with conn_ctx as conn:
        conn.autocommit = False
        try:
            wh_map: Dict[str, str] = {}
            if not args.skip_warehouses:
                wh_map = sync_warehouses(bito, conn, dry_run, log)
                stats["warehouses"] = {"count": len(wh_map)}
            else:
                with conn.cursor() as cur:
                    cur.execute('SELECT "bitoId", id FROM bito_warehouses')
                    wh_map = {r[0]: r[1] for r in cur.fetchall()}

            cat_map: Dict[str, str] = {}
            if not args.skip_categories:
                cat_map = sync_categories(
                    bito, conn, dry_run, log,
                    create_new=(args.mode == "full"),
                )
                stats["categories"] = {"count": len(cat_map)}
            else:
                with conn.cursor() as cur:
                    cur.execute('SELECT "bitoCategoryId", id FROM categories WHERE "bitoCategoryId" IS NOT NULL')
                    cat_map = {r[0]: r[1] for r in cur.fetchall()}

            if not args.skip_products:
                stats["products"] = sync_products(
                    bito, conn, dry_run, log,
                    mode=args.mode,
                    wh_map=wh_map, cat_map=cat_map,
                    skip_prices=args.skip_prices, skip_stock=args.skip_stock,
                )

            if args.mode == "full":
                if not args.skip_customers:
                    stats["customers"] = sync_customers(bito, conn, dry_run, log)
                if not args.skip_employees:
                    stats["employees"] = sync_employees(bito, conn, dry_run, log)

            elapsed = time.time() - t0
            log.append(f"=== finished in {elapsed:.1f}s status={status} ===")
            record_run(conn, dry_run, log, stats, status, None, args.mode)
            if not dry_run:
                conn.commit()
        except Exception as exc:
            conn.rollback()
            status = "error"
            error = repr(exc)
            elapsed = time.time() - t0
            log.append(f"=== FAILED after {elapsed:.1f}s: {error} ===")
            try:
                # Open a fresh transaction to record the failure (the previous
                # one is poisoned by the exception).
                record_run(conn, dry_run, log, stats, status, error, args.mode)
                if not dry_run:
                    conn.commit()
            except Exception:
                pass
            for line in log:
                print(line)
            return 1

    for line in log:
        print(line)

    if args.report_out:
        Path(args.report_out).write_text(
            json.dumps({"status": status, "stats": stats, "log": log}, indent=2, default=str)
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
