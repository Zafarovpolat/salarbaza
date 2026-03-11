import { config } from '../config'
import { formatPrice } from '../utils/helpers'
import { logger } from '../utils/logger'
import { getBot } from '../../bot/index'

// ✅ FIX: HTML escaping — предотвращает падение уведомлений
// Markdown ломается если в username есть _ или * (напр. @user_name)
function escapeHtml(text: string | null | undefined): string {
    if (!text) return ''
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

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
        const color = item.colorName ? ` (${escapeHtml(item.colorName)})` : ''
        const size = item.variantSize ? ` [${escapeHtml(item.variantSize)}]` : ''
        return `  • ${escapeHtml(item.productName)}${color}${size}\n    ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.total)} so'm`
    }).join('\n')

    const user = order.user || {}
    const userInfo = user.username
        ? `@${escapeHtml(user.username)}`
        : escapeHtml(user.firstName) || 'Noma\'lum'

    const customerFullName = order.customerLastName
        ? `${order.customerFirstName || order.customerName} ${order.customerLastName}`
        : (order.customerFirstName || order.customerName)

    const note = order.customerNote
        ? `\n💬 <b>Izoh:</b> ${escapeHtml(order.customerNote)}`
        : ''

    const discount = order.discount > 0
        ? `\n🏷 <b>Chegirma:</b> -${formatPrice(order.discount)} so'm`
        : ''

    // ✅ FIX: HTML вместо Markdown — работает с любыми символами в именах
    const message = `
🆕 <b>YANGI BUYURTMA</b>

📋 <b>Buyurtma:</b> <code>${order.orderNumber}</code>
👤 <b>Mijoz:</b> ${escapeHtml(customerFullName)}
📞 <b>Telefon:</b> ${escapeHtml(order.customerPhone)}
🔗 <b>Telegram:</b> ${userInfo}
💳 <b>To'lov:</b> ${paymentMethodText[order.paymentMethod] || order.paymentMethod}

📦 <b>Mahsulotlar:</b>
${itemsList}
${discount}
✅ <b>Jami:</b> <b>${formatPrice(order.total)} so'm</b>${note}
`.trim()

    const keyboard = {
        inline_keyboard: [
            [
                { text: '✅ Tasdiqlash', callback_data: `confirm_${order.id}` },
                { text: '❌ Bekor qilish', callback_data: `cancel_${order.id}` },
            ],
        ],
    }

    try {
        await bot.sendMessage(config.adminChatId, message, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
        })

        logger.info(`✅ Order notification sent for ${order.orderNumber}`)
    } catch (error: any) {
        logger.error('HTML notification failed:', {
            message: error?.message || 'Unknown error',
            code: error?.code,
            orderNumber: order.orderNumber
        })

        // ✅ FALLBACK: если даже HTML не прошёл — отправляем без форматирования
        try {
            const plainMessage =
                `🆕 YANGI BUYURTMA\n\n` +
                `📋 ${order.orderNumber}\n` +
                `👤 ${customerFullName}\n` +
                `📞 ${order.customerPhone}\n` +
                `🔗 ${userInfo}\n` +
                `💳 ${paymentMethodText[order.paymentMethod] || order.paymentMethod}\n\n` +
                `📦 Mahsulotlar:\n${items.map((item: any) => {
                    const color = item.colorName ? ` (${item.colorName})` : ''
                    const size = item.variantSize ? ` [${item.variantSize}]` : ''
                    return `  • ${item.productName}${color}${size} - ${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(item.total)} so'm`
                }).join('\n')}\n\n` +
                `✅ Jami: ${formatPrice(order.total)} so'm`

            await bot.sendMessage(config.adminChatId, plainMessage, {
                reply_markup: keyboard,
            })

            logger.info(`✅ Order notification sent (plain fallback) for ${order.orderNumber}`)
        } catch (fallbackError: any) {
            logger.error('All notification attempts failed:', {
                message: fallbackError?.message || 'Unknown error',
                code: fallbackError?.code,
                orderNumber: order.orderNumber
            })
        }
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