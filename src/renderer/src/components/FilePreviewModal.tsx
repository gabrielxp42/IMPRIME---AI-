import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import './FilePreviewModal.css';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
}

type Tool = 'hand' | 'zoom';

// Throttle function para otimizar eventos
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, filePath, fileName }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');
  const [activeTool, setActiveTool] = useState<Tool>('hand');
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.1;

  // Cores predefinidas para o fundo - memoizado
  const presetColors = useMemo(() => [
    '#1a1a2e', // Escuro padrão
    '#000000', // Preto
    '#ffffff', // Branco
    '#f5f5f5', // Cinza claro
    '#2d2d2d', // Cinza escuro
    '#667eea', // Roxo
    '#764ba2', // Roxo escuro
  ], []);

  // Verificar se é imagem - memoizado
  const isImage = useMemo(() =>
    filePath.toLowerCase().endsWith('.png') ||
    filePath.toLowerCase().endsWith('.jpg') ||
    filePath.toLowerCase().endsWith('.jpeg') ||
    filePath.toLowerCase().endsWith('.tiff') ||
    filePath.toLowerCase().endsWith('.tif'),
    [filePath]
  );

  // Atualizar refs quando state muda
  useEffect(() => {
    positionRef.current = position;
    zoomRef.current = zoom;
  }, [position, zoom]);

  // Zoom level calculado - memoizado
  const zoomLevel = useMemo(() => Math.round(zoom * 100), [zoom]);

  // Calcular limites de pan baseado na imagem e zoom
  const calculatePanLimits = useCallback((currentZoom: number) => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container || !img.complete) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    const containerRect = container.getBoundingClientRect();

    // Usar dimensões naturais da imagem
    const imgNaturalWidth = img.naturalWidth || img.width;
    const imgNaturalHeight = img.naturalHeight || img.height;

    // Considerar padding do container (24px de cada lado = 48px total)
    const paddingX = 48; // 24px esquerda + 24px direita
    const paddingY = 48; // 24px topo + 24px baixo
    const containerWidth = containerRect.width - paddingX;
    const containerHeight = containerRect.height - paddingY;

    // Dimensões da imagem com zoom aplicado
    const imgScaledWidth = imgNaturalWidth * currentZoom;
    const imgScaledHeight = imgNaturalHeight * currentZoom;

    // Margem mínima de 10px em cada lado
    const margin = 10;

    // Se a imagem é menor que o container, centralizar (limites = 0)
    if (imgScaledWidth <= containerWidth && imgScaledHeight <= containerHeight) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    // Calcular limites permitidos
    // O pan máximo é metade da diferença entre imagem e container + margem
    // Para altura, garantir que não permita scroll além da imagem
    const maxPanX = imgScaledWidth > containerWidth
      ? Math.max(0, (imgScaledWidth - containerWidth) / 2 + margin)
      : 0;
    const maxPanY = imgScaledHeight > containerHeight
      ? Math.max(0, (imgScaledHeight - containerHeight) / 2 + margin)
      : 0;

    return {
      minX: -maxPanX,
      maxX: maxPanX,
      minY: -maxPanY,
      maxY: maxPanY,
    };
  }, []);

  // Aplicar limites ao pan
  const constrainPosition = useCallback((x: number, y: number, currentZoom: number) => {
    const limits = calculatePanLimits(currentZoom);
    return {
      x: Math.max(limits.minX, Math.min(limits.maxX, x)),
      y: Math.max(limits.minY, Math.min(limits.maxY, y)),
    };
  }, [calculatePanLimits]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + ZOOM_STEP, MAX_ZOOM);
      // Ajustar posição para manter limites
      setPosition(currentPos => constrainPosition(currentPos.x, currentPos.y, newZoom));
      return newZoom;
    });
  }, [constrainPosition]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      // Se zoom < 1, centralizar
      if (newZoom < 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        // Ajustar posição para manter limites
        setPosition(currentPos => constrainPosition(currentPos.x, currentPos.y, newZoom));
      }
      return newZoom;
    });
  }, [constrainPosition]);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(prev => {
      // Se zoom < 1, centralizar
      if (newZoom < 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        // Ajustar posição para manter limites
        setPosition(currentPos => constrainPosition(currentPos.x, currentPos.y, newZoom));
      }
      return newZoom;
    });
  }, [constrainPosition]);

  // Zoom apenas com ALT + scroll (estilo Photoshop) - otimizado
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isImage || !e.altKey) return;

    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -ZOOM_STEP * 1.5 : ZOOM_STEP * 1.5;
    const currentZoom = zoomRef.current;
    const currentPos = positionRef.current;

    setZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));

      // Zoom no ponto do mouse - cálculo otimizado
      if (newZoom !== prev) {
        let newX, newY;

        // Se zoom < 1, centralizar
        if (newZoom < 1) {
          newX = 0;
          newY = 0;
        } else {
          const scaleChange = newZoom / prev;
          const containerCenterX = rect.width / 2;
          const containerCenterY = rect.height / 2;
          const relativeX = mouseX - containerCenterX - currentPos.x;
          const relativeY = mouseY - containerCenterY - currentPos.y;
          newX = currentPos.x - (relativeX * (scaleChange - 1));
          newY = currentPos.y - (relativeY * (scaleChange - 1));

          // Aplicar limites
          const constrained = constrainPosition(newX, newY, newZoom);
          newX = constrained.x;
          newY = constrained.y;
        }

        setPosition({ x: newX, y: newY });
      }

      return newZoom;
    });
  }, [isImage, constrainPosition]);

  // Clique com ferramenta de lupa - otimizado
  const handleZoomClick = useCallback((e: React.MouseEvent) => {
    if (!isImage || activeTool !== 'zoom') return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const isZoomIn = !e.shiftKey;
    const delta = isZoomIn ? ZOOM_STEP * 2 : -ZOOM_STEP * 2;
    const currentZoom = zoomRef.current;
    const currentPos = positionRef.current;

    setZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));

      // Zoom no ponto do mouse
      if (newZoom !== prev) {
        let newX, newY;

        // Se zoom < 1, centralizar
        if (newZoom < 1) {
          newX = 0;
          newY = 0;
        } else {
          const scaleChange = newZoom / prev;
          const containerCenterX = rect.width / 2;
          const containerCenterY = rect.height / 2;
          const relativeX = mouseX - containerCenterX - currentPos.x;
          const relativeY = mouseY - containerCenterY - currentPos.y;
          newX = currentPos.x - (relativeX * (scaleChange - 1));
          newY = currentPos.y - (relativeY * (scaleChange - 1));

          // Aplicar limites
          const constrained = constrainPosition(newX, newY, newZoom);
          newX = constrained.x;
          newY = constrained.y;
        }

        setPosition({ x: newX, y: newY });
      }

      return newZoom;
    });
  }, [isImage, activeTool, constrainPosition]);

  // Arrastar com mãozinha ou Space pressionado - otimizado com RAF
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (activeTool === 'hand' || isSpacePressed)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y });
      e.preventDefault();
    } else if (e.button === 0 && activeTool === 'zoom') {
      handleZoomClick(e);
    }
  }, [activeTool, isSpacePressed, handleZoomClick]);

  // Mouse move otimizado com requestAnimationFrame e limites
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && (activeTool === 'hand' || isSpacePressed)) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        const currentZoom = zoomRef.current;

        // Aplicar limites ao pan
        const constrained = constrainPosition(newX, newY, currentZoom);
        setPosition(constrained);
      });
    }
  }, [isDragging, activeTool, isSpacePressed, dragStart, constrainPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setActiveTool('hand');
      setIsSpacePressed(false);
      positionRef.current = { x: 0, y: 0 };
      zoomRef.current = 1;
      return;
    }

    // Quando o modal abrir, garantir que está em 100% e centralizado
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalhos de ferramentas
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('hand');
      } else if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('zoom');
      }

      // Space para pan temporário (estilo Photoshop)
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      // Atalhos de zoom
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleZoomReset]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const isPDF = filePath.toLowerCase().endsWith('.pdf');
  const imageSrc = useMemo(() =>
    isImage ? `media:///${filePath.replace(/\\/g, '/')}` : null,
    [isImage, filePath]
  );

  // Preload da imagem para melhor performance
  useEffect(() => {
    if (!isImage || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    // Preload em background
  }, [isImage, imageSrc]);

  // Quando o arquivo mudar, resetar para 100% zoom
  useEffect(() => {
    if (!isOpen) return;

    // Resetar zoom e posição quando o arquivo mudar
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
  }, [filePath, isOpen]);

  // Quando a imagem carregar, garantir 100% zoom e centralizar
  useEffect(() => {
    if (!isImage || !imageRef.current || !isOpen) return;

    const img = imageRef.current;

    const handleImageLoad = () => {
      // Garantir que está em 100% zoom e centralizado quando a imagem carregar
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      positionRef.current = { x: 0, y: 0 };
      zoomRef.current = 1;
    };

    // Aguardar um pouco para garantir que a imagem foi renderizada
    const timeoutId = setTimeout(() => {
      if (img.complete) {
        // Se já está carregada, aplicar imediatamente
        handleImageLoad();
      } else {
        // Se ainda está carregando, aguardar
        img.addEventListener('load', handleImageLoad);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      img.removeEventListener('load', handleImageLoad);
    };
  }, [isImage, isOpen, filePath]);

  // Determina o cursor baseado na ferramenta ativa - memoizado
  const cursor = useMemo(() => {
    if (isSpacePressed || activeTool === 'hand') {
      return isDragging ? 'grabbing' : 'grab';
    }
    if (activeTool === 'zoom') {
      return 'zoom-in';
    }
    return 'default';
  }, [isSpacePressed, activeTool, isDragging]);

  // Transform string memoizado - usar translate3d para melhor GPU acceleration
  const transformStyle = useMemo(() =>
    `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
    [position.x, position.y, zoom]
  );

  return (
    <div
      className="file-preview-modal-overlay"
      onClick={onClose}
    >
      <div className="file-preview-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="file-preview-modal-header">
          <h3 className="file-preview-modal-title">{fileName}</h3>
          <div className="file-preview-controls">
            {/* Ferramentas - sempre mostrar se for imagem */}
            {isImage && (
              <div className="tool-controls">
                <button
                  className={`tool-button ${activeTool === 'hand' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTool('hand');
                  }}
                  title="Ferramenta Mãozinha (H) - Arrastar imagem"
                  aria-label="Ferramenta Mãozinha"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 11v-1a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v1" />
                    <path d="M14 10v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h8z" />
                    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8v-3a2 2 0 1 1 4 0" />
                  </svg>
                </button>
                <button
                  className={`tool-button ${activeTool === 'zoom' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTool('zoom');
                  }}
                  title="Ferramenta Lupa (Z) - Clique para zoom in, Shift+Clique para zoom out"
                  aria-label="Ferramenta Lupa"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
              </div>
            )}

            {/* Controles de Zoom - sempre mostrar se for imagem */}
            {isImage && (
              <div className="zoom-controls">
                <button
                  className="zoom-button zoom-out"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  disabled={zoom <= MIN_ZOOM}
                  title="Diminuir zoom (Ctrl+-)"
                  aria-label="Diminuir zoom"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>

                <div className="zoom-slider-container">
                  <input
                    type="range"
                    min={MIN_ZOOM * 100}
                    max={MAX_ZOOM * 100}
                    value={zoom * 100}
                    onChange={(e) => {
                      const newZoom = parseFloat(e.target.value) / 100;
                      handleZoomChange(newZoom);
                    }}
                    className="zoom-slider"
                    title="Ajustar zoom"
                  />
                  <span className="zoom-indicator" title="Nível de zoom">
                    {zoomLevel}%
                  </span>
                </div>

                <button
                  className="zoom-button zoom-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  disabled={zoom >= MAX_ZOOM}
                  title="Aumentar zoom (Ctrl++)"
                  aria-label="Aumentar zoom"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>

                <button
                  className="zoom-button zoom-reset"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomReset();
                  }}
                  title="Resetar zoom (Ctrl+0)"
                  aria-label="Resetar zoom"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </button>
              </div>
            )}

            {/* Seletor de Cor de Fundo - sempre mostrar */}
            <div className="background-color-picker">
              <label className="color-picker-label" title="Cor de fundo da imagem">
                🎨
              </label>
              <div className="color-presets">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    className={`color-preset ${backgroundColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setBackgroundColor(color);
                    }}
                    title={`Cor de fundo: ${color}`}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => {
                  e.stopPropagation();
                  setBackgroundColor(e.target.value);
                }}
                className="color-input"
                title="Escolher cor personalizada"
                aria-label="Escolher cor de fundo personalizada"
              />
            </div>

            <button
              className="file-preview-modal-close"
              onClick={onClose}
              aria-label="Fechar preview"
              title="Fechar (Esc)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="file-preview-modal-content"
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor,
            backgroundColor,
          }}
        >
          {isImage && imageSrc ? (
            <div
              className="image-container"
              style={{
                transform: transformStyle,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: isDragging ? 'transform' : 'auto',
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt={fileName}
                className={`file-preview-image ${isDragging ? 'dragging' : ''}`}
                draggable={false}
                loading="eager"
                decoding="async"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const errorDiv = target.nextElementSibling as HTMLElement;
                  if (errorDiv) {
                    errorDiv.style.display = 'flex';
                  }
                }}
              />
            </div>
          ) : isPDF ? (
            <div className="file-preview-pdf">
              <div className="pdf-icon-large">📄</div>
              <p className="pdf-message">Preview de PDF não disponível</p>
              <p className="pdf-filename">{fileName}</p>
            </div>
          ) : (
            <div className="file-preview-unknown">
              <div className="unknown-icon-large">📄</div>
              <p className="unknown-message">Preview não disponível para este tipo de arquivo</p>
              <p className="unknown-filename">{fileName}</p>
            </div>
          )}
          <div className="file-preview-error" style={{ display: 'none' }}>
            <div className="error-icon">⚠️</div>
            <p>Não foi possível carregar a imagem</p>
          </div>
        </div>
        <div className="file-preview-modal-footer">
          <div className="footer-info">
            {isImage && (
              <span className="zoom-hint">
                {activeTool === 'hand' && '🖐️ Mãozinha (H) • '}
                {activeTool === 'zoom' && '🔍 Lupa (Z) • '}
                {isSpacePressed && '⏸️ Space: Pan temporário • '}
                ⌨️ ALT+Scroll: Zoom • Ctrl+0: Reset • Space: Pan temporário
              </span>
            )}
          </div>
          <button
            className="file-preview-modal-button"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
