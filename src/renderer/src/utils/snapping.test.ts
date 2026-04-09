import { describe, it, expect, vi } from 'vitest';
import { getLineGuideStops, getObjectSnappingEdges, getGuides, SnapLine } from './snapping';
import Konva from 'konva';

// Mock Konva Node
const createMockNode = (id: string, rect: { x: number, y: number, width: number, height: number }) => {
    return {
        id: () => id,
        x: () => rect.x,
        y: () => rect.y,
        width: () => rect.width,
        height: () => rect.height,
        rotation: () => 0,
        scaleX: () => 1,
        scaleY: () => 1,
        getClientRect: () => rect,
        getParent: () => ({}), // Mock parent
        getLayer: () => ({}), // Mock layer
    } as unknown as Konva.Node;
};

// Mock Konva Container
const createMockContainer = (nodes: any[]) => {
    return {
        find: (selector: string) => {
            if (selector === '.object') return nodes;
            return [];
        },
        findOne: (selector: string) => {
            if (selector.startsWith('#')) {
                const id = selector.substring(1);
                return nodes.find(n => n.id() === id);
            }
            if (selector === '.background-rect') return null; // Assume artboard dimensions passed explicitly
            return null;
        }
    } as unknown as Konva.Container;
};

describe('Snapping Utils', () => {
    
    describe('getLineGuideStops', () => {
        it('should return correct stops for artboard center and edges', () => {
            const artboard = { x: 0, y: 0, width: 800, height: 600 };
            const container = createMockContainer([]);
            
            const stops = getLineGuideStops([], container, artboard);
            
            expect(stops.vertical).toContain(0);   // Left
            expect(stops.vertical).toContain(400); // Center
            expect(stops.vertical).toContain(800); // Right
            
            expect(stops.horizontal).toContain(0);   // Top
            expect(stops.horizontal).toContain(300); // Center
            expect(stops.horizontal).toContain(600); // Bottom
        });

        it('should return stops for other objects', () => {
            const obj1 = createMockNode('1', { x: 100, y: 100, width: 50, height: 50 });
            const container = createMockContainer([obj1]);
            const artboard = { x: 0, y: 0, width: 800, height: 600 };
            
            const stops = getLineGuideStops([], container, artboard);
            
            // Object 1 vertical stops
            expect(stops.vertical).toContain(100);     // Left
            expect(stops.vertical).toContain(125);     // Center
            expect(stops.vertical).toContain(150);     // Right
        });

        it('should skip specified shapes', () => {
            const obj1 = createMockNode('1', { x: 100, y: 100, width: 50, height: 50 });
            const container = createMockContainer([obj1]);
            const artboard = { x: 0, y: 0, width: 800, height: 600 };
            
            const stops = getLineGuideStops([obj1], container, artboard);
            
            // Should ONLY contain artboard stops
            expect(stops.vertical).not.toContain(100);
            expect(stops.vertical).toHaveLength(3); // 0, 400, 800
        });
    });

    describe('getGuides', () => {
        it('should find closest vertical snap', () => {
            const stops = { vertical: [0, 400, 800], horizontal: [0, 300, 600] };
            const itemBounds = {
                vertical: [{ guide: 398, offset: 10, snap: 'center' }], // Close to 400
                horizontal: [{ guide: 50, offset: 0, snap: 'start' }]   // Far from any horizontal stop
            };
            
            const guides = getGuides(stops, itemBounds, 5);
            
            expect(guides).toHaveLength(1);
            expect(guides[0].orientation).toBe('V');
            expect(guides[0].lineGuide).toBe(400);
            expect(guides[0].snap).toBe('center');
        });

        it('should return both V and H guides if close enough', () => {
            const stops = { vertical: [400], horizontal: [300] };
            const itemBounds = {
                vertical: [{ guide: 401, offset: 0, snap: 'start' }],
                horizontal: [{ guide: 299, offset: 0, snap: 'start' }]
            };
            
            const guides = getGuides(stops, itemBounds, 5);
            
            expect(guides).toHaveLength(2);
        });
        
        it('should return empty if no guides are close', () => {
             const stops = { vertical: [400], horizontal: [300] };
            const itemBounds = {
                vertical: [{ guide: 500, offset: 0, snap: 'start' }],
                horizontal: [{ guide: 500, offset: 0, snap: 'start' }]
            };
            
            const guides = getGuides(stops, itemBounds, 5);
            expect(guides).toHaveLength(0);
        });
    });
});
