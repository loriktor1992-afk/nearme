import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин`;
  if (hours < 24) return `${hours} ч`;
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

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
    deleteChat
  } = useStore();
  
  const [text, setText] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Помечаем сообщения как прочитанные
    if (currentUser && selectedUser) {
      messages.forEach(msg => {
        if (msg.fromId === selectedUser.id && msg.toId === currentUser.id && !msg.read) {
          markAsRead(msg.id);
        }
      });
    }
  }, [messages]);

  if (!selectedUser || !currentUser) return null;

  // Фильтруем сообщения для текущего собеседника
  const chatMsgs = messages.filter(m => 
    (m.fromId === currentUser.id && m.toId === selectedUser.id) ||
    (m.fromId === selectedUser.id && m.toId === currentUser.id)
  );

  const isTyping = typingUsers[selectedUser.id] && 
    Date.now() - typingUsers[selectedUser.id] < 3000;

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Отправляем статус "печатает"
    if (currentUser) {
      setTyping(currentUser.id);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
    setShowReactions(null);
  };

  const quickReplies = ['Привет! 👋', 'Как дела?', 'Давай встретимся! ☕', 'Отлично! 😊'];

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            setShowChat(false);
            setSelectedUser(null);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-transform"
        >
          <i className="fas fa-arrow-left text-gray-600 dark:text-gray-300"></i>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            {selectedUser.photoUrl ? (
              <img src={selectedUser.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg">
                {selectedUser.avatar}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-white text-sm">
              {selectedUser.name}, {selectedUser.age}
            </div>
            <div className="text-xs text-green-600">онлайн</div>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`Удалить чат с ${selectedUser.name}? Все сообщения будут удалены.`)) {
              deleteChat(selectedUser.id).then(() => {
                setShowChat(false);
                setSelectedUser(null);
              });
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
        >
          <i className="fas fa-trash text-lg"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chatMsgs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">{selectedUser.avatar}</div>
            <p className="text-gray-500 text-sm">Начните общение с {selectedUser.name}!</p>
            <p className="text-gray-400 text-xs mt-1">Напишите первое сообщение</p>
            
            {/* Quick replies */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setText(reply);
                    setTimeout(handleSend, 100);
                  }}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md transition-shadow"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {chatMsgs.map(msg => {
          const isMe = msg.fromId === currentUser.id;
          const reactions = msg.reactions || {};
          const hasReactions = Object.keys(reactions).length > 0;
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="relative max-w-[75%]">
                <div
                  className={`px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm rounded-bl-md'
                  }`}
                  onDoubleClick={() => !isMe && handleReaction(msg.id, '❤️')}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center gap-1 justify-end mt-1`}>
                    <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                    {isMe && (
                      <i className={`fas fa-check ${msg.read ? 'fa-check-double text-blue-300' : 'text-white/50'} text-[10px]`}></i>
                    )}
                  </div>
                </div>

                {/* Reactions */}
                {hasReactions && (
                  <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(reactions).map(([emoji, users]) => {
                      if (users.length === 0) return null;
                      const isMyReaction = users.includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            isMyReaction 
                              ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300' 
                              : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {emoji} {users.length > 1 && users.length}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Reaction button */}
                <button
                  onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isMe ? '-left-8' : '-right-8'
                  } w-6 h-6 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity`}
                >
                  <span className="text-xs">😊</span>
                </button>

                {/* Reactions picker */}
                {showReactions === msg.id && (
                  <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 flex gap-1 z-10`}>
                    {REACTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies (when there are messages) */}
      {chatMsgs.length > 0 && chatMsgs.length < 3 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          {quickReplies.slice(0, 3).map((reply, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(reply);
                setTimeout(handleSend, 100);
              }}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-xs text-gray-700 dark:text-gray-300 shadow-sm whitespace-nowrap"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 flex items-end">
            <textarea
              value={text}
              onChange={handleInputChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Сообщение..."
              className="flex-1 bg-transparent resize-none outline-none text-sm dark:text-white max-h-20 py-1 w-full"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              text.trim()
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg active:scale-90'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
