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

export async function migrateLegacyProfileIfNeeded(session: NearMeAuthSession): Promise<boolean> {
  const legacyUserId = localStorage.getItem('nearme_user_id');
  if (!legacyUserId?.startsWith('user_') || legacyUserId === session.uid) return false;

  const migrationTokenKey = `nearme_migration_token_${legacyUserId}`;
  const migrationToken = localStorage.getItem(migrationTokenKey);
  if (!migrationToken) {
    // Existing legacy profiles predate secure migration tokens. Do not claim ownership automatically.
    // The token must be provisioned on both the legacy profile and this browser by an explicit migration step.
    console.warn('Legacy profile detected, but no migration token is available. Migration skipped safely.');
    return false;
  }

  const endpoint = import.meta.env.VITE_LEGACY_MIGRATION_URL;
  if (!endpoint) {
    console.warn('VITE_LEGACY_MIGRATION_URL is not configured.');
    return false;
  }

  const idToken = await session.firebaseUser.getIdToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, legacyUserId, migrationToken }),
  });

  if (!response.ok) {
    if (response.status === 409) {
      // The verified profile already exists; never overwrite it with legacy data.
      return false;
    }
    throw new Error(`Legacy profile migration failed: ${response.status}`);
  }

  localStorage.setItem('nearme_user_id', session.uid);
  localStorage.removeItem(migrationTokenKey);

  const stored = localStorage.getItem('nearme_user');
  if (stored) {
    try {
      const profile = JSON.parse(stored);
      localStorage.setItem('nearme_user', JSON.stringify({ ...profile, id: session.uid }));
    } catch {
      localStorage.removeItem('nearme_user');
    }
  }
  return true;
}

export { auth };
