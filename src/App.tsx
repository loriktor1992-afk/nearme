import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import RegistrationScreen from './components/RegistrationScreen';
import MapScreen from './components/MapScreen';
import { initTelegramApp } from './telegram';

export default function App() {
  const isRegistered = useStore(s => s.isRegistered);
  const theme = useStore(s => s.theme);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initTelegramApp();
    } catch (e) {
      console.log('Not running in Telegram, using web mode');
    }
    
    // Проверяем что store инициализирован
    try {
      const state = useStore.getState();
      console.log('Store initialized, isRegistered:', state.isRegistered);
    } catch (e) {
      console.error('Store error:', e);
      setError('Ошибка инициализации');
    }
    
    setIsReady(true);
  }, []);

  // Apply theme on load
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(isDark ? 'dark' : 'light');
      } else {
        root.classList.add(theme);
      }
    } catch (e) {
      console.error('Theme error:', e);
    }
  }, [theme]);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 p-4">
        <div className="text-center bg-white/20 backdrop-blur-lg rounded-2xl p-6">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-white text-lg mb-2">Ошибка загрузки</p>
          <p className="text-white/70 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-purple-600 rounded-xl font-bold"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

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
