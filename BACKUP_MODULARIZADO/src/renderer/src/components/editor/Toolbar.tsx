/**
 * Toolbar - Barra de Ferramentas do Editor
 * Traduzido para Português BR
 */

import React from 'react';
import './Toolbar.css';

type Tool = 'select' | 'crop' | 'eraser' | 'background-removal' | 'add-image' | 'upscale';

interface ToolbarProps {
    activeTool: Tool;
    onToolSelect: (tool: Tool) => void;
    onExport: () => void;
    canDelete: boolean;
    onDelete: () => void;
    canDuplicate: boolean;
    onDuplicate: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
    activeTool,
    onToolSelect,
    onExport,
    canDelete,
    onDelete,
    canDuplicate,
    onDuplicate,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
}) => {
    const tools: Array<{ id: Tool; label: string; icon: string; tooltip: string }> = [
        { id: 'select', label: 'Selecionar', icon: '⭢', tooltip: 'Selecionar/Mover (V)' },
        { id: 'background-removal', label: 'Remover Fundo', icon: '🎯', tooltip: 'Remoção Inteligente (B)' },
        { id: 'upscale', label: 'Melhorar', icon: '🚀', tooltip: 'Aumentar Qualidade' },
        { id: 'add-image', label: 'Adicionar', icon: '➕', tooltip: 'Adicionar Imagem (A)' },
    ];

    return (
        <div className="editor-toolbar">
            <div className="toolbar-section">
                <div className="toolbar-title">Arquivo</div>
                <div className="toolbar-actions">
                    <button
                        className="toolbar-button"
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))}
                        title="Novo Documento (Ctrl+N)"
                    >
                        <span className="tool-icon">📄</span>
                        <span className="tool-label">Novo</span>
                    </button>
                </div>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-section">
                <div className="toolbar-title">Ferramentas</div>
                <div className="toolbar-tools">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            className={`toolbar-button ${activeTool === tool.id ? 'active' : ''}`}
                            onClick={() => onToolSelect(tool.id)}
                            title={tool.tooltip}
                        >
                            <span className="tool-icon">{tool.icon}</span>
                            <span className="tool-label">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-section">
                <div className="toolbar-title">Histórico</div>
                <div className="toolbar-actions">
                    <button
                        className="toolbar-button"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Desfazer (Ctrl+Z)"
                    >
                        <span className="tool-icon">↩️</span>
                        <span className="tool-label">Desfazer</span>
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Refazer (Ctrl+Y)"
                    >
                        <span className="tool-icon">↪️</span>
                        <span className="tool-label">Refazer</span>
                    </button>
                </div>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-section">
                <div className="toolbar-title">Ações</div>
                <div className="toolbar-actions">
                    <button
                        className="toolbar-button"
                        onClick={onDuplicate}
                        disabled={!canDuplicate}
                        title="Duplicar (Ctrl+D)"
                    >
                        <span className="tool-icon">📋</span>
                        <span className="tool-label">Duplicar</span>
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={onDelete}
                        disabled={!canDelete}
                        title="Excluir (Del)"
                    >
                        <span className="tool-icon">🗑️</span>
                        <span className="tool-label">Excluir</span>
                    </button>
                </div>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-section">
                <button
                    className="toolbar-button primary"
                    onClick={onExport}
                    title="Exportar Imagem (Ctrl+E)"
                >
                    <span className="tool-icon">💾</span>
                    <span className="tool-label">Exportar</span>
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
