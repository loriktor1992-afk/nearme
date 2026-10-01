import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Конфигурация Firebase из переменных окружения
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCgNTBYm9-yAWPKK0IwH1TnAQL_exHRX54",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nearme-app-59aa5.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://nearme-app-59aa5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nearme-app-59aa5",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nearme-app-59aa5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "744546557525",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:744546557525:web:14feeb34b03a0e19ea3edc"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;
