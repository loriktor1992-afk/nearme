import { cors, db, json, parseBearer, verifyFirebaseIdToken } from './_lib/firebase.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const claims = await verifyFirebaseIdToken(parseBearer(req));
    if (!claims.telegramId) return json(res, 400, { error: 'Telegram claim is missing' });
    await db(`privateUsers/${claims.sub}`, 'PATCH', { telegramChatId: String(claims.telegramId), updatedAt: Date.now() });
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('saveTelegramChatId', error);
    return json(res, 401, { error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
