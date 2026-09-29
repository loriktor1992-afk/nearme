import React from 'react';
import { useStore } from '../store';
import { hapticFeedback, showAlert } from '../telegram';

export default function PremiumScreen() {
  const { currentUser, setShowPremium, activatePremium, toggleInvisible } = useStore();

  if (!currentUser) return null;

  const handleActivate = () => {
    // В реальном приложении здесь будет интеграция с Telegram Stars
    // Для демо просто активируем
    hapticFeedback.success();
    activatePremium();
    showAlert('💎 Premium активирован на 30 дней!');
    setShowPremium(false);
  };

  const features = [
    { icon: '👻', title: 'Режим невидимки', desc: 'Скрывай своё местоположение' },
    { icon: '🔍', title: 'Расширенные фильтры', desc: 'Поиск по интересам и статусу' },
    { icon: '⭐', title: 'Суперлайки', desc: '5 суперлайков в день' },
    { icon: '📸', title: 'Больше фото', desc: 'До 12 фотографий в профиле' },
    { icon: '👀', title: 'Кто смотрел', desc: 'Видеть кто заходил в профиль' },
    { icon: '🚀', title: 'Приоритет', desc: 'Твой профиль показывают первым' },
  ];

  return (
    <div className="fixed inset-0 z-[3000] bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 flex items-center justify-between">
        <button
          onClick={() => setShowPremium(false)}
          className="text-white/80 p-2"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        {currentUser.isPremium && (
          <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
            💎 ACTIVE
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="text-center px-5 pt-8 pb-6">
        <div className="text-7xl mb-4">💎</div>
        <h1 className="text-3xl font-bold text-white mb-2">NearMe Premium</h1>
        <p className="text-white/70">Открой все возможности приложения</p>
      </div>

      {/* Features */}
      <div className="px-5 space-y-3">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="text-3xl">{feature.icon}</div>
            <div className="flex-1">
              <div className="font-bold text-white">{feature.title}</div>
              <div className="text-sm text-white/60">{feature.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="px-5 pt-6 pb-8">
        {!currentUser.isPremium ? (
          <>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold">30 дней Premium</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">⭐ 250</div>
                  <div className="text-xs text-white/60">Telegram Stars</div>
                </div>
              </div>
              <p className="text-xs text-white/50">
                Оплата через Telegram Stars. Безопасно и быстро.
              </p>
            </div>

            <button
              onClick={handleActivate}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-lg"
            >
              💎 Активировать Premium
            </button>

            <p className="text-center text-white/40 text-xs mt-3">
              Демо-режим: нажмите для активации
            </p>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl p-5 mb-4 border border-yellow-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-yellow-400 font-bold text-lg">💎 Premium активен</div>
                  <div className="text-white/60 text-sm">
                    До {new Date(currentUser.premiumExpiresAt || 0).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="text-4xl">✨</div>
              </div>
            </div>

            {/* Invisible mode */}
            <button
              onClick={() => {
                hapticFeedback.medium();
                toggleInvisible();
              }}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                currentUser.isInvisible
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white/10 text-white'
              }`}
            >
              👻 Режим невидимки: {currentUser.isInvisible ? 'ВКЛ' : 'ВЫКЛ'}
            </button>

            {currentUser.isInvisible && (
              <p className="text-center text-white/50 text-xs mt-2">
                Другие пользователи не видят тебя на карте
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
