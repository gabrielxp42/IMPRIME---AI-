/**
 * Utilitário para análise e correção de semitransparências para impressão DTF
 */

export interface TransparencyResult {
    hasIssues: boolean;
    pixelCount: number;
    issuePercentage: number;
    previewUrl: string; // URL da imagem com highlight magenta
}

export const analyzeTransparency = (
    imageSrc: string,
    threshold: number = 250 // Pixels com alpha < 250 e > 0 são considerados problema
): Promise<TransparencyResult> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve({ hasIssues: false, pixelCount: 0, issuePercentage: 0, previewUrl: imageSrc });
                return;
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const totalPixels = data.length / 4;
            let issuePixels = 0;

            // Criar buffer para visualização (cópia da imagem original)
            // Vamos pintar de magenta os pixels problemáticos
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = canvas.width;
            previewCanvas.height = canvas.height;
            const previewCtx = previewCanvas.getContext('2d')!;
            previewCtx.drawImage(img, 0, 0);
            const previewData = previewCtx.getImageData(0, 0, canvas.width, canvas.height);
            const pData = previewData.data;

            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];

                // Lógica de detecção de semitransparência
                // Ignoramos totalmente transparentes (0) e totalmente opacos (255)
                // Consideramos margem de segurança (ex: > 250 é aceitável como sólido)
                if (alpha > 0 && alpha < threshold) {
                    issuePixels++;

                    // Pintar de Magenta Neon (#FF00FF) na visualização
                    pData[i] = 255;     // R
                    pData[i + 1] = 0;   // G
                    pData[i + 2] = 255; // B
                    pData[i + 3] = 255; // Alpha Sólido para destaque visível
                }
            }

            previewCtx.putImageData(previewData, 0, 0);

            resolve({
                hasIssues: issuePixels > 0,
                pixelCount: issuePixels,
                issuePercentage: (issuePixels / totalPixels) * 100,
                previewUrl: previewCanvas.toDataURL()
            });
        };
    });
};

export const fixTransparency = (
    imageSrc: string,
    options: {
        removeThreshold: number; // Abaixo disso vira 0 (transparente)
        solidifyThreshold: number; // Acima disso vira 255 (sólido)
    }
): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(imageSrc);
                return;
            }

            ctx.drawImage(img, 0, 0);
            const width = canvas.width;
            const height = canvas.height;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Buffer temporário para não ler pixels já modificados durante a verificação de vizinhos
            // (Embora para algo simples assim, ler do original seja o correto)
            const originalData = new Uint8ClampedArray(data);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;

                    const alpha = originalData[i + 3];

                    if (alpha === 0) continue;

                    // 1. Limpeza Primária (Threshold Simples)
                    if (alpha < options.removeThreshold) {
                        data[i + 3] = 0;
                        continue;
                    }

                    // 2. Limpeza Avançada: Remoção de Ruído Isolado (Despeckle)
                    // Se o pixel é fraco (zona de risco) e não tem vizinhos fortes, é sujeira.
                    if (alpha < options.solidifyThreshold) {
                        let strongNeighbors = 0;
                        // Verificar 4 vizinhos (Cima, Baixo, Esq, Dir)
                        // Vizinho Cima
                        if (y > 0 && originalData[((y - 1) * width + x) * 4 + 3] > options.removeThreshold) strongNeighbors++;
                        // Vizinho Baixo
                        if (y < height - 1 && originalData[((y + 1) * width + x) * 4 + 3] > options.removeThreshold) strongNeighbors++;
                        // Vizinho Esq
                        if (x > 0 && originalData[(y * width + (x - 1)) * 4 + 3] > options.removeThreshold) strongNeighbors++;
                        // Vizinho Dir
                        if (x < width - 1 && originalData[(y * width + (x + 1)) * 4 + 3] > options.removeThreshold) strongNeighbors++;

                        // Se não tiver pelo menos 2 vizinhos visíveis, consideramos ruído e removemos
                        // (Isso limpa aqueles pixels "poeira" que ficariam horríveis se solidificados)
                        if (strongNeighbors < 2) {
                            data[i + 3] = 0;
                            continue;
                        }
                    }

                    // 3. Recuperação de Cor e Solidificação (DTF Industrial Grade)
                    if (alpha >= options.solidifyThreshold) {
                        data[i + 3] = 255;
                    } else {
                        // Aplica um Boost extremo para eliminar a semitransparência detectada pelo Photoshop
                        let normalizedAlpha = alpha / 255.0;
                        const industrialGamma = 0.1;
                        normalizedAlpha = Math.pow(normalizedAlpha, industrialGamma);
                        let newAlpha = Math.round(normalizedAlpha * 255);

                        // Snap para solidez absoluta se estiver no topo da curva
                        if (newAlpha > 200) newAlpha = 255;
                        data[i + 3] = newAlpha;
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
    });
};
