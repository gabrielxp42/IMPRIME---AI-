
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import SettingsView from './components/SettingsView';
import ToolsView from './components/ToolsView';
import UpscaylView from './components/UpscaylView';
import EditorView from './components/EditorView';
import MockupsView from './components/MockupsView';
import ProfileView from './components/ProfileView';
import LoginView from './components/LoginView';
import SplashScreen from './components/SplashScreen';
import TitleBar from './components/TitleBar';
import SpotWhiteWorkspace from './components/SpotWhiteWorkspace';
import { ToastProvider } from './components/editor/ToastNotification';
import FilePreviewModal from './components/FilePreviewModal';
import './App.css';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'spotwhite' | 'settings' | 'tools' | 'upscayl' | 'editor' | 'mockups' | 'profile'>('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [outputDir, setOutputDir] = useState<string | null>(localStorage.getItem('outputDir') || null);
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('geminiApiKey') || '');
  const [kieAiApiKey, setKieAiApiKey] = useState(localStorage.getItem('kieAiApiKey') || 'c3a158e9c64e1c97469753983a1069c7');
  const [clientName, setClientName] = useState(localStorage.getItem('clientName') || '');
  const [spotWhiteMode, setSpotWhiteMode] = useState<'standard' | 'economy'>((localStorage.getItem('spotWhiteMode') as 'standard' | 'economy') || 'standard');
  const [processing, setProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Inicia colapsada

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('printConfig');
    return saved ? JSON.parse(saved) : {
      minDPI: 300,
      maxDPI: 600,
      widthCm: 55,
      widthTolerance: 0.5,
      minHeightCm: 1,
    };
  });

  // Persistir configurações quando mudarem
  useEffect(() => {
    localStorage.setItem('printConfig', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (outputDir) localStorage.setItem('outputDir', outputDir);
  }, [outputDir]);

  useEffect(() => {
    localStorage.setItem('clientName', clientName);
  }, [clientName]);

  useEffect(() => {
    localStorage.setItem('spotWhiteMode', spotWhiteMode);
  }, [spotWhiteMode]);

  const validateFiles = useCallback(async (files: string[], currentConfig: any) => {
    if (files.length === 0) {
      setValidationResults([]);
      return;
    }

    setIsValidating(true);
    try {
      const results = await window.electronAPI.validateFiles(files, currentConfig);
      setValidationResults(results);
    } catch (error) {
      console.error('Erro na validação:', error);
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      // Debounce validation to avoid massive IPC calls during slider drag
      const timer = setTimeout(() => {
        validateFiles(selectedFiles, config);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setValidationResults([]);
    }
  }, [selectedFiles, config, validateFiles]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global Drag & Drop Handler
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (currentView === 'editor') return;

    // Use path instead of name for Electron compatibility
    const filePaths = Array.from(e.dataTransfer.files)
      .map(f => (f as any).path)
      .filter(p => !!p);

    if (filePaths.length > 0) {
      setSelectedFiles(prevFiles => {
        const combined = [...prevFiles, ...filePaths];
        return Array.from(new Set(combined));
      });

      if (currentView === 'home' || currentView === 'settings') {
        setCurrentView('spotwhite');
      }
    }
  }, [currentView]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) return <div className="app-loading-bg"></div>;

  if (!user) {
    return (
      <ToastProvider>
        <TitleBar />
        <LoginView onLoginSuccess={() => setCurrentView('home')} />
      </ToastProvider>
    );
  }

  const handleFileSelect = async () => {
    const files = await window.electronAPI.selectFiles();
    if (files) setSelectedFiles(files);
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0 || !outputDir) {
      // Fallback se não tiver outputDir: pedir agora
      if (selectedFiles.length > 0 && !outputDir) {
        const dir = await window.electronAPI.selectOutputDirectory();
        if (dir) {
          setOutputDir(dir);
          // Continua na proxima renderizacao ou chama recursivo, mas melhor o usuario clicar de novo para confirmar
        }
      }
      return;
    }

    setProcessing(true);
    try {
      console.log('Iniciando processamento Spot White...');

      // Chamada ao Backend (Electron + Photoshop + Gemini)
      const results = await window.electronAPI.processSpotWhite(
        selectedFiles,
        outputDir,
        geminiApiKey,
        clientName,
        spotWhiteMode
      );

      console.log('Resultados:', results);

      // Atualizar resultados de validação com o sucesso/erro do processamento
      // (Aqui poderíamos ter um estado separado para resultados de processamento)
      setValidationResults(() => {
        // Mesclar resultados
        return results.map((res: any) => ({
          file: res.file,
          valid: res.success,
          errors: res.error ? [res.error] : [],
          info: res.outputPath ? { savedAt: res.outputPath } : null
        }));
      });

      // Marcar arquivos com sucesso como processados
      const successfulFiles = results.filter((r: any) => r.success).map((r: any) => r.file);
      if (successfulFiles.length > 0) {
        setProcessedFiles(prev => {
          const newSet = new Set(prev);
          successfulFiles.forEach((f: any) => newSet.add(f));
          return newSet;
        });
      }

    } catch (error) {
      console.error('Erro fatal no processamento:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToastProvider>
      <div
        className={`app ${isDragging ? 'app-dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <TitleBar />
        <div className="app-content">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            currentStep={1}
            photoshopDetected={true}
            photoshopPath=""
            config={config}
            onConfigChange={setConfig}
            geminiApiKey={geminiApiKey}
            onGeminiApiKeyChange={setGeminiApiKey}
            clientName={clientName}
            onClientNameChange={setClientName}
            spotWhiteMode={spotWhiteMode}
            onSpotWhiteModeChange={setSpotWhiteMode}
            onFileSelect={handleFileSelect}
            onValidate={() => { }}
            onOutputDirSelect={async () => {
              const dir = await window.electronAPI.selectOutputDirectory();
              if (dir) setOutputDir(dir);
            }}
            onProcess={handleProcess}
            selectedFiles={selectedFiles}
            outputDir={outputDir}
            validationResults={validationResults}
            processing={processing}
            currentView={currentView}
            onViewChange={setCurrentView}
            onOpenAssistant={() => { }}
          />

          <div className="main-viewport">
            {currentView === 'home' ? (
              <HomeView onNavigate={(view) => setCurrentView(view)} />
            ) : currentView === 'spotwhite' ? (
              <SpotWhiteWorkspace
                selectedFiles={selectedFiles}
                validationResults={validationResults}
                processing={processing}
                geminiApiKey={geminiApiKey}
                processedFiles={processedFiles}
                clientName={clientName}
                onClientNameChange={setClientName}
                spotWhiteMode={spotWhiteMode}
                onSpotWhiteModeChange={setSpotWhiteMode}
                onFileSelect={handleFileSelect}
                onOutputDirSelect={async () => {
                  const dir = await window.electronAPI.selectOutputDirectory();
                  if (dir) setOutputDir(dir);
                }}
                outputDir={outputDir}
                onProcess={handleProcess}
                config={config}
                onConfigChange={setConfig}
                isValidating={isValidating}
                onPreviewFile={(path: string, name: string) => setPreviewFile({ path, name })}
              />
            ) : currentView === 'editor' ? (
              <EditorView geminiApiKey={geminiApiKey} kieAiApiKey={kieAiApiKey} />
            ) : currentView === 'mockups' ? (
              <MockupsView kieAiApiKey={kieAiApiKey} />
            ) : currentView === 'upscayl' ? (
              <UpscaylView />
            ) : currentView === 'profile' ? (
              <ProfileView onLogout={() => setUser(null)} />
            ) : currentView === 'settings' ? (
              <SettingsView
                geminiApiKey={geminiApiKey}
                onGeminiApiKeyChange={setGeminiApiKey}
                kieAiApiKey={kieAiApiKey}
                onKieAiApiKeyChange={setKieAiApiKey}
              />
            ) : currentView === 'tools' ? (
              <ToolsView />
            ) : (
              <div className="placeholder-view">Em desenvolvimento</div>
            )}
          </div>
        </div>

        {isDragging && (
          <div className="global-drag-overlay">
            <div className="drag-message">
              <span className="drag-icon">📂</span>
              <p>Solte para abrir no IMPRIME AI</p>
            </div>
          </div>
        )}
        {previewFile && (
          <FilePreviewModal
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
            filePath={previewFile.path}
            fileName={previewFile.name}
          />
        )}
      </div>
    </ToastProvider>
  );
};

export default App;
