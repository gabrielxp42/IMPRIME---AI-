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

/**
 * Add DPI metadata (pHYs chunk) to a PNG data URL
 * This ensures Photoshop and other software read the correct physical dimensions
 * @param dataUrl - The original PNG data URL
 * @param dpi - The desired DPI (default 300)
 * @returns A new data URL with embedded DPI metadata
 */
/**
 * Adiciona metadados de DPI (pHYs chunk) a um buffer PNG (Uint8Array)
 */
export const addDpiToPngBuffer = (bytes: Uint8Array, dpi: number = 300): Uint8Array => {
    if (bytes.length < 33 || bytes[0] !== 0x89 || bytes[1] !== 0x50) {
        return bytes;
    }

    const ppm = Math.round(dpi / 0.0254);
    const physData = new Uint8Array(9);
    physData[0] = (ppm >>> 24) & 0xFF;
    physData[1] = (ppm >>> 16) & 0xFF;
    physData[2] = (ppm >>> 8) & 0xFF;
    physData[3] = ppm & 0xFF;
    physData[4] = (ppm >>> 24) & 0xFF;
    physData[5] = (ppm >>> 16) & 0xFF;
    physData[6] = (ppm >>> 8) & 0xFF;
    physData[7] = ppm & 0xFF;
    physData[8] = 1; // Unidade: metros

    const crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crc32Table[i] = c;
    }

    const typeAndData = new Uint8Array(13);
    typeAndData[0] = 0x70; typeAndData[1] = 0x48; typeAndData[2] = 0x59; typeAndData[3] = 0x73;
    typeAndData.set(physData, 4);

    let crc = 0xFFFFFFFF;
    for (let i = 0; i < typeAndData.length; i++) {
        crc = crc32Table[(crc ^ typeAndData[i]) & 0xFF] ^ (crc >>> 8);
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;

    const physChunk = new Uint8Array(21);
    physChunk[3] = 9;
    physChunk.set(typeAndData, 4);
    physChunk[17] = (crc >>> 24) & 0xFF;
    physChunk[18] = (crc >>> 16) & 0xFF;
    physChunk[19] = (crc >>> 8) & 0xFF;
    physChunk[20] = crc & 0xFF;

    const ihdrEnd = 33;
    const newPng = new Uint8Array(bytes.length + physChunk.length);
    newPng.set(bytes.slice(0, ihdrEnd), 0);
    newPng.set(physChunk, ihdrEnd);
    newPng.set(bytes.slice(ihdrEnd), ihdrEnd + physChunk.length);

    return newPng;
};

export const addDpiMetadataToPng = async (dataUrl: string, dpi: number = 300): Promise<string> => {
    try {
        const parts = dataUrl.split(',');
        if (parts.length < 2) return dataUrl;
        const binary = atob(parts[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const newPng = addDpiToPngBuffer(bytes, dpi);

        const CHUNK_SIZE = 8192;
        let binaryStr = '';
        for (let i = 0; i < newPng.length; i += CHUNK_SIZE) {
            binaryStr += String.fromCharCode.apply(null, Array.from(newPng.subarray(i, i + CHUNK_SIZE)));
        }
        return parts[0] + ',' + btoa(binaryStr);
    } catch (e) {
        console.error('addDpiMetadataToPng error:', e);
        return dataUrl;
    }
};

/**
 * Analisa se uma imagem tem bordas transparentes desnecessárias (espaço vazio).
 * Retorna a porcentagem de área desperdiçada se for significativo (> 5%).
 */
export const analyzeExcessSpace = async (imageSrc: string): Promise<number> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(0);
                return;
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;

            let minX = width, minY = height, maxX = 0, maxY = 0;
            let found = false;
            const threshold = 10; // Sensibilidade baixa para ignorar ruído

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
                resolve(100); // Imagem totalmente transparente
                return;
            }

            // Margem de segurança básica
            const contentWidth = (maxX - minX) + 2;
            const contentHeight = (maxY - minY) + 2;

            // Garantir que não exceda dimensões reais
            const safeWidth = Math.min(width, contentWidth);
            const safeHeight = Math.min(height, contentHeight);

            const contentArea = safeWidth * safeHeight;
            const totalArea = width * height;

            if (totalArea === 0) {
                resolve(0);
                return;
            }

            const wastedArea = totalArea - contentArea;
            const wastedPercent = (wastedArea / totalArea) * 100;

            // Se for muito pouco (menos de 10%), ignora para não ser chato
            if (wastedPercent < 10) {
                resolve(0);
            } else {
                resolve(parseFloat(wastedPercent.toFixed(1)));
            }
        };
        img.onerror = () => resolve(0);
        img.src = imageSrc;
    });
};
