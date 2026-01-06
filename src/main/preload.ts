import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  detectPhotoshop: () => ipcRenderer.invoke('detect-photoshop'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  validateFiles: (files: string[], config: any) => ipcRenderer.invoke('validate-files', files, config),
  processSpotWhite: (files: string[], outputDir: string, geminiApiKey: string, clientName?: string, mode?: 'standard' | 'economy') =>
    ipcRenderer.invoke('process-spot-white', files, outputDir, geminiApiKey, clientName, mode),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  checkActionExists: () => ipcRenderer.invoke('check-action-exists'),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
  explainValidationError: (errorInfo: any, geminiApiKey: string) =>
    ipcRenderer.invoke('explain-validation-error', errorInfo, geminiApiKey),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  // Funções de halftone e utilitários (OTIMIZADAS)
  processHalftone: (options: { lpi: number, type: 'RT' | 'HB' | 'NORMAL' | 'GENERIC_DARK' | 'GENERIC_LIGHT' }) =>
    ipcRenderer.invoke('process-halftone', options),
  removeColor: (color: 'black' | 'white') =>
    ipcRenderer.invoke('remove-color', color),
  processSpotWhiteExtracted: () =>
    ipcRenderer.invoke('process-spotwhite-extracted'),
  getActiveDocument: () =>
    ipcRenderer.invoke('get-active-document'),
  // Funções de upscaling
  upscaleImage: (inputPath: string, outputPath: string, model: string, scale?: number) =>
    ipcRenderer.invoke('upscale-image', inputPath, outputPath, model, scale),
  listUpscaleModels: () =>
    ipcRenderer.invoke('list-upscale-models'),
  checkUpscaleAvailability: () =>
    ipcRenderer.invoke('check-upscale-availability'),
  cancelProcessing: () => ipcRenderer.invoke('cancel-processing'),
  // Funções de log
  exportLogs: () => ipcRenderer.invoke('export-logs'),
  removeBackground: (inputPath: string, outputPath: string, removeInternalBlacks?: boolean, blackThreshold?: number) => ipcRenderer.invoke('remove-background', inputPath, outputPath, removeInternalBlacks, blackThreshold),
  removeBackgroundManual: (inputPath: string, outputPath: string, selection: any) => ipcRenderer.invoke('remove-background-manual', inputPath, outputPath, selection),
  removeBackgroundBase64: (base64Data: string, highPrecision?: boolean) => ipcRenderer.invoke('remove-background-base64', base64Data, highPrecision),
  openLogsDir: () => ipcRenderer.invoke('open-logs-dir'),
  openInPhotoshop: (filePath: string) => ipcRenderer.invoke('open-in-photoshop', filePath),
  // Ler arquivo como data URL (para preview de imagens)
  readFileAsDataUrl: (filePath: string) => ipcRenderer.invoke('read-file-as-data-url', filePath),
  getThumbnail: (filePath: string) => ipcRenderer.invoke('get-thumbnail', filePath),
  getPreviewImage: (filePath: string) => ipcRenderer.invoke('get-preview-image', filePath),
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
  // Kie.ai Handlers
  kieAiProcess: (options: any) => ipcRenderer.invoke('kie-ai-process', options),
  kieAiStatus: (taskId: string, apiKey: string) => ipcRenderer.invoke('kie-ai-status', taskId, apiKey),
  ping: () => ipcRenderer.invoke('ping'),
  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
});

export type ElectronAPI = {
  detectPhotoshop: () => Promise<{ found: boolean; path?: string; version?: string }>;
  selectFiles: () => Promise<string[]>;
  validateFiles: (files: string[], config: any) => Promise<any[]>;
  processSpotWhite: (files: string[], outputDir: string, geminiApiKey: string, clientName?: string, mode?: 'standard' | 'economy') => Promise<any[]>;
  selectOutputDirectory: () => Promise<string | null>;
  checkActionExists: () => Promise<boolean>;
  openFolder: (folderPath: string) => Promise<void>;
  explainValidationError: (errorInfo: any, geminiApiKey: string) => Promise<string>;
  minimizeWindow?: () => Promise<void>;
  maximizeWindow?: () => Promise<void>;
  closeWindow?: () => Promise<void>;
  // Funções de halftone e utilitários (OTIMIZADAS)
  processHalftone: (options: { lpi: number, type: 'RT' | 'HB' | 'NORMAL' | 'GENERIC_DARK' | 'GENERIC_LIGHT' }) => Promise<{ success: boolean; error?: string }>;
  removeColor: (color: 'black' | 'white') => Promise<{ success: boolean; error?: string }>;
  processSpotWhiteExtracted: () => Promise<{ success: boolean; error?: string }>;
  getActiveDocument: () => Promise<{ success: boolean; path?: string; name?: string; error?: string }>;
  upscaleImage: (inputPath: string, outputPath: string, model: string, scale?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  listUpscaleModels: () => Promise<string[]>;
  checkUpscaleAvailability: () => Promise<{ available: boolean; error?: string }>;

  cancelProcessing: () => Promise<{ success: boolean }>;
  exportLogs: () => Promise<{ success: boolean; path?: string; error?: string }>;
  removeBackground: (inputPath: string, outputPath: string, removeInternalBlacks?: boolean, blackThreshold?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  removeBackgroundManual: (inputPath: string, outputPath: string, selection: any) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  removeBackgroundBase64: (base64Data: string, highPrecision?: boolean) => Promise<{ success: boolean; resultBase64?: string; error?: string }>;
  openLogsDir: () => Promise<{ success: boolean; error?: string }>;
  openInPhotoshop: (filePath: string) => Promise<void>;
  readFileAsDataUrl: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  getSystemFonts: () => Promise<string[]>;
  kieAiProcess: (options: { prompt: string, imageBase64?: string, additionalImages?: string[], maskBase64?: string, model?: string, apiKey: string }) => Promise<{ success: boolean; imageBase64?: string; imageUrl?: string; error?: string }>;

  kieAiStatus: (taskId: string, apiKey: string) => Promise<any>;
  getThumbnail: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  getPreviewImage: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

