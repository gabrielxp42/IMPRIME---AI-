/**
 * TextRenderer - Renderiza elementos de texto no Konva Canvas
 */

import React, { useRef, memo } from 'react';
import { Text } from 'react-konva';
import Konva from 'konva';
import { TextElement } from '../../types/canvas-elements';

interface TextRendererProps {
    textItem: TextElement;
    isSelected: boolean;
    onSelect: (isCtrl: boolean) => void;
    onTransform: (attrs: Partial<TextElement>) => void;
    onDblClick?: (id: string) => void;
}

const TextRenderer: React.FC<TextRendererProps> = memo(({ textItem, onSelect, onTransform, onDblClick }) => {
    const textRef = useRef<Konva.Text>(null);

    return (
        <Text
            ref={textRef}
            id={textItem.id}
            x={textItem.x}
            y={textItem.y}
            text={textItem.text}
            fontSize={textItem.fontSize}
            fontFamily={textItem.fontFamily}
            fontStyle={textItem.fontStyle || 'normal'}
            fill={textItem.fill || '#000000'}
            stroke={textItem.stroke}
            strokeWidth={textItem.strokeWidth}
            align={textItem.align || 'left'}
            width={textItem.width}
            height={textItem.height}
            rotation={textItem.rotation}
            scaleX={textItem.scaleX}
            scaleY={textItem.scaleY}
            opacity={textItem.opacity || 1}
            draggable={!textItem.locked}
            visible={textItem.visible}
            shadowColor={textItem.shadowColor}
            shadowBlur={textItem.shadowBlur}
            shadowOpacity={textItem.shadowOpacity}
            shadowOffset={textItem.shadowOffset}
            onDblClick={(e) => {
                e.cancelBubble = true;
                if (onDblClick) onDblClick(textItem.id);
            }}
            onClick={(e) => {
                e.cancelBubble = true;
                onSelect(e.evt.ctrlKey || e.evt.metaKey);
            }}
            onTap={(e) => {
                e.cancelBubble = true;
                onSelect(false);
            }}
            onDragEnd={(e) => {
                onTransform({
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
            onTransformEnd={(e) => {
                const stage = e.target.getStage();
                const transformer = stage?.findOne('Transformer') as any;
                const transformerNodes = transformer ? (typeof transformer.nodes === 'function' ? transformer.nodes() : (transformer.nodes || [])) : [];
                if (transformerNodes.length > 1) return;

                const node = textRef.current;
                if (!node) return;

                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                node.scaleX(1);
                node.scaleY(1);

                onTransform({
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                    scaleX: 1,
                    scaleY: 1,
                });
            }}
        />
    );
});

export default TextRenderer;
