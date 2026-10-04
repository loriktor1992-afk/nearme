import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { migrateLegacyProfileIfNeeded, signInWithTelegram } from "./auth";

// Инициализация Telegram Web App
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        requestData: (callback: (data: any) => void) => void;
      };
    };
  }
}

if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

async function bootstrap() {
  try {
    // In Telegram, establish a server-verified Firebase session before the app touches protected data.
    const session = await signInWithTelegram();
    if (session) await migrateLegacyProfileIfNeeded(session);
  } catch (error) {
    console.error('Telegram/Firebase authentication failed', error);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
