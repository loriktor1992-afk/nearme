// Утилиты для приложения

// Расчёт расстояния между двумя точками (формула Haversine)
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Форматирование времени
export const formatTime = (timestamp: number): string => {
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
};

// Форматирование расстояния
export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(1)} км`;
};

// Валидация email
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Валидация URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Санитизация HTML (защита от XSS)
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Генерация уникального ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce функция
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Определение знака зодиака
export const getZodiacSign = (day: number, month: number): string => {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '♈ Овен';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '♉ Телец';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '♊ Близнецы';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '♋ Рак';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '♌ Лев';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '♍ Дева';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '♎ Весы';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '♏ Скорпион';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '♐ Стрелец';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '♑ Козерог';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '♒ Водолей';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '♓ Рыбы';
  return '♈ Овен';
};

// Расчёт возраста
export const calculateAge = (birthYear: number): number => {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

// Кэширование в localStorage
export const cache = {
  set: (key: string, value: any, ttlMs: number = 3600000) => {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: <T = any>(key: string): T | null => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = Date.now();
      if (now - item.timestamp > item.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch {
      return null;
    }
  },

  remove: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },
};

// Rate limiting
export const rateLimiter = {
  attempts: new Map<string, number[]>(),

  canPerform: (action: string, maxAttempts: number, windowMs: number): boolean => {
    const now = Date.now();
    const attempts = rateLimiter.attempts.get(action) || [];
    
    // Удаляем старые попытки
    const recentAttempts = attempts.filter(t => now - t < windowMs);
    rateLimiter.attempts.set(action, recentAttempts);
    
    return recentAttempts.length < maxAttempts;
  },

  record: (action: string) => {
    const attempts = rateLimiter.attempts.get(action) || [];
    attempts.push(Date.now());
    rateLimiter.attempts.set(action, attempts);
  },
};

// Логирование ошибок
export const logError = (error: any, context?: string) => {
  const errorData = {
    message: error.message || String(error),
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userId: localStorage.getItem('nearme_user_id'),
  };
  
  console.error('[NearMe Error]', errorData);
  
  // Здесь можно отправить ошибку в Firebase/сервис мониторинга
  // Например: firebase.database().ref('errors').push(errorData);
};
