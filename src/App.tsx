import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import RegistrationScreen from './components/RegistrationScreen';
import MapScreen from './components/MapScreen';
import { initTelegramApp, isTelegram } from './telegram';

export default function App() {
  const isRegistered = useStore(s => s.isRegistered);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Инициализация Telegram Mini App
    try {
      initTelegramApp();
    } catch (e) {
      console.log('Not running in Telegram, using web mode');
    }
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">💕</div>
          <p className="text-white text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      {isRegistered ? <MapScreen /> : <RegistrationScreen />}
    </div>
  );
}
