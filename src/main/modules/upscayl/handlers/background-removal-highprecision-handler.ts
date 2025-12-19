import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class BackgroundRemovalHighPrecisionHandler {
    private getPythonPath(): string {
        // Em produção, usar o executável empacotado
        if (app.isPackaged) {
            return path.join(process.resourcesPath, 'background_remover_highprecision.exe');
        }

        // Em desenvolvimento, usar o python do sistema
        return 'python';
    }

    private getScriptPath(): string {
        if (app.isPackaged) {
            return ''; // Não usa script path quando é executável
        }
        // Caminho correto no source
        const srcPath = path.join(process.cwd(), 'src', 'main', 'modules', 'upscayl', 'scripts', 'background_remover_highprecision.py');
        if (fs.existsSync(srcPath)) return srcPath;

        // Fallback para dist
        const distPath = path.join(process.cwd(), 'dist', 'background_remover_highprecision.py');
        if (fs.existsSync(distPath)) return distPath;

        return srcPath; // Fallback final
    }

    async removeBackground(
        inputPath: string,
        outputPath: string,
        progressCallback?: (message: string) => void,
        removeInternalBlacks: boolean = false,
        blackThreshold: number = 30
    ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
        return new Promise((resolve) => {
            const pythonPath = this.getPythonPath();
            const scriptPath = this.getScriptPath();

            const args = app.isPackaged
                ? [inputPath, outputPath, removeInternalBlacks.toString(), blackThreshold.toString()]
                : [scriptPath, inputPath, outputPath, removeInternalBlacks.toString(), blackThreshold.toString()];

            console.log('Iniciando remoção de fundo (Alta Precisão):', pythonPath, args);

            const pythonProcess = spawn(pythonPath, args);

            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString();
                outputData += message;
                console.log('[BG Removal HP Output]:', message);

                if (message.startsWith('SUCCESS:')) {
                    const filePath = message.replace('SUCCESS:', '').trim();
                    console.log('Arquivo gerado:', filePath);
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                const message = data.toString();
                errorData += message;
                console.error('[BG Removal HP Error]:', message);

                if (message.includes('PROGRESS:') && progressCallback) {
                    const progressMessage = message.split('PROGRESS:')[1]?.trim();
                    if (progressMessage) {
                        progressCallback(progressMessage);
                    }
                }
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    // Verificar se o arquivo foi criado
                    if (fs.existsSync(outputPath)) {
                        resolve({ success: true, outputPath });
                    } else {
                        resolve({ success: false, error: 'Arquivo de saída não foi criado.' });
                    }
                } else {
                    resolve({
                        success: false,
                        error: `Processo falhou com código ${code}. Erro: ${errorData}`
                    });
                }
            });

            pythonProcess.on('error', (err) => {
                resolve({ success: false, error: `Erro ao iniciar processo: ${err.message}` });
            });
        });
    }
}
