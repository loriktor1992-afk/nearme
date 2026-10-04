import React, { useEffect } from 'react';
import { ref, set as setDbValue } from 'firebase/database';
import { db } from './firebase';
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

  // Save Telegram chat id only for the authenticated profile.
  useEffect(() => {
    const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (!telegramUser?.id) return;

    const currentUser = useStore.getState().currentUser;
    if (!currentUser || currentUser.telegramChatId) return;

    const userRef = ref(db, `users/${currentUser.id}/telegramChatId`);
    setDbValue(userRef, telegramUser.id.toString());

    useStore.setState({
      currentUser: { ...currentUser, telegramChatId: telegramUser.id.toString() }
    });
  }, [isRegistered]);

  return (
    <ErrorBoundary>
      <div className="w-full h-full overflow-hidden">
        {isRegistered ? <MapScreen /> : <RegistrationScreen />}
      </div>
    </ErrorBoundary>
  );
}
