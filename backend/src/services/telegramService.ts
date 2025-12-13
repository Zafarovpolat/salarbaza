import TelegramBot from 'node-telegram-bot-api'
import { config } from '../config'
import { formatPrice } from '../utils/helpers'
import { logger } from '../utils/logger'

let bot: TelegramBot | null = null

export function initBot() {
    if (!config.botToken) {
        logger.warn('Telegram bot token not configured')
        return null
    }

    bot = new TelegramBot(config.botToken, { polling: false })
    return bot
}

export function getBot() {
    return bot
}

interface OrderWithDetails {
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    deliveryType: string
    deliveryAddress: any
    paymentMethod: string
    subtotal: number
    deliveryFee: number
    total: number
    customerNote?: string | null
    items: {
        productName: string
        productCode: string
        colorName?: string | null
        quantity: number
        price: number
        total: number
    }[]
    user: {
        telegramId: bigint
        username?: string | null
        firstName?: string | null
    }
}

export async function sendOrderNotification(order: OrderWithDetails) {
    if (!bot || !config.adminChatId) {
        logger.warn('Cannot send notification: bot or admin chat not configured')
        return
    }

    const deliveryTypeText = order.deliveryType === 'DELIVERY'
        ? '🚚 Yetkazib berish'
        : '🏪 Olib ketish'

    const paymentMethodText: Record<string, string> = {
        CASH: '💵 Naqd',
        CARD: '💳 Karta',
        PAYME: '📱 Payme',
        CLICK: '📱 Click',
        UZUM: '📱 Uzum',
    }

    const itemsList = order.items.map(item => {
        const color = item.colorName ? ` (${item.colorName})` : ''
        return `  • ${item.productName}${color}\n    ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.total)} so'm`
    }).join('\n')

    const address = order.deliveryAddress
        ? `\n📍 Manzil: ${order.deliveryAddress.address || 'Ko\'rsatilmagan'}`
        : ''

    const note = order.customerNote
        ? `\n💬 Izoh: ${order.customerNote}`
        : ''

    const userInfo = order.user.username
        ? `@${order.user.username}`
        : order.user.firstName || 'Noma\'lum'

    const message = `
🆕 *YANGI BUYURTMA*

📋 *Buyurtma:* \`${order.orderNumber}\`
👤 *Mijoz:* ${order.customerName}
📞 *Telefon:* ${order.customerPhone}
🔗 *Telegram:* ${userInfo}

${deliveryTypeText}${address}
💳 *To'lov:* ${paymentMethodText[order.paymentMethod] || order.paymentMethod}

📦 *Mahsulotlar:*
${itemsList}

💰 *Jami:* ${formatPrice(order.subtotal)} so'm
🚚 *Yetkazish:* ${order.deliveryFee > 0 ? formatPrice(order.deliveryFee) + " so'm" : 'Bepul'}
✅ *Umumiy:* *${formatPrice(order.total)} so'm*${note}
`.trim()

    try {
        await bot.sendMessage(config.adminChatId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Tasdiqlash', callback_data: `confirm_${order.id}` },
                        { text: '❌ Bekor qilish', callback_data: `cancel_${order.id}` },
                    ],
                    [
                        { text: '📞 Qo\'ng\'iroq qilish', url: `tel:${order.customerPhone}` },
                    ],
                ],
            },
        })
        logger.info(`Order notification sent for ${order.orderNumber}`)
    } catch (error) {
        logger.error('Failed to send order notification:', error)
    }
}

export async function sendStatusUpdateToUser(
    telegramId: bigint,
    orderNumber: string,
    status: string
) {
    if (!bot) return

    const statusMessages: Record<string, string> = {
        CONFIRMED: `✅ Buyurtmangiz #${orderNumber} tasdiqlandi!`,
        PROCESSING: `📦 Buyurtmangiz #${orderNumber} tayyorlanmoqda...`,
        SHIPPED: `🚚 Buyurtmangiz #${orderNumber} yo'lga chiqdi!`,
        DELIVERED: `🎉 Buyurtmangiz #${orderNumber} yetkazib berildi! Xaridingiz uchun rahmat!`,
        CANCELLED: `❌ Buyurtmangiz #${orderNumber} bekor qilindi.`,
    }

    const message = statusMessages[status]
    if (!message) return

    try {
        await bot.sendMessage(telegramId.toString(), message)
    } catch (error) {
        logger.error('Failed to send status update:', error)
    }
}