import React from 'react';
import { useStore } from './store';
import RegistrationScreen from './components/RegistrationScreen';
import MapScreen from './components/MapScreen';

export default function App() {
  const isRegistered = useStore(s => s.isRegistered);

  return (
    <div className="w-full h-full overflow-hidden">
      {isRegistered ? <MapScreen /> : <RegistrationScreen />}
    </div>
  );
}
