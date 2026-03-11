import TelegramBot from 'node-telegram-bot-api'
import { config } from '../src/config'
import { logger } from '../src/utils/logger'
import { prisma } from '../src/config/database'
import { OrderStatus } from '@prisma/client'
import { sendStatusUpdateToUser } from '../src/services/telegramService'
import { formatPrice } from '../src/utils/helpers'

// ✅ FIX: Экранирование Markdown
function escapeMarkdown(text: any): string {
  if (!text) return ''
  return String(text).replace(/([_*`\[\]])/g, '\\$1')
}

export async function handleCallbackQuery(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery
) {
  const chatId = query.message?.chat.id
  const messageId = query.message?.message_id
  const data = query.data

  if (!chatId || !messageId || !data) return

  // Check if admin
  if (chatId.toString() !== config.adminChatId) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Bu amal faqat admin uchun!',
      show_alert: true,
    })
    return
  }

  // ✅ FIX: noop — ничего не делать (для уже обработанных кнопок)
  if (data === 'noop') {
    await bot.answerCallbackQuery(query.id)
    return
  }

  try {
    if (data.startsWith('confirm_')) {
      const orderId = data.replace('confirm_', '')
      await handleConfirmOrder(bot, query, orderId, chatId, messageId)
    } else if (data.startsWith('cancel_')) {
      const orderId = data.replace('cancel_', '')
      await handleCancelOrder(bot, query, orderId, chatId, messageId)
    }
    // ✅ FIX: Добавлены обработчики ship_ и deliver_
    else if (data.startsWith('ship_')) {
      const orderId = data.replace('ship_', '')
      await handleShipOrder(bot, query, orderId, chatId, messageId)
    } else if (data.startsWith('deliver_')) {
      const orderId = data.replace('deliver_', '')
      await handleDeliverOrder(bot, query, orderId, chatId, messageId)
    } else if (data.startsWith('details_')) {
      const orderId = data.replace('details_', '')
      await handleOrderDetails(bot, query, orderId, chatId)
    }
  } catch (error: any) {
    logger.error('Callback query error:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      data: data,
    })
    await bot.answerCallbackQuery(query.id, {
      text: 'Xatolik yuz berdi!',
      show_alert: true,
    })
  }
}

// ────────────────────────────────────────
// ✅ Подтвердить заказ
// ────────────────────────────────────────
async function handleConfirmOrder(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  orderId: string,
  chatId: number,
  messageId: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })

  if (!order) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Buyurtma topilmadi!',
      show_alert: true,
    })
    return
  }

  if (order.status !== OrderStatus.PENDING) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Bu buyurtma allaqachon qayta ishlangan!',
      show_alert: true,
    })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  })

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [{ text: '✅ TASDIQLANDI', callback_data: 'noop' }],
        [
          { text: '📦 Tayyor', callback_data: `ship_${orderId}` },
          { text: '🏠 Topshirildi', callback_data: `deliver_${orderId}` },
        ],
      ],
    },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(
    order.user.telegramId,
    order.orderNumber,
    'CONFIRMED'
  )

  await bot.answerCallbackQuery(query.id, {
    text: '✅ Buyurtma tasdiqlandi!',
  })
}

// ────────────────────────────────────────
// ❌ Отменить заказ
// ────────────────────────────────────────
async function handleCancelOrder(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  orderId: string,
  chatId: number,
  messageId: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })

  if (!order) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Buyurtma topilmadi!',
      show_alert: true,
    })
    return
  }

  if (order.status === OrderStatus.CANCELLED) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Bu buyurtma allaqachon bekor qilingan!',
      show_alert: true,
    })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  })

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [{ text: '❌ BEKOR QILINDI', callback_data: 'noop' }],
      ],
    },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(
    order.user.telegramId,
    order.orderNumber,
    'CANCELLED'
  )

  await bot.answerCallbackQuery(query.id, {
    text: '❌ Buyurtma bekor qilindi!',
  })
}

// ────────────────────────────────────────
// 📦 Заказ готов / отправлен
// ────────────────────────────────────────
async function handleShipOrder(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  orderId: string,
  chatId: number,
  messageId: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })

  if (!order) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Buyurtma topilmadi!',
      show_alert: true,
    })
    return
  }

  if (order.status === OrderStatus.SHIPPED) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Buyurtma allaqachon tayyor deb belgilangan!',
      show_alert: true,
    })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.SHIPPED,
      shippedAt: new Date(),
    },
  })

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [{ text: '📦 TAYYOR', callback_data: 'noop' }],
        [
          {
            text: '🏠 Topshirildi',
            callback_data: `deliver_${orderId}`,
          },
        ],
      ],
    },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(
    order.user.telegramId,
    order.orderNumber,
    'SHIPPED'
  )

  await bot.answerCallbackQuery(query.id, {
    text: '📦 Buyurtma tayyor deb belgilandi!',
  })
}

// ────────────────────────────────────────
// 🏠 Заказ вручён клиенту
// ────────────────────────────────────────
async function handleDeliverOrder(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  orderId: string,
  chatId: number,
  messageId: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  })

  if (!order) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Buyurtma topilmadi!',
      show_alert: true,
    })
    return
  }

  if (order.status === OrderStatus.DELIVERED) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Buyurtma allaqachon topshirilgan!',
      show_alert: true,
    })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.DELIVERED,
      deliveredAt: new Date(),
    },
  })

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [{ text: '🏠 TOPSHIRILDI ✅', callback_data: 'noop' }],
      ],
    },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(
    order.user.telegramId,
    order.orderNumber,
    'DELIVERED'
  )

  await bot.answerCallbackQuery(query.id, {
    text: '🏠 Buyurtma topshirildi!',
  })
}

// ────────────────────────────────────────
// 📋 Детали заказа
// ────────────────────────────────────────
async function handleOrderDetails(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  orderId: string,
  chatId: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
    },
  })

  if (!order) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Buyurtma topilmadi!',
      show_alert: true,
    })
    return
  }

  // ✅ FIX: escapeMarkdown чтобы не ломались названия с _
  const itemsList = order.items
    .map(
      (item) =>
        `• ${escapeMarkdown(item.productName)} x${item.quantity} = ${formatPrice(item.total)} so'm`
    )
    .join('\n')

  const message = `
📋 *Buyurtma #${order.orderNumber}*

👤 Mijoz: ${escapeMarkdown(order.customerName)}
📞 Tel: ${order.customerPhone}

📦 Mahsulotlar:
${itemsList}

💰 Jami: ${formatPrice(order.total)} so'm
📊 Status: ${order.status}
`.trim()

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  } catch {
    // Fallback plain text
    await bot.sendMessage(chatId, message.replace(/[*_`]/g, ''))
  }

  await bot.answerCallbackQuery(query.id)
}