import React from 'react';
import './SettingsView.css';

interface Config {
  minDPI: number;
  maxDPI: number;
  widthCm: number;
  widthTolerance: number;
  minHeightCm: number;
}

interface SettingsViewProps {
  config: Config;
  onConfigChange: (config: Config) => void;
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
  kieAiApiKey: string;
  onKieAiApiKeyChange: (key: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ config, onConfigChange, geminiApiKey, onGeminiApiKeyChange, kieAiApiKey, onKieAiApiKeyChange }) => {
  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>Configurações</h2>
        <p className="settings-description">Configure os parâmetros de validação e padrões de arquivo</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3>Chave API Google Gemini</h3>
          <div className="settings-grid">
            <div className="setting-item setting-item-full">
              <label>
                <span className="setting-label">Chave API Google Gemini</span>
                <span className="setting-description">Obrigatória para processar arquivos e usar o assistente virtual</span>
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => onGeminiApiKeyChange(e.target.value)}
                placeholder="Cole sua chave API aqui"
                className="setting-input"
              />
              <div className="api-key-status-display">
                <span className={`api-key-status ${geminiApiKey.trim() ? 'configured' : 'not-configured'}`}>
                  {geminiApiKey.trim() ? '✓ Configurada' : '✗ Não configurada'}
                </span>
                {!geminiApiKey.trim() && (
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="api-key-link"
                  >
                    Obter chave API →
                  </a>
                )}
              </div>
              {!geminiApiKey.trim() && (
                <small className="setting-description" style={{ color: '#fca5a5', marginTop: '8px' }}>
                  ⚠ A chave API é obrigatória para processar arquivos e usar o assistente virtual com IA.
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>IA Criativa (Kie.ai)</h3>
          <div className="settings-grid">
            <div className="setting-item setting-item-full">
              <label>
                <span className="setting-label">Chave API Kie.ai</span>
                <span className="setting-description">Necessária para vetorizar, gerar e estilizar imagens com IA</span>
              </label>
              <input
                type="password"
                value={kieAiApiKey}
                onChange={(e) => onKieAiApiKeyChange(e.target.value)}
                placeholder="Cole sua chave API Kie.ai aqui"
                className="setting-input"
              />
              <div className="api-key-status-display">
                <span className={`api-key-status ${kieAiApiKey.trim() ? 'configured' : 'not-configured'}`}>
                  {kieAiApiKey.trim() ? '✓ Configurada' : '✗ Não configurada'}
                </span>
                {!kieAiApiKey.trim() && (
                  <span className="setting-description" style={{ color: '#fca5a5', marginLeft: '10px' }}>
                    ⚠ Disponível no portal Kie.ai (Nano Banana)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Configurações de Validação</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <span className="setting-label">DPI Mínimo</span>
                <span className="setting-description">Valor mínimo de DPI aceito</span>
              </label>
              <input
                type="number"
                value={config.minDPI}
                onChange={(e) => onConfigChange({ ...config, minDPI: parseInt(e.target.value) || 200 })}
                className="setting-input"
                min="72"
                max="600"
              />
            </div>

            <div className="setting-item">
              <label>
                <span className="setting-label">DPI Máximo</span>
                <span className="setting-description">Valor máximo de DPI aceito</span>
              </label>
              <input
                type="number"
                value={config.maxDPI}
                onChange={(e) => onConfigChange({ ...config, maxDPI: parseInt(e.target.value) || 300 })}
                className="setting-input"
                min="200"
                max="1200"
              />
            </div>

            <div className="setting-item">
              <label>
                <span className="setting-label">Largura Máxima (cm)</span>
                <span className="setting-description">Largura máxima permitida (TETO) - não pode ser ultrapassada</span>
              </label>
              <input
                type="number"
                value={config.widthCm}
                onChange={(e) => onConfigChange({ ...config, widthCm: parseFloat(e.target.value) || 58 })}
                className="setting-input"
                min="10"
                max="200"
                step="0.1"
              />
            </div>

            <div className="setting-item setting-item-full">
              <label>
                <span className="setting-label">Tolerância de Largura</span>
                <span className="setting-description">
                  Tolerância permitida para BAIXO: {config.widthTolerance.toFixed(1)}cm
                  <br />
                  <small style={{ color: '#a0a0a0', fontSize: '11px' }}>
                    A largura máxima ({config.widthCm.toFixed(1)}cm) é o TETO e não pode ser ultrapassada.
                    <br />
                    Arquivos serão aceitos se a largura estiver entre <strong>{(config.widthCm - config.widthTolerance).toFixed(1)}cm</strong> e <strong>{config.widthCm.toFixed(1)}cm</strong> (máximo)
                  </small>
                </span>
              </label>
              <div className="tolerance-slider-container">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={config.widthTolerance}
                  onChange={(e) => onConfigChange({ ...config, widthTolerance: parseFloat(e.target.value) })}
                  className="tolerance-slider"
                />
                <div className="slider-labels">
                  <span>0.5cm</span>
                  <span>2.5cm</span>
                  <span>5.0cm</span>
                </div>
                <div className="slider-value-display">
                  <span className="slider-value">{config.widthTolerance.toFixed(1)}cm</span>
                </div>
              </div>
            </div>

            <div className="setting-item">
              <label>
                <span className="setting-label">Altura Mínima (cm)</span>
                <span className="setting-description">Altura mínima aceita em centímetros</span>
              </label>
              <input
                type="number"
                value={config.minHeightCm}
                onChange={(e) => onConfigChange({ ...config, minHeightCm: parseFloat(e.target.value) || 50 })}
                className="setting-input"
                min="10"
                max="500"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Padrões de Arquivo</h3>
          <div className="settings-info">
            <p>Os arquivos processados seguirão o formato:</p>
            <div className="format-example">
              <code>(MEDIDA) - (NOME_CLIENTE) - (NOME_ARQUIVO).tiff</code>
            </div>
            <p className="format-note">
              A medida é calculada automaticamente baseada na altura do arquivo (1M, 2M, etc.)
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h3>Logs e Suporte</h3>
          <div className="settings-info">
            <p>Exporte logs para troubleshooting ou compartilhe com o suporte técnico.</p>
            <div className="logs-actions">
              <button
                className="btn-logs"
                onClick={async () => {
                  try {
                    const result = await window.electronAPI.exportLogs();
                    if (result.success && result.path) {
                      alert(`Logs exportados com sucesso!\n\nArquivo: ${result.path}`);
                    } else {
                      alert(`Erro ao exportar logs: ${result.error || 'Erro desconhecido'}`);
                    }
                  } catch (error) {
                    alert(`Erro ao exportar logs: ${error}`);
                  }
                }}
              >
                📥 Exportar Logs
              </button>
              <button
                className="btn-logs btn-logs-secondary"
                onClick={async () => {
                  try {
                    await window.electronAPI.openLogsDir();
                  } catch (error) {
                    alert(`Erro ao abrir diretório: ${error}`);
                  }
                }}
              >
                📂 Abrir Pasta de Logs
              </button>
            </div>
            <p className="format-note">
              Os logs ajudam a identificar e resolver problemas. Logs antigos são automaticamente removidos após 7 dias.
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h3>Informações</h3>
          <div className="info-box">
            <p><strong>Versão:</strong> 1.0.0</p>
            <p><strong>Automação:</strong> Photoshop Spot White</p>
            <p><strong>Formato de saída:</strong> TIFF com transparência</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

