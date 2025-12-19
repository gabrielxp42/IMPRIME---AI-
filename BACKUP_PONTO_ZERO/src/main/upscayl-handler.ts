import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import logger from './logger';

export interface UpscaleOptions {
    inputPath: string;
    outputPath: string;
    model: string;
    scale?: number;
}

export interface UpscaleProgress {
    stage: 'starting' | 'processing' | 'complete' | 'error';
    progress?: number;
    message?: string;
}

export class UpscaylHandler {
    private binPath: string;
    private modelsPath: string;

    constructor() {
        // Em desenvolvimento, usa o caminho relativo ao projeto
        // Em produção, usa o caminho dos recursos empacotados
        const isDev = !app.isPackaged;

        if (isDev) {
            this.binPath = path.join(process.cwd(), 'upscayl-bin', 'bin', 'upscayl-bin.exe');
            this.modelsPath = path.join(process.cwd(), 'upscayl-bin', 'models');
        } else {
            this.binPath = path.join(process.resourcesPath, 'upscayl-bin', 'bin', 'upscayl-bin.exe');
            this.modelsPath = path.join(process.resourcesPath, 'upscayl-bin', 'models');
        }
    }

    /**
     * Verifica se o binário e os modelos estão disponíveis
     */
    async checkAvailability(): Promise<{ available: boolean; error?: string }> {
        try {
            if (!fs.existsSync(this.binPath)) {
                const error = `Binário não encontrado: ${this.binPath}`;
                logger.error(error);
                return {
                    available: false,
                    error,
                };
            }

            if (!fs.existsSync(this.modelsPath)) {
                const error = `Pasta de modelos não encontrada: ${this.modelsPath}`;
                logger.error(error);
                return {
                    available: false,
                    error,
                };
            }

            return { available: true };
        } catch (error) {
            logger.error('Erro ao verificar disponibilidade do Upscayl', error);
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            };
        }
    }

    /**
     * Lista os modelos disponíveis
     */
    async listModels(): Promise<string[]> {
        try {
            const files = fs.readdirSync(this.modelsPath);
            const models = files
                .filter(f => f.endsWith('.param'))
                .map(f => f.replace('.param', ''));
            return models;
        } catch (error) {
            logger.error('Erro ao listar modelos', error);
            return [];
        }
    }

    /**
     * Executa o upscaling de uma imagem
     */
    async upscale(
        options: UpscaleOptions,
        onProgress?: (progress: UpscaleProgress) => void
    ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
        logger.info('Iniciando upscaling', options);

        return new Promise((resolve) => {
            try {
                // Verificar se o arquivo de entrada existe
                if (!fs.existsSync(options.inputPath)) {
                    const error = `Arquivo de entrada não encontrado: ${options.inputPath}`;
                    logger.error(error);
                    resolve({
                        success: false,
                        error,
                    });
                    return;
                }

                // Verificar se o modelo existe
                const modelParamPath = path.join(this.modelsPath, `${options.model}.param`);
                const modelBinPath = path.join(this.modelsPath, `${options.model}.bin`);

                if (!fs.existsSync(modelParamPath) || !fs.existsSync(modelBinPath)) {
                    const error = `Modelo não encontrado: ${options.model}`;
                    logger.error(error);
                    resolve({
                        success: false,
                        error,
                    });
                    return;
                }

                // Garantir que o diretório de saída existe
                const outputDir = path.dirname(options.outputPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                onProgress?.({
                    stage: 'starting',
                    progress: 0,
                    message: 'Iniciando upscaling...',
                });

                // Argumentos para o upscayl-bin
                // Formato: upscayl-bin.exe -i input.png -o output.png -n model-name -s scale -m models_path
                const args = [
                    '-i', options.inputPath,
                    '-o', options.outputPath,
                    '-n', options.model,
                    '-s', String(options.scale || 4),
                    '-m', this.modelsPath, // Passar caminho dos modelos explicitamente
                    '-f', 'png', // formato de saída
                ];

                logger.info(`Executando Upscayl: ${this.binPath} ${args.join(' ')}`);

                const process = spawn(this.binPath, args, {
                    cwd: path.dirname(this.binPath),
                });

                let stderr = '';
                let stdout = '';

                process.stdout?.on('data', (data) => {
                    stdout += data.toString();
                    logger.debug(`[Upscayl stdout]: ${data.toString().trim()}`);

                    onProgress?.({
                        stage: 'processing',
                        progress: 50,
                        message: 'Processando imagem...',
                    });
                });

                process.stderr?.on('data', (data) => {
                    stderr += data.toString();
                    // Upscayl escreve progresso no stderr às vezes
                    logger.debug(`[Upscayl stderr]: ${data.toString().trim()}`);
                });

                process.on('close', (code) => {
                    if (code === 0) {
                        // Verificar se o arquivo de saída foi criado
                        if (fs.existsSync(options.outputPath)) {
                            logger.info('Upscaling concluído com sucesso', { outputPath: options.outputPath });
                            onProgress?.({
                                stage: 'complete',
                                progress: 100,
                                message: 'Upscaling concluído!',
                            });

                            resolve({
                                success: true,
                                outputPath: options.outputPath,
                            });
                        } else {
                            const error = 'Arquivo de saída não foi criado após execução bem-sucedida';
                            logger.error(error);
                            resolve({
                                success: false,
                                error,
                            });
                        }
                    } else {
                        const error = `Processo terminou com código ${code}. Stderr: ${stderr}`;
                        logger.error(`Erro no processo Upscayl (código ${code})`, new Error(stderr));

                        onProgress?.({
                            stage: 'error',
                            message: `Erro no processo (código ${code})`,
                        });

                        resolve({
                            success: false,
                            error,
                        });
                    }
                });

                process.on('error', (error) => {
                    logger.error('Erro ao executar processo Upscayl', error);
                    onProgress?.({
                        stage: 'error',
                        message: error.message,
                    });

                    resolve({
                        success: false,
                        error: `Erro ao executar processo: ${error.message}`,
                    });
                });
            } catch (error) {
                logger.error('Exceção não tratada no UpscaylHandler', error);
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                });
            }
        });
    }
}
