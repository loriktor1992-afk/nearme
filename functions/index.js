// Firebase Cloud Functions для push-уведомлений
// Этот файл нужно задеплоить на Firebase Functions

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is not configured; Telegram notifications will be skipped.');
}

// Функция для отправки уведомления через Telegram Bot
async function sendTelegramNotification(userId: string, message: string) {
  try {
    if (!TELEGRAM_BOT_TOKEN) return;
    // Получаем Telegram chat_id пользователя из Firebase
    const userSnapshot = await admin.database().ref(`users/${userId}`).get();
    const userData = userSnapshot.val();
    
    if (!userData?.telegramChatId) {
      console.log(`User ${userId} has no telegramChatId`);
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userData.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

// Триггер при создании нового сообщения
export const onMessageCreated = functions.database
  .ref('messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    const messageId = context.params.messageId;
    
    // Отправляем уведомление получателю
    const recipientId = message.toId;
    const senderId = message.fromId;
    
    // Получаем информацию об отправителе
    const senderDoc = await admin.database().ref(`users/${senderId}`).get();
    const senderData = senderDoc.val();
    
    if (senderData && recipientId) {
      const notificationText = `💬 <b>Новое сообщение от ${senderData.name}</b>\n\n${message.text}`;
      await sendTelegramNotification(recipientId, notificationText);
    }
  });

// Триггер при новом лайке
export const onLikeCreated = functions.database
  .ref('users/{userId}/likes/{likerId}')
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    const likerId = context.params.likerId;
    
    // Получаем информацию о том кто лайкнул
    const likerDoc = await admin.database().ref(`users/${likerId}`).get();
    const likerData = likerDoc.val();
    
    if (likerData) {
      const notificationText = `❤️ <b>${likerData.name} лайкнул(а) ваш профиль!</b>`;
      await sendTelegramNotification(userId, notificationText);
    }
  });

// Триггер при взаимном лайке (match)
export const onMatchCreated = functions.database
  .ref('users/{userId}/likes/{likerId}')
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    const likerId = context.params.likerId;
    
    // Проверяем взаимность
    const userLikesDoc = await admin.database().ref(`users/${userId}/likes/${likerId}`).get();
    const likerLikesDoc = await admin.database().ref(`users/${likerId}/likes/${userId}`).get();
    
    if (userLikesDoc.exists() && likerLikesDoc.exists()) {
      // Взаимный лайк!
      const likerDoc = await admin.database().ref(`users/${likerId}`).get();
      const likerData = likerDoc.val();
      
      if (likerData) {
        const notificationText = `💕 <b>Взаимная симпатия!</b>\n\nУ вас взаимный лайк с ${likerData.name}!`;
        await sendTelegramNotification(userId, notificationText);
      }
    }
  });

// Функция для сохранения Telegram chat_id при старте бота
export const saveTelegramChatId = functions.https.onRequest(async (req, res) => {
  const { userId, chatId } = req.body;
  
  if (!userId || !chatId) {
    res.status(400).send('Missing userId or chatId');
    return;
  }
  
  await admin.database().ref(`users/${userId}/telegramChatId`).set(chatId);
  res.status(200).send('Chat ID saved');
});

function parseTelegramInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const crypto = require('crypto');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN || '').digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const hashA = Buffer.from(calculatedHash, 'hex');
  const hashB = Buffer.from(hash, 'hex');
  if (hashA.length !== hashB.length || !crypto.timingSafeEqual(hashA, hashB)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || Math.floor(Date.now() / 1000) - authDate > 3600) return null;

  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

// Validates Telegram Mini App initData on the trusted server and returns a Firebase custom token.
export const telegramAuth = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!TELEGRAM_BOT_TOKEN) {
    res.status(503).json({ error: 'telegram_not_configured' });
    return;
  }

  const initData = typeof req.body?.initData === 'string' ? req.body.initData : '';
  const telegramUser = parseTelegramInitData(initData);
  if (!telegramUser?.id) {
    res.status(401).json({ error: 'invalid_telegram_init_data' });
    return;
  }

  const uid = `tg_${telegramUser.id}`;
  const customToken = await admin.auth().createCustomToken(uid, {
    telegramId: String(telegramUser.id),
  });
  res.status(200).json({ customToken, uid });
});
