import React from 'react';
import { useStore } from '../store';

export default function ThemeToggle() {
  const theme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
      aria-label="Переключить тему"
    >
      {theme === 'light' ? (
        <i className="fas fa-moon text-gray-600"></i>
      ) : (
        <i className="fas fa-sun text-yellow-400"></i>
      )}
    </button>
  );
}
