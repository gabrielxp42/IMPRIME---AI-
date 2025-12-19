import React, { useState, useEffect } from 'react';
import './ErrorPopup.css';

interface ErrorInfo {
  file: string;
  errors: string[];
  info?: {
    dpi?: number;
    widthCm?: number;
    heightCm?: number;
  };
}

interface ErrorPopupProps {
  error: ErrorInfo;
  onClose: () => void;
  onGetExplanation: (error: ErrorInfo) => Promise<string>;
  onFix?: () => void;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ 
  error, 
  onClose, 
  onGetExplanation,
  onFix 
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadExplanation();
  }, [error]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const loadExplanation = async () => {
    setIsLoading(true);
    try {
      const exp = await onGetExplanation(error);
      setExplanation(exp);
    } catch (err) {
      setExplanation('Não foi possível gerar explicação detalhada. Verifique os erros listados abaixo.');
    } finally {
      setIsLoading(false);
    }
  };

  const fileName = error.file.split('\\').pop() || error.file.split('/').pop() || error.file;

  return (
    <div className="error-popup-overlay" onClick={onClose}>
      <div className="error-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="error-popup-header">
          <div className="error-popup-icon">⚠️</div>
          <div>
            <h3>Erro de Validação Detectado</h3>
            <p className="error-popup-file">{fileName}</p>
          </div>
          <button className="error-popup-close" onClick={onClose}>×</button>
        </div>

        <div className="error-popup-body">
          {isLoading ? (
            <div className="error-popup-loading">
              <div className="loading-spinner"></div>
              <p>Analisando erro...</p>
            </div>
          ) : (
            <>
              <div className="error-popup-explanation">
                <div className="explanation-header">
                  <span className="ai-badge">🤖 IA Explicação</span>
                </div>
                <div className="explanation-content">
                  {explanation.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < explanation.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="error-popup-details">
                <button 
                  className="details-toggle"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? '▼' : '▶'} Detalhes Técnicos
                </button>
                
                {showDetails && (
                  <div className="details-content">
                    <div className="error-list">
                      <h4>Erros encontrados:</h4>
                      <ul>
                        {error.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {error.info && (
                      <div className="file-info">
                        <h4>Informações do arquivo:</h4>
                        <div className="info-grid">
                          {error.info.dpi && (
                            <div className="info-item">
                              <span className="info-label">DPI:</span>
                              <span className="info-value">{error.info.dpi.toFixed(0)}</span>
                            </div>
                          )}
                          {error.info.widthCm && (
                            <div className="info-item">
                              <span className="info-label">Largura:</span>
                              <span className="info-value">{error.info.widthCm.toFixed(2)} cm</span>
                            </div>
                          )}
                          {error.info.heightCm && (
                            <div className="info-item">
                              <span className="info-label">Altura:</span>
                              <span className="info-value">{error.info.heightCm.toFixed(2)} cm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="error-popup-footer">
          {onFix && (
            <button className="error-popup-button error-popup-fix" onClick={onFix}>
              🔧 Ver Solução
            </button>
          )}
          <button className="error-popup-button error-popup-close-btn" onClick={onClose}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;

