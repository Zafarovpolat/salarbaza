"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelegramBot = initTelegramBot;
exports.getBot = getBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const config_1 = require("../src/config");
const logger_1 = require("../src/utils/logger");
const commands_1 = require("./commands");
const handlers_1 = require("./handlers");
let bot = null;
function initTelegramBot() {
    if (!config_1.config.botToken) {
        logger_1.logger.warn('BOT_TOKEN not set, skipping bot initialization');
        return null;
    }
    bot = new node_telegram_bot_api_1.default(config_1.config.botToken, { polling: true });
    // Commands
    bot.onText(/\/start/, (msg) => (0, commands_1.handleStart)(bot, msg));
    bot.onText(/\/help/, (msg) => (0, commands_1.handleHelp)(bot, msg));
    // Callback queries (button clicks)
    bot.on('callback_query', (query) => (0, handlers_1.handleCallbackQuery)(bot, query));
    // Error handling
    bot.on('polling_error', (error) => {
        logger_1.logger.error('Bot polling error:', error);
    });
    logger_1.logger.info('🤖 Telegram bot started');
    return bot;
}
function getBot() {
    return bot;
}
//# sourceMappingURL=index.js.map