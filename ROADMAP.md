# Dekor Market — Roadmap

## NOW (Q3 2026) — в работе / завершено

### 1. ADMIN / USER роли — DONE

- **Цель:** формальные роли, проверка роли в БД, а не только session
- **Scope:** Prisma enum `UserRole`, `User.role default USER`, migration, admin login назначает ADMIN, adminAuth проверяет роль + allowlist bootstrap, тесты USER vs ADMIN
- **Зависимости:** нет
- **Риски:** блокировка существующих админов после migration — mitigated auto-promote + UPDATE в migration
- **Accept criteria:** два Telegram ID 857268409, 7987200974 имеют ADMIN, остальные USER, adminAuth 403 для USER, `/admin` без cookie не даёт доступ
- **Статус:** DONE, PR #26, merged, deploy live, DB up to date

### 2. Sentry frontend + backend — DONE

- **Цель:** централизованный error tracking, PII scrub
- **Scope:** `@sentry/react` init до React render, `VITE_SENTRY_DSN`, release = git SHA, traces 0.07 prod, ErrorBoundary capture, network errors с endpoint/status, no Replay, filter cookies/auth/x-telegram/phone/address; backend `@sentry/node` instrumentation до app, `SENTRY_DSN`, `setupExpressErrorHandler`, scrub bot token/service role/DB URL/phones, sendDefaultPii=false
- **Зависимости:** Render env
- **Риски:** DSN утечка, source maps токен в VITE_ — mitigated: token только backend, hidden sourcemaps
- **Accept criteria:** test error из `/admin/developer` попадает в Sentry, PII отсутствует, health OK
- **Статус:** DONE, PR #27, merged, env в Render установлены, deploy live (проверить issues через `/admin/developer/sentry-issues`)

### 3. /admin/developer — DONE

- **Цель:** единая диагностическая страница для админов
- **Scope:** frontend `AdminDeveloperPage` lazy, backend `GET /admin/developer` masked health: frontend health, backend health, deploy SHA, env, DB connectivity, migration status, Sentry configured + dashboard links, last Bito full/incremental + errors, cache backend, analytics status, image optimization queue, Node/Prisma versions, uptime; `GET /admin/developer/sentry-issues` proxy via SENTRY_AUTH_TOKEN backend only, short fields, 5min cache; `POST /admin/developer/sentry-test-*` admin-only test errors
- **Зависимости:** Sentry, BitoSyncRun, cache
- **Риски:** раскрытие секретов — mitigated maskSecret, не отдавать DSN/auth/DB URL/bot token
- **Accept criteria:** только ADMIN доступ, показывает все поля из ТЗ, не показывает секреты, Sentry issues грузятся без токена на frontend
- **Статус:** DONE, PR #28, merged, live

### 4. Bito sync notifications — DONE

- **Цель:** моментальные алерты в Telegram, daily summary
- **Scope:** `sync.py` — BOT_TOKEN + ADMIN_TELEGRAM_IDS, immediate: failure, safety stop partial/disappearance/category/mass create, price API failure, DB failure, not finished; full daily summary duration/total/matched/created/updated/moved/stock/customers/employees/no-image/warnings; incremental silence on 0 changes, brief on large (>100 upd /10 new/moved), error/anomaly send; failure не ломает DB transaction try/catch + Sentry; duplicate state в `/admin/developer`
- **Зависимости:** Render cron env, Telegram Bot API
- **Риски:** спам админам — mitigated silence 0 changes, rate limit
- **Accept criteria:** при safety stop приходит 🚨, full summary утром приходит, incremental 0 changes молчит, notification failure не откатывает транзакцию
- **Статус:** DONE, PR #29, merged, cron env в Render установлены (BOT_TOKEN, ADMIN_TELEGRAM_IDS, SENTRY_DSN)

### 5. API pagination limits — DONE

- **Цель:** защита от злоупотреблений, стабильный cache
- **Scope:** helper `parsePagination` + `parseSearchQuery`, LIMITS public list 100, search 50, categories 100, admin 200, Bito 200, exports без лимита; handle page<1, NaN, limit<1, too big, very long query 200 chars clamp, offset overflow 100k; тесты
- **Зависимости:** нет
- **Риски:** сломать существующий frontend — mitigated backward compat (pagination meta добавляется, data остаётся array)
- **Accept criteria:** `?limit=1000` → 100, `?page=0` → 1, `?q=а*500` → 200 chars, offset >100k → clamp
- **Статус:** DONE, PR #30, merged, live

### 6. Full funnel analytics — DONE (backend) / PARTIAL (frontend)

- **Цель:** воронка без PII
- **Scope:** Prisma `AnalyticsEvent` (id, event enum product_view/category_view/search/search_no_results/add_to_cart/remove_from_cart/checkout_started/order_created/order_cancelled, sessionId anon, userId nullable, productId nullable, categoryId nullable, orderId nullable, source/deepLink, metadata JSON, createdAt), нельзя хранить phone/address/name/initData/username/cookies/IP raw; public endpoint `POST /api/analytics/events` Zod allowlist, metadata 2KB, PII filter, rate limit 100/min, batch max 20, не блокировать checkout; admin `GET /api/admin/analytics?period=7/30/90` revenue, orders, avg, product views, add-to-cart conversion, checkout conversion, order conversion, top products/categories, viewed not ordered, searches/no-result, telegram sources; frontend `analyticsService` anon sessionId, track/batch, fire-and-forget, admin page `/admin/analytics`, summary в `/admin/developer`
- **Зависимости:** Prisma migration, cart/order flow
- **Риски:** PII утечка — mitigated filter + blocklist + size limit; нагрузка — mitigated rate limit + batch + createMany
- **Accept criteria:** event без PII сохраняется, batch 21 → 400, PII в metadata отфильтровывается, admin dashboard показывает funnel, checkout не ждёт analytics
- **Статус:** DONE backend+admin page, PR #31 merged, live; frontend integration в ProductPage/CategoryPage/SearchPage/Cart/Checkout — частично, можно добавить track вызовы

### 7. Image optimization — IN PROGRESS (new uploads DONE, batch DRY-RUN)

- **Цель:** WebP 320/640/1200, сохранить оригинал, не ломать форму/цвет, прозрачность, white background
- **Scope new uploads:** MIME magic bytes via file-type, max 10MB, Sharp auto-orient, strip malformed ICC, sRGB, WebP thumb 320, medium 640, detail 1200, save original, ProductImage extended originalUrl/thumbnailUrl/mediumUrl/width/height/bytes/format, frontend picture/srcset 320/640/1200 + object-contain bg-white fallback old url
- **Scope existing batch:** только active/inStock ВЕТКИ `c5dbafbf74f984746b64e8644` (240) + ZELEN `c6adaef3b9b984cbab0aa5ac1` (78) = 318 products; steps DB backup (manual Supabase dashboard), storage inventory, download original, SHA256 checksum, generate variants, upload under `optimized/v2/{productId}/`, CSV/JSON preview report, dry-run no switch, apply after visual check, save old URLs, originals not delete, rollback script restores url from originalUrl, check mobile/PDF/website
- **Зависимости:** Sharp, Supabase Storage, category IDs verified
- **Риски:** испортить фото товара — mitigated dry-run + preview + keep original + rollback
- **Accept criteria:** новый upload отдаёт 3 WebP варианта + original, frontend использует srcset, картинка не искажена, batch dry-run report показывает old→new mapping, apply только после OK
- **Статус:** new uploads DONE, PR #33 merged live, batch dry-run script ready, full apply pending user visual check (PR7b)

### 8. Cache adapter без платного Redis — DONE

- **Цель:** интерфейс cache provider, без покупки Render Redis, готовность к Valkey на VPS
- **Scope:** `CacheProvider` interface get/set/delete/deleteByPrefix/clear/stats/health, `MemoryCacheProvider` (Map TTL hits/misses), `RedisCacheProvider` via ioredis JSON serialization TTL EX SCAN prefix delete, graceful fallback to memory, Sentry capture, factory `getCacheProvider()` uses `REDIS_URL` if set else memory, `cache.ts` keeps sync legacy (backward compat) + async provider-based API `getCachedAsync/setCacheAsync/trySendCachedAsync/cacheAndSendAsync/invalidateCacheAsync/getCacheHealth`, `getCacheStats` merges provider+legacy, `REDIS_URL` empty on Render → memory, on VPS Valkey Docker
- **Зависимости:** ioredis
- **Риски:** Redis down → fallback memory, mitigated connected check + try/catch
- **Accept criteria:** на Render provider memory, stats показывает hits/misses, SET/GET работает, health ok, с REDIS_URL переключается на redis
- **Статус:** DONE, PR #32 merged, live

## FUTURE — не реализовывать сейчас, только документировать

### 1. Admin audit log

- **Цель:** кто, когда, что изменил в админке
- **Scope:** модель `AdminAuditLog` (id, adminTelegramId, action, targetType, targetId, oldJson, newJson, ipHash, createdAt), middleware для admin routes, страница `/admin/audit`
- **Зависимости:** USER/ADMIN роли done
- **Риски:** рост таблицы, PII в логах — mitigated не логировать sensitive fields, retention 90 дней
- **Accept criteria:** создание/обновление товара, категории, заказа, акции пишется в лог, admin видит историю
- **Статус:** TODO

### 2. Send orders to Bito (create sales)

- **Цель:** заказы из Mini App попадают в Bito как продажи
- **Scope:** Bito API POST sale/order, маппинг products via bitoProductId, customer via phone, payment method, delivery, error handling + retry + Telegram alert on failure
- **Зависимости:** Bito API docs, customer matching, stock reservation decision
- **Риски:** дубли продаж, неверный bitoProductId — mitigated idempotencyKey + dry-run
- **Accept criteria:** заказ DELIVERED в Mini App → появляется в Bito, суммы совпадают, повторный не дублирует
- **Статус:** TODO

### 3. Stock reservation after Bito order integration

- **Цель:** резервировать склад после создания заказа в Bito
- **Scope:** после успешной продажи в Bito, уменьшить `booked` или вызвать reserve endpoint, если API есть
- **Зависимости:** предыдущий пункт (Bito orders)
- **Риски:** оверселл если reservation нет — сейчас Bito source of truth, mitigated не делаем до Bito integration
- **Accept criteria:** заказ на 10 шт → в Bito booked +10, available -10, повторный заказ не может взять больше available
- **Статус:** TODO, blocked by Bito order creation, user chose НЕ делать сейчас

### 4. Automated encrypted backups + restore drill

- **Цель:** ежедневные зашифрованные бэкапы PG + R2, ежемесячный restore drill
- **Scope:** cron pg_dump -Fc + gpg encrypt + upload R2 s3://dekormarket-backups/db/, retention 7 daily/4 weekly, restore drill на staging
- **Зависимости:** VPS_MIGRATION Phase 4
- **Риски:** забыть пароль gpg — mitigated vault + 2 custodians
- **Accept criteria:** последние 7 бэкапов в R2, restore на staging проходит, время RTO <30 мин
- **Статус:** TODO, partially documented in VPS_MIGRATION.md

### 5. Staging environment

- **Цель:** тестировать миграции, Bito sync, image batch без риска prod
- **Scope:** второй VPS или тот же VPS второй docker-compose с `staging` namespace, отдельный `DATABASE_URL`, `https://staging.app.dekormarket.uz`, auto-deploy из ветки `staging`, seed anonymized data
- **Зависимости:** VPS migration
- **Риски:** данные staging устаревают — mitigated weekly sync from prod anonymized
- **Accept criteria:** push в `staging` → deploy staging, можно прогнать Bito sync dry-run, image batch dry-run
- **Статус:** TODO

### 6. Improved RU/UZ/transliteration search

- **Цель:** умный поиск с опечатками, транслитом, синонимами
- **Scope:** pg_trgm extension + `to_tsvector` RU/UZ, transliteration `o'` ↔ `ў`, `g'` ↔ `ғ`, `sh` ↔ `ш`, fuzzy via `similarity()`, ranking
- **Зависимости:** PG17, search analytics (search_no_results) from PR6
- **Риски:** медленный поиск — mitigated GIN index + limit 50
- **Accept criteria:** запрос `yashil vetka` находит `zelen`, `ветка` находит `ветка`, опечатка `декоратив` находит `декоративные`, no-result rate <20%
- **Статус:** TODO, data from analytics will guide

## Definition of Done для NOW

- [x] PR1 roles merged + live + DB up to date
- [x] PR2 Sentry merged + live + env set + smoke via /admin/developer
- [x] PR3 developer page merged + live
- [x] PR4 Bito notifications merged + cron env set
- [x] PR5 pagination merged + live + tests
- [x] PR6 analytics merged + live + migration up to date
- [x] PR7 image new uploads merged + live, existing batch dry-run script ready, rollback ready
- [x] PR8 cache adapter merged + live
- [ ] Docs VPS_MIGRATION.md + ROADMAP.md merged + live (in progress)
- [ ] Production smoke tests (catalog, product, search, cart, checkout, admin, developer, analytics)
- [ ] Final security scan (npm audit, no secrets in git, env 600)
- [ ] Delete temp files + revoke temp tokens (after all done)
