import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// ============================================================
// ⚠️ ВАЖНО: Замени эти данные на свои из Firebase Console!
// ============================================================
// 1. Зайди на https://console.firebase.google.com/
// 2. Создай проект (или используй существующий)
// 3. В настройках проекта найди "Ваши приложения" → Web
// 4. Скопируй firebaseConfig и вставь ниже
// 5. Включи Realtime Database (в режиме test для начала)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyDEMO_KEY_REPLACE_ME",
  authDomain: "nearme-demo.firebaseapp.com",
  databaseURL: "https://nearme-demo-default-rtdb.firebaseio.com",
  projectId: "nearme-demo",
  storageBucket: "nearme-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
