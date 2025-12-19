import Konva from 'konva';

export interface SnapLine {
    vertical: boolean;
    offset: number;
    start: number;
    end: number;
    diff?: number;
    snap?: 'start' | 'center' | 'end';
}

interface NodeBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
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
                    end: lineGuide, // Será calculado depois
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
            end: 0, // Placeholder
            snap: minV.snap
        });
    }

    const minH = resultH.sort((a, b) => a.diff! - b.diff!)[0];
    if (minH) {
        guides.push({
            vertical: false,
            offset: minH.offset,
            start: minH.start,
            end: 0, // Placeholder
            snap: minH.snap
        });
    }

    return guides;
};
