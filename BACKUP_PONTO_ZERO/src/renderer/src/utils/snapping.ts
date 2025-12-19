import Konva from 'konva';

export interface SnapLine {
    vertical: boolean;
    offset: number;
    start: number;
    end: number;
    diff?: number;
    snap?: 'start' | 'center' | 'end';
}

export const getLineGuideStops = (skipShape: Konva.Shape, stage: Konva.Stage) => {
    const vertical: number[] = [0, stage.width() / 2, stage.width()];
    const horizontal: number[] = [0, stage.height() / 2, stage.height()];

    stage.find('.object').forEach((guideItem) => {
        if (guideItem === skipShape) {
            return;
        }
        const box = guideItem.getClientRect();
        vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
        horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });
    return {
        vertical,
        horizontal,
    };
};

export const getObjectSnappingEdges = (node: Konva.Shape) => {
    const box = node.getClientRect();
    const absPos = node.absolutePosition();

    return {
        vertical: [
            {
                guide: Math.round(box.x),
                offset: Math.round(absPos.x - box.x),
                snap: 'start',
            },
            {
                guide: Math.round(box.x + box.width / 2),
                offset: Math.round(absPos.x - box.x - box.width / 2),
                snap: 'center',
            },
            {
                guide: Math.round(box.x + box.width),
                offset: Math.round(absPos.x - box.x - box.width),
                snap: 'end',
            },
        ],
        horizontal: [
            {
                guide: Math.round(box.y),
                offset: Math.round(absPos.y - box.y),
                snap: 'start',
            },
            {
                guide: Math.round(box.y + box.height / 2),
                offset: Math.round(absPos.y - box.y - box.height / 2),
                snap: 'center',
            },
            {
                guide: Math.round(box.y + box.height),
                offset: Math.round(absPos.y - box.y - box.height),
                snap: 'end',
            },
        ],
    };
};

export const getGuides = (
    lineGuideStops: { vertical: number[]; horizontal: number[] },
    itemBounds: { vertical: any[]; horizontal: any[] },
    snapDist = 10
) => {
    const resultV: SnapLine[] = [];
    const resultH: SnapLine[] = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
        itemBounds.vertical.forEach((itemBound) => {
            const diff = Math.abs(lineGuide - itemBound.guide);
            if (diff < snapDist) {
                resultV.push({
                    vertical: true,
                    offset: itemBound.offset,
                    start: lineGuide,
                    end: lineGuide,
                    diff: diff,
                    snap: itemBound.snap,
                });
            }
        });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
        itemBounds.horizontal.forEach((itemBound) => {
            const diff = Math.abs(lineGuide - itemBound.guide);
            if (diff < snapDist) {
                resultH.push({
                    vertical: false,
                    offset: itemBound.offset,
                    start: lineGuide,
                    end: lineGuide,
                    diff: diff,
                    snap: itemBound.snap,
                });
            }
        });
    });

    const guides: SnapLine[] = [];

    const minV = resultV.sort((a, b) => a.diff! - b.diff!)[0];
    if (minV) {
        guides.push({
            vertical: true,
            offset: minV.offset,
            start: minV.start,
            end: 0,
            snap: minV.snap
        });
    }

    const minH = resultH.sort((a, b) => a.diff! - b.diff!)[0];
    if (minH) {
        guides.push({
            vertical: false,
            offset: minH.offset,
            start: minH.start,
            end: 0,
            snap: minH.snap
        });
    }

    return guides;
};

// ========== SMART SPACING ==========
// Detecta quando objetos estão igualmente espaçados

export interface SpacingGuide {
    type: 'horizontal' | 'vertical';
    distance: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface ObjectBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    right: number;
    bottom: number;
}

export const getSpacingGuides = (
    movingShape: Konva.Shape,
    stage: Konva.Stage,
    tolerance = 10
): SpacingGuide[] => {
    const spacingGuides: SpacingGuide[] = [];

    // Pegar bounds do objeto sendo movido
    const movingBox = movingShape.getClientRect();
    const moving: ObjectBounds = {
        x: movingBox.x,
        y: movingBox.y,
        width: movingBox.width,
        height: movingBox.height,
        centerX: movingBox.x + movingBox.width / 2,
        centerY: movingBox.y + movingBox.height / 2,
        right: movingBox.x + movingBox.width,
        bottom: movingBox.y + movingBox.height
    };

    // Pegar todos os outros objetos
    const otherObjects: ObjectBounds[] = [];
    stage.find('.object').forEach((item) => {
        if (item === movingShape) return;
        const box = item.getClientRect();
        otherObjects.push({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            centerX: box.x + box.width / 2,
            centerY: box.y + box.height / 2,
            right: box.x + box.width,
            bottom: box.y + box.height
        });
    });

    // Precisa de pelo menos 2 objetos para comparar espaçamentos
    if (otherObjects.length < 2) {
        return spacingGuides;
    }

    // Incluir o objeto sendo movido para análise
    const allObjects = [...otherObjects, moving];

    // Ordenar por X para verificar espaçamento horizontal
    const sortedByX = [...allObjects].sort((a, b) => a.x - b.x);

    // Verificar espaçamentos horizontais (3 objetos em sequência)
    for (let i = 0; i < sortedByX.length - 2; i++) {
        const obj1 = sortedByX[i];
        const obj2 = sortedByX[i + 1];
        const obj3 = sortedByX[i + 2];

        const gap1 = obj2.x - obj1.right;
        const gap2 = obj3.x - obj2.right;

        // Se os gaps são iguais (dentro da tolerância) e o objeto do meio é o que move
        if (gap1 > 5 && gap2 > 5 && Math.abs(gap1 - gap2) < tolerance && obj2 === moving) {
            spacingGuides.push({
                type: 'horizontal',
                distance: gap1,
                x1: obj1.right,
                y1: obj1.centerY,
                x2: moving.x,
                y2: moving.centerY
            });
            spacingGuides.push({
                type: 'horizontal',
                distance: gap2,
                x1: moving.right,
                y1: moving.centerY,
                x2: obj3.x,
                y2: obj3.centerY
            });
        }
    }

    // Ordenar por Y para verificar espaçamento vertical
    const sortedByY = [...allObjects].sort((a, b) => a.y - b.y);

    for (let i = 0; i < sortedByY.length - 2; i++) {
        const obj1 = sortedByY[i];
        const obj2 = sortedByY[i + 1];
        const obj3 = sortedByY[i + 2];

        const gap1 = obj2.y - obj1.bottom;
        const gap2 = obj3.y - obj2.bottom;

        if (gap1 > 5 && gap2 > 5 && Math.abs(gap1 - gap2) < tolerance && obj2 === moving) {
            spacingGuides.push({
                type: 'vertical',
                distance: gap1,
                x1: obj1.centerX,
                y1: obj1.bottom,
                x2: moving.centerX,
                y2: moving.y
            });
            spacingGuides.push({
                type: 'vertical',
                distance: gap2,
                x1: moving.centerX,
                y1: moving.bottom,
                x2: obj3.centerX,
                y2: obj3.y
            });
        }
    }

    if (spacingGuides.length > 0) {
        console.log('[SPACING] Guias encontradas:', spacingGuides.length);
    }

    return spacingGuides;
};
