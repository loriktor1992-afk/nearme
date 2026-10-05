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

type Comment = { id: string; uid: string; name: string; avatar?: string; text: string; createdAt: number };
interface Props {
  photos: string[]; initialIndex: number; onClose: () => void; isOwner?: boolean;
  ownerUid: string; ownerName?: string; ownerAvatar?: string; initialCounts?: Record<string, number>;
}

export default function PhotoViewer({ photos, initialIndex, onClose, isOwner = false, ownerUid, ownerName, ownerAvatar, initialCounts = {} }: Props) {
  const { deletePhoto } = useStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const currentPhoto = photos[currentIndex];
  const key = currentPhoto ? photoKey(currentPhoto) : '';

  const request = async (url: string, body: object) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Request failed');
    return r.json();
  };

  useEffect(() => {
    let active = true;
    setCount(initialCounts[key] || 0);
    Promise.all([
      request(backend.photoLike, { ownerUid, photoKey: key, action: 'status' }),
      request(backend.photoComments, { ownerUid, photoKey: key, action: 'list' }),
    ]).then(([likes, thread]) => {
      if (!active) return;
      setLiked(Boolean(likes.liked)); setCount(Number(likes.count) || 0);
      setComments(thread.comments || []); setCommentCount(Number(thread.count) || 0);
    }).catch(console.error);
    return () => { active = false; };
  }, [key, ownerUid]);

  const toggleLike = async () => {
    if (busy) return; setBusy(true);
    try { const d = await request(backend.photoLike, { ownerUid, photoKey: key, action: 'toggle' }); setLiked(Boolean(d.liked)); setCount(Number(d.count) || 0); }
    finally { setBusy(false); }
  };
  const addComment = async () => {
    const text = draft.trim(); if (!text || busy) return; setBusy(true);
    try { const d = await request(backend.photoComments, { ownerUid, photoKey: key, action: 'add', text }); setComments(d.comments || []); setCommentCount(d.count || 0); setDraft(''); }
    finally { setBusy(false); }
  };
  const deleteComment = async (commentId: string) => {
    const d = await request(backend.photoComments, { ownerUid, photoKey: key, action: 'delete', commentId });
    setComments(d.comments || []); setCommentCount(d.count || 0);
  };
  const handleDelete = () => {
    if (!isOwner || !confirm('Удалить эту фотографию из профиля?')) return;
    deletePhoto(currentIndex); if (photos.length === 1) onClose(); else setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  if (!currentPhoto) return null;
  return (
    <div className="fixed inset-0 z-[4000] overflow-y-auto bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center text-xl"><i className="fas fa-arrow-left" /></button>
        <div className="flex-1 text-center"><div className="text-base font-bold">Публикация</div><div className="text-xs text-slate-500">{ownerName}</div></div>
        <div className="w-10" />
      </header>

      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
            {ownerAvatar ? <img src={ownerAvatar} className="h-full w-full object-cover" alt="" /> : <div className="flex h-full items-center justify-center font-bold">{ownerName?.[0]}</div>}
          </div>
          <div className="min-w-0 flex-1 truncate font-bold">{ownerName || 'Пользователь'}</div>
          {isOwner && <button onClick={handleDelete} className="px-2 text-xl text-slate-600 dark:text-slate-300" aria-label="Удалить"><i className="fas fa-ellipsis-h" /></button>}
        </div>

        <div className="flex min-h-[360px] items-center bg-black">
          <img src={currentPhoto} alt="" className="max-h-[70vh] w-full object-contain" onDoubleClick={toggleLike} />
        </div>

        <div className="px-4 pb-[max(22px,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center gap-5 text-[27px]">
            <button onClick={toggleLike} disabled={busy} aria-label="Нравится"><i className={`${liked ? 'fas text-red-500' : 'far'} fa-heart`} /></button>
            <button onClick={() => document.getElementById('photo-comment-input')?.focus()} aria-label="Комментарий"><i className="far fa-comment" /></button>
          </div>
          <div className="mt-2 text-sm font-bold">{count} {count === 1 ? 'отметка «Нравится»' : 'отметок «Нравится»'}</div>
          {commentCount > 0 && <div className="mt-1 text-sm text-slate-500">{commentCount} {commentCount === 1 ? 'комментарий' : 'комментариев'}</div>}

          <div className="mt-3 space-y-2">
            {comments.map(c => (
              <div key={c.id} className="group flex gap-2 text-sm">
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200">{c.avatar && <img src={c.avatar} className="h-full w-full object-cover" alt="" />}</div>
                <div className="min-w-0 flex-1"><span className="mr-2 font-bold">{c.name}</span><span className="break-words">{c.text}</span></div>
                {(c.uid === auth.currentUser?.uid || isOwner) && <button onClick={() => deleteComment(c.id)} className="text-xs text-slate-400" aria-label="Удалить комментарий"><i className="fas fa-times" /></button>}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
            <input id="photo-comment-input" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} maxLength={500} placeholder="Добавить комментарий…" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
            <button onClick={addComment} disabled={!draft.trim() || busy} className="text-sm font-bold text-blue-500 disabled:opacity-30">Опубликовать</button>
          </div>

          {photos.length > 1 && <div className="mt-4 flex justify-center gap-1.5">{photos.map((_, i) => <button key={i} onClick={() => setCurrentIndex(i)} className={`h-1.5 rounded-full ${i === currentIndex ? 'w-5 bg-blue-500' : 'w-1.5 bg-slate-300'}`} />)}</div>}
        </div>
      </div>
    </div>
  );
}
