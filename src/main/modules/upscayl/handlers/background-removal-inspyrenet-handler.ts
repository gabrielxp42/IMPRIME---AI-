import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class BackgroundRemovalInspyrenetHandler {
    private getPythonPath(): string {
        // Em produção, usar o executável empacotado
        if (app.isPackaged) {
            return path.join(process.resourcesPath, 'background_remover_inspyrenet.exe');
        }

        // Em desenvolvimento, usar o python do sistema
        // Tenta encontrar python3 ou python
        return 'python';
    }

    private getScriptPath(): string {
        if (app.isPackaged) {
            return ''; // Não usa script path quando é executável
        }
        return path.join(__dirname, '../../src/main/background_remover_inspyrenet.py');
    }

    async removeBackground(inputPath: string, outputPath: string, mode: 'base' | 'fast' = 'base'): Promise<{ success: boolean; outputPath?: string; error?: string }> {
        return new Promise((resolve) => {
            const pythonPath = this.getPythonPath();
            const scriptPath = this.getScriptPath();

            const args = app.isPackaged
                ? [inputPath, outputPath, mode]
                : [scriptPath, inputPath, outputPath, mode];

            console.log('Iniciando InSPyReNet:', pythonPath, args);

            const pythonProcess = spawn(pythonPath, args);

            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString();
                outputData += message;
                console.log('[InSPyReNet Output]:', message);
            });

            pythonProcess.stderr.on('data', (data) => {
                const message = data.toString();
                errorData += message;
                console.error('[InSPyReNet Error]:', message);
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
