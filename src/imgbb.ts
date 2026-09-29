// ImgBB API для загрузки фото и видео
// Бесплатно, без Firebase Storage

// ⚠️ ЗАМЕНИ НА СВОЙ КЛЮЧ из https://api.imgbb.com/
const IMGBB_API_KEY = '5f60904e6797405a6e23f42bcaa58aa8';

// Конвертация файла в base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Убираем префикс data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

// Загрузка изображения на ImgBB
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  const base64 = await fileToBase64(file);
  
  const formData = new FormData();
  formData.append('image', base64);
  formData.append('key', IMGBB_API_KEY);
  
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  const data = await response.json();
  return data.data.url; // URL загруженной картинки
};

// Загрузка видео (через ImgBB как файл)
export const uploadVideoToImgBB = async (file: File): Promise<string> => {
  // ImgBB поддерживает только изображения
  // Для видео используем base64 в Firebase Realtime DB (ограничение 10MB)
  // Или можно использовать другой сервис
  
  // Пока что конвертируем в base64 и храним в Firebase
  const base64 = await fileToBase64(file);
  
  // Если файл слишком большой — ошибка
  if (file.size > 5 * 1024 * 1024) { // 5MB лимит для видео
    throw new Error('Video too large. Max 5MB');
  }
  
  return `data:${file.type};base64,${base64}`;
};

// Проверка что ключ настроен
export const isImgBBConfigured = (): boolean => {
  return IMGBB_API_KEY !== 'YOUR_IMGBB_API_KEY_HERE';
};
