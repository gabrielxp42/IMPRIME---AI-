export { };

declare global {
    interface Window {
        electronAPI: {
            getActiveDocument: () => Promise<{ success: boolean; path?: string; name?: string; error?: string }>;
            processHalftoneDirectDTF: (inputFile: string | null) => Promise<{ success: boolean; error?: string }>;
            processHalftoneDirectDTFLight: (inputFile: string | null) => Promise<{ success: boolean; error?: string }>;
            processSpotWhite: (files: string[], outputDir: string, geminiApiKey: string, clientName?: string, mode?: 'standard' | 'economy') => Promise<any[]>;
            detectPhotoshop: () => Promise<{ found: boolean; path?: string; version?: string }>;
            selectFiles: () => Promise<string[]>;
            validateFiles: (files: string[], config: any) => Promise<any[]>;
            selectOutputDirectory: () => Promise<string | null>;
            checkActionExists: () => Promise<boolean>;
            openFolder: (folderPath: string) => Promise<void>;
            explainValidationError: (errorInfo: any, geminiApiKey: string) => Promise<string>;
            minimizeWindow?: () => Promise<void>;
            maximizeWindow?: () => Promise<void>;
            closeWindow?: () => Promise<void>;
            // Upscaling APIs
            checkUpscaleAvailability: () => Promise<{ available: boolean; error?: string }>;
            listUpscaleModels: () => Promise<string[]>;
            upscaleImage: (inputPath: string, outputPath: string, model: string, scale?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
            removeBackground: (inputPath: string, outputPath: string, removeInternalBlacks?: boolean, blackThreshold?: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
            removeBackgroundManual: (inputPath: string, outputPath: string, selection: any) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
            removeBackgroundBase64: (base64Data: string, highPrecision?: boolean) => Promise<{ success: boolean; resultBase64?: string; error?: string }>;
            openInPhotoshop: (filePath: string, widthCm?: number, dpi?: number, addMargin?: boolean) => Promise<{ success: boolean; error?: string }>;
            readFileAsDataUrl: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
        };
    }
}
