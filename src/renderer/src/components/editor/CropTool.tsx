import React, { useState, useRef, useEffect } from 'react';
import { ImageElement } from '../../types/canvas-elements';
import './CropTool.css';

interface CropToolProps {
    image: ImageElement;
    onApply: (cropData: { x: number, y: number, width: number, height: number, src: string }) => void;
    onCancel: () => void;
}

const CropTool: React.FC<CropToolProps> = ({ image, onApply, onCancel }) => {
    // Coordenadas relativas à imagem (pixels da exibição atual)
    const [crop, setCrop] = useState({
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se'>('move');
    const startPos = useRef({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

    const handleMouseDown = (e: React.MouseEvent, type: typeof dragType = 'move') => {
        e.stopPropagation();
        setIsDragging(true);
        setDragType(type);
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            cropX: crop.x,
            cropY: crop.y,
            cropW: crop.width,
            cropH: crop.height
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;

            if (dragType === 'move') {
                const nextX = Math.max(0, Math.min(image.width - crop.width, startPos.current.cropX + dx));
                const nextY = Math.max(0, Math.min(image.height - crop.height, startPos.current.cropY + dy));
                setCrop(prev => ({ ...prev, x: nextX, y: nextY }));
            } else if (dragType === 'resize-se') {
                const nextW = Math.max(20, Math.min(image.width - crop.x, startPos.current.cropW + dx));
                const nextH = Math.max(20, Math.min(image.height - crop.y, startPos.current.cropH + dy));
                setCrop(prev => ({ ...prev, width: nextW, height: nextH }));
            }
            // Outros handles podem ser adicionados aqui
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragType, crop, image.width, image.height]);

    const handleApply = () => {
        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = image.src;
        img.onload = () => {
            // Desenha a porção recortada no canvas temporário
            ctx.drawImage(
                img,
                crop.x, crop.y, crop.width, crop.height, // Source
                0, 0, crop.width, crop.height // Target
            );

            const croppedSrc = canvas.toDataURL('image/png');
            onApply({
                ...crop,
                src: croppedSrc
            });
        };
    };

    return (
        <div className="crop-tool-overlay" onClick={onCancel}>
            <div
                className="crop-container"
                ref={containerRef}
                style={{
                    width: image.width,
                    height: image.height,
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: '100% 100%'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Escurecimento fora da área de crop */}
                <div className="crop-mask"></div>

                {/* Área de Seleção */}
                <div
                    className="crop-selection"
                    style={{
                        left: crop.x,
                        top: crop.y,
                        width: crop.width,
                        height: crop.height
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                    <div className="crop-grid">
                        <div className="grid-line v1"></div>
                        <div className="grid-line v2"></div>
                        <div className="grid-line h1"></div>
                        <div className="grid-line h2"></div>
                    </div>

                    {/* Handles */}
                    <div className="crop-handle nw" onMouseDown={(e) => handleMouseDown(e, 'resize-nw')}></div>
                    <div className="crop-handle ne" onMouseDown={(e) => handleMouseDown(e, 'resize-ne')}></div>
                    <div className="crop-handle sw" onMouseDown={(e) => handleMouseDown(e, 'resize-sw')}></div>
                    <div className="crop-handle se" onMouseDown={(e) => handleMouseDown(e, 'resize-se')}></div>
                </div>

                {/* Toolbar do Crop */}
                <div className="crop-actions">
                    <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
                    <button className="btn-apply" onClick={handleApply}>Aplicar Recorte</button>
                </div>
            </div>
        </div>
    );
};

export default CropTool;
