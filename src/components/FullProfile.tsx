import React, { useState, useRef } from 'react';
import { useStore } from '../store';

export default function FullProfile() {
  const { currentUser, setShowFullProfile, uploadAvatar, uploadPhoto, deletePhoto, updateProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'main' | 'about' | 'interests' | 'social' | 'privacy'>('main');
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editStatus, setEditStatus] = useState(currentUser?.status || '');
  const [editCity, setEditCity] = useState(currentUser?.city || '');
  const [editHeight, setEditHeight] = useState(currentUser?.height || 0);
  const [editLookingFor, setEditLookingFor] = useState(currentUser?.lookingFor || '');
  const [editActivityTime, setEditActivityTime] = useState(currentUser?.activityTime || '');
  const [editInterests, setEditInterests] = useState(currentUser?.interests?.join(', ') || '');
  const [editLanguages, setEditLanguages] = useState(currentUser?.languages?.join(', ') || '');
  const [editInstagram, setEditInstagram] = useState(currentUser?.socialLinks?.instagram || '');
  const [editVk, setEditVk] = useState(currentUser?.socialLinks?.vk || '');
  const [editTelegram, setEditTelegram] = useState(currentUser?.socialLinks?.telegram || '');
  const [privacySettings, setPrivacySettings] = useState(currentUser?.privacySettings || {
    showDistance: true,
    showLastSeen: true,
    allowMessages: true,
  });

  if (!currentUser) return null;

  // Значения по умолчанию для старых пользователей
  const userLevel = currentUser.level || 1;
  const userLikes = currentUser.likes || [];
  const userViews = currentUser.profileViews || [];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Фото слишком большое. Максимум 2MB');
      return;
    }
    try {
      await uploadAvatar(file);
    } catch (error) {
      alert('Ошибка загрузки фото');
    }
  };

  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Фото слишком большое. Максимум 2MB');
      return;
    }
    try {
      await uploadPhoto(file);
    } catch (error: any) {
      alert(error.message || 'Ошибка загрузки фото');
    }
  };

  const handleDeletePhoto = (index: number) => {
    if (confirm('Удалить это фото?')) {
      deletePhoto(index);
    }
  };

  const handleSave = () => {
    updateProfile({
      name: editName.trim() || currentUser.name,
      bio: editBio.trim(),
      status: editStatus.trim(),
      city: editCity.trim(),
      height: editHeight,
      lookingFor: editLookingFor.trim(),
      activityTime: editActivityTime.trim(),
      interests: editInterests.split(',').map(i => i.trim()).filter(i => i),
      languages: editLanguages.split(',').map(l => l.trim()).filter(l => l),
      socialLinks: {
        instagram: editInstagram.trim(),
        vk: editVk.trim(),
        telegram: editTelegram.trim(),
      },
      privacySettings,
    });
    setEditing(false);
  };

  const getZodiac = (age: number) => {
    const zodiacs = ['Козерог', 'Водолей', 'Рыбы', 'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец'];
    return currentUser.zodiac || zodiacs[age % 12];
  };

  const getLevelTitle = (level: number) => {
    const lvl = level || 1;
    if (lvl >= 10) return '⭐ Легенда';
    if (lvl >= 7) return '🔥 Мастер';
    if (lvl >= 5) return '💎 Эксперт';
    if (lvl >= 3) return '🌟 Активист';
    return '🌱 Новичок';
  };

  const tabs = [
    { id: 'main', label: 'Основное', icon: 'fa-user' },
    { id: 'about', label: 'О себе', icon: 'fa-info-circle' },
    { id: 'interests', label: 'Интересы', icon: 'fa-heart' },
    { id: 'social', label: 'Соцсети', icon: 'fa-share-alt' },
    { id: 'privacy', label: 'Приватность', icon: 'fa-lock' },
  ];

  return (
    <div className="fixed inset-0 z-[2500] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 pt-8 pb-16 px-4 relative">
        <button
          onClick={() => setShowFullProfile(false)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <i className="fas fa-arrow-left text-white"></i>
        </button>

        {editing ? (
          <button
            onClick={handleSave}
            className="absolute top-4 right-4 px-4 py-2 bg-white/20 rounded-full text-white font-medium text-sm"
          >
            💾 Сохранить
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-4 right-4 px-4 py-2 bg-white/20 rounded-full text-white font-medium text-sm"
          >
            ✏️ Редактировать
          </button>
        )}

        {/* Photo & Basic Info */}
        <div className="text-center mt-4">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-lg border-4 border-white overflow-hidden mx-auto">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {currentUser.avatar}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
              <i className="fas fa-camera text-purple-600"></i>
            </button>
            {currentUser.verified === true && (
              <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mt-4 flex items-center justify-center gap-2">
            {currentUser.name}, {currentUser.age}
          </h1>

          {editing ? (
            <input
              type="text"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              placeholder="Ваш статус..."
              className="mt-2 bg-white/20 backdrop-blur text-white text-center text-sm px-4 py-2 rounded-xl outline-none border border-white/30 w-64"
              maxLength={50}
            />
          ) : (
            <p className="text-white/80 text-sm mt-2 italic">
              {currentUser.status || 'Нажми редактировать чтобы добавить статус'}
            </p>
          )}

          {/* Level & XP */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
            <span className="text-white text-sm">{getLevelTitle(userLevel)}</span>
            <span className="text-white/60 text-xs">Уровень {userLevel}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <i className={`fas ${tab.icon} mr-1`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        {/* Main Tab */}
        {activeTab === 'main' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-chart-bar text-purple-500"></i>
                Статистика
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">{userLikes.length}</div>
                  <div className="text-xs text-gray-500">Лайков</div>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-pink-600">{userViews.length}</div>
                  <div className="text-xs text-gray-500">Просмотров</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{userLevel}</div>
                  <div className="text-xs text-gray-500">Уровень</div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-info-circle text-purple-500"></i>
                Основная информация
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <i className="fas fa-map-marker-alt text-purple-400 w-5"></i>
                  {editing ? (
                    <input
                      type="text"
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      placeholder="Город"
                      className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300">{currentUser.city || 'Не указан'}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-ruler-vertical text-purple-400 w-5"></i>
                  {editing ? (
                    <input
                      type="number"
                      value={editHeight}
                      onChange={e => setEditHeight(parseInt(e.target.value) || 0)}
                      placeholder="Рост (см)"
                      className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300">{currentUser.height ? `${currentUser.height} см` : 'Не указан'}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-star text-purple-400 w-5"></i>
                  <span className="text-gray-600 dark:text-gray-300">{getZodiac(currentUser.age)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-clock text-purple-400 w-5"></i>
                  {editing ? (
                    <input
                      type="text"
                      value={editActivityTime}
                      onChange={e => setEditActivityTime(e.target.value)}
                      placeholder="Когда обычно онлайн"
                      className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300">{currentUser.activityTime || 'Не указано'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <i className="fas fa-images text-purple-500"></i>
                  Фотографии ({currentUser.photos?.length || 0}/6)
                </h3>
                {(!currentUser.photos || currentUser.photos.length < 6) && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-plus"></i>
                    Добавить
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {currentUser.photos && currentUser.photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeletePhoto(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
                {(!currentUser.photos || currentUser.photos.length < 6) && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-colors"
                  >
                    <i className="fas fa-plus text-2xl"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-user text-purple-500"></i>
                О себе
              </h3>
              {editing ? (
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Расскажи о себе..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none h-32"
                  maxLength={300}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{currentUser.bio || 'Пока пусто...'}</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-heart text-pink-500"></i>
                Кого ищу
              </h3>
              {editing ? (
                <input
                  type="text"
                  value={editLookingFor}
                  onChange={e => setEditLookingFor(e.target.value)}
                  placeholder="Дружба, отношения, общение..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  maxLength={100}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{currentUser.lookingFor || 'Не указано'}</p>
              )}
            </div>
          </div>
        )}

        {/* Interests Tab */}
        {activeTab === 'interests' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-tags text-purple-500"></i>
                Интересы
              </h3>
              {editing ? (
                <input
                  type="text"
                  value={editInterests}
                  onChange={e => setEditInterests(e.target.value)}
                  placeholder="Через запятую: музыка, спорт, кино"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests && currentUser.interests.length > 0 ? (
                    currentUser.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">Не указаны</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-language text-blue-500"></i>
                Языки
              </h3>
              {editing ? (
                <input
                  type="text"
                  value={editLanguages}
                  onChange={e => setEditLanguages(e.target.value)}
                  placeholder="Через запятую: Русский, English"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentUser.languages && currentUser.languages.length > 0 ? (
                    currentUser.languages.map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">Не указаны</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <i className="fas fa-share-alt text-purple-500"></i>
              Социальные сети
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Instagram</label>
                <input
                  type="text"
                  value={editInstagram}
                  onChange={e => setEditInstagram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">ВКонтакте</label>
                <input
                  type="text"
                  value={editVk}
                  onChange={e => setEditVk(e.target.value)}
                  placeholder="Ссылка на профиль"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Telegram</label>
                <input
                  type="text"
                  value={editTelegram}
                  onChange={e => setEditTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  disabled={!editing}
                />
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <i className="fas fa-lock text-purple-500"></i>
              Настройки приватности
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">Показывать расстояние</div>
                  <div className="text-sm text-gray-500">Другие видят сколько метров до вас</div>
                </div>
                <button
                  onClick={() => setPrivacySettings({ ...privacySettings, showDistance: !privacySettings.showDistance })}
                  className={`w-12 h-6 rounded-full transition-colors ${privacySettings.showDistance ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${privacySettings.showDistance ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">Показывать время активности</div>
                  <div className="text-sm text-gray-500">Когда вы были онлайн</div>
                </div>
                <button
                  onClick={() => setPrivacySettings({ ...privacySettings, showLastSeen: !privacySettings.showLastSeen })}
                  className={`w-12 h-6 rounded-full transition-colors ${privacySettings.showLastSeen ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${privacySettings.showLastSeen ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">Разрешить сообщения</div>
                  <div className="text-sm text-gray-500">Кто может писать вам</div>
                </div>
                <button
                  onClick={() => setPrivacySettings({ ...privacySettings, allowMessages: !privacySettings.allowMessages })}
                  className={`w-12 h-6 rounded-full transition-colors ${privacySettings.allowMessages ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${privacySettings.allowMessages ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryPhotoUpload}
        className="hidden"
      />
    </div>
  );
}
