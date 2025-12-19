/**
 * PropertiesPanel - Painel Lateral Direito para Edição
 * Design: Glassmorphism Roxo
 */

import React from 'react';
import { CanvasElement, ShapeElement, ImageElement } from '../../types/canvas-elements';
import { Palette, Layers, Image as ImageIcon, Trash2, Copy } from 'lucide-react';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
    selectedElement: CanvasElement | null;
    onUpdate: (id: string, attrs: Partial<CanvasElement>) => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    dpi?: number;
}

const COLORS = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#000000', // Black
    '#ffffff', // White
    'transparent'
];

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedElement,
    onUpdate,
    onDelete,
    onDuplicate,
    dpi = 300
}) => {
    if (!selectedElement) {
        return (
            <div className="properties-panel empty" role="complementary" aria-label="Painel de propriedades">
                <div className="empty-state">
                    <Layers size={48} className="empty-icon" aria-hidden="true" />
                    <p>Selecione um elemento para editar</p>
                </div>
            </div>
        );
    }

    const handleChange = (key: string, value: any) => {
        onUpdate(selectedElement.id, { [key]: value });
    };

    const pxToCm = (px: number) => parseFloat(((px / dpi) * 2.54).toFixed(2));
    const cmToPx = (cm: number) => (cm / 2.54) * dpi;

    const getSliderStyle = (value: number, min: number, max: number) => {
        const percentage = ((value - min) / (max - min)) * 100;
        return {
            background: `linear-gradient(to right, #4f46e5 0%, #ec4899 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`
        };
    };

    // Renderização específica para SHAPES
    const renderShapeProperties = (shape: ShapeElement) => (
        <div className="properties-content" role="form" aria-label="Propriedades da forma">
            {/* Cabeçalho */}
            <div className="panel-header">
                <div className="element-icon" aria-hidden="true">
                    <Palette size={20} />
                </div>
                <div className="element-info">
                    <h3>Forma</h3>
                    <span>{shape.shapeType}</span>
                </div>
            </div>

            {/* Cores de Preenchimento */}
            <div className="property-group">
                <label id="fill-label">Preenchimento</label>
                <div className="color-grid" role="radiogroup" aria-labelledby="fill-label">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            className={`color-swatch ${shape.fill === color ? 'active' : ''} ${color === 'transparent' ? 'transparent' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleChange('fill', color)}
                            title={color === 'transparent' ? 'Transparente' : color}
                            aria-label={`Cor ${color === 'transparent' ? 'transparente' : color}`}
                            role="radio"
                            aria-checked={shape.fill === color}
                        />
                    ))}
                    <input
                        type="color"
                        value={shape.fill === 'transparent' ? '#ffffff' : shape.fill}
                        onChange={(e) => handleChange('fill', e.target.value)}
                        className="color-picker-input"
                        aria-label="Cor personalizada"
                    />
                </div>
            </div>

            {/* Borda (Stroke) */}
            <div className="property-group">
                <label>Borda</label>
                <div className="control-row">
                    <input
                        type="color"
                        value={shape.stroke || '#000000'}
                        onChange={(e) => handleChange('stroke', e.target.value)}
                        className="mini-color-picker"
                    />
                    <div className="slider-container">
                        <input
                            type="range"
                            min="0"
                            max="20"
                            value={shape.strokeWidth || 0}
                            onChange={(e) => handleChange('strokeWidth', parseInt(e.target.value))}
                            className="styled-slider"
                            style={getSliderStyle(shape.strokeWidth || 0, 0, 20)}
                        />
                        <span className="value-display">{shape.strokeWidth || 0}px</span>
                    </div>
                </div>
            </div>

            {/* Opacidade */}
            <div className="property-group">
                <label>Opacidade</label>
                <div className="slider-container">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={shape.opacity ?? 1}
                        onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                        className="styled-slider"
                        style={getSliderStyle(shape.opacity ?? 1, 0, 1)}
                    />
                    <span className="value-display">{Math.round((shape.opacity ?? 1) * 100)}%</span>
                </div>
            </div>

            {/* Corner Radius (Só para Retângulos) */}
            {shape.shapeType === 'rectangle' && (
                <div className="property-group">
                    <label>Arredondamento</label>
                    <div className="slider-container">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={shape.cornerRadius || 0}
                            onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value))}
                            className="styled-slider"
                            style={getSliderStyle(shape.cornerRadius || 0, 0, 100)}
                        />
                        <span className="value-display">{shape.cornerRadius || 0}</span>
                    </div>
                </div>
            )}

            {/* Ações Rápidas */}
            <div className="actions-footer" role="group" aria-label="Ações do elemento">
                <button className="panel-action-btn" onClick={onDuplicate} aria-label="Duplicar forma">
                    <Copy size={16} aria-hidden="true" /> Duplicar
                </button>
                <button className="panel-action-btn danger" onClick={onDelete} aria-label="Excluir forma">
                    <Trash2 size={16} aria-hidden="true" /> Excluir
                </button>
            </div>
        </div>
    );

    // Renderização específica para IMAGENS
    const renderImageProperties = (image: ImageElement) => (
        <div className="properties-content">
            {/* Cabeçalho */}
            <div className="panel-header">
                <div className="element-icon">
                    <ImageIcon size={20} />
                </div>
                <div className="element-info">
                    <h3>Imagem</h3>
                    <span>{pxToCm(image.width * (image.scaleX || 1))} x {pxToCm(image.height * (image.scaleY || 1))} cm</span>
                </div>
            </div>

            {/* Transform */}
            <div className="property-group">
                <label>Transformação (cm)</label>
                <div className="grid-2-col">
                    <div className="input-group">
                        <span className="label-sm">X</span>
                        <input
                            type="number"
                            step="0.1"
                            value={pxToCm(image.x)}
                            onChange={(e) => handleChange('x', cmToPx(parseFloat(e.target.value) || 0))}
                            className="input-number"
                        />
                    </div>
                    <div className="input-group">
                        <span className="label-sm">Y</span>
                        <input
                            type="number"
                            step="0.1"
                            value={pxToCm(image.y)}
                            onChange={(e) => handleChange('y', cmToPx(parseFloat(e.target.value) || 0))}
                            className="input-number"
                        />
                    </div>
                </div>
                <div className="grid-2-col">
                    <div className="input-group">
                        <span className="label-sm">W</span>
                        <input
                            type="number"
                            step="0.1"
                            value={pxToCm(image.width * (image.scaleX || 1))}
                            onChange={(e) => {
                                const newWCm = parseFloat(e.target.value) || 0;
                                const newWPx = cmToPx(newWCm);
                                const scale = newWPx / image.width;
                                handleChange('scaleX', scale);
                                handleChange('scaleY', scale); // Manter proporção
                            }}
                            className="input-number"
                        />
                    </div>
                    <div className="input-group">
                        <span className="label-sm">H</span>
                        <input
                            type="number"
                            step="0.1"
                            value={pxToCm(image.height * (image.scaleY || 1))}
                            readOnly // Simplificado para manter proporção via W
                            className="input-number readonly"
                        />
                    </div>
                </div>
            </div>

            {/* Opacidade */}
            <div className="property-group">
                <label>Opacidade</label>
                <div className="slider-container">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={image.opacity ?? 1}
                        onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                        className="styled-slider"
                        style={getSliderStyle(image.opacity ?? 1, 0, 1)}
                    />
                    <span className="value-display">{Math.round((image.opacity ?? 1) * 100)}%</span>
                </div>
            </div>

            {/* Ações Footer */}
            <div className="actions-footer">
                <button className="panel-action-btn" onClick={onDuplicate}>
                    <Copy size={16} /> Duplicar
                </button>
                <button className="panel-action-btn danger" onClick={onDelete}>
                    <Trash2 size={16} /> Excluir
                </button>
            </div>
        </div>
    );

    // Renderização para TODOS (Fallback)
    return (
        <div className="properties-panel" role="complementary" aria-label="Painel de propriedades do elemento selecionado">
            {selectedElement.type === 'shape' && renderShapeProperties(selectedElement as ShapeElement)}
            {selectedElement.type === 'image' && renderImageProperties(selectedElement as ImageElement)}
            {/* Outros tipos virão depois */}
        </div>
    );

};

export default PropertiesPanel;
