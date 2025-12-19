/**
 * Konva Canvas Component - Editor Premium COMPLETO
 * Canvas para edição de imagens com:
 * - Seleção e transformação
 * - Shift para restringir movimento (horizontal/vertical/diagonal)
 * - Alt para duplicar ao arrastar
 * - Proporções em tempo real
 * - Drag & Drop de arquivos externos
 * - Snapping (Guias Inteligentes)
 * - Máscara Visual (Overlay) estilo Photoshop
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Group, Line, Path } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import FloatingElementBar from './FloatingElementBar';
import { getLineGuideStops, getObjectSnappingEdges, getGuides, SnapLine } from '../../utils/snapping';

interface KonvaCanvasProps {
    width: number;
    height: number;
    images: ImageElement[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onTransform: (id: string, attrs: Partial<ImageElement>) => void;
    backgroundColor?: 'transparent' | '#ffffff' | '#000000' | string;
    dpi?: number;
    onDuplicate?: (keepOriginalSelection?: boolean) => void;
    onDelete?: () => void;
    onRemoveBackground?: () => void;
    onTrim?: (id: string) => void;
    onAddImage?: (file: File) => void;
}

export interface ImageElement {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    visible: boolean;
    locked: boolean;
    name?: string;
}

// Componente para renderizar APENAS a imagem
const URLImage: React.FC<{
    image: ImageElement;
    isSelected: boolean;
    onSelect: () => void;
    onTransform: (attrs: Partial<ImageElement>) => void;
    onDuplicate?: (keepOriginalSelection?: boolean) => void;
    isShiftPressed: boolean;
    onGuidesChange: (guides: SnapLine[]) => void;
}> = ({ image, isSelected, onSelect, onTransform, onDuplicate, isShiftPressed, onGuidesChange }) => {
    const imageRef = useRef<Konva.Image>(null);
    const [img] = useImage(image.src, 'anonymous');
    const dragStartPos = useRef({ x: 0, y: 0 });

    // Handler para início do drag
    const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        dragStartPos.current = { x: e.target.x(), y: e.target.y() };

        // Alt para duplicar
        if (e.evt.altKey && onDuplicate) {
            onDuplicate(true);
        }

        // Selecionar ao iniciar drag
        onSelect();
    };

    // Handler durante o drag para restringir com Shift e Snapping
    const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target as Konva.Shape;
        const stage = node.getStage();

        // Limpar guias anteriores
        onGuidesChange([]);

        if (!stage) return;

        // Lógica de Shift (Restrição de Eixo)
        if (isShiftPressed) {
            const startX = dragStartPos.current.x;
            const startY = dragStartPos.current.y;
            const dx = node.x() - startX;
            const dy = node.y() - startY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            // Detectar se é movimento diagonal
            const isDiagonal = Math.abs(absDx - absDy) < Math.max(absDx, absDy) * 0.3;

            if (isDiagonal && absDx > 20 && absDy > 20) {
                const dist = (absDx + absDy) / 2;
                const signX = dx > 0 ? 1 : -1;
                const signY = dy > 0 ? 1 : -1;
                node.x(startX + dist * signX);
                node.y(startY + dist * signY);
            } else if (absDx > absDy) {
                node.y(startY);
            } else {
                node.x(startX);
            }
            return; // Se usar Shift, não usa Snapping
        }

        // Lógica de Snapping
        const lineGuideStops = getLineGuideStops(node, stage);
        const itemBounds = getObjectSnappingEdges(node);
        const guides = getGuides(lineGuideStops, itemBounds);

        if (guides.length === 0) return;

        const absPos = node.absolutePosition();

        guides.forEach((lg) => {
            if (lg.vertical) {
                const newX = lg.start + lg.offset;
                if (Number.isFinite(newX)) absPos.x = newX;
            } else {
                const newY = lg.start + lg.offset;
                if (Number.isFinite(newY)) absPos.y = newY;
            }
        });

        if (Number.isFinite(absPos.x) && Number.isFinite(absPos.y)) {
            node.absolutePosition(absPos);
            onGuidesChange(guides);
        }
    };

    // Handler para transformação em tempo real
    const handleTransform = () => {
        const node = imageRef.current;
        if (!node) return;

        // Atualizar em tempo real para mostrar proporções
        onTransform({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
        });
    };

    // Handler para fim do drag
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        onGuidesChange([]); // Limpar guias ao soltar
        onTransform({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    // Handler para fim da transformação
    const handleTransformEnd = () => {
        const node = imageRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale e aplicar ao width/height
        node.scaleX(1);
        node.scaleY(1);

        onTransform({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
            scaleX: 1,
            scaleY: 1,
        });
    };

    if (!image.visible) return null;

    return (
        <KonvaImage
            ref={imageRef}
            name="object" // Importante para o snapping encontrar
            image={img}
            id={image.id}
            x={image.x}
            y={image.y}
            width={image.width}
            height={image.height}
            rotation={image.rotation}
            scaleX={image.scaleX}
            scaleY={image.scaleY}
            draggable={!image.locked}
            onClick={(e) => {
                e.cancelBubble = true;
                onSelect();
            }}
            onTap={(e) => {
                e.cancelBubble = true;
                onSelect();
            }}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
        />
    );
};

// Fundo xadrez para transparência
const CheckerboardBackground: React.FC<{ width: number; height: number }> = ({ width, height }) => {
    const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        const size = 20;
        const canvas = document.createElement('canvas');
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, size * 2, size * 2);
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(0, 0, size, size);
            ctx.fillRect(size, size, size, size);
        }
        const img = new Image();
        img.onload = () => setPatternImage(img);
        img.src = canvas.toDataURL();
    }, []);

    if (!patternImage) {
        return (
            <Rect
                name="background-rect"
                x={0}
                y={0}
                width={width}
                height={height}
                fill="#d0d0d0"
            />
        );
    }

    return (
        <Rect
            name="background-rect"
            x={0}
            y={0}
            width={width}
            height={height}
            fillPatternImage={patternImage}
            fillPatternRepeat="repeat"
        />
    );
};

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
    width,
    height,
    images,
    selectedId,
    onSelect,
    onTransform,
    backgroundColor = 'transparent',
    dpi = 300,
    onDuplicate,
    onDelete,
    onRemoveBackground,
    onTrim,
    onAddImage,
}) => {
    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [guides, setGuides] = useState<SnapLine[]>([]);

    // Efeito para conectar o Transformer ao objeto selecionado
    useEffect(() => {
        if (selectedId && transformerRef.current && stageRef.current) {
            const selectedNode = stageRef.current.findOne('#' + selectedId);
            if (selectedNode) {
                transformerRef.current.nodes([selectedNode]);
                transformerRef.current.getLayer()?.batchDraw();
            } else {
                transformerRef.current.nodes([]);
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
        }
    }, [selectedId, images]); // Re-executar quando imagens mudarem para garantir que o node existe

    // Monitorar tecla Shift
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Atualizar tamanho do container
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Calcular escala inicial para caber na tela
    useEffect(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth - 100;
            const containerHeight = containerRef.current.offsetHeight - 100;
            const scaleX = containerWidth / width;
            const scaleY = containerHeight / height;
            const newScale = Math.min(scaleX, scaleY, 1);
            setScale(newScale);

            const newX = (containerRef.current.offsetWidth - width * newScale) / 2;
            const newY = (containerRef.current.offsetHeight - height * newScale) / 2;
            setStagePos({ x: newX, y: newY });
        }
    }, [width, height, containerSize]);

    // Zoom com scroll do mouse
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = scale;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stagePos.x) / oldScale,
            y: (pointer.y - stagePos.y) / oldScale,
        };

        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.1, Math.min(5, newScale));

        setScale(clampedScale);
        setStagePos({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        });
    }, [scale, stagePos]);

    // Deselecionar ao clicar no fundo
    const checkDeselect = useCallback(
        (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
            const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-rect';
            if (clickedOnEmpty) {
                onSelect(null);
            }
        },
        [onSelect]
    );

    // Drag & Drop de arquivos externos
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0 && onAddImage) {
            files.forEach(file => onAddImage(file));
        }
    };

    // Encontrar imagem selecionada para barra flutuante
    const selectedImage = images.find((img) => img.id === selectedId);

    // Converter pixels para cm
    const pxToCm = (px: number) => ((px / dpi) * 2.54).toFixed(2);

    // Converter cm para pixels
    const cmToPx = (cm: number) => (cm / 2.54) * dpi;

    // Props para a barra flutuante
    const floatingBarProps = selectedImage
        ? {
            elementCenterX: (selectedImage.x + (selectedImage.width * selectedImage.scaleX) / 2) * scale + stagePos.x,
            elementBottomY: (selectedImage.y + selectedImage.height * selectedImage.scaleY) * scale + stagePos.y + 20,
            currentWidth: selectedImage.width * selectedImage.scaleX,
            currentHeight: selectedImage.height * selectedImage.scaleY,
            widthCm: pxToCm(selectedImage.width * selectedImage.scaleX),
            heightCm: pxToCm(selectedImage.height * selectedImage.scaleY),
            onWidthChange: (newW: number) => {
                // newW vem em cm, converter para pixels
                if (selectedId) onTransform(selectedId, { width: cmToPx(newW), scaleX: 1 });
            },
            onHeightChange: (newH: number) => {
                // newH vem em cm, converter para pixels
                if (selectedId) onTransform(selectedId, { height: cmToPx(newH), scaleY: 1 });
            },
            onDimensionsChange: (newW: number, newH: number) => {
                // Ambos vêm em cm
                if (selectedId) onTransform(selectedId, {
                    width: cmToPx(newW),
                    height: cmToPx(newH),
                    scaleX: 1,
                    scaleY: 1
                });
            },
            onDuplicate: onDuplicate ? () => onDuplicate() : undefined,
            onDelete,
            onRemoveBackground,
            onTrim: onTrim && selectedId ? () => onTrim(selectedId) : undefined,
        }
        : null;

    return (
        <div
            ref={containerRef}
            className={`konva-canvas-container ${isDraggingFile ? 'dragging-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Overlay de drop */}
            {isDraggingFile && (
                <div className="canvas-drop-overlay">
                    <div className="drop-indicator">
                        <span>📁</span>
                        <p>Solte a imagem aqui</p>
                    </div>
                </div>
            )}

            <Stage
                ref={stageRef}
                width={containerSize.width}
                height={containerSize.height}
                scaleX={scale}
                scaleY={scale}
                x={stagePos.x}
                y={stagePos.y}
                onWheel={handleWheel}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                draggable
                onDragEnd={(e) => {
                    // Só atualiza a posição do stage se o próprio stage foi arrastado
                    // Isso evita que o stage "pule" quando arrastamos uma imagem interna
                    if (e.target === e.target.getStage()) {
                        setStagePos({
                            x: e.target.x(),
                            y: e.target.y(),
                        });
                    }
                }}
            >
                <Layer>
                    {/* Background e Imagens (SEM CLIP) */}
                    <Group>
                        {/* Background */}
                        <Group>
                            {backgroundColor === 'transparent' ? (
                                <CheckerboardBackground width={width} height={height} />
                            ) : (
                                <Rect
                                    name="background-rect"
                                    x={0}
                                    y={0}
                                    width={width}
                                    height={height}
                                    fill={backgroundColor}
                                />
                            )}
                        </Group>

                        {/* Imagens */}
                        {images.map((image) => (
                            <URLImage
                                key={image.id}
                                image={image}
                                isSelected={image.id === selectedId}
                                onSelect={() => onSelect(image.id)}
                                onTransform={(attrs) => onTransform(image.id, attrs)}
                                onDuplicate={onDuplicate}
                                isShiftPressed={isShiftPressed}
                                onGuidesChange={setGuides}
                            />
                        ))}
                    </Group>

                    {/* MÁSCARA VISUAL (Artboard Mask) - Cobre o que está fora */}
                    {/* Cria um retângulo gigante com um "buraco" no meio do tamanho do documento */}
                    <Path
                        data={`M -50000 -50000 L 50000 -50000 L 50000 50000 L -50000 50000 Z M 0 0 L 0 ${height || 1} L ${width || 1} ${height || 1} L ${width || 1} 0 Z`}
                        fill="#1e1e24" // Mesma cor do fundo do editor
                        fillRule="evenodd"
                        listening={false} // Não bloqueia cliques
                    />

                    {/* Transformer Global (Sempre visível sobre a máscara) */}
                    <Transformer
                        ref={transformerRef}
                        flipEnabled={false}
                        rotateEnabled={true}
                        keepRatio={false}
                        enabledAnchors={[
                            'top-left', 'top-center', 'top-right',
                            'middle-left', 'middle-right',
                            'bottom-left', 'bottom-center', 'bottom-right'
                        ]}
                        boundBoxFunc={(oldBox, newBox) => {
                            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                    />

                    {/* Linhas Guia (Snapping) - Corrigido para considerar Zoom e Pan */}
                    {guides.map((guide, i) => {
                        // Converter posição absoluta para posição relativa ao stage transformado
                        const guidePos = guide.vertical
                            ? (guide.start - stagePos.x) / scale
                            : (guide.start - stagePos.y) / scale;

                        if (guide.vertical) {
                            return (
                                <Line
                                    key={i}
                                    points={[guidePos, -60000, guidePos, 60000]}
                                    stroke="rgb(0, 161, 255)"
                                    strokeWidth={1 / scale}
                                    dash={[4 / scale, 6 / scale]}
                                />
                            );
                        } else {
                            return (
                                <Line
                                    key={i}
                                    points={[-60000, guidePos, 60000, guidePos]}
                                    stroke="rgb(0, 161, 255)"
                                    strokeWidth={1 / scale}
                                    dash={[4 / scale, 6 / scale]}
                                />
                            );
                        }
                    })}
                </Layer>
            </Stage>

            {/* Barra Flutuante */}
            {floatingBarProps && (
                <FloatingElementBar {...floatingBarProps} />
            )}
        </div>
    );
};

export default KonvaCanvas;
