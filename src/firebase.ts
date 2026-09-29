import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCgNTBYm9-yAWPKK0IwH1TnAQL_exHRX54",
  authDomain: "nearme-app-59aa5.firebaseapp.com",
  databaseURL: "https://nearme-app-59aa5-default-rtdb.firebaseio.com",
  projectId: "nearme-app-59aa5",
  storageBucket: "nearme-app-59aa5.firebasestorage.app",
  messagingSenderId: "744546557525",
  appId: "1:744546557525:web:14feeb34b03a0e19ea3edc"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
