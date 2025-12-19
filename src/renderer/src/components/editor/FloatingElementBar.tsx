/**
 * FloatingElementBar - Redesenhado para ser Compacto e Inteligente
 */

import React, { useState } from 'react';
import {
    Lock,
    Unlock,
    Scissors,
    Copy,
    Trash2,
    Wand2,
    Palette,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    ArrowUpToLine,
    ArrowDownToLine,
    Bold,
    Italic,
    Underline
} from 'lucide-react';
import './FloatingElementBar.css';

interface FloatingElementBarProps {
    x?: number;
    y?: number;
    elementCenterX?: number;
    elementBottomY?: number;
    widthCm?: number | string;
    heightCm?: number | string;
    onDimensionsChange?: (w: number, h: number) => void;
    onWidthChange?: (w: number) => void;
    onHeightChange?: (h: number) => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onRemoveBackground?: () => void;
    onTrim?: () => void;
    onBringToFront?: () => void;
    onSendToBack?: () => void;
    elementType?: 'image' | 'shape' | 'text' | 'group';
    currentFill?: string;
    onFillChange?: (color: string) => void;
    currentStroke?: string;
    currentStrokeWidth?: number;
    onStrokeChange?: (color: string) => void;
    onStrokeWidthChange?: (width: number) => void;
    currentFontSize?: number;
    currentFontFamily?: string;
    currentAlign?: 'left' | 'center' | 'right';
    currentFontStyle?: string;
    currentTextDecoration?: string;
    onFontSizeChange?: (size: number) => void;
    onFontFamilyChange?: (font: string) => void;
    onAlignChange?: (align: 'left' | 'center' | 'right') => void;
    onCaseChange?: (curr: string) => void;
    onFontStyleChange?: (style: string) => void;
    onTextDecorationChange?: (decoration: string) => void;
    availableFonts?: string[];
    isTransforming?: boolean;
}

const QUICK_COLORS = ['#3f4144', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ffffff'];
const DEFAULT_FONTS = ['Inter', 'Roboto', 'Grand Hotel', 'Oswald', 'Montserrat', 'Playfair Display', 'Arial', 'Verdana', 'Courier New'];

const FloatingElementBar: React.FC<FloatingElementBarProps> = (props) => {
    const {
        elementCenterX, elementBottomY, x, y,
        widthCm, heightCm,
        onDimensionsChange, onWidthChange, onHeightChange,
        onDuplicate, onDelete, onRemoveBackground, onTrim,
        onBringToFront, onSendToBack,
        elementType, currentFill, onFillChange,
        currentStrokeWidth, onStrokeChange, onStrokeWidthChange,
        currentFontSize, currentFontFamily, currentAlign,
        currentFontStyle, currentTextDecoration,
        onFontSizeChange, onFontFamilyChange, onAlignChange, onCaseChange,
        onFontStyleChange, onTextDecorationChange,
        availableFonts,
        isTransforming
    } = props;

    // Posição
    const posX = elementCenterX ?? x ?? 0;
    const posY = elementBottomY ? elementBottomY + 10 : (y ?? 0) + 50;

    // Estado local
    const [w, setW] = useState(widthCm?.toString() || '');
    const [h, setH] = useState(heightCm?.toString() || '');

    // Sincronizar valores durante transform em tempo real
    React.useEffect(() => {
        if (isTransforming) {
            setW(widthCm?.toString() || '');
            setH(heightCm?.toString() || '');
        }
    }, [widthCm, heightCm, isTransforming]);
    const [locked, setLocked] = useState(true); // Aspect Ratio Lock
    const [activePanel, setActivePanel] = useState<'text' | 'color' | 'style' | null>(null);
    const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

    // Lista de fontes combinada
    const fontOptions = React.useMemo(() => {
        const system = availableFonts || [];
        // Limpar nomes de fontes (remover aspas se houver)
        const cleanSystem = system.map(f => f.replace(/['"]/g, ''));
        // Combinar defaults e sistema, remover duplicatas e ordenar
        return Array.from(new Set([...DEFAULT_FONTS, ...cleanSystem])).sort();
    }, [availableFonts]);

    // Estado temporário para fonte do PC
    const [localFontName, setLocalFontName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Debounce para Cor (Evitar lag no color picker)
    const [tempColor, setTempColor] = useState<string | null>(null);

    React.useEffect(() => {
        if (widthCm) setW(widthCm.toString());
        if (heightCm) setH(heightCm.toString());
    }, [widthCm, heightCm]);

    // Atualiza estado local quando a fonte externa muda
    React.useEffect(() => {
        if (currentFontFamily) {
            setLocalFontName(currentFontFamily.split(',')[0]);
        }
    }, [currentFontFamily]);

    React.useEffect(() => {
        if (tempColor === null) return;
        const handler = setTimeout(() => {
            if (onFillChange) onFillChange(tempColor);
        }, 100);
        return () => clearTimeout(handler);
    }, [tempColor]);

    const barRef = React.useRef<HTMLDivElement>(null);

    const applyChanges = () => {
        const numW = parseFloat(w);
        const numH = parseFloat(h);
        if (!isNaN(numW) && !isNaN(numH) && numW > 0 && numH > 0) {
            if (onDimensionsChange) onDimensionsChange(numW, numH);
            else {
                onWidthChange?.(numW);
                onHeightChange?.(numH);
            }
        }
    };

    // Lógica de Proporção (Cadeado)
    const aspectRatio = React.useRef<number>(1);

    React.useEffect(() => {
        // Calcula aspect ratio inicial quando valores mudam
        const wNum = parseFloat(widthCm?.toString() || '0');
        const hNum = parseFloat(heightCm?.toString() || '0');
        if (wNum > 0 && hNum > 0) {
            aspectRatio.current = wNum / hNum;
        }
    }, [widthCm, heightCm]);

    const handleWidthChange = (newW: string) => {
        setW(newW);
        const numW = parseFloat(newW);
        if (locked && !isNaN(numW) && numW > 0) {
            // Calcula altura proporcional
            const newH = (numW / aspectRatio.current).toFixed(2);
            setH(newH);
        }
    };

    const handleHeightChange = (newH: string) => {
        setH(newH);
        const numH = parseFloat(newH);
        if (locked && !isNaN(numH) && numH > 0) {
            // Calcula largura proporcional
            const newW = (numH * aspectRatio.current).toFixed(2);
            setW(newW);
        }
    };

    // HOVER HANDLERS
    const handleMouseEnter = (panel: 'text' | 'color' | 'style') => {
        if (hoverTimer) clearTimeout(hoverTimer);
        setActivePanel(panel);
    };

    const handleMouseLeave = () => {
        const timer = setTimeout(() => {
            setActivePanel(null);
        }, 300); // 300ms delay to allow bridging gap
        setHoverTimer(timer);
    };

    const handleLocalFontSubmit = () => {
        if (localFontName && onFontFamilyChange) {
            onFontFamilyChange(localFontName);
        }
    };

    const isBold = currentFontStyle?.includes('bold');
    const isItalic = currentFontStyle?.includes('italic');
    const isUnderline = currentTextDecoration?.includes('underline');

    return (
        <div
            ref={barRef}
            className="floating-smart-bar"
            style={{ left: `${posX}px`, top: `${posY}px` }}
        >
            {/* GRUPO 1: DIMENSÕES (Compacto com Labels) */}
            <div className="smart-group dimensions">
                <div className="compact-input-pair">
                    <span className="dim-label">L</span>
                    <input
                        type="text"
                        value={w}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        onBlur={applyChanges}
                        onKeyDown={(e) => e.key === 'Enter' && applyChanges()}
                        className="mini-input"
                        title="Largura (cm)"
                    />
                    <button
                        className={`lock-toggle ${locked ? 'active' : ''}`}
                        onClick={() => setLocked(!locked)}
                        title={locked ? 'Proporção travada' : 'Proporção livre'}
                    >
                        {locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                    <span className="dim-label">A</span>
                    <input
                        type="text"
                        value={h}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        onBlur={applyChanges}
                        onKeyDown={(e) => e.key === 'Enter' && applyChanges()}
                        className="mini-input"
                        title="Altura (cm)"
                    />
                    <span className="unit-tag">cm</span>
                </div>
            </div>

            <div className="bar-divider"></div>

            {/* GRUPO 2: CONTEXTUAL (Texto ou Cor) */}
            <div className="smart-group contextual">
                {elementType === 'text' ? (
                    <div className="text-quick-tools">
                        {/* Botão Aa - Abre menu de fonte/tamanho/alinhamento */}
                        <div
                            className={`expandable-tool ${activePanel === 'text' ? 'active' : ''}`}
                            onMouseEnter={() => handleMouseEnter('text')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button className="tool-trigger-btn main-action">
                                <div className="trigger-content">
                                    <Type size={16} className="type-icon" />
                                    <span className="current-val">{currentFontSize}</span>
                                </div>
                            </button>
                            <div className="tool-dropdown-panel glass-panel text-panel">
                                <div className="panel-row">
                                    <span className="panel-label">Estilo</span>
                                    <div className="style-toggles">
                                        <button
                                            className={`font-opt icon-only ${isBold ? 'active' : ''}`}
                                            onClick={() => onFontStyleChange?.('bold')}
                                            title="Negrito"
                                        >
                                            <Bold size={14} />
                                        </button>
                                        <button
                                            className={`font-opt icon-only ${isItalic ? 'active' : ''}`}
                                            onClick={() => onFontStyleChange?.('italic')}
                                            title="Itálico"
                                        >
                                            <Italic size={14} />
                                        </button>
                                        <button
                                            className={`font-opt icon-only ${isUnderline ? 'active' : ''}`}
                                            onClick={() => onTextDecorationChange?.('underline')}
                                            title="Sublinhado"
                                        >
                                            <Underline size={14} />
                                        </button>
                                        <button
                                            className="font-opt icon-only"
                                            onClick={() => onCaseChange?.('cycle')}
                                            title="Alternar Maiúsculas/Minúsculas"
                                        >
                                            Aa
                                        </button>
                                    </div>
                                </div>
                                <div className="panel-divider"></div>
                                <div className="panel-row">
                                    <span className="panel-label">Tamanho</span>
                                    <input
                                        type="number"
                                        value={currentFontSize || ''}
                                        onChange={(e) => onFontSizeChange?.(parseInt(e.target.value))}
                                        className="font-size-input-field"
                                    />
                                </div>
                                <div className="panel-divider"></div>
                                <div className="panel-row">
                                    <span className="panel-label">Fonte</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar fonte..."
                                        value={localFontName}
                                        onChange={(e) => {
                                            setLocalFontName(e.target.value);
                                            setSearchTerm(e.target.value.toLowerCase());
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLocalFontSubmit()}
                                        onBlur={handleLocalFontSubmit}
                                        className="custom-font-input"
                                    />
                                </div>
                                <div className="panel-row fonts">
                                    {fontOptions
                                        .filter(f => f.toLowerCase().includes(searchTerm))
                                        .slice(0, 50) // Limitar renderização para performance
                                        .map(f => (
                                            <button
                                                key={f}
                                                className={`font-opt ${currentFontFamily?.includes(f) ? 'active' : ''}`}
                                                onClick={() => onFontFamilyChange?.(f)}
                                                style={{ fontFamily: f }}
                                                title={f}
                                            >
                                                {f.length > 12 ? f.substring(0, 10) + '..' : f}
                                            </button>
                                        ))}
                                </div>
                                <div className="panel-divider"></div>
                                <div className="panel-row align">
                                    <button className={currentAlign === 'left' ? 'active' : ''} onClick={() => onAlignChange?.('left')}><AlignLeft size={16} /></button>
                                    <button className={currentAlign === 'center' ? 'active' : ''} onClick={() => onAlignChange?.('center')}><AlignCenter size={16} /></button>
                                    <button className={currentAlign === 'right' ? 'active' : ''} onClick={() => onAlignChange?.('right')}><AlignRight size={16} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Cor do Texto */}
                        <div
                            className={`expandable-tool ${activePanel === 'color' ? 'active' : ''}`}
                            onMouseEnter={() => handleMouseEnter('color')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button className="tool-trigger-btn color-preview">
                                <div className="color-circle" style={{ backgroundColor: currentFill }}></div>
                            </button>
                            <div className="tool-dropdown-panel glass-panel colors-panel">
                                <div className="colors-grid">
                                    {QUICK_COLORS.map(c => (
                                        <button key={c} className="color-dot" style={{ backgroundColor: c }} onClick={() => onFillChange?.(c)} />
                                    ))}
                                    <input type="color" className="native-color" onChange={(e) => setTempColor(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Estilo para Shapes/Imagens */
                    <div className="style-quick-tools">
                        <div
                            className={`expandable-tool ${activePanel === 'style' ? 'active' : ''}`}
                            onMouseEnter={() => handleMouseEnter('style')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button className="tool-trigger-btn main-action">
                                <Palette size={16} />
                            </button>
                            <div className="tool-dropdown-panel glass-panel style-panel">
                                <span className="panel-label">Preenchimento</span>
                                <div className="colors-grid mb">
                                    {QUICK_COLORS.map(c => (
                                        <button key={c} className="color-dot" style={{ backgroundColor: c }} onClick={() => onFillChange?.(c)} />
                                    ))}
                                </div>
                                {elementType === 'shape' && (
                                    <>
                                        <div className="panel-divider"></div>
                                        <span className="panel-label">Borda</span>
                                        <div className="stroke-row">
                                            <input type="color" className="native-color small" onChange={(e) => onStrokeChange?.(e.target.value)} />
                                            <input type="range" min="0" max="20" value={currentStrokeWidth} onChange={(e) => onStrokeWidthChange?.(parseInt(e.target.value))} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bar-divider"></div>

            {/* GRUPO 3: AÇÕES RÁPIDAS */}
            <div className="smart-group actions">
                <button className="icon-action-btn" onClick={onBringToFront} title="Trazer para Frente">
                    <ArrowUpToLine size={16} />
                </button>
                <button className="icon-action-btn" onClick={onSendToBack} title="Enviar para Trás">
                    <ArrowDownToLine size={16} />
                </button>
                <div className="bar-divider"></div>
                {onRemoveBackground && (
                    <button className="icon-action-btn wand" onClick={onRemoveBackground} title="Remover Fundo">
                        <Wand2 size={16} />
                    </button>
                )}
                {onTrim && (
                    <button className="icon-action-btn" onClick={onTrim} title="Aparar">
                        <Scissors size={16} />
                    </button>
                )}
                <button className="icon-action-btn" onClick={onDuplicate} title="Duplicar">
                    <Copy size={16} />
                </button>
                <button className="icon-action-btn danger" onClick={onDelete} title="Excluir">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default FloatingElementBar;
