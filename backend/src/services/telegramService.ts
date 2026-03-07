import { config } from '../config'
import { formatPrice } from '../utils/helpers'
import { logger } from '../utils/logger'
import { getBot } from '../../bot/index'

export async function sendOrderNotification(order: any) {
    const bot = getBot()

    if (!bot) {
        logger.warn('Cannot send notification: bot not initialized')
        return
    }

    if (!config.adminChatId) {
        logger.warn('Cannot send notification: admin chat not configured')
        return
    }

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
        const size = item.variantSize ? ` [${item.variantSize}]` : ''
        return `  • ${item.productName}${color}${size}\n    ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.total)} so'm`
    }).join('\n')

    // Адрес
    let addressText = ''
    if (order.deliveryAddress) {
        const addr = typeof order.deliveryAddress === 'object'
            ? order.deliveryAddress.address
            : order.deliveryAddress
        if (addr && addr !== 'Геолокация') {
            addressText = `\n📍 *Manzil:* ${addr}`
        }
    }

    // Яндекс Карты
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

    const customerFullName = order.customerLastName
        ? `${order.customerFirstName || order.customerName} ${order.customerLastName}`
        : (order.customerFirstName || order.customerName)

    // ✅ Убраны: deliveryTypeText, Jami (subtotal), Yetkazash (deliveryFee)
    const message = `
🆕 *YANGI BUYURTMA*

📋 *Buyurtma:* \`${order.orderNumber}\`
👤 *Mijoz:* ${customerFullName}
📞 *Telefon:* ${order.customerPhone}
🔗 *Telegram:* ${userInfo}${addressText}${locationLink}
💳 *To'lov:* ${paymentMethodText[order.paymentMethod] || order.paymentMethod}

📦 *Mahsulotlar:*
${itemsList}

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
                ],
            },
        })

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
    const bot = getBot()

    if (!bot) {
        logger.warn('Cannot send status update: bot not initialized')
        return
    }

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