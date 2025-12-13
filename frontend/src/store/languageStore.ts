import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'uz' | 'ru'

interface LanguageState {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
    uz: {
        // Navigation
        'nav.home': 'Bosh sahifa',
        'nav.catalog': 'Katalog',
        'nav.cart': 'Savat',
        'nav.favorites': 'Sevimlilar',
        'nav.profile': 'Profil',

        // Home
        'home.categories': 'Kategoriyalar',
        'home.featured': 'Mashhur mahsulotlar',
        'home.new': 'Yangi kelganlar',
        'home.viewAll': 'Barchasi',

        // Product
        'product.addToCart': 'Qo\'shish',
        'product.inCart': 'Savatda',
        'product.outOfStock': 'Sotuvda yo\'q',
        'product.colors': 'Ranglar',
        'product.dimensions': 'O\'lchamlar',
        'product.material': 'Material',
        'product.description': 'Tavsif',

        // Cart
        'cart.title': 'Savat',
        'cart.empty': 'Savat bo\'sh',
        'cart.emptyDesc': 'Mahsulotlarni qo\'shing',
        'cart.subtotal': 'Jami',
        'cart.checkout': 'Buyurtma berish',
        'cart.continueShopping': 'Xaridni davom ettirish',

        // Checkout
        'checkout.title': 'Buyurtma',
        'checkout.delivery': 'Yetkazish',
        'checkout.pickup': 'Olib ketish',
        'checkout.address': 'Manzil',
        'checkout.phone': 'Telefon raqami',
        'checkout.name': 'Ismingiz',
        'checkout.comment': 'Izoh',
        'checkout.payment': 'To\'lov usuli',
        'checkout.cash': 'Naqd pul',
        'checkout.card': 'Karta ',
        'checkout.placeOrder': 'Buyurtma berish',

        // Orders
        'orders.title': 'Buyurtmalarim',
        'orders.empty': 'Buyurtmalar yo\'q',
        'orders.status.pending': 'Kutilmoqda',
        'orders.status.confirmed': 'Tasdiqlangan',
        'orders.status.processing': 'Tayyorlanmoqda',
        'orders.status.shipped': 'Yo\'lda',
        'orders.status.delivered': 'Yetkazildi',
        'orders.status.cancelled': 'Bekor qilindi',

        // Common
        'common.search': 'Qidirish...',
        'common.loading': 'Yuklanmoqda...',
        'common.error': 'Xatolik yuz berdi',
        'common.retry': 'Qayta urinish',
        'common.cancel': 'Bekor qilish',
        'common.confirm': 'Tasdiqlash',
        'common.save': 'Saqlash',
        'common.delete': 'O\'chirish',
        'common.edit': 'Tahrirlash',
        'common.back': 'Orqaga',
        'common.sum': 'so\'m',
    },

    ru: {
        // Navigation
        'nav.home': 'Главная',
        'nav.catalog': 'Каталог',
        'nav.cart': 'Корзина',
        'nav.favorites': 'Избранное',
        'nav.profile': 'Профиль',

        // Home
        'home.categories': 'Категории',
        'home.featured': 'Популярные товары',
        'home.new': 'Новинки',
        'home.viewAll': 'Смотреть все',

        // Product
        'product.addToCart': 'В корзину',
        'product.inCart': 'В корзине',
        'product.outOfStock': 'Нет в наличии',
        'product.colors': 'Цвета',
        'product.dimensions': 'Размеры',
        'product.material': 'Материал',
        'product.description': 'Описание',

        // Cart
        'cart.title': 'Корзина',
        'cart.empty': 'Корзина пуста',
        'cart.emptyDesc': 'Добавьте товары',
        'cart.subtotal': 'Итого',
        'cart.checkout': 'Оформить заказ',
        'cart.continueShopping': 'Продолжить покупки',

        // Checkout
        'checkout.title': 'Оформление заказа',
        'checkout.delivery': 'Доставка',
        'checkout.pickup': 'Самовывоз',
        'checkout.address': 'Адрес',
        'checkout.phone': 'Номер телефона',
        'checkout.name': 'Ваше имя',
        'checkout.comment': 'Комментарий',
        'checkout.payment': 'Способ оплаты',
        'checkout.cash': 'Наличные',
        'checkout.card': 'Картой (при получении)',
        'checkout.placeOrder': 'Оформить заказ',

        // Orders
        'orders.title': 'Мои заказы',
        'orders.empty': 'Заказов нет',
        'orders.status.pending': 'Ожидает',
        'orders.status.confirmed': 'Подтверждён',
        'orders.status.processing': 'Готовится',
        'orders.status.shipped': 'В пути',
        'orders.status.delivered': 'Доставлен',
        'orders.status.cancelled': 'Отменён',

        // Common
        'common.search': 'Поиск...',
        'common.loading': 'Загрузка...',
        'common.error': 'Произошла ошибка',
        'common.retry': 'Повторить',
        'common.cancel': 'Отмена',
        'common.confirm': 'Подтвердить',
        'common.save': 'Сохранить',
        'common.delete': 'Удалить',
        'common.edit': 'Редактировать',
        'common.back': 'Назад',
        'common.sum': 'сум',
    },
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'uz',

            setLanguage: (lang) => set({ language: lang }),

            t: (key) => {
                const { language } = get()
                return translations[language][key] || key
            },
        }),
        {
            name: 'dekorhouse-language',
        }
    )
)