import React, { useState } from 'react';
import { useStore } from '../store';

export default function PrivacySettings() {
  const { currentUser, updateProfile, setShowPrivacySettings } = useStore();
  
  const [visibilityMode, setVisibilityMode] = useState<'online' | 'hidden' | 'ghost'>(
    currentUser?.privacySettings?.visibilityMode || 'online'
  );
  const [showOnMap, setShowOnMap] = useState(currentUser?.privacySettings?.showOnMap ?? true);
  const [visibilityRadius, setVisibilityRadius] = useState(currentUser?.privacySettings?.visibilityRadius || 5000);
  const [allowMessages, setAllowMessages] = useState(currentUser?.privacySettings?.allowMessages ?? true);
  const [showDistance, setShowDistance] = useState(currentUser?.privacySettings?.showDistance ?? true);
  const [showLastSeen, setShowLastSeen] = useState(currentUser?.privacySettings?.showLastSeen ?? true);
  const [shareExactLocation, setShareExactLocation] = useState(currentUser?.privacySettings?.shareExactLocation ?? false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(currentUser?.privacySettings?.blockedUsers || []);

  if (!currentUser) return null;

  const handleSave = () => {
    updateProfile({
      privacySettings: {
        ...currentUser.privacySettings,
        visibilityMode,
        showOnMap,
        visibilityRadius,
        allowMessages,
        showDistance,
        showLastSeen,
        shareExactLocation,
        blockedUsers,
      },
    });
    setShowPrivacySettings(false);
  };

  const visibilityModes = [
    {
      id: 'online',
      icon: '🟢',
      title: 'Я онлайн',
      description: 'Виден на карте. Другие пользователи видят ваше местоположение.',
      color: 'bg-green-50 border-green-500',
    },
    {
      id: 'hidden',
      icon: '⚫',
      title: 'Скрыт',
      description: 'Пользователь пользуется приложением, но его никто не видит на карте.',
      color: 'bg-gray-50 border-gray-500',
    },
    {
      id: 'ghost',
      icon: '👻',
      title: 'Призрачный режим',
      description: 'Можно видеть людей, но не показывать себя. Premium функция.',
      color: 'bg-purple-50 border-purple-500',
      premium: !currentUser.isPremium,
    },
  ];

  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Настройки приватности</h2>
          <button
            onClick={() => setShowPrivacySettings(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-times text-gray-600 dark:text-gray-300"></i>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Режим видимости */}
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">Режим видимости</h3>
            <div className="space-y-2">
              {visibilityModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => !mode.premium && setVisibilityMode(mode.id as any)}
                  disabled={mode.premium}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    visibilityMode === mode.id
                      ? mode.color
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  } ${mode.premium ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{mode.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 dark:text-white">{mode.title}</span>
                        {mode.premium && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {mode.description}
                      </p>
                    </div>
                    {visibilityMode === mode.id && (
                      <i className="fas fa-check text-green-500 text-xl"></i>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Показ на карте */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Показываться на карте</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ваш маркер будет виден другим пользователям
                </div>
              </div>
              <button
                onClick={() => setShowOnMap(!showOnMap)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  showOnMap ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    showOnMap ? 'translate-x-7' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>

          {/* Точная геопозиция */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Показывать точное местоположение</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Выключено по умолчанию. При включении другие пользователи смогут видеть вашу точную позицию на карте.
                </div>
              </div>
              <button
                onClick={() => setShareExactLocation(!shareExactLocation)}
                className={`w-14 h-8 shrink-0 rounded-full transition-colors ${
                  shareExactLocation ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                aria-pressed={shareExactLocation}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  shareExactLocation ? 'translate-x-7' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
            {shareExactLocation && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
                Точная геопозиция включена. Отключите эту настройку, чтобы снова показывать только приблизительное местоположение.
              </div>
            )}
          </div>

          {/* Радиус видимости */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
            <div className="font-bold text-gray-800 dark:text-white mb-2">
              Радиус видимости: {visibilityRadius / 1000} км
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={visibilityRadius}
              onChange={e => setVisibilityRadius(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 км</span>
              <span>25 км</span>
              <span>50 км</span>
            </div>
          </div>

          {/* Сообщения */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Разрешить сообщения</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Кто может писать вам сообщения
                </div>
              </div>
              <button
                onClick={() => setAllowMessages(!allowMessages)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  allowMessages ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    allowMessages ? 'translate-x-7' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>

          {/* Показ расстояния */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Показывать расстояние</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Другие видят сколько метров до вас
                </div>
              </div>
              <button
                onClick={() => setShowDistance(!showDistance)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  showDistance ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    showDistance ? 'translate-x-7' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>

          {/* Показ последнего посещения */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800 dark:text-white">Показывать время активности</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Когда вы были онлайн
                </div>
              </div>
              <button
                onClick={() => setShowLastSeen(!showLastSeen)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  showLastSeen ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    showLastSeen ? 'translate-x-7' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>

          {/* Заблокированные пользователи */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
            <div className="font-bold text-gray-800 dark:text-white mb-2">
              Заблокированные пользователи
            </div>
            {blockedUsers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Нет заблокированных пользователей
              </p>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map(userId => (
                  <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{userId}</span>
                    <button
                      onClick={() => setBlockedUsers(blockedUsers.filter(id => id !== userId))}
                      className="text-red-500 hover:text-red-600"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPrivacySettings(false)}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-semibold"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
