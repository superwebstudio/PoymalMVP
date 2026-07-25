import { useCallback } from 'react';

export function useImageCompression() {
    const compressImage = useCallback((file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max = 1024;
                let w = img.width;
                let h = img.height;

                if (w > h && w > max) {
                    h = (h * max) / w;
                    w = max;
                } else if (h > max) {
                    w = (w * max) / h;
                    h = max;
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Canvas context not found'));
                    return;
                }

                ctx.drawImage(img, 0, 0, w, h);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Compression failed'));
                        URL.revokeObjectURL(img.src);
                    },
                    'image/jpeg',
                    0.8
                );
            };

            img.onerror = (err) => {
                URL.revokeObjectURL(img.src);
                reject(err);
            };
        });
    }, []);

    return { compressImage };
}













