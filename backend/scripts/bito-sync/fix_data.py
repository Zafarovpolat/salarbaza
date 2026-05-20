"""Fix Supabase data: product codes and product_colors.bitoSku.

Problems:
  1. products.code has dedup suffixes (-2, -3) from sync.py collision avoidance.
     E.g. "C-6-2" should be "C-6", "B-28-2" should be "B-28".
  2. product_colors.bitoSku stores just the numeric Bito article (e.g. "8250")
     instead of the full SKU format "8250-C-6-white" that includes root+color.

Solution:
  - Fetch all products from Bito API to get their _id, name, sku
  - For each product_colors row with a bitoProductId, look up the Bito product
    and overwrite bitoSku with the proper value from Bito (field "sku")
  - For products.code with dedup suffix, derive the correct root from Bito
    product names via grouping logic, and UPDATE if no conflict.

Run:
    cd backend/scripts/bito-sync
    python fix_data.py --dry-run     # preview changes
    python fix_data.py --apply       # execute

Env required (same as sync.py):
    BITO_BASE_URL  (default: https://api.bito.uz)
    BITO_API_KEY
    SUPABASE_DSN
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

import psycopg2
import psycopg2.extras

from bito_client import BitoClient
from grouping import normalize_root, split_root_color


def title_case_root(root_norm: str) -> str:
    """Pretty-print a normalized root (e.g. `b-1` -> `B-1`)."""
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


def main():
    parser = argparse.ArgumentParser(description="Fix Supabase product data")
    parser.add_argument("--apply", action="store_true", help="Apply changes (default: dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes only")
    args = parser.parse_args()
    dry_run = not args.apply

    if dry_run:
        print("=== DRY RUN MODE (use --apply to execute) ===\n")
    else:
        print("=== APPLYING CHANGES ===\n")

    # --- Connect to Bito ---
    os.environ.setdefault("BITO_BASE_URL", "https://api.bito.uz")
    client = BitoClient()
    print("Fetching products from Bito API...")
    bito_products = client.products()
    print(f"  Fetched {len(bito_products)} Bito products\n")

    # Index by _id
    bito_by_id: Dict[str, Dict[str, Any]] = {p["_id"]: p for p in bito_products}

    # --- Connect to Supabase ---
    dsn = os.environ.get("SUPABASE_DSN")
    if not dsn:
        print("ERROR: SUPABASE_DSN not set")
        sys.exit(1)

    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    # === PHASE 1: Fix product_colors.bitoSku ===
    print("--- PHASE 1: Fix product_colors.bitoSku ---")
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, "productId", "bitoProductId", "bitoSku", "nameRu"
            FROM product_colors
            WHERE "bitoProductId" IS NOT NULL
        """)
        colors = cur.fetchall()

    sku_updates: List[Tuple[str, str, str]] = []  # (new_sku, old_sku, color_id)
    for c in colors:
        bito_pid = c["bitoProductId"]
        current_sku = c["bitoSku"] or ""
        bito_p = bito_by_id.get(bito_pid)
        if not bito_p:
            continue
        correct_sku = bito_p.get("sku") or ""
        if not correct_sku:
            continue
        # Only fix if current sku differs and is purely numeric or empty
        if current_sku == correct_sku:
            continue
        # If current sku already has letters (already correct format), skip
        if current_sku and re.search(r"[a-zA-Z]", current_sku):
            continue
        sku_updates.append((correct_sku, current_sku, c["id"]))

    print(f"  Found {len(sku_updates)} product_colors with numeric/empty bitoSku to fix")
    if sku_updates[:10]:
        print("  Samples:")
        for new_sku, old_sku, cid in sku_updates[:10]:
            print(f"    {old_sku!r:>12} -> {new_sku!r}")

    if not dry_run and sku_updates:
        with conn.cursor() as cur:
            for new_sku, old_sku, cid in sku_updates:
                cur.execute(
                    'UPDATE product_colors SET "bitoSku" = %s WHERE id = %s',
                    (new_sku, cid),
                )
        conn.commit()
        print(f"  Updated {len(sku_updates)} rows\n")
    else:
        print()

    # === PHASE 2: Fix products.code (remove dedup suffixes) ===
    print("--- PHASE 2: Fix products.code (remove dedup -N suffixes) ---")
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, code, "nameRu", "bitoProductId"
            FROM products
            WHERE code ~ '-[0-9]+$'
        """)
        products_with_suffix = cur.fetchall()

        # Get ALL codes for conflict checking
        cur.execute('SELECT code FROM products')
        all_codes: Set[str] = {r["code"].lower() for r in cur.fetchall()}

    code_updates: List[Tuple[str, str, str]] = []  # (new_code, old_code, product_id)
    for p in products_with_suffix:
        old_code = p["code"]
        # Strip trailing -N
        new_code = re.sub(r"-\d+$", "", old_code)

        if new_code == old_code:
            continue

        # Check: is new_code already taken by another product?
        if new_code.lower() in all_codes and new_code.lower() != old_code.lower():
            # Conflict — can't rename
            continue

        # Validate: make sure this code actually LOOKS like a dedup suffix
        # (the original root should match a Bito product group root)
        bito_p = bito_by_id.get(p["bitoProductId"]) if p.get("bitoProductId") else None
        if bito_p:
            root, _ = split_root_color(bito_p.get("name", ""))
            expected_code = title_case_root(normalize_root(root)) if root else ""
            if expected_code.lower() != new_code.lower():
                # The suffix isn't a dedup — it's part of the real code
                continue

        code_updates.append((new_code, old_code, p["id"]))
        # Mark new_code as used
        all_codes.add(new_code.lower())

    print(f"  Found {len(code_updates)} products with dedup suffix to fix")
    if code_updates[:15]:
        print("  Samples:")
        for new_code, old_code, pid in code_updates[:15]:
            print(f"    {old_code!r:>12} -> {new_code!r}")

    if not dry_run and code_updates:
        with conn.cursor() as cur:
            for new_code, old_code, pid in code_updates:
                cur.execute(
                    'UPDATE products SET code = %s WHERE id = %s',
                    (new_code, pid),
                )
        conn.commit()
        print(f"  Updated {len(code_updates)} rows\n")
    else:
        print()

    # === PHASE 3: Also update products.nameRu/nameUz to match new code ===
    print("--- PHASE 3: Fix products.nameRu/nameUz matching old code ---")
    name_updates: List[Tuple[str, str, str]] = []
    if not dry_run:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            for new_code, old_code, pid in code_updates:
                cur.execute(
                    'SELECT "nameRu", "nameUz" FROM products WHERE id = %s',
                    (pid,),
                )
                row = cur.fetchone()
                if row:
                    updates = {}
                    if row["nameRu"] == old_code:
                        updates['"nameRu"'] = new_code
                    if row["nameUz"] == old_code:
                        updates['"nameUz"'] = new_code
                    if updates:
                        set_clause = ", ".join(f"{k} = %s" for k in updates)
                        cur.execute(
                            f"UPDATE products SET {set_clause} WHERE id = %s",
                            (*updates.values(), pid),
                        )
                        name_updates.append((new_code, old_code, pid))
        conn.commit()
        print(f"  Updated {len(name_updates)} product names\n")
    else:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            for new_code, old_code, pid in code_updates:
                cur.execute(
                    'SELECT "nameRu" FROM products WHERE id = %s AND ("nameRu" = %s OR "nameUz" = %s)',
                    (pid, old_code, old_code),
                )
                if cur.fetchone():
                    name_updates.append((new_code, old_code, pid))
        print(f"  Would update {len(name_updates)} product names\n")

    # === Summary ===
    print("=" * 50)
    print("SUMMARY:")
    print(f"  product_colors.bitoSku fixes: {len(sku_updates)}")
    print(f"  products.code fixes:          {len(code_updates)}")
    print(f"  products.name fixes:          {len(name_updates)}")
    if dry_run:
        print("\n  No changes applied. Run with --apply to execute.")
    else:
        print("\n  All changes applied successfully!")

    conn.close()


if __name__ == "__main__":
    main()
