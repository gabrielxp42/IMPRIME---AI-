/**
 * KonvaCanvas - Componente de renderização principal usando Konva.js
 */

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Group, Line, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { SnapLine, SpacingGuide, getLineGuideStops, getObjectSnappingEdges, getGuides, getSpacingGuides } from '../../utils/snapping';
import FloatingElementBar from './FloatingElementBar';
import ShapeRenderer from './ShapeRenderer';
import GroupRenderer from './GroupRenderer';
import TextRenderer from './TextRenderer';
import { CanvasElement, ImageElement, GroupElement, TextElement } from '../../types/canvas-elements';

// Helper local para dimensões (Suporta Grupos e Shapes)
const getElW = (el: CanvasElement): number => {
    if (el.type === 'group') {
        const children = (el as GroupElement).children;
        if (!children || children.length === 0) return 10;
        const xMin = Math.min(...children.map(c => c.x));
        const xMax = Math.max(...children.map(c => c.x + getElW(c) * (c.scaleX || 1)));
        return (xMax - xMin) || 100;
    }
    return (el as any).width || (el as any).radius * 2 || (el as any).radiusX * 2 || 100;
};

const getElH = (el: CanvasElement): number => {
    if (el.type === 'group') {
        const children = (el as GroupElement).children;
        if (!children || children.length === 0) return 10;
        const yMin = Math.min(...children.map(c => c.y));
        const yMax = Math.max(...children.map(c => c.y + getElH(c) * (c.scaleY || 1)));
        return (yMax - yMin) || 100;
    }
    return (el as any).height || (el as any).radius * 2 || (el as any).radiusX * 2 || 100;
};

interface URLImageProps {
    image: ImageElement;
    onSelect: (isShiftPressed: boolean) => void;
    onTransform: (attrs: Partial<ImageElement>) => void;
}

const URLImage: React.FC<URLImageProps> = memo(({
    image,
    onSelect,
    onTransform
}) => {
    const imageRef = useRef<Konva.Image>(null);
    const [img] = useImage(image.src, 'anonymous');

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
            opacity={image.opacity ?? 1}
            draggable={!image.locked}
            onClick={(e) => {
                e.cancelBubble = true;
                onSelect(e.evt.shiftKey);
            }}
            onTap={(e) => {
                e.cancelBubble = true;
                onSelect(false);
            }}
            onTransformEnd={(e) => {
                // Se for parte de uma seleção múltipla, deixamos o Transformer lidar com o lote
                // para evitar drift e múltiplas gravações no histórico
                const stage = e.target.getStage();
                const transformer = stage?.findOne('Transformer') as any;
                const transformerNodes = transformer ? (typeof transformer.nodes === 'function' ? transformer.nodes() : (transformer.nodes || [])) : [];
                if (transformerNodes.length > 1) return;
                handleTransformEnd();
            }}
        />
    );
});

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
            ctx.fillRect(size, 0, size, size);
            ctx.fillRect(0, size, size, size);
        }
        const img = new Image();
        img.onload = () => setPatternImage(img);
        img.src = canvas.toDataURL();
    }, []);

    if (!patternImage) {
        return <Rect x={0} y={0} width={width} height={height} fill="#d0d0d0" />;
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

// CanvasContent Component - Memoized to prevent re-renders during drag (guides updates)
interface CanvasContentProps {
    images: CanvasElement[];
    selectedIds: string[];
    onSelect: (id: string | null) => void;
    onSelectMultiple?: (ids: string[]) => void;
    onTransform: (id: string, attrs: Partial<CanvasElement>) => void;
    onDblClickText?: (id: string) => void;
}

const CanvasContent = memo(({ images, selectedIds, onSelect, onSelectMultiple, onTransform, onDblClickText }: CanvasContentProps) => {
    return (
        <>
            {images.map((el) => {
                const isSel = selectedIds.includes(el.id);
                // Handler para seleção (Shift adiciona/remove, Clique normal seleciona único)
                const hSel = (isShift: boolean) => {
                    if (isShift && onSelectMultiple) {
                        if (selectedIds.includes(el.id)) {
                            onSelectMultiple(selectedIds.filter(i => i !== el.id));
                        } else {
                            onSelectMultiple([...selectedIds, el.id]);
                        }
                    } else {
                        onSelect(el.id);
                    }
                };

                if (el.type === 'shape') return <ShapeRenderer key={el.id} shape={el as any} isSelected={isSel} onSelect={() => hSel(false)} onTransform={(a: Partial<CanvasElement>) => onTransform(el.id, a)} onDragEnd={(a: { x: number, y: number }) => onTransform(el.id, a)} />;
                if (el.type === 'text') return <TextRenderer key={el.id} textItem={el as any} isSelected={isSel} onSelect={hSel} onTransform={(a: Partial<CanvasElement>) => onTransform(el.id, a)} onDblClick={onDblClickText} />;
                if (el.type === 'group') return <GroupRenderer key={el.id} group={el as any} isSelected={isSel} onSelect={hSel} onTransform={onTransform} renderElement={(item: CanvasElement) => {
                    return <URLImage key={item.id} image={item as any} onSelect={hSel} onTransform={(a: Partial<CanvasElement>) => onTransform(item.id, a)} />;
                }} />;
                return <URLImage key={el.id} image={el as any} onSelect={hSel} onTransform={(a: Partial<CanvasElement>) => onTransform(el.id, a)} />;
            })}
        </>
    );
});


interface KonvaCanvasProps {
    width: number;
    height: number;
    images: CanvasElement[];
    selectedId: string | null;
    selectedIds: string[] | null;
    onSelect: (id: string | null) => void;
    onSelectMultiple?: (ids: string[]) => void;
    onTransform: (id: string, attrs: Partial<CanvasElement>) => void;
    backgroundColor?: string;
    onDuplicate: (options?: { x: number, y: number, sourceIds: string[], leaderId?: string, isAltDrag: boolean }) => void;
    onDelete: (id: string) => void;
    onRemoveBackground: (id: string) => void;
    onTrim?: (id: string) => void;
    onAddImage?: (file: File) => void;
    onUpdateMany?: (updates: { id: string, attrs: Partial<CanvasElement> }[]) => void;
    dpi?: number;
    scale?: number;
    onScaleChange?: (scale: number) => void;
    stagePos?: { x: number, y: number };
    onStagePosChange?: (pos: { x: number, y: number }) => void;
    onBringToFront?: (id: string) => void;
    onSendToBack?: (id: string) => void;
    availableFonts?: string[];
}

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
    onDuplicate,
    onDelete,
    onRemoveBackground,
    onTrim,
    onBringToFront,
    onSendToBack,
    onAddImage,
    onUpdateMany,
    dpi,
    scale: externalScale,
    onScaleChange,
    stagePos: externalStagePos,
    onStagePosChange,
    availableFonts
}) => {
    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Estado local sincronizado com externo se fornecido
    const [internalScale, setInternalScale] = useState(1);
    const [internalStagePos, setInternalStagePos] = useState({ x: 0, y: 0 });

    const scale = externalScale !== undefined ? externalScale : internalScale;
    const stagePos = externalStagePos !== undefined ? externalStagePos : internalStagePos;

    const setScale = useCallback((newScale: number | ((prev: number) => number)) => {
        const val = typeof newScale === 'function' ? newScale(scale) : newScale;
        if (onScaleChange) onScaleChange(val);
        else setInternalScale(val);
    }, [scale, onScaleChange]);

    const setStagePos = useCallback((newPos: { x: number, y: number } | ((prev: { x: number, y: number }) => { x: number, y: number })) => {
        const val = typeof newPos === 'function' ? newPos(stagePos) : newPos;
        if (onStagePosChange) onStagePosChange(val);
        else setInternalStagePos(val);
    }, [stagePos, onStagePosChange]);

    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [guides, setGuides] = useState<SnapLine[]>([]);
    const [spacingGuides, setSpacingGuides] = useState<SpacingGuide[]>([]);
    const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const selectionStartPos = useRef<{ x: number, y: number } | null>(null);
    const dragCounter = useRef(0);

    // Normalização de selectedIds com Memo para evitar flickering no Transformer
    const currentSelectedIds = useMemo(() =>
        (selectedIds && selectedIds.length > 0) ? selectedIds : (selectedId ? [selectedId] : []),
        [selectedId, selectedIds]
    );
    const selectedIdsRef = useRef<string[]>([]);
    selectedIdsRef.current = currentSelectedIds;

    // Refs para controle de drag
    const duplicationClones = useRef<Konva.Node[]>([]);
    const duplicationLeader = useRef<Konva.Node | null>(null);
    const duplicationStartPos = useRef<{ x: number, y: number } | null>(null);
    const normalDragNodes = useRef<{ node: Konva.Node, startX: number, startY: number }[]>([]);
    const normalDragStartPos = useRef<{ x: number, y: number } | null>(null);

    // Handlers Globais para Drag
    const handleStageDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        const target = e.target;
        const stage = stageRef.current;
        if (!stage || target === stage) return;

        const nodeId = target.id();
        if (!nodeId || nodeId === 'background-rect') return;

        const currentSelected = selectedIdsRef.current;
        const isSelected = currentSelected.includes(nodeId);

        // Se Alt está pressionado -> Duplicar
        if (e.evt && e.evt.altKey && typeof onDuplicate === 'function') {
            target.stopDrag();
            const idsToDuplicate = isSelected ? currentSelected : [nodeId];
            const layer = stage.getLayers()[0];

            duplicationClones.current = [];
            idsToDuplicate.forEach(id => {
                const node = stage.findOne('#' + id);
                if (node) {
                    const clone = node.clone({
                        opacity: 0.6,
                        draggable: true,
                        name: 'temp-clone',
                        id: 'temp-clone-' + id + '-' + Date.now()
                    });
                    clone.setAttr('originalId', id);
                    layer.add(clone);
                    duplicationClones.current.push(clone);
                }
            });

            if (duplicationClones.current.length > 0) {
                const leader = duplicationClones.current.find(c => c.getAttr('originalId') === nodeId) || duplicationClones.current[0];
                duplicationLeader.current = leader;
                duplicationStartPos.current = { x: leader.x(), y: leader.y() };
                setTimeout(() => {
                    if (leader && leader.getLayer()) {
                        leader.startDrag();
                    }
                }, 20);
            }
            layer.batchDraw();
        } else {
            // Drag Normal
            normalDragStartPos.current = { x: target.x(), y: target.y() };
            normalDragNodes.current = [];

            if (isSelected && currentSelected.length > 1) {
                currentSelected.forEach(id => {
                    if (id !== nodeId) {
                        const node = stage.findOne('#' + id);
                        if (node) {
                            normalDragNodes.current.push({
                                node,
                                startX: node.x(),
                                startY: node.y()
                            });
                        }
                    }
                });
            }
        }
    };

    const handleStageDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;

        const node = e.target as Konva.Shape;
        const isDuplication = node.name() === 'temp-clone' || (duplicationLeader.current === node);

        // 1. Shift constraint
        const startPos = isDuplication ? duplicationStartPos.current : normalDragStartPos.current;
        if (isShiftPressed && startPos) {
            const dx = node.x() - startPos.x;
            const dy = node.y() - startPos.y;
            if (Math.abs(dx) > Math.abs(dy)) node.y(startPos.y);
            else node.x(startPos.x);
        }

        // 2. Snapping
        const lineGuideStops = getLineGuideStops(node, stage);
        const itemBounds = getObjectSnappingEdges(node);
        const guidesResult = getGuides(lineGuideStops, itemBounds);

        const absPos = node.absolutePosition();
        guidesResult.forEach((lg) => {
            if (lg.start !== undefined && lg.offset !== undefined) {
                if (lg.vertical) absPos.x = lg.start + lg.offset;
                else absPos.y = lg.start + lg.offset;
            }
        });

        if (Number.isFinite(absPos.x) && Number.isFinite(absPos.y)) {
            node.absolutePosition(absPos);
            // This triggers re-render, but ContentLayer is memoized!
            setGuides(guidesResult);
        } else {
            setGuides([]);
        }

        setSpacingGuides(getSpacingGuides(node, stage));

        // 3. Sync
        const currentStartPos = isDuplication ? duplicationStartPos.current : normalDragStartPos.current;
        if (currentStartPos) {
            const dx = node.x() - currentStartPos.x;
            const dy = node.y() - currentStartPos.y;

            if (isDuplication) {
                duplicationClones.current.forEach(c => {
                    if (c !== node) {
                        const originalId = c.getAttr('originalId');
                        const originalNode = stage.findOne('#' + originalId);
                        if (originalNode) {
                            c.x(originalNode.x() + dx);
                            c.y(originalNode.y() + dy);
                        }
                    }
                });
            } else if (normalDragNodes.current.length > 0) {
                normalDragNodes.current.forEach(item => {
                    item.node.x(item.startX + dx);
                    item.node.y(item.startY + dy);
                });
                // Sincroniza a caixa roxa com as novas posições
                transformerRef.current?.forceUpdate();
                transformerRef.current?.getLayer()?.batchDraw();
            }
        }
    };

    const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        setGuides([]);
        setSpacingGuides([]);
        const stage = stageRef.current;
        if (!stage) return;

        // Se o próprio palco (Stage) foi arrastado (Camera move)
        if (e.target === stage) {
            setStagePos({ x: stage.x(), y: stage.y() });
            return;
        }

        const node = e.target;
        const isDuplication = node.name() === 'temp-clone' || (duplicationLeader.current === node);

        if (isDuplication && duplicationLeader.current) {
            const ids = duplicationClones.current.map(c => c.getAttr('originalId'));
            const leaderId = duplicationLeader.current.getAttr('originalId');
            const finalX = duplicationLeader.current.x();
            const finalY = duplicationLeader.current.y();

            duplicationClones.current.forEach(c => c.destroy());
            duplicationClones.current = [];
            duplicationLeader.current = null;
            duplicationStartPos.current = null;
            stage.batchDraw();

            onDuplicate({ x: finalX, y: finalY, sourceIds: ids, leaderId, isAltDrag: true });
        } else if (!isDuplication && node.id() !== 'background-rect') {
            const currentSelected = selectedIdsRef.current;
            if (currentSelected.length > 1 && onUpdateMany) {
                const updates = currentSelected.map(id => {
                    const n = stage.findOne('#' + id);
                    if (n) return { id, attrs: { x: n.x(), y: n.y() } };
                    return null;
                }).filter(Boolean) as any[];
                onUpdateMany(updates);
            } else {
                onTransform(node.id(), { x: node.x(), y: node.y() });
            }
            normalDragNodes.current = [];
            normalDragStartPos.current = null;
        }
    };

    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = scale;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = { x: (pointer.x - stagePos.x) / oldScale, y: (pointer.y - stagePos.y) / oldScale };
        let direction = e.evt.deltaY > 0 ? -1 : 1;
        const delta = Math.abs(e.evt.deltaY);
        const speed = delta > 100 ? 0.15 : 0.08;
        const scaleBy = 1 + (speed * direction);
        let newScale = Math.max(0.05, Math.min(10, oldScale * scaleBy));
        if (Math.abs(newScale - 1) < 0.05) newScale = 1;
        const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
        setScale(newScale);
        setStagePos(newPos);
    }, [scale, stagePos]);

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        // Agora o Panning é o padrão. Seleção por retângulo só com Shift.
        if ((e.target === e.target.getStage() || e.target.name() === 'background-rect') && isShiftPressed) {
            const pos = stageRef.current?.getPointerPosition();
            if (pos) {
                selectionStartPos.current = {
                    x: (pos.x - stagePos.x) / scale,
                    y: (pos.y - stagePos.y) / scale,
                };
                setSelectionRect({ ...selectionStartPos.current, width: 0, height: 0 });
                stageRef.current?.draggable(false);
            }
        }
    };

    const handleStageMouseMove = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!selectionStartPos.current) return;
        const pos = stageRef.current?.getPointerPosition();
        if (pos) {
            const relativePos = { x: (pos.x - stagePos.x) / scale, y: (pos.y - stagePos.y) / scale };
            const x = Math.min(selectionStartPos.current.x, relativePos.x);
            const y = Math.min(selectionStartPos.current.y, relativePos.y);
            const w = Math.abs(relativePos.x - selectionStartPos.current.x);
            const h = Math.abs(relativePos.y - selectionStartPos.current.y);
            setSelectionRect({ x, y, width: w, height: h });
        }
    };

    const handleStageMouseUp = () => {
        if (selectionRect && selectionRect.width > 5 && selectionRect.height > 5 && onSelectMultiple) {
            const selectedItems = images.filter(img => {
                const w = getElW(img);
                const h = getElH(img);
                const imgRight = img.x + w * (img.scaleX || 1);
                const imgBottom = img.y + h * (img.scaleY || 1);
                const rectRight = selectionRect.x + selectionRect.width;
                const rectBottom = selectionRect.y + selectionRect.height;
                return img.x < rectRight && imgRight > selectionRect.x && img.y < rectBottom && imgBottom > selectionRect.y;
            });
            if (selectedItems.length > 0) onSelectMultiple(selectedItems.map(img => img.id));
        }
        stageRef.current?.draggable(true);
        selectionStartPos.current = null;
        setSelectionRect(null);
    };

    const handleGlobalDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (dragCounter.current === 1) setIsDraggingFile(true);
    };

    const handleGlobalDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setIsDraggingFile(false);
        }
    };

    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDraggingFile(false);
        if (e.dataTransfer.files.length > 0 && onAddImage) {
            Array.from(e.dataTransfer.files).forEach(f => {
                if (f.type.startsWith('image/')) onAddImage(f);
            });
        }
    };

    // Life Cycles
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(true); };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

    useEffect(() => {
        const updateSize = () => { if (containerRef.current) setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight }); };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            const cW = containerRef.current.offsetWidth - 100, cH = containerRef.current.offsetHeight - 100;
            const newScale = Math.max(0.01, Math.min(cW / Math.max(1, width), cH / Math.max(1, height), 1));
            setScale(newScale);
            setStagePos({ x: (containerRef.current.offsetWidth - width * newScale) / 2, y: (containerRef.current.offsetHeight - height * newScale) / 2 });
        }
    }, [width, height, containerSize]);

    // Atualização do Transformer para Multi-Seleção
    useEffect(() => {
        if (transformerRef.current && stageRef.current) {
            const stage = stageRef.current;
            const validImages = new Set(images.map(img => img.id));

            // Filtra IDs que ainda existem no documento
            const filteredIds = currentSelectedIds.filter(id => validImages.has(id));

            // Busca os nós reais no Konva de forma segura
            const nodes: Konva.Node[] = [];
            filteredIds.forEach(id => {
                const node = stage.findOne('#' + id);
                if (node) nodes.push(node);
            });

            transformerRef.current.nodes(nodes);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [currentSelectedIds, images]);
    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (e.target === e.target.getStage() || e.target.name() === 'background-rect') onSelect(null);
    };

    const handleCaseChange = (mode: string) => {
        if (!selectedId) return;
        const img = images.find(i => i.id === selectedId);
        if (img && img.type === 'text') {
            const txt = img as TextElement;
            const currentText = txt.text || '';

            // Ciclo: Upper -> Lower -> Title
            const isUpper = currentText === currentText.toUpperCase();
            const isLower = currentText === currentText.toLowerCase();

            let newText = currentText;
            if (isLower) {
                // Vai para Title
                newText = currentText.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
            } else if (isUpper) {
                // Vai para Lower
                newText = currentText.toLowerCase();
            } else {
                // Vai para Upper
                newText = currentText.toUpperCase();
            }
            onTransform(selectedId, { text: newText });
        }
    }

    const handleFontStyleChange = (style: string) => {
        if (!selectedId) return;
        const img = images.find(i => i.id === selectedId);
        if (img && img.type === 'text') {
            const currentStyle = (img as any).fontStyle || 'normal';
            // Toggle Bold/Italic logic: Konva usa "normal", "bold", "italic", "italic bold"
            let newStyle = currentStyle;
            if (style === 'bold') {
                if (currentStyle.includes('bold')) newStyle = currentStyle.replace('bold', '').trim();
                else newStyle = `${currentStyle} bold`.trim();
            }
            if (style === 'italic') {
                if (currentStyle.includes('italic')) newStyle = currentStyle.replace('italic', '').trim();
                else newStyle = `${currentStyle} italic`.trim();
            }
            if (!newStyle) newStyle = 'normal';
            onTransform(selectedId, { fontStyle: newStyle });
        }
    };

    const handleTextDecorationChange = (decoration: string) => {
        if (!selectedId) return;
        const img = images.find(i => i.id === selectedId);
        if (img && img.type === 'text') {
            const currentDeco = (img as any).textDecoration || '';
            // Toggle Underline
            let newDeco = currentDeco;
            if (decoration === 'underline') {
                if (currentDeco.includes('underline')) newDeco = currentDeco.replace('underline', '').trim();
                else newDeco = 'underline';
            }
            onTransform(selectedId, { textDecoration: newDeco });
        }
    }

    // Estado para dimensões em tempo real durante arraste
    const [liveTransformSize, setLiveTransformSize] = useState<{ width: number; height: number } | null>(null);

    const selectedImage = selectedId ? images.find(img => img.id === selectedId) : null;
    const floatingBarProps = selectedImage ? (() => {
        // Usar dimensões ao vivo durante transform, senão usar do elemento
        const elemWidth = liveTransformSize?.width ?? getElW(selectedImage);
        const elemHeight = liveTransformSize?.height ?? getElH(selectedImage);

        // Coordenadas relativas ao stage container
        const screenX = selectedImage.x * scale + stagePos.x;
        const screenY = selectedImage.y * scale + stagePos.y;
        const screenW = (liveTransformSize?.width ?? getElW(selectedImage)) * scale; // Largura visual no zoom

        const isCentered = selectedImage.type === 'shape' && ['circle', 'ellipse', 'star', 'polygon'].includes((selectedImage as any).shapeType);

        return {
            elementCenterX: isCentered ? screenX : (screenX + screenW / 2),
            elementBottomY: isCentered ? (screenY - 10) : screenY, // Topo do elemento (a barra sobe via CSS)
            width: elemWidth, height: elemHeight,
            widthCm: (elemWidth / 300 * 2.54).toFixed(1), heightCm: (elemHeight / 300 * 2.54).toFixed(1),
            onDimensionsChange: (wCm: number, hCm: number) => onTransform(selectedImage.id, { width: (wCm / 2.54) * 300, height: (hCm / 2.54) * 300 }),
            onDuplicate: () => onDuplicate(), onDelete: () => onDelete(selectedImage.id),
            onRemoveBackground: () => onRemoveBackground(selectedImage.id),
            onTrim: onTrim ? () => onTrim(selectedImage.id) : undefined,
            onBringToFront: onBringToFront ? () => onBringToFront(selectedImage.id) : undefined,
            onSendToBack: onSendToBack ? () => onSendToBack(selectedImage.id) : undefined,
            elementType: selectedImage.type, currentFill: (selectedImage as any).fill,
            onFillChange: (color: string) => onTransform(selectedImage.id, { fill: color }),
            currentStroke: (selectedImage as any).stroke, currentStrokeWidth: (selectedImage as any).strokeWidth,
            onStrokeChange: (color: string) => onTransform(selectedImage.id, { stroke: color }),
            onStrokeWidthChange: (w: number) => onTransform(selectedImage.id, { strokeWidth: w }),
            // Text Props
            currentFontSize: selectedImage.type === 'text' ? (selectedImage as any).fontSize : undefined,
            currentFontFamily: selectedImage.type === 'text' ? (selectedImage as any).fontFamily : undefined,
            currentAlign: selectedImage.type === 'text' ? (selectedImage as any).align : undefined,
            currentFontStyle: selectedImage.type === 'text' ? (selectedImage as any).fontStyle : undefined,
            currentTextDecoration: selectedImage.type === 'text' ? (selectedImage as any).textDecoration : undefined,
            onFontSizeChange: (size: number) => onTransform(selectedImage.id, { fontSize: size }),
            onFontFamilyChange: (font: string) => onTransform(selectedImage.id, { fontFamily: font }),
            onAlignChange: (align: 'left' | 'center' | 'right') => onTransform(selectedImage.id, { align: align }),
            onCaseChange: handleCaseChange,
            onFontStyleChange: handleFontStyleChange,
            onTextDecorationChange: handleTextDecorationChange,
            availableFonts: availableFonts,
            isTransforming: liveTransformSize !== null // Flag para indicar que está transformando
        };
    })() : null;

    // Estado para edição de texto
    const [editingId, setEditingId] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Ajusta o textarea de edição ao zoom/posição
    useEffect(() => {
        if (editingId && textareaRef.current && stageRef.current) {
            const img = images.find(i => i.id === editingId);
            if (img && img.type === 'text') {
                const textNode = stageRef.current.findOne('#' + editingId) as Konva.Text;
                if (textNode) {
                    const absPos = textNode.absolutePosition();
                    const area = textareaRef.current;
                    area.style.top = `${containerRef.current?.offsetTop || 0}px`;
                    area.style.left = `${containerRef.current?.offsetLeft || 0}px`;
                    // Ajuste fino para sobrepor perfeitamente
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    const stageRect = stageRef.current.content.getBoundingClientRect();

                    if (containerRect) {
                        const offsetX = stageRect.left - containerRect.left;
                        const offsetY = stageRect.top - containerRect.top;
                        // Transformação completa recuperando rotação
                        area.style.transform = `translate(${absPos.x + offsetX}px, ${absPos.y + offsetY}px) rotate(${img.rotation || 0}deg)`;
                        area.style.transformOrigin = 'top left';
                    }

                    area.style.width = `${textNode.width() * scale}px`;
                    area.style.height = `${textNode.height() * scale}px`;
                    area.style.fontSize = `${(img.fontSize || 16) * scale}px`;
                    area.style.lineHeight = `${((img as any).lineHeight || 1.1)}`;
                    area.style.fontFamily = img.fontFamily || 'sans-serif';
                    area.style.textAlign = img.align || 'left';
                    area.style.color = img.fill || 'black';
                    area.value = img.text || '';
                    area.focus();
                }
            }
        }
    }, [editingId, scale, stagePos, images]);

    const handleTextEditEnd = () => {
        if (editingId && textareaRef.current) {
            onTransform(editingId, { text: textareaRef.current.value });
        }
        setEditingId(null);
    };

    const handleDblClickText = (id: string) => {
        setEditingId(id);
    };

    return (
        <div ref={containerRef} className={`konva-canvas-container ${isDraggingFile ? 'dragging-file' : ''}`}
            onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'copy';
                }
            }}
            onDragEnter={handleGlobalDragEnter}
            onDragLeave={handleGlobalDragLeave}
            onDrop={handleGlobalDrop}>
            {isDraggingFile && (
                <div className="canvas-drop-overlay" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📁 Solte a imagem aqui
                </div>
            )}
            <Stage ref={stageRef} width={containerSize.width} height={containerSize.height} scaleX={scale} scaleY={scale} x={stagePos.x} y={stagePos.y} draggable={true}
                onWheel={handleWheel}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onClick={checkDeselect}
                onDragStart={handleStageDragStart}
                onDragMove={handleStageDragMove}
                onDragEnd={handleStageDragEnd}>
                <Layer>
                    <Group>
                        {backgroundColor === 'transparent' ? <CheckerboardBackground width={width} height={height} /> : <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} name="background-rect" />}
                        <CanvasContent
                            images={images}
                            selectedIds={currentSelectedIds}
                            onSelect={onSelect}
                            onSelectMultiple={onSelectMultiple}
                            onTransform={onTransform}
                            onDblClickText={handleDblClickText}
                        />
                    </Group>
                    <Rect x={0} y={0} width={width} height={height} stroke="#333" strokeWidth={1 / scale} listening={false} />
                    <Transformer
                        ref={transformerRef}
                        rotateEnabled={true}
                        anchorSize={Math.min(15, 6 / scale)}
                        anchorCornerRadius={Math.min(10, 3 / scale)}
                        anchorFill="white"
                        anchorStroke="#a855f7"
                        anchorStrokeWidth={Math.min(1.5, 0.8 / scale)}
                        borderStroke="#a855f7"
                        borderStrokeWidth={Math.min(1.5, 0.8 / scale)}
                        rotateAnchorOffset={Math.min(40, 15 / scale)}
                        rotationSnapTolerance={5}
                        onTransform={(e) => {
                            // Atualiza dimensões em tempo real durante arraste
                            const node = e.target;
                            const originalImg = images.find(img => img.id === node.id()) as any;
                            if (originalImg) {
                                const baseWidth = originalImg.width || node.width();
                                const baseHeight = originalImg.height || node.height();
                                const newWidth = Math.abs(baseWidth * node.scaleX());
                                const newHeight = Math.abs(baseHeight * node.scaleY());
                                setLiveTransformSize({ width: newWidth, height: newHeight });
                            }
                        }}
                        onTransformEnd={(e) => {
                            // Limpar estado de transform ao vivo
                            setLiveTransformSize(null);

                            const tr = e.currentTarget as any;
                            const nodes = typeof tr.nodes === 'function' ? tr.nodes() : (tr.nodes || []);
                            if (!nodes || nodes.length <= 1) return; // Individual nodes handle their own transform

                            const updates = nodes.map((node: Konva.Node) => {
                                const scaleX = node.scaleX();
                                const scaleY = node.scaleY();

                                // Reset scales and bake into geometry
                                node.scaleX(1);
                                node.scaleY(1);

                                const attrs: any = {
                                    x: node.x(),
                                    y: node.y(),
                                    rotation: node.rotation(),
                                    scaleX: 1,
                                    scaleY: 1
                                };

                                // Se for imagem/shape, atualizamos largura/altura
                                const originalNode = images.find(img => img.id === node.id()) as any;
                                if (originalNode) {
                                    if (originalNode.width !== undefined && (originalNode.type === 'image' || originalNode.type === 'text' || originalNode.shapeType === 'rectangle')) {
                                        attrs.width = Math.max(5, originalNode.width * scaleX);
                                        attrs.height = Math.max(5, originalNode.height * scaleY);
                                    } else if (originalNode.shapeType === 'circle' || originalNode.shapeType === 'polygon') {
                                        attrs.radius = Math.max(5, (originalNode.radius || 75) * scaleX);
                                    } else if (originalNode.shapeType === 'ellipse') {
                                        attrs.radiusX = Math.max(5, (originalNode.radiusX || 100) * scaleX);
                                        attrs.radiusY = Math.max(5, (originalNode.radiusY || 60) * scaleY);
                                    } else if (originalNode.shapeType === 'star') {
                                        attrs.innerRadius = Math.max(2, (originalNode.innerRadius || 35) * scaleX);
                                        attrs.outerRadius = Math.max(5, (originalNode.outerRadius || 75) * scaleX);
                                    }
                                }

                                return { id: node.id(), attrs };
                            });

                            if (onUpdateMany) onUpdateMany(updates);
                        }}
                    />
                    {guides.map((g, i) => {
                        const gp = (g.start - (g.vertical ? stagePos.x : stagePos.y)) / scale;
                        return <Line key={i} points={g.vertical ? [gp, -60000, gp, 60000] : [-60000, gp, 60000, gp]} stroke="#a855f7" strokeWidth={1.5 / scale} dash={[6 / scale, 4 / scale]} />;
                    })}
                    {spacingGuides.map((sg, i) => {
                        const x1 = (sg.x1 - stagePos.x) / scale, y1 = (sg.y1 - stagePos.y) / scale, x2 = (sg.x2 - stagePos.x) / scale, y2 = (sg.y2 - stagePos.y) / scale;
                        return <Line key={i} points={[x1, y1, x2, y2]} stroke="#ec4899" strokeWidth={2 / scale} dash={[3 / scale, 3 / scale]} />;
                    })}
                    {selectionRect && <Rect x={selectionRect.x} y={selectionRect.y} width={selectionRect.width} height={selectionRect.height} fill="rgba(0, 161, 255, 0.1)" stroke="rgb(0, 161, 255)" strokeWidth={1 / scale} dash={[4 / scale, 4 / scale]} />}
                </Layer>
            </Stage>
            {/* Overlay Textarea para Edição Inline */}
            <textarea
                ref={textareaRef}
                style={{
                    display: editingId ? 'block' : 'none',
                    position: 'absolute',
                    zIndex: 1000,
                    border: '2px solid #a855f7',
                    margin: 0,
                    padding: 4,
                    background: 'rgba(255,255,255,0.95)',
                    outline: 'none',
                    resize: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    borderRadius: 4
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextEditEnd();
                    }
                    if (e.key === 'Escape') {
                        setEditingId(null);
                    }
                }}
                onBlur={handleTextEditEnd}
            />
            {/* FloatingBar oculta durante edição */}
            {floatingBarProps && !editingId && <FloatingElementBar {...floatingBarProps} />}
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                {Math.round(scale * 100)}%
            </div>
        </div>
    );
};

export default KonvaCanvas;
