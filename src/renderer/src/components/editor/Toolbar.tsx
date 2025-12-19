/**
 * Toolbar - Barra de Ferramentas Premium
 * Estilo: Glassmorphism Roxo (Consistente com UI)
 * Acessibilidade: ARIA labels, focus states, keyboard navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    MousePointer2,
    Wand2,
    Zap,
    ImagePlus,
    FilePlus,
    Undo2,
    Redo2,
    Copy,
    Trash2,
    Download,
    Keyboard,
    HelpCircle
} from 'lucide-react';
import './Toolbar.css';

type Tool = 'select' | 'crop' | 'eraser' | 'background-removal' | 'add-image' | 'upscale' | 'shapes' | 'text';

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

// Componente de Tooltip Premium
const Tooltip: React.FC<{
    children: React.ReactNode;
    content: string;
    shortcut?: string;
    position?: 'top' | 'bottom';
}> = ({ children, content, shortcut, position = 'bottom' }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const show = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({
                x: rect.left + rect.width / 2,
                y: position === 'bottom' ? rect.bottom + 8 : rect.top - 8
            });
        }
        setVisible(true);
    };

    return (
        <div
            ref={ref}
            className="tooltip-wrapper"
            onMouseEnter={show}
            onMouseLeave={() => setVisible(false)}
            onFocus={show}
            onBlur={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div
                    className={`premium-tooltip ${position}`}
                    style={{
                        left: coords.x,
                        top: coords.y,
                        transform: position === 'bottom'
                            ? 'translateX(-50%)'
                            : 'translateX(-50%) translateY(-100%)'
                    }}
                    role="tooltip"
                >
                    <span className="tooltip-text">{content}</span>
                    {shortcut && <kbd className="tooltip-shortcut">{shortcut}</kbd>}
                </div>
            )}
        </div>
    );
};

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
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Ferramentas principais
    const tools = [
        { id: 'select', label: 'Mover', icon: MousePointer2, shortcut: 'V', description: 'Selecionar e mover elementos' },
        { id: 'add-image', label: 'Imagem', icon: ImagePlus, shortcut: 'I', description: 'Adicionar nova imagem' },
        { id: 'background-removal', label: 'Remover Fundo', icon: Wand2, shortcut: 'R', description: 'IA remove o fundo automaticamente' },
        { id: 'upscale', label: 'Melhorar', icon: Zap, shortcut: 'U', description: 'Aumentar qualidade com IA' },
    ];

    // Keyboard shortcuts guide
    const shortcuts = [
        { key: 'Ctrl+Z', action: 'Desfazer' },
        { key: 'Ctrl+Y', action: 'Refazer' },
        { key: 'Ctrl+D', action: 'Duplicar' },
        { key: 'Delete', action: 'Excluir' },
        { key: 'Ctrl+A', action: 'Selecionar tudo' },
        { key: 'Ctrl+G', action: 'Agrupar' },
        { key: 'Ctrl+Shift+G', action: 'Desagrupar' },
        { key: 'Ctrl+E', action: 'Exportar' },
        { key: 'Ctrl+N', action: 'Novo documento' },
        { key: 'Space+Drag', action: 'Mover canvas' },
        { key: 'Scroll', action: 'Zoom' },
        { key: 'Alt+Drag', action: 'Duplicar arrastando' },
    ];

    return (
        <div
            className="editor-toolbar glass-panel-large"
            role="toolbar"
            aria-label="Barra de ferramentas do editor"
        >
            {/* Shortcuts Modal */}
            {showShortcuts && (
                <div className="shortcuts-modal" role="dialog" aria-label="Atalhos de teclado">
                    <div className="shortcuts-backdrop" onClick={() => setShowShortcuts(false)} />
                    <div className="shortcuts-content">
                        <div className="shortcuts-header">
                            <Keyboard size={24} />
                            <h3>Atalhos de Teclado</h3>
                            <button
                                className="shortcuts-close"
                                onClick={() => setShowShortcuts(false)}
                                aria-label="Fechar"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="shortcuts-grid">
                            {shortcuts.map((s, i) => (
                                <div key={i} className="shortcut-item">
                                    <kbd>{s.key}</kbd>
                                    <span>{s.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Seção ARQUIVO */}
            <div className="toolbar-group">
                <Tooltip content="Novo documento" shortcut="Ctrl+N">
                    <button
                        className="toolbar-btn big-icon-btn"
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))}
                        aria-label="Novo documento"
                    >
                        <div className="btn-content">
                            <FilePlus size={26} strokeWidth={1.5} />
                            <span>Novo</span>
                        </div>
                    </button>
                </Tooltip>
            </div>

            <div className="divider-vertical large" role="separator" aria-hidden="true" />

            {/* Seção FERRAMENTAS PRINCIPAIS */}
            <div className="toolbar-group tools-group-large" role="group" aria-label="Ferramentas">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <Tooltip key={tool.id} content={tool.description} shortcut={tool.shortcut}>
                            <button
                                className={`toolbar-btn large-btn ${activeTool === tool.id ? 'active' : ''}`}
                                onClick={() => onToolSelect(tool.id as Tool)}
                                aria-label={tool.description}
                                aria-pressed={activeTool === tool.id}
                            >
                                <div className="btn-content">
                                    <Icon size={28} strokeWidth={1.5} />
                                    <span>{tool.label}</span>
                                </div>
                            </button>
                        </Tooltip>
                    );
                })}
            </div>

            <div className="spacer-flex" />

            {/* Seção AÇÕES RÁPIDAS */}
            <div className="toolbar-group actions-group" role="group" aria-label="Ações">
                <div className="action-row">
                    <Tooltip content="Desfazer" shortcut="Ctrl+Z">
                        <button
                            className="toolbar-btn icon-medium"
                            onClick={onUndo}
                            disabled={!canUndo}
                            aria-label="Desfazer"
                            aria-disabled={!canUndo}
                        >
                            <Undo2 size={22} />
                        </button>
                    </Tooltip>
                    <Tooltip content="Refazer" shortcut="Ctrl+Y">
                        <button
                            className="toolbar-btn icon-medium"
                            onClick={onRedo}
                            disabled={!canRedo}
                            aria-label="Refazer"
                            aria-disabled={!canRedo}
                        >
                            <Redo2 size={22} />
                        </button>
                    </Tooltip>
                </div>
                <div className="action-row">
                    <Tooltip content="Duplicar" shortcut="Ctrl+D">
                        <button
                            className="toolbar-btn icon-medium"
                            onClick={onDuplicate}
                            disabled={!canDuplicate}
                            aria-label="Duplicar elemento"
                            aria-disabled={!canDuplicate}
                        >
                            <Copy size={22} />
                        </button>
                    </Tooltip>
                    <Tooltip content="Excluir" shortcut="Delete">
                        <button
                            className="toolbar-btn icon-medium danger"
                            onClick={onDelete}
                            disabled={!canDelete}
                            aria-label="Excluir elemento"
                            aria-disabled={!canDelete}
                        >
                            <Trash2 size={22} />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <div className="divider-vertical large" role="separator" aria-hidden="true" />

            {/* Help Button */}
            <Tooltip content="Ver todos os atalhos" shortcut="?">
                <button
                    className="toolbar-btn icon-medium"
                    onClick={() => setShowShortcuts(true)}
                    aria-label="Ver atalhos de teclado"
                >
                    <HelpCircle size={20} />
                </button>
            </Tooltip>

            {/* Seção EXPORTAR */}
            <div className="toolbar-group">
                <Tooltip content="Exportar imagem" shortcut="Ctrl+E">
                    <button
                        className="toolbar-btn primary-action-large"
                        onClick={onExport}
                        aria-label="Salvar e exportar imagem"
                    >
                        <div className="btn-content">
                            <Download size={28} strokeWidth={2} />
                            <span>SALVAR</span>
                        </div>
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

export default Toolbar;
