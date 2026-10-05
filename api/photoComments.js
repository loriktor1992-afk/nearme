import { cors, db, json, parseBearer, verifyFirebaseIdToken } from './_lib/firebase.js';

const clean = value => String(value || '').trim().slice(0, 500);

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const claims = await verifyFirebaseIdToken(parseBearer(req));
    const uid = String(claims.sub || '');
    const { ownerUid, photoKey, action = 'list', text } = req.body || {};
    if (!ownerUid || !/^[A-Za-z0-9_-]{1,128}$/.test(ownerUid)) return json(res, 400, { error: 'Invalid owner' });
    if (!photoKey || !/^[a-z0-9_-]{1,64}$/.test(photoKey)) return json(res, 400, { error: 'Invalid photo key' });
    const base = `photoComments/${ownerUid}/${photoKey}`;

    if (action === 'add') {
      const commentText = clean(text);
      if (!commentText) return json(res, 400, { error: 'Empty comment' });
      const profile = (await db(`users/${uid}`)) || {};
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const comment = { id, uid, name: clean(profile.name) || 'Пользователь', avatar: profile.photoUrl || '', text: commentText, createdAt: Date.now() };
      await db(`${base}/${id}`, 'PUT', comment);
    } else if (action === 'delete') {
      const id = clean(req.body?.commentId);
      const existing = id ? await db(`${base}/${id}`) : null;
      if (!existing || (existing.uid !== uid && ownerUid !== uid)) return json(res, 403, { error: 'Forbidden' });
      await db(`${base}/${id}`, 'DELETE');
    }

    const raw = (await db(base)) || {};
    const comments = Object.values(raw).sort((a, b) => Number(a.createdAt) - Number(b.createdAt)).slice(-100);
    return json(res, 200, { comments, count: Object.keys(raw).length });
  } catch (error) {
    console.error('photoComments error', error);
    return json(res, 401, { error: 'Could not process comments' });
  }
}
