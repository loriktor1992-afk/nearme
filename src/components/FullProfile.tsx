import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { getZodiacSign } from '../utils/helpers';
import PhotoViewer, { photoKey } from './PhotoViewer';

export default function FullProfile() {
  const { currentUser, setShowFullProfile, uploadAvatar, uploadPhoto, deletePhoto, updateProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'main' | 'about' | 'interests' | 'social' | 'privacy'>('main');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [photoLikes, setPhotoLikes] = useState<Record<number, boolean>>({});

  // Form states
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editStatus, setEditStatus] = useState(currentUser?.status || '');
  const [editCity, setEditCity] = useState(currentUser?.city || '');
  const [editHeight, setEditHeight] = useState(currentUser?.height || 0);
  const [editBirthDay, setEditBirthDay] = useState(currentUser?.birthDay || 1);
  const [editBirthMonth, setEditBirthMonth] = useState(currentUser?.birthMonth || 1);
  const [editBirthYear, setEditBirthYear] = useState(currentUser?.birthYear || new Date().getFullYear() - (currentUser?.age || 0));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
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
    visibilityMode: 'online' as const,
    visibilityRadius: 5000,
    blockedUsers: [],
    showOnMap: true,
  });

  if (!currentUser) return null;

  // Значения по умолчанию для старых пользователей
  const userLevel = currentUser.level || 1;
  const userLikes = currentUser.likes || [];
  const userViews = currentUser.profileViews || [];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка размера - до 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('Фото слишком большое. Максимум 50MB');
      return;
    }
    
    setUploading(true);
    try {
      await uploadAvatar(file);
    } catch (error: any) {
      alert(error.message || 'Ошибка загрузки фото');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка размера - до 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('Фото слишком большое. Максимум 50MB');
      return;
    }
    
    setUploading(true);
    try {
      await uploadPhoto(file);
    } catch (error: any) {
      alert(error.message || 'Ошибка загрузки фото');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    if (confirm('Удалить это фото?')) {
      deletePhoto(index);
      // Удаляем лайк если он был
      const newLikes = { ...photoLikes };
      delete newLikes[index];
      setPhotoLikes(newLikes);
    }
  };

  const togglePhotoLike = (index: number) => {
    setPhotoLikes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && selectedPhotoIndex < (currentUser.photos?.length || 0) - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(currentUser.photos![newIndex]);
    }
    
    if (isRightSwipe && selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(currentUser.photos![newIndex]);
    }
  };

  const handleSave = () => {
    const currentYear = new Date().getFullYear();
    const newAge = currentYear - editBirthYear;
    
    updateProfile({
      name: editName.trim() || currentUser.name,
      bio: editBio.trim(),
      status: editStatus.trim(),
      city: editCity.trim(),
      height: editHeight,
      birthDay: editBirthDay,
      birthMonth: editBirthMonth,
      birthYear: editBirthYear,
      age: newAge,
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

  const getZodiac = () => {
    const day = currentUser.birthDay || 1;
    const month = currentUser.birthMonth || 1;
    return getZodiacSign(day, month);
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
    <div className="fixed inset-0 z-[2500] overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-slate-950 px-4 pb-12 pt-[max(18px,env(safe-area-inset-top))] text-white">
        <button
          onClick={() => setShowFullProfile(false)}
          className="absolute left-4 top-[max(16px,env(safe-area-inset-top))] z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-xl transition active:scale-95"
        >
          <i className="fas fa-arrow-left text-white"></i>
        </button>

        {editing ? (
          <button
            onClick={handleSave}
            className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] z-10 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-xl active:scale-95"
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
        <div className="relative z-[1] mt-14 text-center">
          <div className="relative inline-block">
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-[34px] border border-white/20 bg-white/10 shadow-[0_24px_60px_rgba(124,58,237,.30)] backdrop-blur-xl">
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
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-xl disabled:opacity-50"
            >
              {uploading ? (
                <i className="fas fa-spinner fa-spin text-violet-600"></i>
              ) : (
                <i className="fas fa-camera text-violet-600"></i>
              )}
            </button>
            {currentUser.verified === true && (
              <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
            )}
          </div>

          <h1 className="mt-5 flex items-center justify-center gap-2 text-3xl font-black tracking-tight text-white">
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
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 backdrop-blur-xl">
            <span className="text-white text-sm">{getLevelTitle(userLevel)}</span>
            <span className="text-white/60 text-xs">Уровень {userLevel}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/92 px-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/92">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-w-[112px] flex-1 whitespace-nowrap px-4 py-3.5 text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <i className={`fas ${tab.icon} mr-1`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl p-4 pb-[max(32px,env(safe-area-inset-bottom))]">
        {/* Main Tab */}
        {activeTab === 'main' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-chart-bar text-violet-500"></i>
                Статистика
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-violet-600">{userLikes.length}</div>
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
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-info-circle text-violet-500"></i>
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
                      className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
                    />
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">{currentUser.city || 'Не указан'}</span>
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
                      className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
                    />
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">{currentUser.height ? `${currentUser.height} см` : 'Не указан'}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-birthday-cake text-purple-400 w-5"></i>
                  {editing ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        value={editBirthDay}
                        onChange={e => setEditBirthDay(parseInt(e.target.value) || 1)}
                        placeholder="День"
                        min="1"
                        max="31"
                        className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white text-center"
                      />
                      <input
                        type="number"
                        value={editBirthMonth}
                        onChange={e => setEditBirthMonth(parseInt(e.target.value) || 1)}
                        placeholder="Месяц"
                        min="1"
                        max="12"
                        className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white text-center"
                      />
                      <input
                        type="number"
                        value={editBirthYear}
                        onChange={e => setEditBirthYear(parseInt(e.target.value) || 0)}
                        placeholder="Год"
                        min="1950"
                        max={new Date().getFullYear() - 14}
                        className="flex-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white text-center"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">
                      {currentUser.birthDay && currentUser.birthMonth && currentUser.birthYear 
                        ? `${currentUser.birthDay}.${currentUser.birthMonth.toString().padStart(2, '0')}.${currentUser.birthYear} (${currentUser.age} лет)` 
                        : `${currentUser.age} лет`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-star text-purple-400 w-5"></i>
                  <span className="text-slate-600 dark:text-slate-300">{getZodiac()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-clock text-purple-400 w-5"></i>
                  {editing ? (
                    <input
                      type="text"
                      value={editActivityTime}
                      onChange={e => setEditActivityTime(e.target.value)}
                      placeholder="Когда обычно онлайн"
                      className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
                    />
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">{currentUser.activityTime || 'Не указано'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Gallery Feed */}
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <i className="fas fa-images text-violet-500"></i>
                  Мои фотографии
                </h3>
                {(!currentUser.photos || currentUser.photos.length < 30) && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <i className="fas fa-camera"></i>
                    Добавить
                  </button>
                )}
              </div>
              
              {currentUser.photos && currentUser.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {currentUser.photos.map((photo, idx) => (
                    <div 
                      key={idx} 
                      className="relative aspect-square cursor-pointer group overflow-hidden"
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setSelectedPhotoIndex(idx);
                      }}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-white">
                        <span className="flex items-center gap-1 text-xs font-bold">
                          <i className="fas fa-heart" /> {currentUser.photoLikeCounts?.[photoKey(photo)] || 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(idx);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45"
                          aria-label="Удалить фотографию"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-camera text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">Пока нет фотографий</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Добавьте первое фото в свою ленту</p>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <i className="fas fa-camera mr-2"></i>
                    Добавить первое фото
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-user text-violet-500"></i>
                О себе
              </h3>
              {editing ? (
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Расскажи о себе..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white resize-none h-32"
                  maxLength={300}
                />
              ) : (
                <p className="text-slate-600 dark:text-slate-300">{currentUser.bio || 'Пока пусто...'}</p>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-heart text-pink-500"></i>
                Кого ищу
              </h3>
              {editing ? (
                <input
                  type="text"
                  value={editLookingFor}
                  onChange={e => setEditLookingFor(e.target.value)}
                  placeholder="Дружба, отношения, общение..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
                  maxLength={100}
                />
              ) : (
                <p className="text-slate-600 dark:text-slate-300">{currentUser.lookingFor || 'Не указано'}</p>
              )}
            </div>
          </div>
        )}

        {/* Interests Tab */}
        {activeTab === 'interests' && (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-tags text-violet-500"></i>
                Интересы
              </h3>
              {editing ? (
                <input
                  type="text"
                  value={editInterests}
                  onChange={e => setEditInterests(e.target.value)}
                  placeholder="Через запятую: музыка, спорт, кино"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests && currentUser.interests.length > 0 ? (
                    currentUser.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 rounded-full text-sm">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">Не указаны</p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                <i className="fas fa-language text-blue-500"></i>
                Языки
              </h3>
              {editing ? (
                <input
                  type="text"
                  value={editLanguages}
                  onChange={e => setEditLanguages(e.target.value)}
                  placeholder="Через запятую: Русский, English"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
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
          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
              <i className="fas fa-share-alt text-violet-500"></i>
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-950 dark:text-white"
                  disabled={!editing}
                />
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
              <i className="fas fa-lock text-violet-500"></i>
              Настройки приватности
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-950 dark:text-white">Показывать расстояние</div>
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
                  <div className="font-medium text-slate-950 dark:text-white">Показывать время активности</div>
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
                  <div className="font-medium text-slate-950 dark:text-white">Разрешить сообщения</div>
                  <div className="text-sm text-gray-500">Кто может писать вам</div>
                </div>
                <button
                  onClick={() => setPrivacySettings({ ...privacySettings, allowMessages: !privacySettings.allowMessages })}
                  className={`w-12 h-6 rounded-full transition-colors ${privacySettings.allowMessages ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${privacySettings.allowMessages ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              
              {/* Кнопка расширенных настроек */}
              <button
                onClick={() => {
                  const { setShowPrivacySettings } = useStore.getState();
                  setShowPrivacySettings(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <i className="fas fa-cog"></i>
                Расширенные настройки приватности
              </button>
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

      {/* Photo Viewer Modal */}
      {selectedPhoto && currentUser.photos && (
        <PhotoViewer
          photos={currentUser.photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhoto(null)}
          isOwner
          ownerUid={currentUser.id}
          ownerName={currentUser.name}
          ownerAvatar={currentUser.photoUrl}
          initialCounts={currentUser.photoLikeCounts}
        />
      )}
    </div>
  );
}
