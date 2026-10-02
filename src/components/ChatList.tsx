import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { formatTime } from '../utils/helpers';

export default function ChatList() {
  const { messages, currentUser, allUsers, setSelectedUser, setShowChat, setShowChatList, deleteChat } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  // Группируем сообщения по собеседникам
  const chatPartners = useMemo(() => {
    const partners = new Map<string, { lastMessage: string; timestamp: number; unread: number }>();

    messages.forEach(msg => {
      const partnerId = msg.fromId === currentUser.id ? msg.toId : msg.fromId;
      const existing = partners.get(partnerId);
      
      if (!existing || msg.timestamp > existing.timestamp) {
        partners.set(partnerId, {
          lastMessage: msg.text,
          timestamp: msg.timestamp,
          unread: 0,
        });
      }

      // Подсчитываем непрочитанные
      if (msg.toId === currentUser.id && !msg.read) {
        const current = partners.get(partnerId);
        if (current) {
          current.unread++;
        }
      }
    });

    return partners;
  }, [messages, currentUser.id]);

  // Фильтруем и сортируем чаты
  const sortedChats = useMemo(() => {
    let chats = Array.from(chatPartners.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    // Фильтруем по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chats = chats.filter(([partnerId]) => {
        const partner = allUsers.find(u => u.id === partnerId);
        return partner && partner.name.toLowerCase().includes(query);
      });
    }

    return chats;
  }, [chatPartners, searchQuery, allUsers]);

  // Получаем информацию о собеседнике (даже если он оффлайн)
  const getPartnerInfo = (partnerId: string) => {
    // Сначала ищем в allUsers
    const user = allUsers.find(u => u.id === partnerId);
    if (user) return user;
    
    // Если не нашли в allUsers, получаем информацию из последнего сообщения
    const lastMessage = messages.find(m => 
      (m.fromId === partnerId && m.toId === currentUser.id) ||
      (m.fromId === currentUser.id && m.toId === partnerId)
    );
    
    if (lastMessage) {
      // Используем информацию из сообщения
      const isFromPartner = lastMessage.fromId === partnerId;
      return {
        id: partnerId,
        name: isFromPartner ? (lastMessage.fromName || 'Пользователь') : (currentUser.name || 'Вы'),
        avatar: isFromPartner ? (lastMessage.fromAvatar || '👤') : (currentUser.avatar || '👤'),
        photoUrl: isFromPartner ? (lastMessage.fromPhotoUrl || '') : (currentUser.photoUrl || ''),
        isOnline: false,
        lastSeen: 0,
      };
    }
    
    // Если вообще ничего не нашли, возвращаем базовую информацию
    return {
      id: partnerId,
      name: 'Пользователь',
      avatar: '👤',
      photoUrl: '',
      isOnline: false,
      lastSeen: 0,
    };
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setShowChatList(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-arrow-left text-gray-600 dark:text-gray-300"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Чаты</h2>
        </div>
        
        {/* Поиск */}
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="p-4">
        {sortedChats.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <p>{searchQuery ? 'Ничего не найдено' : 'Пока нет чатов'}</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Попробуйте другой запрос' : 'Начни общение с кем-нибудь!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedChats.map(([partnerId, chat]) => {
              const partner = getPartnerInfo(partnerId);
              if (!partner) return null;

              const isOnline = Date.now() - (partner.lastSeen || 0) < 5 * 60 * 1000;

              return (
                <div
                  key={partnerId}
                  onClick={() => {
                    setSelectedUser(partner as any);
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
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
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
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить чат с ${partner.name}? Все сообщения будут удалены.`)) {
                        deleteChat(partnerId);
                      }
                    }}
                    className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
