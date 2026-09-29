import WebApp from '@twa-dev/sdk';

// Инициализация Telegram Web App
export const tg = WebApp;

// Расширение Telegram Web App для типов
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

// Проверка запуска из Telegram
export const isTelegram = () => {
  return !!tg.initData || !!window.Telegram?.WebApp;
};

// Получение данных пользователя из Telegram
export const getTelegramUser = () => {
  const user = tg.initDataUnsafe?.user;
  if (!user) return null;
  
  return {
    id: user.id?.toString() || '',
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username || '',
    photoUrl: user.photo_url || '',
    languageCode: user.language_code || 'ru',
  };
};

// Инициализация Mini App
export const initTelegramApp = () => {
  // Готовим приложение
  tg.ready();
  
  // Расширяем на весь экран
  tg.expand();
  
  // Устанавливаем тему
  applyTelegramTheme();
  
  // Слушаем изменения темы
  tg.onEvent('themeChanged', applyTelegramTheme);
  
  console.log('Telegram Mini App initialized');
};

// Применение темы Telegram
const applyTelegramTheme = () => {
  const root = document.documentElement;
  const theme = tg.colorScheme; // 'light' или 'dark'
  
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  
  // Применяем цвета из Telegram
  const style = document.documentElement.style;
  const tgAny = tg as any;
  style.setProperty('--tg-bg-color', tgAny.backgroundColor || '#ffffff');
  style.setProperty('--tg-text-color', tgAny.textColor || '#000000');
  style.setProperty('--tg-hint-color', tgAny.hintColor || '#999999');
  style.setProperty('--tg-link-color', tgAny.linkColor || '#2481cc');
  style.setProperty('--tg-button-color', tgAny.buttonColor || '#2481cc');
  style.setProperty('--tg-button-text-color', tgAny.buttonTextColor || '#ffffff');
  style.setProperty('--tg-secondary-bg-color', tgAny.secondaryBackgroundColor || '#f0f0f0');
};

// Haptic Feedback
export const hapticFeedback = {
  light: () => tg.HapticFeedback?.impactOccurred('light'),
  medium: () => tg.HapticFeedback?.impactOccurred('medium'),
  heavy: () => tg.HapticFeedback?.impactOccurred('heavy'),
  success: () => tg.HapticFeedback?.notificationOccurred('success'),
  warning: () => tg.HapticFeedback?.notificationOccurred('warning'),
  error: () => tg.HapticFeedback?.notificationOccurred('error'),
  selection: () => tg.HapticFeedback?.selectionChanged(),
};

// Main Button
export const mainButton = {
  show: (text: string, onClick: () => void) => {
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
  },
  hide: () => {
    tg.MainButton.hide();
  },
  loading: (isLoading: boolean) => {
    if (isLoading) {
      tg.MainButton.showProgress();
    } else {
      tg.MainButton.hideProgress();
    }
  },
};

// Back Button
export const backButton = {
  show: (onClick: () => void) => {
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', onClick);
  },
  hide: () => {
    tg.BackButton.hide();
  },
};

// Закрытие приложения
export const closeApp = () => {
  tg.close();
};

// Показать alert
export const showAlert = (message: string) => {
  tg.showAlert(message);
};

// Показать confirm
export const showConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    tg.showConfirm(message, (ok) => {
      resolve(ok);
    });
  });
};

// Показать popup
export const showPopup = (message: string, title?: string) => {
  tg.showPopup({
    title: title || '',
    message,
    buttons: [{ type: 'ok' }],
  });
};
