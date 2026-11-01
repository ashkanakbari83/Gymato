// Reads an image file and downsizes it to a JPEG data URL (keeps localStorage usage small).
import { PHOTO_MAX_SIDE } from './constants.js';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // refuse huge originals before decoding them

export function fileToDataUrl(file, maxSide = PHOTO_MAX_SIDE) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('not an image'));
    if (file.size > MAX_UPLOAD_BYTES) return reject(new Error('too big'));
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('unreadable image'));
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff'; // transparent PNGs would turn black as JPEG
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
