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
  // Novas funções de halftone e utilitários
  processHalftoneIndexColor: (inputFile: string, outputFile: string, lpi: number, mode?: 'auto' | 'manual') =>
    ipcRenderer.invoke('process-halftone-indexcolor', inputFile, outputFile, lpi, mode),
  processHalftoneHybrid: (inputFile: string, outputFile: string, lpi: number, mode?: 'auto' | 'manual') =>
    ipcRenderer.invoke('process-halftone-hybrid', inputFile, outputFile, lpi, mode),
  processHalftoneDirectDTF: (inputFile: string | null) =>
    ipcRenderer.invoke('process-halftone-direct-dtf', inputFile),
  processHalftoneDirectDTFLight: (inputFile: string | null) =>
    ipcRenderer.invoke('process-halftone-direct-dtf-light', inputFile),
  prepareBlackBackground: (inputFile: string, outputFile: string) =>
    ipcRenderer.invoke('prepare-black-background', inputFile, outputFile),
  prepareWhiteBackground: (inputFile: string, outputFile: string) =>
    ipcRenderer.invoke('prepare-white-background', inputFile, outputFile),
  removeBlackColor: (inputFile: string, outputFile: string) =>
    ipcRenderer.invoke('remove-black-color', inputFile, outputFile),
  removeWhiteColor: (inputFile: string, outputFile: string) =>
    ipcRenderer.invoke('remove-white-color', inputFile, outputFile),
  installColorProfile: (profilePath: string) =>
    ipcRenderer.invoke('install-color-profile', profilePath),
  installPatterns: (patternPath: string) =>
    ipcRenderer.invoke('install-patterns', patternPath),
  improveImage: (inputFile: string, outputFile: string, version: 1 | 2 | 3) =>
    ipcRenderer.invoke('improve-image', inputFile, outputFile, version),
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
  // Novas funções de halftone e utilitários
  processHalftoneIndexColor: (inputFile: string, outputFile: string, lpi: number, mode?: 'auto' | 'manual') => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  processHalftoneHybrid: (inputFile: string, outputFile: string, lpi: number, mode?: 'auto' | 'manual') => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  prepareBlackBackground: (inputFile: string, outputFile: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  prepareWhiteBackground: (inputFile: string, outputFile: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  removeBlackColor: (inputFile: string, outputFile: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  removeWhiteColor: (inputFile: string, outputFile: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  installColorProfile: (profilePath: string) => Promise<{ success: boolean; message: string }>;
  installPatterns: (patternPath: string) => Promise<{ success: boolean; message: string }>;
  improveImage: (inputFile: string, outputFile: string, version: 1 | 2 | 3) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  getActiveDocument: () => Promise<{ success: boolean; path?: string; name?: string; error?: string }>;
  upscaleImage: (inputPath: string, outputPath: string, model: string, scale?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  listUpscaleModels: () => Promise<string[]>;
  checkUpscaleAvailability: () => Promise<{ available: boolean; error?: string }>;
  processHalftoneDirectDTF: (inputFile: string | null) => Promise<{ success: boolean; error?: string }>;
  processHalftoneDirectDTFLight: (inputFile: string | null) => Promise<{ success: boolean; error?: string }>;
  cancelProcessing: () => Promise<{ success: boolean }>;
  exportLogs: () => Promise<{ success: boolean; path?: string; error?: string }>;
  removeBackground: (inputPath: string, outputPath: string, removeInternalBlacks?: boolean, blackThreshold?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  removeBackgroundManual: (inputPath: string, outputPath: string, selection: any) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  removeBackgroundBase64: (base64Data: string, highPrecision?: boolean) => Promise<{ success: boolean; resultBase64?: string; error?: string }>;
  openLogsDir: () => Promise<{ success: boolean; error?: string }>;
  openInPhotoshop: (filePath: string) => Promise<void>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

