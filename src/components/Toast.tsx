import React from 'react';
import { useStore } from '../store';

export default function Toast() {
  const { toastMessage } = useStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[5000] animate-slide-down">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 border border-purple-200 dark:border-purple-700">
        <div className="text-2xl">💕</div>
        <p className="text-gray-800 dark:text-white font-medium">{toastMessage}</p>
      </div>
    </div>
  );
}
