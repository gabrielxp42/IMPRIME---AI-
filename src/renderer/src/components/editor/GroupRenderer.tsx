/**
 * GroupRenderer - Renderiza grupos de elementos no Konva Canvas
 * Gerencia a renderização recursiva de elementos dentro de um grupo
 */

import React, { memo } from 'react';
import { Group } from 'react-konva';
import { GroupElement, CanvasElement } from '../../types/canvas-elements';
import ShapeRenderer from './ShapeRenderer';
// Note: URLImage cannot be imported directly to avoid circular dependency if we move this logic.
// But we can pass the render function as a prop or just define it in KonvaCanvas.

interface GroupRendererProps {
    group: GroupElement;
    isSelected: boolean;
    onSelect: (isCtrl: boolean) => void;
    onTransform: (id: string, attrs: Partial<CanvasElement>) => void;
    renderElement: (element: CanvasElement) => React.ReactNode;
}

const GroupRenderer: React.FC<GroupRendererProps> = memo(({ group, isSelected, onSelect, onTransform, renderElement }) => {
    return (
        <Group
            id={group.id}
            x={group.x}
            y={group.y}
            rotation={group.rotation}
            scaleX={group.scaleX}
            scaleY={group.scaleY}
            draggable={!group.locked}
            visible={group.visible}
            onClick={(e) => {
                e.cancelBubble = true;
                onSelect(e.evt.ctrlKey || e.evt.metaKey);
            }}
            onTap={(e) => {
                e.cancelBubble = true;
                onSelect(false);
            }}
            onDragEnd={(e) => {
                onTransform(group.id, {
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
            onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                node.scaleX(1);
                node.scaleY(1);

                onTransform(group.id, {
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                    scaleX: scaleX, // Grupos geralmente mantêm escala ou aplicam aos filhos. 
                    scaleY: scaleY, // No nosso caso, mantemos a escala do grupo.
                });
            }}
        >
            {group.children.map(renderElement)}
        </Group>
    );
});

export default GroupRenderer;
