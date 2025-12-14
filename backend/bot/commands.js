"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStart = handleStart;
exports.handleHelp = handleHelp;
const config_1 = require("../src/config");
async function handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'Foydalanuvchi';
    const welcomeMessage = `
👋 Salom, ${firstName}!

🏠 *DekorHouse* — uy va bog' uchun dekoratsiyalar do'koniga xush kelibsiz!

🪴 Bizda:
• Guldonlar va kashpolar
• Sun'iy o'simliklar  
• O'simliklar uchun tagliklar
`.trim();
    // Web App кнопка работает только с HTTPS
    const isHttps = config_1.config.frontendUrl.startsWith('https://');
    if (isHttps) {
        await bot.sendMessage(chatId, welcomeMessage + '\n\n👇 Do\'konni ochish uchun pastdagi tugmani bosing:', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🛒 Do\'konni ochish',
                            web_app: { url: config_1.config.frontendUrl },
                        },
                    ],
                ],
            },
        });
    }
    else {
        // Для dev режима - просто ссылка
        await bot.sendMessage(chatId, welcomeMessage + `\n\n🔗 Do'kon: ${config_1.config.frontendUrl}`, {
            parse_mode: 'Markdown',
        });
    }
}
async function handleHelp(bot, msg) {
    const chatId = msg.chat.id;
    const helpMessage = `
ℹ️ *Yordam*

🛒 *Buyurtma berish:*
1. Do'konni oching
2. Mahsulotlarni tanlang
3. Savatga qo'shing
4. Buyurtmani rasmiylang

📞 *Bog'lanish:*
Telegram: @DekorHouseSupport
Telefon: +998 90 123 45 67

🕐 *Ish vaqti:*
Dushanba - Shanba: 9:00 - 18:00
Yakshanba: Dam olish
`.trim();
    const isHttps = config_1.config.frontendUrl.startsWith('https://');
    if (isHttps) {
        await bot.sendMessage(chatId, helpMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🛒 Do\'konni ochish',
                            web_app: { url: config_1.config.frontendUrl },
                        },
                    ],
                ],
            },
        });
    }
    else {
        await bot.sendMessage(chatId, helpMessage + `\n\n🔗 Do'kon: ${config_1.config.frontendUrl}`, {
            parse_mode: 'Markdown',
        });
    }
}
//# sourceMappingURL=commands.js.map