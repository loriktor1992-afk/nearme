import { cors, json } from './_lib/firebase.js';
export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  return json(res, 200, { migrated: false, reason: 'Legacy migration is disabled on the free Vercel backend' });
}
