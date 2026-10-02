import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  getNotifications, 
  markNotificationAsRead, 
  clearNotifications,
  PushNotification 
} from '../utils/pushNotifications';
import { formatTime } from '../utils/helpers';

export default function NotificationsPanel() {
  const { setShowNotifications, allUsers, setSelectedUser, setShowChat } = useStore();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  useEffect(() => {
    setNotifications(getNotifications());

    // Слушаем новые уведомления
    const handleNotification = (event: CustomEvent) => {
      setNotifications(getNotifications());
    };

    window.addEventListener('nearme-notification', handleNotification as EventListener);
    return () => window.removeEventListener('nearme-notification', handleNotification as EventListener);
  }, []);

  const handleNotificationClick = (notification: PushNotification) => {
    // Помечаем как прочитанное
    markNotificationAsRead(notification.id);
    setNotifications(getNotifications());

    // Если это сообщение - открываем чат
    if (notification.type === 'message' && notification.fromUserId) {
      const user = allUsers.find(u => u.id === notification.fromUserId);
      if (user) {
        setSelectedUser(user);
        setShowChat(true);
        setShowNotifications(false);
      }
    }

    // Если это match - открываем профиль
    if (notification.type === 'match' && notification.fromUserId) {
      const user = allUsers.find(u => u.id === notification.fromUserId);
      if (user) {
        setSelectedUser(user);
        setShowNotifications(false);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'like': return '❤️';
      case 'match': return '💕';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'like': return 'bg-pink-100 dark:bg-pink-900/30';
      case 'match': return 'bg-purple-100 dark:bg-purple-900/30';
      case 'system': return 'bg-gray-100 dark:bg-gray-700';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <i className="fas fa-arrow-left text-gray-600 dark:text-gray-300"></i>
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Уведомления</h2>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Удалить все уведомления?')) {
                  clearNotifications();
                  setNotifications([]);
                }
              }}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Очистить все
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🔔</div>
            <p>Нет уведомлений</p>
            <p className="text-sm mt-1">Новые уведомления появятся здесь</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  notification.read 
                    ? 'bg-white dark:bg-gray-800' 
                    : 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700'
                } hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold truncate ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-purple-500 rounded-full ml-2 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
