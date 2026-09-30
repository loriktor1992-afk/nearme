import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

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

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
