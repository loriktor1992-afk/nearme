import React, { useState, useRef } from 'react';
import { useStore } from '../store';

export default function FullProfile() {
  const { currentUser, setShowFullProfile, uploadAvatar, updateStatus, updateProfile } = useStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editStatus, setEditStatus] = useState(currentUser?.status || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

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

  const handleSave = () => {
    updateProfile({
      name: editName.trim() || currentUser.name,
      bio: editBio.trim(),
      status: editStatus.trim(),
    });
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 pt-12 pb-20 px-6 relative">
        <button
          onClick={() => setShowFullProfile(false)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left text-white"></i>
        </button>
        
        {editing && (
          <button
            onClick={handleSave}
            className="absolute top-4 right-4 px-4 py-2 bg-white/20 rounded-full text-white font-medium text-sm"
          >
            Сохранить
          </button>
        )}
        
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-4 right-4 px-4 py-2 bg-white/20 rounded-full text-white font-medium text-sm"
          >
            <i className="fas fa-edit mr-1"></i> Редактировать
          </button>
        )}

        {/* Photo */}
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
          </div>

          {/* Name */}
          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="mt-4 bg-white/20 backdrop-blur text-white text-center text-2xl font-bold px-4 py-2 rounded-xl outline-none border border-white/30 w-64"
              maxLength={20}
            />
          ) : (
            <h1 className="text-3xl font-bold text-white mt-4">{currentUser.name}, {currentUser.age}</h1>
          )}

          {/* Status */}
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

          {/* Online */}
          <div className="flex items-center gap-2 justify-center mt-3">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
            <span className="text-white/80 text-sm">Онлайн</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-10 pb-8">
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-5">
          {/* Bio */}
          <div>
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <i className="fas fa-user text-purple-500"></i>
              О себе
            </h3>
            {editing ? (
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Расскажи о себе..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 outline-none resize-none h-24"
                maxLength={200}
              />
            ) : (
              <p className="text-gray-600">{currentUser.bio || 'Пока пусто...'}</p>
            )}
          </div>

          {/* Info */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <i className="fas fa-info-circle text-purple-500"></i>
              Информация
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <i className="fas fa-birthday-cake text-purple-400 w-5"></i>
                <span className="text-gray-600">{currentUser.age} лет</span>
              </div>
              <div className="flex items-center gap-3">
                <i className={`fas ${currentUser.gender === 'female' ? 'fa-venus text-pink-400' : 'fa-mars text-blue-400'} w-5`}></i>
                <span className="text-gray-600">{currentUser.gender === 'female' ? 'Девушка' : 'Парень'}</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-purple-400 w-5"></i>
                <span className="text-gray-600">Москва</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <i className="fas fa-chart-bar text-purple-500"></i>
              Статистика
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-xs text-gray-500">Лайков</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-pink-600">0</div>
                <div className="text-xs text-gray-500">Чатов</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-indigo-600">0</div>
                <div className="text-xs text-gray-500">Просмотров</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-3">
          <button
            onClick={() => setShowFullProfile(false)}
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-map"></i>
            Вернуться на карту
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </div>
  );
}
