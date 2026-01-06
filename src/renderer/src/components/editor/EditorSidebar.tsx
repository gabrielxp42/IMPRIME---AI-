import React, { useState, useRef, useMemo } from 'react';
import {
    Sparkles,
    Eraser,
    Wand2,
    Image as ImageIcon,
    Plus,
    FolderOpen,
    MousePointer2,
    Crop,
    ChevronRight,
    Grid,
    Trash,
    Pencil,
    Folder,
    Home,
    ChevronLeft
} from 'lucide-react';
import { ShapeType, LibraryItem } from '../../types/canvas-elements';
import CreativePanel from './CreativePanel';
import './EditorSidebar.css';

interface EditorSidebarProps {
    activeTool: string;
    onToolSelect: (tool: string) => void;
    onAddShape: (shapeType: ShapeType) => void;
    onAddText: (type?: 'heading' | 'subheading' | 'body') => void;
    onAddImage: () => void;
    onRemoveBackground: () => void;
    onUpscale: () => void;
    onAICreative: () => void;
    canDelete?: boolean;
    canDuplicate?: boolean;
    onAddFromLibrary?: (file: File, customName?: string) => void;
    libraryItems?: LibraryItem[];
    onUpdateLibrary?: (items: LibraryItem[]) => void;
}

type SidebarSection = 'create' | 'effects' | 'tools' | 'library' | null;

const EditorSidebar: React.FC<EditorSidebarProps> = ({
    activeTool,
    onToolSelect,
    onAddShape,
    onAddText,
    onAddImage,
    onRemoveBackground,
    onUpscale,
    onAICreative,
    onAddFromLibrary,
    libraryItems = [],
    onUpdateLibrary
}) => {
    const [expandedSection, setExpandedSection] = useState<SidebarSection>('create');
    const libraryInputRef = useRef<HTMLInputElement>(null);

    // Navegação de pastas
    const [currentPath, setCurrentPath] = useState<string>('');

    // Estado de Edição de Nome
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const toggleSection = (section: SidebarSection) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Computar pastas e arquivos no path atual
    const { folders, files } = useMemo(() => {
        const foldersSet = new Set<string>();
        const currentFiles: LibraryItem[] = [];

        libraryItems.forEach(item => {
            // Se o item está no path atual ou em subpasta
            if (currentPath === '') {
                // Estamos na raiz
                if (!item.path || item.path === '') {
                    // Arquivo na raiz
                    currentFiles.push(item);
                } else {
                    // Pegar primeira pasta do path
                    const firstFolder = item.path.split('/')[0];
                    foldersSet.add(firstFolder);
                }
            } else {
                // Estamos em alguma pasta
                if (item.path === currentPath) {
                    // Arquivo está exatamente nesta pasta
                    currentFiles.push(item);
                } else if (item.path.startsWith(currentPath + '/')) {
                    // Está em uma subpasta
                    const remainingPath = item.path.substring(currentPath.length + 1);
                    const nextFolder = remainingPath.split('/')[0];
                    foldersSet.add(nextFolder);
                }
            }
        });

        // Converter Set para array e ordenar
        const sortedFolders = Array.from(foldersSet).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );

        // Ordenar arquivos
        currentFiles.sort((a, b) =>
            a.displayName.localeCompare(b.displayName, undefined, { numeric: true })
        );

        return { folders: sortedFolders, files: currentFiles };
    }, [libraryItems, currentPath]);

    // Breadcrumb parts
    const breadcrumbParts = currentPath ? currentPath.split('/') : [];

    // Handler para Seleção de Pasta
    const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && onUpdateLibrary) {
            const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

            const newItems: LibraryItem[] = imageFiles.map((file) => {
                let folderPath = '';
                if (file.webkitRelativePath) {
                    const parts = file.webkitRelativePath.split('/');
                    if (parts.length > 1) {
                        parts.pop();
                        folderPath = parts.join('/');
                    }
                }

                return {
                    id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    file: file,
                    displayName: file.name.replace(/\.[^/.]+$/, ""),
                    path: folderPath
                };
            });

            onUpdateLibrary([...libraryItems, ...newItems]);
            setCurrentPath(''); // Voltar para raiz ao carregar novos itens
        }
        if (libraryInputRef.current) {
            libraryInputRef.current.value = '';
        }
    };

    // Navegação
    const navigateToFolder = (folderName: string) => {
        if (currentPath === '') {
            setCurrentPath(folderName);
        } else {
            setCurrentPath(currentPath + '/' + folderName);
        }
    };

    const navigateUp = () => {
        if (currentPath === '') return;
        const parts = currentPath.split('/');
        parts.pop();
        setCurrentPath(parts.join('/'));
    };

    const navigateToRoot = () => {
        setCurrentPath('');
    };

    const navigateToBreadcrumb = (index: number) => {
        const newPath = breadcrumbParts.slice(0, index + 1).join('/');
        setCurrentPath(newPath);
    };

    // Renomear pasta
    const renameFolderInPath = (oldFolderName: string, newFolderName: string) => {
        if (!onUpdateLibrary) return;

        const oldFullPath = currentPath ? `${currentPath}/${oldFolderName}` : oldFolderName;
        const newFullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;

        const newItems = libraryItems.map(item => {
            if (item.path === oldFullPath) {
                return { ...item, path: newFullPath };
            } else if (item.path.startsWith(oldFullPath + '/')) {
                return { ...item, path: newFullPath + item.path.substring(oldFullPath.length) };
            }
            return item;
        });

        onUpdateLibrary(newItems);
    };

    // Renomear arquivo
    const startEditing = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        setEditingId(id);
        setEditingName(name);
    };

    const saveEditing = () => {
        if (!editingId || !onUpdateLibrary) return;

        // Checar se é pasta ou arquivo
        const isFolder = folders.includes(editingId);

        if (isFolder) {
            renameFolderInPath(editingId, editingName.trim() || editingId);
        } else {
            const newItems = libraryItems.map(item =>
                item.id === editingId ? { ...item, displayName: editingName.trim() || item.displayName } : item
            );
            onUpdateLibrary(newItems);
        }
        setEditingId(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveEditing();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    // Handler Drag
    const handleLibraryDragStart = (e: React.DragEvent, item: LibraryItem) => {
        e.dataTransfer.effectAllowed = 'copy';
        // Incluir o path completo para a IA entender o contexto
        const fullName = item.path ? `${item.path}/${item.displayName}` : item.displayName;
        e.dataTransfer.setData('application/spotwhite-library-item', JSON.stringify({
            name: item.displayName,
            fullPath: fullName,
            path: item.path
        }));
    };

    return (
        <div className="editor-sidebar">
            {/* Sidebar Icons */}
            <div className="sidebar-icons">
                <button
                    className={`sidebar-icon-btn ${expandedSection === 'tools' ? 'active' : ''}`}
                    onClick={() => toggleSection('tools')}
                    title="Ferramentas"
                >
                    <MousePointer2 size={20} />
                    <span className="sidebar-label">Ferramentas</span>
                </button>

                <button
                    className={`sidebar-icon-btn ${expandedSection === 'create' ? 'active' : ''}`}
                    onClick={() => toggleSection('create')}
                    title="Criar"
                >
                    <Plus size={20} />
                    <span className="sidebar-label">Criar</span>
                </button>

                <button
                    className={`sidebar-icon-btn ${expandedSection === 'effects' ? 'active' : ''}`}
                    onClick={() => toggleSection('effects')}
                    title="Efeitos"
                >
                    <Sparkles size={20} />
                    <span className="sidebar-label">Efeitos</span>
                </button>

                <button
                    className={`sidebar-icon-btn ${expandedSection === 'library' ? 'active' : ''}`}
                    onClick={() => toggleSection('library')}
                    title="Biblioteca"
                >
                    <FolderOpen size={20} />
                    <span className="sidebar-label">Biblioteca</span>
                </button>
            </div>

            {/* Expanded Panel */}
            {expandedSection && (
                <div className="sidebar-panel">
                    <div className="panel-header">
                        <h3>
                            {expandedSection === 'create' && 'Criar'}
                            {expandedSection === 'effects' && 'Efeitos'}
                            {expandedSection === 'tools' && 'Ferramentas'}
                            {expandedSection === 'library' && 'Biblioteca'}
                        </h3>
                        <button className="panel-close" onClick={() => setExpandedSection(null)}>
                            ✕
                        </button>
                    </div>

                    <div className="panel-content">
                        {/* CRIAR */}
                        {expandedSection === 'create' && (
                            <CreativePanel
                                onAddShape={(type) => {
                                    onAddShape(type);
                                    setExpandedSection(null);
                                }}
                                onAddText={(type) => {
                                    onAddText(type);
                                    setExpandedSection(null);
                                }}
                            />
                        )}

                        {/* EFEITOS (PREMIUM V2) */}
                        {expandedSection === 'effects' && (
                            <div className="effects-layout-v2">
                                <div className="effects-grid-v2">
                                    <div
                                        className="premium-effect-card"
                                        onClick={() => {
                                            onRemoveBackground();
                                            setExpandedSection(null);
                                        }}
                                    >
                                        <div className="icon-box"><Eraser size={20} /></div>
                                        <h4>Remover Fundo</h4>
                                        <p>Transparência instantânea com IA</p>
                                    </div>

                                    <div
                                        className="premium-effect-card"
                                        onClick={() => {
                                            onUpscale();
                                            setExpandedSection(null);
                                        }}
                                    >
                                        <div className="icon-box"><Wand2 size={20} /></div>
                                        <h4>Upscale 4K</h4>
                                        <p>Aumente a resolução sem perder nitidez</p>
                                    </div>

                                    <div
                                        className="premium-effect-card featured-ai"
                                        onClick={() => {
                                            onAICreative();
                                            setExpandedSection(null);
                                        }}
                                    >
                                        <div className="icon-box"><Sparkles size={24} /></div>
                                        <div className="card-info">
                                            <h4>IA Criativa</h4>
                                            <p>Vetorizar, estilizar e transformar com o poder da IA</p>
                                        </div>
                                        <div className="card-meta">Premium</div>
                                    </div>
                                </div>

                                <div className="panel-divider" />
                                <div className="coming-soon">
                                    <Sparkles size={20} />
                                    <span>Filtros, HDR e ajustes inteligentes em breve...</span>
                                </div>
                            </div>
                        )}

                        {/* FERRAMENTAS */}
                        {expandedSection === 'tools' && (
                            <>
                                <button
                                    className={`action-btn ${activeTool === 'select' ? 'active' : ''}`}
                                    onClick={() => {
                                        onToolSelect('select');
                                        setExpandedSection(null);
                                    }}
                                >
                                    <MousePointer2 size={20} />
                                    <span>Selecionar</span>
                                    <kbd>V</kbd>
                                </button>
                                <button
                                    className={`action-btn ${activeTool === 'crop' ? 'active' : ''}`}
                                    onClick={() => {
                                        onToolSelect('crop');
                                        setExpandedSection(null);
                                    }}
                                >
                                    <Crop size={20} />
                                    <span>Cortar</span>
                                    <kbd>C</kbd>
                                </button>
                            </>
                        )}

                        {/* BIBLIOTECA COM NAVEGAÇÃO DE PASTAS */}
                        {expandedSection === 'library' && (
                            <div className="library-container">
                                {/* Ações */}
                                <div className="library-actions">
                                    <button
                                        className="action-btn"
                                        onClick={() => libraryInputRef.current?.click()}
                                    >
                                        <FolderOpen size={20} />
                                        <span>Selecionar Pasta</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={libraryInputRef}
                                        onChange={handleFolderSelect}
                                        style={{ display: 'none' }}
                                        {...({ webkitdirectory: "", directory: "" } as any)}
                                        multiple
                                    />

                                    {libraryItems.length > 0 && onUpdateLibrary && (
                                        <button
                                            className="clear-library-btn"
                                            onClick={() => {
                                                onUpdateLibrary([]);
                                                setCurrentPath('');
                                            }}
                                            title="Limpar biblioteca"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Breadcrumb / Navegação */}
                                {libraryItems.length > 0 && (
                                    <div className="library-breadcrumb">
                                        <button
                                            className={`breadcrumb-item ${currentPath === '' ? 'active' : ''}`}
                                            onClick={navigateToRoot}
                                            title="Raiz"
                                        >
                                            <Home size={12} />
                                        </button>
                                        {breadcrumbParts.map((part, index) => (
                                            <React.Fragment key={index}>
                                                <ChevronRight size={12} className="breadcrumb-sep" />
                                                <button
                                                    className={`breadcrumb-item ${index === breadcrumbParts.length - 1 ? 'active' : ''}`}
                                                    onClick={() => navigateToBreadcrumb(index)}
                                                >
                                                    {part}
                                                </button>
                                            </React.Fragment>
                                        ))}

                                        {currentPath !== '' && (
                                            <button
                                                className="breadcrumb-back"
                                                onClick={navigateUp}
                                                title="Voltar"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="library-grid-header">
                                    <span>{folders.length} pastas, {files.length} arquivos</span>
                                    <Grid size={14} />
                                </div>

                                <div className="library-grid">
                                    {libraryItems.length === 0 ? (
                                        <div className="library-empty">
                                            <ImageIcon size={32} />
                                            <p>Nenhum item</p>
                                            <span>Selecione uma pasta</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Pastas */}
                                            {folders.map((folderName) => (
                                                <div
                                                    key={`folder-${folderName}`}
                                                    className="library-folder"
                                                    onClick={() => navigateToFolder(folderName)}
                                                    title={`Abrir pasta: ${folderName}`}
                                                >
                                                    <div className="library-folder-icon">
                                                        <Folder size={28} fill="#fbbf24" color="#fbbf24" />
                                                    </div>

                                                    {editingId === folderName ? (
                                                        <input
                                                            className="library-item-input"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onBlur={saveEditing}
                                                            onKeyDown={handleKeyDown}
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <div className="library-item-name-row">
                                                            <span className="library-item-name" title={folderName}>
                                                                {folderName}
                                                            </span>
                                                            <button
                                                                className="library-item-edit"
                                                                onClick={(e) => startEditing(e, folderName, folderName)}
                                                                title="Renomear pasta"
                                                            >
                                                                <Pencil size={10} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Arquivos */}
                                            {files.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="library-item"
                                                    onClick={() => onAddFromLibrary?.(item.file, item.displayName)}
                                                    draggable
                                                    onDragStart={(e) => handleLibraryDragStart(e, item)}
                                                    title={`Clique para adicionar: ${item.displayName}`}
                                                >
                                                    <div className="library-item-thumb">
                                                        <img
                                                            src={URL.createObjectURL(item.file)}
                                                            alt={item.displayName}
                                                            loading="lazy"
                                                        />
                                                    </div>

                                                    {editingId === item.id ? (
                                                        <input
                                                            className="library-item-input"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onBlur={saveEditing}
                                                            onKeyDown={handleKeyDown}
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <div className="library-item-name-row">
                                                            <span className="library-item-name" title={item.displayName}>
                                                                {item.displayName}
                                                            </span>
                                                            <button
                                                                className="library-item-edit"
                                                                onClick={(e) => startEditing(e, item.id, item.displayName)}
                                                                title="Renomear"
                                                            >
                                                                <Pencil size={10} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Mensagem se pasta vazia */}
                                            {folders.length === 0 && files.length === 0 && currentPath !== '' && (
                                                <div className="library-empty">
                                                    <Folder size={32} />
                                                    <p>Pasta vazia</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditorSidebar;
