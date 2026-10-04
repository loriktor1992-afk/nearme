function endpoint(override: string | undefined, path: string) {
  return override || `/api/${path}`;
}

export const backend = {
  telegramAuth: endpoint(import.meta.env.VITE_TELEGRAM_AUTH_URL, 'telegramAuth'),
  migrateLegacyProfile: endpoint(import.meta.env.VITE_LEGACY_MIGRATION_URL, 'migrateLegacyProfile'),
  createConversation: endpoint(import.meta.env.VITE_CREATE_CONVERSATION_URL, 'createConversation'),
  saveTelegramChatId: endpoint(import.meta.env.VITE_SAVE_TELEGRAM_CHAT_ID_URL, 'saveTelegramChatId'),
};
