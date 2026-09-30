import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';

export default function ChatScreen() {
  const { selectedUser, currentUser, messages, sendMessage, setShowChat } = useStore();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser || !currentUser) return null;

  // Фильтруем сообщения для текущего собеседника
  const chatMsgs = messages.filter(m => 
    (m.fromId === currentUser.id && m.toId === selectedUser.id) ||
    (m.fromId === selectedUser.id && m.toId === currentUser.id)
  );

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setShowChat(false)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <i className="fas fa-arrow-left text-gray-600"></i>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg">
              {selectedUser.avatar}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{selectedUser.name}, {selectedUser.age}</div>
            <div className="text-xs text-green-600">онлайн</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chatMsgs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">{selectedUser.avatar}</div>
            <p className="text-gray-500 text-sm">Начните общение с {selectedUser.name}!</p>
            <p className="text-gray-400 text-xs mt-1">Напишите первое сообщение</p>
          </div>
        )}
        
        {chatMsgs.map(msg => {
          const isMe = msg.fromId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMe
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'} text-right`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex items-end">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Сообщение..."
              className="flex-1 bg-transparent resize-none outline-none text-sm max-h-20 py-1"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              text.trim()
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg active:scale-90'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
