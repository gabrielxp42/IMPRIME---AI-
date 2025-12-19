/**
 * ShapeRenderer - Renderiza formas geométricas no Konva Canvas
 */

import React, { useEffect, useRef } from 'react';
import { Rect, Circle, Ellipse, Star, RegularPolygon, Arrow, Line } from 'react-konva';
import Konva from 'konva';
import { ShapeElement } from '../../types/canvas-elements';

interface ShapeRendererProps {
    shape: ShapeElement;
    isSelected: boolean;
    onSelect: () => void;
    onTransform: (attrs: Partial<ShapeElement>) => void;
    onDragEnd: (attrs: { x: number; y: number }) => void;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({
    shape,
    isSelected,
    onSelect,
    onTransform,
    onDragEnd,
}) => {
    const shapeRef = useRef<any>(null);

    // Attach transformer when selected
    useEffect(() => {
        // Global transformer handles this via ID
    }, [isSelected]);

    const commonProps = {
        id: shape.id,
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation,
        scaleX: shape.scaleX,
        scaleY: shape.scaleY,
        fill: shape.fill || '#3b82f6',
        stroke: shape.stroke || '#1e40af',
        strokeWidth: shape.strokeWidth || 2,
        opacity: shape.opacity || 1,
        // Sombras
        shadowColor: shape.shadowEnabled ? (shape.shadowColor || 'black') : undefined,
        shadowBlur: shape.shadowEnabled ? (shape.shadowBlur || 10) : 0,
        shadowOpacity: shape.shadowEnabled ? (shape.shadowOpacity || 0.5) : 0,
        shadowOffset: shape.shadowEnabled ? { x: shape.shadowOffsetX || 5, y: shape.shadowOffsetY || 5 } : { x: 0, y: 0 },
        // Linha Tracejada
        dash: shape.dashEnabled ? (shape.dash || [10, 5]) : undefined,

        draggable: !shape.locked,
        visible: shape.visible,
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
            onDragEnd({
                x: e.target.x(),
                y: e.target.y(),
            });
        },
        onTransformEnd: (e: Konva.KonvaEventObject<any>) => {
            const stage = e.target.getStage();
            const transformer = stage?.findOne('Transformer') as any;
            const transformerNodes = transformer ? (typeof transformer.nodes === 'function' ? transformer.nodes() : (transformer.nodes || [])) : [];
            if (transformerNodes.length > 1) return;

            const node = shapeRef.current;
            if (!node) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // Reset scale and update proportions
            node.scaleX(1);
            node.scaleY(1);

            const attrs: any = {
                x: node.x(),
                y: node.y(),
                rotation: node.rotation(),
                scaleX: 1,
                scaleY: 1,
            };

            // Diferenciação por tipo de forma para evitar drift
            if (shape.shapeType === 'rectangle') {
                attrs.width = Math.max(5, node.width() * scaleX);
                attrs.height = Math.max(5, node.height() * scaleY);
            } else if (shape.shapeType === 'circle' || shape.shapeType === 'polygon') {
                attrs.radius = Math.max(5, (shape.radius || 75) * scaleX);
            } else if (shape.shapeType === 'ellipse') {
                attrs.radiusX = Math.max(5, (shape.radiusX || 100) * scaleX);
                attrs.radiusY = Math.max(5, (shape.radiusY || 60) * scaleY);
            } else if (shape.shapeType === 'star') {
                attrs.innerRadius = Math.max(2, (shape.innerRadius || 35) * scaleX);
                attrs.outerRadius = Math.max(5, (shape.outerRadius || 75) * scaleX);
            }

            onTransform(attrs);
        },
    };

    const renderShape = () => {
        switch (shape.shapeType) {
            case 'rectangle':
                return (
                    <Rect
                        ref={shapeRef}
                        {...commonProps}
                        width={shape.width}
                        height={shape.height}
                        cornerRadius={shape.cornerRadius || 0}
                    />
                );

            case 'circle':
                return (
                    <Circle
                        ref={shapeRef}
                        {...commonProps}
                        radius={shape.radius || 75}
                    />
                );

            case 'ellipse':
                return (
                    <Ellipse
                        ref={shapeRef}
                        {...commonProps}
                        radiusX={shape.radiusX || 100}
                        radiusY={shape.radiusY || 60}
                    />
                );

            case 'star':
                return (
                    <Star
                        ref={shapeRef}
                        {...commonProps}
                        numPoints={shape.sides || 5}
                        innerRadius={shape.innerRadius || 35}
                        outerRadius={shape.outerRadius || 75}
                    />
                );

            case 'polygon':
                return (
                    <RegularPolygon
                        ref={shapeRef}
                        {...commonProps}
                        sides={shape.sides || 6}
                        radius={shape.radius || 75}
                    />
                );

            case 'arrow':
                return (
                    <Arrow
                        ref={shapeRef}
                        {...commonProps}
                        points={shape.points || [0, 0, 200, 0]}
                        pointerLength={20}
                        pointerWidth={20}
                    />
                );

            case 'line':
                return (
                    <Line
                        ref={shapeRef}
                        {...commonProps}
                        points={shape.points || [0, 0, 200, 0]}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <>
            {renderShape()}
        </>
    );
};

export default ShapeRenderer;
