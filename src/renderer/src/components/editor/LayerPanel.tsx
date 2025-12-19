/**
 * Painel de Camadas - Layer Panel
 * Gerenciamento de camadas com visibilidade, lock, reordenação
 * Com acessibilidade completa (ARIA)
 */

import React from 'react';
import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Copy,
    Trash2,
    GripVertical,
    Image as ImageIcon,
    Layers
} from 'lucide-react';
import { ImageElement } from '../../types/canvas-elements';
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
    onRename: (id: string, newName: string) => void;
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
    onRename,
}) => {
    const [draggedId, setDraggedId] = React.useState<string | null>(null);
    const [dragOverId, setDragOverId] = React.useState<string | null>(null);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState('');

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Adiciona classe para feedback visual
        (e.target as HTMLElement).classList.add('is-dragging');
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (targetId !== draggedId) {
            setDragOverId(targetId);
        }
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        setDragOverId(null);

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

    const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).classList.remove('is-dragging');
        setDraggedId(null);
        setDragOverId(null);
    };

    const startEditing = (image: ImageElement) => {
        setEditingId(image.id);
        setEditValue(image.name || '');
    };

    const saveName = () => {
        if (editingId && editValue.trim()) {
            onRename(editingId, editValue.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveName();
        if (e.key === 'Escape') setEditingId(null);
    };

    // Keyboard navigation for layer selection
    const handleListKeyDown = (e: React.KeyboardEvent) => {
        if (!selectedId) return;
        const currentIndex = images.findIndex(img => img.id === selectedId);

        if (e.key === 'ArrowUp' && currentIndex > 0) {
            e.preventDefault();
            onSelect(images[currentIndex - 1].id);
        } else if (e.key === 'ArrowDown' && currentIndex < images.length - 1) {
            e.preventDefault();
            onSelect(images[currentIndex + 1].id);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            onDelete();
        }
    };

    const truncateName = (name: string, maxLength = 20) => {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 3) + '...';
    };

    return (
        <div className="layer-panel" role="region" aria-label="Painel de camadas">
            <div className="layer-panel-header">
                <div className="header-title">
                    <Layers size={16} aria-hidden="true" />
                    <h3>Camadas</h3>
                </div>
                <div className="layer-panel-actions" role="group" aria-label="Ações de camadas">
                    <button
                        onClick={onDuplicate}
                        disabled={!selectedId}
                        title="Duplicar camada (Ctrl+D)"
                        className="layer-action-btn"
                        aria-label="Duplicar camada selecionada"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={!selectedId}
                        title="Excluir camada (Delete)"
                        className="layer-action-btn danger"
                        aria-label="Excluir camada selecionada"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div
                className="layer-list"
                role="listbox"
                aria-label="Lista de camadas"
                aria-activedescendant={selectedId || undefined}
                onKeyDown={handleListKeyDown}
                tabIndex={0}
            >
                {images.length === 0 ? (
                    <div className="layer-empty" role="status">
                        <ImageIcon size={32} className="empty-icon" aria-hidden="true" />
                        <p>Nenhuma camada</p>
                        <p className="layer-empty-hint">Adicione uma imagem para começar</p>
                    </div>
                ) : (
                    [...images].reverse().map((image, index) => (
                        <div
                            key={image.id}
                            id={`layer-${image.id}`}
                            className={`layer-item ${selectedId === image.id ? 'selected' : ''} ${draggedId === image.id ? 'dragging' : ''} ${dragOverId === image.id ? 'drag-over' : ''}`}
                            onClick={() => onSelect(image.id)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, image.id)}
                            onDragOver={(e) => handleDragOver(e, image.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, image.id)}
                            onDragEnd={handleDragEnd}
                            role="option"
                            aria-selected={selectedId === image.id}
                            aria-label={`Camada ${image.name || index + 1}, ${image.visible ? 'visível' : 'oculta'}, ${image.locked ? 'bloqueada' : 'desbloqueada'}`}
                        >
                            <div className="layer-drag-handle" aria-hidden="true">
                                <GripVertical size={14} />
                            </div>

                            <div className="layer-preview">
                                <img
                                    src={image.src}
                                    alt=""
                                    className="layer-thumbnail"
                                    loading="lazy"
                                />
                            </div>

                            <div className="layer-info">
                                {editingId === image.id ? (
                                    <input
                                        autoFocus
                                        className="layer-rename-input"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={saveName}
                                        onKeyDown={handleKeyDown}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="Nome da camada"
                                    />
                                ) : (
                                    <div
                                        className="layer-name"
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(image);
                                        }}
                                        title={`${image.name || `Camada ${image.id.slice(-4)}`} - Clique duas vezes para renomear`}
                                    >
                                        {truncateName(image.name || `Camada ${image.id.slice(-4)}`)}
                                    </div>
                                )}
                                <div className="layer-size">
                                    {Math.round(image.width)} × {Math.round(image.height)} px
                                </div>
                            </div>

                            <div className="layer-controls" role="group">
                                <button
                                    className={`layer-control-btn ${image.visible ? 'active' : 'inactive'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleVisibility(image.id);
                                    }}
                                    title={image.visible ? 'Ocultar camada' : 'Mostrar camada'}
                                    aria-label={image.visible ? 'Ocultar camada' : 'Mostrar camada'}
                                    aria-pressed={image.visible}
                                >
                                    {image.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button
                                    className={`layer-control-btn ${image.locked ? 'active locked' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleLock(image.id);
                                    }}
                                    title={image.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                                    aria-label={image.locked ? 'Desbloquear camada' : 'Bloquear camada'}
                                    aria-pressed={image.locked}
                                >
                                    {image.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer com contagem */}
            <div className="layer-panel-footer">
                <div className="layer-count">
                    {images.length} {images.length === 1 ? 'camada' : 'camadas'}
                </div>
                <div className="layer-tips">
                    <span>↕ Arraste para reordenar</span>
                </div>
            </div>
        </div>
    );
};

export default LayerPanel;
