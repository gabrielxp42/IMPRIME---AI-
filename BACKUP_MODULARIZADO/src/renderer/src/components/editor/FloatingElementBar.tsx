/**
 * FloatingElementBar - Barra flutuante que segue o elemento selecionado
 * Mostra medidas e ações rápidas
 */

import React from 'react';
import './FloatingElementBar.css';

interface FloatingElementBarProps {
    // Posição (aceita ambos os formatos)
    x?: number;
    y?: number;
    elementCenterX?: number;
    elementBottomY?: number;
    // Dimensões
    width?: number;
    height?: number;
    currentWidth?: number;
    currentHeight?: number;
    widthCm?: number | string;
    heightCm?: number | string;
    // Callbacks
    onDimensionsChange?: (w: number, h: number) => void;
    onWidthChange?: (w: number) => void;
    onHeightChange?: (h: number) => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onRemoveBackground?: () => void;
    onTrim?: () => void;
}

const FloatingElementBar: React.FC<FloatingElementBarProps> = ({
    x,
    y,
    elementCenterX,
    elementBottomY,
    widthCm,
    heightCm,
    onDimensionsChange,
    onWidthChange,
    onHeightChange,
    onDuplicate,
    onDelete,
    onRemoveBackground,
    onTrim,
}) => {
    // Determinar posição (aceita x/y ou elementCenterX/elementBottomY)
    const posX = elementCenterX ?? x ?? 0;
    const posY = elementBottomY ?? y ?? 0;

    // Converter widthCm/heightCm para string
    const widthCmNum = typeof widthCm === 'string' ? parseFloat(widthCm) : (widthCm ?? 0);
    const heightCmNum = typeof heightCm === 'string' ? parseFloat(heightCm) : (heightCm ?? 0);

    const [w, setW] = React.useState(widthCmNum.toFixed(1));
    const [h, setH] = React.useState(heightCmNum.toFixed(1));
    const [locked, setLocked] = React.useState(true);

    // Atualizar inputs quando o objeto é redimensionado externamente
    React.useEffect(() => {
        if (document.activeElement?.tagName !== 'INPUT') {
            setW(widthCmNum.toFixed(1));
            setH(heightCmNum.toFixed(1));
        }
    }, [widthCmNum, heightCmNum]);

    const handleWChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newW = e.target.value;
        setW(newW);

        if (locked && !isNaN(parseFloat(newW)) && widthCmNum > 0) {
            const ratio = heightCmNum / widthCmNum;
            setH((parseFloat(newW) * ratio).toFixed(1));
        }
    };

    const handleHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newH = e.target.value;
        setH(newH);

        if (locked && !isNaN(parseFloat(newH)) && heightCmNum > 0) {
            const ratio = widthCmNum / heightCmNum;
            setW((parseFloat(newH) * ratio).toFixed(1));
        }
    };

    const applyChanges = () => {
        const numW = parseFloat(w);
        const numH = parseFloat(h);
        if (!isNaN(numW) && !isNaN(numH) && numW > 0 && numH > 0) {
            // Suporta ambos os formatos de callback
            if (onDimensionsChange) {
                onDimensionsChange(numW, numH);
            } else {
                onWidthChange?.(numW);
                onHeightChange?.(numH);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyChanges();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div
            className="floating-element-bar"
            style={{
                left: `${posX}px`,
                top: `${posY}px`,
            }}
        >
            {/* Medidas Editáveis */}
            <div className="element-measures-inputs">
                <div className="input-group">
                    <span className="input-label">L</span>
                    <input
                        type="text"
                        value={w}
                        onChange={handleWChange}
                        onBlur={applyChanges}
                        onKeyDown={handleKeyDown}
                        className="measure-input"
                    />
                    <span className="measure-unit">cm</span>
                </div>

                <button
                    className={`lock-btn ${locked ? 'locked' : ''}`}
                    onClick={() => setLocked(!locked)}
                    title={locked ? "Proporção bloqueada" : "Proporção desbloqueada"}
                >
                    {locked ? '🔒' : '🔓'}
                </button>

                <div className="input-group">
                    <span className="input-label">A</span>
                    <input
                        type="text"
                        value={h}
                        onChange={handleHChange}
                        onBlur={applyChanges}
                        onKeyDown={handleKeyDown}
                        className="measure-input"
                    />
                    <span className="measure-unit">cm</span>
                </div>
            </div>

            {/* Separador */}
            <div className="bar-separator"></div>

            {/* Ações */}
            <div className="element-actions">
                {onTrim && (
                    <button
                        className="action-btn"
                        onClick={onTrim}
                        title="Aparar Transparência (Trim)"
                    >
                        ✂️
                    </button>
                )}
                {onDuplicate && (
                    <button
                        className="action-btn"
                        onClick={onDuplicate}
                        title="Duplicar"
                    >
                        📋
                    </button>
                )}
                {onRemoveBackground && (
                    <button
                        className="action-btn remove-bg"
                        onClick={onRemoveBackground}
                        title="Remover fundo"
                    >
                        🎯
                    </button>
                )}
                {onDelete && (
                    <button
                        className="action-btn delete"
                        onClick={onDelete}
                        title="Excluir"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
};

export default FloatingElementBar;
