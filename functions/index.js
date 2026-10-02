// Firebase Cloud Functions для push-уведомлений
// Этот файл нужно задеплоить на Firebase Functions

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // Замените на ваш токен

// Функция для отправки уведомления через Telegram Bot
async function sendTelegramNotification(userId: string, message: string) {
  try {
    // Получаем Telegram chat_id пользователя из Firebase
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
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
