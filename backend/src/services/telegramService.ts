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

export async function sendOrderNotification(order: any) {
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

    const items = order.items || []
    const itemsList = items.map((item: any) => {
        const color = item.colorName ? ` (${item.colorName})` : ''
        return `  • ${item.productName}${color}\n    ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.total)} so'm`
    }).join('\n')

    // Адрес
    let addressText = ''
    if (order.deliveryAddress) {
        const addr = typeof order.deliveryAddress === 'object'
            ? order.deliveryAddress.address
            : order.deliveryAddress
        addressText = `\n📍 *Manzil:* ${addr}`
    }

    // Ссылка на Яндекс Карты (если есть координаты)
    let locationLink = ''
    if (order.latitude && order.longitude) {
        locationLink = `\n🗺 *Xaritada:* [Yandex Maps](https://yandex.uz/maps/?pt=${order.longitude},${order.latitude}&z=17&l=map)`
    }

    const note = order.customerNote
        ? `\n💬 *Izoh:* ${order.customerNote}`
        : ''

    const user = order.user || {}
    const userInfo = user.username
        ? `@${user.username}`
        : user.firstName || 'Noma\'lum'

    // Полное имя клиента
    const customerFullName = order.customerLastName
        ? `${order.customerFirstName || order.customerName} ${order.customerLastName}`
        : (order.customerFirstName || order.customerName)

    const message = `
🆕 *YANGI BUYURTMA*

📋 *Buyurtma:* \`${order.orderNumber}\`
👤 *Mijoz:* ${customerFullName}
📞 *Telefon:* ${order.customerPhone}
🔗 *Telegram:* ${userInfo}

${deliveryTypeText}${addressText}${locationLink}
💳 *To'lov:* ${paymentMethodText[order.paymentMethod] || order.paymentMethod}

📦 *Mahsulotlar:*
${itemsList}

💰 *Jami:* ${formatPrice(order.subtotal)} so'm
🚚 *Yetkazash:* ${order.deliveryFee > 0 ? formatPrice(order.deliveryFee) + " so'm" : 'Bepul'}
✅ *Umumiy:* *${formatPrice(order.total)} so'm*${note}
`.trim()

    try {
        // Отправляем основное сообщение
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

        // Если есть координаты — отправляем локацию отдельным сообщением
        if (order.latitude && order.longitude) {
            await bot.sendLocation(config.adminChatId, order.latitude, order.longitude)
        }

        logger.info(`Order notification sent for ${order.orderNumber}`)
    } catch (error: any) {
        logger.error('Failed to send order notification:', {
            message: error?.message || 'Unknown error',
            code: error?.code,
            orderNumber: order.orderNumber
        })
    }
}

export async function sendStatusUpdateToUser(
    telegramId: bigint | string,
    orderNumber: string,
    status: string
) {
    if (!bot) return

    const statusMessages: Record<string, string> = {
        CONFIRMED: `✅ Buyurtmangiz #${orderNumber} tasdiqlandi! Tez orada siz bilan bog'lanamiz.`,
        PROCESSING: `📦 Buyurtmangiz #${orderNumber} tayyorlanmoqda...`,
        SHIPPED: `🚚 Buyurtmangiz #${orderNumber} yo'lga chiqdi! Yetkazib beruvchi tez orada siz bilan bog'lanadi.`,
        DELIVERED: `🎉 Buyurtmangiz #${orderNumber} yetkazib berildi!\n\nXaridingiz uchun rahmat! Yana kutib qolamiz 💚`,
        CANCELLED: `❌ Buyurtmangiz #${orderNumber} bekor qilindi.\n\nSavollar bo'lsa, biz bilan bog'laning.`,
    }

    const message = statusMessages[status]
    if (!message) return

    try {
        await bot.sendMessage(telegramId.toString(), message)
    } catch (error: any) {
        logger.error('Failed to send status update:', {
            message: error?.message || 'Unknown error',
            code: error?.code,
            telegramId: telegramId.toString()
        })
    }
}