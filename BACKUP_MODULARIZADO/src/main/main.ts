import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import * as path from 'path';
import { PhotoshopAutomation } from './modules/spotwhite';
import { ImageValidator } from './core/image-validator';
import { GeminiOrchestrator } from './modules/spotwhite';
import { PhotoshopDetector } from './modules/spotwhite';
import { UpscaylHandler } from './modules/upscayl';
import { BackgroundRemovalHandler } from './modules/upscayl';
import { BackgroundRemovalHighPrecisionHandler } from './modules/upscayl';
import logger from './core/logger';

// Instâncias globais
const photoshopAutomation = new PhotoshopAutomation();
const upscaylHandler = new UpscaylHandler();
const backgroundRemovalHandler = new BackgroundRemovalHandler();
const backgroundRemovalHighPrecisionHandler = new BackgroundRemovalHighPrecisionHandler();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#1a1a2e',
    frame: false, // Remove a barra de título nativa do Windows
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
  });

  // Remover menu nativo
  mainWindow.setMenu(null);

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'renderer/index.html');
    console.log('[DEBUG] Tentando carregar HTML de:', indexPath);

    mainWindow.loadFile(indexPath).catch((e) => {
      console.error('Failed to load index.html:', e);
      dialog.showErrorBox('Erro Fatal de Carregamento', `Path: ${indexPath}\nErro: ${e.message}`);
    });
    // Abrir DevTools também no build para ver erros de console
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    // Não exibir erro se for apenas navegação cancelada ou reload
    if (errorCode !== -3) {
      dialog.showErrorBox('Erro de Carregamento', `Falha ao carregar a interface (código ${errorCode}):\n${errorDescription}`);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Registrar protocolo 'media' para carregar arquivos locais
  protocol.handle('media', (request) => {
    let url = request.url.replace('media://', '');

    // Decodificar URL (lidar com %20 e acentos)
    url = decodeURIComponent(url);

    // Remover barra inicial extra se houver (comum em algumas requisições)
    if (url.startsWith('/') && !url.startsWith('//')) {
      url = url.slice(1);
    }

    // Normalizar barras para o sistema operacional
    // No Windows, queremos C:/... mas o net.fetch espera file:///C:/...
    // Vamos garantir que o caminho do arquivo seja válido

    console.log(`[Media Protocol] Fetching: ${url}`);

    // Usar file:// com caminho absoluto
    // Se o caminho já começar com drive letter (C:), adicionar file:///
    let finalUrl = url;
    if (!url.startsWith('file:')) {
      // Garantir formato file:/// padronizado
      finalUrl = `file:///${url.replace(/\\/g, '/')}`;
    }

    return net.fetch(finalUrl);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers para controle de janela
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// IPC Handlers
ipcMain.handle('detect-photoshop', async () => {
  const detector = new PhotoshopDetector();
  return await detector.detect();
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Todas as Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'psd', 'pdf'] },
      { name: 'PNG', extensions: ['png'] },
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Todos os Arquivos', extensions: ['*'] }
    ],
  });
  return result.canceled ? [] : result.filePaths;
});

// Handler para ler arquivo como base64 data URL
ipcMain.handle('read-file-as-data-url', async (_event, filePath: string) => {
  try {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Arquivo não encontrado' };
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);

    // Mapear extensão para mime type
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return { success: true, dataUrl };
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

ipcMain.handle('validate-files', async (_event, files: string[], config: {
  minDPI: number;
  maxDPI: number;
  widthCm: number;
  minHeightCm: number;
}) => {
  const validator = new ImageValidator();
  const results = [];

  for (const file of files) {
    try {
      const validation = await validator.validate(file, config);
      results.push({
        file,
        valid: validation.valid,
        errors: validation.errors,
        info: validation.info,
      });
    } catch (error) {
      results.push({
        file,
        valid: false,
        errors: [`Erro ao validar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
        info: null,
      });
    }
  }

  return results;
});

ipcMain.handle('process-spot-white', async (_event, files: string[], outputDir: string, geminiApiKey: string) => {
  // Validação obrigatória da API key
  if (!geminiApiKey || geminiApiKey.trim() === '') {
    return files.map(file => ({
      file,
      success: false,
      outputPath: null,
      error: 'Chave API do Google Gemini é obrigatória. Por favor, configure-a na interface.',
    }));
  }

  const automation = new PhotoshopAutomation();
  let orchestrator: GeminiOrchestrator;

  try {
    orchestrator = new GeminiOrchestrator(geminiApiKey.trim());
  } catch (error) {
    return files.map(file => ({
      file,
      success: false,
      outputPath: null,
      error: `Erro ao inicializar Gemini: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }));
  }

  const results = [];

  // Verificar se a ação existe ANTES de processar qualquer arquivo
  let actionExists = false;
  let actionCheckError: string | null = null;

  try {
    console.log('[Info] Verificando se a ação do Photoshop existe...');
    actionExists = await automation.checkActionExists();

    if (!actionExists) {
      // Tentar novamente uma vez antes de falhar
      console.log('[Info] Ação não encontrada na primeira tentativa. Tentando novamente...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      actionExists = await automation.checkActionExists();
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Error] Erro ao verificar ação:', errorMsg);
    actionCheckError = errorMsg;

    // Se o erro for sobre Python não encontrado, retornar erro específico
    if (errorMsg.includes('Python não encontrado') || errorMsg.includes('python') && errorMsg.includes('não encontrado')) {
      return files.map(file => ({
        file,
        success: false,
        outputPath: null,
        error: 'Python não encontrado. Por favor, instale Python 3.x e certifique-se de que está no PATH.',
      }));
    }
    // Se o erro for sobre pywin32, retornar erro específico
    if (errorMsg.includes('pywin32') || errorMsg.includes('win32com')) {
      return files.map(file => ({
        file,
        success: false,
        outputPath: null,
        error: 'Biblioteca pywin32 não encontrada. Execute: pip install pywin32',
      }));
    }
    // Se o erro for sobre Photoshop não estar acessível
    if (errorMsg.includes('Photoshop não está acessível') || errorMsg.includes('não está acessível')) {
      return files.map(file => ({
        file,
        success: false,
        outputPath: null,
        error: 'Photoshop não está acessível. Certifique-se de que o Photoshop está instalado e em execução.',
      }));
    }
    // Se o erro for sobre script não encontrado
    if (errorMsg.includes('Script Python não encontrado')) {
      return files.map(file => ({
        file,
        success: false,
        outputPath: null,
        error: `Script Python não encontrado. Verifique a instalação do aplicativo.`,
      }));
    }
  }

  if (!actionExists) {
    const errorMessage = actionCheckError
      ? `Erro ao verificar ação: ${actionCheckError}`
      : 'Ação "SPOTWHITE-PHOTOSHOP" não encontrada na verificação inicial.';

    console.warn('[Warning]', errorMessage);
    console.log('[Info] Tentando processar mesmo assim (Forced Mode)...');

    // NÃO RETORNAR MAIS ERRO AQUI. CONTINUAR PARA O LOOP DE ARQUIVOS.
    // Isso força o sistema a tentar abrir o arquivo no Photoshop.
  }

  console.log('[Info] Iniciando processamento dos arquivos...');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      console.log(`[Info] Processando arquivo ${i + 1}/${files.length}: ${file}`);

      // Orquestrar com Gemini (obrigatório)
      try {
        await orchestrator.orchestrateProcess(file);
      } catch (geminiError) {
        console.warn(`[Warning] Aviso do Gemini para ${file}:`, geminiError);
        // Não bloquear o processo se o Gemini falhar, apenas avisar
      }

      // Processar no Photoshop (a verificação da ação já foi feita, mas será verificada novamente dentro do processSpotWhite)
      const result = await automation.processSpotWhite(file, outputDir);
      console.log(`[Success] Arquivo processado com sucesso: ${result}`);
      results.push({
        file,
        success: true,
        outputPath: result,
        error: null,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`[Error] Erro ao processar ${file}:`, errorMsg);

      // Tratamento específico de erros conhecidos
      let finalError = errorMsg;

      if (errorMsg.includes('Python não encontrado') || (errorMsg.includes('python') && errorMsg.includes('não encontrado'))) {
        finalError = 'Python não encontrado. Por favor, instale Python 3.x e certifique-se de que está no PATH.';
      } else if (errorMsg.includes('pywin32') || errorMsg.includes('win32com')) {
        finalError = 'Biblioteca pywin32 não encontrada. Execute: pip install pywin32';
      } else if (errorMsg.includes('Photoshop não está acessível') || errorMsg.includes('não está acessível')) {
        finalError = 'Photoshop não está acessível. Certifique-se de que o Photoshop está instalado e em execução.';
      } else if (errorMsg.includes('Script Python não encontrado')) {
        finalError = 'Script Python não encontrado. Verifique a instalação do aplicativo.';
      } else if (errorMsg.includes('Arquivo de entrada não encontrado')) {
        finalError = `Arquivo não encontrado: ${file}`;
      } else if (errorMsg.includes('não encontrada') || errorMsg.includes('not found')) {
        finalError = `${errorMsg}\n\nDica: Verifique se:\n- O Photoshop está em execução\n- A ação "SPOTWHITE-PHOTOSHOP" existe no painel de ações\n- O nome da ação está correto (pode ter variações como "Spot White", "SPOTWHITE", etc.)`;
      }

      results.push({
        file,
        success: false,
        outputPath: null,
        error: finalError,
      });
    }
  }

  return results;
});

ipcMain.handle('check-action-exists', async () => {
  const automation = new PhotoshopAutomation();
  return await automation.checkActionExists();
});

ipcMain.handle('select-output-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Background removal handlers
ipcMain.handle('remove-background', async (_event, inputPath, outputPath, removeInternalBlacks, blackThreshold) => {
  return await backgroundRemovalHandler.removeBackground(inputPath, outputPath, undefined, removeInternalBlacks, blackThreshold);
});

ipcMain.handle('remove-background-manual', async (_event, inputPath, outputPath, _selection, removeInternalBlacks, blackThreshold) => {
  return await backgroundRemovalHighPrecisionHandler.removeBackground(inputPath, outputPath, undefined, removeInternalBlacks, blackThreshold);
});

// Remoção de fundo via base64 (para o Editor)
ipcMain.handle('remove-background-base64', async (_event, base64Data: string, highPrecision: boolean = false) => {
  const fs = require('fs');
  const os = require('os');

  try {
    logger.info('[Editor] Iniciando remoção de fundo via base64');

    // Criar arquivo temporário
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `editor-input-${Date.now()}.png`);
    const outputPath = path.join(tempDir, `editor-output-${Date.now()}.png`);

    // Salvar base64 como arquivo
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(inputPath, buffer);

    logger.info(`[Editor] Arquivo temporário criado: ${inputPath}`);

    // Processar com rembg
    let result;
    if (highPrecision) {
      result = await backgroundRemovalHighPrecisionHandler.removeBackground(inputPath, outputPath);
    } else {
      result = await backgroundRemovalHandler.removeBackground(inputPath, outputPath);
    }

    if (result.success && result.outputPath && fs.existsSync(result.outputPath)) {
      // Ler resultado como base64
      const resultBuffer = fs.readFileSync(result.outputPath);
      const resultBase64 = resultBuffer.toString('base64');

      // Limpar arquivos temporários
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(result.outputPath);
      } catch (cleanupError) {
        logger.warn('[Editor] Erro ao limpar arquivos temporários:', cleanupError);
      }

      logger.info('[Editor] Remoção de fundo concluída com sucesso');
      return { success: true, resultBase64 };
    } else {
      throw new Error(result.error || 'Falha ao processar imagem');
    }
  } catch (error) {
    logger.error('[Editor] Erro na remoção de fundo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

// Log handlers
ipcMain.handle('export-logs', async () => {
  try {
    const logsPath = logger.exportLogs();
    return { success: true, path: logsPath };
  } catch (error) {
    logger.error('Erro ao exportar logs', error as Error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

ipcMain.handle('open-logs-dir', async () => {
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    await shell.openPath(logsDir);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

// Open in Photoshop
ipcMain.handle('open-in-photoshop', async (_event, filePath, widthCm, dpi, addMargin) => {
  try {
    await photoshopAutomation.openInPhotoshop(filePath, widthCm, dpi, addMargin);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

// Upscale handlers
ipcMain.handle('upscale-image', async (_event, inputPath: string, outputPath: string, model: string, scale?: number) => {
  try {
    const result = await upscaylHandler.upscale({ inputPath, outputPath, model, scale });
    return result;
  } catch (error) {
    logger.error('Erro ao fazer upscale', error as Error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

ipcMain.handle('list-upscale-models', async () => {
  try {
    const models = await upscaylHandler.listModels();
    return models;
  } catch (error) {
    logger.error('Erro ao listar modelos de upscale', error as Error);
    return [];
  }
});

ipcMain.handle('check-upscale-availability', async () => {
  try {
    const available = await upscaylHandler.checkAvailability();
    return { available };
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : 'Erro ao verificar upscale' };
  }
});
