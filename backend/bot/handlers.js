"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCallbackQuery = handleCallbackQuery;
const config_1 = require("../src/config");
const logger_1 = require("../src/utils/logger");
const database_1 = require("../src/config/database");
const client_1 = require("@prisma/client");
const telegramService_1 = require("../src/services/telegramService");
const helpers_1 = require("../src/utils/helpers");
async function handleCallbackQuery(bot, query) {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;
    if (!chatId || !messageId || !data)
        return;
    // Check if admin
    if (chatId.toString() !== config_1.config.adminChatId) {
        await bot.answerCallbackQuery(query.id, {
            text: 'Bu amal faqat admin uchun!',
            show_alert: true,
        });
        return;
    }
    try {
        // Confirm order
        if (data.startsWith('confirm_')) {
            const orderId = data.replace('confirm_', '');
            await handleConfirmOrder(bot, query, orderId, chatId, messageId);
        }
        // Cancel order
        else if (data.startsWith('cancel_')) {
            const orderId = data.replace('cancel_', '');
            await handleCancelOrder(bot, query, orderId, chatId, messageId);
        }
        // Show order details
        else if (data.startsWith('details_')) {
            const orderId = data.replace('details_', '');
            await handleOrderDetails(bot, query, orderId, chatId);
        }
    }
    catch (error) {
        logger_1.logger.error('Callback query error:', error);
        await bot.answerCallbackQuery(query.id, {
            text: 'Xatolik yuz berdi!',
            show_alert: true,
        });
    }
}
async function handleConfirmOrder(bot, query, orderId, chatId, messageId) {
    const order = await database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
    });
    if (!order) {
        await bot.answerCallbackQuery(query.id, {
            text: 'Buyurtma topilmadi!',
            show_alert: true,
        });
        return;
    }
    if (order.status !== client_1.OrderStatus.PENDING) {
        await bot.answerCallbackQuery(query.id, {
            text: 'Bu buyurtma allaqachon qayta ishlangan!',
            show_alert: true,
        });
        return;
    }
    // Update order status
    await database_1.prisma.order.update({
        where: { id: orderId },
        data: {
            status: client_1.OrderStatus.CONFIRMED,
            confirmedAt: new Date(),
        },
    });
    // Update message
    await bot.editMessageReplyMarkup({
        inline_keyboard: [
            [
                { text: '✅ TASDIQLANDI', callback_data: 'noop' },
            ],
            [
                { text: '📦 Yuborildi', callback_data: `ship_${orderId}` },
                { text: '🏠 Yetkazildi', callback_data: `deliver_${orderId}` },
            ],
        ],
    }, { chat_id: chatId, message_id: messageId });
    // Notify user
    await (0, telegramService_1.sendStatusUpdateToUser)(order.user.telegramId, order.orderNumber, 'CONFIRMED');
    await bot.answerCallbackQuery(query.id, {
        text: '✅ Buyurtma tasdiqlandi!',
    });
}
async function handleCancelOrder(bot, query, orderId, chatId, messageId) {
    const order = await database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
    });
    if (!order) {
        await bot.answerCallbackQuery(query.id, {
            text: 'Buyurtma topilmadi!',
            show_alert: true,
        });
        return;
    }
    if (order.status === client_1.OrderStatus.CANCELLED) {
        await bot.answerCallbackQuery(query.id, {
            text: 'Bu buyurtma allaqachon bekor qilingan!',
            show_alert: true,
        });
        return;
    }
    // Update order status
    await database_1.prisma.order.update({
        where: { id: orderId },
        data: {
            status: client_1.OrderStatus.CANCELLED,
            cancelledAt: new Date(),
        },
    });
    // Update message
    await bot.editMessageReplyMarkup({
        inline_keyboard: [
            [{ text: '❌ BEKOR QILINDI', callback_data: 'noop' }],
        ],
    }, { chat_id: chatId, message_id: messageId });
    // Notify user
    await (0, telegramService_1.sendStatusUpdateToUser)(order.user.telegramId, order.orderNumber, 'CANCELLED');
    await bot.answerCallbackQuery(query.id, {
        text: '❌ Buyurtma bekor qilindi!',
    });
}
async function handleOrderDetails(bot, query, orderId, chatId) {
    const order = await database_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
            user: true,
        },
    });
    if (!order) {
        await bot.answerCallbackQuery(query.id, {
            text: 'Buyurtma topilmadi!',
            show_alert: true,
        });
        return;
    }
    const itemsList = order.items.map(item => `• ${item.productName} x${item.quantity} = ${(0, helpers_1.formatPrice)(item.total)} so'm`).join('\n');
    const message = `
📋 *Buyurtma #${order.orderNumber}*

👤 Mijoz: ${order.customerName}
📞 Tel: ${order.customerPhone}

📦 Mahsulotlar:
${itemsList}

💰 Jami: ${(0, helpers_1.formatPrice)(order.total)} so'm
📊 Status: ${order.status}
`.trim();
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    await bot.answerCallbackQuery(query.id);
}
//# sourceMappingURL=handlers.js.map