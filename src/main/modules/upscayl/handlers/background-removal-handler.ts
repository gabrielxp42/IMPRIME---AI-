import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import logger from '../../../core/logger';

export class BackgroundRemovalHandler {
    private pythonScriptPath: string;
    private readonly TIMEOUT_MS = 180000; // 3 minutos timeout

    constructor() {
        const isDev = !app.isPackaged;
        if (isDev) {
            // Caminho correto no source
            this.pythonScriptPath = path.join(process.cwd(), 'src', 'main', 'modules', 'upscayl', 'scripts', 'background_remover.py');

            // Fallback: se não existir, tentar no dist (onde o copy script coloca)
            if (!fs.existsSync(this.pythonScriptPath)) {
                const distPath = path.join(process.cwd(), 'dist', 'background_remover.py');
                if (fs.existsSync(distPath)) {
                    this.pythonScriptPath = distPath;
                } else {
                    // Fallback 2: Tentar na raiz do src/main (correção manual)
                    const rootBackup = path.join(process.cwd(), 'src', 'main', 'background_remover.py');
                    if (fs.existsSync(rootBackup)) {
                        this.pythonScriptPath = rootBackup;
                    }
                }
            }
        } else {
            // Em produção, usamos o executável compilado ou o script no resources
            this.pythonScriptPath = path.join(process.resourcesPath, 'background_remover.exe');

            // Fallback para script se exe não existir
            if (!fs.existsSync(this.pythonScriptPath)) {
                this.pythonScriptPath = path.join(process.resourcesPath, 'background_remover.py');
            }
        }
    }

    async removeBackground(
        inputPath: string,
        outputPath: string,
        progressCallback?: (message: string) => void,
        removeInternalBlacks: boolean = false,
        blackThreshold: number = 30
    ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
        logger.info('Iniciando remoção de fundo', {
            inputPath,
            outputPath,
            removeInternalBlacks,
            blackThreshold
        });

        return new Promise((resolve) => {
            // Verificar se o script/executável existe
            if (!fs.existsSync(this.pythonScriptPath)) {
                const error = `Removedor de fundo não encontrado: ${this.pythonScriptPath}`;
                logger.error(error);
                resolve({
                    success: false,
                    error
                });
                return;
            }

            const isDev = !app.isPackaged;
            let processCmd: string;
            let processArgs: string[];

            if (isDev) {
                processCmd = 'python';
                processArgs = [
                    this.pythonScriptPath,
                    inputPath,
                    outputPath,
                    removeInternalBlacks.toString(),
                    blackThreshold.toString()
                ];
            } else {
                processCmd = this.pythonScriptPath;
                processArgs = [
                    inputPath,
                    outputPath,
                    removeInternalBlacks.toString(),
                    blackThreshold.toString()
                ];
            }

            logger.info(`Executando: ${processCmd} ${processArgs.join(' ')}`);

            const pythonProcess = spawn(processCmd, processArgs);

            let stderr = '';
            let stdout = '';
            let isResolved = false;
            let lastProgressTime = Date.now();

            // Timeout para evitar travamento
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    logger.error('Timeout atingido na remoção de fundo');
                    pythonProcess.kill('SIGTERM');
                    isResolved = true;
                    resolve({
                        success: false,
                        error: 'Timeout: Processo de remoção de fundo demorou muito (>3min). A imagem pode ser muito grande.'
                    });
                }
            }, this.TIMEOUT_MS);

            // Heartbeat para mostrar que está vivo
            const heartbeatInterval = setInterval(() => {
                if (!isResolved) {
                    const elapsed = Math.floor((Date.now() - lastProgressTime) / 1000);
                    if (elapsed > 10 && progressCallback) {
                        progressCallback(`Processando... (${elapsed}s)`);
                    }
                }
            }, 5000);

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                const output = data.toString().trim();

                if (output.startsWith('PROGRESS:')) {
                    lastProgressTime = Date.now();
                    const message = output.replace('PROGRESS:', '');
                    logger.debug(`Progresso: ${message}`);
                    if (progressCallback) {
                        progressCallback(message);
                    }
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                const output = data.toString().trim();

                // Filtrar mensagens de progresso
                if (output.startsWith('PROGRESS:')) {
                    lastProgressTime = Date.now();
                    const message = output.replace('PROGRESS:', '');
                    logger.debug(`Progresso: ${message}`);
                    if (progressCallback) {
                        progressCallback(message);
                    }
                } else if (!output.includes('Downloading') && !output.includes('model')) {
                    logger.warn(`stderr: ${output}`);
                }
            });

            pythonProcess.on('close', (code) => {
                if (isResolved) return;

                clearTimeout(timeoutId);
                clearInterval(heartbeatInterval);
                isResolved = true;

                if (code === 0) {
                    logger.info('Remoção de fundo concluída com sucesso', { outputPath });
                    resolve({
                        success: true,
                        outputPath: outputPath
                    });
                } else {
                    const errorMsg = stderr || stdout || 'Erro desconhecido';
                    logger.error(`Erro ao remover fundo (código ${code})`, new Error(errorMsg));
                    resolve({
                        success: false,
                        error: `Erro ao remover fundo (código ${code}): ${errorMsg}`
                    });
                }
            });

            pythonProcess.on('error', (err) => {
                if (isResolved) return;

                clearTimeout(timeoutId);
                clearInterval(heartbeatInterval);
                isResolved = true;

                logger.error('Falha ao iniciar processo Python', err);
                resolve({
                    success: false,
                    error: `Falha ao iniciar processo Python: ${err.message}. Verifique se Python e rembg estão instalados.`
                });
            });
        });
    }
}
