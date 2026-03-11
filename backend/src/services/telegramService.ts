import { config } from '../config'
import { formatPrice } from '../utils/helpers'
import { logger } from '../utils/logger'
import { getBot } from '../../bot/index'

// ✅ FIX: Экранирование Markdown спецсимволов
// Именно _ в юзернеймах (@some_user) ломал отправку
function escapeMarkdown(text: any): string {
  if (!text) return ''
  return String(text).replace(/([_*`\[\]])/g, '\\$1')
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
  const itemsList = items
    .map((item: any) => {
      const color = item.colorName ? ` (${escapeMarkdown(item.colorName)})` : ''
      const size = item.variantSize ? ` [${escapeMarkdown(item.variantSize)}]` : ''
      return `  • ${escapeMarkdown(item.productName)}${color}${size}\n    ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.total)} so'm`
    })
    .join('\n')

  // Адрес
  let addressText = ''
  if (order.deliveryAddress) {
    const addr =
      typeof order.deliveryAddress === 'object'
        ? order.deliveryAddress.address
        : order.deliveryAddress
    if (addr && addr !== 'Геолокация') {
      addressText = `\n📍 *Manzil:* ${escapeMarkdown(addr)}`
    }
  }

  // Яндекс Карты
  let locationLink = ''
  if (order.latitude && order.longitude) {
    locationLink = `\n🗺 [Xaritada ko'rish](https://yandex.uz/maps/?pt=${order.longitude},${order.latitude}&z=17&l=map)`
  }

  const note = order.customerNote
    ? `\n💬 *Izoh:* ${escapeMarkdown(order.customerNote)}`
    : ''

  const user = order.user || {}
  // ✅ FIX: юзернейм в бэктиках — не ломает Markdown
  const userInfo = user.username
    ? `\`@${user.username}\``
    : escapeMarkdown(user.firstName || "Noma'lum")

  const customerFullName = order.customerLastName
    ? `${escapeMarkdown(order.customerFirstName || order.customerName)} ${escapeMarkdown(order.customerLastName)}`
    : escapeMarkdown(order.customerFirstName || order.customerName || '')

  // ✅ Скидка
  const discountText =
    order.discount && order.discount > 0
      ? `\n🏷 *Chegirma:* \\-${formatPrice(order.discount)} so'm`
      : ''

  const message = `
🆕 *YANGI BUYURTMA*

📋 *Buyurtma:* \`${order.orderNumber}\`
👤 *Mijoz:* ${customerFullName}
📞 *Telefon:* ${order.customerPhone}
🔗 *Telegram:* ${userInfo}${addressText}${locationLink}
💳 *To'lov:* ${paymentMethodText[order.paymentMethod] || order.paymentMethod}

📦 *Mahsulotlar:*
${itemsList}
${discountText}
💰 *Jami:* *${formatPrice(order.total)} so'm*${note}
`.trim()

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Tasdiqlash', callback_data: `confirm_${order.id}` },
        { text: '❌ Bekor qilish', callback_data: `cancel_${order.id}` },
      ],
    ],
  }

  try {
    await bot.sendMessage(config.adminChatId, message, {
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    })

    // Геолокация отдельным сообщением
    if (order.latitude && order.longitude) {
      await bot.sendLocation(config.adminChatId, order.latitude, order.longitude)
    }

    logger.info(`Order notification sent for ${order.orderNumber}`)
  } catch (error: any) {
    // ✅ FIX: Если Markdown всё равно сломался — отправляем plain text
    if (error?.response?.statusCode === 400) {
      logger.warn(`Markdown failed for ${order.orderNumber}, sending plain text`)
      try {
        const plainMessage = message.replace(/[*_`]/g, '')
        await bot.sendMessage(config.adminChatId, plainMessage, {
          reply_markup: replyMarkup,
        })

        if (order.latitude && order.longitude) {
          await bot.sendLocation(
            config.adminChatId,
            order.latitude,
            order.longitude
          )
        }

        logger.info(`Order notification sent (plain) for ${order.orderNumber}`)
      } catch (fallbackError: any) {
        logger.error('Failed to send even plain notification:', {
          message: fallbackError?.message || 'Unknown error',
          orderNumber: order.orderNumber,
        })
      }
    } else {
      logger.error('Failed to send order notification:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        orderNumber: order.orderNumber,
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
    SHIPPED: `📦 Buyurtmangiz #${orderNumber} tayyor! Olib ketishingiz mumkin.`,
    DELIVERED: `🎉 Buyurtmangiz #${orderNumber} topshirildi!\n\nXaridingiz uchun rahmat! Yana kutib qolamiz 💚`,
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
      telegramId: telegramId.toString(),
    })
  }
}