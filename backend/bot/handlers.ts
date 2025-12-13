import TelegramBot from 'node-telegram-bot-api'
import { config } from '../src/config'
import { logger } from '../src/utils/logger'
import { prisma } from '../src/config/database'
import { OrderStatus } from '@prisma/client'
import { sendStatusUpdateToUser } from '../src/services/telegramService'
import { formatPrice } from '../src/utils/helpers'

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

    try {
        // Confirm order
        if (data.startsWith('confirm_')) {
            const orderId = data.replace('confirm_', '')
            await handleConfirmOrder(bot, query, orderId, chatId, messageId)
        }

        // Cancel order
        else if (data.startsWith('cancel_')) {
            const orderId = data.replace('cancel_', '')
            await handleCancelOrder(bot, query, orderId, chatId, messageId)
        }

        // Show order details
        else if (data.startsWith('details_')) {
            const orderId = data.replace('details_', '')
            await handleOrderDetails(bot, query, orderId, chatId)
        }

    } catch (error) {
        logger.error('Callback query error:', error)
        await bot.answerCallbackQuery(query.id, {
            text: 'Xatolik yuz berdi!',
            show_alert: true,
        })
    }
}

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

    // Update order status
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: OrderStatus.CONFIRMED,
            confirmedAt: new Date(),
        },
    })

    // Update message
    await bot.editMessageReplyMarkup(
        {
            inline_keyboard: [
                [
                    { text: '✅ TASDIQLANDI', callback_data: 'noop' },
                ],
                [
                    { text: '📦 Yuborildi', callback_data: `ship_${orderId}` },
                    { text: '🏠 Yetkazildi', callback_data: `deliver_${orderId}` },
                ],
            ],
        },
        { chat_id: chatId, message_id: messageId }
    )

    // Notify user
    await sendStatusUpdateToUser(order.user.telegramId, order.orderNumber, 'CONFIRMED')

    await bot.answerCallbackQuery(query.id, {
        text: '✅ Buyurtma tasdiqlandi!',
    })
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

    // Update order status
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
        },
    })

    // Update message
    await bot.editMessageReplyMarkup(
        {
            inline_keyboard: [
                [{ text: '❌ BEKOR QILINDI', callback_data: 'noop' }],
            ],
        },
        { chat_id: chatId, message_id: messageId }
    )

    // Notify user
    await sendStatusUpdateToUser(order.user.telegramId, order.orderNumber, 'CANCELLED')

    await bot.answerCallbackQuery(query.id, {
        text: '❌ Buyurtma bekor qilindi!',
    })
}

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

    const itemsList = order.items.map(item =>
        `• ${item.productName} x${item.quantity} = ${formatPrice(item.total)} so'm`
    ).join('\n')

    const message = `
📋 *Buyurtma #${order.orderNumber}*

👤 Mijoz: ${order.customerName}
📞 Tel: ${order.customerPhone}

📦 Mahsulotlar:
${itemsList}

💰 Jami: ${formatPrice(order.total)} so'm
📊 Status: ${order.status}
`.trim()

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    await bot.answerCallbackQuery(query.id)
}