import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { migrateLegacyProfileIfNeeded, signInWithTelegram } from "./auth";
import { tg } from "./telegram";
import { restoreVerifiedSession } from "./store";

// Инициализация Telegram Web App

if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

const root = ReactDOM.createRoot(document.getElementById("root")!);

function renderAuthError(message: string) {
  root.render(
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Не удалось войти в NearMe</h1>
        <p className="text-gray-300">{message}</p>
        <button className="px-5 py-3 rounded-xl bg-purple-600 font-semibold" onClick={() => window.location.reload()}>
          Повторить
        </button>
      </div>
    </div>
  );
}

async function bootstrap() {
  const isTelegram = Boolean(window.Telegram?.WebApp && tg.initData);
  const allowBrowserDev = import.meta.env.DEV && import.meta.env.VITE_ALLOW_LEGACY_DEV_AUTH === 'true';

  try {
    // Telegram production is fail-closed: protected app data is never initialized without verified Firebase auth.
    const session = await signInWithTelegram();
    if (isTelegram && !session) {
      renderAuthError('Telegram-аутентификация не настроена. Перезапустите приложение позже.');
      return;
    }
    if (!isTelegram && !session && !allowBrowserDev) {
      renderAuthError('Откройте приложение через Telegram.');
      return;
    }
    if (session) {
      await migrateLegacyProfileIfNeeded(session);
      await restoreVerifiedSession(session.uid);
    }
    root.render(<App />);
  } catch (error) {
    console.error('Telegram/Firebase authentication failed', error);
    renderAuthError('Не удалось подтвердить Telegram-сессию. Нажмите «Повторить».');
  }
}

void bootstrap();
