"""Bito ERP -> Supabase: incremental stock + price sync.

Runs in seconds against products that are *already linked* (have bitoProductId).
Designed to be invoked from a cron (Render Cron Job, GitHub Actions cron, ...).

Updates only:
  - products.stockQuantity         (sum of _warehouses[*].amount)
  - products.inStock               (true if total > 0, else false)
  - products.price                 (UZS narxi)
  - product_warehouse_stocks       (UPSERT amount/booked/inTransit/inTrash)
  - product_colors.stockQuantity   (sum for variant A linked colors)
  - product_colors.inStock         (boolean)

Does NOT:
  - Create new products / colors / categories / warehouses
  - Touch nameRu / nameUz / slug / descriptionRu / descriptionUz / images
  - Sync customers / employees (use sync.py for that)

Env (required):
    BITO_BASE_URL, BITO_API_KEY, BITO_PRICE_ID, SUPABASE_DSN (or DATABASE_URL)
"""
from __future__ import annotations

import os
import secrets
import string
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import psycopg2
import psycopg2.extras

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bito_client import BitoClient  # noqa: E402


_ALPHABET = string.ascii_lowercase + string.digits


def _gen_id() -> str:
    """Cuid-like id (matches Prisma's @default(cuid()))."""
    rand = "".join(secrets.choice(_ALPHABET) for _ in range(24))
    return f"c{rand}"


def fetch_bito_prices(client: BitoClient) -> Dict[str, int]:
    """Returns {bitoProductId: priceUZS}."""
    price_id = os.environ.get("BITO_PRICE_ID", "6706187e485b322ea8c90155")
    items = client.price_items(price_id)
    out: Dict[str, int] = {}
    for it in items:
        # Bito returns either product_id at top level OR a nested product._id
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


def main() -> int:
    started = time.time()
    dsn = os.environ.get("SUPABASE_DSN") or os.environ.get("DATABASE_URL")
    if not dsn:
        print("FATAL: SUPABASE_DSN or DATABASE_URL must be set", file=sys.stderr)
        return 2

    bito = BitoClient()

    print(f"[{datetime.now(timezone.utc).isoformat()}] sync_stock starting", flush=True)
    bito_products = bito.products()
    print(f"  bito products fetched: {len(bito_products)}", flush=True)
    prices_by_bito = fetch_bito_prices(bito)
    print(f"  bito prices fetched:   {len(prices_by_bito)}", flush=True)

    bito_by_id: Dict[str, Dict[str, Any]] = {p["_id"]: p for p in bito_products if p.get("_id")}

    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    started_at = datetime.fromtimestamp(started, timezone.utc)

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute('SELECT id, "bitoId" FROM bito_warehouses')
            wh_index: Dict[str, str] = {r["bitoId"]: r["id"] for r in cur.fetchall()}
            cur.execute(
                'SELECT id, "bitoProductId", price, "stockQuantity", "inStock" FROM products WHERE "bitoProductId" IS NOT NULL'
            )
            products = [dict(r) for r in cur.fetchall()]
            cur.execute(
                'SELECT id, "productId", "bitoProductId", "stockQuantity", "inStock" FROM product_colors WHERE "bitoProductId" IS NOT NULL'
            )
            colors = [dict(r) for r in cur.fetchall()]

        print(
            f"  supabase rows: {len(products)} products, {len(colors)} colors, {len(wh_index)} warehouses",
            flush=True,
        )

        now = datetime.now(timezone.utc)

        # Build batches. Warehouse upserts are keyed by (bito_product_id, warehouse_id)
        # to dedupe — variant A products may have BOTH a product and a color row
        # pointing to the same Bito product, which would violate the unique
        # constraint inside a single ON CONFLICT batch.
        product_update_rows: List[Tuple[Any, ...]] = []
        color_update_rows: List[Tuple[Any, ...]] = []
        wh_upsert_map: Dict[Tuple[str, str], Tuple[Any, ...]] = {}
        per_product_total: Dict[str, int] = {}

        for p in products:
            bid = p["bitoProductId"]
            src = bito_by_id.get(bid)
            if not src:
                continue
            whs: Dict[str, Dict[str, int]] = src.get("_warehouses") or {}
            total = sum(int((w or {}).get("amount") or 0) for w in whs.values())
            in_stock = total > 0
            price = prices_by_bito.get(bid)
            new_price = price if price is not None else p.get("price")
            # Only emit update if anything changed.
            if (
                p.get("stockQuantity") != total
                or bool(p.get("inStock")) != in_stock
                or (price is not None and p.get("price") != price)
            ):
                product_update_rows.append((p["id"], total, in_stock, new_price, now))
            per_product_total[p["id"]] = total
            for w_bito_id, w in whs.items():
                wh_supa_id = wh_index.get(w_bito_id)
                if not wh_supa_id:
                    continue
                wh_upsert_map[(bid, wh_supa_id)] = (
                    _gen_id(),
                    p["id"],
                    None,  # colorId
                    wh_supa_id,
                    bid,
                    int((w or {}).get("amount") or 0),
                    int((w or {}).get("booked") or 0),
                    int((w or {}).get("in_transit") or 0),
                    int((w or {}).get("in_trash") or 0),
                    now,
                )

        for c in colors:
            bid = c["bitoProductId"]
            src = bito_by_id.get(bid)
            if not src:
                continue
            whs = src.get("_warehouses") or {}
            color_total = sum(int((w or {}).get("amount") or 0) for w in whs.values())
            color_in_stock = color_total > 0
            if c.get("stockQuantity") != color_total or bool(c.get("inStock")) != color_in_stock:
                color_update_rows.append((c["id"], color_total, color_in_stock))
            per_product_total[c["productId"]] = (
                per_product_total.get(c["productId"], 0) + color_total
            )
            for w_bito_id, w in whs.items():
                wh_supa_id = wh_index.get(w_bito_id)
                if not wh_supa_id:
                    continue
                # Color rows take priority over product rows for the same (bid, wh)
                # because Variant A keeps colorId set on the canonical row.
                wh_upsert_map[(bid, wh_supa_id)] = (
                    _gen_id(),
                    c["productId"],
                    c["id"],
                    wh_supa_id,
                    bid,
                    int((w or {}).get("amount") or 0),
                    int((w or {}).get("booked") or 0),
                    int((w or {}).get("in_transit") or 0),
                    int((w or {}).get("in_trash") or 0),
                    now,
                )

        # Roll up parent products that have only color-level Bito links.
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.id, p.price, p."stockQuantity", p."inStock"
                FROM products p
                WHERE p."bitoProductId" IS NULL
                  AND EXISTS (SELECT 1 FROM product_colors c WHERE c."productId" = p.id AND c."bitoProductId" IS NOT NULL)
                """
            )
            parent_only = [dict(r) for r in cur.fetchall()]
        for r in parent_only:
            pid = r["id"]
            total = per_product_total.get(pid, 0)
            in_stock = total > 0
            if r.get("stockQuantity") != total or bool(r.get("inStock")) != in_stock:
                product_update_rows.append((pid, total, in_stock, r.get("price"), now))

        # --- batch UPDATE products ---
        with conn.cursor() as cur:
            if product_update_rows:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    UPDATE products AS p SET
                        "stockQuantity" = u.qty,
                        "inStock"       = u.in_stock,
                        price           = u.price,
                        "updatedAt"     = u.now
                    FROM (VALUES %s) AS u(id, qty, in_stock, price, now)
                    WHERE p.id = u.id
                    """,
                    product_update_rows,
                    template="(%s, %s::int, %s::bool, %s::int, %s::timestamptz)",
                    page_size=500,
                )
            if color_update_rows:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    UPDATE product_colors AS c SET
                        "stockQuantity" = u.qty,
                        "inStock"       = u.in_stock
                    FROM (VALUES %s) AS u(id, qty, in_stock)
                    WHERE c.id = u.id
                    """,
                    color_update_rows,
                    template="(%s, %s::int, %s::bool)",
                    page_size=500,
                )
            wh_upsert_rows = list(wh_upsert_map.values())
            if wh_upsert_rows:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO product_warehouse_stocks (
                        id, "productId", "colorId", "warehouseId", "bitoProductId",
                        amount, booked, "inTransit", "inTrash", "updatedAt"
                    )
                    VALUES %s
                    ON CONFLICT ("bitoProductId", "warehouseId") DO UPDATE SET
                        amount      = EXCLUDED.amount,
                        booked      = EXCLUDED.booked,
                        "inTransit" = EXCLUDED."inTransit",
                        "inTrash"   = EXCLUDED."inTrash",
                        "updatedAt" = EXCLUDED."updatedAt"
                    """,
                    wh_upsert_rows,
                    page_size=500,
                )

            duration = round(time.time() - started, 2)
            stats = {
                "kind": "stock-cron",
                "duration_sec": duration,
                "bito_products": len(bito_products),
                "supabase_products_linked": len(products),
                "supabase_colors_linked": len(colors),
                "products_updated": len(product_update_rows),
                "colors_updated": len(color_update_rows),
                "warehouse_upserts": len(wh_upsert_rows),
            }
            cur.execute(
                """
                INSERT INTO bito_sync_runs (id, "startedAt", "finishedAt", status, "dryRun", stats)
                VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                """,
                (
                    _gen_id(),
                    started_at,
                    datetime.now(timezone.utc),
                    "ok",
                    False,
                    psycopg2.extras.Json(stats),
                ),
            )

        conn.commit()
        print(
            f"  done in {duration}s | products updated: {len(product_update_rows)} | "
            f"colors updated: {len(color_update_rows)} | wh upserts: {len(wh_upsert_rows)}",
            flush=True,
        )
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"FATAL: {type(exc).__name__}: {exc}", file=sys.stderr, flush=True)
        try:
            with psycopg2.connect(dsn) as c2, c2.cursor() as cc:
                cc.execute(
                    """
                    INSERT INTO bito_sync_runs (id, "startedAt", "finishedAt", status, "dryRun", stats, "errorLog")
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s)
                    """,
                    (
                        _gen_id(),
                        started_at,
                        datetime.now(timezone.utc),
                        "failed",
                        False,
                        psycopg2.extras.Json({"kind": "stock-cron"}),
                        f"{type(exc).__name__}: {exc}",
                    ),
                )
        except Exception:
            pass
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
