// Push уведомления для Telegram Mini App

// Используем any для Telegram WebApp чтобы избежать конфликтов типов
const getTelegramWebApp = (): any => {
  return (window as any).Telegram?.WebApp;
};

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'like' | 'match' | 'system';
  fromUserId?: string;
  timestamp: number;
  read: boolean;
}

// Отправка push-уведомления через Telegram
export const sendPushNotification = (notification: PushNotification) => {
  // Сохраняем уведомление в localStorage
  const notifications = getNotifications();
  notifications.unshift(notification);
  
  // Оставляем только последние 50 уведомлений
  if (notifications.length > 50) {
    notifications.splice(50);
  }
  
  localStorage.setItem('nearme_notifications', JSON.stringify(notifications));
  
  // Показываем уведомление через Telegram API
  const tg = getTelegramWebApp();
  if (tg) {
    // Вибрация
    if (tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
    
    // Показываем popup для важных уведомлений
    if (notification.type === 'match') {
      tg.showPopup?.({
        title: notification.title,
        message: notification.message,
        buttons: [
          { type: 'ok', text: 'Отлично!' }
        ]
      });
    } else if (notification.type === 'message') {
      // Для сообщений показываем alert
      tg.showAlert?.(`${notification.title}\n${notification.message}`);
    }
  }
  
  // Также показываем toast в приложении
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('nearme-notification', { 
      detail: notification 
    });
    window.dispatchEvent(event);
  }
};

// Получение всех уведомлений
export const getNotifications = (): PushNotification[] => {
  try {
    const data = localStorage.getItem('nearme_notifications');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Пометить уведомление как прочитанное
export const markNotificationAsRead = (id: string) => {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    localStorage.setItem('nearme_notifications', JSON.stringify(notifications));
  }
};

// Удалить все уведомления
export const clearNotifications = () => {
  localStorage.removeItem('nearme_notifications');
};

// Получить количество непрочитанных уведомлений
export const getUnreadNotificationsCount = (): number => {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
};

// Уведомление о новом сообщении
export const notifyNewMessage = (fromUserName: string, messageText: string, fromUserId: string) => {
  sendPushNotification({
    id: `msg_${Date.now()}`,
    title: `💬 Новое сообщение от ${fromUserName}`,
    message: messageText,
    type: 'message',
    fromUserId,
    timestamp: Date.now(),
    read: false,
  });
};

// Уведомление о лайке
export const notifyNewLike = (fromUserName: string, fromUserId: string) => {
  sendPushNotification({
    id: `like_${Date.now()}`,
    title: `❤️ ${fromUserName} лайкнул(а) вас`,
    message: 'У вас новое взаимодействие!',
    type: 'like',
    fromUserId,
    timestamp: Date.now(),
    read: false,
  });
};

// Уведомление о взаимном лайке (match)
export const notifyMatch = (withUserName: string, withUserId: string) => {
  sendPushNotification({
    id: `match_${Date.now()}`,
    title: `💕 Взаимная симпатия!`,
    message: `У вас взаимная симпатия с ${withUserName}! Начните общение.`,
    type: 'match',
    fromUserId: withUserId,
    timestamp: Date.now(),
    read: false,
  });
};

// Системное уведомление
export const notifySystem = (title: string, message: string) => {
  sendPushNotification({
    id: `system_${Date.now()}`,
    title,
    message,
    type: 'system',
    timestamp: Date.now(),
    read: false,
  });
};
