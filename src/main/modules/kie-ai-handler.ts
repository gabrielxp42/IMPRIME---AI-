/**
 * Kie.ai Handler - Integração com API Nano Banana
 * Suporta geração e EDIÇÃO de imagens via IA
 */

import logger from '../core/logger';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface KieAiTask {
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: {
        imageUrl?: string;
        error?: string;
    };
}

export interface KieAiGenerateOptions {
    prompt: string;
    imageBase64?: string;
    maskBase64?: string;
    model?: string;
    aspectRatio?: string;
}

export class KieAiHandler {
    private apiKey: string;
    private baseUrl = 'https://api.kie.ai/api/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Faz upload de uma imagem base64 para obter URL pública
     * Usa o serviço gratuito imgbb.com
     */
    private async uploadImage(base64Data: string): Promise<string | null> {
        try {
            // Remover prefixo data:image se existir
            let cleanBase64 = base64Data;
            if (base64Data.includes(',')) {
                cleanBase64 = base64Data.split(',')[1];
            }

            // ImgBB API (free, no account needed for basic uploads)
            const formData = new URLSearchParams();
            formData.append('image', cleanBase64);

            const response = await fetch('https://api.imgbb.com/1/upload?key=00000000000000000000000000000000', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // Fallback: usar freeimage.host
                return await this.uploadToFreeImageHost(cleanBase64);
            }

            const data = await response.json() as any;
            if (data.success && data.data?.url) {
                console.log('[KieAI] Image uploaded to imgbb:', data.data.url);
                return data.data.url;
            }

            return await this.uploadToFreeImageHost(cleanBase64);
        } catch (error) {
            logger.error('[KieAI] Failed to upload image:', error);
            return await this.uploadToFreeImageHost(base64Data);
        }
    }

    /**
     * Fallback: Upload para freeimage.host (não requer API key)
     */
    private async uploadToFreeImageHost(base64Data: string): Promise<string | null> {
        try {
            let cleanBase64 = base64Data;
            if (base64Data.includes(',')) {
                cleanBase64 = base64Data.split(',')[1];
            }

            // freeimage.host aceita uploads públicos
            const formData = new URLSearchParams();
            formData.append('source', cleanBase64);
            formData.append('type', 'base64');
            formData.append('action', 'upload');

            const response = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json() as any;
            if (data.status_code === 200 && data.image?.url) {
                console.log('[KieAI] Image uploaded to freeimage.host:', data.image.url);
                return data.image.url;
            }

            // Último fallback: 0x0.st (mais simples)
            return await this.uploadTo0x0(base64Data);
        } catch (error) {
            logger.error('[KieAI] freeimage.host upload failed:', error);
            return await this.uploadTo0x0(base64Data);
        }
    }

    /**
     * Último fallback: 0x0.st
     */
    private async uploadTo0x0(base64Data: string): Promise<string | null> {
        try {
            let cleanBase64 = base64Data;
            if (base64Data.includes(',')) {
                cleanBase64 = base64Data.split(',')[1];
            }

            // Converter base64 para Buffer
            const buffer = Buffer.from(cleanBase64, 'base64');

            // 0x0.st aceita multipart/form-data
            const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
            const body = Buffer.concat([
                Buffer.from(`--${boundary}\r\n`),
                Buffer.from(`Content-Disposition: form-data; name="file"; filename="image.png"\r\n`),
                Buffer.from(`Content-Type: image/png\r\n\r\n`),
                buffer,
                Buffer.from(`\r\n--${boundary}--\r\n`),
            ]);

            const response = await fetch('https://0x0.st', {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                },
                body: body,
            });

            if (response.ok) {
                const url = await response.text();
                console.log('[KieAI] Image uploaded to 0x0.st:', url.trim());
                return url.trim();
            }

            logger.error('[KieAI] All upload services failed');
            return null;
        } catch (error) {
            logger.error('[KieAI] 0x0.st upload failed:', error);
            return null;
        }
    }

    /**
     * Cria uma tarefa de geração/edição de imagem
     */
    async createTask(options: KieAiGenerateOptions): Promise<{ success: boolean; taskId?: string; error?: string }> {
        const { prompt, imageBase64, model = 'nano-banana' } = options;

        try {
            const hasInputImage = !!imageBase64;

            // Determinar modelo: se tem imagem, usar nano-banana-edit
            let finalModel = model;
            let imageUrl: string | undefined;

            if (hasInputImage && imageBase64) {
                // Para edição, precisamos fazer upload da imagem
                console.log('[KieAI] Uploading image for editing...');
                const uploadedUrl = await this.uploadImage(imageBase64);

                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                    finalModel = 'nano-banana-edit';
                    console.log('[KieAI] Using nano-banana-edit with URL:', imageUrl);
                } else {
                    // Se upload falhar, usar nano-banana com inputImage
                    console.log('[KieAI] Upload failed, falling back to nano-banana');
                    finalModel = 'nano-banana';
                }
            }

            logger.info(`[KieAI] Criando tarefa com modelo: ${finalModel}, hasImage: ${hasInputImage}`);

            // Construir body baseado no modelo
            const requestBody: any = {
                model: finalModel.includes('/') ? finalModel : `google/${finalModel}`,
                input: {
                    prompt: prompt,
                    output_format: 'png',
                },
            };

            // Para nano-banana-edit, usar image_urls e opcionalmente mask_urls
            if (finalModel === 'nano-banana-edit' && imageUrl) {
                requestBody.input.image_urls = [imageUrl];

                // Se temos máscara, fazer upload dela também
                if (options.maskBase64) {
                    console.log('[KieAI] Uploading mask for in-painting...');
                    const maskUrl = await this.uploadImage(options.maskBase64);
                    if (maskUrl) {
                        requestBody.input.mask_urls = [maskUrl];
                        console.log('[KieAI] Using mask URL:', maskUrl);
                    }
                }

                requestBody.input.image_size = options.aspectRatio || '1:1';
            } else if (hasInputImage && imageBase64) {
                // Fallback para nano-banana com inputImage
                let finalImage = imageBase64;
                if (!imageBase64.startsWith('data:')) {
                    finalImage = `data:image/png;base64,${imageBase64}`;
                }
                requestBody.input.inputImage = finalImage;
                requestBody.input.aspect_ratio = options.aspectRatio || '1:1';
            } else {
                requestBody.input.aspect_ratio = options.aspectRatio || '1:1';
            }

            console.log('[KieAI] REQUEST:', JSON.stringify({
                model: requestBody.model,
                hasImageUrls: !!requestBody.input.image_urls,
                hasInputImage: !!requestBody.input.inputImage
            }));

            const response = await fetch(`${this.baseUrl}/jobs/createTask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`[KieAI] Erro na API: ${response.status} - ${errorText}`);
                return { success: false, error: `Erro ${response.status}: ${errorText}` };
            }

            const data = await response.json() as any;
            console.log('[KieAI] RAW RESPONSE:', JSON.stringify(data, null, 2));

            // Verificar erros conhecidos da API
            if (data.code === 402) {
                return { success: false, error: 'Créditos insuficientes na conta Kie.ai. Acesse kie.ai para recarregar.' };
            }

            if (data.code !== 200) {
                return { success: false, error: data.msg || `Erro da API: código ${data.code}` };
            }

            // Debug: Gravar resposta em arquivo
            try {
                const debugPath = path.join(app.getPath('userData'), 'kie_response_debug.json');
                fs.writeFileSync(debugPath, JSON.stringify(data, null, 2));
            } catch (err) {
                // ignore
            }

            // Extrair taskId
            let taskId: string | undefined;
            if (data.data) {
                if (typeof data.data === 'string') {
                    taskId = data.data;
                } else if (typeof data.data === 'object') {
                    taskId = data.data.id || data.data.taskId || data.data.task_id;
                }
            }
            if (!taskId) {
                taskId = data.id || data.taskId || data.task_id;
            }

            logger.info(`[KieAI] Tarefa criada: ${taskId}`);

            if (!taskId) {
                return { success: false, error: `ID não encontrado. Resp: ${JSON.stringify(data).substring(0, 200)}` };
            }

            return { success: true, taskId };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            logger.error(`[KieAI] Erro ao criar tarefa: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Consulta o status de uma tarefa
     */
    async getTaskStatus(taskId: string): Promise<KieAiTask> {
        try {
            const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            if (!response.ok) {
                return { taskId, status: 'failed', result: { error: `HTTP ${response.status}` } };
            }

            const responseBody = await response.json() as any;
            const data = responseBody.data || responseBody;

            console.log(`[KieAI] Status response state: ${data.state}`);

            // API usa: waiting, success, fail
            let status: KieAiTask['status'] = 'pending';
            if (data.state === 'success') {
                status = 'completed';
            } else if (data.state === 'fail') {
                status = 'failed';
            } else if (data.state === 'waiting') {
                status = 'processing';
            }

            // Extrair URL da imagem do resultJson
            let imageUrl: string | undefined;
            if (data.resultJson) {
                try {
                    const resultData = typeof data.resultJson === 'string'
                        ? JSON.parse(data.resultJson)
                        : data.resultJson;

                    if (resultData.resultUrls && resultData.resultUrls.length > 0) {
                        imageUrl = resultData.resultUrls[0];
                    }
                } catch (e) {
                    console.error('[KieAI] Failed to parse resultJson:', e);
                }
            }

            return {
                taskId,
                status,
                result: {
                    imageUrl: imageUrl,
                    error: data.failMsg || data.error,
                },
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            return { taskId, status: 'failed', result: { error: errorMsg } };
        }
    }

    /**
     * Executa tarefa completa com polling
     */
    async generateImage(options: KieAiGenerateOptions, maxWaitMs = 120000): Promise<{ success: boolean; imageBase64?: string; imageUrl?: string; error?: string }> {
        const createResult = await this.createTask(options);
        if (!createResult.success || !createResult.taskId) {
            return { success: false, error: createResult.error || 'Falha ao criar tarefa' };
        }

        const taskId = createResult.taskId;
        const startTime = Date.now();
        const pollInterval = 2000;

        while (Date.now() - startTime < maxWaitMs) {
            await this.sleep(pollInterval);

            const statusResult = await this.getTaskStatus(taskId);
            logger.info(`[KieAI] Status da tarefa ${taskId}: ${statusResult.status}`);

            if (statusResult.status === 'completed') {
                if (statusResult.result?.imageUrl) {
                    try {
                        const imageResponse = await fetch(statusResult.result.imageUrl);
                        const arrayBuffer = await imageResponse.arrayBuffer();
                        const base64 = Buffer.from(arrayBuffer).toString('base64');

                        return {
                            success: true,
                            imageBase64: base64,
                            imageUrl: statusResult.result.imageUrl
                        };
                    } catch (downloadError) {
                        logger.error('[KieAI] Erro ao baixar imagem:', downloadError);
                        return { success: false, error: 'Erro ao baixar imagem gerada' };
                    }
                }
                return { success: false, error: 'Imagem não retornada pela API' };
            }

            if (statusResult.status === 'failed') {
                return { success: false, error: statusResult.result?.error || 'Tarefa falhou' };
            }
        }

        return { success: false, error: 'Timeout: tarefa demorou muito para completar' };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
