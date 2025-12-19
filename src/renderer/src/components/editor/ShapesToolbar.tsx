/**
 *  ShapesToolbar - Barra de ferramentas para Shapes (Formas geométricas)
 */

import React, { useState } from 'react';
import './ShapesToolbar.css';
import { ShapeType } from '../../types/canvas-elements';

interface ShapesToolbarProps {
    onAddShape: (shapeType: ShapeType) => void;
    isOpen: boolean;
    onClose: () => void;
}

const ShapesToolbar: React.FC<ShapesToolbarProps> = ({ onAddShape, isOpen, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState<'basic' | 'arrows' | 'stars'>('basic');

    const shapes = {
        basic: [
            { type: 'rectangle' as ShapeType, icon: '□', label: 'Retângulo' },
            { type: 'circle' as ShapeType, icon: '○', label: 'Círculo' },
            { type: 'ellipse' as ShapeType, icon: '⬭', label: 'Elipse' },
            { type: 'polygon' as ShapeType, icon: '⬡', label: 'Polígono' },
        ],
        arrows: [
            { type: 'arrow' as ShapeType, icon: '→', label: 'Seta' },
            { type: 'line' as ShapeType, icon: '─', label: 'Linha' },
        ],
        stars: [
            { type: 'star' as ShapeType, icon: '⭐', label: 'Estrela' },
        ],
    };

    if (!isOpen) return null;

    return (
        <div className="shapes-toolbar-overlay" onClick={onClose}>
            <div className="shapes-toolbar" onClick={(e) => e.stopPropagation()}>
                <div className="shapes-header">
                    <h3>Adicionar Forma</h3>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="shapes-categories">
                    <button
                        className={`category-btn ${selectedCategory === 'basic' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('basic')}
                    >
                        Básicas
                    </button>
                    <button
                        className={`category-btn ${selectedCategory === 'arrows' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('arrows')}
                    >
                        Linhas
                    </button>
                    <button
                        className={`category-btn ${selectedCategory === 'stars' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('stars')}
                    >
                        Estrelas
                    </button>
                </div>

                <div className="shapes-grid">
                    {shapes[selectedCategory].map((shape) => (
                        <button
                            key={shape.type}
                            className="shape-button"
                            onClick={() => {
                                onAddShape(shape.type);
                                onClose();
                            }}
                            title={shape.label}
                        >
                            <span className="shape-icon">{shape.icon}</span>
                            <span className="shape-label">{shape.label}</span>
                        </button>
                    ))}
                </div>

                <div className="shapes-tip">
                    💡 Dica: Clique na forma para adicioná-la ao centro do canvas
                </div>
            </div>
        </div>
    );
};

export default ShapesToolbar;
