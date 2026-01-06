
/**
 * Editor View - Editor de Imagens Premium (Restored Ultimate Version)
 * Com histórico (Ctrl+Z/Y), Novo Documento, Drag & Drop, Múltiplos Documentos, Grid Inteligente e IA.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import KonvaCanvas from './editor/KonvaCanvas';
import { LibraryItem, CanvasElement, ImageElement, DocumentSettings } from '../types/canvas-elements';
import Toolbar from './editor/Toolbar';
import LayerPanel from './editor/LayerPanel';
import NewDocumentModal from './editor/NewDocumentModal';
import DocumentTabs, { OpenDocument } from './editor/DocumentTabs';
import MagicBar from './editor/MagicBar';
import EditorSidebar from './editor/EditorSidebar';
import ZoomControls from './editor/ZoomControls';
import { useToast } from './editor/ToastNotification';
import { GoogleGenerativeAI } from '@google/generative-ai';
import BackgroundRemovalTool from './editor/BackgroundRemovalTool';
import AICreativePanel from './editor/AICreativePanel';
import { trimTransparentPixels } from '../utils/imageProcessing';
import './EditorView.css';

type Tool = 'select' | 'crop' | 'eraser' | 'background-removal' | 'add-image' | 'upscale';

interface EditorViewProps {
    geminiApiKey?: string;
    kieAiApiKey?: string;
}

interface HistoryState {
    images: CanvasElement[];
    selectedId: string | null;
    selectedIds?: string[];
}

interface Document {
    id: string;
    settings: DocumentSettings;
    images: CanvasElement[];
    selectedIds: string[];
    history: HistoryState[];
    historyIndex: number;
    hasUnsavedChanges: boolean;
}

const MAX_HISTORY = 50;

// --- Autosave Utility (Modern IndexedDB) ---
const DB_NAME = 'ImprimeAI_Editor';
const STORE_NAME = 'project_data';

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const persistState = async (documents: Document[], activeDocumentId: string | null, imageCache: Map<string, string>) => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // HYDRATE FOR STORAGE: We must save the full data to disk
        const docsToSave = documents.map(doc => ({
            ...doc,
            images: doc.images.map(img => {
                if (img.type === 'image') {
                    const i = img as ImageElement;
                    // If src is missing but we have a ref, grab from cache
                    if (!i.src && i.srcRef && imageCache.has(i.srcRef)) {
                        return { ...i, src: imageCache.get(i.srcRef) };
                    }
                }
                return img;
            })
        }));

        store.put(docsToSave, 'documents');
        store.put(activeDocumentId, 'activeDocumentId');
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('Autosave error:', e);
    }
};

const loadState = async (): Promise<{ documents: Document[], activeDocumentId: string | null, cache?: Map<string, string> } | null> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const docsReq = store.get('documents');
        const activeIdReq = store.get('activeDocumentId');

        return new Promise((resolve) => {
            tx.oncomplete = () => {
                const docs = docsReq.result || [];
                const activeId = activeIdReq.result || null;
                const newCache = new Map<string, string>();

                // DEHYDRATE FOR STATE: Strip heavy base64 into cache
                const lightweightDocs = docs.map((doc: Document) => ({
                    ...doc,
                    images: doc.images.map((img: CanvasElement) => {
                        if (img.type === 'image') {
                            const i = img as ImageElement;
                            if (i.src) {
                                // Ensure we have a srcRef ID
                                const refId = i.srcRef || i.id;
                                newCache.set(refId, i.src);
                                return { ...i, src: '', srcRef: refId }; // Strip src
                            }
                        }
                        return img;
                    })
                }));

                resolve({
                    documents: lightweightDocs,
                    activeDocumentId: activeId,
                    cache: newCache
                });
            };
            tx.onerror = () => resolve(null);
        });
    } catch (e) {
        console.error('Load error:', e);
        return null;
    }
};

const EditorView: React.FC<EditorViewProps> = ({ geminiApiKey, kieAiApiKey }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isLoaded, setIsLoaded] = useState(false);

    const [showNewDocModal, setShowNewDocModal] = useState(false);
    const [activeTool, setActiveTool] = useState<Tool>('select');

    const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
    const [showAICreativePanel, setShowAICreativePanel] = useState(false);

    const [zoomScale, setZoomScale] = useState(1);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { showToast } = useToast();
    const [aiThinking, setAiThinking] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [currentAiPrompt, setCurrentAiPrompt] = useState('');
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageSourceCache = useRef<Map<string, string>>(new Map());
    const isUndoRedo = useRef(false);
    const [cacheVersion, setCacheVersion] = useState(0);
    const [currentModel, setCurrentModel] = useState('gemini-2.5-flash');

    const activeDocument = documents.find(d => d.id === activeDocumentId) || null;
    const docSettings = activeDocument?.settings || null;
    const images = activeDocument?.images || [];
    const selectedIds = activeDocument?.selectedIds || [];
    const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;

    // --- Persistence & Autosave ---
    useEffect(() => {
        const init = async () => {
            const saved: any = await loadState();
            if (saved) {
                // Merge loaded cache
                if (saved.cache) {
                    saved.cache.forEach((val: string, key: string) => {
                        imageSourceCache.current.set(key, val);
                    });
                }
                setDocuments(saved.documents);
                setActiveDocumentId(saved.activeDocumentId);
            } else {
                // Start fresh
                setShowNewDocModal(true);
            }
            setIsLoaded(true);
        };
        init();
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        setSaveStatus('saving');
        const timer = setTimeout(async () => {
            // Pass the cache so we can hydrate before saving to disk
            await persistState(documents, activeDocumentId, imageSourceCache.current);
            setSaveStatus('saved');
            // Reset to idle after 3s
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [documents, activeDocumentId, isLoaded]);


    const resolvedImages = useMemo(() => {
        return images.map(img => {
            if (img.type === 'image') {
                const imgItem = img as ImageElement;
                if (imgItem.srcRef && !imgItem.src) {
                    return { ...imgItem, src: imageSourceCache.current.get(imgItem.srcRef) || '' };
                }
            }
            return img;
        }) as CanvasElement[];
    }, [images, cacheVersion]);

    useEffect(() => {
        let changed = false;
        documents.forEach(doc => {
            doc.images.forEach(img => {
                if (img.type === 'image' && img.src && !img.srcRef) {
                    if (!imageSourceCache.current.has(img.id)) {
                        imageSourceCache.current.set(img.id, img.src);
                        changed = true;
                    }
                }
            });
        });
        if (changed) setCacheVersion(v => v + 1);
    }, [documents]);

    // --- ZOOM & SCROLL LOGIC ---

    const handleZoomIn = () => {
        setZoomScale(prev => Math.min(prev * 1.25, 20));
    };

    const handleZoomOut = () => {
        setZoomScale(prev => Math.max(prev / 1.25, 0.05));
    };

    const handleFitScreen = useCallback(() => {
        if (!docSettings || !scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const padding = 120;
        const availableW = container.clientWidth - padding;
        const availableH = container.clientHeight - padding;

        if (availableW <= 0 || availableH <= 0) {
            setZoomScale(1);
            return;
        }

        const scaleW = availableW / docSettings.width;
        const scaleH = availableH / docSettings.height;
        const scale = Math.max(0.01, Math.min(scaleW, scaleH, 10));

        setZoomScale(scale);
    }, [docSettings]);

    const handleResetZoom = () => {
        setZoomScale(1);
    };

    // Zoom responsibility moved to KonvaCanvas to avoid double-processing and enable Point-to-Zoom


    // --- DOCUMENT MANAGEMENT ---
    const generateDocId = () => `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const updateActiveDocument = useCallback((updateFn: (doc: Document) => Document) => {
        if (!activeDocumentId) return;
        setDocuments(prev => prev.map(doc => doc.id === activeDocumentId ? updateFn(doc) : doc));
    }, [activeDocumentId]);

    const setImages = useCallback((newImages: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
        updateActiveDocument(doc => ({
            ...doc,
            images: typeof newImages === 'function' ? newImages(doc.images) : newImages,
            hasUnsavedChanges: true
        }));
    }, [updateActiveDocument]);

    const setSelectedIds = useCallback((ids: string[]) => {
        updateActiveDocument(doc => ({ ...doc, selectedIds: ids }));
    }, [updateActiveDocument]);

    const setSelectedId = useCallback((id: string | null) => {
        setSelectedIds(id ? [id] : []);
    }, [setSelectedIds]);

    const saveToHistory = useCallback((newImages: CanvasElement[], newSelectedId: string | null, newSelectedIds?: string[]) => {
        if (isUndoRedo.current) { isUndoRedo.current = false; return; }
        if (!activeDocumentId) return;

        // SMART SHALLOW CLONE: Significantly faster than JSON.stringify
        // We clone the array but keep element references. Since our updates (setImages) 
        // always create NEW objects for changed items (immutable pattern), 
        // this is safe and 100x more memory efficient.
        const newState: HistoryState = {
            images: [...newImages],
            selectedId: newSelectedId,
            selectedIds: newSelectedIds || (newSelectedId ? [newSelectedId] : [])
        };

        setDocuments(prev => prev.map(doc => {
            if (doc.id !== activeDocumentId) return doc;
            const newHistory = doc.history.slice(0, doc.historyIndex + 1);
            newHistory.push(newState);
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            return { ...doc, history: newHistory, historyIndex: newHistory.length - 1 };
        }));
    }, [activeDocumentId]);

    // --- STABLE PASTE HANDLER ---
    const handleAddImageRef = useRef<any>(null);
    const generateId = () => `el-${crypto.randomUUID().slice(0, 8)}-${Date.now().toString(36)}`;

    const handleAddImageFromSrc = useCallback((src: string, name: string) => {
        const img = new Image();
        img.onload = () => {
            let w = img.width;
            let h = img.height;
            const maxDim = 800;
            if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w *= ratio;
                h *= ratio;
            }
            const imgId = generateId();

            // OTIMIZAÇÃO: Guardar no cache e não no estado principal
            imageSourceCache.current.set(imgId, src);
            setCacheVersion(v => v + 1);

            const newImg: ImageElement = {
                type: 'image',
                id: imgId,
                srcRef: imgId,
                src: '', // Deixa vazio no estado principal
                x: docSettings ? (docSettings.width - w) / 2 : 0,
                y: docSettings ? (docSettings.height - h) / 2 : 0,
                width: w,
                height: h,
                rotation: 0, scaleX: 1, scaleY: 1, visible: true, locked: false,
                name: name
            };

            setImages(prev => {
                const next = [...prev, newImg];
                saveToHistory(next, newImg.id);
                return next;
            });
            setSelectedId(newImg.id);
            showToast('Imagem adicionada', 'success');
        };
        img.src = src;
    }, [docSettings, showToast, setImages, saveToHistory]);

    const handleAddImage = useCallback((file: File, customName?: string) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            handleAddImageFromSrc(src, customName || file.name);
        };
        reader.readAsDataURL(file);
    }, [handleAddImageFromSrc]);

    useEffect(() => { handleAddImageRef.current = handleAddImage; }, [handleAddImage]);

    const handleRemoveBackgroundAction = useCallback(() => {
        if (!selectedId) {
            showToast('Selecione uma imagem primeiro', 'info');
            return;
        }
        setShowBackgroundRemoval(true);
    }, [selectedId, showToast]);

    const handleDeleteAction = useCallback(() => {
        if (selectedIds.length === 0) return;
        setImages(prev => {
            const next = prev.filter(img => !selectedIds.includes(img.id));
            saveToHistory(next, null);
            return next;
        });
        setSelectedIds([]);
        showToast('Elemento(s) removido(s)', 'info');
    }, [selectedIds, setImages, saveToHistory, setSelectedIds, showToast]);

    const handleDuplicateAction = useCallback((options?: { x?: number, y?: number, sourceIds?: string[], leaderId?: string, isAltDrag?: boolean, targetPositions?: { id: string, x: number, y: number }[] }) => {
        const idsToDuplicate = options?.sourceIds || selectedIds;
        if (idsToDuplicate.length === 0) return;

        const cloneElement = (el: CanvasElement): CanvasElement => {
            const copy = JSON.parse(JSON.stringify(el));
            copy.id = generateId();
            if (el.type === 'image') {
                const img = el as ImageElement;
                (copy as ImageElement).srcRef = img.srcRef || img.id;
            }
            return copy;
        };

        setImages(prev => {
            const next = [...prev];
            const copies: CanvasElement[] = [];

            if (options?.isAltDrag && options.targetPositions) {
                // PRECISION ALT-DRAG (No Flicker, Proper Stacking):
                // Sort targets by current index to ensure splice doesn't mess up the order
                const sortedTargets = [...options.targetPositions].sort((a, b) => {
                    const idxA = next.findIndex(i => i.id === a.id);
                    const idxB = next.findIndex(i => i.id === b.id);
                    return idxB - idxA;
                });

                sortedTargets.forEach(target => {
                    const originalIndex = next.findIndex(i => i.id === target.id);
                    if (originalIndex !== -1) {
                        const original = next[originalIndex];
                        const startState = prev.find(i => i.id === target.id);
                        if (startState) {
                            const clone = cloneElement(startState);
                            clone.x = startState.x;
                            clone.y = startState.y;
                            // Move the original node to its new dropped position
                            next[originalIndex] = { ...original, x: target.x, y: target.y };
                            // Insert the clone AT the original index (pushes original 'above' it)
                            next.splice(originalIndex, 0, clone);
                        }
                    }
                });
                saveToHistory(next, selectedId, selectedIds);
                return next;
            } else {
                // NORMAL DUPLICATION (Ctrl+D)
                const currentScale = (window as any).canvasScale || 1;
                let deltaX = 20 / currentScale;
                let deltaY = 20 / currentScale;

                if (options?.leaderId && options.x !== undefined && options.y !== undefined) {
                    const originalLeader = prev.find(img => img.id === options.leaderId);
                    if (originalLeader) {
                        deltaX = options.x - originalLeader.x;
                        deltaY = options.y - originalLeader.y;
                    }
                }

                idsToDuplicate.forEach(id => {
                    const originalIndex = next.findIndex(i => i.id === id);
                    if (originalIndex !== -1) {
                        const original = next[originalIndex];
                        const copy = cloneElement(original);
                        copy.x = original.x + deltaX;
                        copy.y = original.y + deltaY;
                        copies.push(copy);
                        next.splice(originalIndex + 1, 0, copy);
                    }
                });

                if (copies.length > 0) {
                    const finalIds = copies.map(c => c.id);
                    setSelectedId(finalIds[0]);
                    setSelectedIds(finalIds);
                    saveToHistory(next, finalIds[0], finalIds);
                    showToast('Duplicado', 'success');
                    return next;
                }
            }
            return prev;
        });
    }, [selectedIds, selectedId, setImages, saveToHistory, setSelectedIds, setSelectedId, showToast]);

    const handleTrimAction = useCallback(async () => {
        if (!selectedId) return;
        const imgElement = resolvedImages.find(i => i.id === selectedId);
        if (!imgElement || imgElement.type !== 'image') return;

        const image = imgElement as ImageElement;
        try {
            const result = await trimTransparentPixels(image.src);
            if (result) {
                setImages(prev => {
                    const next = prev.map(img => {
                        if (img.id === selectedId) {
                            const i = img as ImageElement;
                            // Ajustar posição baseada no corte e escala atual
                            const newX = i.x + (result.x * i.scaleX);
                            const newY = i.y + (result.y * i.scaleY);

                            return {
                                ...i,
                                src: result.src,
                                x: newX,
                                y: newY,
                                width: result.width,
                                height: result.height,
                            };
                        }
                        return img;
                    });
                    saveToHistory(next, selectedId);
                    return next;
                });
                showToast('Espaço vazio removido', 'success');
            } else {
                showToast('A imagem já está otimizada', 'info');
            }
        } catch (error) {
            console.error('Erro no trim:', error);
            showToast('Erro ao aparar imagem', 'error');
        }
    }, [selectedId, resolvedImages, setImages, saveToHistory, showToast]);

    const handleAlign = useCallback((type: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
        if (selectedIds.length < 2) return;
        setImages(prev => {
            const selectedItems = prev.filter(i => selectedIds.includes(i.id));
            if (selectedItems.length < 2) return prev;

            let targetValue: number;
            const boxes = selectedItems.map(i => ({
                ...i,
                w: ((i as any).width || 100) * (i.scaleX || 1),
                h: ((i as any).height || 100) * (i.scaleY || 1)
            }));

            if (type === 'left') targetValue = Math.min(...boxes.map(b => b.x));
            else if (type === 'right') targetValue = Math.max(...boxes.map(b => b.x + b.w));
            else if (type === 'top') targetValue = Math.min(...boxes.map(b => b.y));
            else if (type === 'bottom') targetValue = Math.max(...boxes.map(b => b.y + b.h));
            else if (type === 'center-h') {
                const minX = Math.min(...boxes.map(b => b.x));
                const maxX = Math.max(...boxes.map(b => b.x + b.w));
                targetValue = minX + (maxX - minX) / 2;
            } else {
                const minY = Math.min(...boxes.map(b => b.y));
                const maxY = Math.max(...boxes.map(b => b.y + b.h));
                targetValue = minY + (maxY - minY) / 2;
            }

            const next = prev.map(img => {
                if (!selectedIds.includes(img.id)) return img;
                const b = {
                    w: ((img as any).width || 100) * (img.scaleX || 1),
                    h: ((img as any).height || 100) * (img.scaleY || 1)
                };
                if (type === 'left') return { ...img, x: targetValue };
                if (type === 'right') return { ...img, x: targetValue - b.w };
                if (type === 'top') return { ...img, y: targetValue };
                if (type === 'bottom') return { ...img, y: targetValue - b.h };
                if (type === 'center-h') return { ...img, x: targetValue - b.w / 2 };
                return { ...img, y: targetValue - b.h / 2 };
            });

            saveToHistory(next, selectedId, selectedIds);
            return next;
        });
    }, [selectedIds, selectedId, setImages, saveToHistory]);

    const handleDistribute = useCallback((axis: 'horizontal' | 'vertical') => {
        if (selectedIds.length < 3) return;
        setImages(prev => {
            const selectedItems = prev.filter(i => selectedIds.includes(i.id))
                .map(i => ({
                    ...i,
                    w: ((i as any).width || 100) * (i.scaleX || 1),
                    h: ((i as any).height || 100) * (i.scaleY || 1)
                }));

            if (axis === 'horizontal') {
                selectedItems.sort((a, b) => a.x - b.x);
                const first = selectedItems[0];
                const last = selectedItems[selectedItems.length - 1];
                const firstCenter = first.x + first.w / 2;
                const lastCenter = last.x + last.w / 2;
                const step = (lastCenter - firstCenter) / (selectedItems.length - 1);

                const next = prev.map(img => {
                    if (!selectedIds.includes(img.id)) return img;
                    const idx = selectedItems.findIndex(si => si.id === img.id);
                    const b = selectedItems[idx];
                    return { ...img, x: firstCenter + idx * step - b.w / 2 };
                });
                saveToHistory(next, selectedId, selectedIds);
                return next;
            } else {
                selectedItems.sort((a, b) => a.y - b.y);
                const first = selectedItems[0];
                const last = selectedItems[selectedItems.length - 1];
                const firstCenter = first.y + first.h / 2;
                const lastCenter = last.y + last.h / 2;
                const step = (lastCenter - firstCenter) / (selectedItems.length - 1);

                const next = prev.map(img => {
                    if (!selectedIds.includes(img.id)) return img;
                    const idx = selectedItems.findIndex(si => si.id === img.id);
                    const b = selectedItems[idx];
                    return { ...img, y: firstCenter + idx * step - b.h / 2 };
                });
                saveToHistory(next, selectedId, selectedIds);
                return next;
            }
        });
    }, [selectedIds, selectedId, setImages, saveToHistory]);

    const handleBringToFront = useCallback(() => {
        if (!selectedId) return;
        setImages(prev => {
            const item = prev.find(i => i.id === selectedId);
            if (!item) return prev;
            const next = prev.filter(i => i.id !== selectedId);
            next.push(item);
            saveToHistory(next, selectedId);
            return next;
        });
    }, [selectedId, setImages, saveToHistory]);

    const handleSendToBack = useCallback(() => {
        if (!selectedId) return;
        setImages(prev => {
            const item = prev.find(i => i.id === selectedId);
            if (!item) return prev;
            const next = prev.filter(i => i.id !== selectedId);
            next.unshift(item);
            saveToHistory(next, selectedId);
            return next;
        });
    }, [selectedId, setImages, saveToHistory]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            // Delete / Backspace
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    handleDeleteAction();
                }
            }

            // Undo: Ctrl + Z
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }

            // Redo: Ctrl + Y or Ctrl + Shift + Z
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
            }
        };

        const onPaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const file = new File([blob], `colado-${Date.now()}.png`, { type: blob.type });
                        if (handleAddImageRef.current) handleAddImageRef.current(file);
                        showToast('Imagem colada!', 'success');
                    }
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('paste', onPaste);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('paste', onPaste);
        };
    }, [selectedIds, handleDeleteAction, showToast]);


    const handleUpdateMany = useCallback((updates: { id: string, attrs: Partial<CanvasElement> }[]) => {
        setImages(prev => prev.map(img => {
            const update = updates.find(u => u.id === img.id);
            return update ? ({ ...img, ...update.attrs } as CanvasElement) : img;
        }));
    }, [setImages]);



    const handleCreateDocument = useCallback((settings: DocumentSettings) => {
        const newDoc: Document = {
            id: generateDocId(),
            settings,
            images: [],
            selectedIds: [],
            history: [],
            historyIndex: -1,
            hasUnsavedChanges: false
        };

        // Reset state BEFORE switching
        setDocuments(prev => [...prev, newDoc]);
        setActiveDocumentId(newDoc.id);
        setShowNewDocModal(false);

        // Force reset zoom & fit screen after a short delay to allow layout to settle
        requestAnimationFrame(() => {
            // Reset internal zoom state
            setZoomScale(1);
            // Trigger fit to screen logic
            if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const padding = 120;
                const availableW = container.clientWidth - padding;
                const availableH = container.clientHeight - padding;

                // Allow zoom down to 1% (0.01) for huge documents
                const scaleW = Math.max(0.01, availableW / settings.width);
                const scaleH = Math.max(0.01, availableH / settings.height);
                const scale = Math.min(scaleW, scaleH, 1.5); // Cap max initial zoom

                // Update zoom state
                setZoomScale(scale);
            }
        });

        showToast(`Documento criado: ${settings.width}x${settings.height}px`, 'success');
    }, [showToast]);

    const handleUndo = () => {
        if (!activeDocument || activeDocument.historyIndex <= 0) return;
        isUndoRedo.current = true;
        const prev = activeDocument.history[activeDocument.historyIndex - 1];
        updateActiveDocument(doc => ({
            ...doc, images: prev.images, selectedIds: prev.selectedIds || [], historyIndex: doc.historyIndex - 1
        }));
        showToast('Desfeito', 'info');
    };

    const handleRedo = () => {
        if (!activeDocument || activeDocument.historyIndex >= activeDocument.history.length - 1) return;
        isUndoRedo.current = true;
        const next = activeDocument.history[activeDocument.historyIndex + 1];
        updateActiveDocument(doc => ({
            ...doc, images: next.images, selectedIds: next.selectedIds || [], historyIndex: doc.historyIndex + 1
        }));
        showToast('Refeito', 'info');
    };

    const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);

    const handleAICommand = async (command: string): Promise<string> => {
        if (!geminiApiKey || !docSettings) return 'Configuração incompleta';
        setAiThinking(true);
        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            // Usar o modelo selecionado pelo usuário
            let model = genAI.getGenerativeModel({ model: currentModel });
            const selImage = resolvedImages.find(i => i.id === selectedId);

            // Contexto rico para a IA entender o canvas com unidades reais
            const dpi = docSettings.dpi || 300; // Default to 300 if missing
            const pxToCm = (px: number) => (px / dpi) * 2.54;
            const cmToPx = (cm: number) => (cm / 2.54) * dpi;

            const context = {
                doc: {
                    widthPx: docSettings.width,
                    heightPx: docSettings.height,
                    widthCm: pxToCm(docSettings.width).toFixed(2),
                    heightCm: pxToCm(docSettings.height).toFixed(2),
                    dpi: dpi
                },
                selection: selImage ? {
                    x: selImage.x, y: selImage.y,
                    widthPx: (selImage as any).width * selImage.scaleX,
                    heightPx: (selImage as any).height * selImage.scaleY,
                    widthCm: pxToCm((selImage as any).width * selImage.scaleX).toFixed(2),
                    heightCm: pxToCm((selImage as any).height * selImage.scaleY).toFixed(2),
                    type: selImage.type,
                    name: selImage.name
                } : null,
                totalElements: images.length
            };

            const systemPrompt = `
                You are an expert AI Design Assistant capable of precise layout calculations.
                
                CURRENT CONTEXT (Physical & Digital):
                - Document: ${context.doc.widthPx}x${context.doc.heightPx} px (${context.doc.widthCm}x${context.doc.heightCm} cm) @ ${context.doc.dpi} DPI.
                - Selected Item: ${context.selection ? JSON.stringify(context.selection) : 'None'}.
                - 1 cm = ${Math.round(cmToPx(1))} pixels.

                USER COMMAND: "${command}"

                INSTRUCTIONS:
                - If the user specifies physical units (cm, mm, m), CONVERT them to pixels using the provided DPI reference before responding.
                - "Half a meter" = 50 cm. "10 cm" = ${(10 / 2.54 * dpi).toFixed(0)} px.

                INSTRUCTIONS:
                1. **ROLE:** You are an Expert DTF (Direct to Film) Printing Assistant. Your CORE directive is MATERIAL EFFICIENCY.
                2. **MANDATORY STRATEGY (Native Optimization):** 
                   - **Always optimize space.** Never leave unnecessary gaps. 
                   - **Always start at Top-Left (0,0).**
                   - **Always use 'smart_grid'** for layouts to ensure consistent packing.
                   - Default to "fill_area" or "fill_page" logic if count is not specified.

                3. **THINKING PROCESS (Must be first):**
                   - Analyze measurements.
                   - Plan the most compact flow possible.
                   - "User asked for grid? I will pack them tightly starting 0,0."

                4. **OUTPUT JSON:**
                   Use "smart_grid" for EVERYTHING involving layout/copies.

                AVAILABLE ACTIONS (JSON):
                1. "smart_grid": 
                   Format: { 
                     "action": "smart_grid", 
                     "items": [ 
                        { "type": "selection", "count": number | "fill", "widthCm": number (optional) }
                     ],
                     "limitHeightCm": number (optional)
                   }
                
                2. "resize": Simple single resize. { "action": "resize", "widthCm": number }
                3. "remove_background": { "action": "remove_background" }

                EXAMPLES:
                - User: "Preciso de meio metro dessa logo" -> 
                  THOUGHT: User wants to fill 50cm linear height. No specific count, so strategy is fill_area.
                  JSON: [{"action": "smart_grid", "items": [{"type": "selection", "count": "fill"}], "limitHeightCm": 50}]
                
                - User: "10 dessa com 5cm e 15 com 15cm" ->
                  THOUGHT: Mixed batch. 10 copies @ 5cm, 15 copies @ 15cm.
                  JSON: [{"action": "smart_grid", "items": [{"type": "selection", "count": 10, "widthCm": 5}, {"type": "selection", "count": 15, "widthCm": 15}]}]
            `;

            const result = await model.generateContent(systemPrompt);
            const responseText = result.response.text();

            console.log("AI Context:", context);
            console.log("AI Raw Response:", responseText);

            // Extrair JSON robustamente
            // Procura pelo bloco JSON: ou após a tag "JSON:" ou apenas o array.
            let jsonString = null;
            const jsonBlockMatch = responseText.match(/JSON:\s*(\[[\s\S]*\])/i);
            if (jsonBlockMatch) {
                jsonString = jsonBlockMatch[1];
            } else {
                const directMatch = responseText.match(/\[[\s\S]*\]/);
                if (directMatch) jsonString = directMatch[0];
            }

            let finalResp = responseText;
            // Se tiver pensamento, limpar da resposta final para o usuário não ver o "cérebro" exposto (opcional)
            // Se for conversa, mantemos tudo ou limpamos o "THOUGHT:"? 
            // Melhor: Se não for JSON (conversa), mostramos o texto limpo.

            if (jsonString) {
                try {
                    let actions = JSON.parse(jsonString);
                    if (!Array.isArray(actions)) actions = [actions];

                    if (actions.length > 0) {
                        // Extrair o "Thought" para mostrar como feedback sutil ou log
                        const thoughtMatch = responseText.match(/THOUGHT:\s*([\s\S]*?)(?=JSON:|$)/i);
                        const thought = thoughtMatch ? thoughtMatch[1].trim() : "Processando...";
                        showToast(`IA: ${thought.substring(0, 50)}...`, 'info'); // Mostra pedaço do pensamento

                        finalResp = "Ações executadas.";
                    }

                    for (const act of actions) {
                        console.log('[AI Agent] Executing:', act);
                        // ... (Action handlers logic remains largely the same, just appending to finalResp)

                        if (act.action === 'smart_grid' && selImage) {
                            // DTF Standard: 1cm safety margin
                            const margin = cmToPx(1);
                            const gap = cmToPx(0.5); // 0.5cm gap

                            let currentX = margin;
                            let currentY = margin;
                            let rowMaxH = 0;
                            const newImages: ImageElement[] = [];

                            // Process items batch by batch
                            const batches = act.items || [{ type: 'selection', count: 'fill' }];
                            let globalCreateLimit = 1000;

                            // Preparation: If we are effectively replacing the canvas content with a layout,
                            // we might want to "consume" the selected image into the grid.
                            // Strategy: The first item of the grid BECOMES the selected image (moved), 
                            // subsequent items are clones.

                            let isOriginalUsed = false;

                            for (const batch of batches) {
                                let count = batch.count;
                                const widthCm = batch.widthCm;

                                // Calculate dimensions for this batch
                                let batchW = (selImage as any).width * selImage.scaleX;
                                let batchH = (selImage as any).height * selImage.scaleY;
                                let scaleX = selImage.scaleX;
                                let scaleY = selImage.scaleY;

                                if (widthCm) {
                                    const targetPx = cmToPx(widthCm);
                                    const currentPx = (selImage as any).width; // Base width
                                    const factor = targetPx / currentPx;
                                    scaleX = factor;
                                    scaleY = factor;
                                    batchW = targetPx;
                                    batchH = (selImage as any).height * factor;
                                }

                                // Determine count for "fill"
                                if (count === 'fill') {
                                    // Calculate how many fit in the requested area
                                    const availableW = docSettings.width - (margin * 2);
                                    let availableH = docSettings.height - (margin * 2);
                                    if (act.limitHeightCm) availableH = cmToPx(act.limitHeightCm);

                                    const cols = Math.floor(availableW / (batchW + gap));
                                    const rows = Math.floor(availableH / (batchH + gap));
                                    count = cols * rows;
                                }

                                // Generation Loop
                                for (let i = 0; i < count; i++) {
                                    if (newImages.length >= globalCreateLimit) break;

                                    // Line Wrapping (Shelf flow)
                                    if (currentX + batchW > docSettings.width - margin) {
                                        currentX = margin;
                                        currentY += rowMaxH + gap;
                                        rowMaxH = 0;
                                    }

                                    // Check Height Limit (if linear meter limit)
                                    if (act.limitHeightCm) {
                                        if (currentY + batchH > cmToPx(act.limitHeightCm) + margin) break;
                                    }

                                    // Create Item
                                    if (!isOriginalUsed) {
                                        // Move Original to first slot
                                        handleUpdateMany([{
                                            id: selImage.id,
                                            attrs: { x: currentX, y: currentY, scaleX, scaleY }
                                        }]);
                                        isOriginalUsed = true;
                                        // We don't add to newImages array because it's already in 'images' state
                                        // But we need to update our flow trackers
                                    } else {
                                        // Create Clone
                                        newImages.push({
                                            ...(selImage as ImageElement),
                                            id: generateId(),
                                            x: currentX,
                                            y: currentY,
                                            scaleX: scaleX,
                                            scaleY: scaleY,
                                            name: `${selImage.name}-copy-${newImages.length}`,
                                            srcRef: (selImage as ImageElement).srcRef || selImage.id
                                        });
                                    }

                                    // Update Flow Trackers
                                    rowMaxH = Math.max(rowMaxH, batchH);
                                    currentX += batchW + gap;
                                }
                            }

                            if (newImages.length > 0) {
                                setImages(prev => [...prev, ...newImages]);
                                saveToHistory([...images, ...newImages], null); // Note: images includes original (now moved)
                                finalResp += `Smart Layout criado: ${newImages.length + 1} itens organizados. `;
                            } else if (isOriginalUsed) {
                                finalResp += `Item redimensionado e posicionado. `;
                            }
                        }

                        if (act.action === 'grid' && selImage) {
                            // (Recuperando lógica original de grid aqui para garantir integridade)
                            const gap = act.gap || 10;
                            const margin = act.margin || 20;
                            const w = (selImage as any).width * selImage.scaleX;
                            const h = (selImage as any).height * selImage.scaleY;

                            // Lógica inteligente para "Meio Metro" (fill_area)
                            let availableH = docSettings.height - (margin * 2);
                            if (act.strategy === 'fill_area' && act.limitCm) {
                                availableH = cmToPx(act.limitCm); // Limita a altura do grid
                            }
                            const availableW = docSettings.width - (margin * 2);

                            let cols = Math.floor(availableW / (w + gap));
                            let rows = Math.floor(availableH / (h + gap));

                            if (act.strategy === 'fixed_count' && act.count) {
                                const side = Math.ceil(Math.sqrt(act.count));
                                cols = side;
                                rows = Math.ceil(act.count / side);
                            }
                            cols = Math.min(cols, 20);
                            rows = Math.min(rows, 20);
                            const copies: ImageElement[] = [];
                            let created = 0;
                            const totalTarget = act.strategy === 'fixed_count' ? act.count : (cols * rows);
                            const gridW = (cols * w) + ((cols - 1) * gap);
                            const gridH = (rows * h) + ((rows - 1) * gap);
                            const startX = (docSettings.width - gridW) / 2;
                            const startY = (docSettings.height - gridH) / 2;

                            for (let r = 0; r < rows; r++) {
                                for (let c = 0; c < cols; c++) {
                                    if (created >= totalTarget) break;
                                    copies.push({
                                        ...(selImage as ImageElement),
                                        id: generateId(),
                                        x: startX + (c * (w + gap)),
                                        y: startY + (r * (h + gap)),
                                        name: `${selImage.name}-copy-${created}`,
                                        srcRef: (selImage as ImageElement).srcRef || selImage.id
                                    });
                                    created++;
                                }
                            }
                            setImages(prev => [...prev, ...copies]);
                            saveToHistory([...images, ...copies], null);
                            finalResp += `Grid (${created} itens). `;
                        }

                        if (act.action === 'duplicate' && selImage) {
                            const count = act.count || 1;
                            for (let k = 0; k < count; k++) handleDuplicateAction();
                            finalResp += `Duplicado x${count}. `;
                        }

                        if (act.action === 'center' && selImage) {
                            const w = (selImage as any).width * selImage.scaleX;
                            const h = (selImage as any).height * selImage.scaleY;
                            const newX = (docSettings.width - w) / 2;
                            const newY = (docSettings.height - h) / 2;
                            handleUpdateMany([{ id: selImage.id, attrs: { x: newX, y: newY } }]);
                            finalResp += "Centralizado. ";
                        }

                        if (act.action === 'remove_background' && selImage) {
                            handleRemoveBackgroundAction();
                            finalResp += "Removendo fundo... ";
                        }

                        if (act.action === 'move' && selImage) {
                            const w = (selImage as any).width * selImage.scaleX;
                            const h = (selImage as any).height * selImage.scaleY;
                            let nx = selImage.x;
                            let ny = selImage.y;
                            const pad = 20;
                            if (act.position.includes('top')) ny = pad;
                            if (act.position.includes('bottom')) ny = docSettings.height - h - pad;
                            if (act.position.includes('left')) nx = pad;
                            if (act.position.includes('right')) nx = docSettings.width - w - pad;
                            if (act.position === 'center') {
                                nx = (docSettings.width - w) / 2;
                                ny = (docSettings.height - h) / 2;
                            }
                            handleUpdateMany([{ id: selImage.id, attrs: { x: nx, y: ny } }]);
                            finalResp += `Movido para ${act.position}. `;
                        }

                        if (act.action === 'resize' && selImage) {
                            let newScaleX = selImage.scaleX;
                            let newScaleY = selImage.scaleY;

                            if (act.widthCm) {
                                const targetPx = cmToPx(act.widthCm);
                                const currentPx = (selImage as any).width; // Base width
                                const factor = targetPx / currentPx;
                                newScaleX = factor;
                                newScaleY = factor; // Maintain aspect ratio
                            } else if (act.heightCm) {
                                const targetPx = cmToPx(act.heightCm);
                                const currentPx = (selImage as any).height;
                                const factor = targetPx / currentPx;
                                newScaleX = factor;
                                newScaleY = factor;
                            } else if (act.factor) {
                                newScaleX *= act.factor;
                                newScaleY *= act.factor;
                            } else if (act.targetWidth && act.targetHeight) {
                                newScaleX = act.targetWidth / (selImage as any).width;
                                newScaleY = act.targetHeight / (selImage as any).height;
                            }

                            handleUpdateMany([{ id: selImage.id, attrs: { scaleX: newScaleX, scaleY: newScaleY } }]);
                            finalResp += `Redimensionado para ${act.widthCm ? act.widthCm + 'cm' : 'novas medidas'}. `;
                        }
                    }
                } catch (e) {
                    console.warn("AI returned JSON but parsing failed, falling back to text", e);
                    finalResp = responseText;
                }
            }

            setAiResponse(finalResp);
            setAiHistory(prev => [...prev, { role: 'user', text: command }, { role: 'model', text: finalResp }]);
            showToast('Designer IA finalizou', 'success');
        } catch (e) {
            console.error(e);
            showToast('Erro ao processar comando IA', 'error');
            setAiResponse('Desculpe, não consegui realizar essa tarefa. Tente ser mais específico.');
        } finally {
            setAiThinking(false);
        }
        return 'Processado';
    };

    const openDocumentsList: OpenDocument[] = documents.map(d => ({
        id: d.id, name: d.settings.name || 'Sem título',
        width: d.settings.width, height: d.settings.height, dpi: d.settings.dpi,
        hasUnsavedChanges: d.hasUnsavedChanges
    }));

    if (!activeDocument && !showNewDocModal && documents.length === 0) {
        return (
            <div className="editor-view empty-state">
                <div className="empty-message">
                    <h2>Bem-vindo ao Editor Ultimate</h2>
                    <button className="btn-primary" onClick={() => setShowNewDocModal(true)}>Novo Documento</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`editor-view ${isDraggingOver ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDraggingOver(false); }}
            onDrop={e => {
                e.preventDefault(); setIsDraggingOver(false);
                Array.from(e.dataTransfer.files).forEach(f => handleAddImage(f));
            }}
        >
            {/* Autosave Indicator */}
            <div className={`autosave-indicator ${saveStatus}`}>
                {saveStatus === 'saving' && <><div className="spinner-mini" /> Salvando...</>}
                {saveStatus === 'saved' && <>✓ Salvo automaticamente</>}
            </div>

            <Toolbar
                activeTool={activeTool}
                onToolSelect={t => {
                    if (t === 'background-removal') {
                        if (!selectedId) {
                            showToast('Selecione uma imagem primeiro', 'info');
                            return;
                        }
                        setShowBackgroundRemoval(true);
                    } else if (t === 'upscale') {
                        if (!selectedId) {
                            showToast('Selecione uma imagem primeiro', 'info');
                            return;
                        }
                        showToast('Upscale em breve...', 'info');
                    } else {
                        setActiveTool(t as Tool);
                    }
                }}
                onExport={() => { }}
                canDelete={!!selectedId}
                onDelete={handleDeleteAction}
                canDuplicate={!!selectedId}
                onDuplicate={() => handleDuplicateAction()}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={activeDocument ? activeDocument.historyIndex > 0 : false}
                canRedo={activeDocument ? activeDocument.historyIndex < activeDocument.history.length - 1 : false}
                onNew={() => setShowNewDocModal(true)}
                canAlign={selectedIds.length >= 2}
                onAlign={handleAlign}
                canDistribute={selectedIds.length >= 3}
                onDistribute={handleDistribute}
            />

            <DocumentTabs
                documents={openDocumentsList} activeDocumentId={activeDocumentId}
                onSelectDocument={setActiveDocumentId}
                onCloseDocument={id => {
                    setDocuments(prev => prev.filter(d => d.id !== id));
                    if (id === activeDocumentId) setActiveDocumentId(null);
                }}
                onNewDocument={() => setShowNewDocModal(true)}
            />

            <div className="editor-content">
                <EditorSidebar
                    activeTool={activeTool} onToolSelect={t => setActiveTool(t as Tool)}
                    onAddImage={() => fileInputRef.current?.click()} onAddShape={() => { }} onAddText={() => { }}
                    onRemoveBackground={handleRemoveBackgroundAction}
                    onUpscale={() => {
                        if (!selectedId) {
                            showToast('Selecione uma imagem primeiro', 'info');
                            return;
                        }
                        showToast('Upscale em breve...', 'info');
                    }}
                    onAICreative={() => {
                        if (!selectedId) {
                            showToast('Selecione uma imagem primeiro', 'info');
                            return;
                        }
                        setShowAICreativePanel(true);
                    }}
                    libraryItems={libraryItems}
                    onUpdateLibrary={setLibraryItems}
                    onAddFromLibrary={(f, n) => handleAddImage(f, n)}
                />

                <div className="editor-workspace" ref={scrollContainerRef}>
                    {activeDocument && (
                        <KonvaCanvas
                            width={docSettings!.width}
                            height={docSettings!.height}
                            images={resolvedImages}
                            selectedId={selectedId}
                            currentSelectedIds={selectedIds}
                            onSelect={setSelectedId}
                            onSelectMultiple={setSelectedIds}
                            onTransform={(id, attrs) => handleUpdateMany([{ id, attrs }])}
                            backgroundColor={(docSettings?.backgroundColor || 'white') as string}
                            onDelete={handleDeleteAction}
                            onDuplicate={handleDuplicateAction}
                            onRemoveBackground={handleRemoveBackgroundAction}
                            onTrim={handleTrimAction}
                            onBringToFront={handleBringToFront}
                            onSendToBack={handleSendToBack}
                            availableFonts={[]} // Fix logic later if needed
                            scale={zoomScale}
                            onScaleChange={setZoomScale}
                            onDrop={(e) => {
                                e.preventDefault();
                                const files = Array.from(e.dataTransfer.files) as File[];
                                files.forEach(f => handleAddImage(f));
                            }}
                            onDragOver={(e) => e.preventDefault()}
                        />
                    )}

                    <ZoomControls
                        scale={zoomScale} onScaleChange={setZoomScale}
                        onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
                        onZoomFit={handleFitScreen} onZoomReset={handleResetZoom}
                    />

                    <MagicBar
                        onCommand={handleAICommand} history={aiHistory} isProcessing={aiThinking}
                        aiResponse={aiResponse} currentModel={currentModel} onModelChange={setCurrentModel}
                        hasSelection={!!selectedId} onPaintClick={() => setShowAICreativePanel(true)}
                        onInputChange={setCurrentAiPrompt} initialInput={currentAiPrompt}
                        onHistoryChange={setAiHistory}
                    />
                </div>

                <div className="right-panel">
                    <LayerPanel
                        images={resolvedImages as any} selectedId={selectedId} onSelect={setSelectedId}
                        onToggleVisibility={(id) => {
                            const img = images.find(i => i.id === id);
                            if (img) handleUpdateMany([{ id, attrs: { visible: !img.visible } }]);
                        }}
                        onToggleLock={(id) => {
                            const img = images.find(i => i.id === id);
                            if (img) handleUpdateMany([{ id, attrs: { locked: !img.locked } }]);
                        }}
                        onReorder={(newOrder) => setImages(newOrder)}
                        onDelete={handleDeleteAction}
                        onDuplicate={() => handleDuplicateAction()}
                        onRename={(id, newName) => handleUpdateMany([{ id, attrs: { name: newName } }])}
                    />
                </div>
            </div>

            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={e => {
                if (e.target.files?.[0]) handleAddImage(e.target.files[0]);
                e.target.value = '';
            }} />

            {showNewDocModal && (
                <NewDocumentModal
                    isOpen={showNewDocModal}
                    onClose={() => documents.length > 0 && setShowNewDocModal(false)}
                    onConfirm={handleCreateDocument}
                />
            )}

            {showBackgroundRemoval && selectedId && resolvedImages.find(i => i.id === selectedId) && (
                <BackgroundRemovalTool
                    imageSrc={(resolvedImages.find(i => i.id === selectedId) as ImageElement).src || ''}
                    onClose={() => setShowBackgroundRemoval(false)}
                    onApply={async (processedSrc) => {
                        // Salva referência do ID atual
                        const currentId = selectedId;
                        // Removed unused original variable


                        // Aplicar Trim Automático antes de substituir
                        showToast('Ajustando contornos...', 'info');
                        const result = await trimTransparentPixels(processedSrc);
                        const finalSrc = result ? result.src : processedSrc;

                        setImages(prev => {
                            const next = prev.map(img => {
                                if (img.id === currentId) {
                                    const i = img as ImageElement;
                                    const newX = result ? i.x + (result.x * i.scaleX) : i.x;
                                    const newY = result ? i.y + (result.y * i.scaleY) : i.y;
                                    const newW = result ? result.width : i.width;
                                    const newH = result ? result.height : i.height;

                                    // OTIMIZAÇÃO: Cache do novo resultado
                                    imageSourceCache.current.set(i.id, finalSrc);
                                    setCacheVersion(v => v + 1);

                                    return {
                                        ...i,
                                        src: '',
                                        srcRef: i.id,
                                        x: newX,
                                        y: newY,
                                        width: newW,
                                        height: newH,
                                        name: i.name ? `${i.name.split('.')[0]}-sem-fundo` : 'imagem-sem-fundo'
                                    };
                                }
                                return img;
                            });
                            saveToHistory(next, currentId);
                            return next;
                        });

                        setShowBackgroundRemoval(false);
                        showToast('Fundo removido e imagem ajustada', 'success');
                    }}
                />
            )}

            {showAICreativePanel && selectedId && resolvedImages.find(i => i.id === selectedId) && (
                <AICreativePanel
                    imageSrc={(resolvedImages.find(i => i.id === selectedId) as ImageElement).src || ''}
                    onCancel={() => setShowAICreativePanel(false)}
                    onAccept={(newSrc) => {
                        const currentId = selectedId;
                        setImages(prev => {
                            const next = prev.map(img => {
                                if (img.id === currentId) {
                                    return {
                                        ...img,
                                        src: newSrc,
                                        name: img.name ? `${img.name.split('.')[0]}-ai` : 'ia-gerada'
                                    };
                                }
                                return img;
                            });
                            saveToHistory(next, currentId);
                            return next;
                        });
                        setShowAICreativePanel(false);
                        showToast('Arte da IA aplicada com sucesso', 'success');
                    }}
                    onApply={async (params) => {
                        if (!kieAiApiKey) {
                            showToast('Configure a chave Kie AI nas configurações', 'error');
                            return null;
                        }
                        try {
                            const result = await window.electronAPI.kieAiProcess({
                                ...params,
                                imageBase64: (images.find(i => i.id === selectedId) as ImageElement).src || '',
                                apiKey: kieAiApiKey
                            });
                            if (result.success && result.imageBase64) {
                                return `data:image/png;base64,${result.imageBase64}`;
                            } else {
                                showToast(result.error || 'Erro na IA', 'error');
                                return null;
                            }
                        } catch (e) {
                            showToast('Erro ao processar IA', 'error');
                            return null;
                        }
                    }}
                />
            )}
        </div>
    );
};

export default EditorView;
