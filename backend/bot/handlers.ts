import TelegramBot from 'node-telegram-bot-api'
import { config } from '../src/config'
import { logger } from '../src/utils/logger'
import { prisma } from '../src/config/database'
import { OrderStatus } from '@prisma/client'
import { sendStatusUpdateToUser } from '../src/services/telegramService'
import { formatPrice } from '../src/utils/helpers'
import { getLanguageKeyboard, getOpenShopKeyboard } from './keyboards'

function escapeMarkdown(text: any): string {
  if (!text) return ''
  return String(text).replace(/([_*`\[\]])/g, '\\$1')
}

// ── Сохранить язык пользователя в БД ──────────────────────────────────────
async function saveUserLanguage(telegramId: number, lang: 'uz' | 'ru') {
  try {
    await prisma.user.upsert({
      where:  { telegramId: BigInt(telegramId) },
      update: { language: lang },
      create: {
        telegramId: BigInt(telegramId),
        language:   lang,
      },
    })
  } catch (error: any) {
    logger.error('Failed to save user language:', error?.message)
  }
}

export async function handleCallbackQuery(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery
) {
  const chatId    = query.message?.chat.id
  const messageId = query.message?.message_id
  const data      = query.data
  const telegramId = query.from.id

  if (!chatId || !messageId || !data) return

  // ── noop ──────────────────────────────────────────────────────────────
  if (data === 'noop') {
    await bot.answerCallbackQuery(query.id)
    return
  }

  // ── Смена языка ───────────────────────────────────────────────────────
  if (data === 'change_lang') {
    await bot.answerCallbackQuery(query.id)
    await bot.sendMessage(
      chatId,
      '🌐 Qaysi tilda davom ettirish sizga qulay?\nНа каком языке вам удобнее?',
      { reply_markup: getLanguageKeyboard() }
    )
    return
  }

  // ── Выбор языка ───────────────────────────────────────────────────────
  if (data === 'lang_uz' || data === 'lang_ru') {
    const lang = data === 'lang_uz' ? 'uz' : 'ru'

    // Сохраняем язык в БД
    await saveUserLanguage(telegramId, lang)

    // Подтверждение выбора
    const confirmText = lang === 'uz'
      ? "Til tanlandi: O'zbekcha ✅\n\nOnlayn do'konimizni ochish uchun quyidagi tugmani bosing."
      : 'Язык выбран: Русский ✅\n\nЧтобы открыть наш интернет-магазин, нажмите на кнопку ниже.'

    // Редактируем сообщение с кнопками языка
    try {
      await bot.editMessageText(confirmText, {
        chat_id:      chatId,
        message_id:   messageId,
        reply_markup: getOpenShopKeyboard(lang),
      })
    } catch {
      // Если редактирование не удалось — отправляем новое
      await bot.sendMessage(chatId, confirmText, {
        reply_markup: getOpenShopKeyboard(lang),
      })
    }

    await bot.answerCallbackQuery(query.id, {
      text: lang === 'uz' ? "Til saqlandi ✅" : 'Язык сохранён ✅',
    })
    return
  }

  // ── Только для админа: заказы ─────────────────────────────────────────
  if (chatId.toString() !== config.adminChatId) {
    await bot.answerCallbackQuery(query.id, {
      text: 'Bu amal faqat admin uchun!',
      show_alert: true,
    })
    return
  }

  try {
    if (data.startsWith('confirm_')) {
      await handleConfirmOrder(bot, query, data.replace('confirm_', ''), chatId, messageId)
    } else if (data.startsWith('cancel_')) {
      await handleCancelOrder(bot, query, data.replace('cancel_', ''), chatId, messageId)
    } else if (data.startsWith('ship_')) {
      await handleShipOrder(bot, query, data.replace('ship_', ''), chatId, messageId)
    } else if (data.startsWith('deliver_')) {
      await handleDeliverOrder(bot, query, data.replace('deliver_', ''), chatId, messageId)
    } else if (data.startsWith('details_')) {
      await handleOrderDetails(bot, query, data.replace('details_', ''), chatId)
    }
  } catch (error: any) {
    logger.error('Callback query error:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      data,
    })
    await bot.answerCallbackQuery(query.id, {
      text: 'Xatolik yuz berdi!',
      show_alert: true,
    })
  }
}

// ── Все handleConfirm/Cancel/Ship/Deliver/Details — без изменений ─────────
// (вставь свой оригинальный код ниже)

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
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma topilmadi!', show_alert: true })
    return
  }
  if (order.status !== OrderStatus.PENDING) {
    await bot.answerCallbackQuery(query.id, { text: 'Bu buyurtma allaqachon qayta ishlangan!', show_alert: true })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data:  { status: OrderStatus.CONFIRMED, confirmedAt: new Date() },
  })

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [{ text: '✅ TASDIQLANDI', callback_data: 'noop' }],
        [
          { text: '📦 Tayyor',      callback_data: `ship_${orderId}` },
          { text: '🏠 Topshirildi', callback_data: `deliver_${orderId}` },
        ],
      ],
    },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(order.user.telegramId, order.orderNumber, 'CONFIRMED')
  await bot.answerCallbackQuery(query.id, { text: '✅ Buyurtma tasdiqlandi!' })
}

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
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma topilmadi!', show_alert: true })
    return
  }
  if (order.status === OrderStatus.CANCELLED) {
    await bot.answerCallbackQuery(query.id, { text: 'Bu buyurtma allaqachon bekor qilingan!', show_alert: true })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data:  { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
  })

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [[{ text: '❌ BEKOR QILINDI', callback_data: 'noop' }]] },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(order.user.telegramId, order.orderNumber, 'CANCELLED')
  await bot.answerCallbackQuery(query.id, { text: '❌ Buyurtma bekor qilindi!' })
}

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
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma topilmadi!', show_alert: true })
    return
  }
  if (order.status === OrderStatus.SHIPPED) {
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma allaqachon tayyor!', show_alert: true })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data:  { status: OrderStatus.SHIPPED, shippedAt: new Date() },
  })

  await bot.editMessageReplyMarkup(
    {
      inline_keyboard: [
        [{ text: '📦 TAYYOR',       callback_data: 'noop' }],
        [{ text: '🏠 Topshirildi', callback_data: `deliver_${orderId}` }],
      ],
    },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(order.user.telegramId, order.orderNumber, 'SHIPPED')
  await bot.answerCallbackQuery(query.id, { text: '📦 Buyurtma tayyor!' })
}

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
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma topilmadi!', show_alert: true })
    return
  }
  if (order.status === OrderStatus.DELIVERED) {
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma allaqachon topshirilgan!', show_alert: true })
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data:  { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
  })

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [[{ text: '🏠 TOPSHIRILDI ✅', callback_data: 'noop' }]] },
    { chat_id: chatId, message_id: messageId }
  )

  await sendStatusUpdateToUser(order.user.telegramId, order.orderNumber, 'DELIVERED')
  await bot.answerCallbackQuery(query.id, { text: '🏠 Buyurtma topshirildi!' })
}

async function handleOrderDetails(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  orderId: string,
  chatId: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  })

  if (!order) {
    await bot.answerCallbackQuery(query.id, { text: 'Buyurtma topilmadi!', show_alert: true })
    return
  }

  const itemsList = order.items
    .map(item => `• ${escapeMarkdown(item.productName)} x${item.quantity} = ${formatPrice(item.total)} so'm`)
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
    await bot.sendMessage(chatId, message.replace(/[*_`]/g, ''))
  }

  await bot.answerCallbackQuery(query.id)
}