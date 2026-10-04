import React, { useEffect } from 'react';
import { auth } from './auth';
import { useStore } from './store';
import RegistrationScreen from './components/RegistrationScreen';
import MapScreen from './components/MapScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const isRegistered = useStore(s => s.isRegistered);
  const theme = useStore(s => s.theme);

  // Применяем тему при загрузке
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persist the Telegram private-chat destination only through the trusted backend.
  useEffect(() => {
    if (!isRegistered) return;
    const endpoint = import.meta.env.VITE_SAVE_TELEGRAM_CHAT_ID_URL;
    const firebaseUser = auth.currentUser;
    if (!endpoint || !firebaseUser) return;

    const save = async () => {
      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) console.error('Failed to save Telegram chat ID:', response.status);
      } catch (error) {
        console.error('Failed to save Telegram chat ID', error);
      }
    };
    void save();
  }, [isRegistered]);

  return (
    <ErrorBoundary>
      <div className="w-full h-full overflow-hidden">
        {isRegistered ? <MapScreen /> : <RegistrationScreen />}
      </div>
    </ErrorBoundary>
  );
}
