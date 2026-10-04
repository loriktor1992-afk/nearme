import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { formatTime } from '../utils/helpers';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatScreen() {
  const {
    selectedUser,
    currentUser,
    messages,
    sendMessage,
    setShowChat,
    setSelectedUser,
    typingUsers,
    setTyping,
    addReaction,
    markAsRead,
    deleteChat,
  } = useStore();

  const [text, setText] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (currentUser && selectedUser) {
      messages.forEach(message => {
        if (message.fromId === selectedUser.id && message.toId === currentUser.id && !message.read) {
          markAsRead(message.id);
        }
      });
    }
  }, [messages, currentUser, selectedUser, markAsRead]);

  if (!selectedUser || !currentUser) return null;

  const chatMsgs = messages.filter(message =>
    (message.fromId === currentUser.id && message.toId === selectedUser.id) ||
    (message.fromId === selectedUser.id && message.toId === currentUser.id)
  );

  const isTyping = Boolean(
    typingUsers[selectedUser.id] &&
    Date.now() - typingUsers[selectedUser.id] < 3000
  );

  const isOnline = Date.now() - selectedUser.lastSeen < 5 * 60 * 1000;

  const handleSend = async (value = text) => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await sendMessage(trimmed);
      setText('');
    } catch (error) {
      console.error('Message send failed', error);
    } finally {
      setSending(false);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
    setShowReactions(null);
  };

  const quickReplies = ['Привет 👋', 'Как твой день?', 'Пойдём на кофе? ☕'];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <header className="z-20 border-b border-slate-200/70 bg-white/90 px-3 pb-3 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowChat(false);
            }}
            className="nearme-icon-btn shrink-0"
            aria-label="Назад"
          >
            <i className="fas fa-arrow-left" />
          </button>

          <div className="relative h-11 w-11 shrink-0">
            <div className="h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
              {selectedUser.photoUrl ? (
                <img src={selectedUser.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">{selectedUser.avatar}</div>
              )}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-black tracking-tight text-slate-950 dark:text-white">
              {selectedUser.name}, {selectedUser.age}
            </div>
            <div className={`mt-0.5 text-[11px] font-semibold ${isTyping ? 'text-violet-600 dark:text-violet-400' : isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {isTyping ? 'печатает…' : isOnline ? 'сейчас онлайн' : 'не в сети'}
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm(`Скрыть чат с ${selectedUser.name}?`)) {
                void deleteChat(selectedUser.id).then(() => {
                  setShowChat(false);
                  setSelectedUser(null);
                });
              }
            }}
            className="nearme-icon-btn shrink-0 text-rose-500"
            aria-label="Удалить чат"
          >
            <i className="fas fa-trash-alt" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
          {chatMsgs.length === 0 && (
            <div className="mx-auto flex max-w-sm flex-col items-center px-5 py-12 text-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_18px_40px_rgba(124,58,237,.25)]">
                {selectedUser.photoUrl ? (
                  <img src={selectedUser.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">{selectedUser.avatar}</div>
                )}
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Напиши {selectedUser.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Хороший диалог начинается с простого сообщения.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {quickReplies.map(reply => (
                  <button
                    key={reply}
                    onClick={() => void handleSend(reply)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMsgs.map(message => {
            const isMe = message.fromId === currentUser.id;
            const reactions = message.reactions || {};

            return (
              <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="group relative max-w-[84%] sm:max-w-[72%]">
                  <button
                    onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                    className={`absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[11px] text-slate-500 opacity-70 shadow-md transition sm:opacity-0 sm:group-hover:opacity-100 dark:bg-slate-800 ${isMe ? '-left-9' : '-right-9'}`}
                  >
                    <i className="far fa-smile" />
                  </button>

                  <div
                    className={`rounded-[22px] px-4 py-2.5 shadow-sm ${isMe
                      ? 'rounded-br-[7px] bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-violet-500/10'
                      : 'rounded-bl-[7px] border border-slate-100 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'}`}
                    onDoubleClick={() => !isMe && handleReaction(message.id, '❤️')}
                  >
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45]">{message.text}</p>
                    <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-white/65' : 'text-slate-400'}`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {isMe && (
                        <i className={`fas ${message.read ? 'fa-check-double text-sky-200' : 'fa-check text-white/55'}`} />
                      )}
                    </div>
                  </div>

                  {Object.keys(reactions).length > 0 && (
                    <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(reactions).map(([emoji, rawUsers]) => {
                        const users = Array.isArray(rawUsers)
                          ? rawUsers
                          : Object.keys((rawUsers || {}) as Record<string, boolean>).filter(uid => (rawUsers as unknown as Record<string, boolean>)[uid]);
                        if (!users.length) return null;
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className={`rounded-full border px-2 py-0.5 text-xs shadow-sm ${users.includes(currentUser.id)
                              ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300'
                              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'}`}
                          >
                            {emoji}{users.length > 1 ? ` ${users.length}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showReactions === message.id && (
                    <div className={`absolute top-full z-30 mt-1 flex gap-0.5 rounded-full border border-slate-100 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 ${isMe ? 'right-0' : 'left-0'}`}>
                      {REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-[20px] rounded-bl-[7px] border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {chatMsgs.length > 0 && chatMsgs.length < 4 && (
        <div className="border-t border-slate-100 bg-white/75 px-3 py-2 backdrop-blur dark:border-slate-900 dark:bg-slate-950/75">
          <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto">
            {quickReplies.map(reply => (
              <button
                key={reply}
                onClick={() => void handleSend(reply)}
                className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 active:scale-95 dark:bg-slate-900 dark:text-slate-300"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200/70 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <div className="flex min-h-11 flex-1 items-end rounded-[22px] bg-slate-100 px-4 py-2 dark:bg-slate-900">
            <textarea
              value={text}
              onChange={event => {
                setText(event.target.value);
                setTyping(currentUser.id);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Сообщение…"
              className="max-h-24 min-h-7 w-full resize-none bg-transparent py-1 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              rows={1}
            />
          </div>

          <button
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] transition active:scale-90 ${text.trim() && !sending
              ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-[0_10px_24px_rgba(124,58,237,.28)]'
              : 'bg-slate-100 text-slate-300 dark:bg-slate-900 dark:text-slate-600'}`}
            aria-label="Отправить"
          >
            <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-arrow-up'}`} />
          </button>
        </div>
      </footer>
    </div>
  );
}
