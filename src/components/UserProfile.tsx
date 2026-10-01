import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { getDistance, formatDistance } from '../utils/helpers';

export default function UserProfile() {
  const { selectedUser, currentUser, setShowProfile, setShowChat, uploadAvatar, updateStatus, likeUser, unlikeUser, viewProfile } = useStore();
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusText, setStatusText] = useState(selectedUser?.status || '');
  const [liked, setLiked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    if (selectedUser && currentUser) {
      setLiked(selectedUser.likes?.includes(currentUser.id) || false);
      // Отслеживаем просмотр профиля
      if (selectedUser.id !== currentUser.id) {
        viewProfile(selectedUser.id);
      }
    }
  }, [selectedUser?.id, currentUser?.id]);
  
  if (!selectedUser || !currentUser) return null;

  const isMe = selectedUser.id === currentUser.id;
  
  const handleLike = () => {
    if (liked) {
      unlikeUser(selectedUser.id);
      setLiked(false);
    } else {
      likeUser(selectedUser.id);
      setLiked(true);
    }
  };

  const distance = getDistance(currentUser.lat, currentUser.lng, selectedUser.lat, selectedUser.lng);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка размера - до 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('Фото слишком большое. Максимум 50MB');
      return;
    }

    try {
      await uploadAvatar(file);
    } catch (error) {
      alert('Ошибка загрузки фото');
    }
  };

  const handleStatusSave = () => {
    updateStatus(statusText);
    setEditingStatus(false);
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-end">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowProfile(false)}
      />
      
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with photo */}
        <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 pt-8 pb-20 px-6 relative">
          <button
            onClick={() => setShowProfile(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
          >
            <i className="fas fa-times text-white"></i>
          </button>
          
          <div className="text-center">
            {/* Photo */}
            <div className="relative inline-block">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-lg border-4 border-white overflow-hidden mx-auto mb-3">
                {selectedUser.photoUrl ? (
                  <img src={selectedUser.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {selectedUser.avatar}
                  </div>
                )}
              </div>
              
              {/* Upload button for own profile */}
              {isMe && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <i className="fas fa-camera text-purple-600 text-sm"></i>
                </button>
              )}
              
              {/* Online indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 translate-y-8">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-700 font-medium">Онлайн</span>
                </div>
              </div>
            </div>

            {/* Name and age */}
            <h2 className="text-2xl font-bold text-white mt-6">{selectedUser.name}, {selectedUser.age}</h2>
            
            {/* Status */}
            <div className="mt-2">
              {isMe && editingStatus ? (
                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="text"
                    value={statusText}
                    onChange={e => setStatusText(e.target.value)}
                    placeholder="Ваш статус..."
                    className="bg-white/20 backdrop-blur text-white placeholder-white/60 px-3 py-1 rounded-full text-sm outline-none border border-white/30 w-48"
                    autoFocus
                    maxLength={50}
                  />
                  <button
                    onClick={handleStatusSave}
                    className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <i className="fas fa-check text-white text-xs"></i>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => isMe && setEditingStatus(true)}
                  className={`text-white/80 text-sm ${isMe ? 'cursor-pointer hover:text-white' : ''}`}
                >
                  {selectedUser.status || (isMe ? '✏️ Нажми чтобы добавить статус' : '')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 -mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 space-y-4">
            {/* Distance */}
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-location-dot text-purple-500"></i>
              <span className="text-gray-600 dark:text-gray-300">{formatDistance(distance)} от тебя</span>
            </div>

            {/* Bio */}
            <div className="text-center">
              <p className="text-gray-700 text-base">{selectedUser.bio}</p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 py-2">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{selectedUser.age}</div>
                <div className="text-xs text-gray-500">возраст</div>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {distance < 500 ? '🔥' : '📍'}
                </div>
                <div className="text-xs text-gray-500">
                  {distance < 500 ? 'очень близко' : 'рядом'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 pb-8 flex gap-3">
          {isMe ? (
            <button
              onClick={() => setShowProfile(false)}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl active:scale-95 transition-all"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Назад
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowProfile(false)}
                className="px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl active:scale-95 transition-all"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Назад
              </button>
              <button
                onClick={() => { setShowProfile(false); setShowChat(true); }}
                className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-comment-dots"></i>
                Написать
              </button>
              <button
                onClick={handleLike}
                className={`px-6 py-3.5 ${liked ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'} font-semibold rounded-xl active:scale-95 transition-all`}
              >
                <i className={`fas fa-heart ${liked ? 'text-white' : 'text-pink-500'}`}></i>
              </button>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
