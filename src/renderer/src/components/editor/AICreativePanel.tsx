import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    X, Sparkles, Wand2, Paintbrush, Eraser,
    Undo2, Redo2, Check,
    RefreshCw, Brush, ZoomIn, Layers,
    Mic, Minus, Square
} from 'lucide-react';
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
    // --- ESTADOS ---
    const [customPrompt, setCustomPrompt] = useState(initialPrompt);
    const [activeToolState, setActiveToolState] = useState<'brush' | null>('brush');
    const [brushSize, setBrushSize] = useState(45);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasMask, setHasMask] = useState(false);

    // Estados de Visualização
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const lastPanPoint = useRef<{ x: number, y: number } | null>(null);
    const lastPoint = useRef<{ x: number, y: number } | null>(null);

    // Estados de Processamento
    const [internalIsLoading, setInternalIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [responseImage, setResponseImage] = useState<string | null>(null);
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);

    const isLoading = externalIsLoading || internalIsLoading;
    const isScanning = isLoading;
    const currentDisplayImage = previewSrc || responseImage || imageSrc;

    // --- INITIALIZATION ---
    const setupCanvas = useCallback(() => {
        if (canvasRef.current && imageRef.current && containerRef.current) {
            const img = imageRef.current;
            const canvas = canvasRef.current;

            // Match canvas with image physical size but keep coordinate system consistent
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Update mask state if needed
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, []);

    useEffect(() => {
        setupCanvas();
    }, [imageSrc, setupCanvas]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
            if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(true); }
            if (e.ctrlKey && e.code === 'KeyZ') handleClearMask();
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') { setIsSpacePressed(false); setIsPanning(false); }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

    // --- MOUSE & DRAWING FUNCTIONS ---
    const getCanvasCoords = (e: React.MouseEvent) => {
        if (!imageRef.current || !canvasRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();

        // Scale to image's intrinsic resolution
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            const scaleAmount = -e.deltaY * 0.001;
            setZoom(prev => Math.min(Math.max(0.2, prev + scaleAmount), 5));
        } else {
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || isSpacePressed) {
            setIsPanning(true);
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (activeToolState === 'brush' && !responseImage) {
            setIsDrawing(true);
            const { x, y } = getCanvasCoords(e);

            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)';
                ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
                ctx.lineWidth = brushSize;

                ctx.beginPath();
                ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
                ctx.fill();

                lastPoint.current = { x, y };
                setHasMask(true);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }

        if (isPanning && lastPanPoint.current) {
            const dx = e.clientX - lastPanPoint.current.x;
            const dy = e.clientY - lastPanPoint.current.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (isDrawing && activeToolState === 'brush' && canvasRef.current && !responseImage) {
            const { x, y } = getCanvasCoords(e);
            const ctx = canvasRef.current.getContext('2d');
            if (ctx && lastPoint.current) {
                ctx.beginPath();
                ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
                ctx.lineTo(x, y);
                ctx.stroke();
                lastPoint.current = { x, y };
            }
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        setIsPanning(false);
        lastPoint.current = null;
    };

    const handleClearMask = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setHasMask(false);
        }
    };

    const handleGenerate = async () => {
        if (!customPrompt && !hasMask) return;
        setInternalIsLoading(true);
        setLoadingStage('Estudando cena...');

        try {
            let maskBase64;
            if (hasMask && canvasRef.current) {
                maskBase64 = canvasRef.current.toDataURL('image/png').split(',')[1];
            }

            setTimeout(() => setLoadingStage('Pincelando IA...'), 2000);

            const result = await onApply({ prompt: customPrompt, model: 'premium-studio-v2', maskBase64 });
            if (result) {
                setResponseImage(result);
                setPreviewSrc(result);
                setActiveToolState(null);
                setHasMask(false);
                handleClearMask();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setInternalIsLoading(false);
            setLoadingStage('');
        }
    };

    const STYLE_SUGGESTIONS = [
        { label: 'Vintage', prompt: 'Vintage style, retro color palette, film grain' },
        { label: 'Pintura a Óleo', prompt: 'Textured oil painting style, visible brushstrokes' },
        { label: 'Cyberpunk', prompt: 'Cyberpunk aesthetic, neon lighting, futuristic' },
        { label: 'Noir', prompt: 'Film noir style, high contrast, black and white' },
        { label: 'Aquarela', prompt: 'Soft watercolour painting, artistic bleeds' },
    ];

    return (
        <div className="ai-studio-overlay">
            <div className="ai-studio-container">
                {/* Custom Window Header */}
                <div className="studio-window-header">
                    <div className="header-left">
                        <Sparkles size={16} className="sparkle-icon" />
                        <span>Estúdio Criativo IA</span>
                    </div>
                    <div className="window-controls">
                        <div className="win-btn minimize"><Minus size={12} /></div>
                        <div className="win-btn maximize"><Square size={10} /></div>
                        <div className="win-btn close" onClick={onCancel}><X size={14} /></div>
                    </div>
                </div>

                <div className="studio-body">
                    {/* Left: Premium Sidebar Controls */}
                    <div className="studio-sidebar left">
                        <div className="sidebar-scroll-content">
                            {/* Prompt Section */}
                            <div className="sidebar-group">
                                <div className="studio-input-container">
                                    <textarea
                                        className="studio-prompt-input"
                                        placeholder="O que você deseja criar ou mudar? (Ex: troque o fundo, adicione luzes...)"
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                    />
                                    <Mic size={18} className="mic-icon" title="Comando de Voz" />
                                </div>
                            </div>

                            {/* Style Suggestions */}
                            <div className="sidebar-group">
                                <label className="sidebar-label">Sugestões de Estilo</label>
                                <div className="style-chips-grid">
                                    {STYLE_SUGGESTIONS.map(s => (
                                        <button
                                            key={s.label}
                                            className={`style-chip ${customPrompt.includes(s.label) ? 'active' : ''}`}
                                            onClick={() => setCustomPrompt(s.prompt)}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brush Section */}
                            <div className="sidebar-group">
                                <div className="label-row">
                                    <label className="sidebar-label">Tamanho do Pincel</label>
                                    <span className="label-value">{brushSize}px</span>
                                </div>
                                <div className="brush-slider-row">
                                    <Paintbrush size={14} className="slider-icon mini" />
                                    <input
                                        type="range" min="10" max="200" value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="studio-range-slider"
                                    />
                                    <Brush size={18} className="slider-icon" />
                                </div>
                            </div>

                            {/* Primary Macro Tools */}
                            <div className="sidebar-group macro-actions">
                                <button className="macro-btn primary-glow">
                                    <Sparkles size={18} />
                                    <span>Toque Mágico IA</span>
                                </button>
                                <button className="macro-btn">
                                    <Wand2 size={18} />
                                    <span>Mudar Ambiente</span>
                                </button>
                                <button className="macro-btn">
                                    <Eraser size={18} />
                                    <span>Remover Objeto</span>
                                </button>
                            </div>
                        </div>

                        {/* Sidebar Footer */}
                        <div className="studio-sidebar-footer">
                            {!responseImage ? (
                                <>
                                    <button
                                        className="studio-action-btn generate"
                                        onClick={handleGenerate}
                                        disabled={isLoading || (!customPrompt && !hasMask)}
                                    >
                                        <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
                                        <span>Gerar</span>
                                    </button>
                                    <button className="studio-action-btn cancel" onClick={onCancel}>
                                        Cancelar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="studio-action-btn generate"
                                        onClick={() => onAccept(responseImage)}
                                    >
                                        <Check size={18} />
                                        <span>Aplicar</span>
                                    </button>
                                    <button
                                        className="studio-action-btn cancel"
                                        onClick={() => {
                                            setResponseImage(null);
                                            setPreviewSrc(null);
                                        }}
                                    >
                                        <Undo2 size={18} />
                                        <span>Voltar</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Vertical Splitter */}
                    <div className="studio-vertical-splitter">
                        <div className="splitter-handle"></div>
                    </div>

                    {/* Right: Workspace Area */}
                    <div className="studio-canvas-area"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    >
                        {/* Floating Tool Bar */}
                        <div className="floating-canvas-toolbar right-aligned">
                            <button className="flat-tool-btn" title="Zoom"><ZoomIn size={18} /></button>
                            <div className="tool-v-divider"></div>
                            <button className="flat-tool-btn" onClick={handleClearMask} title="Desfazer"><Undo2 size={18} /></button>
                            <button className="flat-tool-btn" title="Refazer"><Redo2 size={18} /></button>
                            <div className="tool-v-divider"></div>
                            <button className="flat-tool-btn" title="Camadas"><Layers size={18} /></button>
                        </div>

                        <div className="canvas-viewport">
                            <div className={`workspace-content ${isPanning || isSpacePressed ? 'panning' : ''}`}
                                style={{
                                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                                    transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                                }}
                            >
                                <img
                                    ref={imageRef}
                                    src={currentDisplayImage}
                                    className="studio-main-img"
                                    alt="Área de Trabalho"
                                    onLoad={setupCanvas}
                                    draggable={false}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="studio-mask-canvas"
                                />
                            </div>
                        </div>

                        {/* Brush Cursor Hint */}
                        {activeToolState === 'brush' && !isPanning && !isSpacePressed && !responseImage && (
                            <div className="studio-brush-cursor"
                                style={{
                                    left: mousePos.x, top: mousePos.y,
                                    width: brushSize * zoom, height: brushSize * zoom,
                                }}
                            />
                        )}

                        {/* Analysis Loading */}
                        {isScanning && (
                            <div className="studio-loading-overlay">
                                <div className="studio-spinner"></div>
                                <span className="loading-text">{loadingStage || 'Processando...'}</span>
                                <div className="loading-bar-container"><div className="loading-bar-fill"></div></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICreativePanel;
