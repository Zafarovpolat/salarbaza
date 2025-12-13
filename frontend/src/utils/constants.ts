export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'DekorHouseBot'

export const DELIVERY_FEE = 25000 // 25,000 sum

export const FREE_DELIVERY_THRESHOLD = 500000 // Free delivery over 500,000 sum

export const MATERIALS = {
    plastic: { ru: 'Пластик', uz: 'Plastik' },
    metal: { ru: 'Металл', uz: 'Metall' },
    woven: { ru: 'Плетёный', uz: 'To\'qilgan' },
    ceramic: { ru: 'Керамика', uz: 'Keramika' },
}

export const ORDER_STATUSES = {
    PENDING: { ru: 'Ожидает', uz: 'Kutilmoqda', color: 'yellow' },
    CONFIRMED: { ru: 'Подтверждён', uz: 'Tasdiqlangan', color: 'blue' },
    PROCESSING: { ru: 'Готовится', uz: 'Tayyorlanmoqda', color: 'indigo' },
    SHIPPED: { ru: 'В пути', uz: 'Yo\'lda', color: 'purple' },
    DELIVERED: { ru: 'Доставлен', uz: 'Yetkazildi', color: 'green' },
    CANCELLED: { ru: 'Отменён', uz: 'Bekor qilindi', color: 'red' },
}