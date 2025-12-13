# 🏠 DekorHouse - Telegram Mini App

## Project Review & Development Plan

---

## 📋 Оглавление

1. [Обзор проекта](#обзор-проекта)
2. [Технологический стек](#технологический-стек)
3. [Структура проекта](#структура-проекта)
4. [База данных](#база-данных)
5. [API Endpoints](#api-endpoints)
6. [UI/UX Дизайн](#uiux-дизайн)
7. [Функциональность](#функциональность)
8. [План разработки](#план-разработки)
9. [Деплой](#деплой)

---

## 🎯 Обзор проекта

### Описание
**DekorHouse** — Telegram Mini App для продажи декоративных товаров:
- 🪴 Горшки и кашпо (пластик, металл, плетёные)
- 🌿 Искусственные растения
- 🏗️ Подставки для растений

### Целевая аудитория
- Розничные покупатели в Узбекистане
- Оптовые клиенты (магазины, дизайнеры)
- Возраст: 25-55 лет

### Языки
- 🇺🇿 Узбекский (основной)
- 🇷🇺 Русский

### Валюта
- UZS (сўм)

---

## 🛠️ Технологический стек

### Frontend
| Технология | Назначение |
|------------|------------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **Zustand** | State Management |
| **React Router v6** | Routing |
| **@twa-dev/sdk** | Telegram Web App SDK |

### Backend
| Технология | Назначение |
|------------|------------|
| **Node.js** | Runtime |
| **Express.js** | API Framework |
| **PostgreSQL** | Database |
| **Prisma** | ORM |
| **Redis** | Caching & Sessions |
| **node-telegram-bot-api** | Bot API |

### Infrastructure
| Технология | Назначение |
|------------|------------|
| **Vercel** | Frontend Hosting |
| **Railway/Render** | Backend Hosting |
| **Supabase** | PostgreSQL + Storage |
| **Cloudflare** | CDN & Images |

---

## 📁 Структура проекта

```
dekorhouse/
├── 📁 frontend/
│   ├── 📁 public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── manifest.json
│   │
│   ├── 📁 src/
│   │   ├── 📁 assets/
│   │   │   ├── 📁 images/
│   │   │   ├── 📁 icons/
│   │   │   └── 📁 fonts/
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── 📁 ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── 📁 layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── BottomNav.tsx
│   │   │   │   ├── Container.tsx
│   │   │   │   └── Layout.tsx
│   │   │   │
│   │   │   ├── 📁 product/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── ProductDetails.tsx
│   │   │   │   ├── ProductGallery.tsx
│   │   │   │   ├── ColorSelector.tsx
│   │   │   │   └── PriceDisplay.tsx
│   │   │   │
│   │   │   ├── 📁 cart/
│   │   │   │   ├── CartItem.tsx
│   │   │   │   ├── CartList.tsx
│   │   │   │   ├── CartSummary.tsx
│   │   │   │   └── CartButton.tsx
│   │   │   │
│   │   │   ├── 📁 category/
│   │   │   │   ├── CategoryCard.tsx
│   │   │   │   ├── CategoryList.tsx
│   │   │   │   └── CategoryFilter.tsx
│   │   │   │
│   │   │   ├── 📁 search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   └── SearchHistory.tsx
│   │   │   │
│   │   │   ├── 📁 order/
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   ├── OrderConfirmation.tsx
│   │   │   │   ├── OrderHistory.tsx
│   │   │   │   └── OrderStatus.tsx
│   │   │   │
│   │   │   └── 📁 common/
│   │   │       ├── LanguageSwitcher.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── LoadingScreen.tsx
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CatalogPage.tsx
│   │   │   ├── CategoryPage.tsx
│   │   │   ├── ProductPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── OrderSuccessPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── FavoritesPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   │
│   │   ├── 📁 hooks/
│   │   │   ├── useProducts.ts
│   │   │   ├── useCart.ts
│   │   │   ├── useCategories.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useTelegram.ts
│   │   │   ├── useLanguage.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useInfiniteScroll.ts
│   │   │
│   │   ├── 📁 store/
│   │   │   ├── cartStore.ts
│   │   │   ├── userStore.ts
│   │   │   ├── languageStore.ts
│   │   │   ├── filterStore.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── api.ts
│   │   │   ├── productService.ts
│   │   │   ├── categoryService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── userService.ts
│   │   │   └── telegramService.ts
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── formatPrice.ts
│   │   │   ├── formatDate.ts
│   │   │   ├── validators.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── 📁 types/
│   │   │   ├── product.ts
│   │   │   ├── category.ts
│   │   │   ├── cart.ts
│   │   │   ├── order.ts
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 i18n/
│   │   │   ├── uz.json
│   │   │   ├── ru.json
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── animations.css
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── router.tsx
│   │   └── vite-env.d.ts
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── telegram.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 controllers/
│   │   │   ├── productController.ts
│   │   │   ├── categoryController.ts
│   │   │   ├── cartController.ts
│   │   │   ├── orderController.ts
│   │   │   ├── userController.ts
│   │   │   └── webhookController.ts
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── productService.ts
│   │   │   ├── categoryService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── telegramService.ts
│   │   │   ├── paymentService.ts
│   │   │   └── notificationService.ts
│   │   │
│   │   ├── 📁 middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validateTelegram.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── cors.ts
│   │   │
│   │   ├── 📁 routes/
│   │   │   ├── productRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── cartRoutes.ts
│   │   │   ├── orderRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── webhookRoutes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 models/
│   │   │   └── (Prisma handles this)
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── logger.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── 📁 types/
│   │   │   ├── express.d.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── 📁 prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── 📁 migrations/
│   │
│   ├── 📁 bot/
│   │   ├── index.ts
│   │   ├── commands.ts
│   │   ├── handlers.ts
│   │   └── keyboards.ts
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
│
├── 📁 shared/
│   ├── 📁 types/
│   │   └── index.ts
│   └── 📁 constants/
│       └── index.ts
│
├── 📁 data/
│   ├── pots.json
│   ├── artificial_plants.json
│   ├── plant_stands.json
│   └── categories.json
│
├── 📁 docs/
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── README.md
├── docker-compose.yml
└── package.json (workspaces)
```

---

## 🗄️ База данных

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USERS ====================
model User {
  id              String    @id @default(cuid())
  telegramId      BigInt    @unique
  username        String?
  firstName       String?
  lastName        String?
  phone           String?
  language        String    @default("uz")
  
  cart            Cart?
  orders          Order[]
  favorites       Favorite[]
  addresses       Address[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Address {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  title           String    // "Uy", "Ish"
  city            String
  district        String
  street          String
  house           String
  apartment       String?
  landmark        String?   // Ориентир
  isDefault       Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ==================== CATEGORIES ====================
model Category {
  id              String    @id @default(cuid())
  slug            String    @unique
  nameRu          String
  nameUz          String
  descriptionRu   String?
  descriptionUz   String?
  image           String?
  icon            String?
  sortOrder       Int       @default(0)
  isActive        Boolean   @default(true)
  
  products        Product[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ==================== PRODUCTS ====================
model Product {
  id              String    @id @default(cuid())
  code            String    @unique
  slug            String    @unique
  
  nameRu          String
  nameUz          String
  descriptionRu   String?
  descriptionUz   String?
  
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  
  price           Int       // в тийинах (копейки)
  oldPrice        Int?      // для скидок
  
  material        String?
  
  // Размеры (JSON для гибкости)
  dimensions      Json?
  
  inStock         Boolean   @default(true)
  stockQuantity   Int       @default(0)
  
  // Для наборов
  setQuantity     Int       @default(1)
  
  // Упаковка (для artificial_plants)
  packaging       Json?
  
  images          ProductImage[]
  colors          ProductColor[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  favorites       Favorite[]
  
  isActive        Boolean   @default(true)
  isFeatured      Boolean   @default(false)
  isNew           Boolean   @default(false)
  
  viewCount       Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([categoryId])
  @@index([price])
  @@index([isActive, isFeatured])
}

model ProductImage {
  id              String    @id @default(cuid())
  productId       String
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  url             String
  alt             String?
  sortOrder       Int       @default(0)
  isMain          Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
}

model ProductColor {
  id              String    @id @default(cuid())
  productId       String
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  nameRu          String
  nameUz          String
  hexCode         String?   // #FFFFFF
  image           String?   // Фото в этом цвете
  
  inStock         Boolean   @default(true)
  priceModifier   Int       @default(0) // +/- к цене
}

// ==================== CART ====================
model Cart {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  
  items           CartItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model CartItem {
  id              String    @id @default(cuid())
  cartId          String
  cart            Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)
  
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  
  colorId         String?
  quantity        Int       @default(1)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([cartId, productId, colorId])
}

// ==================== ORDERS ====================
model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique // DH-2024-0001
  
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  
  status          OrderStatus @default(PENDING)
  
  items           OrderItem[]
  
  // Сумма
  subtotal        Int         // Сумма товаров
  deliveryFee     Int         @default(0)
  discount        Int         @default(0)
  total           Int         // Итого
  
  // Доставка
  deliveryType    DeliveryType
  addressId       String?
  deliveryAddress Json?       // Снапшот адреса
  
  // Контакты
  customerName    String
  customerPhone   String
  
  // Оплата
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  
  // Заметки
  customerNote    String?
  adminNote       String?
  
  // Даты
  confirmedAt     DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id              String    @id @default(cuid())
  orderId         String
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  
  // Снапшот данных на момент заказа
  productName     String
  productCode     String
  productImage    String?
  colorName       String?
  
  price           Int
  quantity        Int
  total           Int
  
  createdAt       DateTime  @default(now())
}

// ==================== FAVORITES ====================
model Favorite {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@unique([userId, productId])
}

// ==================== ENUMS ====================
enum OrderStatus {
  PENDING       // Ожидает подтверждения
  CONFIRMED     // Подтверждён
  PROCESSING    // Готовится
  SHIPPED       // Отправлен
  DELIVERED     // Доставлен
  CANCELLED     // Отменён
  RETURNED      // Возврат
}

enum DeliveryType {
  PICKUP        // Самовывоз
  DELIVERY      // Доставка
}

enum PaymentMethod {
  CASH          // Наличные
  CARD          // Карта при получении
  PAYME         // Payme
  CLICK         // Click
  UZUM          // Uzum Bank
}

enum PaymentStatus {
  PENDING       // Ожидает
  PAID          // Оплачено
  FAILED        // Ошибка
  REFUNDED      // Возврат
}
```

---

## 🔌 API Endpoints

### Base URL
```
Production: https://api.dekorhouse.uz/v1
Development: http://localhost:3001/api/v1
```

### Endpoints

#### 🏷️ Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Все категории |
| GET | `/categories/:slug` | Категория по slug |
| GET | `/categories/:slug/products` | Товары категории |

#### 📦 Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Список товаров (с пагинацией) |
| GET | `/products/featured` | Рекомендуемые товары |
| GET | `/products/new` | Новинки |
| GET | `/products/search?q=` | Поиск |
| GET | `/products/:slug` | Товар по slug |

#### 🛒 Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Получить корзину |
| POST | `/cart/items` | Добавить в корзину |
| PATCH | `/cart/items/:id` | Обновить количество |
| DELETE | `/cart/items/:id` | Удалить из корзины |
| DELETE | `/cart` | Очистить корзину |

#### 📋 Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | История заказов |
| GET | `/orders/:id` | Детали заказа |
| POST | `/orders` | Создать заказ |
| PATCH | `/orders/:id/cancel` | Отменить заказ |

#### ❤️ Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/favorites` | Список избранного |
| POST | `/favorites/:productId` | Добавить в избранное |
| DELETE | `/favorites/:productId` | Удалить из избранного |

#### 👤 User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/profile` | Профиль пользователя |
| PATCH | `/user/profile` | Обновить профиль |
| GET | `/user/addresses` | Адреса доставки |
| POST | `/user/addresses` | Добавить адрес |
| PATCH | `/user/addresses/:id` | Обновить адрес |
| DELETE | `/user/addresses/:id` | Удалить адрес |

---

## 🎨 UI/UX Дизайн

### Цветовая палитра

```css
:root {
  /* Primary - Зелёный (природа, растения) */
  --primary-50: #f0fdf4;
  --primary-100: #dcfce7;
  --primary-200: #bbf7d0;
  --primary-300: #86efac;
  --primary-400: #4ade80;
  --primary-500: #22c55e;  /* Main */
  --primary-600: #16a34a;
  --primary-700: #15803d;
  --primary-800: #166534;
  --primary-900: #14532d;
  
  /* Secondary - Тёплый бежевый */
  --secondary-50: #fefce8;
  --secondary-100: #fef9c3;
  --secondary-200: #fef08a;
  --secondary-300: #fde047;
  --secondary-400: #facc15;
  --secondary-500: #eab308;
  
  /* Neutral */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Telegram Theme Variables */
  --tg-theme-bg-color: var(--gray-50);
  --tg-theme-text-color: var(--gray-900);
  --tg-theme-hint-color: var(--gray-500);
  --tg-theme-link-color: var(--primary-600);
  --tg-theme-button-color: var(--primary-500);
  --tg-theme-button-text-color: #ffffff;
}
```

### Типографика

```css
/* Шрифты */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Manrope', var(--font-primary);

/* Размеры */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Компоненты дизайна

```
┌─────────────────────────────────────┐
│  🏠 DekorHouse          🔍  🌐 UZ  │  ← Header
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │     🎄 Banner/Slider        │   │
│  │     "Yangi yil aksiyasi!"   │   │
│  └─────────────────────────────┘   │
│                                     │
│  📂 Kategoriyalar                   │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 🪴  │ │ 🌿  │ │ 🏗️  │          │
│  │Guldon│ │O'sim │ │Taglik│          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  ⭐ Mashhur mahsulotlar            │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ IMG │ │ IMG │ │ IMG │          │
│  │Name │ │Name │ │Name │          │
│  │Price│ │Price│ │Price│          │
│  │ 🛒  │ │ 🛒  │ │ 🛒  │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
├─────────────────────────────────────┤
│  🏠    📂    🛒(3)   ❤️    👤    │  ← Bottom Nav
└─────────────────────────────────────┘
```

---

## ⚙️ Функциональность

### 👤 Для покупателей

| Функция | Описание | Приоритет |
|---------|----------|-----------|
| 🏠 Главная | Баннеры, категории, популярные товары | P0 |
| 📂 Каталог | Просмотр по категориям с фильтрами | P0 |
| 🔍 Поиск | Поиск по названию и коду | P0 |
| 📦 Карточка товара | Фото, описание, цвета, размеры | P0 |
| 🛒 Корзина | Добавление, изменение количества | P0 |
| 📋 Оформление заказа | Адрес, оплата, комментарий | P0 |
| 📜 История заказов | Список и статусы заказов | P1 |
| ❤️ Избранное | Сохранение понравившихся товаров | P1 |
| 🌐 Мультиязычность | UZ / RU переключение | P0 |
| 👤 Профиль | Данные, адреса, настройки | P1 |
| 🔔 Уведомления | Статус заказа в Telegram | P1 |

### 👨‍💼 Для администратора (Telegram Bot)

| Функция | Описание | Приоритет |
|---------|----------|-----------|
| 📬 Новые заказы | Уведомление о новом заказе | P0 |
| ✅ Управление заказами | Подтверждение, отмена | P0 |
| 📊 Статистика | Продажи за день/неделю/месяц | P2 |
| 📦 Управление товарами | Добавление, редактирование | P2 |

---

## 📅 План разработки

### Фаза 1: MVP (2 недели)

#### Неделя 1
| День | Задачи |
|------|--------|
| 1-2 | Setup проекта, структура, конфигурация |
| 3-4 | База данных, Prisma schema, seed данных |
| 5 | API: категории, товары |
| 6-7 | Frontend: Layout, Header, BottomNav |

#### Неделя 2
| День | Задачи |
|------|--------|
| 8-9 | Frontend: HomePage, CatalogPage, ProductPage |
| 10-11 | Корзина (store + UI + API) |
| 12-13 | Оформление заказа, OrderSuccess |
| 14 | Telegram Bot для admin уведомлений |

### Фаза 2: Улучшения (1 неделя)

| День | Задачи |
|------|--------|
| 15-16 | Избранное, История заказов |
| 17-18 | Поиск, Фильтры |
| 19-20 | Профиль, Адреса |
| 21 | Тестирование, багфиксы |

### Фаза 3: Polish & Deploy (3-4 дня)

| День | Задачи |
|------|--------|
| 22 | UI polish, анимации |
| 23 | Performance оптимизация |
| 24 | Деплой, настройка домена |
| 25 | Финальное тестирование |

---

## 🚀 Деплой

### Frontend (Vercel)

```bash
# vercel.json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Backend (Railway)

```bash
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables

```env
# Frontend (.env)
VITE_API_URL=https://api.dekorhouse.uz
VITE_BOT_USERNAME=DekorHouseBot

# Backend (.env)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
BOT_TOKEN=123456:ABC...
ADMIN_CHAT_ID=123456789
JWT_SECRET=your-secret
WEBAPP_URL=https://dekorhouse.uz
```

### Telegram Bot Setup

```
1. Создать бота через @BotFather
2. Получить BOT_TOKEN
3. Настроить Menu Button → Web App URL
4. Настроить команды:
   /start - Начать
   /catalog - Каталог
   /cart - Корзина
   /orders - Мои заказы
   /help - Помощь
```

---

## 📊 Метрики успеха

| Метрика | Цель |
|---------|------|
| Время загрузки | < 2 сек |
| Lighthouse Score | > 90 |
| Конверсия в заказ | > 3% |
1. **Инициализации проекта** (package.json, конфиги)
2. **Prisma schema** и seed файла
3. **Frontend базовых компонентов**