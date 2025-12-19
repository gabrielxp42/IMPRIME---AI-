import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import logger from '../../../core/logger';

export interface SelectionData {
    type: 'point' | 'box';
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

export class BackgroundRemovalManualHandler {
    private pythonScriptPath: string;
    private readonly TIMEOUT_MS = 120000; // 2 minutos (SAM com prompt é rápido)

    constructor() {
        const isDev = !app.isPackaged;
        if (isDev) {
            this.pythonScriptPath = path.join(process.cwd(), 'src', 'main', 'background_remover_manual.py');
        } else {
            this.pythonScriptPath = path.join(process.resourcesPath, 'background_remover_manual.exe');
        }
    }

    async removeBackground(
        inputPath: string,
        outputPath: string,
        selectionData: SelectionData,
        progressCallback?: (message: string) => void
    ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
        logger.info('Iniciando remoção de fundo manual (SAM)', {
            inputPath,
            outputPath,
            selectionData
        });

        return new Promise((resolve) => {
            if (!fs.existsSync(this.pythonScriptPath)) {
                const error = `Removedor manual não encontrado: ${this.pythonScriptPath}`;
                logger.error(error);
                resolve({ success: false, error });
                return;
            }

            const isDev = !app.isPackaged;
            let processCmd: string;
            let processArgs: string[];

            const selectionJson = JSON.stringify(selectionData);

            if (isDev) {
                processCmd = 'python';
                processArgs = [
                    this.pythonScriptPath,
                    inputPath,
                    outputPath,
                    selectionJson
                ];
            } else {
                processCmd = this.pythonScriptPath;
                processArgs = [
                    inputPath,
                    outputPath,
                    selectionJson
                ];
            }

            logger.info(`Executando: ${processCmd} ${processArgs.join(' ')}`);

            const pythonProcess = spawn(processCmd, processArgs);

            let stderr = '';
            let stdout = '';
            let isResolved = false;
            let lastProgressTime = Date.now();

            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    logger.error('Timeout na remoção manual');
                    pythonProcess.kill('SIGTERM');
                    isResolved = true;
                    resolve({
                        success: false,
                        error: 'Timeout: Processo demorou muito (>2min)'
                    });
                }
            }, this.TIMEOUT_MS);

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
                    logger.info('Remoção manual concluída', { outputPath });
                    resolve({
                        success: true,
                        outputPath: outputPath
                    });
                } else {
                    const errorMsg = stderr || stdout || 'Erro desconhecido';
                    logger.error(`Erro na remoção manual (código ${code})`, new Error(errorMsg));
                    resolve({
                        success: false,
                        error: `Erro (código ${code}): ${errorMsg}`
                    });
                }
            });

            pythonProcess.on('error', (err) => {
                if (isResolved) return;

                clearTimeout(timeoutId);
                clearInterval(heartbeatInterval);
                isResolved = true;

                logger.error('Falha ao iniciar processo Python manual', err);
                resolve({
                    success: false,
                    error: `Falha ao iniciar: ${err.message}`
                });
            });
        });
    }
}
