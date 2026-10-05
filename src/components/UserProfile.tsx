import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { getDistance, formatDistance, getZodiacSign } from '../utils/helpers';
import PhotoViewer, { photoKey } from './PhotoViewer';

export default function UserProfile() {
  const { selectedUser, currentUser, setShowProfile, setShowChat, uploadAvatar, updateStatus, likeUser, unlikeUser, viewProfile, setShowFullProfile } = useStore();
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusText, setStatusText] = useState(selectedUser?.status || '');
  const [liked, setLiked] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
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
      
      <div className="relative w-full bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-2xl font-bold text-white mt-6 flex items-center justify-center gap-2">
              {selectedUser.name}, {selectedUser.age}
              {selectedUser.verified && (
                <i className="fas fa-check-circle text-blue-400"></i>
              )}
            </h2>
            
            {/* Status */}
            <div className="mt-2">
              {isMe && editingStatus ? (
                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="text"
                    value={statusText}
                    onChange={e => setStatusText(e.target.value)}
                    placeholder="Ваш статус..."
                    className="bg-white/20 backdrop-blur text-white text-center text-sm px-3 py-1 rounded-full outline-none border border-white/30 w-48"
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
          <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg p-4 space-y-4">
            {/* Distance */}
            {selectedUser.privacySettings?.showDistance !== false && (
              <div className="flex items-center justify-center gap-2">
                <i className="fas fa-location-dot text-purple-500"></i>
                <span className="text-gray-600 dark:text-gray-300">{formatDistance(distance)} от тебя</span>
              </div>
            )}

            {/* Bio */}
            {selectedUser.bio && (
              <div className="text-center">
                <p className="text-gray-700 dark:text-gray-200 text-base">{selectedUser.bio}</p>
              </div>
            )}

            {/* Looking for */}
            {selectedUser.lookingFor && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <i className="fas fa-heart text-pink-500 mr-1"></i>
                  {selectedUser.lookingFor}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex justify-center gap-6 py-2">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{selectedUser.age}</div>
                <div className="text-xs text-gray-500">возраст</div>
              </div>
              {selectedUser.height > 0 && (
                <>
                  <div className="w-px bg-gray-200 dark:bg-gray-600"></div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{selectedUser.height} см</div>
                    <div className="text-xs text-gray-500">рост</div>
                  </div>
                </>
              )}
              <div className="w-px bg-gray-200 dark:bg-gray-600"></div>
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

        {/* Photo Gallery */}
        {selectedUser.photos && selectedUser.photos.length > 0 && (
          <div className="px-6 mt-4">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              <i className="fas fa-images text-purple-500 mr-2"></i>
              Фотографии ({selectedUser.photos.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {selectedUser.photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setSelectedPhotoIndex(idx);
                  }}
                  className="group relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900"
                >
                  <img src={photo} alt="" className="h-full w-full object-cover transition duration-200 group-active:scale-[0.98]" />
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-bold text-white backdrop-blur">
                    <i className="fas fa-heart" /> {selectedUser.photoLikeCounts?.[photoKey(photo)] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {selectedUser.interests && selectedUser.interests.length > 0 && (
          <div className="px-6 mt-4">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              <i className="fas fa-heart text-pink-500 mr-2"></i>
              Интересы
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedUser.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {selectedUser.languages && selectedUser.languages.length > 0 && (
          <div className="px-6 mt-4">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              <i className="fas fa-language text-blue-500 mr-2"></i>
              Языки
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedUser.languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="px-6 mt-4 pb-4">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3">
            <i className="fas fa-info-circle text-purple-500 mr-2"></i>
            Информация
          </h3>
          <div className="space-y-2">
            {selectedUser.city && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <i className="fas fa-map-marker-alt text-purple-400 w-5"></i>
                <span>{selectedUser.city}</span>
              </div>
            )}
            {selectedUser.birthDay && selectedUser.birthMonth && selectedUser.birthYear && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <i className="fas fa-birthday-cake text-purple-400 w-5"></i>
                <span>
                  {selectedUser.birthDay}.{selectedUser.birthMonth.toString().padStart(2, '0')}.{selectedUser.birthYear}
                  {` (${getZodiacSign(selectedUser.birthDay, selectedUser.birthMonth)})`}
                </span>
              </div>
            )}
            {selectedUser.activityTime && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <i className="fas fa-clock text-purple-400 w-5"></i>
                <span>{selectedUser.activityTime}</span>
              </div>
            )}
            {selectedUser.level && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <i className="fas fa-star text-purple-400 w-5"></i>
                <span>Уровень {selectedUser.level}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 pb-8 flex gap-3">
          {isMe ? (
            <>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setShowFullProfile(true);
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-edit"></i>
                Редактировать
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowProfile(false); setShowChat(true); }}
                className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-comment-dots"></i>
                Написать
              </button>
              <button
                onClick={handleLike}
                className={`px-6 py-3.5 ${liked ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'} font-semibold rounded-xl active:scale-95 transition-all`}
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

      {/* Photo Viewer Modal */}
      {selectedPhoto && selectedUser.photos && (
        <PhotoViewer
          photos={selectedUser.photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhoto(null)}
          isOwner={isMe}
          ownerUid={selectedUser.id}
          ownerName={selectedUser.name}
          initialCounts={selectedUser.photoLikeCounts}
        />
      )}
    </div>
  );
}
