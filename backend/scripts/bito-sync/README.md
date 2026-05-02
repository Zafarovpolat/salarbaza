# Bito ↔ Supabase one-way sync

Pulls warehouses / categories / products / per-warehouse stock / customers /
employees from **Bito ERP** (the source of truth for inventory and pricing) into
the existing **Supabase** Postgres database used by the Telegram Mini App.

## What gets synced

| Bito source                               | Supabase target                                    |
| ----------------------------------------- | -------------------------------------------------- |
| `warehouse/get-all`                       | `bito_warehouses`                                  |
| `category/get-paging`                     | `categories` (smart RU/UZ from Uzbek source name)  |
| `product/get-paging` (1 812 items)        | `products` + `product_colors` (variant A grouping) |
| `_warehouses.*.amount` per product        | `product_warehouse_stocks` + `products.stockQuantity` (sum) |
| `price/items/get-paging`, price `narxi`   | `products.price` (UZS, integer)                    |
| `customer/get-paging`                     | `bito_customers`                                   |
| `employee/get-paging`                     | `bito_employees`                                   |

Curated Supabase fields (`nameRu`/`nameUz`/`descriptionRu`/`descriptionUz`/
`slug`/`product_images`) are **never overwritten** for products that already
exist in Supabase. New products created from Bito get a generated code and
slug; their RU/UZ display name defaults to the code (Bito has no localized
names).

### Variant A grouping

Bito keeps each color as a separate product (e.g. `B-1 white`, `B-1 pink`).
The script groups these by **root code** and creates a single Supabase product
with N color rows in `product_colors`. Each `product_colors` row links back to
its individual Bito product via `bitoProductId`.

## Running

### 1. Install Python deps

```bash
cd backend/scripts/bito-sync
python3 -m pip install -r requirements.txt
```

### 2. Set environment variables

```bash
export BITO_BASE_URL="https://api.bito.uz/integration-api/integration/api/v2"
export BITO_API_KEY="dekor-house:<token>"
export BITO_PRICE_ID="6706187e485b322ea8c90155"   # narxi (UZS)
export SUPABASE_DSN="postgresql://postgres.<ref>:<pwd>@<host>:5432/postgres?sslmode=require"
```

### 3. Dry-run (no writes)

```bash
python3 sync.py --report-out /tmp/bito-dry-run.json
```

### 4. Apply (writes inside one transaction)

```bash
python3 sync.py --apply --report-out /tmp/bito-apply.json
```

### Selective phases

```bash
python3 sync.py --skip-customers --skip-employees      # only catalog
python3 sync.py --skip-products --skip-stock           # only orgs + customers
python3 sync.py --skip-prices                          # don't touch price
```

## Backups

Always take a `pg_dump` of `public` before running with `--apply`:

```bash
pg_dump --host=... --port=5432 --username=... \
  --schema=public --no-owner --no-privileges --clean --if-exists \
  --file=supabase-public-$(date +%Y%m%d-%H%M%S).sql
```

## Auditing

Every applied run inserts a row into `bito_sync_runs` with the full log and
stats JSON, so you can `SELECT … FROM bito_sync_runs ORDER BY "startedAt" DESC`
for history.

## Incremental cron sync (`sync_stock.py`)

For near-real-time stock visibility, `sync_stock.py` is a lightweight
companion script that **only** updates already-linked products:

- `products.stockQuantity` (sum of `_warehouses[*].amount`)
- `products.inStock` (boolean from total > 0)
- `products.price` (UZS narxi)
- `product_warehouse_stocks` (UPSERT amount/booked/inTransit/inTrash)
- `product_colors.stockQuantity` / `inStock`

It does **not** create new products / categories / customers — for that, run
the full `sync.py --apply` (slower, ~30 min for first run).

Typical run completes in ~20 seconds against the live Supabase pooler.

### Scheduling

Two equivalent options ship in this repo, pick one:

| Option | Cost | File | Min. interval |
|--------|------|------|---------------|
| **GitHub Actions** | Free | `.github/workflows/bito-sync-stock.yml` | 5 min |
| **Render Cron Job** | $7/mo | `render.yaml` (`bito-sync-stock`) | 1 min |

Required secrets (whichever you choose):
- `SUPABASE_DSN` — Postgres connection string
- `BITO_API_KEY` — `dekor-house:<token>`

`BITO_BASE_URL` and `BITO_PRICE_ID` have safe defaults baked into the
workflow / `render.yaml`.

### Manual run

```bash
export BITO_API_KEY="dekor-house:<token>"
export SUPABASE_DSN="postgresql://..."
python3 sync_stock.py
```
