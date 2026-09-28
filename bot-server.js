/**
 * Telegram Bot Server
 * 
 * Этот файл нужен для обработки команд бота.
 * Запусти его на сервере (Vercel, Railway, Render и т.д.)
 * 
 * Установка:
 * npm install node-telegram-bot-api dotenv
 * 
 * Запуск:
 * node bot-server.js
 */

// Раскомментируй для использования:

// const TelegramBot = require('node-telegram-bot-api');
// require('dotenv').config();
//
// const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const WEB_APP_URL = process.env.WEB_APP_URL || 'https://nearme.vercel.app';
//
// const bot = new TelegramBot(TOKEN, { polling: true });
//
// // Команда /start
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   const userName = msg.from.first_name;
//   
//   bot.sendMessage(chatId, `Привет, ${userName}! 👋\n\nДобро пожаловать в NearMe — знакомства рядом с тобой!\n\nНажми кнопку ниже, чтобы открыть приложение 💕`, {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           {
//             text: '🚀 Открыть NearMe',
//             web_app: { url: WEB_APP_URL }
//           }
//         ]
//       ]
//     }
//   });
// });
//
// // Команда /help
// bot.onText(/\/help/, (msg) => {
//   const chatId = msg.chat.id;
//   
//   bot.sendMessage(chatId, `
// 📖 *Помощь по NearMe*
// 
// 🔹 /start — Открыть приложение
// 🔹 /help — Эта справка
// 🔹 /about — О приложении
// 
// 💡 Как пользоваться:
// 1. Открой NearMe
// 2. Пройди регистрацию
// 3. Разреши геолокацию
// 4. Находи людей рядом и общайся!
// 
// ⚠️ Сервис доступен с 14 лет
//   `, { parse_mode: 'Markdown' });
// });
//
// // Команда /about
// bot.onText(/\/about/, (msg) => {
//   const chatId = msg.chat.id;
//   
//   bot.sendMessage(chatId, `
// 💕 *О NearMe*
// 
// NearMe — это приложение для знакомств с людьми рядом с тобой в реальном времени.
// 
// 📍 Видишь людей на карте
// 💬 Общаешься в чате
// 👥 Находишь новых друзей
// 
// Версия: 1.0.0
//   `, { parse_mode: 'Markdown' });
// });
//
// // Обработка всех остальных сообщений
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const text = msg.text;
//   
//   // Если это не команда, предлагаем открыть приложение
//   if (text && !text.startsWith('/')) {
//     bot.sendMessage(chatId, 'Нажми кнопку ниже, чтобы открыть NearMe 💕', {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: '🚀 Открыть NearMe',
//               web_app: { url: WEB_APP_URL }
//             }
//           ]
//         ]
//       }
//     });
//   }
// });
//
// console.log('🤖 Bot is running...');

// Экспорт для использования как модуль
module.exports = {};
