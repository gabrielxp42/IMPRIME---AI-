import Konva from 'konva';

export interface SnapLine {
    lineGuide: number;
    offset: number;
    orientation: 'V' | 'H';
    snap: 'start' | 'center' | 'end';
}

/**
 * Gets snapping targets in LOGICAL coordinates (relative to the given container).
 */
export function getLineGuideStops(
    skipShapes: Konva.Node[],
    container: Konva.Container,
    artboardDimensions?: { x: number, y: number, width: number, height: number }
) {
    const vertical: number[] = [];
    const horizontal: number[] = [];

    // 1. Artboard Snapping (Mathematical Accuracy)
    if (artboardDimensions) {
        const { x, y, width, height } = artboardDimensions;
        // Snap to edges and center of the paper
        vertical.push(x, x + width / 2, x + width);
        horizontal.push(y, y + height / 2, y + height);
    } else {
        // Fallback to searching if dimensions aren't provided
        const artboard = container.findOne('.background-rect');
        if (artboard) {
            const box = artboard.getClientRect({ relativeTo: container, skipShadow: true });
            vertical.push(box.x, box.x + box.width / 2, box.x + box.width);
            horizontal.push(box.y, box.y + box.height / 2, box.y + box.height);
        }
    }

    // 2. Other Objects (Only snap to objects that are INSIDE the artboard)
    container.find('.object').forEach((guideItem) => {
        if (skipShapes.includes(guideItem)) return;

        const box = guideItem.getClientRect({ relativeTo: container, skipShadow: true });

        // Safety: If the target object is outside the artboard, don't use it as a snapping guide
        if (artboardDimensions) {
            const isOutside =
                box.x < -1 || box.y < -1 ||
                (box.x + box.width) > (artboardDimensions.width + 1) ||
                (box.y + box.height) > (artboardDimensions.height + 1);
            if (isOutside) return;
        }

        vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
        horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });

    return {
        vertical,
        horizontal,
    };
}

/**
 * Gets snapping edges of the moving node in LOGICAL coordinates (relative to its parent).
 */
export function getObjectSnappingEdges(node: Konva.Node) {
    const parent = node.getParent() || node.getLayer();
    if (!parent) return { vertical: [], horizontal: [] };

    const box = node.getClientRect({ relativeTo: parent, skipShadow: true });
    const curX = node.x();
    const curY = node.y();

    return {
        vertical: [
            {
                guide: box.x,
                offset: curX - box.x,
                snap: 'start',
            },
            {
                guide: box.x + box.width / 2,
                offset: curX - (box.x + box.width / 2),
                snap: 'center',
            },
            {
                guide: box.x + box.width,
                offset: curX - (box.x + box.width),
                snap: 'end',
            },
        ],
        horizontal: [
            {
                guide: box.y,
                offset: curY - box.y,
                snap: 'start',
            },
            {
                guide: box.y + box.height / 2,
                offset: curY - (box.y + box.height / 2),
                snap: 'center',
            },
            {
                guide: box.y + box.height,
                offset: curY - (box.y + box.height),
                snap: 'end',
            },
        ],
    };
}

/**
 * Finds the closest snapping guides in LOGICAL space.
 */
export function getGuides(
    lineGuideStops: { vertical: number[], horizontal: number[] },
    itemBounds: any,
    snapDist = 5
): SnapLine[] {
    const resultV: any[] = [];
    const resultH: any[] = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
        itemBounds.vertical.forEach((itemBound: any) => {
            const diff = Math.abs(lineGuide - itemBound.guide);
            if (diff < snapDist) {
                resultV.push({
                    lineGuide: lineGuide,
                    diff: diff,
                    snap: itemBound.snap,
                    offset: itemBound.offset,
                });
            }
        });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
        itemBounds.horizontal.forEach((itemBound: any) => {
            const diff = Math.abs(lineGuide - itemBound.guide);
            if (diff < snapDist) {
                resultH.push({
                    lineGuide: lineGuide,
                    diff: diff,
                    snap: itemBound.snap,
                    offset: itemBound.offset,
                });
            }
        });
    });

    const guides: SnapLine[] = [];

    // Pick the absolute closest guide in each direction
    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

    if (minV) {
        guides.push({
            lineGuide: minV.lineGuide,
            offset: minV.offset,
            orientation: 'V',
            snap: minV.snap,
        });
    }
    if (minH) {
        guides.push({
            lineGuide: minH.lineGuide,
            offset: minH.offset,
            orientation: 'H',
            snap: minH.snap,
        });
    }

    return guides;
}
