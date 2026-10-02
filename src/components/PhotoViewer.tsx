import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';

interface PhotoViewerProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
  isOwner?: boolean; // Показывать кнопки удаления и лайка
}

export default function PhotoViewer({ photos, initialIndex, onClose, isOwner = true }: PhotoViewerProps) {
  const { currentUser, deletePhoto } = useStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState<Record<number, boolean>>({});

  // Минимальное расстояние для свайпа
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDelete = () => {
    if (confirm('Удалить это фото?')) {
      deletePhoto(currentIndex);
      
      // Если это было последнее фото, закрываем просмотр
      if (photos.length === 1) {
        onClose();
      } else if (currentIndex >= photos.length - 1) {
        // Если удалили последнее фото, переходим на предыдущее
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleLike = () => {
    setIsLiked(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const handleDoubleClick = () => {
    if (!isLiked[currentIndex]) {
      handleLike();
    }
  };

  // Автоскрытие контролов через 3 секунды
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  return (
    <div 
      className="fixed inset-0 z-[4000] bg-black flex flex-col"
      onClick={() => setShowControls(!showControls)}
    >
      {/* Header */}
      <div 
        className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <i className="fas fa-times text-white text-xl"></i>
          </button>
          <div className="text-white font-semibold">
            {currentIndex + 1} / {photos.length}
          </div>
          {isOwner ? (
            <button
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
            >
              <i className="fas fa-trash text-white"></i>
            </button>
          ) : (
            <div className="w-10 h-10"></div>
          )}
        </div>
      </div>

      {/* Photo */}
      <div 
        className="flex-1 flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={photos[currentIndex]}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Bottom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Like Button */}
          {isOwner && (
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isLiked[currentIndex] 
                  ? 'bg-pink-500 scale-110' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}>
                <i className={`fas fa-heart text-2xl ${
                  isLiked[currentIndex] ? 'text-white' : 'text-white/80'
                }`}></i>
              </div>
              <span className="text-white text-xs">Нравится</span>
            </button>
          )}

          {/* Navigation Dots */}
          <div className="flex gap-2">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Delete Button */}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center transition-all">
                <i className="fas fa-trash text-2xl text-white/80"></i>
              </div>
              <span className="text-white text-xs">Удалить</span>
            </button>
          )}
        </div>

        {/* Swipe Hint */}
        {photos.length > 1 && (
          <div className="text-center mt-4">
            <p className="text-white/60 text-sm">
              <i className="fas fa-arrows-left-right mr-2"></i>
              Свайпайте для навигации
            </p>
          </div>
        )}
      </div>

      {/* Navigation Arrows (for desktop) */}
      {photos.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(currentIndex - 1);
              }}
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <i className="fas fa-chevron-left text-white text-xl"></i>
            </button>
          )}
          {currentIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(currentIndex + 1);
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <i className="fas fa-chevron-right text-white text-xl"></i>
            </button>
          )}
        </>
      )}
    </div>
  );
}
