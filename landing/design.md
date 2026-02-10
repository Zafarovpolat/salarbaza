# 🎨 DekorHouse Design System

## Документ дизайн-системы

**Источник:** Лендинг decorhouse.uz
**Применение:** Telegram Mini App (React + Tailwind)
**Версия:** 1.0
**Дата:** Февраль 2026

---

## 📋 Оглавление

1. [Цветовая палитра](#1-цветовая-палитра)
2. [Типографика](#2-типографика)
3. [Отступы и сетка](#3-отступы-и-сетка)
4. [Border Radius](#4-border-radius)
5. [Тени](#5-тени)
6. [Анимации](#6-анимации)
7. [Компоненты](#7-компоненты)
8. [Иконки](#8-иконки)
9. [Паттерны и декоративные элементы](#9-паттерны-и-декоративные-элементы)
10. [Адаптивность](#10-адаптивность)
11. [Tailwind Config](#11-tailwind-config)

---

## 1. Цветовая палитра

### Основные (Green Family)

| Токен       | HEX       | Использование                            |
| ----------- | --------- | ---------------------------------------- |
| `--forest`  | `#1B4332` | Основной акцент, кнопки, лого, навигация |
| `--emerald` | `#2D6A4F` | Hover состояния, градиенты               |
| `--sage`    | `#40916C` | Вторичный акцент, градиенты, иконки      |
| `--mint`    | `#52B788` | Акцентные точки, бейджи, декор           |

### Нейтральные (Warm Neutrals)

| Токен     | HEX       | Использование                      |
| --------- | --------- | ---------------------------------- |
| `--cream` | `#FFFCF5` | Основной фон приложения (body)     |
| `--ivory` | `#FAF8F3` | Фон карточек, секций               |
| `--sand`  | `#F0EBE3` | Фон инпутов, переключателей        |
| `--stone` | `#E5DFD5` | Границы, разделители               |
| `--taupe` | `#C4BAA8` | Placeholder текст, мелкие элементы |

### Текст

| Токен           | HEX       | Использование                   |
| --------------- | --------- | ------------------------------- |
| `--charcoal`    | `#2C2C2C` | Заголовки, основной текст       |
| `--dark-gray`   | `#4A4A4A` | Body текст (основной цвет body) |
| `--medium-gray` | `#7A7A7A` | Подписи, вторичный текст        |
| `--light-gray`  | `#A0A0A0` | Зачёркнутые цены, disabled      |

### Акцентные

| Токен               | HEX       | Использование                        |
| ------------------- | --------- | ------------------------------------ |
| `--terracotta`      | `#C67C4E` | Бейджи скидок, сердечки, badge-count |
| `--terracotta-dark` | `#B86B4C` | Hover терракоты                      |
| `--blush`           | `#E8D5CC` | Декоративные фоны                    |
| `--olive`           | `#7C8B6F` | Дополнительный зелёный               |

### Системные

| Токен       | HEX       | Использование  |
| ----------- | --------- | -------------- |
| `--success` | `#40916C` | Успех (= sage) |
| `--warning` | `#D4A853` | Предупреждения |
| `--error`   | `#C45B5B` | Ошибки         |

### Градиенты

```css
/* Hero / CTA / Offers секция */
background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 40%, #40916C 100%);

/* CTA баннер */
background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%);

/* Feature icon */
background: linear-gradient(135deg, #1B4332, #40916C);

/* Overlay на изображениях */
background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);

/* Overlay на проектах */
background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
2. Типографика
Шрифты

Заголовки: Playfair Display (400, 500, 600) — serif
Основной:  DM Sans (400, 500, 600, 700)    — sans-serif
Иерархия размеров
Элемент	Mobile	Desktop	Weight	Font
Hero title	36px / 1.15	52px / 1.15	500	Playfair
Section title	28px / 1.2	34px / 1.2	500	Playfair
CTA title	32px / 1.2	42px / 1.2	500	Playfair
Category card name	18px / 1.3	18px / 1.3	500	Playfair
Product card name	15px / 1.3	15px / 1.3	500	Playfair
Offer card name	16px / 1.3	16px / 1.3	500	Playfair
Project card title	20px / 1.3	20px / 1.3	500	Playfair
Feature title	16px / -	16px / -	500	Playfair
Stat number	28px / 1.2	28px / 1.2	600	Playfair
Header logo	22px / -	22px / -	600	Playfair
Footer brand	24px / -	24px / -	500	Playfair
Testimonial quote	32px / 1	32px / 1	-	Playfair
Price (product card)	16px / -	16px / -	700	DM Sans
Price (offer new)	18px / -	18px / -	700	DM Sans
Body / hero desc	15px / 1.7	17px / 1.7	400	DM Sans
Section subtitle	14px / -	14px / -	400	DM Sans
Section link	14px / -	14px / -	600	DM Sans
Button text	14px / -	14px / -	600	DM Sans
Add to cart btn	13px / -	13px / -	600	DM Sans
Search input	15px / -	15px / -	400	DM Sans
Category count	12px / -	12px / -	500	DM Sans
Category label (card)	11px / -	11px / -	600	DM Sans
Badge text	11px / -	11px / -	700	DM Sans
Product new badge	10px / -	10px / -	600	DM Sans
Nav label	10px / -	10px / -	500/600	DM Sans
Badge count	10px / -	10px / -	700	DM Sans
Lang toggle btn	12px / -	12px / -	600	DM Sans
Feature desc	13px / 1.5	13px / 1.5	400	DM Sans
Stat label	12px / -	12px / -	500	DM Sans
Testimonial text	14px / 1.7	14px / 1.7	400	DM Sans
Testimonial name	14px / -	14px / -	600	DM Sans
Testimonial role	12px / -	12px / -	400	DM Sans
Footer col title	13px / -	13px / -	600	DM Sans
Footer links	14px / -	14px / -	400	DM Sans
Footer bottom	13px / -	13px / -	400	DM Sans
Стили текста
CSS

/* Uppercase labels */
text-transform: uppercase;
letter-spacing: 0.05em — 0.15em (зависит от контекста)

/* Обрезка текста (2 строки) */
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;

/* Tracking (letter-spacing) */
Logo:             -0.01em
Hero title:       -0.02em
Button:            0.04em
Badge:             0.05em
Category label:    0.06em
Product cat label: 0.06em
Offer category:    0.08em
New badge:         0.08em
Section link:      -
Lang toggle:       0.05em
Footer col title:  0.1em
Hero badge:        0.1em
Project type:      0.1em
CTA overline:      0.15em
3. Отступы и сетка
Контейнер
CSS

max-width: 1280px;
margin: 0 auto;
padding: 0 16px;         /* mobile */
padding: 0 24px;         /* sm (640px) */
padding: 0 32px;         /* lg (1024px) */
Секции (вертикальные отступы)
CSS

padding: 48px 0;          /* mobile */
padding: 64px 0;          /* md (768px) */
padding: 80px 0;          /* lg (1024px) */
Product Grid
CSS

/* Mobile: 2 колонки */
grid-template-columns: repeat(2, 1fr);
gap: 12px;
padding: 0 16px;

/* sm (640px): 3 колонки */
grid-template-columns: repeat(3, 1fr);
gap: 16px;
padding: 0 24px;

/* lg (1024px): 4 колонки */
grid-template-columns: repeat(4, 1fr);
gap: 24px;
padding: 0 32px;
Features Grid
CSS

/* Mobile: 2 колонки */
grid-template-columns: repeat(2, 1fr);
gap: 12px;

/* md (768px): 4 колонки */
grid-template-columns: repeat(4, 1fr);
gap: 16px;
Горизонтальные скролл-списки
CSS

display: flex;
gap: 14px;
overflow-x: auto;
padding: 0 16px 16px;    /* mobile */
padding: 0 24px 16px;    /* sm */
scrollbar-width: none;
scroll-snap-type: x mandatory;
scroll-snap-align: start; /* каждый элемент */
4. Border Radius
Элемент	Radius
Кнопки (все)	9999px (full)
Badges	9999px
Lang toggle	9999px
Search input	9999px
Icon button	50%
Heart button	50%
Stat circle	50%
Hero section	24px / 32px (md)
Category card	24px
Product card	20px
Product image area	14px
Offer card	20px
Offer image area	14px
Project card	24px
Feature card	20px
Feature icon box	16px
Testimonial card	24px
CTA banner	32px
Bottom nav	24px 24px 0 0
Toast	12px
Add to cart button	12px
Footer social icon	12px
Section header margin-bottom	28px
5. Тени
CSS

/* Header при скролле */
box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);

/* Card hover */
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);    /* product card */
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);     /* category card */
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);     /* project card */
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);     /* offer card */

/* Stat item hover */
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

/* Feature card hover */
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);

/* Primary button hover */
box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);

/* Green button hover */
box-shadow: 0 4px 12px rgba(27, 67, 50, 0.25);

/* Bottom nav */
box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);

/* Toast */
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
6. Анимации
Transitions
CSS

/* Стандартный */
transition: all 0.3s ease;

/* Кнопки */
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

/* Изображения (zoom) */
transition: transform 0.6s ease;

/* Scroll reveal */
transition: all 0.6s cubic-bezier(0, 0, 0.2, 1);
Hover эффекты
CSS

/* Card lift */
transform: translateY(-4px);

/* Button lift */
transform: translateY(-2px);

/* Add to cart lift */
transform: translateY(-1px);

/* Image zoom */
transform: scale(1.05);       /* product/offer */
transform: scale(1.08);       /* category card */

/* Heart scale */
transform: scale(1.1);

/* Section link — gap увеличивается */
gap: 4px → 8px;
Keyframes
CSS

/* Fade in up (hero elements) */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
/* Delays: 0.2s, 0.4s, 0.6s, 0.8s */

/* Pulse dot (hero badge) */
@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.6; transform: scale(1.3); }
}

/* Skeleton shimmer */
@keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
Scroll Reveal
CSS

/* Initial state */
.reveal {
    opacity: 0;
    transform: translateY(20px);
}

/* Visible */
.reveal.visible {
    opacity: 1;
    transform: translateY(0);
}

/* IntersectionObserver config */
threshold: 0.1
rootMargin: '0px 0px -40px 0px'
Toast
CSS

/* Hidden */
transform: translateX(-50%) translateY(100px);
opacity: 0;

/* Visible */
transform: translateX(-50%) translateY(0);
opacity: 1;
transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); /* bounce */
7. Компоненты
7.1 Header

Высота: 64px
Фон: rgba(255, 252, 245, 0.92) + backdrop-blur(20px)
Border-bottom: 1px solid rgba(229, 223, 213, 0.5)
Position: fixed, top: 0, z-index: 1000
Scrolled: + box-shadow: 0 2px 20px rgba(0,0,0,0.06)

Содержимое:
├── Logo: Playfair Display, 22px, 600, color: forest
│   └── span: color: sage, weight: 400
├── Lang toggle: bg: sand, rounded-full, p: 3px
│   └── Btn: 12px, 600, uppercase, tracking 0.05em
│       ├── Active: bg: forest, color: white
│       └── Inactive: bg: transparent, color: medium-gray
├── Icon buttons: 40x40, rounded-full, transparent
│   └── Hover: bg: sand
│   └── SVG: 22x22, stroke: currentColor, strokeWidth: 1.5
└── Badge count: 18x18, bg: terracotta, white, 10px, 700
7.2 Bottom Nav

Высота: 70px
Фон: white
Shadow: 0 -4px 20px rgba(0,0,0,0.05)
Border-radius: 24px 24px 0 0
Position: fixed, bottom: 0, z-index: 1000
padding-bottom: env(safe-area-inset-bottom)

Items (5):
├── Icon: 24x24, strokeWidth: 1.5
│   ├── Active: stroke: forest
│   └── Inactive: stroke: medium-gray
├── Label: 10px
│   ├── Active: color: forest, weight: 600
│   └── Inactive: color: medium-gray, weight: 500
└── Active indicator: 32x3px bar, bg: forest, absolute top: 0
7.3 Buttons
Primary (Hero — белая на зелёном фоне)

padding: 16px 32px
background: white
color: forest
border: none
border-radius: 9999px
font: DM Sans, 14px, 600
text-transform: uppercase
letter-spacing: 0.04em
hover: translateY(-2px), shadow 0 8px 25px rgba(0,0,0,0.2)
Secondary (Hero — прозрачная с рамкой)

padding: 16px 32px
background: transparent
color: white
border: 1.5px solid rgba(255,255,255,0.4)
border-radius: 9999px
font: DM Sans, 14px, 600
uppercase, tracking 0.04em
hover: bg rgba(255,255,255,0.15), border rgba(255,255,255,0.6)
Green (Показать ещё)

Same as primary but:
background: forest
color: white
hover: bg emerald, shadow 0 4px 12px rgba(27,67,50,0.25)
Add to Cart

width: 100%
padding: 12px
background: forest
color: white
border: none
border-radius: 12px
font: DM Sans, 13px, 600
hover: bg emerald, translateY(-1px)
icon: 16x16, strokeWidth: 2
7.4 Product Card

Background: ivory (#FAF8F3)
Border-radius: 20px
Hover: translateY(-4px), shadow 0 8px 30px rgba(0,0,0,0.08)

Image area:
├── aspect-ratio: 1/1
├── margin: 10px
├── border-radius: 14px
├── background: sand (#F0EBE3)
├── Image: object-fit cover, hover scale(1.05)
├── New badge: absolute top-10 left-10
│   bg: forest, white, 10px, 600, uppercase, tracking 0.08em
│   padding: 5px 10px, rounded-full
├── Heart: absolute top-10 right-10
│   32x32, bg: white/85, rounded-full
│   opacity: 0 → hover: 1
│   SVG: 16x16, strokeWidth: 2
│   Liked: fill: terracotta, stroke: terracotta

Content:
├── padding: 4px 14px 16px
├── text-align: center
├── Category: 11px, uppercase, tracking 0.06em, color: taupe, 600
├── Name: Playfair, 15px, 500, color: charcoal, line-clamp: 2
└── Price: 16px, 700, color: forest
    └── Old price: 13px, 400, color: light-gray, line-through, ml: 6px
7.5 Offer Card

Width: 260px (mobile) / 280px (md)
Background: white
Border-radius: 20px
Hover: translateY(-4px), shadow 0 12px 40px rgba(0,0,0,0.15)

Image area:
├── aspect-ratio: 1/1
├── margin: 10px
├── border-radius: 14px
├── background: ivory
├── Sale badge: absolute top-12 left-12
│   bg: terracotta, white, 11px, 700, uppercase, tracking 0.05em
│   padding: 6px 12px
├── Heart: absolute top-12 right-12
│   36x36, bg: white/90 + backdrop-blur(8px)
│   SVG: 18x18, stroke: terracotta

Content:
├── padding: 4px 16px 16px
├── Category: 11px, uppercase, tracking 0.08em, medium-gray, 600
├── Name: Playfair, 16px, 500, charcoal
├── Prices: flex, gap 8px
│   ├── New: 18px, 700, forest
│   └── Old: 14px, 400, light-gray, line-through
└── Button: full-width add to cart (see 7.3)
7.6 Category Card

Width: 160px (mobile) / 200px (md)
aspect-ratio: 3/4
border-radius: 24px
scroll-snap-align: start
Hover: translateY(-4px), shadow 0 8px 30px rgba(0,0,0,0.12)

Layers:
├── Image: absolute, object-fit cover, hover scale(1.08)
├── Overlay: gradient to top, black/60 → black/10 → transparent
└── Content: absolute bottom-20 left-20 right-20
    ├── Name: Playfair, 18px, 500, white
    └── Count: 12px, 500, white/70
7.7 Feature Card

Background: ivory
Border-radius: 20px
Padding: 24px 20px
text-align: center
Hover: translateY(-4px), shadow 0 8px 30px rgba(0,0,0,0.06)

Icon box:
├── 56x56
├── bg: gradient(135deg, forest, sage)
├── border-radius: 16px
├── margin: 0 auto 16px
└── SVG: 26x26, white, strokeWidth: 1.5

Title: Playfair, 16px, 500, charcoal, mb: 6px
Desc: 13px, medium-gray, line-height: 1.5
7.8 Testimonial Card

Width: 300px (flex-none)
Background: ivory
Border-radius: 24px
Padding: 28px

Quote: Playfair, 32px, color: sage
Text: 14px, dark-gray, line-height: 1.7, mb: 20px
Stars: color: warning (#D4A853), 14px, letter-spacing: 2px

Author:
├── Avatar: 44x44, rounded-full, bg: sand, emoji 20px
├── Name: 14px, 600, charcoal
└── Role: 12px, medium-gray
7.9 Project Card

aspect-ratio: 4/3
border-radius: 24px
Hover: translateY(-4px), shadow 0 12px 40px rgba(0,0,0,0.12)

Image: absolute, object-fit cover, hover scale(1.05)
Overlay: gradient to top, black/65 → black/10 → transparent

Content: absolute bottom-24 left-24 right-24
├── Type: 11px, uppercase, tracking 0.1em, mint, 600
└── Title: Playfair, 20px, 500, white
7.10 Search Input

padding: 14px 18px 14px 48px
background: sand (#F0EBE3)
border: 2px solid transparent
border-radius: 9999px
font: DM Sans, 15px
placeholder color: taupe
focus:
├── background: white
├── border-color: forest
└── box-shadow: 0 0 0 4px rgba(27,67,50,0.08)

Search icon: absolute left-18, 20x20, stroke: taupe, strokeWidth: 2
7.11 Toast

Position: fixed, bottom: 90px, centered
Background: charcoal
Color: white
Padding: 14px 24px
Border-radius: 12px
Font: 14px, 500
Shadow: 0 8px 30px rgba(0,0,0,0.2)
Duration: 2500ms
Icon: 20x20, stroke: mint, strokeWidth: 2

Animation: translateY(100px) → translateY(0)
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — bounce
7.12 Stat Item

Background: ivory
Border-radius: 20px
Padding: 16px 20px
flex: 1, min-width: 140px, max-width: 200px
Hover: translateY(-2px), shadow 0 4px 20px rgba(0,0,0,0.06)

Number: Playfair, 28px, 600, forest
Label: 12px, 500, medium-gray, text-align center
7.13 Lang Toggle

Container: bg: sand, rounded-full, padding: 3px, gap: 2px
Button: padding 6px 14px, rounded-full
├── Active: bg: forest, color: white
└── Inactive: bg: transparent, color: medium-gray
Font: DM Sans, 12px, 600, uppercase, tracking 0.05em
7.14 Section Header

display: flex, align-items: flex-end, justify-content: space-between
margin-bottom: 28px
padding: 0 16px / 0 24px (sm) / 0 32px (lg)

Title: Playfair, 28px (mobile) / 34px (md), 500, charcoal
Subtitle: 14px, medium-gray, 400, mt: 6px

Link: 14px, 600, forest, flex, gap: 4px
├── Hover: gap 8px, color: emerald
└── Arrow icon: 18x18, strokeWidth: 2
7.15 CTA Banner

max-width: 900px
Background: gradient(135deg, forest → emerald → sage)
Border-radius: 32px
Padding: 48px 32px
text-align: center, color: white

Overline: 11px, uppercase, tracking 0.15em, mint, 600
Title: Playfair, 32px / 42px (md), 500
Desc: 15px, opacity 0.8, max-width: 500px, mx: auto
Buttons: centered, gap: 12px

Decorative: 🌿 120px rotate(15deg), 🍃 80px rotate(-20deg), opacity 0.08
7.16 Footer

Background: charcoal (#2C2C2C)
Color: white
Padding: 48px 16px 24px / 64px 24px 32px (md)

Grid:
├── Mobile: 1 column
└── md: 2fr 1fr 1fr 1fr, gap: 40px

Brand: Playfair, 24px, 500, span color: mint
Desc: 14px, white/60, max-width: 300px
Social: 40x40, bg: white/10, rounded-12px, hover: bg forest

Col title: 13px, uppercase, tracking 0.1em, 600, white/50
Links: 14px, white/70, hover: white

Bottom: border-top: 1px white/10, pt: 24px
Text: 13px, white/40
8. Иконки
Стиль

Библиотека: Lucide (или SVG inline)
Размер по умолчанию: stroke, не fill
stroke-width: 1.5 (навигация, header)
stroke-width: 2.0 (кнопки, search icon, heart)
fill: none (по умолчанию)
fill: currentColor (liked heart)
Размеры
Контекст	Размер
Header icons	22x22
Nav icons	24x24
Search icon	20x20
Button icon	16x16
Section link	18x18
Feature icon	26x26
Heart (product)	16x16
Heart (offer)	18x18
Toast icon	20x20
Timer icon	16x16
Используемые иконки

Home        — house with chimney
Search      — circle + diagonal line
ShoppingBag — bag shape
Heart       — heart path
User        — person + circle
ChevronRight — arrow right
Shield      — shield shape
FileText    — document
Truck       — delivery truck
Clock       — circle + hands
Check       — checkmark (toast)
9. Паттерны и декоративные элементы
Cross Pattern (Hero)
CSS

opacity: 0.08;
background-image: url("data:image/svg+xml,..."); /* + кресты */
Декоративные круги
CSS

/* Большой */
width: 450px; height: 450px; border-radius: 50%;
background: rgba(255,255,255,0.05);

/* Средний */
width: 250px-400px; height: same; border-radius: 50%;
background: rgba(255,255,255,0.03-0.04);
Emoji как декор

🌿 — Hero leaf: 120px/200px, opacity 0.12, rotate -15deg
🌿 — CTA: 120px, opacity 0.08, rotate 15deg
🍃 — CTA: 80px, opacity 0.08, rotate -20deg
Skeleton Loading
CSS

background: linear-gradient(90deg, #F0EBE3 25%, #FAF8F3 50%, #F0EBE3 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
border-radius: 8px;
10. Адаптивность
Breakpoints

sm:  640px  — 3 колонки, padding 24px
md:  768px  — hero 600px, 4-col features, title 34px
lg:  1024px — 4 колонки, padding 32px, phone mockup
Ключевые изменения
Элемент	Mobile	md (768px)	lg (1024px)
Hero height	min-h 520px	min-h 600px	-
Hero radius	24px	32px	-
Hero margin	12px 16px	16px 24px	-
Hero title	36px	52px	-
Hero desc	15px	17px	-
Hero content	full width	max-w 65%	-
Section pad	48px 0	64px 0	80px 0
Grid cols	2	-	4
Grid gap	12px	-	24px
Container pad	16px	24px	32px
Category card	160px	200px	-
Offer card	260px	280px	-
Features	2 cols	4 cols	-
CTA title	32px	42px	-
Footer grid	1 col	4 cols	-
Leaf emoji	120px, right 20px	200px, right 60px	-
Элементы только для мобильного

- Горизонтальный скролл (categories, offers, testimonials)
- Product card heart opacity: 0 → hover: 1 (desktop only)
- Bottom nav visible на всех размерах
11. Tailwind Config
JavaScript

// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest:       '#1B4332',
        emerald:      '#2D6A4F',
        sage:         '#40916C',
        mint:         '#52B788',
        cream:        '#FFFCF5',
        ivory:        '#FAF8F3',
        sand:         '#F0EBE3',
        stone:        '#E5DFD5',
        taupe:        '#C4BAA8',
        charcoal:     '#2C2C2C',
        'dark-gray':  '#4A4A4A',
        'medium-gray':'#7A7A7A',
        'light-gray': '#A0A0A0',
        terracotta:   { DEFAULT: '#C67C4E', dark: '#B86B4C' },
        blush:        '#E8D5CC',
        olive:        '#7C8B6F',
        success:      '#40916C',
        warning:      '#D4A853',
        error:        '#C45B5B',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft':       '0 2px 20px rgba(0,0,0,0.06)',
        'card':       '0 8px 30px rgba(0,0,0,0.08)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.12)',
        'button':     '0 8px 25px rgba(0,0,0,0.2)',
        'nav':        '0 -4px 20px rgba(0,0,0,0.05)',
        'toast':      '0 8px 30px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0,0,0.2,1)',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.3)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
Шпаргалка: Быстрые Tailwind-классы
text

// Фоны
bg-cream          → основной фон
bg-ivory          → карточки
bg-sand           → инпуты, toggles
bg-forest         → кнопки, акцент
bg-terracotta     → sale badge

// Текст
text-charcoal     → заголовки
text-dark-gray    → body
text-medium-gray  → подписи
text-light-gray   → disabled, зачёркнутые
text-forest       → акцент, цены
text-taupe        → placeholder

// Заголовки
font-display      → Playfair Display
font-sans         → DM Sans

// Карточки
rounded-2xl       → 20px (product, offer, feature)
rounded-3xl       → 24px (category, hero, testimonial)
rounded-4xl       → 32px (hero md, CTA)
rounded-full      → кнопки, badges

// Тени
shadow-soft       → header
shadow-card       → card hover
shadow-card-hover → strong hover
shadow-nav        → bottom nav
shadow-toast      → toast
```
