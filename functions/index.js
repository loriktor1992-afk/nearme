// Firebase Cloud Functions для push-уведомлений
// Этот файл нужно задеплоить на Firebase Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TELEGRAM_IDS = new Set((process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(v => v.trim()).filter(Boolean));

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is not configured; Telegram notifications will be skipped.');
}

// Функция для отправки уведомления через Telegram Bot
async function sendTelegramNotification(userId, message) {
  try {
    if (!TELEGRAM_BOT_TOKEN) return;
    // Получаем Telegram chat_id пользователя из Firebase
    const userSnapshot = await admin.database().ref(`privateUsers/${userId}`).get();
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
exports.onMessageCreated = functions.database
  .ref('conversations/{conversationId}/messages/{messageId}')
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
      const notificationText = `💬 Новое сообщение от ${senderData.name}\n\n${message.text}`;
      await sendTelegramNotification(recipientId, notificationText);
    }
  });

// Триггер при новом лайке
exports.onLikeCreated = functions.database
  .ref('likes/{userId}/{likerId}')
  .onCreate(async (snapshot, context) => {
    const { userId, likerId } = context.params;
    if (userId === likerId) return null;

    const likerDoc = await admin.database().ref(`users/${likerId}`).get();
    const likerData = likerDoc.val();
    if (likerData) {
      await sendTelegramNotification(userId, `❤️ ${likerData.name} лайкнул(а) ваш профиль!`);
    }

    const reciprocal = await admin.database().ref(`likes/${likerId}/${userId}`).get();
    if (!reciprocal.exists()) return null;

    const updates = {};
    updates[`matches/${userId}/${likerId}`] = true;
    updates[`matches/${likerId}/${userId}`] = true;
    await admin.database().ref().update(updates);

    const userDoc = await admin.database().ref(`users/${userId}`).get();
    const userData = userDoc.val();
    if (likerData) await sendTelegramNotification(userId, `💕 Взаимная симпатия! У вас взаимный лайк с ${likerData.name}!`);
    if (userData) await sendTelegramNotification(likerId, `💕 Взаимная симпатия! У вас взаимный лайк с ${userData.name}!`);
    return null;
  });

// Функция для сохранения Telegram chat_id при старте бота
exports.saveTelegramChatId = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
      res.status(401).json({ error: 'authentication_required' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const telegramId = decoded.telegramId;
    if (!telegramId) {
      res.status(403).json({ error: 'verified_telegram_session_required' });
      return;
    }

    // chat_id for the user's private bot chat is derived from the verified Telegram identity.
    await admin.database().ref(`privateUsers/${decoded.uid}/telegramChatId`).set(String(telegramId));
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Failed to save Telegram chat ID', error);
    res.status(401).json({ error: 'invalid_authentication' });
  }
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

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN || '').digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const hashA = Buffer.from(calculatedHash, 'hex');
  const hashB = Buffer.from(hash, 'hex');
  if (hashA.length !== hashB.length || !crypto.timingSafeEqual(hashA, hashB)) return null;

  const authDate = Number(params.get('auth_date'));
  const now = Math.floor(Date.now() / 1000);
  const age = now - authDate;
  if (!Number.isFinite(authDate) || age < -60 || age > 3600) return null;

  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

// Validates Telegram Mini App initData on the trusted server and returns a Firebase custom token.
exports.telegramAuth = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!TELEGRAM_BOT_TOKEN) {
    res.status(503).json({ error: 'telegram_not_configured' });
    return;
  }

  const initData = typeof req.body?.initData === 'string' ? req.body.initData : '';
  if (!initData || initData.length > 16384) {
    res.status(400).json({ error: 'invalid_init_data_size' });
    return;
  }
  const telegramUser = parseTelegramInitData(initData);
  if (!telegramUser?.id) {
    res.status(401).json({ error: 'invalid_telegram_init_data' });
    return;
  }

  const telegramId = String(telegramUser.id);
  const uid = `tg_${telegramId}`;
  const isAdmin = ADMIN_TELEGRAM_IDS.has(telegramId);
  const customToken = await admin.auth().createCustomToken(uid, {
    telegramId,
    admin: isAdmin,
  });
  res.status(200).json({ customToken, uid });
});


// Migrates a legacy local profile to the verified Telegram/Firebase UID.
// Ownership is proven by a one-time migration token stored on the legacy profile.
exports.migrateLegacyProfile = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken : '';
  const legacyUserId = typeof req.body?.legacyUserId === 'string' ? req.body.legacyUserId : '';
  const migrationToken = typeof req.body?.migrationToken === 'string' ? req.body.migrationToken : '';
  if (!idToken || !legacyUserId || !migrationToken || !legacyUserId.startsWith('user_')) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded.uid.startsWith('tg_')) {
      res.status(403).json({ error: 'verified_telegram_session_required' });
      return;
    }

    const rootRef = admin.database().ref();
    const rootSnapshot = await rootRef.get();
    const root = rootSnapshot.val() || {};
    const legacy = root.users?.[legacyUserId];
    if (!legacy || legacy.migrationToken !== migrationToken) {
      res.status(403).json({ error: 'legacy_profile_ownership_failed' });
      return;
    }
    if (root.users?.[decoded.uid]) {
      res.status(409).json({ error: 'target_profile_exists' });
      return;
    }

    const updates = {};
    const migrated = { ...legacy, id: decoded.uid };
    delete migrated.migrationToken;
    updates[`users/${decoded.uid}`] = migrated;
    updates[`users/${legacyUserId}`] = null;

    // Rewrite message participants without changing message IDs/history.
    for (const [messageId, message] of Object.entries(root.messages || {})) {
      if (message?.fromId === legacyUserId) updates[`messages/${messageId}/fromId`] = decoded.uid;
      if (message?.toId === legacyUserId) updates[`messages/${messageId}/toId`] = decoded.uid;
    }

    // Rewrite user relationship arrays (likes/dislikes/profileViews/blockedUsers).
    for (const [userId, user] of Object.entries(root.users || {})) {
      if (userId === legacyUserId || !user) continue;
      for (const field of ['likes', 'dislikes', 'profileViews']) {
        if (Array.isArray(user[field])) {
          const next = user[field].map(value => value === legacyUserId ? decoded.uid : value);
          if (next.some((value, index) => value !== user[field][index])) updates[`users/${userId}/${field}`] = next;
        }
      }
      const blocked = user.privacySettings?.blockedUsers;
      if (Array.isArray(blocked)) {
        const next = blocked.map(value => value === legacyUserId ? decoded.uid : value);
        if (next.some((value, index) => value !== blocked[index])) updates[`users/${userId}/privacySettings/blockedUsers`] = next;
      }
    }

    // Rewrite district ownership/membership/admin references.
    for (const [districtId, district] of Object.entries(root.districts || {})) {
      if (!district) continue;
      if (district.adminId === legacyUserId) updates[`districts/${districtId}/adminId`] = decoded.uid;
      for (const field of ['adminIds', 'memberIds']) {
        if (Array.isArray(district[field])) {
          const next = district[field].map(value => value === legacyUserId ? decoded.uid : value);
          if (next.some((value, index) => value !== district[field][index])) updates[`districts/${districtId}/${field}`] = next;
        }
      }
    }

    // Rewrite invitation sender/recipient references.
    for (const [inviteId, invite] of Object.entries(root.invites || {})) {
      if (!invite) continue;
      if (invite.fromUserId === legacyUserId) updates[`invites/${inviteId}/fromUserId`] = decoded.uid;
      if (invite.toUserId === legacyUserId) updates[`invites/${inviteId}/toUserId`] = decoded.uid;
    }

    // Multi-location update commits the profile and all references as one RTDB operation.
    await rootRef.update(updates);
    res.status(200).json({ uid: decoded.uid, migratedReferences: Object.keys(updates).length });
  } catch (error) {
    console.error('Legacy profile migration failed', error);
    res.status(401).json({ error: 'migration_failed' });
  }
});



// Creates a deterministic two-person conversation using the verified Firebase identity.
exports.createConversation = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) {
      res.status(401).json({ error: 'authentication_required' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const targetUid = typeof req.body?.targetUid === 'string' ? req.body.targetUid.trim() : '';
    if (!targetUid || targetUid === decoded.uid || targetUid.length > 128) {
      res.status(400).json({ error: 'invalid_target' });
      return;
    }

    const targetProfile = await admin.database().ref(`users/${targetUid}`).get();
    if (!targetProfile.exists()) {
      res.status(404).json({ error: 'target_not_found' });
      return;
    }

    const members = [decoded.uid, targetUid].sort();
    const conversationId = members.join('__');
    const updates = {
      [`conversationMembers/${conversationId}/${members[0]}`]: true,
      [`conversationMembers/${conversationId}/${members[1]}`]: true,
      [`userConversations/${members[0]}/${conversationId}`]: true,
      [`userConversations/${members[1]}/${conversationId}`]: true,
    };
    await admin.database().ref().update(updates);
    res.status(200).json({ conversationId });
  } catch (error) {
    console.error('Conversation creation failed', error);
    res.status(401).json({ error: 'conversation_creation_failed' });
  }
});


// One-time admin-only backfill from legacy /messages into private conversations.
exports.backfillLegacyMessages = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded.admin !== true) {
      res.status(403).json({ error: 'admin_required' });
      return;
    }

    const rootRef = admin.database().ref();
    const legacySnapshot = await admin.database().ref('messages').get();
    const legacyMessages = legacySnapshot.val() || {};
    const updates = {};
    let migrated = 0;

    for (const [messageId, message] of Object.entries(legacyMessages)) {
      if (!message?.fromId || !message?.toId) continue;
      const members = [String(message.fromId), String(message.toId)].sort();
      const conversationId = members.join('__');
      updates[`conversations/${conversationId}/messages/${messageId}`] = message;
      updates[`conversationMembers/${conversationId}/${members[0]}`] = true;
      updates[`conversationMembers/${conversationId}/${members[1]}`] = true;
      updates[`userConversations/${members[0]}/${conversationId}`] = true;
      updates[`userConversations/${members[1]}/${conversationId}`] = true;
      migrated += 1;
    }

    if (migrated > 0) await rootRef.update(updates);
    res.status(200).json({ migrated, conversationsTouched: new Set(Object.values(legacyMessages).filter(Boolean).map(message => [String(message.fromId), String(message.toId)].sort().join('__'))).size });
  } catch (error) {
    console.error('Legacy message backfill failed', error);
    res.status(401).json({ error: 'backfill_failed' });
  }
});
