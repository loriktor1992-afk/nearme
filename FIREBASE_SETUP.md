# 🔥 Настройка Firebase для NearMe

## Шаг 1: Создай проект в Firebase

1. Перейди на https://console.firebase.google.com/
2. Нажми "Создать проект" (Add project)
3. Введи название проекта (например, "nearme-app")
4. Отключи Google Analytics (не обязательно)
5. Нажми "Создать проект"

## Шаг 2: Добавь Web-приложение

1. В консоли проекта нажми на иконку `</>` (Web)
2. Введи название приложения (например, "nearme-web")
3. Нажми "Зарегистрировать приложение"
4. Скопируй объект `firebaseConfig` — он выглядит так:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb...",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

## Шаг 3: Вставь конфиг в код

Открой файл `src/firebase.ts` и замени значения в `firebaseConfig` на свои.

## Шаг 4: Создай Realtime Database

1. В меню слева выбери "Realtime Database"
2. Нажми "Создать базу данных"
3. Выбери регион (ближайший к тебе)
4. Выбери "Начать в тестовом режиме" (для разработки)
5. Нажми "Включить"

## Шаг 5: Настрой правила безопасности

В вкладке "Правила" (Rules) вставь:

```json
{
  "rules": {
    "users": {
      ".read": true,
      ".write": true,
      "$userId": {
        ".read": true,
        ".write": "$userId === auth.uid || !auth.uid"
      }
    },
    "messages": {
      ".read": true,
      ".write": true
    }
  }
}
```

⚠️ **Важно:** Это правила для тестирования. Для продакшена нужно добавить аутентификацию!

## Шаг 6: Запусти приложение

```bash
npm install
npm run dev
```

Открой http://localhost:5173 в нескольких браузерах/вкладках — пользователи будут видеть друг друга в реальном времени!

## Как это работает:

- 📍 **Геолокация** — браузер определяет реальное местоположение пользователя
- 👥 **Онлайн-статус** — Firebase отслеживает кто онлайн через `onDisconnect`
- 💬 **Чат** — сообщения синхронизируются в реальном времени через Realtime Database
- 🗺️ **Карта** — маркеры обновляются автоматически при перемещении пользователей

## Структура данных в Firebase:

```
users/
  user_123456/
    id: "user_123456"
    name: "Алина"
    age: 22
    gender: "female"
    bio: "Люблю кофе"
    avatar: "👩"
    lat: 55.751
    lng: 37.618
    isOnline: true
    lastSeen: 1234567890

messages/
  -Nxyz123/
    fromId: "user_123"
    toId: "user_456"
    fromName: "Алина"
    text: "Привет!"
    timestamp: 1234567890
    read: false
```
