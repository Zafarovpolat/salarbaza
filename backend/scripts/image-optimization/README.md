# Image Optimization - PR7

Scope per spec: only active/inStock products of categories ВЕТКИ and ZELEN.

Category IDs verified via DB:
- ZELEN: `c6adaef3b9b984cbab0aa5ac1` (6943e7089f1e6d061cc0aad8 Bito) - 78 active/inStock
- ВЕТКИ: `c5dbafbf74f984746b64e8644` (695a13d5b8932277286d87b1 Bito) - 240 active/inStock
Total scope: 318 products

## New uploads

- Magic bytes check via `file-type`
- Max 10MB
- Sharp: auto-orient via `rotate()`, strip malformed ICC, convert to sRGB, preserve alpha
- WebP variants: 320 thumb, 640 card, 1200 detail, quality 80, effort 4, withoutEnlargement, fit inside
- Save original + 3 variants under `products/{base}-original.{ext}`, `{base}-320.webp`, etc.
- White/#fafafa background not broken (WebP preserves transparency, background white in frontend object-contain)
- Not change shape/color

ProductImage extended: `originalUrl, thumbnailUrl, mediumUrl, width, height, bytes, format`

Frontend: `picture/srcset` 320/640/1200, `object-contain bg-white` for product photos, fallback old url

## Existing batch

Steps:
1. DB backup via Supabase dashboard (manual, before apply)
2. Storage inventory (list all product_images for scope)
3. Only active/inStock + 2 categories
4. Download original
5. SHA256 checksum
6. Generate variants via Sharp
7. Upload under versioned prefix `optimized/v2/{productId}/{base}-*.webp`
8. CSV/JSON preview report in `image-optimization-reports/`
9. Nothing switched in dry-run
10. Apply after visual check (requires user OK)
11. Save old URLs in `originalUrl`
12. Originals not deleted
13. Rollback script `rollback.ts` restores `url = originalUrl`
14. Check mobile/PDF/website after apply

### Dry-run
```bash
cd backend
export DATABASE_URL=... DIRECT_URL=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE=...
npx ts-node scripts/image-optimization/batch.ts --limit=20
# generates report-dryrun-*.json/csv in image-optimization-reports/
```

### Apply (after visual check)
```bash
npx ts-node scripts/image-optimization/batch.ts --apply --limit=100
```

### Rollback
```bash
npx ts-node scripts/image-optimization/rollback.ts --limit=100       # dry-run
npx ts-node scripts/image-optimization/rollback.ts --apply --limit=100
```
