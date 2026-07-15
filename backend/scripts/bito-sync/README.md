# Bito ↔ Supabase one-way sync

Pulls warehouses / categories / products / per-warehouse stock / customers /
employees from **Bito ERP** (the source of truth for inventory and pricing) into
the existing **Supabase** Postgres database used by the Telegram Mini App.

One script, two modes:

| Mode            | Runs every | Creates new rows?  | Phases                                                            |
| --------------- | ---------- | ------------------ | ----------------------------------------------------------------- |
| `incremental`   | 1 hour     | No (UPDATE only)   | warehouses, categories (refresh), products, stock, prices         |
| `full`          | 1 day      | Yes                | all of incremental + new products + customers + employees         |

Both modes are **diff-aware**: a UPDATE/UPSERT is only emitted when at least
one value actually changed, so a no-op run makes near-zero load on the
Supabase pooler.

## What gets synced

| Bito source                               | Supabase target                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `warehouse/get-all`                       | `bito_warehouses`                                                               |
| `category/get-paging`                     | `categories` (smart RU/UZ from Uzbek source name) — names refreshed every run   |
| `product/get-paging`                      | `products` (1 Bito SKU = 1 Supabase product, after split-by-color migration)    |
| `_warehouses.*.amount` per product        | `product_warehouse_stocks` + `products.stockQuantity` (sum)                     |
| `price/items/get-paging`, price `narxi`   | `products.price` (UZS, integer)                                                 |
| product.category._id                      | `products.categoryId` ← **updated every run**, so Bito category moves stick     |
| `customer/get-paging`                     | `bito_customers` (full mode only)                                               |
| `employee/get-paging`                     | `bito_employees` (full mode only)                                               |

### Curated fields — never overwritten

For products that already exist in Supabase, the sync **never** touches:
`nameRu`, `nameUz`, `descriptionRu`, `descriptionUz`, `slug`, `product_images`,
`isFeatured`, `isNew`, `viewCount`, `isActive`. New products created from Bito
get a generated code/slug and their RU/UZ display name defaults to the code
(Bito has no localized names).

### Matching priority (per Bito product)

1. `products.bitoProductId == bito._id` — strongest, used always.
2. `products.bitoSku == bito.sku`       — re-link if `bitoProductId` is null.
3. Fuzzy name match                     — full mode only, fallback for first-time link.

Anything still unmatched is **skipped** in incremental mode and **created** in
full mode.

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

### 3. Dry-run (no writes) — always do this first against prod

```bash
python3 sync.py --mode=incremental --report-out /tmp/incr-dry.json
python3 sync.py --mode=full        --report-out /tmp/full-dry.json
```

The dry-run prints what would change but doesn't open a write transaction.

### 4. Apply

```bash
python3 sync.py --mode=incremental --apply
python3 sync.py --mode=full        --apply
```

### Selective phases

```bash
python3 sync.py --mode=full --skip-customers --skip-employees   # catalog only
python3 sync.py --mode=incremental --skip-stock                 # only price + categoryId
python3 sync.py --mode=incremental --skip-prices                # only stock + categoryId
```

## Scheduling

**Render is the only automatic scheduler.** GitHub Actions is retained as a
manual fallback (`workflow_dispatch`) and has no `schedule` trigger. This avoids
duplicate concurrent writes.

| Where           | Incremental             | Full                    |
| --------------- | ----------------------- | ----------------------- |
| Render Cron     | `10 * * * *`            | `0 4 * * *`             |
| GitHub Actions  | manual only             | manual only             |

The script also takes a PostgreSQL session advisory lock. If another full or
incremental run is active, the second process exits successfully without
writing.

Workflow files:
- `.github/workflows/bito-sync-incremental.yml` — manual fallback
- `.github/workflows/bito-sync-full.yml`        — manual fallback
- `render.yaml`                                 — automatic Render Cron Jobs

Required GitHub repo / Render secrets:
- `SUPABASE_DSN` — Postgres connection string
- `BITO_API_KEY` — `dekor-house:<token>`

`BITO_BASE_URL` and `BITO_PRICE_ID` have safe defaults.

### Manual trigger

- GitHub: Actions tab → "Bito sync (full)" or "(incremental)" → Run workflow.
  The `apply` input lets you do a dry-run from the UI.
- Render: dashboard → Cron job → "Trigger Job" button.
- Locally: `python3 sync.py --mode=full --apply` (with env vars set).

## Backups

Before the very first apply (or any time the catalog has drifted significantly
from Bito), take a `pg_dump` of `public`:

```bash
pg_dump --host=... --port=5432 --username=... \
  --schema=public --no-owner --no-privileges --clean --if-exists \
  --file=supabase-public-$(date +%Y%m%d-%H%M%S).sql
```

## Auditing

Every applied run inserts a row into `bito_sync_runs` with the full log and
stats JSON:

```sql
SELECT "startedAt", "finishedAt", status, stats->'mode' AS mode,
       stats->'products'->'plan' AS products_plan
FROM bito_sync_runs
ORDER BY "startedAt" DESC
LIMIT 20;
```

## Safety

- `statement_timeout = 30s` is set per session so a stuck query can never
  block real user traffic on the Supabase pooler.
- All writes happen inside a single transaction (`BEGIN … COMMIT`). On any
  error the transaction rolls back and a `status=error` row is recorded.
- The script exits **0** (not 1) if the Supabase project is paused / pooler
  returns "Tenant or user not found" — this prevents cron from spamming
  failure emails while the user is restoring the project.
- Batched `execute_values` writes mean a 1927-row sync emits 1-3 UPDATEs,
  not 1927 individual statements.
