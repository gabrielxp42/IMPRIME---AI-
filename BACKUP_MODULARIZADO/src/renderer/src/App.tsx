import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import SettingsView from './components/SettingsView';
import ToolsView from './components/ToolsView';
import UpscaylView from './components/UpscaylView';
import EditorView from './components/EditorView';
import Modal from './components/Modal';
import Assistant from './components/Assistant';
import ErrorPopup from './components/ErrorPopup';
import OnboardingTutorial from './components/OnboardingTutorial';
import TitleBar from './components/TitleBar';
import DebugConsole from './components/DebugConsole';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

interface Config {
  minDPI: number;
  maxDPI: number;
  widthCm: number;
  widthTolerance: number; // Tolerância de largura em cm
  minHeightCm: number;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [photoshopDetected, setPhotoshopDetected] = useState(false);
  const [photoshopPath, setPhotoshopPath] = useState<string>('');
  const [config, setConfig] = useState<Config>(() => {
    // Carregar configurações salvas do localStorage
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        return {
          minDPI: parsed.minDPI || 200,
          maxDPI: parsed.maxDPI || 300,
          widthCm: parsed.widthCm || 58,
          widthTolerance: parsed.widthTolerance || 2.5,
          minHeightCm: parsed.minHeightCm || 50,
        };
      } catch {
        // Se houver erro ao parsear, usar padrão
      }
    }
    return {
      minDPI: 200,
      maxDPI: 300,
      widthCm: 58,
      widthTolerance: 2.5,
      minHeightCm: 50,
    };
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [spotWhiteMode, setSpotWhiteMode] = useState<'standard' | 'economy'>('standard');
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
    currentFile?: string;
    status?: 'processing' | 'saving' | 'complete';
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentView, setCurrentView] = useState<'spotwhite' | 'settings' | 'tools' | 'upscayl' | 'editor'>('spotwhite');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [currentError, setCurrentError] = useState<any | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; onConfirm?: () => void; outputDir?: string | null }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    outputDir: null
  });

  useEffect(() => {
    // Carregar chave API salva do localStorage
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
    }

    // Carregar nome do cliente salvo
    const savedClientName = localStorage.getItem('clientName');
    if (savedClientName) {
      setClientName(savedClientName);
    }

    // Carregar modo de spot white salvo
    const savedMode = localStorage.getItem('spotWhiteMode');
    if (savedMode === 'economy' || savedMode === 'standard') {
      setSpotWhiteMode(savedMode);
    }

    // Verificar se é o primeiro acesso
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && !savedApiKey) {
      setShowOnboarding(true);
    }

    // Detectar Photoshop ao iniciar
    detectPhotoshop();
  }, []);

  // Salvar chave API sempre que mudar
  useEffect(() => {
    if (geminiApiKey) {
      localStorage.setItem('geminiApiKey', geminiApiKey);
    } else {
      localStorage.removeItem('geminiApiKey');
    }
  }, [geminiApiKey]);

  // Salvar nome do cliente sempre que mudar
  useEffect(() => {
    if (clientName) {
      localStorage.setItem('clientName', clientName);
    } else {
      localStorage.removeItem('clientName');
    }
  }, [clientName]);

  // Salvar modo de spot white sempre que mudar
  useEffect(() => {
    localStorage.setItem('spotWhiteMode', spotWhiteMode);
  }, [spotWhiteMode]);

  // Salvar configurações sempre que mudarem
  useEffect(() => {
    localStorage.setItem('appConfig', JSON.stringify(config));
  }, [config]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O ou Cmd+O - Abrir arquivos
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        if (!processing) {
          handleFileSelect();
        }
      }

      // Ctrl+P ou Cmd+P - Processar (se estiver na view spotwhite e tiver arquivos)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (currentView === 'spotwhite' && selectedFiles.length > 0 && !processing && outputDir) {
          handleProcess();
        }
      }

      // Esc - Fechar modais/popups
      if (e.key === 'Escape') {
        if (modal.isOpen) {
          setModal({ ...modal, isOpen: false });
        }
        if (assistantOpen) {
          setAssistantOpen(false);
        }
        if (currentError) {
          setCurrentError(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [processing, currentView, selectedFiles, outputDir, modal, assistantOpen, currentError]);

  const detectPhotoshop = async () => {
    try {
      const result = await window.electronAPI.detectPhotoshop();
      setPhotoshopDetected(result.found);
      if (result.path) {
        setPhotoshopPath(result.path);
      }
    } catch (error) {
      console.error('Erro ao detectar Photoshop:', error);
    }
  };

  const handleFileSelect = async () => {
    try {
      const newFiles = await window.electronAPI.selectFiles();
      if (newFiles.length > 0) {
        // Adicionar novos arquivos aos existentes (sem duplicatas)
        const updatedFiles = [...selectedFiles];
        newFiles.forEach(file => {
          if (!updatedFiles.includes(file)) {
            updatedFiles.push(file);
          }
        });

        // Atualizar arquivos selecionados
        setSelectedFiles(updatedFiles);
        setCurrentStep(2);

        // Validar TODOS os arquivos imediatamente usando os arquivos atualizados
        // Passar os arquivos diretamente para evitar problema de estado assíncrono
        await handleValidateAuto(updatedFiles);
      }
    } catch (error) {
      console.error('Erro ao selecionar arquivos:', error);
    }
  };

  const handleRemoveFile = (fileToRemove: string) => {
    setSelectedFiles(selectedFiles.filter(file => file !== fileToRemove));
    setValidationResults(validationResults.filter(result => result.file !== fileToRemove));
    setProcessedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileToRemove);
      return newSet;
    });
    if (selectedFiles.length === 1) {
      setCurrentStep(1);
    }
  };

  // Ref para armazenar o timeout do debounce
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleValidateAuto = useCallback(async (filesToValidate?: string[]) => {
    // Cancelar validação anterior se houver
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Usar arquivos passados como parâmetro ou os arquivos selecionados
    const files = filesToValidate || selectedFiles;

    // SEMPRE validar TODOS os arquivos para garantir consistência
    // Isso previne o bug onde erros desaparecem ao adicionar novos arquivos
    if (files.length === 0) {
      return;
    }

    // Debounce: aguardar 500ms antes de validar (evita validações desnecessárias)
    validationTimeoutRef.current = setTimeout(async () => {
      // Marcar como validando
      setValidating(true);

      try {
        // Validar todos os arquivos fornecidos
        const allResults = await window.electronAPI.validateFiles(files, config);
        // Atualizar resultados imediatamente
        setValidationResults(allResults);

        const allValid = allResults.every((r) => r.valid);
        const validCount = allResults.filter((r) => r.valid).length;
        const invalidCount = allResults.length - validCount;

        if (allValid) {
          setCurrentStep(3);
        } else {
          // Não mostrar modal automático - deixar os cards mostrarem os erros visualmente
          // Os cards vermelhos já deixam claro quais arquivos estão inválidos
          const firstError = allResults.find((r) => !r.valid);
          if (firstError) {
            setCurrentError({
              file: firstError.file,
              errors: firstError.errors || [],
              info: firstError.info
            });
          }
        }
      } catch (error) {
        console.error('Erro ao validar arquivos:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao validar arquivos.';
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Erro na Validação',
          message: errorMessage
        });
        // Limpar resultados em caso de erro para não mostrar estado inconsistente
        setValidationResults([]);
      } finally {
        // Sempre desmarcar como validando, mesmo em caso de erro
        setValidating(false);
      }
    }, 500);
  }, [selectedFiles, config]);

  const getErrorExplanation = async (errorInfo: any): Promise<string> => {
    try {
      return await window.electronAPI.explainValidationError(errorInfo, geminiApiKey.trim());
    } catch (error) {
      console.error('Erro ao obter explicação:', error);
      return 'Não foi possível gerar explicação detalhada. Verifique os erros listados.';
    }
  };

  const handleValidate = async () => {
    await handleValidateAuto();
  };

  const handleOutputDirSelect = async () => {
    try {
      const dir = await window.electronAPI.selectOutputDirectory();
      if (dir) {
        setOutputDir(dir);
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Erro ao selecionar diretório:', error);
    }
  };

  const handleProcess = async () => {
    // Validações obrigatórias
    if (selectedFiles.length === 0) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Atenção',
        message: 'Por favor, selecione pelo menos um arquivo para processar.'
      });
      return;
    }

    if (!geminiApiKey || geminiApiKey.trim() === '') {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Configuração Necessária',
        message: 'Por favor, configure a chave API do Google Gemini antes de processar.'
      });
      return;
    }

    if (!outputDir) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Configuração Necessária',
        message: 'Por favor, selecione a pasta de saída antes de processar.'
      });
      return;
    }

    // BLOQUEAR processamento se houver arquivos inválidos
    // Revalidar todos os arquivos antes de processar para garantir que não há erros
    const allResults = await window.electronAPI.validateFiles(selectedFiles, config);
    setValidationResults(allResults);

    const invalidFiles = allResults.filter((r) => !r.valid);
    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map((r) => {
        const fileName = r.file.split('\\').pop() || r.file.split('/').pop() || r.file;
        const errors = r.errors?.join(', ') || 'Erro desconhecido';
        return `${fileName} (${errors})`;
      }).join('\n');

      setModal({
        isOpen: true,
        type: 'error',
        title: 'Arquivos Inválidos Detectados',
        message: `Não é possível processar arquivos inválidos!\n\n${invalidFiles.length} arquivo(s) com erro(s):\n\n${invalidNames}\n\nPor favor, corrija os erros antes de processar.`
      });
      return;
    }

    await processFiles();
  };

  const handleCancel = async () => {
    try {
      await window.electronAPI.cancelProcessing();
    } catch (error) {
      console.error("Erro ao cancelar:", error);
    }
  };

  const processFiles = async () => {
    setProcessing(true);
    setProcessingProgress({
      current: 0,
      total: selectedFiles.length,
      status: 'processing'
    });

    try {
      const results = [];
      const totalFiles = selectedFiles.length;

      // Processar arquivos um por um para mostrar progresso
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = file.split('\\').pop() || file.split('/').pop() || file;

        // Atualizar progresso
        setProcessingProgress({
          current: i,
          total: totalFiles,
          currentFile: fileName,
          status: 'processing'
        });

        try {
          // Processar arquivo individual
          const fileResults = await window.electronAPI.processSpotWhite(
            [file],
            outputDir!,
            geminiApiKey.trim(),
            clientName.trim(),
            spotWhiteMode
          );

          results.push(...fileResults);

          // Atualizar progresso após processar
          setProcessingProgress({
            current: i + 1,
            total: totalFiles,
            currentFile: fileName,
            status: 'saving'
          });

          // Pequeno delay para mostrar o status de salvamento
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          // Adicionar erro ao resultado
          results.push({
            file,
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      // Marcar como completo
      setProcessingProgress({
        current: totalFiles,
        total: totalFiles,
        status: 'complete'
      });

      // Aguardar um pouco antes de fechar
      await new Promise(resolve => setTimeout(resolve, 500));

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.length - successCount;

      // Marcar arquivos processados com sucesso
      const successfulFiles = results
        .filter((r) => r.success)
        .map((r) => r.file);

      setProcessedFiles(prev => {
        const newSet = new Set(prev);
        successfulFiles.forEach(file => newSet.add(file));
        return newSet;
      });

      if (failedCount === 0) {
        const finalOutputDir = outputDir;
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Processamento Concluído!',
          message: `✓ ${successCount} arquivo(s) processado(s) com sucesso!`,
          outputDir: finalOutputDir
        });

        // Não resetar mais - manter arquivos para permitir adicionar mais
        // setSelectedFiles([]);
        // setValidationResults([]);
        // setOutputDir(null);
        // setCurrentStep(1);
      } else {
        let errorDetails = '';
        results
          .filter((r) => !r.success)
          .forEach((r) => {
            const fileName = r.file.split('\\').pop() || r.file.split('/').pop() || r.file;
            errorDetails += `\n  - ${fileName}: ${r.error || 'Erro desconhecido'}`;
          });

        setModal({
          isOpen: true,
          type: 'error',
          title: 'Processamento Concluído com Erros',
          message: `✓ ${successCount} arquivo(s) processado(s) com sucesso.\n\n✗ ${failedCount} arquivo(s) falharam:${errorDetails}`
        });
      }
    } catch (error) {
      console.error('Erro ao processar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar arquivos.';
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Processar',
        message: errorMessage
      });
    } finally {
      setProcessing(false);
      setProcessingProgress(null);
    }
  };

  useEffect(() => {
    console.log('🚀 App renderizando...', { currentView, selectedFiles: selectedFiles.length });
  }, [currentView, selectedFiles.length]);

  return (
    <ErrorBoundary>
      <div className="app">
        <TitleBar />
        <div className="app-content">
          <Sidebar
            currentStep={currentStep}
            photoshopDetected={photoshopDetected}
            photoshopPath={photoshopPath}
            config={config}
            onConfigChange={(newConfig) => setConfig(newConfig)}
            geminiApiKey={geminiApiKey}
            onGeminiApiKeyChange={(key) => setGeminiApiKey(key)}
            clientName={clientName}
            onClientNameChange={(name) => setClientName(name)}
            spotWhiteMode={spotWhiteMode}
            onSpotWhiteModeChange={(mode) => setSpotWhiteMode(mode)}
            onFileSelect={handleFileSelect}
            onValidate={handleValidate}
            onOutputDirSelect={handleOutputDirSelect}
            onProcess={handleProcess}
            selectedFiles={selectedFiles}
            outputDir={outputDir}
            validationResults={validationResults}
            processing={processing}
            currentView={currentView}
            onViewChange={setCurrentView}
            onOpenAssistant={() => setAssistantOpen(true)}
          />
          {currentView === 'spotwhite' ? (
            <MainContent
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              validationResults={validationResults}
              processing={processing}
              onGetErrorExplanation={getErrorExplanation}
              geminiApiKey={geminiApiKey}
              processedFiles={processedFiles}
              processingProgress={processingProgress}
              onCancel={handleCancel}
            />
          ) : currentView === 'settings' ? (
            <SettingsView
              config={config}
              onConfigChange={setConfig}
              geminiApiKey={geminiApiKey}
              onGeminiApiKeyChange={setGeminiApiKey}
            />
          ) : currentView === 'upscayl' ? (
            <UpscaylView />
          ) : currentView === 'editor' ? (
            <EditorView geminiApiKey={geminiApiKey} />
          ) : (
            <ToolsView />
          )}
        </div>
        <Assistant
          isOpen={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          geminiApiKey={geminiApiKey}
          onGetErrorExplanation={getErrorExplanation}
          validationErrors={useMemo(() => {
            return validationResults
              .filter((r) => !r.valid)
              .map((r) => ({
                file: r.file,
                errors: r.errors || [],
                info: r.info
              }));
          }, [validationResults])}
        />
        {currentError && (
          <ErrorPopup
            error={currentError}
            onClose={() => setCurrentError(null)}
            onGetExplanation={getErrorExplanation}
            onFix={() => {
              setCurrentError(null);
              setAssistantOpen(true);
            }}
          />
        )}
        <Modal
          isOpen={modal.isOpen}
          onClose={() => setModal({ ...modal, isOpen: false })}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          confirmText="Continuar"
          onOpenFolder={modal.outputDir ? async () => {
            try {
              await window.electronAPI.openFolder(modal.outputDir!);
            } catch (error) {
              console.error('Erro ao abrir pasta:', error);
            }
          } : undefined}
          openFolderText="Abrir pasta"
        />
        <OnboardingTutorial
          isOpen={showOnboarding}
          onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('hasSeenOnboarding', 'true');
          }}
          onGoToSettings={() => {
            setCurrentView('settings');
            setShowOnboarding(false);
            localStorage.setItem('hasSeenOnboarding', 'true');
          }}
        />
        <DebugConsole />
      </div>
    </ErrorBoundary>
  );
}

export default App;
