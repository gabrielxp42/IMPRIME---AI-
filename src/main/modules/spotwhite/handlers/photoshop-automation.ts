import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import logger from '../../../core/logger';

const execAsync = promisify(exec);

export class PhotoshopAutomation {
    private scriptPath: string;
    private pythonCommand: string = 'python';
    private resolvedActionSet: string | null = null;
    private useJSXMethod: boolean = false;
    private static checkedActionsCache: Map<string, string> = new Map();

    constructor() {
        if (app.isPackaged) {
            const resourcesPath = process.resourcesPath || path.dirname(process.execPath);
            this.scriptPath = path.join(resourcesPath, 'photoshop_automation.py');

            if (!fs.existsSync(this.scriptPath)) {
                const execDir = path.dirname(process.execPath);
                this.scriptPath = path.join(execDir, 'photoshop_automation.py');
            }
        } else {
            // Development paths
            const potentialSourcePaths = [
                path.join(process.cwd(), 'src', 'main', 'modules', 'spotwhite', 'scripts', 'photoshop_automation.py'),
                path.join(process.cwd(), 'dist', 'photoshop_automation.py'),
                path.join(__dirname, '..', 'scripts', 'photoshop_automation.py'),
            ];

            this.scriptPath = '';
            for (const p of potentialSourcePaths) {
                if (fs.existsSync(p)) {
                    this.scriptPath = p;
                    break;
                }
            }
        }
    }

    public setUseJSXMethod(useJSX: boolean): void {
        this.useJSXMethod = useJSX;
    }

    private async executeJSXScript(jsxContent: string, inputFile: string, outputFile: string): Promise<string> {
        console.log('[DEBUG] executeJSXScript iniciado');
        // Usar pasta de dados do usuário em vez do diretório TEMP do sistema (Mais seguro contra antivírus)
        const tempDir = path.join(app.getPath('userData'), 'temp_scripts');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const timestamp = Date.now();
        const tempScriptPath = path.join(tempDir, `ps_script_${timestamp}.jsx`).replace(/\\/g, '\\\\');
        const tempVbsPath = path.join(tempDir, `run_ps_${timestamp}.vbs`);

        try {
            // Escrever o conteúdo do JSX (Caminho absoluto corrigido)
            const realJsxPath = tempScriptPath.replace(/\\\\/g, '\\');
            fs.writeFileSync(realJsxPath, jsxContent, 'utf8');
            console.log(`[DEBUG] JSX criado em: ${realJsxPath}`);
            logger.info(`[Photoshop] JSX criado em: ${realJsxPath}`);

            // VBScript aprimorado com detecção de erro e status
            const vbsScript = `
On Error Resume Next
Set psApp = CreateObject("Photoshop.Application")
If Err.Number <> 0 Then
    WScript.Echo "ERROR: Photoshop nao esta aberto ou nao responde (COM Error: " & Err.Description & ")"
    WScript.Quit
End If

' Forçar Photoshop para frente
psApp.Visible = True

' Executar arquivo
psApp.DoJavaScriptFile "${tempScriptPath}"

If Err.Number <> 0 Then
    WScript.Echo "ERROR (JSX): " & Err.Description & " (Code: " & Err.Number & ")"
Else
    WScript.Echo "SUCCESS"
End If
`;
            fs.writeFileSync(tempVbsPath, vbsScript, 'utf8');
            console.log(`[DEBUG] VBS criado em: ${tempVbsPath}`);

            // Executar o VBS com timeout de 2 minutos para scripts pesados
            console.log(`[DEBUG] Iniciando execução via cscript...`);
            const { stdout, stderr } = await execAsync(`cscript //NoLogo "${tempVbsPath}"`, { timeout: 120000 });

            const output = stdout.trim();
            console.log(`[DEBUG] Resultado cscript: ${output}`);
            logger.info(`[Photoshop] Resultado VBS: ${output}`);

            if (output.includes("ERROR")) {
                console.error(`[DEBUG] Erro no VBS: ${output}`);
                throw new Error(output);
            }

            if (!output.includes("SUCCESS")) {
                console.error(`[DEBUG] Output inesperado do VBS: ${output}`);
                throw new Error("Photoshop nao confirmou a execucao (Output: " + output + ")");
            }

            // Cleanup assíncrono
            setTimeout(() => {
                try {
                    if (fs.existsSync(tempVbsPath)) fs.unlinkSync(tempVbsPath);
                    if (fs.existsSync(realJsxPath)) fs.unlinkSync(realJsxPath);
                } catch (e) { }
            }, 10000);

            return outputFile;

        } catch (error) {
            console.error('[DEBUG] Erro crítico em executeJSXScript:', error);
            logger.error('Erro na execucao do script Photoshop:', error);
            throw error;
        }
    }

    // --- SCRIPTS METHODS ---

    private async runExtractedScript(category: string, scriptName: string): Promise<void> {
        console.log(`[DEBUG] runExtractedScript: ${category}/${scriptName}`);
        let scriptsBase: string;

        // Tentar múltiplos caminhos possíveis para os scripts (Resiliência)
        const possibleBases = [
            path.join(process.cwd(), 'src', 'main', 'resources', 'photoshop', 'scripts'),
            path.join(__dirname, '..', '..', '..', 'resources', 'photoshop', 'scripts'),
            path.join(__dirname, 'resources', 'photoshop', 'scripts'),
            path.join(app.getAppPath(), 'src', 'main', 'resources', 'photoshop', 'scripts')
        ];

        if (app.isPackaged) {
            scriptsBase = path.join(process.resourcesPath, 'photoshop', 'scripts');
        } else {
            scriptsBase = '';
            for (const b of possibleBases) {
                if (fs.existsSync(b)) {
                    scriptsBase = b;
                    break;
                }
            }
        }

        if (!scriptsBase) {
            const error = `Pasta de scripts não encontrada! Tentamos: ${possibleBases.join(', ')}`;
            console.error(`[DEBUG] ${error}`);
            logger.error(`[Photoshop] ${error}`);
            throw new Error(error);
        }

        const scriptPath = path.join(scriptsBase, category, scriptName);
        console.log(`[DEBUG] Script Path Final: ${scriptPath}`);
        logger.info(`[Photoshop] Tentando executar: ${scriptPath}`);

        if (!fs.existsSync(scriptPath)) {
            const error = `Script específico não encontrado: ${scriptPath}`;
            console.error(`[DEBUG] ${error}`);
            logger.error(`[Photoshop] ${error}`);
            throw new Error(error);
        }

        let jsxContent = fs.readFileSync(scriptPath, 'utf8');

        // REMOVER LISTA DE POPUPS BLOQUEANTES (STOP DIALOGS)
        jsxContent = jsxContent.replace(/jamEngine\.jsonPlay\(\s*"'Stop'"[\s\S]*?DialogModes\.ALL\s*\);/g, '// Dialg "Stop" removed by automation');
        jsxContent = jsxContent.replace(/jamEngine\.jsonPlay\(\s*"'Stop'"[\s\S]*?DialogModes\.NO\s*\);/g, '// Dialg "Stop" removed by automation');

        // SILENCIAR DIÁLOGOS DE CONFIRMAÇÃO (ex: "Achatar camadas?")
        jsxContent = jsxContent.replace(/DialogModes\.ALL/g, 'DialogModes.NO');

        await this.executeJSXScript(jsxContent, '', '');
    }

    async processHalftone(lpi: number, type: 'RT' | 'HB' | 'NORMAL' | 'GENERIC_DARK' | 'GENERIC_LIGHT' = 'RT'): Promise<void> {
        console.log(`[DEBUG] processHalftone: LPI=${lpi}, Type=${type}`);
        if (type === 'GENERIC_DARK') {
            await this.runExtractedScript('general', 'AUTO_COR_ESCURA_GENRICO.js');
            return;
        }
        if (type === 'GENERIC_LIGHT') {
            await this.runExtractedScript('general', 'AUTO_COR_CLARA_GENRICO.js');
            return;
        }

        // Sistema de Fallback Intelegente para LPI
        const variations = [];
        if (type === 'HB') variations.push(`AUTO_${lpi}_LPI_HB.js`, `AUTO_${lpi}_LPI_RT.js`, `AUTO_${lpi}_LPI.js`);
        else if (type === 'RT') variations.push(`AUTO_${lpi}_LPI_RT.js`, `AUTO_${lpi}_LPI.js`);
        else variations.push(`AUTO_${lpi}_LPI.js`, `AUTO_${lpi}_LPI_RT.js`);

        let executed = false;
        let lastError = '';

        for (const scriptName of variations) {
            try {
                console.log(`[DEBUG] Tentando variação de Halftone: ${scriptName}`);
                await this.runExtractedScript('halftone', scriptName);
                executed = true;
                break;
            } catch (e: any) {
                lastError = e.message;
                if (!e.message.includes('Script específico não encontrado')) {
                    console.error(`[DEBUG] Erro de EXÉCUCÃO no script ${scriptName}:`, e);
                    throw e;
                }
            }
        }

        if (!executed) {
            const error = `Não foi possível encontrar um script para ${lpi} LPI (${type}).`;
            console.error(`[DEBUG] ${error}`);
            throw new Error(error);
        }
    }

    async processSpotWhiteExtracted(): Promise<void> {
        await this.runExtractedScript('general', 'COR_BRANCA.js');
    }

    async removeColor(color: 'black' | 'white'): Promise<void> {
        if (color === 'black') {
            await this.runExtractedScript('color_removal', 'REMOVER_COR_PRETA.js');
        } else {
            await this.runExtractedScript('color_removal', 'REMOVER_COR_BRANCA.js');
        }
    }

    // --- LEGACY STUBS (Mantidos para compatibilidade, mas não usados pela nova UI) ---
    async processHalftoneIndexColor(inputFile: string | null, outputFile: string, lpi: number, mode: 'auto' | 'manual' = 'auto'): Promise<string> {
        await this.processHalftone(lpi, 'NORMAL');
        return outputFile;
    }
    async processHalftoneHybrid(inputFile: string | null, outputFile: string, lpi: number, mode: 'auto' | 'manual' = 'auto'): Promise<string> {
        await this.processHalftone(lpi, 'HB');
        return outputFile;
    }
    async processHalftoneDirectDTF(inputFile: string | null, outputFile: string, lpi: number, mode: 'auto' | 'manual' = 'auto'): Promise<string> {
        await this.processHalftone(lpi, 'NORMAL');
        return outputFile;
    }
    async processHalftoneDirectDTFLight(inputFile: string | null, outputFile: string, lpi: number, mode: 'auto' | 'manual' = 'auto'): Promise<string> {
        await this.processHalftone(lpi, 'RT');
        return outputFile;
    }
    async prepareBlackBackground(inputFile: string, outputFile: string): Promise<string> { return outputFile; }
    async prepareWhiteBackground(inputFile: string, outputFile: string): Promise<string> { return outputFile; }

    async removeBlackColor(inputFile: string, outputFile: string): Promise<string> {
        await this.removeColor('black');
        return outputFile;
    }
    async removeWhiteColor(inputFile: string, outputFile: string): Promise<string> {
        await this.removeColor('white');
        return outputFile;
    }

    async installColorProfile(profilePath: string): Promise<{ success: boolean; message: string }> { return { success: true, message: "OK" }; }
    async installPatterns(patternPath: string): Promise<{ success: boolean; message: string }> { return { success: true, message: "OK" }; }
    async improveImage(inputFile: string, outputFile: string, version: 1 | 2 | 3): Promise<string> { return outputFile; }

    // --- ACTIVE DOCUMENT DETECTION (VBScript Method) ---
    async getActiveDocument(): Promise<{ name: string; path: string; width: number; height: number; measure: string } | null> {
        const tempDir = path.join(app.getPath('userData'), 'temp_scripts');
        if (!fs.existsSync(tempDir)) {
            try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) { }
        }

        const tempVbsPath = path.join(tempDir, `get_doc_${Date.now()}.vbs`);

        const vbsScript = `
On Error Resume Next
Set psApp = CreateObject("Photoshop.Application")
If Err.Number = 0 Then
    If psApp.Documents.Count > 0 Then
        Set doc = psApp.ActiveDocument
        docName = Replace(doc.Name, Chr(92), Chr(92) & Chr(92))
        docName = Replace(docName, Chr(34), Chr(92) & Chr(34))
        
        docPath = ""
        Err.Clear
        docPath = doc.FullName
        If Err.Number <> 0 Then docPath = ""
        
        docPath = Replace(docPath, Chr(92), Chr(92) & Chr(92))
        docPath = Replace(docPath, Chr(34), Chr(92) & Chr(34))

        WScript.Echo "{" & Chr(34) & "name" & Chr(34) & ":" & Chr(34) & docName & Chr(34) & "," & Chr(34) & "path" & Chr(34) & ":" & Chr(34) & docPath & Chr(34) & "}"
    Else
        WScript.Echo "NO_DOCS"
    End If
Else
    WScript.Echo "PS_NOT_READY"
End If
`;
        try {
            fs.writeFileSync(tempVbsPath, vbsScript, 'utf8');

            // Timeout de 5 segundos para não travar a UI
            const { stdout } = await execAsync(`cscript //NoLogo "${tempVbsPath}"`, { timeout: 5000 });

            if (fs.existsSync(tempVbsPath)) {
                try { fs.unlinkSync(tempVbsPath); } catch (e) { }
            }

            const output = stdout.trim();
            if (output.startsWith('{')) {
                const info = JSON.parse(output);
                return {
                    name: info.name,
                    path: info.path,
                    width: info.width || 0,
                    height: info.height || 0,
                    measure: ''
                };
            }
        } catch (e) {
            // Se der timeout ou erro, apenas falha silenciosamente no log
            if (fs.existsSync(tempVbsPath)) {
                try { fs.unlinkSync(tempVbsPath); } catch (e) { }
            }
            console.error('[DEBUG] Erro ao detectar documento:', e);
            logger.error('[Photoshop] Erro ao detectar documento via VBScript:', e);
        }
        return null;
    }

    async checkActionExists(actionName: string = 'SPOTWHITE-PHOTOSHOP', actionSet?: string): Promise<boolean> { return true; }
    async openInPhotoshop(filePath: string, widthCm: number, dpi: number = 300, addMargin: boolean = false): Promise<void> {
        await this.executeJSXScript(`open(new File("${filePath.replace(/\\/g, '/')}"));`, filePath, '');
    }
    async processSpotWhite(inputFile: string, outputDir: string, geminiApiKey?: string, clientName?: string, mode: 'standard' | 'economy' = 'standard'): Promise<string> {
        // Fallback or implementation of original logic if needed, but we focus on extracted scripts now
        return inputFile;
    }
}
