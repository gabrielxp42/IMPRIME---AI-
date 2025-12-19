import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

class Logger {
    private logDir: string;
    private logFile: string;
    private maxLogSize = 5 * 1024 * 1024; // 5MB
    private maxLogFiles = 5;

    constructor() {
        // Criar pasta de logs no diretório de dados do usuário
        this.logDir = path.join(app.getPath('userData'), 'logs');
        this.ensureLogDir();

        // Nome do arquivo de log com data
        const date = new Date().toISOString().split('T')[0];
        this.logFile = path.join(this.logDir, `app-${date}.log`);
    }

    private ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private formatMessage(level: LogLevel, message: string, context?: any): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}\n`;
    }

    private writeToFile(message: string) {
        try {
            // Verificar tamanho do arquivo e rotacionar se necessário
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.maxLogSize) {
                    this.rotateLog();
                }
            }

            fs.appendFileSync(this.logFile, message, 'utf8');
        } catch (error) {
            console.error('Erro ao escrever log:', error);
        }
    }

    private rotateLog() {
        try {
            // Rotacionar arquivos de log
            for (let i = this.maxLogFiles - 1; i >= 1; i--) {
                const oldFile = `${this.logFile}.${i}`;
                const newFile = `${this.logFile}.${i + 1}`;

                if (fs.existsSync(oldFile)) {
                    if (i === this.maxLogFiles - 1) {
                        fs.unlinkSync(oldFile); // Deletar o mais antigo
                    } else {
                        fs.renameSync(oldFile, newFile);
                    }
                }
            }

            // Renomear arquivo atual
            if (fs.existsSync(this.logFile)) {
                fs.renameSync(this.logFile, `${this.logFile}.1`);
            }
        } catch (error) {
            console.error('Erro ao rotacionar logs:', error);
        }
    }

    debug(message: string, context?: any) {
        const formatted = this.formatMessage(LogLevel.DEBUG, message, context);
        console.log(formatted.trim());
        this.writeToFile(formatted);
    }

    info(message: string, context?: any) {
        const formatted = this.formatMessage(LogLevel.INFO, message, context);
        console.log(formatted.trim());
        this.writeToFile(formatted);
    }

    warn(message: string, context?: any) {
        const formatted = this.formatMessage(LogLevel.WARN, message, context);
        console.warn(formatted.trim());
        this.writeToFile(formatted);
    }

    error(message: string, error?: Error | any, context?: any) {
        const errorDetails = error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error;

        const fullContext = { ...context, error: errorDetails };
        const formatted = this.formatMessage(LogLevel.ERROR, message, fullContext);
        console.error(formatted.trim());
        this.writeToFile(formatted);
    }

    /**
     * Exporta todos os logs para um arquivo único
     */
    exportLogs(): string {
        try {
            const exportPath = path.join(this.logDir, `export-${Date.now()}.log`);
            const files = fs.readdirSync(this.logDir)
                .filter(f => f.startsWith('app-') && f.endsWith('.log'))
                .sort()
                .reverse();

            let content = '=== SPOT WHITE AUTOMATION - EXPORT DE LOGS ===\n';
            content += `Data de Export: ${new Date().toISOString()}\n`;
            content += `Versão: ${app.getVersion()}\n`;
            content += `Sistema: ${process.platform} ${process.arch}\n`;
            content += '='.repeat(50) + '\n\n';

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                if (fs.existsSync(filePath)) {
                    content += `\n\n=== ${file} ===\n`;
                    content += fs.readFileSync(filePath, 'utf8');
                }
            }

            fs.writeFileSync(exportPath, content, 'utf8');
            return exportPath;
        } catch (error) {
            console.error('Erro ao exportar logs:', error);
            throw error;
        }
    }

    /**
     * Limpa logs antigos
     */
    clearOldLogs(daysToKeep: number = 7) {
        try {
            const now = Date.now();
            const files = fs.readdirSync(this.logDir);

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24); // dias

                if (age > daysToKeep) {
                    fs.unlinkSync(filePath);
                    this.info(`Log antigo removido: ${file}`);
                }
            }
        } catch (error) {
            console.error('Erro ao limpar logs antigos:', error);
        }
    }

    /**
     * Retorna o caminho do diretório de logs
     */
    getLogDir(): string {
        return this.logDir;
    }
}

// Singleton
const logger = new Logger();

export default logger;
