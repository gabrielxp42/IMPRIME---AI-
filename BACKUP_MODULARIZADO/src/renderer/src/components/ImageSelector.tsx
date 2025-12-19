import React, { useRef, useState, useEffect } from 'react';
import './ImageSelector.css';

export interface SelectionData {
    type: 'point' | 'box';
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

interface ImageSelectorProps {
    imagePath: string;
    onConfirm: (selection: SelectionData) => void;
    onCancel: () => void;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({ imagePath, onConfirm, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<'point' | 'box'>('point');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
    const [pointMarker, setPointMarker] = useState<{ x: number; y: number } | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Ajustar canvas ao tamanho da imagem
            canvas.width = img.width;
            canvas.height = img.height;

            imageRef.current = img;
            setImageLoaded(true);
            redraw(ctx, img);
        };

        // Converter caminho para usar protocolo media:// que é seguro e trata caracteres especiais
        const safePath = imagePath.replace(/\\/g, '/');
        // Se já começar com media://, file:// ou http, respeitar. Senão, assumir media://
        if (imagePath.startsWith('media://') || imagePath.startsWith('http')) {
            img.src = imagePath;
        } else if (imagePath.startsWith('file://')) {
            img.src = imagePath.replace('file://', 'media://');
        } else {
            img.src = `media://${safePath}`;
        }
    }, [imagePath]);

    const redraw = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
        // Limpar canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Desenhar imagem
        ctx.drawImage(img, 0, 0);

        // Desenhar marcador de ponto
        if (mode === 'point' && pointMarker) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(pointMarker.x, pointMarker.y, 10, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Desenhar retângulo de seleção
        if (mode === 'box' && startPos && currentPos) {
            const width = currentPos.x - startPos.x;
            const height = currentPos.y - startPos.y;

            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(startPos.x, startPos.y, width, height);

            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(startPos.x, startPos.y, width, height);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (mode === 'point') {
            setPointMarker({ x, y });
            const ctx = canvas.getContext('2d');
            if (ctx) redraw(ctx, imageRef.current);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (mode !== 'box') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || mode !== 'box') return;

        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setCurrentPos({ x, y });

        const ctx = canvas.getContext('2d');
        if (ctx) redraw(ctx, imageRef.current);
    };

    const handleMouseUp = () => {
        if (mode === 'box') {
            setIsDrawing(false);
        }
    };

    const handleConfirm = () => {
        if (mode === 'point' && pointMarker) {
            onConfirm({
                type: 'point',
                x: Math.round(pointMarker.x),
                y: Math.round(pointMarker.y)
            });
        } else if (mode === 'box' && startPos && currentPos) {
            onConfirm({
                type: 'box',
                x1: Math.round(Math.min(startPos.x, currentPos.x)),
                y1: Math.round(Math.min(startPos.y, currentPos.y)),
                x2: Math.round(Math.max(startPos.x, currentPos.x)),
                y2: Math.round(Math.max(startPos.y, currentPos.y))
            });
        }
    };

    const canConfirm = (mode === 'point' && pointMarker) || (mode === 'box' && startPos && currentPos);

    return (
        <div className="image-selector-overlay">
            <div className="image-selector-container">
                <div className="image-selector-header">
                    <h3>🎯 Selecione o Objeto para Manter</h3>
                    <button className="btn-close" onClick={onCancel}>✕</button>
                </div>

                <div className="image-selector-toolbar">
                    <button
                        className={`btn-mode ${mode === 'point' ? 'active' : ''}`}
                        onClick={() => {
                            setMode('point');
                            setStartPos(null);
                            setCurrentPos(null);
                        }}
                    >
                        📍 Modo Ponto
                    </button>
                    <button
                        className={`btn-mode ${mode === 'box' ? 'active' : ''}`}
                        onClick={() => {
                            setMode('box');
                            setPointMarker(null);
                        }}
                    >
                        ▭ Modo Caixa
                    </button>
                    <div className="mode-hint">
                        {mode === 'point'
                            ? '💡 Clique no objeto que deseja manter'
                            : '💡 Desenhe um retângulo ao redor do objeto'}
                    </div>
                </div>

                <div className="image-selector-canvas-wrapper">
                    {!imageLoaded && <div className="loading-spinner">Carregando imagem...</div>}
                    <canvas
                        ref={canvasRef}
                        className="image-selector-canvas"
                        onClick={handleCanvasClick}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{ cursor: mode === 'point' ? 'crosshair' : 'crosshair' }}
                    />
                </div>

                <div className="image-selector-actions">
                    <button className="btn-cancel" onClick={onCancel}>
                        ❌ Cancelar
                    </button>
                    <button
                        className="btn-confirm"
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                    >
                        ✅ Confirmar Seleção
                    </button>
                </div>
            </div>
        </div>
    );
};
