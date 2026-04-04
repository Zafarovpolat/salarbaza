# DekorHouse - Telegram Mini App

## Документация проекта

**Обновлено:** Апрель 4, 2026

---

## 📋 Оглавление

1. [Обзор проекта](#обзор-проекта)
2. [Технологический стек](#технологический-стек)
3. [Структура проекта](#структура-проекта)
4. [База данных](#база-данных)
5. [API Endpoints](#api-endpoints)
6. [Функциональность](#функциональность)
7. [Новое в ТЗ 3.0](#новое-в-тз-30)
8. [Деплой](#деплой)
9. [Тестирование](#тестирование)

---

## 🎯 Обзор проекта

### Описание

**DekorHouse** — Telegram Mini App для продажи декоративных товаров для дома и сада:

- 🪴 Горшки и кашпо (пластик, металл, плетёные)
- 🌿 Искусственные растения и деревья
- 🏗️ Подставки для растений

### Целевая аудитория

- Розничные покупатели в Узбекистане
- Оптовые клиенты (магазины, дизайнеры интерьера)
- Возраст: 25-55 лет

### Языки

- 🇺🇿 Узбекский (основной)
- 🇷🇺 Русский

### Валюта

- UZS (сўм)

---

## 🛠️ Технологический стек

### Frontend

| Технология          | Версия  | Назначение           |
| ------------------- | ------- | -------------------- |
| **React**           | 18.3.1  | UI Framework         |
| **TypeScript**      | 5.4.2   | Type Safety          |
| **Vite**            | 5.4.21  | Build Tool           |
| **Tailwind CSS**    | 3.4.19  | Styling              |
| **Framer Motion**   | 11.18.2 | Animations           |
| **Zustand**         | 4.5.7   | State Management     |
| **React Router**    | 6.30.2  | Routing              |
| **@twa-dev/sdk**    | 7.10.1  | Telegram Web App SDK |
| **Axios**           | 1.13.2  | HTTP Client          |
| **React Hot Toast** | 2.6.0   | Notifications        |
| **Lucide React**    | 0.344.0 | Icons                |

### Backend

| Технология                | Версия | Назначение          |
| ------------------------- | ------ | ------------------- |
| **Node.js**               | 20.x   | Runtime             |
| **Express.js**            | 4.18.3 | API Framework       |
| **PostgreSQL**            | -      | Database (Supabase) |
| **Prisma**                | 5.22.0 | ORM                 |
| **node-telegram-bot-api** | 0.64.0 | Telegram Bot API    |
| **Zod**                   | 3.22.4 | Schema Validation   |
| **Helmet**                | 7.1.0  | Security Headers    |
| **Winston**               | 3.12.0 | Logging             |

### Infrastructure

| Технология   | Назначение                    |
| ------------ | ----------------------------- |
| **Render**   | Backend & Frontend Hosting    |
| **Supabase** | PostgreSQL Database & Storage |
| **Docker**   | Контейнеризация               |

---

## 📁 Структура проекта

```
DekorHouse/
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 admin/           # (1 файл)
│   │   │   │   └── AdminLayout.tsx
│   │   │   ├── 📁 cart/            # (4 файла)
│   │   │   │   ├── CartItem.tsx        # ✅ Отображение размера
│   │   │   │   ├── CartList.tsx
│   │   │   │   ├── CartSummary.tsx
│   │   │   │   └── CartButton.tsx      # ✅ Поддержка variant
│   │   │   ├── 📁 category/        # (2 файла)
│   │   │   │   ├── CategoryCard.tsx
│   │   │   │   └── CategoryList.tsx
│   │   │   ├── 📁 common/          # (3 файла)
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── LoadingScreen.tsx
│   │   │   ├── 📁 home/            # (1 файл)
│   │   │   │   └── PromotionWidget.tsx  # 🆕 Виджет акций
│   │   │   ├── 📁 layout/          # (4 файла)
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── BottomNav.tsx
│   │   │   │   ├── Container.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── 📁 order/           # (2 файла)
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   └── OrderStatus.tsx
│   │   │   ├── 📁 product/         # (7 файлов)
│   │   │   │   ├── ProductCard.tsx     # ✅ Ценовой диапазон
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── ProductRecommendations.tsx  # ✅ Рекомендации
│   │   │   │   ├── ColorSelector.tsx
│   │   │   │   ├── SizeSelector.tsx    # 🆕 Выбор размера
│   │   │   │   ├── PriceDisplay.tsx
│   │   │   │   └── WholesalePrices.tsx # 🆕 Таблица оптовых цен
│   │   │   └── 📁 ui/              # (9 файлов)
│   │   │       ├── Badge.tsx
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── QuantitySelector.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       └── index.ts
│   │   ├── 📁 pages/               # (15 user + 13 admin = 28)
│   │   │   ├── HomePage.tsx
│   │   │   ├── CatalogPage.tsx
│   │   │   ├── CategoryPage.tsx
│   │   │   ├── ProductPage.tsx         # ✅ SizeSelector + оптовая таблица
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx        # ✅ Размер в summary
│   │   │   ├── OrderSuccessPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── FavoritesPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── PromotionPage.tsx       # 🆕 Страница акции
│   │   │   ├── SpecialOffersPage.tsx   # 🆕 Спецпредложения
│   │   │   ├── NewArrivalsPage.tsx     # 🆕 Новинки
│   │   │   ├── NotFoundPage.tsx
│   │   │   └── 📁 admin/              # (13 файлов)
│   │   │       ├── AdminDashboardPage.tsx
│   │   │       ├── AdminLoginPage.tsx
│   │   │       ├── AdminProductsPage.tsx     # ✅ Колонка размеров
│   │   │       ├── AdminProductEditPage.tsx  # ✅ Секция вариантов
│   │   │       ├── AdminCategoriesPage.tsx   # ✅ Оптовый шаблон
│   │   │       ├── AdminCategoryProductsPage.tsx
│   │   │       ├── AdminOrdersPage.tsx       # ✅ Размер в заказах
│   │   │       ├── AdminCustomersPage.tsx
│   │   │       ├── AdminCustomerDetailPage.tsx
│   │   │       ├── AdminWholesalePage.tsx    # ✅ Счётчик категорий
│   │   │       ├── AdminPromotionsPage.tsx   # 🆕 Управление акциями
│   │   │       ├── AdminPromotionEditPage.tsx # 🆕 Редактирование акции
│   │   │       └── AdminBulkTagsPage.tsx     # 🆕 Массовые теги
│   │   ├── 📁 store/               # (4 Zustand хранилища)
│   │   │   ├── cartStore.ts            # ✅ variantId support
│   │   │   ├── favoritesStore.ts
│   │   │   ├── languageStore.ts
│   │   │   └── userStore.ts
│   │   ├── 📁 services/            # (8 сервисов)
│   │   │   ├── api.ts
│   │   │   ├── cartService.ts          # ✅ variantId в addItem
│   │   │   ├── categoryService.ts
│   │   │   ├── productService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── adminService.ts
│   │   │   ├── promotionService.ts     # 🆕 Сервис акций
│   │   │   └── mockData.ts
│   │   ├── 📁 hooks/               # (5 хуков)
│   │   │   ├── useCategories.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useInfiniteScroll.ts
│   │   │   ├── useProducts.ts
│   │   │   └── useTelegram.ts
│   │   ├── 📁 types/
│   │   │   └── index.ts                # ✅ ProductVariant, WholesalePriceTier, Promotion
│   │   └── 📁 utils/
│
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   ├── index.ts
│   │   │   ├── database.ts
│   │   │   └── telegram.ts             # (пустой файл)
│   │   ├── 📁 controllers/         # (5 контроллеров — legacy)
│   │   ├── 📁 services/            # (6 сервисов)
│   │   │   ├── productService.ts       # ✅ enrichProductData + variants
│   │   │   ├── categoryService.ts      # ✅ getWholesaleDiscount()
│   │   │   ├── cartService.ts          # ✅ variant + wholesale calc
│   │   │   ├── orderService.ts         # ✅ variant + wholesale in order
│   │   │   ├── userService.ts
│   │   │   └── telegramService.ts
│   │   ├── 📁 middleware/
│   │   │   ├── auth.ts             # ✅ Telegram HMAC + dev mode
│   │   │   ├── errorHandler.ts     # ✅ Zod, Prisma, AppError
│   │   │   ├── rateLimiter.ts      # ✅ Express rate limiting
│   │   │   └── validateTelegram.ts # (не используется)
│   │   ├── 📁 routes/              # (10 файлов)
│   │   │   ├── index.ts            # Роутер
│   │   │   ├── productRoutes.ts    # ✅ /products (+ featured, new, sale, search, recommendations)
│   │   │   ├── categoryRoutes.ts   # ✅ /categories
│   │   │   ├── cartRoutes.ts       # ✅ /cart (auth required)
│   │   │   ├── orderRoutes.ts      # ✅ /orders (auth required)
│   │   │   ├── userRoutes.ts       # ✅ /user (auth required)
│   │   │   ├── adminRoutes.ts      # ✅ /admin (stats, products, categories, orders, wholesale, promotions, customers, bulk-tags)
│   │   │   ├── promotionRoutes.ts  # 🆕 /promotions (public)
│   │   │   ├── wholesaleRoutes.ts  # ✅ /wholesale (calculate, seed)
│   │   │   └── testRoutes.ts       # Тестовые эндпоинты
│   │   └── 📁 utils/
│   │       ├── cache.ts            # ✅ In-memory TTL cache
│   │       ├── constants.ts
│   │       ├── helpers.ts
│   │       ├── logger.ts           # ✅ Winston logging
│   │       └── slugify.ts
│   ├── 📁 bot/
│   │   ├── index.ts
│   │   ├── commands.ts
│   │   ├── handlers.ts
│   │   └── keyboards.ts
│   ├── 📁 prisma/
│   │   ├── schema.prisma               # ✅ 16 моделей + 6 enums
│   │   └── seed.ts
│   └── package.json
│
├── 📁 landing/
│   ├── index.html                  # 🆕 Маркетинговая страница
│   └── design.md                   # 🆕 Дизайн-система (832 строки)
│
├── render.yaml
├── .gitignore
├── README.md
└── project_review.md
```

---

## 🗄️ База данных

### Prisma Schema (16 моделей + 6 enums)

| Модель                   | Описание                         | Связи                                               |
| ------------------------ | -------------------------------- | --------------------------------------------------- |
| `User`                   | Пользователи Telegram            | → Cart, Orders, Favorites, Addresses                |
| `Address`                | Адреса доставки                  | → User, Orders                                      |
| `Category`               | Категории товаров                | → Products, **WholesaleTemplate**                   |
| `Product`                | Товары                           | → Category, Images, Colors, **Variants**, CartItems |
| `ProductImage`           | Изображения товаров              | → Product                                           |
| `ProductColor`           | Варианты цветов                  | → Product                                           |
| **`ProductVariant`**     | **🆕 Варианты размеров (S/M/L)** | **→ Product, CartItems, OrderItems**                |
| `Cart`                   | Корзина пользователя             | → User, CartItems                                   |
| `CartItem`               | Товары в корзине                 | → Cart, Product, **Variant**                        |
| `Order`                  | Заказы                           | → User, Address, OrderItems                         |
| `OrderItem`              | Товары в заказе                  | → Order, Product, **Variant**                       |
| `Favorite`               | Избранные товары                 | → User, Product                                     |
| `WholesalePriceTemplate` | Шаблоны оптовых скидок           | → **Categories**, Tiers                             |
| `WholesalePriceTier`     | Пороги скидок (от X шт = Y%)     | → Template                                          |
| **`Promotion`**          | **🆕 Акции и промо**             | **→ PromotionProduct[]**                            |
| **`PromotionProduct`**   | **🆕 Связь акций с товарами**    | **→ Promotion, Product**                            |

### 🆕 Модель ProductVariant

```prisma
model ProductVariant {
  id            String   @id @default(cuid())
  productId     String
  size          String        // "S", "M", "L", "XL"
  labelRu       String        // "Маленький (50 см)"
  labelUz       String        // "Kichik (50 sm)"
  price         Int           // Своя цена для каждого размера
  oldPrice      Int?
  sku           String?       // Артикул варианта
  inStock       Boolean  @default(true)
  stockQuantity Int      @default(0)
  dimensions    Json?         // { height_cm: 50, diameter_cm: 25 }
  sortOrder     Int      @default(0)

  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems  CartItem[]
  orderItems OrderItem[]

  @@unique([productId, size])
  @@map("product_variants")
}
```

### Архитектура оптовых цен

```
WholesalePriceTemplate
  ├── tiers: [5шт→5%, 10шт→10%, 25шт→15%, 50шт→20%]
  │
  ├── → Category "Искусственные деревья"
  │     ├── Product "Дерево X" → автоматически получает скидку
  │     ├── Product "Пальма Y" → автоматически получает скидку
  │     └── Product "Бамбук Z" → автоматически получает скидку
  │
  └── → Category "Горшки"
        ├── Product "Горшок A" → автоматически получает скидку
        └── Product "Горшок B" → автоматически получает скидку
```

### Enums

```prisma
enum OrderStatus {
  PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | RETURNED
}

enum DeliveryType {
  PICKUP | DELIVERY
}

enum PaymentMethod {
  CASH | CARD | PAYME | CLICK | UZUM
}

enum PaymentStatus {
  PENDING | PAID | FAILED | REFUNDED
}

enum PromotionStatus {
  DRAFT | SCHEDULED | ACTIVE | INACTIVE
}

enum PromotionType {
  SALE | COLLECTION | LIMITED | NEW_ARRIVALS
}
```

---

## 🎁 Акции (Promotions)

### Модель Promotion

```prisma
model Promotion {
  id            String          @id @default(cuid())
  slug          String          @unique
  nameRu        String
  nameUz        String
  descriptionRu String?
  descriptionUz String?
  rulesRu       String?         @db.Text
  rulesUz       String?         @db.Text
  image         String?
  type          PromotionType   @default(SALE)
  status        PromotionStatus @default(DRAFT)
  startDate     DateTime
  endDate       DateTime
  sortOrder     Int             @default(0)
  products      PromotionProduct[]
}
```

### Типы акций
- **SALE** — Распродажа со скидками
- **COLLECTION** — Коллекция товаров
- **LIMITED** — Ограниченное предложение
- **NEW_ARRIVALS** — Новинки

### Статусы акций
- **DRAFT** — Черновик
- **SCHEDULED** — Запланирована (автоактивация по startDate)
- **ACTIVE** — Активна (видна пользователям)
- **INACTIVE** — Неактивна (просрочена)

### API эндпоинты акций

#### Публичные (клиентские) — `/api/promotions`
| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/promotions` | Активные акции (автодеактивация просроченных) |
| GET | `/promotions/:slug` | Детали акции с товарами |

#### Админские — `/api/admin/promotions`
| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/admin/promotions` | Все акции |
| GET | `/admin/promotions/:id` | Акция по ID с товарами |
| POST | `/admin/promotions` | Создать акцию |
| PUT | `/admin/promotions/:id` | Обновить акцию |
| PATCH | `/admin/promotions/:id/status` | Изменить статус |
| DELETE | `/admin/promotions/:id` | Удалить акцию |
| POST | `/admin/promotions/:id/products` | Добавить товар |
| DELETE | `/admin/promotions/:id/products/:productId` | Убрать товар |

### Страницы акций (Frontend)
- **PromotionPage** (`/promotion/:slug`) — Страница конкретной акции
- **SpecialOffersPage** (`/special-offers`) — Все спецпредложения
- **NewArrivalsPage** (`/new-arrivals`) — Новинки
- **PromotionWidget** — Виджет акций на главной

### Админ-страницы
- **AdminPromotionsPage** — Список всех акций
- **AdminPromotionEditPage** — Создание/редактирование акции

---

## 🔌 API Endpoints

### Base URL

```
Production: https://dekorhouse-api.onrender.com/api
```

### 🏷️ Categories

| Method | Endpoint            | Описание                             |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/categories`       | Список категорий + wholesaleTemplate |
| GET    | `/categories/:slug` | Категория по slug                    |

### 📦 Products

| Method | Endpoint              | Описание                                          |
| ------ | --------------------- | ------------------------------------------------- |
| GET    | `/products`           | Пагинация, сортировка, фильтры                    |
| GET    | `/products/featured`  | Популярные товары                                 |
| GET    | `/products/new`       | Новинки                                           |
| GET    | `/products/search?q=` | Поиск                                             |
| GET    | `/products/:slug`     | Товар по slug **(+ variants, wholesaleTemplate)** |

### 🛒 Cart

| Method | Endpoint          | Описание                         |
| ------ | ----------------- | -------------------------------- |
| GET    | `/cart`           | Получить корзину                 |
| POST   | `/cart/items`     | Добавить товар **(+ variantId)** |
| PATCH  | `/cart/items/:id` | Изменить количество              |
| DELETE | `/cart/items/:id` | Удалить товар                    |
| DELETE | `/cart`           | Очистить корзину                 |

### 📋 Orders

| Method | Endpoint             | Описание                                 |
| ------ | -------------------- | ---------------------------------------- |
| GET    | `/orders`            | История заказов                          |
| GET    | `/orders/:id`        | Детали заказа **(+ variantSize)**        |
| POST   | `/orders`            | Создать заказ **(+ wholesale discount)** |
| PATCH  | `/orders/:id/cancel` | Отменить заказ                           |

### 💰 Wholesale

| Method | Endpoint                 | Описание                                      |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/wholesale/product/:id` | Оптовые цены для товара **(через категорию)** |
| GET    | `/wholesale/calculate`   | Рассчитать цену **(+ variantId)**             |

### 👨‍💼 Admin

| Method | Endpoint                             | Описание                           |
| ------ | ------------------------------------ | ---------------------------------- |
| GET    | `/admin/products`                    | Список товаров **(+ variants)**    |
| POST   | `/admin/products`                    | Создать товар **(+ variants[])**   |
| PUT    | `/admin/products/:id`                | Обновить товар **(+ variants[])**  |
| GET    | `/admin/products/:id/variants`       | 🆕 Варианты товара                 |
| POST   | `/admin/products/:id/variants`       | 🆕 Добавить вариант                |
| PUT    | `/admin/products/:pid/variants/:vid` | 🆕 Обновить вариант                |
| DELETE | `/admin/products/:pid/variants/:vid` | 🆕 Удалить вариант                 |
| POST   | `/admin/products/reset-statuses`     | 🆕 Сброс всех статусов товаров    |
| POST   | `/admin/products/bulk-tags`          | 🆕 Массовое обновление тегов      |
| GET    | `/admin/categories`                  | Категории + wholesaleTemplate      |
| GET    | `/admin/wholesale-templates`         | Шаблоны **(+ \_count.categories)** |
| DELETE | `/admin/wholesale-templates/:id`     | Удалить **(отвязать категории)**   |
| GET    | `/admin/promotions`                  | 🆕 Все акции                       |
| POST   | `/admin/promotions`                  | 🆕 Создать акцию                   |
| PUT    | `/admin/promotions/:id`              | 🆕 Обновить акцию                  |
| PATCH  | `/admin/promotions/:id/status`       | 🆕 Изменить статус                 |
| DELETE | `/admin/promotions/:id`              | 🆕 Удалить акцию                   |
| POST   | `/admin/promotions/:id/products`     | 🆕 Добавить товар в акцию          |
| GET    | `/admin/customers`                   | Клиенты (пагинация, фильтры)       |
| GET    | `/admin/customers/:id`               | Детали клиента                     |
| GET    | `/admin/customers/stats`             | Статистика клиентов                |
| GET    | `/admin/customers-export`            | Экспорт клиентов в CSV             |

---

## ⚙️ Функциональность

### 👤 Для покупателей (Telegram Mini App)

| Функция                                         | Статус |
| ----------------------------------------------- | ------ |
| 🏠 Главная — категории, популярные, новинки     | ✅     |
| 📂 Каталог с фильтрами и сортировкой            | ✅     |
| 🔍 Поиск по названию и коду                     | ✅     |
| 📦 Карточка товара — галерея, описание, цвета   | ✅     |
| 📏 **Выбор размера (S/M/L) с автосменой цены**  | ✅ 🆕  |
| 💰 **Таблица оптовых цен из категории**         | ✅ 🆕  |
| 📊 **Ценовой диапазон в каталоге (от X до Y)**  | ✅ 🆕  |
| 🛒 Корзина **(с отображением размера)**         | ✅ 🆕  |
| 📋 Оформление заказа **(с размером и скидкой)** | ✅ 🆕  |
| 📜 История заказов                              | ✅     |
| ❤️ Избранное                                    | ✅     |
| 🌐 Мультиязычность UZ/RU                        | ✅     |
| 👤 Профиль и адреса                             | ✅     |
| 📱 Telegram SDK, auth, haptic                   | ✅     |
| 🎁 **Просмотр акций и спецпредложений**         | ✅ 🆕  |
| 🆕 **Страница новинок**                         | ✅ 🆕  |

### 👨‍💼 Для администратора (Админ-панель)

| Функция                                           | Статус |
| ------------------------------------------------- | ------ |
| 📊 Дашборд — статистика                           | ✅     |
| 📦 Управление товарами                            | ✅     |
| 📏 **Создание/редактирование вариантов размеров** | ✅ 🆕  |
| ⚡ **Быстрое добавление S/M/L**                   | ✅ 🆕  |
| 📂 Управление категориями                         | ✅     |
| 💰 **Привязка оптовых шаблонов к категориям**     | ✅ 🆕  |
| 📋 Управление заказами **(с размерами)**          | ✅ 🆕  |
| 👥 База клиентов + CRM                            | ✅     |
| 📊 **Оптовые шаблоны (счётчик категорий)**        | ✅ 🆕  |
| 📬 Уведомления в Telegram                         | ✅     |
| 🎁 **Управление акциями (CRUD)**                  | ✅ 🆕  |
| 🏷️ **Массовое обновление тегов**                 | ✅ 🆕  |
| 📤 **Экспорт клиентов в CSV**                     | ✅ 🆕  |

### 👨‍💼 Для администратора (Telegram Bot)

| Функция                                   | Статус |
| ----------------------------------------- | ------ |
| 📬 Уведомление о новых заказах            | ✅     |
| ✅ Подтверждение / ❌ Отмена заказа       | ✅     |
| 📦 Изменение статуса (SHIPPED, DELIVERED) | ✅     |

---

## 🆕 Новое в ТЗ 3.0

### 1. Вариации товара по размеру

**Требование:** Один товар = несколько размеров = разные цены. Без дублирования карточек.

**Реализация:**

```
Товар: "Декоративное дерево X"
  ├── Размер S — 1 000 000 сум
  ├── Размер M — 1 300 000 сум
  └── Размер L — 1 700 000 сум

Всё в одной карточке с выбором размера.
```

**Компоненты:**

- `ProductVariant` модель в БД
- `SizeSelector` компонент (аналог ColorSelector)
- Автоматическая смена цены при выборе размера
- Ценовой диапазон "от X до Y" в каталоге
- Бейдж количества размеров на карточке
- Размер + цвет = уникальная позиция в корзине
- Размер сохраняется в заказе (`variantSize`)

**Формула цены:**

```
Финальная цена = Цена варианта + Модификатор цвета - Оптовая скидка
```

### 2. Оптовые цены по категориям

**Требование:** Скидка задаётся на уровне категории, автоматически применяется ко всем товарам.

**Реализация:**

```
Категория "Искусственные деревья"
  └── Оптовый шаблон: "Стандартная скидка"
       ├── от 5 шт  → -5%
       ├── от 10 шт → -10%
       ├── от 25 шт → -15%
       └── от 50 шт → -20%

Все товары в категории автоматически получают скидку.
```

**Как работает:**

1. Админ создаёт оптовый шаблон с порогами
2. Админ привязывает шаблон к категории
3. Все товары в категории автоматически получают скидку
4. На странице товара — таблица оптовых цен
5. При увеличении количества — активный порог подсвечивается
6. При создании заказа — скидка рассчитывается и сохраняется

**Приоритет:**

```
Размер товара → Цена варианта
Цвет → + Модификатор цвета
Количество → Оптовая скидка из категории
= Финальная цена
```

### 3. Админ-панель

**Новые возможности:**

| Страница              | Что добавлено                             |
| --------------------- | ----------------------------------------- |
| Редактирование товара | Секция "Варианты размеров" с CRUD         |
| Редактирование товара | Кнопка "Быстро добавить S/M/L"            |
| Редактирование товара | Инфо об оптовой скидке категории          |
| Список товаров        | Колонка "Размеры" (бейджи S/M/L)          |
| Список товаров        | Ценовой диапазон для товаров с вариантами |
| Заказы                | Бейдж размера в деталях заказа            |
| Заказы                | Отображение оптовой скидки                |
| Оптовые шаблоны       | Счётчик категорий (не товаров)            |
| Оптовые шаблоны       | Список привязанных категорий              |
| Оптовые шаблоны       | Превью расчёта цен                        |
| Категории             | Привязка оптового шаблона                 |
| 🆕 Акции              | CRUD акций с привязкой товаров            |
| 🆕 Акции              | Автоактивация/деактивация по датам        |
| 🆕 Bulk Tags          | Массовое обновление статусов              |
| 🆕 Landing Page       | Маркетинговая страница + дизайн-система   |

---

## 🎁 Акции и массовые операции (TZ 3.0 дополнения)

### 4. Система акций (Promotions)

**Требование:** Создание маркетинговых акций с привязкой конкретных товаров, автоактивацией по датам.

**Реализация:**
```
Акция: "Навруз — Скидки 20%"
  ├── Тип: SALE
  ├── Статус: SCHEDULED → ACTIVE (авто)
  ├── Даты: 14.03.2026 — 25.03.2026
  ├── Товары: [Дерево X, Горшок A, Пальма Y]
  └── Страница: /promotion/navruz-skidki-20
```

**Как работает:**
1. Админ создаёт акцию с названием, описанием, датами, типом
2. Админ привязывает конкретные товары к акции
3. При наступлении startDate — акция автоматически активируется
4. При наступлении endDate — акция автоматически деактивируется
5. На главной — виджет активных акций
6. Отдельная страница `/promotion/:slug` с товарами акции

### 5. Массовое обновление тегов (Bulk Tags)

**Требование:** Быстрое обновление статусов нескольких товаров одновременно.

**Реализация:**
- `POST /admin/products/bulk-tags` — массовое обновление `isFeatured`, `isNew`, `isSpecialOffer`, `isActive`
- `POST /admin/products/reset-statuses` — сброс всех статусов
- Админ-страница: `AdminBulkTagsPage`

### Environment Variables

#### Frontend (.env)

```env
VITE_API_URL=https://dekorhouse-api.onrender.com/api
VITE_BOT_USERNAME=DekorHouseBot
```

#### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@host:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/postgres

BOT_TOKEN=123456789:ABC-DEF...
ADMIN_CHAT_ID=123456789

PORT=3001
FRONTEND_URL=https://dekorhouse-web.onrender.com
NODE_ENV=production
```

### Render Build Command

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate --accept-data-loss && npm run build
```

### Render Start Command

```bash
npm start
```

---

## 🧪 Тестирование

### Создание тестовых данных

```bash
cd backend

# Установить переменные production БД
$env:DATABASE_URL="postgresql://..."
$env:DIRECT_URL="postgresql://..."

# Запустить seed
npx ts-node prisma/test-seed.ts
```

### Чек-лист тестирования

#### Вариации по размеру

```
☐ Товар с 3 размерами — кнопки S/M/L видны
☐ Выбор M → цена меняется
☐ Выбор L → цена меняется
☐ Размер + Цвет — цена складывается
☐ XL нет в наличии — серый, disabled
☐ Каталог — ценовой диапазон "от X до Y"
☐ Каталог — бейдж с количеством размеров
☐ Товар без вариантов — обычная карточка
```

#### Оптовые цены

```
☐ Таблица оптовых цен на странице товара
☐ Количество 5 → строка -5% подсвечивается
☐ Количество 10 → строка -10% подсвечивается
☐ Кнопка показывает цену со скидкой
☐ Скидка работает поверх размера
☐ Товар без вариантов тоже получает скидку
```

#### Корзина

```
☐ Разные размеры = разные позиции
☐ Бейдж размера виден в корзине
☐ Цены разные для разных размеров
```

#### Заказ

```
☐ Размер виден в summary при оформлении
☐ Заказ создаётся успешно
☐ В админке — размер виден в деталях заказа
```

#### Админка
```
☐ Создание товара с вариантами S/M/L
☐ Кнопка "Быстро добавить S/M/L" работает
☐ Редактирование вариантов
☐ Привязка оптового шаблона к категории
☐ Счётчик категорий в шаблонах
```

#### Акции
```
☐ Создание акции с датами и товарами
☐ Автоактивация по startDate
☐ Автодеактивация по endDate
☐ Виджет акций на главной
☐ Страница акции /promotion/:slug
☐ Массовое обновление тегов
☐ Сброс статусов товаров
```

#### Landing Page
```
☐ Страница открывается корректно
☐ Все секции отображаются
☐ Адаптивность на мобильных
```
☐ Создание товара с вариантами S/M/L
☐ Кнопка "Быстро добавить S/M/L" работает
☐ Редактирование вариантов
☐ Привязка оптового шаблона к категории
☐ Счётчик категорий в шаблонах
```

---

## 📈 Changelog

### April 4, 2026 — Обновление документации

- 📝 Исправлена структура проекта (salarbaza → DekorHouse)
- 📝 Добавлены Promotions (модели, эндпоинты, страницы)
- 📝 Добавлены новые страницы: PromotionPage, SpecialOffersPage, NewArrivalsPage
- 📝 Добавлены админ-страницы: AdminPromotionsPage, AdminPromotionEditPage, AdminBulkTagsPage
- 📝 Добавлены эндпоинты: bulk-tags, reset-statuses, promotions CRUD, customers-export
- 📝 Обновлены модели БД: 12 → 16 моделей, 4 → 6 enums
- 📝 Добавлен раздел про Landing Page
- 📝 Удалены ссылки на несуществующие файлы (test-seed.ts, data/)
- 📝 Обновлены счётчики компонентов и страниц

### February 11, 2026 — ТЗ 3.0 ✅

- 🆕 **Вариации товара по размеру** (ProductVariant)
  - Модель ProductVariant в БД
  - SizeSelector компонент
  - Автосмена цены при выборе размера
  - Ценовой диапазон в каталоге
  - Размер в корзине, заказе, админке
- 🆕 **Оптовые цены по категориям**
  - Оптовая скидка задаётся на уровне категории (не товара)
  - Автоприменение ко всем товарам категории
  - Таблица оптовых цен на странице товара
  - Расчёт скидки при заказе
- 🆕 **Обновление админ-панели**
  - CRUD вариантов размеров
  - Быстрое добавление S/M/L
  - Размер в заказах
  - Счётчик категорий в шаблонах

### February 3, 2026 — ТЗ 2.0 ✅

- Оптовые цены с шаблонами скидок
- Рекомендации товаров
- Геолокация в заказах
- База клиентов CRM
- Шаблоны описаний по категориям

### January 21, 2026

- Comprehensive README.md
- Admin Panel (6 страниц)

### December 14, 2025

- Initial release
- Full e-commerce functionality
- Telegram Mini App integration
