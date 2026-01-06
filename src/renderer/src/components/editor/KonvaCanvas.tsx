import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Transformer, Rect, Group, Image, Text, Line, Circle } from 'react-konva';
import useImage from 'use-image';
import { SnapLine, getLineGuideStops, getGuides } from '../../utils/snapping';
import FloatingElementBar from './FloatingElementBar';

interface KonvaCanvasProps {
    images: any[];
    selectedId: string | null;
    currentSelectedIds: string[];
    onSelect: (id: string | null) => void;
    onSelectMultiple?: (ids: string[]) => void;
    onUpdateMany?: (updates: { id: string, attrs: any }[]) => void;
    onTransform: (id: string, attrs: any) => void;
    onDrop: (e: any) => void;
    onDragOver: (e: any) => void;
    width: number;
    height: number;
    backgroundColor?: string;
    onDelete: (id: string) => void;
    onDuplicate: (args: { sourceIds: string[], isAltDrag?: boolean, leaderId?: string, x?: number, y?: number, targetPositions?: { id: string, x: number, y: number }[] }) => void;
    onRemoveBackground: (id: string) => void;
    onTrim?: (id: string) => void;
    onBringToFront?: (id: string) => void;
    onSendToBack?: (id: string) => void;
    availableFonts?: string[];
    scale?: number;
    stagePos?: { x: number, y: number };
    onScaleChange?: (scale: number) => void;
    onStagePosChange?: (pos: { x: number, y: number }) => void;
}

// Sub-components
const CheckerboardBackground: React.FC<{ width: number, height: number }> = ({ width, height }) => {
    const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
        const size = 20;
        const canvas = document.createElement('canvas');
        canvas.width = size * 2; canvas.height = size * 2;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1f3f5';
        ctx.fillRect(0, 0, size, size); ctx.fillRect(size, size, size, size);
        const img = new window.Image();
        img.src = canvas.toDataURL();
        img.onload = () => setPatternImage(img);
    }, []);
    return <Rect x={0} y={0} width={width} height={height} fillPatternImage={patternImage as HTMLImageElement | undefined} fillPatternRepeat="repeat" name="background-rect" />;
};

const MemoizedRenderItem = React.memo(({ item, onDragStart, onDragMove, onDragEnd, onTransformEnd }: any) => {
    const [img] = useImage(item.src || '', 'anonymous');
    const shapeRef = useRef<Konva.Shape>(null);

    const common = {
        id: item.id,
        x: item.x, y: item.y,
        width: item.width, height: item.height,
        rotation: item.rotation,
        scaleX: item.scaleX || 1, scaleY: item.scaleY || 1,
        draggable: true,
        name: 'object',
        onDragStart: (e: any) => onDragStart(e, e.evt.altKey),
        onDragMove,
        onDragEnd,
        onTransformEnd,
        perfectDrawEnabled: false,
        shadowForStrokeEnabled: false,
        hitStrokeWidth: 0,
    };

    if (item.type === 'image') return <Image ref={shapeRef as any} {...common} image={img} />;
    if (item.type === 'text') {
        return <Text ref={shapeRef as any} {...common} text={item.text || 'Texto'} fontSize={item.fontSize || 20} fontFamily={item.fontFamily || 'Arial'} fill={item.fill || 'black'} stroke={item.stroke} strokeWidth={item.strokeWidth} align={item.align || 'left'} fontStyle={item.fontStyle || 'normal'} textDecoration={item.textDecoration || ''} />;
    }
    if (item.type === 'shape') {
        if (item.shapeType === 'circle') return <Circle ref={shapeRef as any} {...common} radius={item.radius || 50} fill={item.fill || '#e2e8f0'} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
        if (item.shapeType === 'rectangle') return <Rect ref={shapeRef as any} {...common} cornerRadius={item.cornerRadius || 0} fill={item.fill || '#e2e8f0'} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
    }
    return <Rect ref={shapeRef as any} {...common} fill={item.fill || '#e2e8f0'} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
}, (prev, next) => {
    const p = prev.item;
    const n = next.item;
    if (p.id !== n.id) return false;
    if (p.x !== n.x || p.y !== n.y || p.width !== n.width || p.height !== n.height) return false;
    if (p.rotation !== n.rotation || p.scaleX !== n.scaleX || p.scaleY !== n.scaleY) return false;
    if (p.src !== n.src || p.text !== n.text || p.fill !== n.fill || p.stroke !== n.stroke) return false;
    if (p.fontSize !== n.fontSize || p.fontFamily !== n.fontFamily) return false;
    if (p.visible !== n.visible || p.locked !== n.locked) return false;
    return true;
});

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
    images, currentSelectedIds = [], onSelect, onSelectMultiple, onTransform, onUpdateMany,
    onDrop, onDragOver, width = 800, height = 600, backgroundColor = 'white',
    onDelete, onDuplicate, onRemoveBackground, onTrim, onBringToFront, onSendToBack, availableFonts,
    scale: externalScale, stagePos: externalStagePos, onScaleChange, onStagePosChange
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const artboardLayerRef = useRef<Konva.Layer>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    const [size, setSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(externalScale || 1);
    const [position, setPosition] = useState(externalStagePos || { x: 0, y: 0 });

    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Liquid Viewport Targets
    const targetScale = useRef(scale);
    const targetPos = useRef(position);

    const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const selectionStartPos = useRef<{ x: number, y: number } | null>(null);
    const [guides, setGuides] = useState<SnapLine[]>([]);
    const [distances, setDistances] = useState<any[]>([]);
    const [ghosts, setGhosts] = useState<any[]>([]);
    const ghostsRef = useRef<any[]>([]);
    const isAltDragging = useRef(false);
    const dragStartPos = useRef<{ [key: string]: { x: number, y: number } }>({});
    const dragStartPointerPos = useRef<{ x: number, y: number } | null>(null);
    const dragStartGroupRect = useRef<{ x: number, y: number, width: number, height: number } | null>(null);
    const dragStartGroupGhostRect = useRef<{ x: number, y: number, width: number, height: number } | null>(null);
    const cachedGuideStopsRef = useRef<{ vertical: number[], horizontal: number[] } | null>(null);

    const [liveOutOfBoundsCount, setLiveOutOfBoundsCount] = useState(0);

    const calculateOutOfBoundsCount = useCallback(() => {
        if (!artboardLayerRef.current) return 0;
        let count = 0;
        const layer = artboardLayerRef.current;

        images.forEach(img => {
            const node = layer.findOne('#' + img.id);
            if (node) {
                const box = node.getClientRect({ relativeTo: layer, skipShadow: true });
                const isPartiallyOutside =
                    box.x < -0.5 || box.y < -0.5 ||
                    (box.x + box.width) > (width + 0.5) ||
                    (box.y + box.height) > (height + 0.5);

                if (isPartiallyOutside) count++;
            } else {
                // Fallback for when node is not yet rendered or in state only
                const item = img as any;
                const w = (item.width || 100) * (img.scaleX || 1);
                const h = (item.height || 100) * (img.scaleY || 1);
                const isOutside = img.x < -0.5 || img.y < -0.5 || (img.x + w) > (width + 0.5) || (img.y + h) > (height + 0.5);
                if (isOutside) count++;
            }
        });
        return count;
    }, [images, width, height]);

    // Update live count when images change or after drag
    useEffect(() => {
        setLiveOutOfBoundsCount(calculateOutOfBoundsCount());
    }, [images, calculateOutOfBoundsCount]);


    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width: w, height: h } = entry.contentRect;
                setSize({ width: w, height: h });
            }
        });
        resizeObserver.observe(containerRef.current);
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0) setSize({ width: clientWidth, height: clientHeight });
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (size.width === 0 || size.height === 0 || width === 0 || height === 0) return;
        // Only fit screen if external positions are effectively zero/uninitialized
        const isUninitialized = !externalStagePos || (Math.abs(externalStagePos.x) < 0.1 && Math.abs(externalStagePos.y) < 0.1);
        if (isUninitialized) {
            const padding = 100;
            const s = Math.min((size.width - padding) / width, (size.height - padding) / height, 1);
            const x = (size.width - width * s) / 2;
            const y = (size.height - height * s) / 2;

            targetScale.current = s;
            targetPos.current = { x, y };
            setScale(s); setPosition({ x, y });

            if (onScaleChange) onScaleChange(s);
            if (onStagePosChange) onStagePosChange({ x, y });
        }
    }, [width, height, size.width, size.height]); // Removed externalStagePos from deps to avoid fighting

    // Interpolation Loop for 'Liquid' feel
    useEffect(() => {
        let animId: number;
        const tick = () => {
            const stage = stageRef.current;
            if (!stage) return;

            const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

            const curScale = stage.scaleX();
            const curPos = stage.position();

            // Adjust speeds: 0.2 for scale, 0.25 for position
            const nextScale = lerp(curScale, targetScale.current, 0.2);
            const nextX = lerp(curPos.x, targetPos.current.x, 0.25);
            const nextY = lerp(curPos.y, targetPos.current.y, 0.25);

            const scaleDiff = Math.abs(nextScale - targetScale.current);
            const posDiff = Math.abs(nextX - targetPos.current.x) + Math.abs(nextY - targetPos.current.y);

            if (scaleDiff > 0.0001 || posDiff > 0.1) {
                stage.scale({ x: nextScale, y: nextScale });
                stage.position({ x: nextX, y: nextY });
                stage.batchDraw();

                // Sync React state occasionally or at the end to keep rulers aligned
                if (scaleDiff < 0.001) setScale(nextScale);
                if (posDiff < 0.5) setPosition({ x: nextX, y: nextY });
                (window as any).canvasScale = nextScale;
            }

            animId = requestAnimationFrame(tick);
        };
        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, []);

    useEffect(() => {
        if (externalScale !== undefined && Math.abs(externalScale - targetScale.current) > 0.001) {
            targetScale.current = externalScale;
        }
        if (externalStagePos && (Math.abs(externalStagePos.x - targetPos.current.x) > 0.1 || Math.abs(externalStagePos.y - targetPos.current.y) > 0.1)) {
            targetPos.current = externalStagePos;
        }
    }, [externalScale, externalStagePos]);

    const handleFitScreen = useCallback(() => {
        if (size.width === 0 || size.height === 0 || width === 0 || height === 0) return;
        const padding = Math.max(100, Math.min(size.width, size.height) * 0.15);
        const s = Math.min((size.width - padding) / width, (size.height - padding) / height, 1.5);
        const x = (size.width - width * s) / 2;
        const y = (size.height - height * s) / 2;

        targetScale.current = s;
        targetPos.current = { x, y };
        setScale(s); setPosition({ x, y });
        if (onScaleChange) onScaleChange(s);
        if (onStagePosChange) onStagePosChange({ x, y });
    }, [width, height, size, onScaleChange, onStagePosChange]);

    const handleZoomToSelection = useCallback(() => {
        if (!currentSelectedIds.length || !artboardLayerRef.current) return;
        const layer = artboardLayerRef.current;
        const selectedNodes = currentSelectedIds.map(id => layer.findOne('#' + id)).filter(Boolean);
        if (!selectedNodes.length) return;

        // Calculate bounding box of selection
        const boxes = selectedNodes.map(node => node!.getClientRect({ relativeTo: layer, skipShadow: true }));
        const minX = Math.min(...boxes.map(b => b.x));
        const minY = Math.min(...boxes.map(b => b.y));
        const maxX = Math.max(...boxes.map(b => b.x + b.width));
        const maxY = Math.max(...boxes.map(b => b.y + b.height));

        const sw = maxX - minX;
        const sh = maxY - minY;
        const padding = 100;

        const s = Math.min((size.width - padding) / sw, (size.height - padding) / sh, 4);
        const x = (size.width - sw * s) / 2 - minX * s;
        const y = (size.height - sh * s) / 2 - minY * s;

        targetScale.current = s;
        targetPos.current = { x, y };
        setScale(s); setPosition({ x, y });
        if (onScaleChange) onScaleChange(s);
        if (onStagePosChange) onStagePosChange({ x, y });
    }, [currentSelectedIds, size, onScaleChange, onStagePosChange]);


    const handleRevealAll = () => {
        if (images.length === 0) return;
        const padding = 100;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        images.forEach(img => {
            const node = artboardLayerRef.current?.findOne('#' + img.id);
            const box = node ? node.getClientRect({ relativeTo: artboardLayerRef.current!, skipShadow: true }) : { x: img.x, y: img.y, width: 100, height: 100 };
            minX = Math.min(minX, box.x); minY = Math.min(minY, box.y);
            maxX = Math.max(maxX, box.x + box.width); maxY = Math.max(maxY, box.y + box.height);
        });
        minX = Math.min(minX, 0); minY = Math.min(minY, 0); maxX = Math.max(maxX, width); maxY = Math.max(maxY, height);
        const s = Math.min((size.width - padding) / (maxX - minX), (size.height - padding) / (maxY - minY), 1.5);
        const x = (size.width - (maxX - minX) * s) / 2 - minX * s;
        const y = (size.height - (maxY - minY) * s) / 2 - minY * s;
        setScale(s); setPosition({ x, y });
        if (onScaleChange) onScaleChange(s);
        if (onStagePosChange) onStagePosChange({ x, y });
    };



    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        if (e.evt.ctrlKey || e.evt.metaKey) {
            const delta = -e.evt.deltaY;
            const isTrackpad = Math.abs(delta) < 50 && e.evt.deltaMode === 0;

            let scaleBy = isTrackpad ? 1 + delta * 0.01 : (delta > 0 ? 1.15 : 0.85);
            let newScale = targetScale.current * scaleBy;
            newScale = Math.max(0.01, Math.min(newScale, 30));

            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };

            targetScale.current = newScale;
            targetPos.current = newPos;

            if (onScaleChange) onScaleChange(newScale);
            if (onStagePosChange) onStagePosChange(newPos);
        } else {
            const newPos = {
                x: targetPos.current.x - e.evt.deltaX,
                y: targetPos.current.y - e.evt.deltaY
            };
            targetPos.current = newPos;
            if (onStagePosChange) onStagePosChange(newPos);
        }
    };



    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        let target: Konva.Node | null = e.target as Konva.Node;
        let objectId: string | null = null;
        while (target && target !== target.getStage()) {
            if (target.name() === 'object') { objectId = target.id(); break; }
            target = target.getParent() as Konva.Node | null;
        }
        const isMeta = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

        if (objectId) {
            const isSelected = currentSelectedIds.includes(objectId);
            if (isMeta) {
                if (isSelected) onSelectMultiple?.(currentSelectedIds.filter(id => id !== objectId));
                else onSelectMultiple?.([...currentSelectedIds, objectId]);
            } else if (!isSelected) {
                onSelect(objectId); onSelectMultiple?.([objectId]);
            }
            return;
        }

        if (!isMeta) { onSelect(null); onSelectMultiple?.([]); }

        if (e.evt.shiftKey) {
            const stage = stageRef.current;
            const layer = artboardLayerRef.current;
            if (!stage || !layer) return;
            const pointer = stage.getPointerPosition();
            if (pointer) {
                const transform = layer.getAbsoluteTransform().copy().invert();
                const worldPos = transform.point(pointer);
                selectionStartPos.current = worldPos;
                setSelectionRect({ x: worldPos.x, y: worldPos.y, width: 0, height: 0 });
            }
        }
    };

    const handleMouseMove = () => {
        if (!selectionStartPos.current) return;
        const stage = stageRef.current;
        const layer = artboardLayerRef.current;
        if (!stage || !layer) return;
        const transform = layer.getAbsoluteTransform().copy().invert();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const currentWorldPos = transform.point(pointer);
        setSelectionRect({
            x: Math.min(selectionStartPos.current.x, currentWorldPos.x),
            y: Math.min(selectionStartPos.current.y, currentWorldPos.y),
            width: Math.abs(currentWorldPos.x - selectionStartPos.current.x),
            height: Math.abs(currentWorldPos.y - selectionStartPos.current.y),
        });
    };

    const handleMouseUp = () => {
        if (selectionStartPos.current && selectionRect) {
            const box = selectionRect;
            const selected = images.filter(img => {
                const rect = { x: img.x, y: img.y, width: (img.width || 100) * (img.scaleX || 1), height: (img.height || 100) * (img.scaleY || 1) };
                return Konva.Util.haveIntersection(box, rect);
            });
            const ids = selected.map(i => i.id);
            onSelect(ids[0] || null); onSelectMultiple?.(ids);
        }
        selectionStartPos.current = null; setSelectionRect(null);
    };

    useEffect(() => {
        if (transformerRef.current && stageRef.current) {
            const nodes = currentSelectedIds.map(id => stageRef.current?.findOne('#' + id)).filter(Boolean);
            transformerRef.current.nodes(nodes as Konva.Node[]);
        }
    }, [currentSelectedIds, images]);

    const getFloatingBarProps = () => {
        if (currentSelectedIds.length !== 1) return null;
        const id = currentSelectedIds[0];
        const img = images.find(i => i.id === id);
        const tr = transformerRef.current;
        if (!img || !tr || typeof tr.getClientRect !== 'function') return null;
        const box = tr.getClientRect();
        const item = img as any;
        const elemWidth = (item.width || 100) * (img.scaleX || 1);
        const elemHeight = (item.height || 100) * (img.scaleY || 1);

        return {
            elementCenterX: box.x + box.width / 2, elementBottomY: box.y,
            width: elemWidth, height: elemHeight,
            widthCm: (elemWidth / 300 * 2.54).toFixed(1), heightCm: (elemHeight / 300 * 2.54).toFixed(1),
            onDimensionsChange: (wCm: number, hCm: number) => onTransform(id, { width: (wCm / 2.54) * 300, height: (hCm / 2.54) * 300 }),
            onDuplicate, onDelete: () => onDelete(id), onRemoveBackground: () => onRemoveBackground(id),
            onTrim: onTrim ? () => onTrim(id) : undefined, onBringToFront: onBringToFront ? () => onBringToFront(id) : undefined,
            onSendToBack: onSendToBack ? () => onSendToBack(id) : undefined, elementType: img.type,
            currentFill: (img as any).fill, onFillChange: (c: string) => onTransform(id, { fill: c }),
            currentStroke: (img as any).stroke, currentStrokeWidth: (img as any).strokeWidth,
            onStrokeChange: (c: string) => onTransform(id, { stroke: c }), onStrokeWidthChange: (w: number) => onTransform(id, { strokeWidth: w }),
            currentFontSize: (img as any).fontSize, currentFontFamily: (img as any).fontFamily,
            currentAlign: (img as any).align, currentFontStyle: (img as any).fontStyle,
            currentTextDecoration: (img as any).textDecoration,
            onFontSizeChange: (s: number) => onTransform(id, { fontSize: s }),
            onFontFamilyChange: (f: string) => onTransform(id, { fontFamily: f }),
            onAlignChange: (a: any) => onTransform(id, { align: a }),
            onCaseChange: () => { }, onFontStyleChange: (s: string) => onTransform(id, { fontStyle: s }),
            onTextDecorationChange: (d: string) => onTransform(id, { textDecoration: d }),
            availableFonts, isTransforming: false
        };
    };

    const floatingBarProps = getFloatingBarProps();

    const handleDragStart = (isAlt: boolean) => {
        const stage = stageRef.current; const layer = artboardLayerRef.current;
        if (!stage || !layer) return;
        isAltDragging.current = isAlt; dragStartPos.current = {};
        const selectedNodes = currentSelectedIds.map(id => stage.findOne('#' + id)).filter(Boolean) as Konva.Node[];
        selectedNodes.forEach(node => {
            dragStartPos.current[node.id()] = { x: node.x(), y: node.y() };
            // Keep originals solid during drag for better visual feedback
            node.opacity(1);
        });
        const pointer = stage.getPointerPosition();
        if (pointer) {
            const transform = layer.getAbsoluteTransform().copy().invert();
            dragStartPointerPos.current = transform.point(pointer);
        }
        // Content-Only Snapping: Calculate bounding box of items, NOT the transformer UI
        const boxes = selectedNodes.map(node => node.getClientRect({ relativeTo: layer, skipShadow: true }));
        const minX = Math.min(...boxes.map(b => b.x));
        const minY = Math.min(...boxes.map(b => b.y));
        const maxX = Math.max(...boxes.map(b => b.x + b.width));
        const maxY = Math.max(...boxes.map(b => b.y + b.height));

        const gRect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        dragStartGroupRect.current = gRect;
        cachedGuideStopsRef.current = getLineGuideStops(selectedNodes, layer, { x: 0, y: 0, width, height });

        if (isAlt) {
            dragStartGroupGhostRect.current = { ...gRect };
            const ghostsList = selectedNodes.map(node => ({
                id: 'ghost-' + node.id(), x: node.x(), y: node.y(), width: (node as any).width?.() || 100, height: (node as any).height?.() || 100,
                type: node.className, text: (node as any).text?.(), image: (node as any).image?.()
            }));
            ghostsRef.current = ghostsList; setGhosts(ghostsList);
        }
    };

    const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
        const isMulti = currentSelectedIds.length > 1;
        if (e.target.name() !== 'object' && !isMulti) return;
        if (isShiftPressed) { setGuides([]); setDistances([]); return; }
        const stage = stageRef.current; const layer = artboardLayerRef.current; const tr = transformerRef.current;
        const startPointer = dragStartPointerPos.current; const startBox = dragStartGroupRect.current;
        if (!stage || !layer || !startPointer || !startBox) return;
        const pointer = stage.getPointerPosition(); if (!pointer) return;
        const transform = layer.getAbsoluteTransform().copy().invert();
        const currentPointer = transform.point(pointer);
        const currentAlt = e.evt.altKey;
        if (currentAlt !== isAltDragging.current) {
            isAltDragging.current = currentAlt;
            // Handle mid-drag ghost creation/destruction
            if (currentAlt) {
                const selectedNodes = currentSelectedIds.map(id => stage.findOne('#' + id)).filter(Boolean) as Konva.Node[];
                const ghostsList = selectedNodes.map(node => {
                    const start = dragStartPos.current[node.id()];
                    return {
                        id: 'ghost-' + node.id(), x: start?.x || node.x(), y: start?.y || node.y(),
                        width: (node as any).width?.() || 100, height: (node as any).height?.() || 100,
                        type: node.className, text: (node as any).text?.(), image: (node as any).image?.()
                    };
                });
                ghostsRef.current = ghostsList;
                setGhosts(ghostsList);
            } else {
                setGhosts([]);
                ghostsRef.current = [];
            }
        }

        const magneticDist = (currentAlt ? 16 : 12) / scale;
        let deltaX = currentPointer.x - startPointer.x; let deltaY = currentPointer.y - startPointer.y;

        // Axis locking should only occur when Shift is pressed (Professional Standard)
        if (isShiftPressed) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) deltaY = 0;
            else deltaX = 0;
        }
        const vBox = { x: startBox.x + deltaX, y: startBox.y + deltaY, width: startBox.width, height: startBox.height };
        const vEdges = {
            vertical: [{ guide: vBox.x, offset: 0, orientation: 'V', snap: 'start' }, { guide: vBox.x + vBox.width / 2, offset: -vBox.width / 2, orientation: 'V', snap: 'center' }, { guide: vBox.x + vBox.width, offset: -vBox.width, orientation: 'V', snap: 'end' }],
            horizontal: [{ guide: vBox.y, offset: 0, orientation: 'H', snap: 'start' }, { guide: vBox.y + vBox.height / 2, offset: -vBox.height / 2, orientation: 'H', snap: 'center' }, { guide: vBox.y + vBox.height, offset: -vBox.height, orientation: 'H', snap: 'end' }]
        };
        const baseStops = cachedGuideStopsRef.current || { vertical: [], horizontal: [] };
        const stops = { vertical: [...baseStops.vertical], horizontal: [...baseStops.horizontal] };
        if (isAltDragging.current) {
            ghostsRef.current.forEach(g => {
                // Only snap to ghosts that are inside the artboard to avoid pulling copies outside
                const isInside = g.x >= -1 && g.y >= -1 && (g.x + g.width) <= (width + 1) && (g.y + g.height) <= (height + 1);
                if (isInside) {
                    stops.vertical.push(g.x, g.x + g.width, g.x + g.width / 2);
                    stops.horizontal.push(g.y, g.y + g.height, g.y + g.height / 2);
                }
            });
        }
        const snapGuides = getGuides(stops, vEdges, magneticDist);
        let snapCorrectionX = 0, snapCorrectionY = 0;
        snapGuides.forEach(lg => {
            if (lg.orientation === 'V') snapCorrectionX = (lg.lineGuide + lg.offset) - vBox.x;
            if (lg.orientation === 'H') snapCorrectionY = (lg.lineGuide + lg.offset) - vBox.y;
        });
        const finalDeltaX = deltaX + snapCorrectionX; const finalDeltaY = deltaY + snapCorrectionY;

        // BATCH UPDATE: Using direct node manipulation for performance during drag
        currentSelectedIds.forEach(id => {
            const n = layer.findOne('#' + id); const start = dragStartPos.current[id];
            if (n && start) {
                n.setAttrs({ x: start.x + finalDeltaX, y: start.y + finalDeltaY });
            }
        });

        // SYNC TRANSFORMER: Lock it to the new positions
        if (isMulti && tr) {
            tr.getLayer()?.batchDraw();
        }

        const activeDistances: any[] = [];
        if (isAltDragging.current && dragStartGroupGhostRect.current) {
            const start = dragStartGroupGhostRect.current; const cur = { x: startBox.x + finalDeltaX, y: startBox.y + finalDeltaY, w: startBox.width, h: startBox.height };
            if (Math.abs(cur.x - start.x) > 5 && Math.abs(cur.y - start.y) < 10) {
                activeDistances.push({ type: 'h', x1: Math.min(start.x + start.width, cur.x), x2: Math.max(start.x, cur.x + cur.w), y: start.y + start.height / 2, value: Math.round(Math.abs(cur.x - (start.x + start.width))) });
            }
        }
        setDistances(activeDistances); setGuides(snapGuides);

        // Update live out of bounds count during drag
        const currentCount = calculateOutOfBoundsCount();
        setLiveOutOfBoundsCount(currentCount);
    };

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        setGuides([]); setDistances([]); const stage = stageRef.current; if (!stage) return;
        const isAlt = isAltDragging.current; const targetId = e.target.id(); const startPos = dragStartPos.current[targetId];
        if (isAlt) {
            currentSelectedIds.forEach(id => { const n = stage.findOne('#' + id); if (n) n.opacity(1); });
            onDuplicate({
                isAltDrag: true, sourceIds: currentSelectedIds, leaderId: targetId, x: startPos?.x || 0, y: startPos?.y || 0,
                targetPositions: currentSelectedIds.map(id => { const n = stage.findOne('#' + id); return { id, x: n?.x() || 0, y: n?.y() || 0 }; })
            });
            setGhosts([]); ghostsRef.current = []; dragStartGroupGhostRect.current = null; isAltDragging.current = false;
        } else {
            const updates = currentSelectedIds.map(id => { const n = stage.findOne('#' + id); return { id, attrs: { x: n?.x(), y: n?.y() } }; });
            onUpdateMany?.(updates);
        }
        dragStartPointerPos.current = null; dragStartGroupRect.current = null;
    };

    useEffect(() => {
        const kd = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
            if (e.code === 'Space' && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
                setIsSpacePressed(true);
            }
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            // Design Tool Shortcuts
            if (e.shiftKey) {
                if (e.key === '1') { e.preventDefault(); handleFitScreen(); }
                if (e.key === '2') { e.preventDefault(); handleZoomToSelection(); }
                if (e.key === '0') { e.preventDefault(); setScale(1); if (onScaleChange) onScaleChange(1); }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { }

            if (e.key === 'Delete' || e.key === 'Backspace') currentSelectedIds.forEach(id => onDelete(id));
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); onDuplicate({ sourceIds: currentSelectedIds }); }
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault(); const step = e.shiftKey ? 10 : 1;
                currentSelectedIds.forEach(id => {
                    const img = images.find(i => i.id === id);
                    if (img) {
                        let dx = 0, dy = 0; if (e.key === 'ArrowLeft') dx = -step; else if (e.key === 'ArrowRight') dx = step; else if (e.key === 'ArrowUp') dy = -step; else if (e.key === 'ArrowDown') dy = step;
                        onTransform(id, { x: img.x + dx, y: img.y + dy });
                    }
                });
            }
        };
        const ku = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
            if (e.code === 'Space') setIsSpacePressed(false);
        };
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    }, [currentSelectedIds, images, onDelete, onDuplicate, onTransform]);


    return (
        <div ref={containerRef} className="konva-canvas-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#18181b' }} onDrop={onDrop} onDragOver={onDragOver}>
            <Stage
                ref={stageRef}
                width={size.width}
                height={size.height}
                scaleX={scale} scaleY={scale}
                x={position.x} y={position.y}
                draggable={isSpacePressed || (!isShiftPressed && !currentSelectedIds.length)}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDragMove={(e) => {
                    if (e.target === stageRef.current) {
                        const newPos = { x: e.target.x(), y: e.target.y() };
                        // SYNC TARGETS: Crucial to prevent the interpolation loop from fighting the drag
                        targetPos.current = newPos;
                        setPosition(newPos);
                        onStagePosChange?.(newPos);
                    }
                }}
                style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
            >
                <Layer ref={artboardLayerRef}>
                    <Group>
                        <Rect x={0} y={0} width={width} height={height} fill={backgroundColor === 'transparent' ? 'white' : (backgroundColor || 'white')} shadowColor="black" shadowBlur={40} shadowOpacity={0.3} shadowOffset={{ x: 0, y: 10 }} name="background-rect" />
                        <Group clip={{ x: 0, y: 0, width, height }}>
                            {backgroundColor === 'transparent' && <CheckerboardBackground width={width} height={height} />}
                            {ghosts.map(g => {
                                const sw = 2 / scale;
                                const com = {
                                    x: g.x, y: g.y, width: g.width, height: g.height,
                                    opacity: 0.5,
                                    stroke: '#4a90e2',
                                    strokeWidth: sw,
                                    dash: [4 / scale, 4 / scale]
                                };
                                if (g.type === 'Image') return <Image key={g.id} {...com} image={g.image} />;
                                if (g.type === 'Text') return <Text key={g.id} {...com} text={g.text} fontSize={g.fontSize} fontFamily={g.fontFamily} />;
                                return <Rect key={g.id} {...com} fill="#e2e8f0" cornerRadius={2} />;
                            })}
                            {images.map((img) => (
                                <MemoizedRenderItem key={img.id} item={img} onDragStart={(_: any, isAlt: boolean) => handleDragStart(isAlt)} onDragMove={(e: any) => handleDragMove(e)} onDragEnd={handleDragEnd} onTransformEnd={(e: any) => {
                                    const node = e.target; const sx = node.scaleX(); const sy = node.scaleY(); node.scaleX(1); node.scaleY(1);
                                    onTransform(node.id(), { x: node.x(), y: node.y(), rotation: node.rotation(), width: node.width() * sx, height: node.height() * sy });
                                }} />
                            ))}
                        </Group>
                    </Group>
                    <Transformer ref={transformerRef} keepRatio={true} padding={0} borderStroke="#a855f7" strokeWidth={1} anchorStroke="#a855f7" anchorFill="#ffffff" anchorSize={8} anchorCornerRadius={2} rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]} rotationSnapTolerance={10} enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']} boundBoxFunc={(o, n) => n.width < 5 || n.height < 5 ? o : n} />
                    {selectionRect && <Rect fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth={1} {...selectionRect} />}
                    {guides.map((g, i) => {
                        const Magenta = '#d946ef'; const sw = 1.5 / scale; const dash = [4 / scale, 4 / scale];
                        return <Line key={i} points={g.orientation === 'V' ? [g.lineGuide, -50000, g.lineGuide, 50000] : [-50000, g.lineGuide, 50000, g.lineGuide]} stroke={Magenta} strokeWidth={sw} dash={dash} />;
                    })}
                    {distances.map((d, i) => {
                        const Magenta = '#d946ef'; const ts = 1 / scale;
                        return (
                            <Group key={i}>
                                <Line points={d.type === 'h' ? [d.x1, d.y, d.x2, d.y] : [d.x, d.y1, d.x, d.y2]} stroke={Magenta} strokeWidth={1 / scale} />
                                <Rect x={d.type === 'h' ? (d.x1 + d.x2) / 2 - 15 * ts : d.x - 15 * ts} y={d.type === 'h' ? d.y - 8 * ts : (d.y1 + d.y2) / 2 - 8 * ts} width={30 * ts} height={16 * ts} fill={Magenta} cornerRadius={4 * ts} />
                                <Text x={d.type === 'h' ? (d.x1 + d.x2) / 2 - 15 * ts : d.x - 15 * ts} y={d.type === 'h' ? d.y - 6 * ts : (d.y1 + d.y2) / 2 - 6 * ts} width={30 * ts} text={String(d.value)} fill="white" fontSize={10 * ts} align="center" fontStyle="bold" />
                            </Group>
                        );
                    })}
                </Layer>
            </Stage>
            {floatingBarProps && <FloatingElementBar {...floatingBarProps as any} />}
            {liveOutOfBoundsCount > 0 && (
                <div style={{ position: 'absolute', right: '24px', top: '24px', zIndex: 10000, animation: 'floatAndPulse 0.4s ease' }}>
                    <div style={{ background: 'rgba(20, 20, 25, 0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column', width: '260px', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>Objetos Fora</span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{liveOutOfBoundsCount} itens detectados</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleFitScreen} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>FOCAR PÁGINA</button>
                            <button onClick={handleRevealAll} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>VER TUDO</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes floatAndPulse { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default KonvaCanvas;
