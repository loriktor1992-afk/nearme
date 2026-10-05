import { cors, db, json, parseBearer, verifyFirebaseIdToken } from './_lib/firebase.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const claims = await verifyFirebaseIdToken(parseBearer(req));
    const likerUid = String(claims.sub || '');
    const { ownerUid, photoKey, action = 'toggle' } = req.body || {};
    if (!ownerUid || !/^[A-Za-z0-9_-]{1,128}$/.test(ownerUid)) return json(res, 400, { error: 'Invalid owner' });
    if (!photoKey || !/^[a-z0-9_-]{1,64}$/.test(photoKey)) return json(res, 400, { error: 'Invalid photo key' });

    const path = `photoLikes/${ownerUid}/${photoKey}`;
    const likes = (await db(path)) || {};
    const wasLiked = likes[likerUid] === true;

    if (action === 'status') {
      return json(res, 200, { liked: wasLiked, count: Object.values(likes).filter(Boolean).length });
    }

    const liked = !wasLiked;
    await db(`${path}/${likerUid}`, 'PUT', liked ? true : null);
    const nextCount = Math.max(0, Object.values(likes).filter(Boolean).length + (liked ? 1 : -1));
    await db(`users/${ownerUid}/photoLikeCounts/${photoKey}`, 'PUT', nextCount);
    return json(res, 200, { liked, count: nextCount });
  } catch (error) {
    console.error('photoLike error', error);
    return json(res, 401, { error: 'Could not update photo like' });
  }
}
