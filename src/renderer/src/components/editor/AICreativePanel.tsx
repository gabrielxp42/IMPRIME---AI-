import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCredits } from '../../contexts/CreditContext';
import {
    X, Sparkles, Image as ImageIcon, Eraser,
    Undo2, Wand2, ZoomIn, ZoomOut, Check, RefreshCw, Brain
} from 'lucide-react';
import './AICreativePanel.css';

interface AICreativePanelProps {
    imageSrc: string;
    onApply: (params: { prompt: string; maskBase64?: string; additionalImages?: string[] }) => Promise<string | null>;
    onAccept: (base64: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

type AIMode = 'vectorize' | 'restore' | 'cleanup' | 'recreate' | 'free';

interface ModePreset {
    id: AIMode;
    label: string;
    description: string;
    icon: any;
    prompt: string;
    needsMask: boolean;
}

const MODES: ModePreset[] = [
    {
        id: 'vectorize',
        label: 'Vetorizar',
        description: 'Transforma foto em arte digital limpa',
        icon: ImageIcon,
        prompt: 'Vectorize this image. Convert to flat vector graphic style with clean lines, solid colors, no gradients, white background. High quality for printing.',
        needsMask: false
    },
    {
        id: 'restore',
        label: 'Restaurar',
        description: 'Limpa ruído e melhora qualidade',
        icon: Sparkles,
        prompt: 'Restore and enhance this image. Remove noise, blur, and artifacts. Sharpen lines, correct colors. Professional studio quality output.',
        needsMask: false
    },
    {
        id: 'cleanup',
        label: 'Remover Área',
        description: 'Pinte sobre o que quer remover',
        icon: Eraser,
        prompt: 'Remove the masked area and fill it seamlessly with the surrounding background. Professional retouching.',
        needsMask: true
    },
    {
        id: 'recreate',
        label: 'Recriar',
        description: 'Recria a arte com base em instruções',
        icon: RefreshCw,
        prompt: 'Recreate this artwork with high quality. Keep the main visual elements but enhance with modern, professional design.',
        needsMask: true
    },
    {
        id: 'free',
        label: 'Criação Livre',
        description: 'Dê suas próprias instruções à IA',
        icon: Brain,
        prompt: '',
        needsMask: true
    }
];

const AICreativePanel: React.FC<AICreativePanelProps> = ({
    imageSrc,
    onApply,
    onAccept,
    onCancel,
    isLoading: externalLoading
}) => {
    // State
    const [mode, setMode] = useState<AIMode>('vectorize');
    const [extraDetails, setExtraDetails] = useState('');
    const [brushSize, setBrushSize] = useState(50);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // Mask
    const [maskHistory, setMaskHistory] = useState<ImageData[]>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);

    // Interaction
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });

    // Result
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

    const LOADING_MESSAGES = [
        'Analisando pixels e aplicando magia...',
        'Estudando cada detalhe da sua imagem...',
        'Recriando com inteligência artificial...',
        'Quase lá! Finalizando os retoques...',
        'Aplicando o toque final de qualidade...',
        'Gerando resultado em alta definição...'
    ];

    // Rotate loading messages
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            interval = setInterval(() => {
                setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
            }, 3000);
        } else {
            setLoadingMsgIdx(0);
        }
        return () => clearInterval(interval);
    }, [loading]);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isProcessing = externalLoading || loading;
    const activeMode = MODES.find(m => m.id === mode)!;

    // Init Canvas
    const initCanvas = useCallback(() => {
        if (!canvasRef.current || !imageRef.current) return;
        const canvas = canvasRef.current;
        const img = imageRef.current;

        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    // History
    const saveToHistory = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setMaskHistory(prev => [...prev.slice(0, historyIdx + 1), data]);
        setHistoryIdx(prev => prev + 1);
    };

    const undo = () => {
        if (historyIdx > 0) {
            setHistoryIdx(historyIdx - 1);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && maskHistory[historyIdx - 1]) {
                ctx.putImageData(maskHistory[historyIdx - 1], 0, 0);
            }
        } else {
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.clearRect(0, 0, 9999, 9999);
            setHistoryIdx(-1);
        }
    };

    const clearMask = () => {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, 9999, 9999);
        setHistoryIdx(-1);
        setMaskHistory([]);
    };

    // Drawing
    const getPos = (e: React.MouseEvent) => {
        if (!imageRef.current || !canvasRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        const rx = (e.clientX - rect.left) / rect.width;
        const ry = (e.clientY - rect.top) / rect.height;
        return {
            x: rx * imageRef.current.naturalWidth,
            y: ry * imageRef.current.naturalHeight
        };
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || e.altKey) {
            setIsPanning(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
            return;
        }

        if (activeMode.needsMask && !result) {
            setIsDrawing(true);
            const { x, y } = getPos(e);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && imageRef.current) {
                const scale = imageRef.current.naturalWidth / imageRef.current.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)'; // NEON MAGENTA semi-transparent for context
                ctx.lineWidth = brushSize * scale;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }

        if (isPanning) {
            setPan(p => ({
                x: p.x + e.clientX - lastMouse.x,
                y: p.y + e.clientY - lastMouse.y
            }));
            setLastMouse({ x: e.clientX, y: e.clientY });
            return;
        }

        if (isDrawing && canvasRef.current) {
            const { x, y } = getPos(e);
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    };

    const onMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
        setIsPanning(false);
    };

    const onWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            setZoom(z => Math.min(Math.max(0.2, z - e.deltaY * 0.001), 4));
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    // Context
    const { deductCost, credits } = useCredits();

    // Cost logic
    const getModeCost = (m: AIMode) => {
        if (['vectorize', 'restore', 'cleanup'].includes(m)) return 5;
        return 8;
    };

    const currentCost = getModeCost(mode);

    // Generate
    const generate = async () => {
        if (isProcessing) return;

        // Credit Check & Deduction
        const success = await deductCost(currentCost);
        if (!success) {
            alert(`Créditos insuficientes! Você precisa de ${currentCost} créditos para usar este recurso.`);
            return;
        }

        setLoading(true);
        setLoadingText(`Enviando para IA (-${currentCost} créditos)...`);

        try {
            let markedImageBase64: string | undefined;
            if (activeMode.needsMask && canvasRef.current && imageRef.current && historyIdx >= 0) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imageRef.current.naturalWidth;
                tempCanvas.height = imageRef.current.naturalHeight;
                const ctx = tempCanvas.getContext('2d');

                if (ctx) {
                    // Create Visual Marking Image (Surgical Reference)
                    ctx.drawImage(imageRef.current, 0, 0);
                    ctx.drawImage(canvasRef.current, 0, 0);
                    markedImageBase64 = tempCanvas.toDataURL('image/png').split(',')[1];
                }
            }

            setLoadingText('Sincronizando com a IA...');

            let finalPrompt = activeMode.prompt;
            if (markedImageBase64) {
                const userText = activeMode.id === 'free' ? extraDetails.trim() : finalPrompt;
                finalPrompt = `No local exato marcado em ROSA/MAGENTA na segunda imagem (referência de marcação): ${userText}`;
            } else if (activeMode.id === 'free') {
                finalPrompt = extraDetails.trim();
                if (!finalPrompt) {
                    setLoading(false);
                    return;
                }
            } else if (extraDetails.trim()) {
                finalPrompt += ` Detalhes: ${extraDetails.trim()}`;
            }

            const res = await onApply({
                prompt: finalPrompt,
                additionalImages: markedImageBase64 ? [markedImageBase64] : []
            });

            if (res) {
                setResult(res);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingText('');
        }
    };

    return (
        <div className="ai-studio-overlay">
            <div className="ai-studio-container">
                {/* HEADER */}
                <div className="studio-window-header">
                    <div className="header-title">
                        <Wand2 size={18} className="header-icon" />
                        <span>Estúdio IA</span>
                        <div style={{ marginLeft: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: '#ec4899', fontWeight: 700 }}>{credits}</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>créditos</span>
                        </div>
                    </div>
                    <div className="win-btn-close" onClick={onCancel}>
                        <X size={18} />
                    </div>
                </div>

                {/* BODY */}
                <div className="studio-body">
                    {/* SIDEBAR */}
                    <div className="studio-sidebar">
                        <div className="tools-scroll-area">

                            {/* MODES */}
                            <div className="tool-section">
                                <div className="section-title">O que deseja fazer?</div>
                                <div className="ai-mode-grid">
                                    {MODES.map(m => (
                                        <div
                                            key={m.id}
                                            className={`ai-mode-card ${mode === m.id ? 'active' : ''}`}
                                            onClick={() => setMode(m.id)}
                                        >
                                            <div className="mode-icon">
                                                <m.icon size={18} />
                                            </div>
                                            <div className="mode-info">
                                                <span className="mode-name">{m.label}</span>
                                                <span className="mode-desc">{m.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* EXTRA DETAILS / PROMPT */}
                            <div className="tool-section">
                                <div className="section-title">
                                    {mode === 'free' ? 'Instruções de Criação' : 'Detalhes Extras (Opcional)'}
                                </div>
                                <div className="extra-input-container">
                                    <textarea
                                        className="extra-input"
                                        value={extraDetails}
                                        onChange={(e) => setExtraDetails(e.target.value)}
                                        placeholder={mode === 'free'
                                            ? "Descreva exatamente o que você quer que a IA faça..."
                                            : "Ex: Fundo preto, cores mais vibrantes, remover texto..."}
                                    />
                                </div>
                            </div>

                            {/* BRUSH */}
                            {activeMode.needsMask && (
                                <div className="tool-section">
                                    <div className="section-title">Pincel de Seleção</div>
                                    <div className="brush-section">
                                        <div className="brush-header">
                                            <span className="brush-label">Tamanho</span>
                                            <span className="brush-value">{brushSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="200"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(Number(e.target.value))}
                                            className="gradient-slider"
                                        />
                                        <div className="mask-actions">
                                            <button className="mask-btn" onClick={undo}>
                                                <Undo2 size={14} /> Desfazer
                                            </button>
                                            <button className="mask-btn" onClick={clearMask}>
                                                <Eraser size={14} /> Limpar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* FOOTER */}
                        <div className="sidebar-footer">
                            {!result ? (
                                <button
                                    className="main-action-btn generate"
                                    onClick={generate}
                                    disabled={isProcessing || (mode === 'free' && !extraDetails.trim())}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '2px',
                                        padding: '14px 20px',
                                        height: '64px',
                                        margin: '0',
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Sparkles size={20} className={isProcessing ? 'spin' : ''} />
                                        <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.05em' }}>
                                            {isProcessing ? 'PROCESSANDO...' : 'GERAR ARTE'}
                                        </span>
                                    </div>
                                    {!isProcessing && (
                                        <span style={{
                                            fontSize: '11px',
                                            opacity: 0.9,
                                            fontWeight: 600,
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            marginTop: '2px'
                                        }}>
                                            -{currentCost} créditos
                                        </span>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="main-action-btn secondary"
                                        onClick={() => setResult(null)}
                                        style={{ height: '56px', fontSize: '14px', fontWeight: 700 }}
                                    >
                                        <Undo2 size={18} /> CANCELAR
                                    </button>
                                    <button
                                        className="main-action-btn apply"
                                        onClick={() => onAccept(result)}
                                        style={{ height: '56px', fontSize: '14px', fontWeight: 800 }}
                                    >
                                        <Check size={18} /> APLICAR ALTERAÇÃO
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* CANVAS */}
                    <div
                        className="studio-canvas-container"
                        ref={containerRef}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
                        onWheel={onWheel}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ cursor: activeMode.needsMask && !result && !isPanning ? 'none' : 'default' }}
                    >
                        {/* TOOLBAR */}
                        <div className="canvas-toolbar">
                            <button className="canvas-tool-btn" onClick={() => setZoom(z => z + 0.2)}>
                                <ZoomIn size={18} />
                            </button>
                            <button className="canvas-tool-btn" onClick={() => setZoom(1)}>
                                {Math.round(zoom * 100)}%
                            </button>
                            <button className="canvas-tool-btn" onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}>
                                <ZoomOut size={18} />
                            </button>
                        </div>

                        <div
                            className="canvas-viewport"
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                            }}
                        >
                            <img
                                ref={imageRef}
                                src={result || imageSrc}
                                className="main-image"
                                onLoad={initCanvas}
                                draggable={false}
                                alt="Imagem"
                            />
                            <canvas
                                ref={canvasRef}
                                className="mask-canvas"
                                style={{
                                    display: result ? 'none' : 'block',
                                    opacity: 0.7
                                }}
                            />
                        </div>

                        {/* BRUSH CURSOR */}
                        {activeMode.needsMask && !result && !isPanning && (
                            <div
                                className="brush-cursor"
                                style={{
                                    left: cursorPos.x,
                                    top: cursorPos.y,
                                    width: brushSize * zoom,
                                    height: brushSize * zoom
                                }}
                            />
                        )}

                        {/* PREMIUM LOADING */}
                        {isProcessing && (
                            <div className="processing-overlay">
                                <div className="particles">
                                    <div className="particle"></div>
                                    <div className="particle"></div>
                                    <div className="particle"></div>
                                    <div className="particle"></div>
                                </div>

                                <div className="ai-orb-container">
                                    <div className="ai-ring-1"></div>
                                    <div className="ai-ring-2"></div>
                                    <div className="ai-ring-3"></div>
                                    <div className="ai-orb"></div>
                                </div>

                                <div className="processing-content">
                                    <div className="processing-title">
                                        ✨ A IA está criando sua arte
                                    </div>
                                    <div className="processing-subtitle">
                                        {loadingText || LOADING_MESSAGES[loadingMsgIdx]}
                                    </div>
                                    <div className="progress-container">
                                        <div className="progress-bar"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AICreativePanel;
