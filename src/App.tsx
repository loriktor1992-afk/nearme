import React, { useEffect } from 'react';
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

  return (
    <ErrorBoundary>
      <div className="w-full h-full overflow-hidden">
        {isRegistered ? <MapScreen /> : <RegistrationScreen />}
      </div>
    </ErrorBoundary>
  );
}
