import { cors, db, json, parseBearer, verifyFirebaseIdToken } from './_lib/firebase.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const claims = await verifyFirebaseIdToken(parseBearer(req));
    const targetUid = typeof req.body?.targetUid === 'string' ? req.body.targetUid.trim() : '';
    if (!targetUid || targetUid === claims.sub || targetUid.length > 128) return json(res, 400, { error: 'Invalid target user' });
    const target = await db(`users/${targetUid}`);
    if (!target) return json(res, 404, { error: 'User not found' });

    const [ownBlocked, targetBlocked] = await Promise.all([
      db(`privateSettings/${claims.sub}/blockedUsers`),
      db(`privateSettings/${targetUid}/blockedUsers`),
    ]);
    if ((Array.isArray(ownBlocked) && ownBlocked.includes(targetUid)) || (Array.isArray(targetBlocked) && targetBlocked.includes(claims.sub))) {
      return json(res, 403, { error: 'Conversation is blocked' });
    }

    const users = [claims.sub, targetUid].sort();
    const conversationId = users.join('__');
    await db('', 'PATCH', {
      [`conversationMembers/${conversationId}/${claims.sub}`]: true,
      [`conversationMembers/${conversationId}/${targetUid}`]: true,
      [`userConversations/${claims.sub}/${conversationId}`]: true,
      [`userConversations/${targetUid}/${conversationId}`]: true,
    });
    return json(res, 200, { conversationId });
  } catch (error) {
    console.error('createConversation', error);
    return json(res, 401, { error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
