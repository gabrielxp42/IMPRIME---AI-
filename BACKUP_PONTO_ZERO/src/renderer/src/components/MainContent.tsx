import React, { useState, useMemo, useCallback, useRef } from 'react';
import './MainContent.css';
import ProgressBar from './ProgressBar';
import FilePreviewModal from './FilePreviewModal';

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
}

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
}) => {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [hoverExplanation, setHoverExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string } | null>(null);

  // Memoizar listas filtradas para evitar recálculos
  const pendingFiles = useMemo(() =>
    selectedFiles.filter(file => !processedFiles.has(file)),
    [selectedFiles, processedFiles]
  );

  const processedFilesList = useMemo(() =>
    selectedFiles.filter(file => processedFiles.has(file)),
    [selectedFiles, processedFiles]
  );

  // Memoizar estatísticas
  const validationStats = useMemo(() => ({
    valid: validationResults.filter(r => r.valid).length,
    invalid: validationResults.filter(r => !r.valid).length,
    total: selectedFiles.length
  }), [validationResults, selectedFiles.length]);

  // Memoizar mapa de validações para acesso O(1)
  const validationMap = useMemo(() => {
    const map = new Map();
    validationResults.forEach(r => map.set(r.file, r));
    return map;
  }, [validationResults]);

  // Debounce no hover para evitar muitas chamadas
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileHover = useCallback(async (file: string, validation: any) => {
    if (!validation || validation.valid) {
      setHoveredFile(null);
      return;
    }

    // Cancelar hover anterior
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Debounce de 200ms no hover
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
          // Limitar o tamanho da explicação para o tooltip
          const shortExplanation = explanation.split('\n').slice(0, 5).join('\n');
          setHoverExplanation(shortExplanation);
        } catch (error) {
          setHoverExplanation('Carregando explicação...');
        } finally {
          setLoadingExplanation(false);
        }
      } else {
        setHoverExplanation(validation.errors?.join('\n') || 'Erro desconhecido');
      }
    }, 200);
  }, [onGetErrorExplanation, geminiApiKey]);
  const [isDragging, setIsDragging] = useState(false);

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
      return ext === 'png' || ext === 'pdf' || ext === 'jpg' || ext === 'jpeg' || ext === 'tiff' || ext === 'tif';
    });

    if (validFiles.length > 0 && onFilesDropped) {
      onFilesDropped(validFiles);
    } else if (validFiles.length > 0) {
      // Fallback: usar o método padrão de seleção
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
            <p>
              Selecione ou arraste e solte arquivos PNG ou PDF.
              <br />
              Pressione Ctrl+V para colar a imagem da área de transferência.
            </p>
            <button
              className="select-button"
              onClick={onFileSelect}
              title="Selecionar arquivos (Ctrl+O)"
              aria-label="Selecionar arquivos para processamento"
            >
              Selecionar arquivos
            </button>
            <div className="version-info">Spot White v1.0.1</div>
          </div>
        </div>
      ) : (
        <div className="files-list">
          <div className="files-list-header">
            <div className="files-header-left">
              <h2>Arquivos Selecionados</h2>
              {validationResults.length > 0 && (
                <div className="validation-stats">
                  <span className="stat-item stat-valid">
                    ✓ {validationStats.valid} válido(s)
                  </span>
                  <span className="stat-item stat-invalid">
                    ✗ {validationStats.invalid} inválido(s)
                  </span>
                  <span className="stat-item stat-total">
                    📄 {validationStats.total} total
                  </span>
                </div>
              )}
            </div>
            <button
              className="add-files-button"
              onClick={onFileSelect}
              disabled={processing}
              title="Adicionar mais arquivos (Ctrl+O)"
              aria-label="Adicionar mais arquivos"
            >
              + Adicionar mais arquivos
            </button>
          </div>

          {/* Arquivos não processados */}
          {pendingFiles.length > 0 && (
            <div className="files-section">
              <h3 className="files-section-title">
                <span className="section-icon">📋</span>
                Pendentes ({pendingFiles.length})
              </h3>
              <div className="files-grid">
                {pendingFiles.map((file, index) => {
                  const fileName = file.split('\\').pop() || file.split('/').pop() || file;
                  const validation = validationMap.get(file);

                  const isHovered = hoveredFile === file;

                  // Determinar se o arquivo está validado
                  const isValidated = validation !== undefined;
                  const isValid = validation?.valid === true;
                  const isInvalid = validation?.valid === false;

                  return (
                    <div
                      key={`pending-${index}`}
                      className={`file-card ${isInvalid ? 'file-card-error' :
                        isValid ? 'file-card-valid' :
                          ''
                        }`}
                      onMouseEnter={() => isInvalid && handleFileHover(file, validation)}
                      onMouseLeave={() => setHoveredFile(null)}
                      onClick={() => setPreviewFile({ path: file, name: fileName })}
                      role="article"
                      aria-label={`Arquivo ${isValid ? 'válido' : isInvalid ? 'inválido' : 'pendente de validação'}: ${fileName}. Clique para visualizar`}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="file-preview-container">
                        <div className="file-icon">
                          {isValid ? '✅' : isInvalid ? '❌' : '📄'}
                        </div>
                        {(file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.tiff') || file.toLowerCase().endsWith('.tif')) && (
                          <img
                            src={`media:///${file.replace(/\\/g, '/')}`}
                            alt={fileName}
                            className="file-thumbnail"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              // Se falhar ao carregar, esconder a imagem
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="file-name" title={fileName} aria-label={`Arquivo: ${fileName}`}>{fileName}</div>
                      {isValidated && (
                        <div className={`file-status ${isValid ? 'valid' : 'invalid'}`}>
                          {isValid ? '✓ Válido' : '✗ Inválido'}
                        </div>
                      )}
                      {!isValidated && (
                        <div className="file-status-validating">
                          <span className="validating-spinner"></span>
                          Validando...
                        </div>
                      )}
                      {validation?.info?.hasEmptySpace && (
                        <div className="file-empty-space-warning">
                          <span className="warning-icon">⚠️</span>
                          <div className="warning-content">
                            <div className="warning-title">Espaço vazio detectado</div>
                            <div className="warning-details">
                              <div>Altura total: {validation.info.heightCm?.toFixed(2) || 'N/A'} cm</div>
                              <div>Conteúdo real: {validation.info.contentHeightCm?.toFixed(2) || 'N/A'} cm</div>
                              <div className="warning-percentage">
                                {validation.info.emptySpacePercentage?.toFixed(1)}% de espaço vazio
                              </div>
                            </div>
                            <div className="warning-note">
                              O nome do arquivo será baseado na altura total do arquivo.
                            </div>
                          </div>
                        </div>
                      )}
                      {isInvalid && validation?.errors && validation.errors.length > 0 && (
                        <div className="file-errors-list">
                          {validation.errors.slice(0, 2).map((error: string, errIdx: number) => (
                            <div key={errIdx} className="file-error-item">
                              <span className="error-bullet">•</span>
                              {error}
                            </div>
                          ))}
                          {validation.errors.length > 2 && (
                            <div className="file-error-more">
                              +{validation.errors.length - 2} erro(s) - passe o mouse para ver
                            </div>
                          )}
                        </div>
                      )}
                      {validation && validation.info && (
                        <div className={`file-info ${isInvalid ? 'file-info-error' : isValid ? 'file-info-valid' : ''}`}>
                          <div>DPI: {validation.info.dpi?.toFixed(0) || 'N/A'}</div>
                          <div>Largura: {validation.info.widthCm?.toFixed(2) || 'N/A'} cm</div>
                          <div>Altura: {validation.info.heightCm?.toFixed(2) || 'N/A'} cm</div>
                        </div>
                      )}
                      {isHovered && validation && !validation.valid && (
                        <div className="file-error-tooltip">
                          <div className="tooltip-header">
                            <span className="tooltip-icon">🤖</span>
                            <span className="tooltip-title">Análise da IA</span>
                          </div>
                          <div className="tooltip-content">
                            {loadingExplanation ? (
                              <div className="tooltip-loading">
                                <span className="loading-dot"></span>
                                <span className="loading-dot"></span>
                                <span className="loading-dot"></span>
                              </div>
                            ) : (
                              <div className="tooltip-text">
                                {hoverExplanation || validation.errors?.join('\n') || 'Erro desconhecido'}
                              </div>
                            )}
                          </div>
                          <div className="tooltip-arrow"></div>
                        </div>
                      )}
                      {onRemoveFile && (
                        <button
                          className="file-remove-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFile(file);
                          }}
                          aria-label={`Remover arquivo ${fileName}`}
                          title={`Remover ${fileName}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Arquivos processados */}
          {processedFilesList.length > 0 && (
            <div className="files-section">
              <h3 className="files-section-title">
                <span className="section-icon">✅</span>
                Processados ({processedFilesList.length})
              </h3>
              <div className="files-grid">
                {processedFilesList.map((file, index) => {
                  const fileName = file.split('\\').pop() || file.split('/').pop() || file;
                  const validation = validationMap.get(file);

                  return (
                    <div
                      key={`processed-${index}`}
                      className="file-card file-card-processed"
                      onClick={() => setPreviewFile({ path: file, name: fileName })}
                      role="article"
                      aria-label={`Arquivo processado: ${fileName}. Clique para visualizar`}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="file-preview-container">
                        <div className="file-icon">✅</div>
                        {(file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) && (
                          <img
                            src={`media:///${file.replace(/\\/g, '/')}`}
                            alt={fileName}
                            className="file-thumbnail"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="file-name" title={fileName} aria-label={`Arquivo processado: ${fileName}`}>{fileName}</div>
                      <div className="file-status processed">
                        ✓ Processado
                      </div>
                      {validation && validation.info && (
                        <div className="file-info">
                          <div>DPI: {validation.info.dpi?.toFixed(0) || 'N/A'}</div>
                          <div>Largura: {validation.info.widthCm?.toFixed(2) || 'N/A'} cm</div>
                          <div>Altura: {validation.info.heightCm?.toFixed(2) || 'N/A'} cm</div>
                        </div>
                      )}
                      {onRemoveFile && (
                        <button
                          className="file-remove-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFile(file);
                          }}
                          aria-label={`Remover arquivo ${fileName}`}
                          title={`Remover ${fileName}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {processing && (
            <div className="processing-overlay">
              {processingProgress ? (
                <ProgressBar
                  current={processingProgress.current}
                  total={processingProgress.total}
                  currentFileName={processingProgress.currentFile}
                  status={processingProgress.status}
                  onCancel={onCancel}
                />
              ) : (
                <>
                  <div className="processing-spinner"></div>
                  <p>Processando arquivos...</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Preview */}
      {previewFile && (
        <FilePreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          filePath={previewFile.path}
          fileName={previewFile.name}
        />
      )}
    </div>
  );
};

export default MainContent;


