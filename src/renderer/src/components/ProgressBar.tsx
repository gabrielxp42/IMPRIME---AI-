import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  total: number;
  currentFileName?: string;
  status?: 'processing' | 'saving' | 'complete';
  onCancel?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  currentFileName,
  status = 'processing',
  onCancel
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const fileName = currentFileName ? currentFileName.split('\\').pop()?.split('/').pop() : '';

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Salvando arquivo...';
      case 'complete':
        return 'Concluído!';
      default:
        return 'Processando...';
    }
  };

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3 className="progress-title">Processando Arquivos</h3>
        <div className="progress-stats">
          <span className="progress-current">{current}</span>
          <span className="progress-separator">/</span>
          <span className="progress-total">{total}</span>
        </div>
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar-background">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
          >
            <div className="progress-bar-shine"></div>
          </div>
        </div>
        <div className="progress-percentage">{percentage}%</div>
      </div>

      {fileName && (
        <div className="progress-file-info">
          <span className="progress-file-icon">📄</span>
          <span className="progress-file-name" title={fileName}>
            {fileName}
          </span>
        </div>
      )}

      <div className="progress-status">
        <span className="progress-status-text">{getStatusText()}</span>
      </div>

      {onCancel && status !== 'complete' && (
        <button
          className="progress-cancel-button"
          onClick={onCancel}
        >
          <span>🛑 Cancelar</span>
        </button>
      )}
    </div>
  );
};

export default ProgressBar;
