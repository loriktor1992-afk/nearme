import crypto from 'node:crypto';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'nearme-app-59aa5';
const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://nearme-app-59aa5-default-rtdb.firebaseio.com';

function b64url(value) {
  return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value))
    .toString('base64url');
}

function serviceAccount() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) throw new Error('Firebase service account is not configured');
  return { clientEmail, privateKey };
}

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

export function parseBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

export async function verifyFirebaseIdToken(token) {
  if (!token) throw new Error('Missing Firebase ID token');
  const [head, payload, signature] = token.split('.');
  if (!head || !payload || !signature) throw new Error('Malformed Firebase ID token');
  const header = JSON.parse(Buffer.from(head, 'base64url').toString());
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Firebase token');
  if (claims.aud !== PROJECT_ID || claims.iss !== `https://securetoken.google.com/${PROJECT_ID}`) throw new Error('Wrong Firebase token audience');
  const now = Math.floor(Date.now() / 1000);
  if (!claims.sub || claims.exp < now || claims.iat > now + 60) throw new Error('Expired Firebase token');

  const certResponse = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!certResponse.ok) throw new Error('Could not load Firebase signing certificates');
  const certs = await certResponse.json();
  const cert = certs[header.kid];
  if (!cert) throw new Error('Unknown Firebase signing key');
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${head}.${payload}`), cert, Buffer.from(signature, 'base64url'));
  if (!ok) throw new Error('Invalid Firebase token signature');
  return claims;
}

async function googleAccessToken() {
  const { clientEmail, privateKey } = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  if (!response.ok) throw new Error('Could not authorize Firebase service account');
  return (await response.json()).access_token;
}

export async function db(path, method = 'GET', body) {
  const accessToken = await googleAccessToken();
  const response = await fetch(`${DATABASE_URL}/${path.replace(/^\//, '')}.json?access_token=${encodeURIComponent(accessToken)}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Realtime Database request failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

export function firebaseCustomToken(uid, extraClaims = {}) {
  const { clientEmail, privateKey } = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
    claims: extraClaims,
  });
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');
  return `${unsigned}.${signature}`;
}

export function verifyTelegramInitData(initData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('Telegram bot token is not configured');
  if (!initData || initData.length > 16384) throw new Error('Invalid Telegram initData');
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('Missing Telegram hash');
  params.delete('hash');
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const valid = expected.length === hash.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  if (!valid) throw new Error('Invalid Telegram signature');
  const authDate = Number(params.get('auth_date'));
  const age = Math.floor(Date.now()/1000) - authDate;
  if (!Number.isFinite(authDate) || age < -60 || age > 3600) throw new Error('Expired Telegram initData');
  const user = JSON.parse(params.get('user') || 'null');
  if (!user?.id) throw new Error('Telegram user is missing');
  return user;
}
