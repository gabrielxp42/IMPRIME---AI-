import React, { useState } from 'react';
import './Sidebar.css';
import modoEconomiImg from '../assets/MODOECONOMI.png';
import spotWhitePadraoImg from '../assets/SPOTWHITEPADRAO.png';

interface Config {
  minDPI: number;
  maxDPI: number;
  widthCm: number;
  widthTolerance: number;
  minHeightCm: number;
}

interface SidebarProps {
  currentStep: number;
  photoshopDetected: boolean;
  photoshopPath: string;
  config: Config;
  onConfigChange: (config: Config) => void;
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
  clientName: string;
  onClientNameChange: (name: string) => void;
  spotWhiteMode: 'standard' | 'economy';
  onSpotWhiteModeChange: (mode: 'standard' | 'economy') => void;
  onFileSelect: () => void;
  onValidate: () => void;
  onOutputDirSelect: () => void;
  onProcess: () => void;
  selectedFiles: string[];
  outputDir: string | null;
  validationResults: any[];
  processing: boolean;
  currentView: 'spotwhite' | 'settings' | 'tools' | 'upscayl' | 'editor';
  onViewChange: (view: 'spotwhite' | 'settings' | 'tools' | 'upscayl' | 'editor') => void;
  onOpenAssistant: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentStep,
  photoshopDetected,
  photoshopPath,
  config,
  onConfigChange,
  geminiApiKey,
  onGeminiApiKeyChange,
  clientName,
  onClientNameChange,
  spotWhiteMode,
  onSpotWhiteModeChange,
  onFileSelect,
  onValidate,
  onOutputDirSelect,
  onProcess,
  selectedFiles,
  outputDir,
  validationResults,
  processing,
  currentView,
  onViewChange,
  onOpenAssistant,
}) => {
  const [hoveredMode, setHoveredMode] = useState<'standard' | 'economy' | null>(null);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">🎨</div>
        </div>
        <div className="app-title">
          <h1>Spot White</h1>
          <span className="version" style={{ color: 'red', fontWeight: 'bold' }}>1.0.1</span>
        </div>
        <p className="app-description">Automação Photoshop - Spot White</p>
      </div>

      <div className="view-selector">
        <button
          className={`view-button ${currentView === 'spotwhite' ? 'active' : ''}`}
          onClick={() => onViewChange('spotwhite')}
        >
          <span>Spot White</span>
        </button>
        <button
          className={`view-button ${currentView === 'tools' ? 'active' : ''}`}
          onClick={() => onViewChange('tools')}
        >
          <span>🎨 Efeitos</span>
        </button>
        <button
          className={`view-button ${currentView === 'upscayl' ? 'active' : ''}`}
          onClick={() => onViewChange('upscayl')}
        >
          <span>🚀 Upscayl</span>
        </button>
        <button
          className={`view-button ${currentView === 'editor' ? 'active' : ''}`}
          onClick={() => onViewChange('editor')}
        >
          <span>✏️ Editor</span>
        </button>
        <button
          className={`view-button ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <span>Configurações</span>
        </button>
      </div>

      <div className="photoshop-status">
        <div className={`status-indicator ${photoshopDetected ? 'detected' : 'not-detected'}`}>
          {photoshopDetected ? '✓' : '✗'}
        </div>
        <span className="status-text">
          {photoshopDetected ? `Photoshop detectado: ${photoshopPath}` : 'Photoshop não detectado'}
        </span>
      </div>

      {currentView === 'spotwhite' && (
        <>
          <div className="client-name-config">
            <label>
              Nome do Cliente:
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              placeholder="Ex: ADR"
              className="client-name-input"
            />
            <small className="client-name-hint">
              Será usado no nome do arquivo: (MEDIDA) - (CLIENTE) - (NOME_ARQUIVO)
            </small>
          </div>

          <div className="spot-white-mode-config">
            <label>
              Modo de Spot White:
            </label>
            <div className="mode-selector">
              <div
                className="mode-button-wrapper"
                onMouseEnter={() => setHoveredMode('standard')}
                onMouseLeave={() => setHoveredMode(null)}
              >
                <button
                  type="button"
                  className={`mode-button ${spotWhiteMode === 'standard' ? 'active' : ''}`}
                  onClick={() => onSpotWhiteModeChange('standard')}
                  disabled={processing}
                >
                  <span>Padrão (DTF)</span>
                </button>
                {hoveredMode === 'standard' && (
                  <div className="mode-preview">
                    <img src={spotWhitePadraoImg} alt="Preview Modo Padrão - Spot White" />
                    <div className="preview-label">Modo Padrão (DTF)</div>
                  </div>
                )}
              </div>
              <div
                className="mode-button-wrapper"
                onMouseEnter={() => setHoveredMode('economy')}
                onMouseLeave={() => setHoveredMode(null)}
              >
                <button
                  type="button"
                  className={`mode-button ${spotWhiteMode === 'economy' ? 'active' : ''}`}
                  onClick={() => onSpotWhiteModeChange('economy')}
                  disabled={processing}
                >
                  <span>Econômico</span>
                </button>
                {hoveredMode === 'economy' && (
                  <div className="mode-preview">
                    <img src={modoEconomiImg} alt="Preview Modo Econômico - Spot White" />
                    <div className="preview-label">Modo Econômico</div>
                  </div>
                )}
              </div>
            </div>
            <small className="mode-hint">
              {spotWhiteMode === 'standard'
                ? 'Usa a ação do conjunto DTF (padrão)'
                : 'Usa a ação do conjunto Mask Processing Economy (mais rápido)'}
            </small>
          </div>

          <div className="workflow-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-header">
                <span className="step-number">1</span>
                <h3>Selecionar arquivos</h3>
              </div>
              <button
                className="step-button"
                onClick={onFileSelect}
                disabled={processing}
              >
                Selecionar arquivos
              </button>
              {selectedFiles.length > 0 && (
                <div className="file-count">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>

            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-header">
                <span className="step-number">2</span>
                <h3>Validação automática</h3>
              </div>
              {selectedFiles.length > 0 && (
                <>
                  {validationResults.length > 0 ? (
                    <div className="validation-results">
                      {validationResults.map((result, idx) => (
                        <div key={idx} className={`validation-item ${result.valid ? 'valid' : 'invalid'}`}>
                          <span className="validation-icon">{result.valid ? '✓' : '✗'}</span>
                          <span className="validation-file">{result.file.split('\\').pop()}</span>
                          {!result.valid && (
                            <div className="validation-errors">
                              {result.errors.map((error: string, errIdx: number) => (
                                <div key={errIdx} className="error-text">{error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="validation-status">
                      <span className="validation-loading">Validando arquivos...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-header">
                <span className="step-number">3</span>
                <h3>Definir pasta de saída</h3>
              </div>
              <button
                className="step-button"
                onClick={onOutputDirSelect}
                disabled={processing}
              >
                Definir pasta de saída
              </button>
              {outputDir && (
                <div className="output-dir">
                  {outputDir}
                </div>
              )}
            </div>

            <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-header">
                <span className="step-number">4</span>
                <h3>Processar Spot White</h3>
              </div>
              <div className="process-buttons-container">
                <button
                  className="process-button"
                  onClick={onProcess}
                  disabled={processing || !outputDir || selectedFiles.length === 0}
                  title={processing ? 'Processando...' : 'Processar arquivos (Ctrl+P)'}
                >
                  {processing ? 'Processando...' : '🚀 Spot White'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="assistant-button-container">
        <button
          className="assistant-button"
          onClick={onOpenAssistant}
          title="Abrir Assistente Virtual"
        >
          🤖 Assistente
        </button>
      </div>

      <div className="sidebar-footer">
        <p>© 2025 - Spot White Automation</p>
        <p>Automação Photoshop</p>
      </div>
    </div>
  );

  function handleValidate() {
    onValidate();
  }
};

export default Sidebar;


