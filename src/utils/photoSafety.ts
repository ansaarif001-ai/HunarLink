import { t } from '../i18n';
import { LanguageCode, PhotoMedia } from '../types';
import { createId } from './id';
import { sanitizeText } from './validation';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_POST = 5;

export interface PhotoProcessOptions {
  maxWidth?: number;
  quality?: number;
  maxCount?: number;
  existingCount?: number;
  lang?: LanguageCode;
}

export interface PhotoProcessResult {
  photos: PhotoMedia[];
  errors: string[];
}

function isAllowedImageFile(file: File): boolean {
  if (file.type) {
    return ALLOWED_MIME_TYPES.has(file.type.toLowerCase());
  }
  return ALLOWED_EXTENSIONS.test(file.name);
}

function compressAndStripExif(
  file: File,
  maxWidth: number,
  quality: number,
  lang: LanguageCode
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width || 1;
        const naturalH = img.naturalHeight || img.height || 1;
        const scale = naturalW > maxWidth ? maxWidth / naturalW : 1;
        const targetW = Math.max(1, Math.round(naturalW * scale));
        const targetH = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error(t('photo.errProcess', lang)));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 240_000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.62);
        }

        resolve(dataUrl);
      } catch {
        reject(new Error(t('photo.errProcess', lang)));
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(t('photo.errOpen', lang)));
    };

    img.src = objectUrl;
  });
}

export async function processSafeImageFiles(
  fileList: FileList | File[],
  options: PhotoProcessOptions = {}
): Promise<PhotoProcessResult> {
  const {
    maxWidth = 1000,
    quality = 0.76,
    maxCount = MAX_PHOTOS_PER_POST,
    existingCount = 0,
    lang = 'en',
  } = options;

  const files = Array.from(fileList);
  const errors: string[] = [];
  const photos: PhotoMedia[] = [];

  const remainingSlots = Math.max(0, maxCount - existingCount);
  if (files.length > remainingSlots) {
    errors.push(
      remainingSlots === 0
        ? t('photo.errMaxCount', lang, { max: maxCount })
        : t('photo.errRemaining', lang, { n: remainingSlots, max: maxCount })
    );
  }

  const filesToProcess = files.slice(0, remainingSlots);

  for (const file of filesToProcess) {
    if (!isAllowedImageFile(file)) {
      errors.push(t('photo.errType', lang, { name: file.name }));
      continue;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      errors.push(t('photo.errSize', lang, { name: file.name }));
      continue;
    }

    try {
      const dataUrl = await compressAndStripExif(file, maxWidth, quality, lang);
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      const cleanTitle = sanitizeText(rawName, 40) || 'Work photo';
      photos.push({
        id: createId('ph'),
        dataUrl,
        title: cleanTitle,
      });
    } catch (err) {
      errors.push(err instanceof Error ? err.message : t('photo.errProcess', lang));
    }
  }

  return { photos, errors };
}
