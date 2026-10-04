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

  // Проверка прав администратора при загрузке
  useEffect(() => {
    const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const adminUsernames = ['loriktor', 'loriktor1992'];
    
    if (telegramUser && adminUsernames.includes(telegramUser.username?.toLowerCase())) {
      localStorage.setItem('nearme_admin', 'true');
      console.log('🎉 Администратор обнаружен: @' + telegramUser.username);
    }
    
    // Сохраняем Telegram chat_id для push-уведомлений
    if (telegramUser?.id) {
      const currentUser = useStore.getState().currentUser;
      if (currentUser && !currentUser.telegramChatId) {
        // Сохраняем chat_id в Firebase
        const userRef = ref(db, `users/${currentUser.id}/telegramChatId`);
        setDbValue(userRef, telegramUser.id.toString());
        
        // Обновляем локальное состояние
        useStore.setState({
          currentUser: { ...currentUser, telegramChatId: telegramUser.id.toString() }
        });
        
        console.log('📱 Telegram chat_id сохранен:', telegramUser.id);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="w-full h-full overflow-hidden">
        {isRegistered ? <MapScreen /> : <RegistrationScreen />}
      </div>
    </ErrorBoundary>
  );
}
