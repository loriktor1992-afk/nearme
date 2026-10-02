import React from 'react';
import { useStore } from '../store';

export default function FiltersPanel() {
  const { filters, setFilters, resetFilters, setShowFilters } = useStore();

  return (
    <div className="fixed inset-0 z-[3000] flex items-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowFilters(false)}
      />

      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <i className="fas fa-arrow-left text-gray-600"></i>
            </button>
            <h2 className="text-xl font-bold text-gray-800">Фильтры</h2>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Gender */}
          <div>
            <label className="block font-bold text-gray-800 mb-3">
              <i className="fas fa-venus-mars text-purple-500 mr-2"></i>
              Пол
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFilters({ gender: 'all' })}
                className={`py-3 rounded-xl font-medium transition-all ${
                  filters.gender === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilters({ gender: 'female' })}
                className={`py-3 rounded-xl font-medium transition-all ${
                  filters.gender === 'female'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                👩 Девушки
              </button>
              <button
                onClick={() => setFilters({ gender: 'male' })}
                className={`py-3 rounded-xl font-medium transition-all ${
                  filters.gender === 'male'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                👨 Парни
              </button>
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="block font-bold text-gray-800 mb-3">
              <i className="fas fa-birthday-cake text-purple-500 mr-2"></i>
              Возраст
            </label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-1 block">От</label>
                <input
                  type="number"
                  min="14"
                  max="99"
                  value={filters.ageMin}
                  onChange={e => {
                    const val = e.target.value === '' ? 14 : parseInt(e.target.value);
                    if (!isNaN(val) && val >= 14 && val <= 99) {
                      if (val < filters.ageMax) {
                        setFilters({ ageMin: val });
                      } else {
                        setFilters({ ageMin: filters.ageMax - 1 });
                      }
                    }
                  }}
                  onBlur={e => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val < 14) {
                      setFilters({ ageMin: 14 });
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none text-center text-lg font-semibold"
                  placeholder="14"
                />
              </div>
              <div className="text-2xl text-gray-400 pt-6">—</div>
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-1 block">До</label>
                <input
                  type="number"
                  min="14"
                  max="99"
                  value={filters.ageMax}
                  onChange={e => {
                    const val = e.target.value === '' ? 99 : parseInt(e.target.value);
                    if (!isNaN(val) && val >= 14 && val <= 99) {
                      if (val > filters.ageMin) {
                        setFilters({ ageMax: val });
                      } else {
                        setFilters({ ageMax: filters.ageMin + 1 });
                      }
                    }
                  }}
                  onBlur={e => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val > 99) {
                      setFilters({ ageMax: 99 });
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none text-center text-lg font-semibold"
                  placeholder="99"
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block font-bold text-gray-800 mb-3">
              <i className="fas fa-location-dot text-purple-500 mr-2"></i>
              Расстояние: до {filters.distanceMax} км
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.distanceMax}
              onChange={e => setFilters({ distanceMax: parseInt(e.target.value) })}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 км</span>
              <span>50 км</span>
              <span>100 км</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={resetFilters}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
            >
              Сбросить
            </button>
            <button
              onClick={() => setShowFilters(false)}
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
