/**
 * Editor View - Editor de Imagens Premium
 * Com histórico (Ctrl+Z/Y), Novo Documento, Drag & Drop, e Múltiplos Documentos
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import KonvaCanvas, { ImageElement } from './editor/KonvaCanvas';
import Toolbar from './editor/Toolbar';
import LayerPanel from './editor/LayerPanel';
import BackgroundRemovalTool from './editor/BackgroundRemovalTool';
import NewDocumentModal, { DocumentSettings } from './editor/NewDocumentModal';
import DocumentTabs, { OpenDocument } from './editor/DocumentTabs';
import { trimTransparentPixels } from '../utils/imageProcessing';
import './EditorView.css';

type Tool = 'select' | 'crop' | 'eraser' | 'background-removal' | 'add-image' | 'upscale';

// Histórico para Ctrl+Z
interface HistoryState {
    images: ImageElement[];
    selectedId: string | null;
}

// Documento completo
interface Document {
    id: string;
    settings: DocumentSettings;
    images: ImageElement[];
    selectedId: string | null;
    history: HistoryState[];
    historyIndex: number;
    hasUnsavedChanges: boolean;
}

const MAX_HISTORY = 50;

const EditorView: React.FC = () => {
    // Estado de múltiplos documentos
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
    const [showNewDocModal, setShowNewDocModal] = useState(true);

    // Estados derivados do documento ativo
    const activeDocument = documents.find(d => d.id === activeDocumentId) || null;
    const docSettings = activeDocument?.settings || null;
    const images = activeDocument?.images || [];
    const selectedId = activeDocument?.selectedId || null;

    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isUndoRedo = useRef(false);

    // Trigger file input
    const triggerAddImage = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Reagir a mudança de ferramenta na Toolbar
    useEffect(() => {
        if (activeTool === 'add-image') {
            triggerAddImage();
            setActiveTool('select');
        } else if (activeTool === 'background-removal' && selectedId) {
            setShowBackgroundRemoval(true);
            setActiveTool('select');
        }
    }, [activeTool, selectedId, triggerAddImage]);

    // Converter documentos para formato do DocumentTabs
    const openDocuments: OpenDocument[] = documents.map(doc => ({
        id: doc.id,
        name: doc.settings.name,
        width: doc.settings.width,
        height: doc.settings.height,
        dpi: doc.settings.dpi,
        hasUnsavedChanges: doc.hasUnsavedChanges
    }));

    // Atualizar documento ativo
    const updateActiveDocument = useCallback((updater: (doc: Document) => Document) => {
        if (!activeDocumentId) return;
        setDocuments(prev => prev.map(doc =>
            doc.id === activeDocumentId ? updater(doc) : doc
        ));
    }, [activeDocumentId]);

    // Funções de imagens
    const setImages = useCallback((newImages: ImageElement[] | ((prev: ImageElement[]) => ImageElement[])) => {
        updateActiveDocument(doc => ({
            ...doc,
            images: typeof newImages === 'function' ? newImages(doc.images) : newImages,
            hasUnsavedChanges: true
        }));
    }, [updateActiveDocument]);

    const setSelectedId = useCallback((id: string | null) => {
        updateActiveDocument(doc => ({
            ...doc,
            selectedId: id
        }));
    }, [updateActiveDocument]);

    // Salvar estado no histórico
    const saveToHistory = useCallback((newImages: ImageElement[], newSelectedId: string | null) => {
        if (isUndoRedo.current) {
            isUndoRedo.current = false;
            return;
        }
        if (!activeDocumentId) return;

        const newState: HistoryState = {
            images: JSON.parse(JSON.stringify(newImages)),
            selectedId: newSelectedId,
        };

        setDocuments(prev => prev.map(doc => {
            if (doc.id !== activeDocumentId) return doc;

            const newHistory = doc.history.slice(0, doc.historyIndex + 1);
            newHistory.push(newState);
            if (newHistory.length > MAX_HISTORY) {
                newHistory.shift();
            }

            return {
                ...doc,
                history: newHistory,
                historyIndex: Math.min(doc.historyIndex + 1, MAX_HISTORY - 1)
            };
        }));
    }, [activeDocumentId]);

    // Undo
    const handleUndo = useCallback(() => {
        if (!activeDocument || activeDocument.historyIndex <= 0) return;

        isUndoRedo.current = true;
        const prevState = activeDocument.history[activeDocument.historyIndex - 1];

        updateActiveDocument(doc => ({
            ...doc,
            images: prevState.images,
            selectedId: prevState.selectedId,
            historyIndex: doc.historyIndex - 1
        }));
        showStatus('↩️ Desfeito');
    }, [activeDocument, updateActiveDocument]);

    // Redo
    const handleRedo = useCallback(() => {
        if (!activeDocument || activeDocument.historyIndex >= activeDocument.history.length - 1) return;

        isUndoRedo.current = true;
        const nextState = activeDocument.history[activeDocument.historyIndex + 1];

        updateActiveDocument(doc => ({
            ...doc,
            images: nextState.images,
            selectedId: nextState.selectedId,
            historyIndex: doc.historyIndex + 1
        }));
        showStatus('↪️ Refeito');
    }, [activeDocument, updateActiveDocument]);

    // Mostrar mensagem de status
    const showStatus = (message: string) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(null), 2000);
    };

    // Gerar IDs únicos
    const generateId = () => `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const generateDocId = () => `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Criar novo documento
    const handleCreateDocument = useCallback((settings: DocumentSettings) => {
        const newDoc: Document = {
            id: generateDocId(),
            settings,
            images: [],
            selectedId: null,
            history: [],
            historyIndex: -1,
            hasUnsavedChanges: false
        };

        setDocuments(prev => [...prev, newDoc]);
        setActiveDocumentId(newDoc.id);
        setShowNewDocModal(false);
        showStatus(`📄 Documento criado: ${settings.width}x${settings.height}px`);
    }, []);

    // Selecionar documento
    const handleSelectDocument = (id: string) => {
        setActiveDocumentId(id);
    };

    // Fechar documento
    const handleCloseDocument = (id: string) => {
        setDocuments(prev => prev.filter(d => d.id !== id));

        if (id === activeDocumentId) {
            const remaining = documents.filter(d => d.id !== id);
            if (remaining.length > 0) {
                setActiveDocumentId(remaining[remaining.length - 1].id);
            } else {
                setActiveDocumentId(null);
                setShowNewDocModal(true);
            }
        }
    };

    // Trim (Aparar transparência)
    const handleTrim = async (id: string) => {
        const image = images.find(img => img.id === id);
        if (!image) return;

        setIsLoading(true);
        try {
            const result = await trimTransparentPixels(image.src);
            if (result) {
                handleTransform(id, {
                    src: result.src,
                    width: result.width,
                    height: result.height
                });
                showStatus('✂️ Imagem aparada!');
            } else {
                showStatus('⚠️ Nada para aparar.');
            }
        } catch (error) {
            console.error(error);
            showStatus('❌ Erro ao aparar.');
        } finally {
            setIsLoading(false);
        }
    };

    // Adicionar nova imagem
    const handleAddImage = useCallback(async (file: File) => {
        if (!docSettings) {
            setShowNewDocModal(true);
            return;
        }

        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;

            const img = new Image();
            img.onload = () => {
                const maxWidth = docSettings.width * 0.8;
                const maxHeight = docSettings.height * 0.8;

                let imgWidth = img.width;
                let imgHeight = img.height;

                if (imgWidth > maxWidth || imgHeight > maxHeight) {
                    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                    imgWidth = imgWidth * ratio;
                    imgHeight = imgHeight * ratio;
                }

                const newImage: ImageElement = {
                    id: generateId(),
                    src,
                    x: (docSettings.width - imgWidth) / 2,
                    y: (docSettings.height - imgHeight) / 2,
                    width: imgWidth,
                    height: imgHeight,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    visible: true,
                    locked: false,
                    name: file.name.replace(/\.[^/.]+$/, ''),
                };

                const newImages = [...images, newImage];
                setImages(newImages);
                setSelectedId(newImage.id);
                saveToHistory(newImages, newImage.id);
                setIsLoading(false);
                showStatus('✓ Imagem adicionada');
            };
            img.onerror = () => {
                setIsLoading(false);
                showStatus('❌ Erro ao carregar imagem');
            };
            img.src = src;
        };
        reader.onerror = () => {
            setIsLoading(false);
            showStatus('❌ Erro ao ler arquivo');
        };
        reader.readAsDataURL(file);
    }, [docSettings, images, saveToHistory, setImages, setSelectedId]);

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(handleAddImage);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Drag & Drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            if (!docSettings) {
                // Salvar arquivos para adicionar após criar documento
                setPendingFiles(files);
                setShowNewDocModal(true);
            } else {
                files.forEach(handleAddImage);
            }
        }
    }, [docSettings, handleAddImage]);

    // Processar arquivos pendentes após criar documento
    useEffect(() => {
        if (activeDocument && pendingFiles.length > 0) {
            pendingFiles.forEach(handleAddImage);
            setPendingFiles([]);
        }
    }, [activeDocument, pendingFiles, handleAddImage]);

    // Atualizar atributos da imagem
    const handleTransform = useCallback((id: string, attrs: Partial<ImageElement>) => {
        const newImages = images.map((img) =>
            img.id === id ? { ...img, ...attrs } : img
        );
        setImages(newImages);
        saveToHistory(newImages, selectedId);
    }, [images, selectedId, saveToHistory, setImages]);

    // Deletar imagem selecionada
    const handleDelete = useCallback(() => {
        if (selectedId) {
            const newImages = images.filter((img) => img.id !== selectedId);
            setImages(newImages);
            setSelectedId(null);
            saveToHistory(newImages, null);
            showStatus('🗑️ Imagem excluída');
        }
    }, [selectedId, images, saveToHistory, setImages, setSelectedId]);

    // Duplicar imagem
    const handleDuplicate = useCallback((keepOriginalSelection = false) => {
        if (selectedId) {
            const selected = images.find((img) => img.id === selectedId);
            if (selected) {
                const duplicate: ImageElement = {
                    ...selected,
                    id: generateId(),
                    x: keepOriginalSelection ? selected.x : selected.x + 30,
                    y: keepOriginalSelection ? selected.y : selected.y + 30,
                    name: `${selected.name} (cópia)`,
                };

                const newImages = [...images, duplicate];
                setImages(newImages);

                if (keepOriginalSelection) {
                    saveToHistory(newImages, selectedId);
                } else {
                    setSelectedId(duplicate.id);
                    saveToHistory(newImages, duplicate.id);
                }

                showStatus('📋 Imagem duplicada');
            }
        }
    }, [selectedId, images, saveToHistory, setImages, setSelectedId]);

    // Toggle visibilidade
    const handleToggleVisibility = useCallback((id: string) => {
        const newImages = images.map((img) =>
            img.id === id ? { ...img, visible: !img.visible } : img
        );
        setImages(newImages);
        saveToHistory(newImages, selectedId);
    }, [images, selectedId, saveToHistory, setImages]);

    // Toggle lock
    const handleToggleLock = useCallback((id: string) => {
        const newImages = images.map((img) =>
            img.id === id ? { ...img, locked: !img.locked } : img
        );
        setImages(newImages);
        saveToHistory(newImages, selectedId);
    }, [images, selectedId, saveToHistory, setImages]);

    // Reordenar camadas
    const handleReorderLayers = useCallback((newOrder: ImageElement[]) => {
        setImages(newOrder);
        saveToHistory(newOrder, selectedId);
    }, [selectedId, saveToHistory, setImages]);

    // Exportar canvas
    const handleExport = useCallback(async () => {
        if (!docSettings) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = docSettings.width;
        tempCanvas.height = docSettings.height;
        const ctx = tempCanvas.getContext('2d');

        if (!ctx) return;

        if (docSettings.backgroundColor !== 'transparent') {
            ctx.fillStyle = docSettings.backgroundColor === 'white' ? '#ffffff' :
                docSettings.backgroundColor === 'black' ? '#000000' :
                    docSettings.backgroundColor || '#ffffff';
            ctx.fillRect(0, 0, docSettings.width, docSettings.height);
        }

        for (const img of images.filter(i => i.visible)) {
            try {
                const imgElement = new Image();
                imgElement.crossOrigin = 'anonymous';
                await new Promise<void>((resolve, reject) => {
                    imgElement.onload = () => resolve();
                    imgElement.onerror = reject;
                    imgElement.src = img.src;
                });

                ctx.save();
                ctx.translate(img.x + img.width / 2, img.y + img.height / 2);
                ctx.rotate((img.rotation * Math.PI) / 180);
                ctx.drawImage(
                    imgElement,
                    -img.width / 2 * img.scaleX,
                    -img.height / 2 * img.scaleY,
                    img.width * img.scaleX,
                    img.height * img.scaleY
                );
                ctx.restore();
            } catch (error) {
                console.error('Erro ao carregar imagem para exportar:', error);
            }
        }

        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${docSettings.name || 'imagem'}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showStatus('📥 Imagem exportada!');
    }, [docSettings, images]);

    // Remover fundo
    const handleRemoveBackground = useCallback(() => {
        if (!selectedId) return;
        setShowBackgroundRemoval(true);
    }, [selectedId]);

    // Aplicar remoção de fundo
    const handleApplyBackgroundRemoval = useCallback((processedSrc: string) => {
        if (!selectedId) return;

        const newImages = images.map(img =>
            img.id === selectedId ? { ...img, src: processedSrc } : img
        );
        setImages(newImages);
        saveToHistory(newImages, selectedId);
        setShowBackgroundRemoval(false);
        showStatus('🎨 Fundo removido!');
    }, [selectedId, images, saveToHistory, setImages]);

    // Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) {
                    e.preventDefault();
                    handleDelete();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                handleDuplicate();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                setShowNewDocModal(true);
            } else if (e.key === 'a' || e.key === 'A') {
                // Atalho para adicionar imagem
                triggerAddImage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, handleDelete, handleDuplicate, selectedId, triggerAddImage]);

    // Se não houver documento ativo
    if (!activeDocument && !showNewDocModal && documents.length === 0) {
        return (
            <div className="editor-view empty-state">
                <div className="empty-message">
                    <h2>Bem-vindo ao Editor</h2>
                    <p>Crie um novo documento para começar</p>
                    <button className="btn-primary" onClick={() => setShowNewDocModal(true)}>
                        Novo Documento
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`editor-view ${isDraggingOver ? 'dragging-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Toolbar */}
            <Toolbar
                activeTool={activeTool}
                onToolSelect={setActiveTool}
                onExport={handleExport}
                canDelete={!!selectedId}
                onDelete={handleDelete}
                canDuplicate={!!selectedId}
                onDuplicate={() => handleDuplicate()}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={activeDocument ? activeDocument.historyIndex > 0 : false}
                canRedo={activeDocument ? activeDocument.historyIndex < activeDocument.history.length - 1 : false}
            />

            {/* Document Tabs */}
            <DocumentTabs
                documents={openDocuments}
                activeDocumentId={activeDocumentId}
                onSelectDocument={handleSelectDocument}
                onCloseDocument={handleCloseDocument}
                onNewDocument={() => setShowNewDocModal(true)}
            />

            {/* Main Content */}
            <div className="editor-content">
                {/* Canvas Area */}
                <div className="canvas-container">
                    {activeDocument ? (
                        <KonvaCanvas
                            width={docSettings?.width || 1000}
                            height={docSettings?.height || 1000}
                            images={images}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onTransform={handleTransform}
                            backgroundColor={docSettings?.backgroundColor}
                            dpi={docSettings?.dpi}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                            onRemoveBackground={handleRemoveBackground}
                            onTrim={handleTrim}
                            onAddImage={handleAddImage}
                        />
                    ) : (
                        <div className="canvas-placeholder">
                            <p>Crie ou abra um documento para começar</p>
                        </div>
                    )}
                </div>

                {/* Layer Panel */}
                <LayerPanel
                    images={images}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onToggleVisibility={handleToggleVisibility}
                    onToggleLock={handleToggleLock}
                    onReorder={handleReorderLayers}
                    onDelete={handleDelete}
                    onDuplicate={() => handleDuplicate()}
                />
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
            />

            {/* Drop overlay */}
            {isDraggingOver && (
                <div className="drop-overlay">
                    <div className="drop-message">
                        <span className="drop-icon">📁</span>
                        <p>Solte as imagens aqui</p>
                    </div>
                </div>
            )}

            {/* New Document Modal */}
            {showNewDocModal && (
                <NewDocumentModal
                    isOpen={showNewDocModal}
                    onClose={() => {
                        if (documents.length > 0) {
                            setShowNewDocModal(false);
                        }
                    }}
                    onConfirm={handleCreateDocument}
                />
            )}

            {/* Background Removal Tool */}
            {showBackgroundRemoval && selectedId && (
                <BackgroundRemovalTool
                    imageSrc={images.find(img => img.id === selectedId)?.src || ''}
                    onApply={handleApplyBackgroundRemoval}
                    onCancel={() => setShowBackgroundRemoval(false)}
                />
            )}

            {/* Status Message */}
            {statusMessage && (
                <div className="status-message">
                    {statusMessage}
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner" />
                </div>
            )}
        </div>
    );
};

export default EditorView;
