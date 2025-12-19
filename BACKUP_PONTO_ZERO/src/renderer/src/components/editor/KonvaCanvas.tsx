/**
 * Konva Canvas Component - Editor Premium COMPLETO
 * Canvas para edição de imagens com:
 * - Seleção e transformação
 * - Shift para restringir movimento (horizontal/vertical/diagonal)
 * - Alt para duplicar ao arrastar (PADRÃO OFICIAL KONVA)
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
import { getLineGuideStops, getObjectSnappingEdges, getGuides, SnapLine, getSpacingGuides, SpacingGuide } from '../../utils/snapping';

interface KonvaCanvasProps {
    width: number;
    height: number;
    images: ImageElement[];
    selectedId: string | null;
    selectedIds?: string[];
    onSelect: (id: string | null) => void;
    onSelectMultiple?: (ids: string[]) => void;
    onTransform: (id: string, attrs: Partial<ImageElement>) => void;
    backgroundColor?: 'transparent' | '#ffffff' | '#000000' | string;
    dpi?: number;
    onDuplicate?: (options?: { x?: number; y?: number; sourceId?: string }) => void;
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
    images: ImageElement[]; // Todas as imagens para referência
    isSelected: boolean;
    selectedIds?: string[];
    onSelect: (isCtrlPressed: boolean) => void;
    onSelectMultiple?: (ids: string[]) => void;
    onTransform: (attrs: Partial<ImageElement>) => void;
    onTransformById: (id: string, attrs: Partial<ImageElement>) => void; // Para múltipla seleção
    onDuplicate?: (options?: { x?: number; y?: number; sourceId?: string }) => void;
    isShiftPressed: boolean;
    onGuidesChange: (guides: SnapLine[]) => void;
    onSpacingGuidesChange: (guides: SpacingGuide[]) => void;
}> = ({ image, images, isSelected, selectedIds, onSelect, onSelectMultiple, onTransform, onTransformById, onDuplicate, isShiftPressed, onGuidesChange, onSpacingGuidesChange }) => {
    const imageRef = useRef<Konva.Image>(null);
    const [img] = useImage(image.src, 'anonymous');
    const dragStartPos = useRef({ x: 0, y: 0 });

    // Handler para início do drag - PADRÃO OFICIAL KONVA para duplicar
    const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        dragStartPos.current = { x: e.target.x(), y: e.target.y() };

        // Se há múltiplos selecionados, armazenar posição inicial de TODOS
        const stage = e.target.getStage();
        if (stage && selectedIds && selectedIds.length > 1) {
            selectedIds.forEach(id => {
                const node = stage.findOne('#' + id);
                if (node) {
                    (node as any)._dragStartPos = { x: node.x(), y: node.y() };
                }
            });
        }

        console.log('[ALT+DRAG] DragStart, altKey:', e.evt.altKey);

        // Alt + Drag = DUPLICAR (seguindo documentação oficial Konva)
        if (e.evt.altKey && imageRef.current && onDuplicate) {
            console.log('[ALT+DRAG] Iniciando duplicação...');

            const originalNode = imageRef.current;
            const layer = originalNode.getLayer();

            if (layer) {
                // 1. PARAR o drag do original (API oficial Konva)
                originalNode.stopDrag();
                console.log('[ALT+DRAG] Original parado');

                // 2. CRIAR CLONE com overrides (API oficial Konva)
                const clone = originalNode.clone({
                    x: originalNode.x(),
                    y: originalNode.y(),
                    draggable: true,
                    opacity: 0.7,
                    name: 'temp-clone',
                    id: 'temp-clone-' + Date.now()
                });
                console.log('[ALT+DRAG] Clone criado');

                // 3. ADICIONAR clone ao layer
                layer.add(clone);
                console.log('[ALT+DRAG] Clone adicionado ao layer');

                // 3.5 ADICIONAR SNAPPING ao clone durante drag
                const cloneStartPos = { x: clone.x(), y: clone.y() };
                clone.on('dragmove', () => {
                    const stage = clone.getStage();
                    if (!stage) return;

                    // Shift constraint (restringir eixo)
                    if (isShiftPressed) {
                        const dx = clone.x() - cloneStartPos.x;
                        const dy = clone.y() - cloneStartPos.y;
                        const absDx = Math.abs(dx);
                        const absDy = Math.abs(dy);

                        if (absDx > absDy) {
                            clone.y(cloneStartPos.y); // Horizontal
                        } else {
                            clone.x(cloneStartPos.x); // Vertical
                        }
                    }

                    // Snapping (Guias Inteligentes)
                    const lineGuideStops = getLineGuideStops(clone as unknown as Konva.Shape, stage);
                    const itemBounds = getObjectSnappingEdges(clone as Konva.Shape);
                    const guides = getGuides(lineGuideStops, itemBounds);

                    const absPos = clone.absolutePosition();
                    guides.forEach((lg) => {
                        if (lg.start !== undefined && lg.offset !== undefined) {
                            if (lg.vertical) {
                                absPos.x = lg.start + lg.offset;
                            } else {
                                absPos.y = lg.start + lg.offset;
                            }
                        }
                    });

                    if (Number.isFinite(absPos.x) && Number.isFinite(absPos.y)) {
                        clone.absolutePosition(absPos);
                        onGuidesChange(guides); // Mostrar linhas azuis
                    }
                });

                // 4. INICIAR DRAG no clone (API oficial Konva)
                clone.startDrag();
                console.log('[ALT+DRAG] Drag iniciado no clone');

                // 5. Quando o clone terminar o drag, sincronizar com React
                clone.on('dragend', () => {
                    console.log('[ALT+DRAG] Clone dragend, posição:', clone.x(), clone.y());

                    // Limpar guias
                    onGuidesChange([]);

                    // Salvar posição antes de destruir
                    const finalX = clone.x();
                    const finalY = clone.y();

                    // Destruir clone visual (React vai criar o real)
                    clone.destroy();
                    layer.batchDraw();

                    // Chamar duplicação do React COM A POSIÇÃO FINAL E O ID
                    console.log('[ALT+DRAG] Chamando onDuplicate com posição e ID:', finalX, finalY, image.id);
                    onDuplicate({ x: finalX, y: finalY, sourceId: image.id });
                });

                layer.batchDraw();
                return; // Sair - clone está sendo arrastado
            }
        }

        // Selecionar ao iniciar drag normal
        onSelect(false);
    };

    // Handler durante o drag para Shift (restringir eixo) e Snapping
    const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target as Konva.Shape;
        const stage = node.getStage();

        onGuidesChange([]); // Limpar guias anteriores
        onSpacingGuidesChange([]); // Limpar guias de espaçamento

        if (!stage) return;

        // Se há múltiplos selecionados, mover TODOS juntos
        if (selectedIds && selectedIds.length > 1 && selectedIds.includes(image.id)) {
            const dx = node.x() - dragStartPos.current.x;
            const dy = node.y() - dragStartPos.current.y;

            // Mover todos os outros nodes selecionados pelo mesmo delta
            selectedIds.forEach(id => {
                if (id !== image.id) {
                    const otherNode = stage.findOne('#' + id);
                    if (otherNode) {
                        // Obter posição original armazenada no dragStart
                        const originalPos = (otherNode as any)._dragStartPos;
                        if (originalPos) {
                            otherNode.x(originalPos.x + dx);
                            otherNode.y(originalPos.y + dy);
                        }
                    }
                }
            });
            return;
        }

        // SHIFT = Restringir movimento (como Photoshop)
        if (isShiftPressed) {
            const startX = dragStartPos.current.x;
            const startY = dragStartPos.current.y;
            const dx = node.x() - startX;
            const dy = node.y() - startY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (absDx > absDy) {
                // Movimento predominantemente Horizontal - travar Y
                node.y(startY);
            } else {
                // Movimento predominantemente Vertical - travar X
                node.x(startX);
            }
        }

        // SNAPPING (Guias Inteligentes - linhas roxas)
        const lineGuideStops = getLineGuideStops(node as Konva.Shape, stage);
        const itemBounds = getObjectSnappingEdges(node);
        const guides = getGuides(lineGuideStops, itemBounds);

        const absPos = node.absolutePosition();
        guides.forEach((lg) => {
            if (lg.start !== undefined && lg.offset !== undefined) {
                if (lg.vertical) {
                    absPos.x = lg.start + lg.offset;
                } else {
                    absPos.y = lg.start + lg.offset;
                }
            }
        });

        if (Number.isFinite(absPos.x) && Number.isFinite(absPos.y)) {
            node.absolutePosition(absPos);
            onGuidesChange(guides);
        }

        // SMART SPACING - Mostrar quando espaçamento é igual
        const spacingGuides = getSpacingGuides(node as Konva.Shape, stage);
        onSpacingGuidesChange(spacingGuides);
    };

    // Handler para transformação em tempo real
    const handleTransform = () => {
        const node = imageRef.current;
        if (!node) return;

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
        onGuidesChange([]); // Limpar guias
        onSpacingGuidesChange([]); // Limpar guias de espaçamento

        const stage = e.target.getStage();

        // Se há múltiplos selecionados, sincronizar TODOS com React
        if (selectedIds && selectedIds.length > 1 && stage) {
            selectedIds.forEach(id => {
                const node = stage.findOne('#' + id);
                if (node) {
                    onTransformById(id, {
                        x: node.x(),
                        y: node.y(),
                    });
                }
            });
            return;
        }

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
            name="object"
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
                const isShift = e.evt.shiftKey;
                const isCtrl = e.evt.ctrlKey || e.evt.metaKey;

                if (isShift && onSelectMultiple) {
                    const currentIds = selectedIds || [];
                    const newIds = currentIds.includes(image.id)
                        ? currentIds.filter((id: string) => id !== image.id)
                        : [...currentIds, image.id];
                    onSelectMultiple(newIds);
                } else {
                    onSelect(isCtrl);
                }
            }}
            onTap={(e) => {
                e.cancelBubble = true;
                onSelect(false);
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
    selectedIds,
    onSelect,
    onSelectMultiple,
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
    const [spacingGuides, setSpacingGuides] = useState<SpacingGuide[]>([]); // Smart Spacing
    const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const selectionStartPos = useRef<{ x: number, y: number } | null>(null);

    // Efeito para conectar o Transformer aos objetos selecionados
    useEffect(() => {
        if (transformerRef.current && stageRef.current) {
            const currentImageIds = new Set(images.map(img => img.id));
            const idsToCheck = selectedIds && selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
            const validIdsToSelect = idsToCheck.filter(id => currentImageIds.has(id));

            try {
                if (validIdsToSelect.length > 0) {
                    const selectedNodes = validIdsToSelect
                        .map(id => stageRef.current!.findOne('#' + id))
                        .filter((node): node is Konva.Node => node !== undefined && node !== null && node.parent !== null);

                    transformerRef.current.nodes(selectedNodes);
                    transformerRef.current.getLayer()?.batchDraw();
                } else {
                    transformerRef.current.nodes([]);
                }
            } catch (error) {
                console.warn('Erro ao conectar transformer:', error);
                transformerRef.current.nodes([]);
            }
        }
    }, [selectedId, selectedIds, images]);

    // Detectar teclas Shift
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

    // Redimensionar container
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

    // Calcular escala inicial
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

        let direction = e.evt.deltaY > 0 ? -1 : 1;
        const delta = Math.abs(e.evt.deltaY);
        const speed = delta > 100 ? 0.15 : 0.08;
        const scaleBy = 1 + (speed * direction);
        let newScale = oldScale * scaleBy;
        newScale = Math.max(0.05, Math.min(10, newScale));
        if (Math.abs(newScale - 1) < 0.05) newScale = 1;

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setScale(newScale);
        setStagePos(newPos);
    }, [scale, stagePos]);

    // Atalhos de teclado para zoom
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!stageRef.current) return;
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                setScale(s => Math.min(10, s * 1.2));
            } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
                e.preventDefault();
                setScale(s => Math.max(0.05, s / 1.2));
            } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                setScale(1);
                if (containerRef.current) {
                    const newX = (containerRef.current.offsetWidth - width) / 2;
                    const newY = (containerRef.current.offsetHeight - height) / 2;
                    setStagePos({ x: newX, y: newY });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scale, width, height]);

    // Deselecionar ao clicar no fundo
    const checkDeselect = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-rect';
        if (clickedOnEmpty) {
            onSelect(null);
        }
    }, [onSelect]);

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

        const files = e.dataTransfer.files;
        if (files.length > 0 && onAddImage) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    onAddImage(file);
                }
            });
        }
    };

    // Box selection handlers - SÓ ativa com SHIFT pressionado
    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Caixa de seleção SÓ com Shift pressionado
        if (!isShiftPressed) return;

        const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-rect';
        if (!clickedOnEmpty) return;

        const stage = stageRef.current;
        if (!stage) return;

        // Desativar drag do Stage durante seleção
        stage.draggable(false);

        const pos = stage.getPointerPosition();
        if (!pos) return;

        const relativePos = {
            x: (pos.x - stagePos.x) / scale,
            y: (pos.y - stagePos.y) / scale,
        };

        selectionStartPos.current = relativePos;
        setSelectionRect({ x: relativePos.x, y: relativePos.y, width: 0, height: 0 });
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!selectionStartPos.current) return;

        const stage = stageRef.current;
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        const relativePos = {
            x: (pos.x - stagePos.x) / scale,
            y: (pos.y - stagePos.y) / scale,
        };

        const x = Math.min(selectionStartPos.current.x, relativePos.x);
        const y = Math.min(selectionStartPos.current.y, relativePos.y);
        const w = Math.abs(relativePos.x - selectionStartPos.current.x);
        const h = Math.abs(relativePos.y - selectionStartPos.current.y);

        setSelectionRect({ x, y, width: w, height: h });
    };

    const handleStageMouseUp = () => {
        if (selectionRect && selectionRect.width > 5 && selectionRect.height > 5 && onSelectMultiple) {
            const selectedImages = images.filter(img => {
                const imgRight = img.x + img.width * img.scaleX;
                const imgBottom = img.y + img.height * img.scaleY;
                const rectRight = selectionRect.x + selectionRect.width;
                const rectBottom = selectionRect.y + selectionRect.height;

                return img.x < rectRight && imgRight > selectionRect.x &&
                    img.y < rectBottom && imgBottom > selectionRect.y;
            });

            if (selectedImages.length > 0) {
                onSelectMultiple(selectedImages.map(img => img.id));
            }
        }

        // Reativar drag do Stage
        const stage = stageRef.current;
        if (stage) {
            stage.draggable(true);
        }

        selectionStartPos.current = null;
        setSelectionRect(null);
    };

    // Props para barra flutuante - CALCULAR POSIÇÃO CORRETA
    const selectedImage = selectedId ? images.find(img => img.id === selectedId) : null;
    const floatingBarProps = selectedImage
        ? (() => {
            // Calcular dimensões reais do elemento
            const elemWidth = selectedImage.width * selectedImage.scaleX;
            const elemHeight = selectedImage.height * selectedImage.scaleY;

            // Calcular posição na tela (considerando zoom e pan)
            const screenX = selectedImage.x * scale + stagePos.x;
            const screenY = selectedImage.y * scale + stagePos.y;
            const screenWidth = elemWidth * scale;
            const screenHeight = elemHeight * scale;

            // Centro X do elemento na tela
            const centerX = screenX + screenWidth / 2;
            // Posição Y abaixo do elemento (com margem de 10px)
            const bottomY = screenY + screenHeight + 10;

            return {
                elementCenterX: centerX,
                elementBottomY: bottomY,
                width: elemWidth,
                height: elemHeight,
                // Converter para cm (assumindo 300 DPI)
                widthCm: (elemWidth / 300 * 2.54).toFixed(1),
                heightCm: (elemHeight / 300 * 2.54).toFixed(1),
                onDimensionsChange: (wCm: number, hCm: number) => {
                    // Converter de cm para pixels (300 DPI)
                    const newW = (wCm / 2.54) * 300;
                    const newH = (hCm / 2.54) * 300;
                    onTransform(selectedImage.id, {
                        width: newW / selectedImage.scaleX,
                        height: newH / selectedImage.scaleY
                    });
                },
                onDuplicate: onDuplicate ? () => onDuplicate() : undefined,
                onDelete,
                onRemoveBackground,
                onTrim: onTrim && selectedId ? () => onTrim(selectedId) : undefined,
            };
        })()
        : null;

    return (
        <div
            ref={containerRef}
            className={`konva-canvas-container ${isDraggingFile ? 'dragging-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDraggingFile && (
                <div className="canvas-drop-overlay">
                    <span>📁 Solte a imagem aqui</span>
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
                draggable={true}
                onWheel={handleWheel}
                onClick={checkDeselect}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onTouchStart={checkDeselect}
                onDragEnd={(e) => {
                    if (e.target === e.target.getStage()) {
                        setStagePos({ x: e.target.x(), y: e.target.y() });
                    }
                }}
            >
                <Layer>
                    {/* Área do documento */}
                    <Group>
                        {/* Fundo */}
                        {backgroundColor === 'transparent' ? (
                            <CheckerboardBackground width={width || 1} height={height || 1} />
                        ) : (
                            <Rect
                                name="background-rect"
                                x={0}
                                y={0}
                                width={width || 1}
                                height={height || 1}
                                fill={backgroundColor}
                            />
                        )}

                        {/* Imagens */}
                        {images.map((image) => {
                            const idsToCheck = selectedIds && selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
                            const isSelected = idsToCheck.includes(image.id);

                            return (
                                <URLImage
                                    key={image.id}
                                    image={image}
                                    isSelected={isSelected}
                                    selectedIds={selectedIds}
                                    onSelectMultiple={onSelectMultiple}
                                    onSelect={(isCtrlPressed) => {
                                        if (isCtrlPressed && onSelectMultiple) {
                                            const currentIds = selectedIds && selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
                                            if (currentIds.includes(image.id)) {
                                                const newIds = currentIds.filter((id: string) => id !== image.id);
                                                onSelectMultiple(newIds);
                                            } else {
                                                onSelectMultiple([...currentIds, image.id]);
                                            }
                                        } else {
                                            onSelect(image.id);
                                        }
                                    }}
                                    onTransform={(attrs) => onTransform(image.id, attrs)}
                                    onDuplicate={onDuplicate}
                                    isShiftPressed={isShiftPressed}
                                    onGuidesChange={setGuides}
                                    onSpacingGuidesChange={setSpacingGuides}
                                />
                            );
                        })}
                    </Group>

                    {/* Máscara visual (Artboard Mask) */}
                    <Path
                        data={`M -50000 -50000 L 50000 -50000 L 50000 50000 L -50000 50000 Z M 0 0 L 0 ${height || 1} L ${width || 1} ${height || 1} L ${width || 1} 0 Z`}
                        fill="#1e1e24"
                        fillRule="evenodd"
                        listening={false}
                    />

                    {/* Transformer */}
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
                            if (newBox.width < 5 || newBox.height < 5) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                        onDragEnd={() => {
                            // Sincronizar posições de TODOS os nodes selecionados
                            if (transformerRef.current) {
                                const nodes = transformerRef.current.nodes();
                                nodes.forEach((node) => {
                                    const id = node.id();
                                    const img = images.find(i => i.id === id);
                                    if (img) {
                                        onTransform(id, {
                                            x: node.x(),
                                            y: node.y(),
                                        });
                                    }
                                });
                            }
                        }}
                        onTransformEnd={() => {
                            // Sincronizar transformações de TODOS os nodes selecionados
                            if (transformerRef.current) {
                                const nodes = transformerRef.current.nodes();
                                nodes.forEach((node) => {
                                    const id = node.id();
                                    const img = images.find(i => i.id === id);
                                    if (img) {
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();
                                        node.scaleX(1);
                                        node.scaleY(1);
                                        onTransform(id, {
                                            x: node.x(),
                                            y: node.y(),
                                            rotation: node.rotation(),
                                            width: Math.max(5, img.width * scaleX),
                                            height: Math.max(5, img.height * scaleY),
                                            scaleX: 1,
                                            scaleY: 1,
                                        });
                                    }
                                });
                            }
                        }}
                    />

                    {/* Linhas Guia (Snapping) - cor roxa do tema */}
                    {guides.map((guide, i) => {
                        const guidePos = guide.vertical
                            ? (guide.start - stagePos.x) / scale
                            : (guide.start - stagePos.y) / scale;

                        if (guide.vertical) {
                            return (
                                <Line
                                    key={i}
                                    points={[guidePos, -60000, guidePos, 60000]}
                                    stroke="#a855f7"
                                    strokeWidth={1.5 / scale}
                                    dash={[6 / scale, 4 / scale]}
                                    shadowColor="#667eea"
                                    shadowBlur={4}
                                    shadowOpacity={0.6}
                                />
                            );
                        } else {
                            return (
                                <Line
                                    key={i}
                                    points={[-60000, guidePos, 60000, guidePos]}
                                    stroke="#a855f7"
                                    strokeWidth={1.5 / scale}
                                    dash={[6 / scale, 4 / scale]}
                                    shadowColor="#667eea"
                                    shadowBlur={4}
                                    shadowOpacity={0.6}
                                />
                            );
                        }
                    })}

                    {/* Smart Spacing Guides - Linhas de espaçamento igual (rosa) */}
                    {spacingGuides.map((sg, i) => {
                        const x1 = (sg.x1 - stagePos.x) / scale;
                        const y1 = (sg.y1 - stagePos.y) / scale;
                        const x2 = (sg.x2 - stagePos.x) / scale;
                        const y2 = (sg.y2 - stagePos.y) / scale;

                        return (
                            <Line
                                key={`spacing-${i}`}
                                points={[x1, y1, x2, y2]}
                                stroke="#ec4899"
                                strokeWidth={2 / scale}
                                dash={[3 / scale, 3 / scale]}
                                shadowColor="#ec4899"
                                shadowBlur={6}
                                shadowOpacity={0.8}
                            />
                        );
                    })}

                    {/* Retângulo de Seleção (Box Selection) */}
                    {selectionRect && (
                        <Rect
                            x={selectionRect.x}
                            y={selectionRect.y}
                            width={selectionRect.width}
                            height={selectionRect.height}
                            fill="rgba(0, 161, 255, 0.1)"
                            stroke="rgb(0, 161, 255)"
                            strokeWidth={1 / scale}
                            dash={[4 / scale, 4 / scale]}
                        />
                    )}
                </Layer>
            </Stage>

            {/* Barra Flutuante */}
            {floatingBarProps && (
                <FloatingElementBar {...floatingBarProps} />
            )}

            {/* Indicador de Zoom */}
            <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'monospace',
                pointerEvents: 'none',
                userSelect: 'none',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
                🔍 {Math.round(scale * 100)}%
            </div>
        </div>
    );
};

export default KonvaCanvas;
