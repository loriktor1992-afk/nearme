import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatTime } from '../utils/helpers';

export default function ChatList() {
  const { messages, currentUser, allUsers, setSelectedUser, setShowChat, setShowChatList, deleteChat } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  const chatPartners = useMemo(() => {
    const partners = new Map<string, { lastMessage: string; timestamp: number; unread: number }>();

    messages.forEach(message => {
      const partnerId = message.fromId === currentUser.id ? message.toId : message.fromId;
      const existing = partners.get(partnerId);

      if (!existing || message.timestamp > existing.timestamp) {
        partners.set(partnerId, {
          lastMessage: message.text,
          timestamp: message.timestamp,
          unread: existing?.unread || 0,
        });
      }

      if (message.toId === currentUser.id && !message.read) {
        const current = partners.get(partnerId);
        if (current) current.unread += 1;
      }
    });

    return partners;
  }, [messages, currentUser.id]);

  const sortedChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return Array.from(chatPartners.entries())
      .filter(([partnerId]) => {
        if (!query) return true;
        const partner = allUsers.find(user => user.id === partnerId);
        return partner?.name.toLowerCase().includes(query);
      })
      .sort((a, b) => b[1].timestamp - a[1].timestamp);
  }, [chatPartners, searchQuery, allUsers]);

  const getPartnerInfo = (partnerId: string) => {
    const user = allUsers.find(candidate => candidate.id === partnerId);
    if (user) return user;

    const fallbackMessage = [...messages].reverse().find(message =>
      (message.fromId === partnerId && message.toId === currentUser.id) ||
      (message.fromId === currentUser.id && message.toId === partnerId)
    );

    if (!fallbackMessage) {
      return {
        id: partnerId,
        name: 'Пользователь',
        avatar: '👤',
        photoUrl: '',
        isOnline: false,
        lastSeen: 0,
      };
    }

    const fromPartner = fallbackMessage.fromId === partnerId;
    return {
      id: partnerId,
      name: fromPartner ? (fallbackMessage.fromName || 'Пользователь') : 'Пользователь',
      avatar: fromPartner ? (fallbackMessage.fromAvatar || '👤') : '👤',
      photoUrl: fromPartner ? (fallbackMessage.fromPhotoUrl || '') : '',
      isOnline: false,
      lastSeen: 0,
    };
  };

  return (
    <div className="fixed inset-0 z-[2500] overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowChatList(false)} className="nearme-icon-btn" aria-label="Назад">
              <i className="fas fa-arrow-left" />
            </button>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">NearMe</div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Сообщения</h1>
            </div>
            <div className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
              {sortedChats.length}
            </div>
          </div>

          <div className="relative mt-4">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Поиск по чатам"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 pl-11 pr-4 text-[15px] text-slate-900 outline-none transition focus:border-violet-300 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500/40"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-3 py-4 sm:px-4">
        {sortedChats.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-violet-50 text-3xl text-violet-500 dark:bg-violet-500/10">
              <i className="fas fa-comment-dots" />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
              {searchQuery ? 'Ничего не найдено' : 'Пока тихо'}
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Попробуй другое имя.' : 'Открой человека на карте и начни разговор.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedChats.map(([partnerId, chat]) => {
              const partner = getPartnerInfo(partnerId);
              const isOnline = Date.now() - (partner.lastSeen || 0) < 5 * 60 * 1000;

              return (
                <div
                  key={partnerId}
                  className="group flex items-center gap-3 rounded-[22px] border border-slate-100 bg-white p-3 shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    onClick={() => {
                      setSelectedUser(partner as any);
                      setShowChat(true);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      {partner.photoUrl ? (
                        <img src={partner.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">{partner.avatar}</div>
                      )}
                      <span className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-black text-slate-950 dark:text-white">{partner.name}</div>
                        <span className="ml-auto shrink-0 text-[11px] font-medium text-slate-400">{formatTime(chat.timestamp)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className={`min-w-0 flex-1 truncate text-sm ${chat.unread > 0 ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          {chat.lastMessage}
                        </p>
                        {chat.unread > 0 && (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-600 px-2 text-[11px] font-black text-white">
                            {Math.min(chat.unread, 99)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Скрыть чат с ${partner.name}?`)) void deleteChat(partnerId);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    aria-label="Удалить чат"
                  >
                    <i className="fas fa-trash-alt text-xs" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
