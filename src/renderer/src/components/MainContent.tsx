import React, { useState, useMemo, useCallback, useRef } from 'react';
import './MainContent.css';
import ProgressBar from './ProgressBar';
import DebugConsole from './DebugConsole';
import FileThumbnail from './FileThumbnail';

interface MainContentProps {
  selectedFiles: string[];
  onFileSelect: () => void;
  onFilesDropped?: (files: File[]) => void;
  onRemoveFile?: (file: string) => void;
  validationResults: any[];
  processing: boolean;
  onGetErrorExplanation?: (errorInfo: any) => Promise<string>;
  geminiApiKey?: string;
  processedFiles?: Set<string>;
  processingProgress?: {
    current: number;
    total: number;
    currentFile?: string;
    status?: 'processing' | 'saving' | 'complete';
  } | null;
  onCancel?: () => void;
  onPreviewFile?: (path: string, name: string) => void;
}

const FileCard = React.memo(({
  file,
  validation,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onPreviewFile,
  onRemoveFile,
  isProcessed
}: {
  file: string;
  validation: any;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onPreviewFile?: (path: string, name: string) => void;
  onRemoveFile?: (file: string) => void;
  isProcessed: boolean;
}) => {
  const fileName = file.split('\\').pop() || file.split('/').pop() || file;
  const isValidated = validation !== undefined;
  const isValid = validation?.valid === true;
  const isInvalid = validation?.valid === false;

  return (
    <div
      className={`file-card ${isInvalid ? 'file-card-error' : isValid ? 'file-card-valid' : ''} ${isProcessed ? 'file-card-processed' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onPreviewFile?.(file, fileName)}
      role="article"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <button
        className="file-remove-button"
        onClick={(e) => { e.stopPropagation(); onRemoveFile?.(file); }}
        title="Remover arquivo"
      >
        ×
      </button>
      <div className="file-preview-container">
        <div className="file-icon">
          {isProcessed ? '✨' : (isValid ? '✅' : isInvalid ? '❌' : '📄')}
        </div>
        <FileThumbnail filePath={file} fileName={fileName} />
      </div>
      <div className="file-name" title={fileName}>{fileName}</div>

      {isProcessed ? (
        <div className="file-status processed">✓ Processado</div>
      ) : isValidated ? (
        <div className={`file-status ${isValid ? 'valid' : 'invalid'}`}>
          {isValid ? '✓ Válido' : '✗ Inválido'}
        </div>
      ) : (
        <div className="file-status-validating">
          <span className="validating-spinner"></span>
          Validando...
        </div>
      )}

      {validation?.info && (
        <div className={`file-info ${isValid ? 'file-info-valid' : isInvalid ? 'file-info-error' : ''}`}>
          <div>{validation.info.dpi?.toFixed(0)} DPI • {validation.info.widthCm?.toFixed(1)}x{validation.info.heightCm?.toFixed(1)} cm</div>
          {validation.info.hasEmptySpace && !isProcessed && (
            <div className="warning-percentage" style={{ fontSize: '9px' }}>
              ⚠️ {validation.info.emptySpacePercentage?.toFixed(0)}% vazio
            </div>
          )}
        </div>
      )}

      {isInvalid && validation?.errors && !isProcessed && (
        <div className="file-errors-list">
          {validation.errors.slice(0, 1).map((err: string, i: number) => (
            <div key={i} className="file-error-item"><span className="error-bullet">•</span>{err}</div>
          ))}
          {validation.errors.length > 1 && <div className="file-error-more">+{validation.errors.length - 1} erro(s)</div>}
        </div>
      )}
    </div>
  );
});

const MainContent: React.FC<MainContentProps> = ({
  selectedFiles,
  onFileSelect,
  onFilesDropped,
  onRemoveFile,
  validationResults,
  processing,
  onGetErrorExplanation,
  geminiApiKey,
  processedFiles = new Set(),
  processingProgress,
  onCancel,
  onPreviewFile,
}) => {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [hoverExplanation, setHoverExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pendingFiles = useMemo(() =>
    selectedFiles.filter(file => !processedFiles.has(file)),
    [selectedFiles, processedFiles]
  );

  const processedFilesList = useMemo(() =>
    selectedFiles.filter(file => processedFiles.has(file)),
    [selectedFiles, processedFiles]
  );

  const validationStats = useMemo(() => ({
    valid: validationResults.filter(r => r.valid).length,
    invalid: validationResults.filter(r => !r.valid).length,
    total: selectedFiles.length
  }), [validationResults, selectedFiles.length]);

  const validationMap = useMemo(() => {
    const map = new Map();
    validationResults.forEach(r => map.set(r.file, r));
    return map;
  }, [validationResults]);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileHover = useCallback(async (file: string, validation: any) => {
    if (!validation || validation.valid) {
      setHoveredFile(null);
      return;
    }

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(async () => {
      setHoveredFile(file);

      if (onGetErrorExplanation && geminiApiKey) {
        setLoadingExplanation(true);
        try {
          const explanation = await onGetErrorExplanation({
            file: validation.file,
            errors: validation.errors || [],
            info: validation.info
          });
          const shortExplanation = explanation.split('\n').slice(0, 5).join('\n');
          setHoverExplanation(shortExplanation);
        } catch (error) {
          setHoverExplanation('Erro ao carregar explicação.');
        } finally {
          setLoadingExplanation(false);
        }
      } else {
        setHoverExplanation(validation.errors?.join('\n') || 'Erro desconhecido');
      }
    }, 300);
  }, [onGetErrorExplanation, geminiApiKey]);

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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['png', 'pdf', 'jpg', 'jpeg', 'tiff', 'tif'].includes(ext || '');
    });

    if (validFiles.length > 0 && onFilesDropped) {
      onFilesDropped(validFiles);
    } else if (validFiles.length > 0) {
      onFileSelect();
    }
  }, [onFilesDropped, onFileSelect]);

  return (
    <div
      className={`main-content ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {selectedFiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-box">
            <h2>Selecionar arquivos</h2>
            <p>Arraste arquivos PNG, PDF ou TIFF aqui.<br />Pressione Ctrl+V para colar.</p>
            <button className="select-button" onClick={onFileSelect}>Selecionar arquivos</button>
            <div className="version-info">Spot White v1.1.0</div>
          </div>
        </div>
      ) : (
        <div className="files-list">
          <div className="files-list-header">
            <div className="files-header-left">
              <h2>Arquivos Selecionados</h2>
              <div className="validation-stats">
                <span className="stat-item stat-valid">✓ {validationStats.valid}</span>
                <span className="stat-item stat-invalid">✗ {validationStats.invalid}</span>
                <span className="stat-item stat-total">📄 {validationStats.total}</span>
              </div>
            </div>
            <button className="add-files-button" onClick={onFileSelect} disabled={processing}>+ Adicionar</button>
          </div>

          <div className="files-grid">
            {pendingFiles.map(file => (
              <FileCard
                key={file}
                file={file}
                validation={validationMap.get(file)}
                isHovered={hoveredFile === file}
                onMouseEnter={() => {
                  const v = validationMap.get(file);
                  if (v && !v.valid) handleFileHover(file, v);
                }}
                onMouseLeave={() => {
                  setHoveredFile(null);
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                }}
                onPreviewFile={onPreviewFile}
                onRemoveFile={onRemoveFile}
                isProcessed={false}
              />
            ))}
          </div>

          {processedFilesList.length > 0 && (
            <div className="files-section">
              <h3 className="files-section-title">✨ Processados ({processedFilesList.length})</h3>
              <div className="files-grid">
                {processedFilesList.map(file => (
                  <FileCard
                    key={`proc-${file}`}
                    file={file}
                    validation={validationMap.get(file)}
                    isHovered={false}
                    onMouseEnter={() => { }}
                    onMouseLeave={() => { }}
                    onPreviewFile={onPreviewFile}
                    onRemoveFile={onRemoveFile}
                    isProcessed={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hoveredFile && validationMap.get(hoveredFile) && (
        <div className="file-error-tooltip">
          <div className="tooltip-header">🤖 Análise da IA</div>
          <div className="tooltip-content">
            {loadingExplanation ? <div className="tooltip-loading">Analisando...</div> : <div className="tooltip-text">{hoverExplanation}</div>}
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}

      {processing && (
        <div className="processing-overlay">
          {processingProgress ? (
            <ProgressBar {...processingProgress} onCancel={onCancel} currentFileName={processingProgress.currentFile} />
          ) : (
            <div className="processing-spinner"></div>
          )}
        </div>
      )}
      <DebugConsole />
    </div>
  );
};

export default MainContent;
