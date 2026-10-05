import React, { useEffect, useState } from 'react';
import { auth } from '../auth';
import { backend } from '../backend';
import { useStore } from '../store';

export function photoKey(photo: string) {
  let hash = 2166136261;
  for (let i = 0; i < photo.length; i += Math.max(1, Math.floor(photo.length / 2048))) {
    hash ^= photo.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 'p_' + (hash >>> 0).toString(36);
}

interface PhotoViewerProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
  isOwner?: boolean;
  ownerUid: string;
  ownerName?: string;
  initialCounts?: Record<string, number>;
}

export default function PhotoViewer({ photos, initialIndex, onClose, isOwner = false, ownerUid, ownerName, initialCounts = {} }: PhotoViewerProps) {
  const { deletePhoto } = useStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const currentPhoto = photos[currentIndex];
  const key = currentPhoto ? photoKey(currentPhoto) : '';

  useEffect(() => {
    let active = true;
    setCount(initialCounts[key] || 0);
    (async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !key) return;
      const response = await fetch(backend.photoLike, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerUid, photoKey: key, action: 'status' }),
      });
      if (response.ok && active) {
        const data = await response.json();
        setLiked(Boolean(data.liked));
        setCount(Number(data.count) || 0);
      }
    })().catch(console.error);
    return () => { active = false; };
  }, [key, ownerUid]);

  const toggleLike = async () => {
    if (busy || !key) return;
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    setBusy(true);
    try {
      const response = await fetch(backend.photoLike, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ownerUid, photoKey: key, action: 'toggle' }),
      });
      if (!response.ok) throw new Error('Like failed');
      const data = await response.json();
      setLiked(Boolean(data.liked));
      setCount(Number(data.count) || 0);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    if (!isOwner || !confirm('Удалить эту фотографию из профиля?')) return;
    deletePhoto(currentIndex);
    if (photos.length === 1) onClose();
    else setCurrentIndex(Math.max(0, Math.min(currentIndex, photos.length - 2)));
  };

  const endSwipe = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentIndex < photos.length - 1) setCurrentIndex(i => i + 1);
    if (distance < -50 && currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  if (!currentPhoto) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col bg-black text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label="Закрыть">
          <i className="fas fa-arrow-left" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{ownerName || 'Фотография'}</div>
          <div className="text-xs text-white/55">{currentIndex + 1} из {photos.length}</div>
        </div>
        {isOwner && (
          <button onClick={handleDelete} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-red-400" aria-label="Удалить фотографию">
            <i className="fas fa-trash" />
          </button>
        )}
      </header>

      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        onTouchStart={e => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); }}
        onTouchMove={e => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={endSwipe}
        onDoubleClick={toggleLike}
      >
        <img src={currentPhoto} alt="" className="max-h-full w-full object-contain" />
      </div>

      <div className="border-t border-white/10 bg-black px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} disabled={busy} className="flex h-11 w-11 items-center justify-center text-2xl disabled:opacity-50" aria-label="Нравится">
            <i className={`${liked ? 'fas text-pink-500' : 'far text-white'} fa-heart`} />
          </button>
          <span className="text-sm font-bold">{count} {count === 1 ? 'отметка «Нравится»' : 'отметок «Нравится»'}</span>
        </div>
        <p className="mt-1 text-sm text-white/65">{ownerName ? `Фото пользователя ${ownerName}` : 'Фото профиля'}</p>
        {photos.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {photos.map((_, idx) => <span key={idx} className={`h-1.5 rounded-full ${idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`} />)}
          </div>
        )}
      </div>
    </div>
  );
}
