const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nearme-app-59aa5';
const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';

function endpoint(override: string | undefined, functionName: string) {
  return override || `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
}

export const backend = {
  telegramAuth: endpoint(import.meta.env.VITE_TELEGRAM_AUTH_URL, 'telegramAuth'),
  migrateLegacyProfile: endpoint(import.meta.env.VITE_LEGACY_MIGRATION_URL, 'migrateLegacyProfile'),
  createConversation: endpoint(import.meta.env.VITE_CREATE_CONVERSATION_URL, 'createConversation'),
  saveTelegramChatId: endpoint(import.meta.env.VITE_SAVE_TELEGRAM_CHAT_ID_URL, 'saveTelegramChatId'),
};
