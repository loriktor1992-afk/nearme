# 💕 NearMe — Telegram Mini App для знакомств

Приложение для знакомств с людьми рядом в реальном времени. Работает внутри Telegram как Mini App.

## 🚀 Быстрый старт

**Полная пошаговая инструкция:** [`FULL_SETUP_GUIDE.md`](./FULL_SETUP_GUIDE.md)

Если кратко:
1. Создай бота в @BotFather
2. Настрой Firebase (база данных)
3. Задеплой на Vercel
4. Подключи URL к боту
5. Готово!

## 📱 Возможности

- 📍 **Реальная карта** — видишь людей рядом на карте
- 👥 **Онлайн в реальном времени** — кто сейчас рядом
- 💬 **Чат** — общайся с теми кто понравился
- 🔒 **Безопасно** — авторизация через Telegram
- 📱 **Мобильный** — работает в Telegram на телефоне

## 🛠 Технологии

- **React** + **TypeScript** — фронтенд
- **Firebase Realtime Database** — база данных в реальном времени
- **Leaflet** + **OpenStreetMap** — карта
- **Telegram Web App SDK** — интеграция с Telegram
- **Zustand** — управление состоянием
- **Tailwind CSS** — стили

## 📁 Структура

```
src/
├── App.tsx              # Главный компонент
├── store.ts             # Zustand + Firebase логика
├── firebase.ts          # ⚠️ ЗАМЕНИ НА СВОЙ КОНФИГ!
├── telegram.ts          # Telegram Web App SDK
└── components/
    ├── RegistrationScreen.tsx  # Регистрация (4 шага)
    ├── MapScreen.tsx           # Карта с маркерами
    ├── UserProfile.tsx         # Профиль пользователя
    └── ChatScreen.tsx          # Чат
```

## 🔧 Локальный запуск

```bash
# Установи зависимости
npm install

# Замени firebaseConfig в src/firebase.ts на свой!

# Запусти dev-сервер
npm run dev

# Открой http://localhost:5173
```

## 📚 Документация

| Файл | Описание |
|------|----------|
| [`FULL_SETUP_GUIDE.md`](./FULL_SETUP_GUIDE.md) | **ПОЛНАЯ** пошаговая инструкция (30-45 мин) |
| [`TELEGRAM_SETUP.md`](./TELEGRAM_SETUP.md) | Настройка Telegram бота |
| [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) | Настройка Firebase |
| [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) | Краткая инструкция Firebase |

## ⚠️ Важно

Перед запуском обязательно:
1. Создай проект в Firebase Console
2. Скопируй `firebaseConfig` 
3. Вставь его в `src/firebase.ts`

Без этого приложение не будет работать!

## 📝 Лицензия

MIT

---

Сделано с 💕
