import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { hapticFeedback } from '../telegram';

export default function EditProfile() {
  const { currentUser, updateProfile, uploadPhoto, deletePhoto, setShowEditProfile } = useStore();
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [interests, setInterests] = useState(currentUser?.interests.join(', ') || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentUser.photos.length >= 6) {
      alert('Максимум 6 фотографий');
      return;
    }

    setUploading(true);
    try {
      await uploadPhoto(file);
      hapticFeedback.success();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки');
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    if (confirm('Удалить фото?')) {
      await deletePhoto(photoIndex);
      hapticFeedback.light();
    }
  };

  const handleSave = () => {
    const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i);
    updateProfile({
      name: name.trim() || currentUser.name,
      bio: bio.trim(),
      interests: interestsArray,
    });
    hapticFeedback.success();
    setShowEditProfile(false);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
        <button
          onClick={() => setShowEditProfile(false)}
          className="text-purple-600 dark:text-purple-400 font-medium"
        >
          Отмена
        </button>
        <h2 className="font-bold text-gray-800 dark:text-white">Редактировать профиль</h2>
        <button
          onClick={handleSave}
          className="text-purple-600 dark:text-purple-400 font-bold"
        >
          Сохранить
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Photos */}
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-3">Фотографии</h3>
          <div className="grid grid-cols-3 gap-2">
            {currentUser.photos.map((photo, photoIndex) => (
              <div key={`${photo}-${photoIndex}`} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeletePhoto(photoIndex)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <i className="fas fa-times text-white text-xs"></i>
                </button>
              </div>
            ))}
            {currentUser.photos.length < 6 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-purple-400 hover:text-purple-400 transition-colors"
              >
                {uploading ? (
                  <i className="fas fa-spinner fa-spin text-2xl"></i>
                ) : (
                  <>
                    <i className="fas fa-plus text-2xl mb-1"></i>
                    <span className="text-xs">Добавить</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {currentUser.photos.length}/6 фотографий
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="block font-bold text-gray-800 dark:text-white mb-2">Имя</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:border-purple-500"
            maxLength={20}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block font-bold text-gray-800 dark:text-white mb-2">О себе</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:border-purple-500 resize-none h-24"
            maxLength={150}
            placeholder="Расскажи о себе..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {bio.length}/150
          </p>
        </div>

        {/* Interests */}
        <div>
          <label className="block font-bold text-gray-800 dark:text-white mb-2">Интересы</label>
          <input
            type="text"
            value={interests}
            onChange={e => setInterests(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none focus:border-purple-500"
            placeholder="Музыка, спорт, кино..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Через запятую
          </p>
        </div>

        {/* Info */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            <i className="fas fa-info-circle mr-2"></i>
            Возраст и пол нельзя изменить
          </p>
        </div>
      </div>
    </div>
  );
}
