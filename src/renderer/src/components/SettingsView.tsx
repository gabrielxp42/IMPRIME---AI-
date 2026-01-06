import React from 'react';
import './SettingsView.css';

interface SettingsViewProps {
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
  kieAiApiKey: string;
  onKieAiApiKeyChange: (key: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ geminiApiKey, onGeminiApiKeyChange, kieAiApiKey, onKieAiApiKeyChange }) => {
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

