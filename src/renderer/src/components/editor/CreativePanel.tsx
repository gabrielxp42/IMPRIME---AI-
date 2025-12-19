/**
 * CreativePanel - Sidebar COMPLEMENTAR para novas ferramentas (Texto e Formas)
 * Com acessibilidade completa (ARIA) e melhor UX
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Square,
    Circle,
    Star,
    Type,
    Shapes,
    Hexagon,
    Minus,
    Plus,
    ArrowRight
} from 'lucide-react';
import { ShapeType } from '../../types/canvas-elements';
import './CreativePanel.css';

interface CreativePanelProps {
    onAddShape: (shapeType: ShapeType) => void;
    onAddText: (type?: 'heading' | 'subheading' | 'body') => void;
}

const CreativePanel: React.FC<CreativePanelProps> = ({ onAddShape, onAddText }) => {
    const [expandedSection, setExpandedSection] = useState<'shapes' | 'text' | null>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                // Verificar se o clique foi em um botão do painel
                const target = e.target as HTMLElement;
                if (!target.closest('.panel-btn')) {
                    setExpandedSection(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fechar com ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setExpandedSection(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const shapes: Array<{ type: ShapeType; icon: any; label: string; desc: string }> = [
        { type: 'rectangle', icon: Square, label: 'Retângulo', desc: 'Forma retangular' },
        { type: 'circle', icon: Circle, label: 'Círculo', desc: 'Círculo perfeito' },
        { type: 'star', icon: Star, label: 'Estrela', desc: '5 pontas' },
        { type: 'polygon', icon: Hexagon, label: 'Polígono', desc: '6 lados' },
        { type: 'ellipse', icon: Circle, label: 'Elipse', desc: 'Oval' },
        { type: 'arrow', icon: ArrowRight, label: 'Seta', desc: 'Indicador' },
        { type: 'line', icon: Minus, label: 'Linha', desc: 'Reta simples' },
    ];

    const textPresets = [
        { type: 'heading', label: 'Título', size: 60, weight: 'bold', desc: 'Grande e chamativo' },
        { type: 'subheading', label: 'Subtítulo', size: 30, weight: '600', desc: 'Complemento médio' },
        { type: 'body', label: 'Corpo', size: 18, weight: '400', desc: 'Texto para parágrafos' },
    ];

    const toggleSection = (section: 'shapes' | 'text') => {
        setExpandedSection(current => current === section ? null : section);
    };

    return (
        <div className="creative-panel" role="region" aria-label="Painel criativo">
            {/* Botões Principais */}
            <div className="panel-buttons" role="tablist" aria-label="Categorias de elementos">
                <button
                    className={`panel-btn ${expandedSection === 'shapes' ? 'active' : ''}`}
                    onClick={() => toggleSection('shapes')}
                    title="Adicionar formas geométricas"
                    role="tab"
                    aria-selected={expandedSection === 'shapes'}
                    aria-controls="shapes-panel"
                    aria-expanded={expandedSection === 'shapes'}
                >
                    <Shapes size={22} aria-hidden="true" />
                    <span className="btn-label">Formas</span>
                </button>

                <button
                    className={`panel-btn ${expandedSection === 'text' ? 'active' : ''}`}
                    onClick={() => toggleSection('text')}
                    title="Adicionar texto"
                    role="tab"
                    aria-selected={expandedSection === 'text'}
                    aria-controls="text-panel"
                    aria-expanded={expandedSection === 'text'}
                >
                    <Type size={22} aria-hidden="true" />
                    <span className="btn-label">Texto</span>
                </button>
            </div>

            {/* Drawer Expansível */}
            {expandedSection && (
                <div className="panel-drawer" ref={drawerRef} role="tabpanel">
                    {/* FORMAS */}
                    {expandedSection === 'shapes' && (
                        <div className="drawer-content" id="shapes-panel" aria-labelledby="shapes-tab">
                            <div className="drawer-header">
                                <Shapes size={18} aria-hidden="true" />
                                <h4>Adicionar Forma</h4>
                            </div>
                            <div className="shapes-grid" role="listbox" aria-label="Formas disponíveis">
                                {shapes.map((shape) => (
                                    <button
                                        key={shape.type}
                                        className="shape-card"
                                        onClick={() => {
                                            onAddShape(shape.type);
                                            setExpandedSection(null);
                                        }}
                                        title={`${shape.label} - ${shape.desc}`}
                                        role="option"
                                        aria-label={`Adicionar ${shape.label}`}
                                    >
                                        <shape.icon size={26} strokeWidth={1.5} aria-hidden="true" />
                                        <span>{shape.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="drawer-hint" aria-hidden="true">
                                Clique em uma forma para adicioná-la ao canvas
                            </div>
                        </div>
                    )}

                    {/* TEXTO */}
                    {expandedSection === 'text' && (
                        <div className="drawer-content" id="text-panel" aria-labelledby="text-tab">
                            <div className="drawer-header">
                                <Type size={18} aria-hidden="true" />
                                <h4>Adicionar Texto</h4>
                            </div>

                            <div className="text-presets-grid">
                                {textPresets.map(preset => (
                                    <button
                                        key={preset.type}
                                        className={`text-preset-card ${preset.type}`}
                                        onClick={() => {
                                            onAddText(preset.type as any);
                                            setExpandedSection(null);
                                        }}
                                    >
                                        <span className="preset-preview" style={{ fontSize: preset.size / 2, fontWeight: preset.weight }}>
                                            {preset.label}
                                        </span>
                                        <span className="preset-desc">{preset.desc}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="panel-divider-small" />

                            <button
                                className="text-add-btn simple"
                                onClick={() => {
                                    onAddText();
                                    setExpandedSection(null);
                                }}
                            >
                                <Plus size={18} />
                                <span>Texto Simples</span>
                            </button>

                            <div className="text-tip" role="note">
                                <span className="tip-icon" aria-hidden="true">💡</span>
                                <span>Dê dois cliques no texto para editar</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreativePanel;
