/**
 * ShapeElement - Tipos de formas geométricas para o editor
 */

export type ShapeType = 'rectangle' | 'circle' | 'ellipse' | 'star' | 'polygon' | 'line' | 'arrow';

export interface ShapeElement {
    type: 'shape';
    shapeType: ShapeType;
    id: string;
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
    // Propriedades de estilo
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    // Específicas por tipo
    radius?: number; // Para círculo
    radiusX?: number; // Para elipse
    radiusY?: number; // Para elipse
    sides?: number; // Para polígono
    innerRadius?: number; // Para estrela
    outerRadius?: number; // Para estrela
    points?: number[]; // Para linha/seta
    cornerRadius?: number; // Para retângulo arredondado
    // Estilos de linha
    dash?: number[];
    dashEnabled?: boolean;
    // Sombras
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowOpacity?: number;
    shadowEnabled?: boolean;
}

export interface TextElement {
    type: 'text';
    id: string;
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
    // Propriedades de texto
    text: string;
    fontSize: number;
    fontFamily: string;
    fontStyle?: 'normal' | 'bold' | 'italic';
    textDecoration?: 'underline' | 'line-through' | '';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    opacity?: number;
    // Efeitos
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffset?: { x: number; y: number };
    shadowOpacity?: number;
}

export interface GroupElement {
    type: 'group';
    id: string;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    visible: boolean;
    locked: boolean;
    name?: string;
    children: CanvasElement[];
}

// União de todos os tipos de elementos
export type CanvasElement = ImageElement | ShapeElement | TextElement | GroupElement;

export interface ImageElement {
    type: 'image';
    id: string;
    src: string;
    srcRef?: string; // OTIMIZAÇÃO: ID da imagem original (para cópias, evita duplicar Base64)
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
    opacity?: number;
    // Filtros de imagem
    filters?: {
        brightness?: number; // -1 a 1
        contrast?: number; // -100 a 100
        saturation?: number; // -2 a 10
        grayscale?: boolean;
        blur?: number; // 0 a 40
        invert?: boolean;
        sepia?: boolean;
    };
}

export interface LibraryItem {
    id: string;
    file: File;
    displayName: string;
    path: string; // Folder structure "Folder/Subfolder"
}

export interface DocumentSettings {
    width: number;
    height: number;
    dpi: number;
    unit: 'px' | 'cm' | 'mm';
    background: string;
    aspectRatio?: string;
    widthCm?: number;
    heightCm?: number;
    name?: string;
    backgroundColor?: 'transparent' | 'white' | 'black';
}

