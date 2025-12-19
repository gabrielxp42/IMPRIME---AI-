import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Paintbrush, RotateCcw, Eraser, Undo2, Redo2, Eye, EyeOff, Check, RefreshCw } from 'lucide-react';
import './AICreativePanel.css';

interface AICreativePanelProps {
    imageSrc: string;
    onApply: (params: { prompt: string; model: string; maskBase64?: string }) => Promise<string | null>;
    onAccept: (base64: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
    initialPrompt?: string;
}

const AICreativePanel: React.FC<AICreativePanelProps> = ({
    imageSrc,
    onApply,
    onAccept,
    onCancel,
    isLoading: externalIsLoading,
    initialPrompt = ''
}) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [model] = useState<string>('nano-banana-edit');

    const [brushSize, setBrushSize] = useState(40);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasMask, setHasMask] = useState(false);
    const [brushMode, setBrushMode] = useState<'draw' | 'erase'>('draw');

    // Zoom e Pan
    const [zoomScale, setZoomScale] = useState(1);
    const [panPos, setPanPos] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const lastPanPoint = useRef<{ x: number, y: number } | null>(null);

    // Estado Simplificado
    const [maskHistory, setMaskHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showOriginal, setShowOriginal] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Novos estados de Preview e Loading
    const [internalIsLoading, setInternalIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPoint = useRef<{ x: number, y: number } | null>(null);

    const isLoading = externalIsLoading || internalIsLoading;

    const saveHistory = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL();
        setMaskHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, dataUrl].slice(-10);
        });
        setHistoryIndex(prev => Math.min(prev + 1, 9));
    };

    const undo = () => {
        if (historyIndex <= 0 || !canvasRef.current) return;
        const newIndex = historyIndex - 1;
        const img = new Image();
        img.src = maskHistory[newIndex];
        img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0);
                setHistoryIndex(newIndex);
            }
        };
    };

    const redo = () => {
        if (historyIndex >= maskHistory.length - 1 || !canvasRef.current) return;
        const newIndex = historyIndex + 1;
        const img = new Image();
        img.src = maskHistory[newIndex];
        img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0);
                setHistoryIndex(newIndex);
            }
        };
    };

    const clearMask = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                setHasMask(false);
                saveHistory();
            }
        }
    };

    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                canvas.width = img.naturalWidth || 1024;
                canvas.height = img.naturalHeight || 1024;
                saveHistory();
            }
        };
    }, [imageSrc]);

    const applyBrushStyles = (ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = '#8b5cf6';
        ctx.fillStyle = '#8b5cf6';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = brushMode === 'draw' ? 'source-over' : 'destination-out';
        ctx.shadowBlur = brushSize / 6;
        ctx.shadowColor = brushMode === 'draw' ? 'rgba(139, 92, 246, 0.4)' : 'transparent';
    };

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) applyBrushStyles(ctx);
        }
    }, [brushMode, brushSize]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Se estiver digitando no textarea, não interceptar o Space
            if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') {
                return;
            }

            if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(true); }
            if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
            if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
            if (e.key === 'Enter' && prompt.trim() && !isLoading && !previewSrc) handleApply();
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [historyIndex, maskHistory, prompt, isLoading, previewSrc]);

    const handleWheelZoom = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomSpeed = 0.0015;
        const delta = Math.exp(-e.deltaY * zoomSpeed);
        const newScale = Math.max(0.5, Math.min(10, zoomScale * delta));
        const newPanX = mouseX - (mouseX - panPos.x) * (newScale / zoomScale);
        const newPanY = mouseY - (mouseY - panPos.y) * (newScale / zoomScale);
        setZoomScale(newScale);
        setPanPos({ x: newPanX, y: newPanY });
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (previewSrc) return; // Bloquear desenho se tiver preview
        if (isSpacePressed || ('button' in e && (e.button === 1 || e.button === 2))) {
            setIsPanning(true);
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            lastPanPoint.current = { x: clientX, y: clientY };
            return;
        }
        setIsDrawing(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (clientX - rect.left) * (canvasRef.current.width / rect.width);
            const y = (clientY - rect.top) * (canvasRef.current.height / rect.height);
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) applyBrushStyles(ctx);
            lastPoint.current = { x, y };
            draw(e);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
        }
        if (isPanning) {
            if (lastPanPoint.current) {
                const dx = clientX - lastPanPoint.current.x;
                const dy = clientY - lastPanPoint.current.y;
                setPanPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                lastPanPoint.current = { x: clientX, y: clientY };
            }
            return;
        }
        if (!isDrawing || !canvasRef.current || previewSrc) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (clientX - rect.left) * (canvasRef.current.width / rect.width);
        const y = (clientY - rect.top) * (canvasRef.current.height / rect.height);

        ctx.beginPath();
        if (lastPoint.current) {
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        lastPoint.current = { x, y };
        setHasMask(true);
    };

    const stopDrawing = () => {
        if (isDrawing && !isPanning) saveHistory();
        setIsDrawing(false); setIsPanning(false); lastPanPoint.current = null; lastPoint.current = null;
    };

    const handleApply = async () => {
        setInternalIsLoading(true);
        setLoadingStage('Enviando para a IA...');

        let maskBase64;
        if (hasMask && canvasRef.current) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasRef.current.width;
            tempCanvas.height = canvasRef.current.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.fillStyle = 'black'; tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                const originalCtx = canvasRef.current.getContext('2d');
                if (originalCtx) {
                    const imgData = originalCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                    const data = imgData.data;
                    for (let i = 0; i < data.length; i += 4) { if (data[i + 3] > 0) { data[i] = data[i + 1] = data[i + 2] = 255; data[i + 3] = 255; } }
                    const maskHelper = document.createElement('canvas');
                    maskHelper.width = tempCanvas.width; maskHelper.height = tempCanvas.height;
                    maskHelper.getContext('2d')?.putImageData(imgData, 0, 0);
                    tempCtx.drawImage(maskHelper, 0, 0);
                }
                maskBase64 = tempCanvas.toDataURL('image/png').split(',')[1];
            }
        }

        // Simular estágios de carregamento
        setTimeout(() => setLoadingStage('Analisando área selecionada...'), 2000);
        setTimeout(() => setLoadingStage('Gerando arte com Nano Banana...'), 5000);
        setTimeout(() => setLoadingStage('Finalizando detalhes...'), 10000);

        try {
            const result = await onApply({ prompt, model, maskBase64 });
            if (result) {
                setPreviewSrc(result);
            }
        } finally {
            setInternalIsLoading(false);
            setLoadingStage('');
        }
    };

    return (
        <div className="ai-creative-panel-overlay">
            <div className="ai-creative-panel simple-mode">
                <div className="panel-header">
                    <div className="header-title">
                        <Sparkles className="ai-icon" />
                        <h3>{previewSrc ? 'Resultado da IA' : 'Editar com IA'}</h3>
                    </div>
                    <button className="btn-close" onClick={onCancel} disabled={isLoading}><X size={20} /></button>
                </div>

                <div className="panel-content">
                    <div className="preview-section">
                        <div
                            className={`preview-container ${isPanning || isSpacePressed ? 'panning' : ''}`}
                            ref={containerRef}
                            onMouseDown={startDrawing} onMouseMove={draw} onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => { stopDrawing(); setIsHovering(false); }} onMouseUp={stopDrawing}
                            onContextMenu={(e) => e.preventDefault()} onWheel={handleWheelZoom}
                            style={{ cursor: (isPanning || isSpacePressed) ? 'grabbing' : (previewSrc ? 'default' : 'none') }}
                        >
                            {isLoading && (
                                <div className="ai-loading-overlay">
                                    <div className="ai-scanning-line"></div>
                                    <div className="ai-loading-content">
                                        <div className="ai-spinner-premium"></div>
                                        <p className="ai-loading-text">{loadingStage}</p>
                                    </div>
                                </div>
                            )}

                            {isHovering && !isPanning && !isSpacePressed && !isLoading && !previewSrc && (
                                <div className="brush-cursor-preview" style={{
                                    left: cursorPos.x, top: cursorPos.y,
                                    width: brushSize * (containerRef.current ? containerRef.current.offsetWidth / canvasRef.current!.width : 1) * zoomScale,
                                    height: brushSize * (containerRef.current ? containerRef.current.offsetWidth / canvasRef.current!.width : 1) * zoomScale
                                }} />
                            )}

                            <div className="zoom-pan-wrapper" style={{
                                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
                                transformOrigin: '0 0', width: '100%', height: '100%', position: 'relative'
                            }}>
                                <img src={showOriginal || !previewSrc ? imageSrc : previewSrc} alt="Preview" className="image-preview" draggable={false} />
                                {!previewSrc && (
                                    <canvas ref={canvasRef} className="mask-canvas" style={{ opacity: showOriginal ? 0 : 0.6 }} />
                                )}
                            </div>

                            {!previewSrc && (
                                <div className="simple-toolbar">
                                    <button className={`tool-btn ${brushMode === 'draw' ? 'active' : ''}`} onClick={() => setBrushMode('draw')} title="Pincel"><Paintbrush size={18} /></button>
                                    <button className={`tool-btn ${brushMode === 'erase' ? 'active' : ''}`} onClick={() => setBrushMode('erase')} title="Borracha"><Eraser size={18} /></button>
                                    <div className="tool-separator" />
                                    <button className="tool-btn" onClick={undo} disabled={historyIndex <= 0} title="Desfazer"><Undo2 size={18} /></button>
                                    <button className="tool-btn" onClick={redo} disabled={historyIndex >= maskHistory.length - 1} title="Refazer"><Redo2 size={18} /></button>
                                </div>
                            )}

                            {(previewSrc || hasMask) && (
                                <button className={`btn-compare ${showOriginal ? 'active' : ''}`} onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)}>
                                    {showOriginal ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>

                        <div className="brush-controls" style={{ visibility: previewSrc ? 'hidden' : 'visible' }}>
                            <input type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="brush-slider" />
                            <button className="btn-clear-mask" onClick={clearMask}><RotateCcw size={14} /> Limpar</button>
                        </div>
                    </div>

                    <div className="custom-prompt-section">
                        {!previewSrc ? (
                            <>
                                <textarea className="prompt-textarea" placeholder="O que deseja fazer nesta área?..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} autoFocus />
                                <div className="panel-suggestions">
                                    {hasMask ? (
                                        <>
                                            <button className="suggestion-chip" onClick={() => setPrompt("remover este objeto")}>Remover objeto</button>
                                            <button className="suggestion-chip" onClick={() => setPrompt("mudar cor para azul")}>Mudar cor</button>
                                            <button className="suggestion-chip" onClick={() => setPrompt("transformar em cartoon")}>Estilo Cartoon</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="suggestion-chip" onClick={() => setPrompt("melhorar qualidade")}>Melhorar Qualidade</button>
                                            <button className="suggestion-chip" onClick={() => setPrompt("mudar fundo")}>Trocar Fundo</button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="preview-actions">
                                <p className="preview-hint">Gostou do resultado? Você pode aceitar a alteração ou tentar novamente.</p>
                            </div>
                        )}
                        {!hasMask && !previewSrc && <p className="mask-hint">Dica: Marque a área que deseja editar para melhores resultados.</p>}
                    </div>
                </div>

                <div className="panel-footer">
                    <div className="footer-buttons">
                        {previewSrc ? (
                            <>
                                <button className="btn-secondary" onClick={() => setPreviewSrc(null)} disabled={isLoading}>
                                    <RefreshCw size={16} /> Tentar Novamente
                                </button>
                                <button className="btn-primary" onClick={() => onAccept(previewSrc)} disabled={isLoading}>
                                    <Check size={16} /> Aceitar Alteração
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn-secondary" onClick={onCancel} disabled={isLoading}>Cancelar</button>
                                <button className="btn-primary" onClick={handleApply} disabled={isLoading || !prompt.trim()}>
                                    {isLoading ? <><div className="btn-spinner"></div> Processando...</> : <><Sparkles size={16} /> Aplicar Alteração</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICreativePanel;
