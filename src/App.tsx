import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import RegistrationScreen from './components/RegistrationScreen';
import MapScreen from './components/MapScreen';
import { initTelegramApp } from './telegram';

export default function App() {
  const isRegistered = useStore(s => s.isRegistered);
  const theme = useStore(s => s.theme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      initTelegramApp();
    } catch (e) {
      console.log('Not running in Telegram, using web mode');
    }
    setIsReady(true);
  }, []);

  // Apply theme on load
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

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
