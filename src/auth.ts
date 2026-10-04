import { getAuth, signInWithCustomToken, User as FirebaseUser } from 'firebase/auth';
import app from './firebase';
import { tg } from './telegram';

const auth = getAuth(app);

export interface NearMeAuthSession {
  firebaseUser: FirebaseUser;
  uid: string;
}

export async function signInWithTelegram(): Promise<NearMeAuthSession | null> {
  const initData = tg.initData;
  if (!initData) return null;

  const endpoint = import.meta.env.VITE_TELEGRAM_AUTH_URL;
  if (!endpoint) {
    console.warn('VITE_TELEGRAM_AUTH_URL is not configured.');
    return null;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    throw new Error(`Telegram authentication failed: ${response.status}`);
  }

  const payload = await response.json() as { customToken?: string; uid?: string };
  if (!payload.customToken || !payload.uid) {
    throw new Error('Telegram authentication returned an invalid response.');
  }

  const credential = await signInWithCustomToken(auth, payload.customToken);
  return { firebaseUser: credential.user, uid: payload.uid };
}

export { auth };
