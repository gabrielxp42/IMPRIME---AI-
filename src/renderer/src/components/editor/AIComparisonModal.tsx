import React, { useState, useEffect, useRef } from 'react';
import { X, Check, RotateCcw, ChevronLeft, ChevronRight, Split } from 'lucide-react';
import './AIComparisonModal.css';

interface AIComparisonModalProps {
    originalSrc: string;
    generatedSrc: string;
    onAccept: () => void;
    onRetry: () => void;
    onCancel: () => void;
}

const AIComparisonModal: React.FC<AIComparisonModalProps> = ({
    originalSrc,
    generatedSrc,
    onAccept,
    onRetry,
    onCancel
}) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: MouseEvent | React.MouseEvent) => {
        if (!isResizing && e.type !== 'mousemove') return; // Se não for evento de mousemove do window, ignorar se não estiver redimensionando
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = 'clientX' in e ? e.clientX : (e as any).touches[0].clientX;
        const position = ((x - rect.left) / rect.width) * 100;

        setSliderPos(Math.max(0, Math.min(100, position)));
    };

    useEffect(() => {
        const handleMouseUp = () => setIsResizing(false);
        const handleWindowMouseMove = (e: MouseEvent) => {
            if (isResizing) handleMouseMove(e);
        };

        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleWindowMouseMove);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleWindowMouseMove);
        };
    }, [isResizing]);

    return (
        <div className="ai-comparison-overlay">
            <div className="ai-comparison-modal">
                <div className="comparison-header">
                    <div className="header-info">
                        <Split className="header-icon" />
                        <div>
                            <h3>Revisar Edição IA</h3>
                            <p>Compare o resultado antes de aplicar ao projeto</p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="comparison-body">
                    <div
                        className="comparison-container"
                        ref={containerRef}
                        onMouseDown={() => setIsResizing(true)}
                    >
                        {/* Imagem Gerada (Abaixo) */}
                        <div className="image-after">
                            <img src={generatedSrc} alt="After" />
                            <div className="badge after">DEPOIS (IA)</div>
                        </div>

                        {/* Imagem Original (Acima, clipada) */}
                        <div
                            className="image-before"
                            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                            <img src={originalSrc} alt="Before" />
                            <div className="badge before">ANTES</div>
                        </div>

                        {/* Slider Handle */}
                        <div
                            className="slider-handle"
                            style={{ left: `${sliderPos}%` }}
                        >
                            <div className="handle-line"></div>
                            <div className="handle-button">
                                <ChevronLeft size={14} />
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="comparison-footer">
                    <div className="tips">
                        💡 Deslize o meio para comparar os detalhes
                    </div>
                    <div className="footer-actions">
                        <button className="btn-cancel" onClick={onCancel}>
                            Descartar
                        </button>
                        <button className="btn-retry" onClick={onRetry}>
                            <RotateCcw size={18} />
                            Tentar Novamente
                        </button>
                        <button className="btn-accept" onClick={onAccept}>
                            <Check size={18} />
                            Aceitar Resultado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIComparisonModal;
