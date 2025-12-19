/**
 * Utilitários para processamento de imagem
 */

export const trimTransparentPixels = async (imageSrc: string): Promise<{ src: string; x: number; y: number; width: number; height: number } | null> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;

            let minX = width, minY = height, maxX = 0, maxY = 0;
            let found = false;

            // Escanear pixels para encontrar limites da arte
            // Threshold de 15 (aprox 6%) para ignorar "sujeira" quase invisível deixada por IAs
            const threshold = 15;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const alpha = data[(y * width + x) * 4 + 3];
                    if (alpha > threshold) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                        found = true;
                    }
                }
            }

            if (!found) {
                resolve(null); // Imagem totalmente transparente
                return;
            }

            // Adicionar uma pequena margem de 1px para segurança
            minX = Math.max(0, minX - 1);
            minY = Math.max(0, minY - 1);
            maxX = Math.min(width, maxX + 1);
            maxY = Math.min(height, maxY + 1);

            const trimWidth = maxX - minX;
            const trimHeight = maxY - minY;

            // Se a imagem já estiver otimizada, não faz nada
            if (trimWidth === width && trimHeight === height) {
                resolve(null);
                return;
            }

            // Criar novo canvas com o tamanho aparado
            const trimmedCanvas = document.createElement('canvas');
            trimmedCanvas.width = trimWidth;
            trimmedCanvas.height = trimHeight;
            const trimmedCtx = trimmedCanvas.getContext('2d');

            if (!trimmedCtx) {
                reject(new Error("Could not get trimmed canvas context"));
                return;
            }

            // Desenhar apenas a parte relevante
            trimmedCtx.drawImage(
                canvas,
                minX, minY, trimWidth, trimHeight,
                0, 0, trimWidth, trimHeight
            );

            resolve({
                src: trimmedCanvas.toDataURL(),
                x: minX,
                y: minY,
                width: trimWidth,
                height: trimHeight
            });
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};
