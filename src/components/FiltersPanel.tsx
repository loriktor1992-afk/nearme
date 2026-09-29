import React from 'react';
import { useStore } from '../store';
import { hapticFeedback } from '../telegram';

export default function FiltersPanel() {
  const { filters, setFilters, resetFilters, setShowFilters, currentUser } = useStore();

  if (!currentUser) return null;

  const handleGenderChange = (gender: 'all' | 'male' | 'female') => {
    hapticFeedback.selection();
    setFilters({ gender });
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowFilters(false)}
      />

      {/* Panel */}
      <div className="relative w-full bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Фильтры</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 p-1"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Gender */}
          <div>
            <label className="block font-bold text-gray-800 dark:text-white mb-3">
              <i className="fas fa-venus-mars text-purple-500 mr-2"></i>
              Пол
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleGenderChange('all')}
                className={`py-3 rounded-xl font-medium transition-all ${
                  filters.gender === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => handleGenderChange('female')}
                className={`py-3 rounded-xl font-medium transition-all ${
                  filters.gender === 'female'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                👩 Девушки
              </button>
              <button
                onClick={() => handleGenderChange('male')}
                className={`py-3 rounded-xl font-medium transition-all ${
                  filters.gender === 'male'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                👨 Парни
              </button>
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="block font-bold text-gray-800 dark:text-white mb-3">
              <i className="fas fa-birthday-cake text-purple-500 mr-2"></i>
              Возраст: {filters.ageMin} — {filters.ageMax}
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">От</label>
                <input
                  type="range"
                  min="14"
                  max="60"
                  value={filters.ageMin}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    if (val < filters.ageMax) {
                      setFilters({ ageMin: val });
                    }
                  }}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">До</label>
                <input
                  type="range"
                  min="14"
                  max="99"
                  value={filters.ageMax}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    if (val > filters.ageMin) {
                      setFilters({ ageMax: val });
                    }
                  }}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block font-bold text-gray-800 dark:text-white mb-3">
              <i className="fas fa-location-dot text-purple-500 mr-2"></i>
              Расстояние: до {filters.distanceMax} км
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.distanceMax}
              onChange={e => {
                hapticFeedback.selection();
                setFilters({ distanceMax: parseInt(e.target.value) });
              }}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1 км</span>
              <span>50 км</span>
              <span>100 км</span>
            </div>
          </div>

          {/* Premium features */}
          {!currentUser.isPremium && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💎</span>
                <span className="font-bold text-gray-800 dark:text-white">Premium фильтры</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Получи доступ к расширенным фильтрам: интересы, онлайн статус, верифицированные пользователи
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                hapticFeedback.light();
                resetFilters();
              }}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
            >
              Сбросить
            </button>
            <button
              onClick={() => {
                hapticFeedback.success();
                setShowFilters(false);
              }}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
