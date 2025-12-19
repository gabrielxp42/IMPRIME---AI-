/**
 * Painel de Camadas - Layer Panel
 * Gerenciamento de camadas com visibilidade, lock, reordenação
 * Traduzido para Português BR
 */

import React from 'react';
import { ImageElement } from './KonvaCanvas';
import './LayerPanel.css';

interface LayerPanelProps {
    images: ImageElement[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onReorder: (newOrder: ImageElement[]) => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
    images,
    selectedId,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onReorder,
    onDelete,
    onDuplicate,
}) => {
    const [draggedId, setDraggedId] = React.useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();

        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = images.findIndex((img) => img.id === draggedId);
        const targetIndex = images.findIndex((img) => img.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newOrder = [...images];
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);

        onReorder(newOrder);
        setDraggedId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    return (
        <div className="layer-panel">
            <div className="layer-panel-header">
                <h3>Camadas</h3>
                <div className="layer-panel-actions">
                    <button
                        onClick={onDuplicate}
                        disabled={!selectedId}
                        title="Duplicar camada"
                        className="layer-action-btn"
                    >
                        📋
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={!selectedId}
                        title="Excluir camada"
                        className="layer-action-btn"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="layer-list">
                {images.length === 0 ? (
                    <div className="layer-empty">
                        <p>Nenhuma camada</p>
                        <p className="layer-empty-hint">Adicione uma imagem para começar</p>
                    </div>
                ) : (
                    [...images].reverse().map((image) => (
                        <div
                            key={image.id}
                            className={`layer-item ${selectedId === image.id ? 'selected' : ''} ${draggedId === image.id ? 'dragging' : ''
                                }`}
                            onClick={() => onSelect(image.id)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, image.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, image.id)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="layer-preview">
                                <img
                                    src={image.src}
                                    alt={image.name || 'Camada'}
                                    className="layer-thumbnail"
                                />
                            </div>

                            <div className="layer-info">
                                <div className="layer-name">{image.name || `Camada ${image.id.slice(-4)}`}</div>
                                <div className="layer-size">
                                    {Math.round(image.width)} x {Math.round(image.height)} px
                                </div>
                            </div>

                            <div className="layer-controls">
                                <button
                                    className={`layer-control-btn ${image.visible ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleVisibility(image.id);
                                    }}
                                    title={image.visible ? 'Ocultar camada' : 'Mostrar camada'}
                                >
                                    {image.visible ? '👁️' : '👁️‍🗨️'}
                                </button>
                                <button
                                    className={`layer-control-btn ${image.locked ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleLock(image.id);
                                    }}
                                    title={image.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                                >
                                    {image.locked ? '🔒' : '🔓'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Dicas rápidas */}
            <div className="layer-panel-footer">
                <div className="layer-tips">
                    <span>💡 Arraste para reordenar</span>
                </div>
            </div>
        </div>
    );
};

export default LayerPanel;
