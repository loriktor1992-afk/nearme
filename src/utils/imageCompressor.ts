// Сжатие изображений перед загрузкой

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxSizeMB = 5,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Рассчитываем новые размеры с сохранением пропорций
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Не удалось получить контекст canvas'));
          return;
        }

        // Улучшенное сжатие - используем high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Рисуем изображение на canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Конвертируем в base64 с сжатием
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Проверяем размер файла
        const sizeInMB = (compressedDataUrl.length * 0.75) / (1024 * 1024);
        
        // Если файл слишком большой, постепенно уменьшаем качество
        let currentQuality = quality;
        while (sizeInMB > maxSizeMB && currentQuality > 0.4) {
          currentQuality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          const newSize = (compressedDataUrl.length * 0.75) / (1024 * 1024);
          if (newSize <= maxSizeMB) break;
        }

        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Ошибка загрузки изображения'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };

    reader.readAsDataURL(file);
  });
};

// Проверка типа файла
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

// Проверка размера файла
export const isFileSizeValid = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
