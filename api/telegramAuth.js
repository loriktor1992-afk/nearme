import { cors, firebaseCustomToken, json, verifyTelegramInitData } from './_lib/firebase.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = verifyTelegramInitData(req.body?.initData || '');
    const adminIds = new Set((process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(v => v.trim()).filter(Boolean));
    const telegramId = String(user.id);
    const uid = `tg_${telegramId}`;
    const token = firebaseCustomToken(uid, { telegramId, admin: adminIds.has(telegramId) });
    return json(res, 200, { customToken: token, uid });
  } catch (error) {
    console.error('telegramAuth', error);
    return json(res, 401, { error: error instanceof Error ? error.message : 'Authentication failed' });
  }
}
