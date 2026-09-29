import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCgNTBYm9-yAWPKK0IwH1TnAQL_exHRX54",
  authDomain: "nearme-app-59aa5.firebaseapp.com",
  databaseURL: "https://nearme-app-59aa5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nearme-app-59aa5",
  storageBucket: "nearme-app-59aa5.firebasestorage.app",
  messagingSenderId: "744546557525",
  appId: "1:744546557525:web:14feeb34b03a0e19ea3edc"
};

let app: any;
let db: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export { db, auth };
export default app;
