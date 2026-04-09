import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PhotoshopAutomation } from './modules/spotwhite';
import { ImageValidator } from './core/image-validator';
import { GeminiOrchestrator } from './modules/spotwhite';
import { PhotoshopDetector } from './modules/spotwhite';
import { UpscaylHandler } from './modules/upscayl';
import { BackgroundRemovalHandler } from './modules/upscayl';
import { BackgroundRemovalHighPrecisionHandler } from './modules/upscayl';
import { KieAiHandler } from './modules/kie-ai-handler';
import logger from './core/logger';

console.log(`[BOOT] MAIN PROCESS STARTING - ${new Date().toISOString()}`);
console.log('[BOOT] Verificando Handlers...');

// Instâncias globais
const photoshopAutomation = new PhotoshopAutomation();
const upscaylHandler = new UpscaylHandler();
const backgroundRemovalHandler = new BackgroundRemovalHandler();
const backgroundRemovalHighPrecisionHandler = new BackgroundRemovalHighPrecisionHandler();
const validator = new ImageValidator();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: `Imprime.AI - Build ${new Date().toLocaleTimeString()} (Verifique se é atual)`,
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
    // Tentar conectar de forma agressiva e logar o resultado
    const loadDev = async () => {
      try {
        console.log('[BOOT] Tentando 5173 (Padrão)...');
        await mainWindow!.loadURL('http://localhost:5173');
        console.log('[BOOT] SUCESSO na 5173. Se o código estiver velho, é um ZOMBIE SERVER.');
      } catch (e) {
        console.warn('[BOOT] 5173 falhou. Tentando 5174 (Vite Fallback)...');
        try {
          await mainWindow!.loadURL('http://localhost:5174');
          console.log('[BOOT] SUCESSO na 5174. Código deve ser fresco.');
        } catch (err) {
          console.error('[BOOT] Falha crítica ao conectar no Vite.');
        }
      }
    };
    loadDev();
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

  // Notify renderer when window maximize state changes
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximize-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximize-change', false);
  });

  // INTERCEPTAR QUALQUER TENTATIVA DE ABRIR JANELAS (window.open)
  // Isso evita que o Electron abra janelas padrão com aquela barra amarela
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('stripe.com') || url.includes('buy.stripe.com')) {
      // Usar nosso handler customizado de checkout
      ipcMain.emit('open-external-custom', null, url);
      return { action: 'deny' };
    }
    // Para outros links, abrir no navegador padrão
    shell.openExternal(url);
    return { action: 'deny' };
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

ipcMain.handle('open-external', async (_event, url) => {
  // Se for um link do Stripe, abrir em uma janela controlada para melhor UX
  if (url.includes('stripe.com') || url.includes('buy.stripe.com')) {
    const checkoutWin = new BrowserWindow({
      width: 650,
      height: 850,
      title: 'Finalizar Pagamento - Imprime AI',
      backgroundColor: '#1a1a2e',
      frame: false, // Remove a barra amarela
      parent: mainWindow || undefined,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    checkoutWin.setMenu(null);
    checkoutWin.loadURL(url);

    checkoutWin.once('ready-to-show', () => {
      checkoutWin.show();
    });

    // Função única para processar o final do pagamento
    const processPaymentEnd = (currentUrl: string) => {
      console.log('[Checkout Detect]:', currentUrl);
      // Checar se voltou para o localhost ou se tem o parâmetro de sucesso
      if (currentUrl.includes('payment=success') || currentUrl.includes('localhost:5173') || currentUrl.includes('localhost:5174') || (currentUrl.includes('localhost') && currentUrl.includes('payment'))) {
        try {
          const urlObj = new URL(currentUrl);
          const plan = urlObj.searchParams.get('plan');
          const refill = urlObj.searchParams.get('refill');

          if (mainWindow) {
            mainWindow.webContents.send('payment-completed', {
              plan: plan ? parseInt(plan) : null,
              refill: refill === 'true' || refill === '50' || !!refill
            });
            mainWindow.focus();
          }

        } catch (e) {
          console.error('[Checkout Error Parsing]:', e);
          if (mainWindow) {
            mainWindow.webContents.send('payment-completed', { success: true });
            mainWindow.focus();
          }
        } finally {
          setTimeout(() => { if (!checkoutWin.isDestroyed()) checkoutWin.close(); }, 100);
        }
      }
    };

    // Vários eventos para garantir que pegamos o redirecionamento sob qualquer condição
    checkoutWin.webContents.on('will-navigate', (e, navUrl) => processPaymentEnd(navUrl));
    checkoutWin.webContents.on('did-start-navigation', (e, navUrl) => processPaymentEnd(navUrl));
    checkoutWin.webContents.on('did-finish-load', () => processPaymentEnd(checkoutWin.webContents.getURL()));

    // Adicionar um cabeçalho customizado para permitir arrastar e fechar (Premium UX)
    checkoutWin.webContents.on('did-finish-load', () => {
      checkoutWin.webContents.insertCSS(`
        .imprime-ui-header {
          -webkit-app-region: drag;
          height: 40px;
          width: 100%;
          position: fixed;
          top: 0;
          left: 0;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 15px;
          z-index: 999999;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-family: sans-serif;
          color: #94a3b8;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .imprime-ui-close {
          -webkit-app-region: no-drag;
          cursor: pointer;
          color: #ef4444;
          padding: 5px 12px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 6px;
          transition: all 0.2s;
        }
        .imprime-ui-close:hover {
          background: #ef4444;
          color: white;
        }
        body { margin-top: 40px !important; }
      `);

      checkoutWin.webContents.executeJavaScript(`
        if (!document.querySelector('.imprime-ui-header')) {
          const header = document.createElement('div');
          header.className = 'imprime-ui-header';
          header.innerHTML = \`
            <span>IMPRIME AI - PAGAMENTO SEGURO</span>
            <div class="imprime-ui-close">FECHAR JANELA</div>
          \`;
          header.querySelector('.imprime-ui-close').onclick = () => window.close();
          document.body.prepend(header);
        }
      `);
    });
  } else {
    await shell.openExternal(url);
  }
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

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() || false;
});


// IPC Handlers
ipcMain.handle('get-system-fonts', async () => {
  try {
    const fontList = require('font-list');
    const fonts = await fontList.getFonts();
    // Remove aspas que algumas vezes vêm no retorno
    return fonts.map((f: string) => f.replace(/"/g, ''));
  } catch (error) {
    console.error('Erro ao listar fontes:', error);
    return [];
  }
});

ipcMain.handle('ping', async () => {
  console.log('[IPC] Ping recebido!');
  return { success: true, timestamp: new Date().toISOString() };
});

// Outros IPC Handlers
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

// IPC Handler: Salvar Data URL em Arquivo
ipcMain.handle('save-data-url-to-file', async (_event, dataUrl: string, targetPath: string) => {
  try {
    const fs = require('fs');
    // Remove cabeçalho do data URL
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(targetPath, buffer);
    return { success: true, path: targetPath };
  } catch (error) {
    console.error('Erro ao salvar arquivo DataURL:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Handler for thumbnails (TIFF/PDF/Large Images support)
ipcMain.handle('get-thumbnail', async (_event, filePath: string) => {
  let actualPath = filePath;
  let page = 1;

  if (filePath.includes('::')) {
    const parts = filePath.split('::');
    actualPath = parts[0];
    page = parseInt(parts[1], 10) || 1;
  }

  // Normalizar caminho para o SO (importante no Windows)
  actualPath = path.resolve(actualPath);

  const ext = path.extname(actualPath).toLowerCase();

  // Se for PDF, tentar usar Sharp para a página específica
  if (ext === '.pdf') {
    try {
      const sharp = require('sharp');
      
      // Tentar primeiro com o caminho direto
      try {
        const buffer = await sharp(actualPath, { 
          page: page - 1,
          density: 72, 
          limitInputPixels: false
        })
          .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
          .toFormat('jpeg', { quality: 80 })
          .toBuffer();

        return { success: true, dataUrl: `data:image/jpeg;base64,${buffer.toString('base64')}` };
      } catch (renderError: any) {
         // Se falhar, tentar carregar o buffer primeiro (resolve alguns problemas de path no Windows)
         console.warn(`[Thumbnail] Sharp direto falhou para ${path.basename(actualPath)}: ${renderError.message}. Tentando via Buffer...`);
         const fileBuffer = fs.readFileSync(actualPath);
         const buffer = await sharp(fileBuffer, { 
           page: page - 1,
           density: 36, // Ainda menor para garantir
           limitInputPixels: false
         })
           .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
           .toFormat('jpeg', { quality: 80 })
           .toBuffer();
           
         return { success: true, dataUrl: `data:image/jpeg;base64,${buffer.toString('base64')}` };
      }
    } catch (e: any) {
      console.warn(`[Thumbnail] Sharp falhou totalmente para PDF (${path.basename(actualPath)}, pg: ${page}): ${e.message}. Tentando NativeImage...`);
      try {
        const { nativeImage } = require('electron');
        // createThumbnailFromPath costuma falhar se o path não for perfeito ou se o arquivo for muito grande
        const thumbnail = await nativeImage.createThumbnailFromPath(actualPath, { width: 320, height: 320 });
        const dataUrl = thumbnail.toDataURL();
        if (dataUrl && dataUrl.length > 100) {
           return { success: true, dataUrl };
        }
        throw new Error("NativeImage retornou thumbnail vazia");
      } catch (nativeError: any) {
        console.error(`[Thumbnail] Falha crítica no PDF ${path.basename(actualPath)}:`, nativeError.message);
        return { success: false, error: `Falha ao gerar miniatura: ${nativeError.message}` };
      }
    }
  }

  // Comportamento normal para outros arquivos
  try {
    const sharp = require('sharp');
    const buffer = await sharp(actualPath, { limitInputPixels: false })
      .resize({ width: 320, height: 320, fit: 'inside' })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    return { success: true, dataUrl };
  } catch (error: any) {
    console.warn(`[Thumbnail] Sharp falhou para ${path.basename(actualPath)}, tentando nativeImage:`, error.message);
    try {
      const { nativeImage } = require('electron');
      const thumbnailSize = { width: 320, height: 320 };
      const thumbnail = await nativeImage.createThumbnailFromPath(actualPath, thumbnailSize);
      return { success: true, dataUrl: thumbnail.toDataURL() };
    } catch (nativeError: any) {
      console.error(`[Thumbnail] Falha total para ${path.basename(actualPath)}:`, nativeError.message);
      return { success: false, error: nativeError.message };
    }
  }
});

// Handler for full preview (TIFF/PDF support)
ipcMain.handle('get-preview-image', async (_event, filePath: string) => {
  let actualPath = filePath;
  let page = 1;

  if (filePath.includes('::')) {
    const parts = filePath.split('::');
    actualPath = parts[0];
    page = parseInt(parts[1], 10) || 1;
  }

  const ext = path.extname(actualPath).toLowerCase();

  // PDF Preview Handling
  if (ext === '.pdf') {
    try {
      const sharp = require('sharp');
      const tempDir = path.join(os.tmpdir(), 'imprime-ai-previews');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update(`${actualPath}_page_${page}_v2`).digest('hex');
      const previewPath = path.join(tempDir, `preview_${hash}.jpg`);

      if (!fs.existsSync(previewPath)) {
        console.log(`[Preview] Gerando miniatura para PDF: ${actualPath} (Pág: ${page})`);
        
        await sharp(actualPath, { 
          page: page - 1, 
          density: 300,
          limitInputPixels: false 
        })
          .resize({ 
            width: 2048, 
            height: 2048, 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .toFormat('jpeg', { quality: 85 })
          .toFile(previewPath);
        
        console.log(`[Preview] Miniatura gerada com sucesso: ${previewPath}`);
      }

      return { success: true, dataUrl: `media:///${previewPath.replace(/\\/g, '/')}` };
    } catch (e: any) {
      console.warn(`[Preview] Sharp falhou para PDF (${actualPath}): ${e.message}. Tentando NativeImage...`);
      try {
        const { nativeImage } = require('electron');
        const thumbnail = await nativeImage.createThumbnailFromPath(actualPath, { width: 1024, height: 1024 });
        return { success: true, dataUrl: thumbnail.toDataURL() };
      } catch (nativeError: any) {
        console.error(`[Preview] Erro fatal no preview de PDF: ${nativeError.message}`);
        return { success: false, error: 'Falha no preview de PDF' };
      }
    }
  }

  // Handling for other formats (TIFF, PSD, etc.)
  try {
    const sharp = require('sharp');
    const tempDir = path.join(os.tmpdir(), 'imprime-ai-previews');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${actualPath}_v2`).digest('hex');
    const previewPath = path.join(tempDir, `preview_${hash}.jpg`);

    if (!fs.existsSync(previewPath)) {
      console.log(`[Preview] Gerando preview para outro formato: ${actualPath}`);
      await sharp(actualPath, { limitInputPixels: false })
        .resize({ width: 3500, height: 3500, fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { quality: 100, chromaSubsampling: '4:4:4' })
        .toFile(previewPath);
    }

    const mediaUrl = `media:///${previewPath.replace(/\\/g, '/')}`;
    return { success: true, dataUrl: mediaUrl };
  } catch (error: any) {
    console.warn(`[Preview] Sharp falhou para ${actualPath}, tentando nativeImage:`, error.message);
    try {
      const { nativeImage } = require('electron');
      const thumbnail = await nativeImage.createThumbnailFromPath(actualPath, { width: 1024, height: 1024 });
      return { success: true, dataUrl: thumbnail.toDataURL() };
    } catch (nativeError: any) {
      console.error(`[Preview] Erro ao gerar preview para ${actualPath}:`, nativeError.message);
      return { success: false, error: nativeError instanceof Error ? nativeError.message : 'Falha no preview' };
    }
  }
});

ipcMain.handle('validate-files', async (_event, files: string[], config: {
  minDPI: number;
  maxDPI: number;
  widthCm: number;
  minHeightCm: number;
}) => {
  // Shared validator instance uses cache for metadata
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        let actualPath = file;
        let page = 1;

        if (file.includes('::')) {
          const parts = file.split('::');
          actualPath = parts[0];
          page = parseInt(parts[1], 10) || 1;
        }

        const validation = await validator.validate(actualPath, config, page);
        return {
          file,
          valid: validation.valid,
          errors: validation.errors,
          info: validation.info,
        };
      } catch (error) {
        return {
          file,
          valid: false,
          errors: [`Erro ao validar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
          info: null,
        };
      }
    })
  );

  return results;
});

ipcMain.handle('process-spot-white', async (_event, filesWithInfo: { file: string, heightCm?: number }[], outputDir: string, geminiApiKey: string, clientName: string, mode: 'standard' | 'economy' = 'standard') => {
  const automation = new PhotoshopAutomation();
  let orchestrator: GeminiOrchestrator | null = null;

  if (geminiApiKey && geminiApiKey.trim() !== '') {
    try {
      orchestrator = new GeminiOrchestrator(geminiApiKey.trim());
    } catch (e) {
      console.warn('[Warning] Falha ao inicializar Gemini orchestrator:', e);
    }
  }

  // Verificar ação uma única vez no início (para ganhar performance)
  console.log('[Info] Verificando ambiente Photoshop...');
  const actionExists = await automation.checkActionExists();
  if (!actionExists) {
    console.warn('[Warning] Ação SPOTWHITE-PHOTOSHOP não detectada. Tentando processar mesmo assim...');
  }

  const results = [];
  const processedRef = new Set<string>();

  for (let i = 0; i < filesWithInfo.length; i++) {
    const item = filesWithInfo[i];
    // Garante que o caminho do arquivo seja enviado corretamente
    const file = typeof item === 'string' ? item : (item as any).file;
    const heightCm = typeof item === 'object' ? (item as any).heightCm : undefined;
    const page = typeof item === 'object' ? (item as any).page : undefined;

    if (!file || typeof file !== 'string') continue;
    
    // Identificador único para evitar processar o mesmo arquivo/página duas vezes no mesmo lote
    const processKey = page ? `${file}::${page}` : file;
    if (processedRef.has(processKey)) continue;
    processedRef.add(processKey);

    try {
      const displayPage = page ? ` (Pág ${page})` : '';
      console.log(`[Info] Processando (${i + 1}/${filesWithInfo.length}): ${path.basename(file)}${displayPage}`);

      if (orchestrator) {
        try {
          await orchestrator.orchestrateProcess(file);
        } catch (e) { }
      }

      const outputPath = await automation.processSpotWhite(file, outputDir, geminiApiKey, clientName, mode, heightCm, page);

      results.push({
        file,
        success: true,
        outputPath,
        error: null,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`[Error] Falha em ${path.basename(file)}:`, errorMsg);
      results.push({
        file,
        success: false,
        outputPath: null,
        error: errorMsg,
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

// Kie.ai IA Criativa Handlers
ipcMain.handle('kie-ai-process', async (_event, options: { prompt: string, imageBase64?: string, additionalImages?: string[], maskBase64?: string, model?: string, apiKey: string }) => {

  try {
    const { apiKey, ...generateOptions } = options;
    const kieHandler = new KieAiHandler(apiKey);
    return await kieHandler.generateImage(generateOptions);
  } catch (error) {
    logger.error('Erro no handler kie-ai-process:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

ipcMain.handle('kie-ai-status', async (_event, taskId: string, apiKey: string) => {
  try {
    const kieHandler = new KieAiHandler(apiKey);
    return await kieHandler.getTaskStatus(taskId);
  } catch (error) {
    logger.error('Erro no handler kie-ai-status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

// ==================== HALFTONE & EFEITOS HANDLERS ====================

// Handler para detectar documento ativo no Photoshop (VIA VBSCRIPT)
ipcMain.handle('get-active-document', async () => {
  console.log('[IPC] Recebido: get-active-document');
  try {
    const result = await photoshopAutomation.getActiveDocument();
    if (result) {
      console.log(`[IPC] Documento detectado: ${result.name}`);
      return { success: true, name: result.name, path: result.path };
    }
    console.warn('[IPC] Nenhum documento detectado no Photoshop');
    return { success: false, error: 'Nenhum documento aberto no Photoshop' };
  } catch (error) {
    console.error('[IPC] Erro em get-active-document:', error);
    logger.error('Erro ao detectar documento ativo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

// Handler para processar Halftone (suporta GENERIC_DARK, GENERIC_LIGHT, RT, HB, NORMAL)
ipcMain.handle('process-halftone', async (_event, options: { lpi: number, type: 'RT' | 'HB' | 'NORMAL' | 'GENERIC_DARK' | 'GENERIC_LIGHT' }) => {
  console.log(`[IPC] Recebido: process-halftone - LPI: ${options.lpi}, Tipo: ${options.type}`);
  try {
    await photoshopAutomation.processHalftone(options.lpi, options.type);
    console.log('[IPC] Halftone finalizado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('[IPC] Erro no processamento de Halftone:', error);
    logger.error('Erro no processamento de Halftone:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

// Handler para remover cor (preto ou branco)
ipcMain.handle('remove-color', async (_event, color: 'black' | 'white') => {
  try {
    await photoshopAutomation.removeColor(color);
    return { success: true };
  } catch (error) {
    logger.error('Erro ao remover cor:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

// Handler para Spot White Extraído
ipcMain.handle('process-spotwhite-extracted', async () => {
  try {
    await photoshopAutomation.processSpotWhiteExtracted();
    return { success: true };
  } catch (error) {
    logger.error('Erro no Spot White Extraído:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

ipcMain.handle('open-folder', async (_event, folderPath: string) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    console.error('Erro ao abrir pasta:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
});

