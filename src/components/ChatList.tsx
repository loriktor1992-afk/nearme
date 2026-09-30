import React from 'react';
import { useStore } from '../store';

export default function ChatList() {
  const { messages, currentUser, onlineUsers, setSelectedUser, setShowChat } = useStore();

  if (!currentUser) return null;

  // Группируем сообщения по собеседникам
  const chatPartners = new Map<string, { lastMessage: string; timestamp: number; unread: number }>();

  messages.forEach(msg => {
    const partnerId = msg.fromId === currentUser.id ? msg.toId : msg.fromId;
    const existing = chatPartners.get(partnerId);
    
    if (!existing || msg.timestamp > existing.timestamp) {
      chatPartners.set(partnerId, {
        lastMessage: msg.text,
        timestamp: msg.timestamp,
        unread: 0,
      });
    }

    // Подсчитываем непрочитанные
    if (msg.toId === currentUser.id && !msg.read) {
      const current = chatPartners.get(partnerId);
      if (current) {
        current.unread++;
      }
    }
  });

  // Сортируем по времени последнего сообщения
  const sortedChats = Array.from(chatPartners.entries())
    .sort((a, b) => b[1].timestamp - a[1].timestamp);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'сейчас';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} ч`;
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} дн`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Чаты</h2>
      </div>

      <div className="p-4">
        {sortedChats.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <p>Пока нет чатов</p>
            <p className="text-sm mt-1">Начни общение с кем-нибудь!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedChats.map(([partnerId, chat]) => {
              const partner = onlineUsers.find(u => u.id === partnerId);
              if (!partner) return null;

              return (
                <div
                  key={partnerId}
                  onClick={() => {
                    setSelectedUser(partner);
                    setShowChat(true);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer active:scale-98 transition-transform flex items-center gap-3"
                >
                  <div className="relative">
                    {partner.photoUrl ? (
                      <img src={partner.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl">
                        {partner.avatar}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800 dark:text-white truncate">
                        {partner.name}
                      </h3>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatTime(chat.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.lastMessage}
                    </p>
                  </div>

                  {chat.unread > 0 && (
                    <div className="bg-purple-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {chat.unread}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
