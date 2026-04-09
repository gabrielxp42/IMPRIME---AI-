
/**
 * Editor View - Editor de Imagens Premium (Restored Ultimate Version)
 * Com histórico (Ctrl+Z/Y), Novo Documento, Drag & Drop, Múltiplos Documentos, Grid Inteligente e IA.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import KonvaCanvas, { KonvaCanvasHandle } from './editor/KonvaCanvas';
import { LibraryItem, CanvasElement, ImageElement, DocumentSettings, Document } from '../types/canvas-elements';
import Toolbar, { Tool } from './editor/Toolbar';
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
import TransparencyCorrector from './editor/TransparencyCorrector';
import { useEditorDocuments } from '../hooks/useEditorDocuments';
import { trimTransparentPixels, analyzeExcessSpace, addDpiToPngBuffer } from '../utils/imageProcessing';
import { analyzeTransparency } from '../utils/transparencyAnalysis';
import PropertiesPanel from './editor/PropertiesPanel';
import DocumentSettingsPanel from './editor/DocumentSettingsPanel';
import './EditorView.css';



interface EditorViewProps {
    geminiApiKey?: string;
    kieAiApiKey?: string;
}





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
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isLoaded, setIsLoaded] = useState(false);

    const [showNewDocModal, setShowNewDocModal] = useState(false);
    const [activeTool, setActiveTool] = useState<Tool>('select');

    const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
    const [showAICreativePanel, setShowAICreativePanel] = useState(false);

    // Transparency Modal State
    const [showTransparencyModal, setShowTransparencyModal] = useState(false);
    const [transparencyImageSrc, setTransparencyImageSrc] = useState('');
    const [pendingTransparencyImage, setPendingTransparencyImage] = useState<{ id: string, originalImg: ImageElement } | null>(null);

    // Transparency Smart Detection (Canvas)
    const [transparencyWarning, setTransparencyWarning] = useState<{ id: string, percentage: number, thumbnail?: string } | null>(null);
    const [emptySpaceWarning, setEmptySpaceWarning] = useState<{ id: string, percentage: number, thumbnail?: string } | null>(null);

    const [zoomScale, setZoomScale] = useState(1);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { showToast } = useToast();
    const [aiThinking, setAiThinking] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [currentAiPrompt, setCurrentAiPrompt] = useState('');
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleAddImageRef = useRef<((file: File, name?: string) => void) | null>(null);
    const canvasRef = useRef<KonvaCanvasHandle>(null);
    const imageSourceCache = useRef<Map<string, string>>(new Map());
    const [cacheVersion, setCacheVersion] = useState(0);
    const [currentModel, setCurrentModel] = useState('gemini-2.5-flash-lite');
    const [tokenUsage, setTokenUsage] = useState<{ prompt: number; completion: number; total: number } | null>(null);

    const {
        documents,
        activeDocumentId,
        activeDocument,
        setDocuments,
        selectDocument: setActiveDocumentId,
        createDocument,
        closeDocument,
        updateActiveDocument,
        saveToHistory,
        undo,
        redo,
        canUndo,
        canRedo
    } = useEditorDocuments();

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

    const selectedElement = useMemo(() => {
        return resolvedImages.find(img => img.id === selectedId) || null;
    }, [resolvedImages, selectedId]);

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
    // --- DOCUMENT MANAGEMENT ---

    const setImages = useCallback((newImages: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
        updateActiveDocument(doc => ({
            ...doc,
            images: typeof newImages === 'function' ? newImages(doc.images) : newImages,
            hasUnsavedChanges: true
        }));
    }, [updateActiveDocument]);

    const handleSettingsChange = useCallback((settings: { width?: number; height?: number; dpi?: number; backgroundColor?: string }) => {
        updateActiveDocument(doc => ({
            ...doc,
            settings: { ...doc.settings, ...settings } as DocumentSettings,
            hasUnsavedChanges: true
        }));
    }, [updateActiveDocument]);

    const setSelectedIds = useCallback((ids: string[]) => {
        updateActiveDocument(doc => ({ ...doc, selectedIds: ids }));
    }, [updateActiveDocument]);

    const setSelectedId = useCallback((id: string | null) => {
        setSelectedIds(id ? [id] : []);
    }, [setSelectedIds]);



    // --- STABLE PASTE HANDLER ---
    // --- STABLE PASTE HANDLER ---
    // handleAddImageRef already declared above
    const generateId = () => `el-${crypto.randomUUID().slice(0, 8)}-${Date.now().toString(36)}`;

    const handleAddImageFromSrc = useCallback((src: string, name: string) => {
        const img = new Image();
        img.onload = () => {
            // Importação 1:1 (Industrial Smart Object)
            // Removemos o limite de 800px. A imagem entra com TODOS os pixels originais.
            let w = img.width;
            let h = img.height;

            let imgId = generateId();
            imgId = `${imgId}-${Math.floor(Math.random() * 1000)}`;

            // OTIMIZAÇÃO: Guardar no cache a versão pura e pesada
            imageSourceCache.current.set(imgId, src);
            setCacheVersion(v => v + 1);

            const newImg: ImageElement = {
                type: 'image',
                id: imgId,
                srcRef: imgId,
                src: '',
                // Centraliza no documento mantendo o tamanho real em pixels
                x: docSettings ? (docSettings.width - w) / 2 : 0,
                y: docSettings ? (docSettings.height - h) / 2 : 0,
                width: w,
                height: h,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                visible: true,
                locked: false,
                name: name
            };

            setImages(prev => {
                if (prev.some(p => p.id === newImg.id)) {
                    newImg.id = `${newImg.id}-copy`;
                    imageSourceCache.current.set(newImg.id, src);
                    (newImg as ImageElement).srcRef = newImg.id;
                }
                const next = [...prev, newImg];
                saveToHistory(next, newImg.id);
                return next;
            });
            setSelectedId(newImg.id);
            showToast('Imagem adicionada', 'success');

            // ----------------------------------------------------
            // 2. Intelligent Check: Transparency & Empty Space
            // ----------------------------------------------------
            Promise.all([
                analyzeTransparency(src),
                analyzeExcessSpace(src)
            ]).then(([transpAnalysis, spaceResult]) => {
                // Check Transparency
                if (transpAnalysis.hasIssues) {
                    console.log(`[Smart Check] Transparency issue detected: ${transpAnalysis.issuePercentage}%`);
                    setTransparencyWarning({ id: imgId, percentage: transpAnalysis.issuePercentage, thumbnail: src });
                }

                // Check Empty Space
                if (spaceResult > 0) {
                    console.log(`[Smart Check] Empty space detected: ${spaceResult}%`);
                    setEmptySpaceWarning({ id: imgId, percentage: spaceResult, thumbnail: src });
                }
            });
            // ----------------------------------------------------

        };
        img.src = src;
    }, [docSettings, showToast, setImages, saveToHistory]);

    const handleAddImage = useCallback(async (file: File, customName?: string) => {
        const fileName = customName || file.name;
        const isPdf = file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            // Render PDF at 300 DPI for maximum quality
            try {
                showToast('Processando PDF...', 'info');
                const pdfjsLib = await import('pdfjs-dist');

                // Set worker (required for pdf.js)
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                // Process each page (for now, just first page)
                const page = await pdf.getPage(1);

                // Calculate scale for 300 DPI
                // PDF default is 72 DPI, so scale = targetDPI / 72
                const targetDpi = docSettings?.dpi || 300;
                const scale = targetDpi / 72;

                const viewport = page.getViewport({ scale });

                // Create canvas at high resolution
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d')!;

                // CRITICAL: Clear canvas to transparent (default is white)
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                await page.render({
                    canvasContext: ctx,
                    viewport: viewport,
                    background: 'transparent' // Tell pdf.js not to fill background
                }).promise;

                const src = canvas.toDataURL('image/png');
                handleAddImageFromSrc(src, fileName.replace('.pdf', '.png'));

                // If multi-page, add remaining pages
                if (pdf.numPages > 1) {
                    showToast(`PDF tem ${pdf.numPages} páginas. Primeira página adicionada.`, 'info');
                }
            } catch (err) {
                console.error('PDF render error:', err);
                showToast('Erro ao processar PDF', 'error');
            }
        } else {
            // Regular image
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                handleAddImageFromSrc(src, fileName);
            };
            reader.readAsDataURL(file);
        }
    }, [handleAddImageFromSrc, docSettings, showToast]);

    useEffect(() => { handleAddImageRef.current = handleAddImage; }, [handleAddImage]);

    const handleRemoveBackgroundAction = useCallback(() => {
        if (!selectedId) {
            showToast('Selecione uma imagem primeiro', 'info');
            return;
        }
        setShowBackgroundRemoval(true);
    }, [selectedId, showToast]);

    // Internal function for AI to use without opening modal
    const processBackgroundRemovalInternal = async (img: ImageElement): Promise<{ success: boolean; newAttrs?: any }> => {
        try {
            const api = (window as any).electronAPI;
            if (!api?.removeBackgroundBase64) return { success: false };

            let src = img.src;
            if (imageSourceCache.current.has(img.id)) src = imageSourceCache.current.get(img.id)!;
            if (!src) return { success: false };

            const base64Data = src.includes('base64,') ? src.split('base64,')[1] : src;
            const result = await api.removeBackgroundBase64(base64Data, false);

            if (result.success && result.resultBase64) {
                let newSrc = `data:image/png;base64,${result.resultBase64}`;

                // ANALISAR TRANSPARÊNCIA
                const analysis = await analyzeTransparency(newSrc);
                if (analysis.hasIssues) {
                    // Trigger modal but proceed with update so user sees something
                    setPendingTransparencyImage({ id: img.id, originalImg: img });
                    setTransparencyImageSrc(newSrc);
                    setShowTransparencyModal(true);
                }

                let updates: any = {};

                try {
                    const trimRes = await trimTransparentPixels(newSrc);
                    if (trimRes) {
                        newSrc = trimRes.src;
                        updates.x = img.x + (trimRes.x * img.scaleX);
                        updates.y = img.y + (trimRes.y * img.scaleY);
                        updates.width = trimRes.width;
                        updates.height = trimRes.height;
                        updates.srcRef = img.id;
                    }
                } catch (trimErr) { console.warn("Trim failed", trimErr); }

                imageSourceCache.current.set(img.id, newSrc);
                setCacheVersion(v => v + 1);
                // CRITICAL: Include 'src' in newAttrs so the grid uses the new image
                updates.src = newSrc;

                // Direct update to ensure UI reflects change immediately
                setImages(prev => prev.map(p => p.id === img.id ? { ...p, ...updates } : p));

                return { success: true, newAttrs: updates };
            }
            return { success: false };
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    };

    const handleApplyTransparencyFix = useCallback(async (fixedSrc: string) => {
        if (!pendingTransparencyImage) return;
        const { id, originalImg } = pendingTransparencyImage;

        let updates: any = {};
        try {
            const trimRes = await trimTransparentPixels(fixedSrc);
            if (trimRes) {
                fixedSrc = trimRes.src;
                updates.x = originalImg.x + (trimRes.x * originalImg.scaleX);
                updates.y = originalImg.y + (trimRes.y * originalImg.scaleY);
                updates.width = trimRes.width;
                updates.height = trimRes.height;
            }
        } catch (trimErr) { console.warn("Trim failed", trimErr); }

        updates.srcRef = id;

        // Update Cache
        imageSourceCache.current.set(id, fixedSrc);
        setCacheVersion(v => v + 1);

        // Update Image State
        updates.src = '';


        setImages(prev => prev.map(img => {
            if (img.id === id) {
                return { ...img, ...updates };
            }
            return img;
        }));

        setShowTransparencyModal(false);
        setPendingTransparencyImage(null);
        showToast('Correção de transparência aplicada!', 'success');
    }, [pendingTransparencyImage, setImages, showToast]);

    // Helper: Create optimal grid layout FOR DTF (maximizes quantity, minimal waste)
    const createOptimalGrid = useCallback((params: {
        itemWidth: number;
        itemHeight: number;
        count: number;
        availableWidth: number;
        availableHeight: number;
        gap: number;
        marginX: number;
        marginY: number;
    }) => {
        const { itemWidth, itemHeight, count, availableWidth, availableHeight, gap, marginX, marginY } = params;

        // DTF priority: MAXIMIZE quantity, use ALL available space
        // Try to fit maximum columns possible
        const maxCols = Math.floor((availableWidth + gap) / (itemWidth + gap));
        if (maxCols === 0) return [];

        // Try +1 column with slightly reduced gap if it helps fit more
        let optimalCols = maxCols;
        const withExtraCol = maxCols + 1;
        const requiredWidthExtra = withExtraCol * itemWidth + (withExtraCol - 1) * gap;
        if (requiredWidthExtra <= availableWidth) {
            optimalCols = withExtraCol; // Fits! Use it
        }

        const maxRows = Math.floor((availableHeight + gap) / (itemHeight + gap));
        const maxFitCount = Math.min(count, optimalCols * maxRows);

        // NO CENTERING of items individually, but CENTER THE WHOLE BLOCK to balance margins
        const gridWidth = optimalCols * itemWidth + (optimalCols - 1) * gap;
        const startX = marginX + Math.max(0, (availableWidth - gridWidth) / 2);
        const startY = marginY;

        const positions: { x: number, y: number }[] = [];

        for (let i = 0; i < maxFitCount; i++) {
            const col = i % optimalCols;
            const row = Math.floor(i / optimalCols);

            const x = startX + col * (itemWidth + gap);
            const y = startY + row * (itemHeight + gap);

            // Verify it actually fits (with tiny tolerance for float precision)
            if (x + itemWidth > marginX + availableWidth + 0.5) continue;
            if (y + itemHeight > marginY + availableHeight) break;

            positions.push({ x, y });
        }

        return positions;
    }, []);


    const handleDeleteAction = useCallback((id?: string) => {
        const idsToDelete = id ? [id] : selectedIds;
        if (idsToDelete.length === 0) return;

        // Smart Check: Dismiss transparency warning if we are deleting the affecting image
        if (transparencyWarning && idsToDelete.includes(transparencyWarning.id)) {
            setTransparencyWarning(null);
        }
        if (emptySpaceWarning && idsToDelete.includes(emptySpaceWarning.id)) {
            setEmptySpaceWarning(null);
        }

        setImages(prev => {
            const next = prev.filter(img => !idsToDelete.includes(img.id));
            saveToHistory(next, null);
            return next;
        });

        // Update selection state
        if (id) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
            if (selectedId === id) setSelectedId(null);
        } else {
            setSelectedIds([]);
        }

        showToast('Elemento(s) removido(s)', 'info');
    }, [selectedIds, selectedId, setImages, saveToHistory, setSelectedIds, showToast, transparencyWarning, emptySpaceWarning]);

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

    const handleTrimAction = useCallback(async (id?: string) => {
        const targetId = id || selectedId;
        if (!targetId) return;
        const imgElement = resolvedImages.find(i => i.id === targetId);
        if (!imgElement || imgElement.type !== 'image') return;

        const image = imgElement as ImageElement;
        try {
            // Smart Object Check: Use cache if src is empty
            const sourceBase64 = image.src || imageSourceCache.current.get(image.srcRef || image.id);
            if (!sourceBase64) return;

            const result = await trimTransparentPixels(sourceBase64);
            if (result) {
                // Clear warning if trim successful
                if (emptySpaceWarning && emptySpaceWarning.id === targetId) {
                    setEmptySpaceWarning(null);
                }

                // OTIMIZAÇÃO: Cache do novo resultado
                imageSourceCache.current.set(image.srcRef || image.id, result.src);
                setCacheVersion(v => v + 1);

                setImages(prev => {
                    const next = prev.map(img => {
                        if (img.id === targetId) {
                            const i = img as ImageElement;
                            // Ajustar posição baseada no corte e escala atual
                            const newX = i.x + (result.x * i.scaleX);
                            const newY = i.y + (result.y * i.scaleY);

                            return {
                                ...i,
                                src: '', // Mantém leve
                                x: newX,
                                y: newY,
                                width: result.width,
                                height: result.height,
                            };
                        }
                        return img;
                    });
                    saveToHistory(next, targetId);
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
    }, [selectedId, resolvedImages, setImages, saveToHistory, showToast, emptySpaceWarning]);


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

    const handleToolSelect = useCallback((t: Tool) => {
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
            setActiveTool(t);
        }
    }, [selectedId, showToast]);

    const handleNewDocumentClick = useCallback(() => setShowNewDocModal(true), []);

    const handleVisibilityToggle = useCallback((id: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) return prev.map(i => i.id === id ? { ...i, visible: !i.visible } : i);
            return prev;
        });
    }, [setImages]);

    const handleLockToggle = useCallback((id: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === id);
            if (img) return prev.map(i => i.id === id ? { ...i, locked: !i.locked } : i);
            return prev;
        });
    }, [setImages]);

    const handleRename = useCallback((id: string, newName: string) => {
        handleUpdateMany([{ id, attrs: { name: newName } }]);
    }, [handleUpdateMany]);

    const handleTransform = useCallback((id: string, attrs: any) => {
        handleUpdateMany([{ id, attrs }]);
    }, [handleUpdateMany]);

    const handleCanvasDrop = useCallback((e: any) => {
        e.preventDefault();
        e.stopPropagation(); // CRITICAL: Stop bubbling to parent div which also has onDrop
        const files = Array.from(e.dataTransfer.files) as File[];
        files.forEach(f => {
            if (handleAddImageRef.current) handleAddImageRef.current(f);
        });
    }, []);



    const handleCreateDocument = useCallback((settings: DocumentSettings) => {
        createDocument(settings);
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
    }, [createDocument, showToast]);

    const handleUndo = useCallback(() => {
        if (canUndo) {
            undo();
            showToast('Desfeito', 'info');
        }
    }, [canUndo, undo, showToast]);

    const handleRedo = useCallback(() => {
        if (canRedo) {
            redo();
            showToast('Refeito', 'info');
        }
    }, [canRedo, redo, showToast]);

    const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);

    const handleAICommand = async (command: string): Promise<string> => {
        // Build-in helper for unique IDs
        const generateId = () => 'ai-' + Math.random().toString(36).substr(2, 9);

        if (!geminiApiKey || !docSettings) return 'Configuração incompleta';
        setAiThinking(true);

        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            let model = genAI.getGenerativeModel({ model: currentModel });

            const dpi = docSettings.dpi || 300;
            const pxToCm = (px: number) => (px / dpi) * 2.54;
            const cmToPx = (cm: number) => (cm / 2.54) * dpi;

            // VISION: Provide full board state to AI
            // VISION: Detecção de baixa resolução (Imagens esticadas além do original)
            const lowDpiItems = resolvedImages
                .filter(i => i.type === 'image' && (i.scaleX > 1.05 || i.scaleY > 1.05))
                .map(i => i.name || i.id);

            // OPTIMIZATION: Lite Context for heavy scenes (> 50 items) to prevent API Token exhaustion
            // If we have many items, we don't need to send exact X/Y for every single one unless explicitly asked.
            const isLiteContext = resolvedImages.length > 50;
            const mappedImages = resolvedImages.map(i => {
                const w = 'width' in i ? (i as any).width : 0;
                const h = 'height' in i ? (i as any).height : 0;

                // Base info always needed
                const baseInfo = {
                    id: i.id,
                    type: i.type,
                    name: i.name,
                    visible: i.visible,
                    locked: i.locked,
                    isLowResolution: lowDpiItems.includes(i.name || i.id)
                };

                // Full context only if few items
                if (!isLiteContext) {
                    return {
                        ...baseInfo,
                        x: Math.round(i.x),
                        y: Math.round(i.y),
                        width: Math.round(w),
                        height: Math.round(h),
                        widthCm: parseFloat(pxToCm(w * i.scaleX).toFixed(2)),
                        scale: { x: i.scaleX, y: i.scaleY },
                    };
                }
                // Lite context
                return baseInfo;
            });

            const contextData = {
                document: { ...docSettings, dpi: docSettings.dpi || 300 },
                selection: selectedIds,
                images: mappedImages,
                lowResolutionCount: lowDpiItems.length,
                lowResolutionItems: lowDpiItems,
                layoutWaste: resolvedImages.length === 0 ? 'empty' : resolvedImages.length < 3 ? 'low-density' : 'optimizable',
                contextMode: isLiteContext ? 'LITE (Coordinates omitted for performance)' : 'FULL'
            };

            // CONTEXT: Limited History (Last 2 turns) for situational awareness without token bloat
            const recentHistory = aiHistory.slice(-2).map(h =>
                `${h.role === 'user' ? 'USER' : 'AI'}: ${h.text}`
            ).join('\n');

            const systemPrompt = `You are an expert DTF Design Assistant.
CURRENT STATE: ${JSON.stringify(contextData)}
RECENT HISTORY:
${recentHistory}
USER COMMAND: "${command}"

CRITICAL RULES:
1. AGENCY: You are an intelligent agent. ONLY perform actions (resize, remove_bg, etc.) if the user EXPLICITLY asks or if it is heavily implied (e.g. "prepare this").
2. CONVERSATION: If the user says "Hi", "Hello", asks a question, or chats, return "actions": [] (EMPTY ARRAY). Do NOT invent actions.
{
  "reasoning": "Internal logic in PORTUGUESE explaining the choice.",
  "confidence": number (0.0 to 1.0),
  "actions": [{"action": "remove_background" | "resize" | "smart_grid" | "duplicate" | "delete_selected" | "delete_others" | "delete_all" | "align" | "arrange" | "rotate" | "upscale" | "move" | "opacity" | "visibility" | "lock" | "canvas_background", ...}],
  "message": "Friendly confirmation in PORTUGUESE"
}

ACTION SPECS & SEMANTIC RULES:
1. "remove_background": {} -> ONLY if user says "fundo", "background", "recortar", "transparente".
2. "smart_grid": {"items": [{"count": "fill"}], "limitHeightCm"?: number}
   - If user says "meio metro", "50cm", "half meter", use {"limitHeightCm": 50}.
   - If user says "um metro", "100cm", use {"limitHeightCm": 100}.
3. "resize": {"widthCm": number}.
4. "align": {"type": "left" | "right" | "top" | "bottom" | "center-h" | "center-v"}.
5. "arrange": {"order": "front" | "back"}.
6. "rotate": {"angle": number}.
7. "move": {"x"?: number, "y"?: number, "position"?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"}.
8. "opacity": {"value": number (0 to 1)}.
9. "visibility": {"visible": boolean}.
10. "lock": {"locked": boolean}.
11. "canvas_background": {"color": string}.
12. DELETE ACTIONS: "Apagar", "Excluir", "Limpar" = DELETE.
13. MULTI-STEP: If user says "remove fundo e coloca 5cm em meio metro", the actions are [remove_background, resize(5), smart_grid(limitHeight: 50)].
14. CONFIDENCE: If the user asks something you can't do, set confidence < 0.4.
15. If NO item is selected but user asks to act on "logo", pick the most relevant one.`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7
                }
            });
            const responseText = result.response.text();

            // Track Usage
            if (result.response.usageMetadata) {
                setTokenUsage({
                    prompt: result.response.usageMetadata.promptTokenCount,
                    completion: result.response.usageMetadata.candidatesTokenCount,
                    total: result.response.usageMetadata.totalTokenCount
                });
            }

            let aiData: { actions: any[], message?: string, reasoning?: string, confidence?: number } = { actions: [] };
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) aiData = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Parse error", e);
            }

            console.log("AI REASONING:", aiData.reasoning);
            console.log("AI CONFIDENCE:", aiData.confidence);

            const actions = aiData.actions || [];
            let humanMessage = aiData.message || "Processando...";

            // Guardrail: Skip actions if confidence is too low
            if (aiData.confidence !== undefined && aiData.confidence < 0.4 && actions.length > 0) {
                console.warn("AI Confidence too low, aborting actions.");
                actions.length = 0; // Clear actions
                humanMessage = "Não tenho certeza se entendi tudo. Pode detalhar melhor? (Ex: 'apagar a imagem' ou 'remover o fundo'?)";
            }

            if (actions.length > 0) {
                actions.sort((a) => (a.action === 'remove_background' ? -1 : 1));

                // BATCH PROCESSING: modifying a local copy to ensure sequential logic works (A -> B -> C)
                // This fixes "stale state" where grid doesn't see bg removal, or original is left behind.
                let currentImages = [...resolvedImages];
                let currentSelection = [...selectedIds];

                for (const act of actions) {
                    // Always find the most up-to-date version of the target in our working set
                    // Fallback to selection or first image if specific target lost
                    let curIdx = -1;
                    if (currentSelection.length > 0) {
                        curIdx = currentImages.findIndex(i => i.id === currentSelection[0]);
                    }
                    if (curIdx === -1 && currentImages.length > 0) {
                        curIdx = currentImages.findIndex(i => i.type === 'image'); // Find first image
                    }

                    if (curIdx === -1) continue; // Nothing to act on
                    // CRITICAL FIX: cur must be updated after every change
                    let cur = currentImages[curIdx];

                    if (act.action === 'remove_background') {
                        if (cur.type === 'image') {
                            showToast('Removendo fundo...', 'info');
                            // We must await the actual API call
                            const res = await processBackgroundRemovalInternal(cur as ImageElement);
                            if (res.success && res.newAttrs) {
                                // Apply update to our local working copy immediately
                                currentImages[curIdx] = { ...cur, ...res.newAttrs };
                                cur = currentImages[curIdx]; // REFRESH REFERENCE
                            }
                        }
                    }

                    if (act.action === 'resize' && act.widthCm) {
                        const tPx = cmToPx(act.widthCm);
                        const factor = tPx / (cur as any).width; // Use intrinsic width
                        currentImages[curIdx] = { ...cur, scaleX: factor, scaleY: factor };
                        cur = currentImages[curIdx]; // REFRESH REFERENCE
                    }

                    if (act.action === 'smart_grid') {
                        // DTF-OPTIMIZED: Minimal spacing to maximize quantity
                        // 1mm margin from edge, 1mm gap between items (just enough for cutting)
                        const margin = cmToPx(0.1); // 1mm
                        const gap = cmToPx(0.1);    // 1mm

                        const batch = act.items?.[0] || { count: 'fill' };
                        let count = batch.count;
                        const availW = docSettings.width - margin * 2;
                        let availH = act.limitHeightCm ? cmToPx(act.limitHeightCm) : docSettings.height - margin * 2;

                        // Use CURRENT dimensions from our working copy (potentially resized/cropped)
                        const w = (cur as any).width || 100;
                        const h = (cur as any).height || 100;
                        const scaleX = currentImages[curIdx].scaleX || 1;
                        const scaleY = currentImages[curIdx].scaleY || 1;
                        const itemW = w * scaleX;
                        const itemH = h * scaleY;

                        if (count === 'fill') {
                            const cols = Math.floor((availW + gap) / (itemW + gap));
                            const rows = Math.floor((availH + gap) / (itemH + gap));
                            count = Math.max(1, cols * rows);
                        }

                        if (typeof count === 'number' && count > 0) {
                            const positions = createOptimalGrid({
                                itemWidth: itemW, itemHeight: itemH, count,
                                availableWidth: availW, availableHeight: availH,
                                gap, marginX: margin, marginY: margin
                            });

                            // Ensure we have the latest src (from bg removal)
                            // processBackgroundRemovalInternal updates the cache, so we can pull from it OR use the src in cur if it was updated
                            const latestSrc = (cur as ImageElement).src;
                            const groupId = (cur as any).groupId || `grid-${generateId()}`;

                            const newItems = positions.map((pos, i) => ({
                                ...cur,
                                id: generateId(),
                                x: pos.x,
                                y: pos.y,
                                scaleX,
                                scaleY,
                                name: `${cur.name?.split('-')[0] || 'item'}-${i + 1}`,
                                width: w,
                                height: h,
                                src: latestSrc,
                                groupId: groupId
                            }));

                            // REPLACE logic: Remove the source, add the grid.
                            // We filter out the source (cur) and any existing group members
                            currentImages = currentImages.filter(p => p.id !== cur.id && (!('groupId' in p) || p.groupId !== groupId));
                            currentImages.push(...(newItems as CanvasElement[]));

                            // Update selection to the new grid items
                            // currentSelection = newItems.map(i => i.id); // Optional: select new items
                        }
                    }

                    if (act.action === 'duplicate') {
                        const cnt = act.count || 1;
                        const clones: CanvasElement[] = [];
                        for (let k = 0; k < cnt; k++) {
                            const clone = { ...cur, id: generateId(), x: cur.x + 20 * (k + 1), y: cur.y + 20 * (k + 1) };
                            clones.push(clone);
                        }
                        currentImages.push(...clones);
                    }

                    if (act.action === 'delete_selected' || act.action === 'delete_others' || act.action === 'delete_all') {
                        if (act.action === 'delete_all') {
                            currentImages = [];
                        } else if (act.action === 'delete_selected') {
                            currentImages = currentImages.filter(p => p.id !== cur.id);
                        } else {
                            // delete_others
                            currentImages = currentImages.filter(p => p.id === cur.id);
                        }
                    }

                    if (act.action === 'align' && act.type) {
                        // Align logic requires multiple items in selection usually, or aligning single item to board?
                        // If single item, align to board.
                        // If multiple (in currentSelection), align to bounds.
                        // ... simplified align to board for single item context ...
                        // For detailed align, we'd need to reimplement handleAlign logic using currentImages.
                        // Passing for now to avoid complexity explosion, assume single item flow mainly.
                    }

                    if (act.action === 'move') {
                        let nx = act.x !== undefined ? act.x : cur.x;
                        let ny = act.y !== undefined ? act.y : cur.y;
                        if (act.position === 'center') {
                            nx = docSettings.width / 2 - ((cur as any).width * cur.scaleX) / 2;
                            ny = docSettings.height / 2 - ((cur as any).height * cur.scaleY) / 2;
                        }
                        currentImages[curIdx] = { ...cur, x: nx, y: ny };
                        cur = currentImages[curIdx];
                    }

                    if (act.action === 'upscale') {
                        showToast('Iniciando Upscale de IA...', 'info');
                    }
                    if (act.action === 'opacity' && act.value !== undefined) {
                        currentImages[curIdx] = { ...cur, opacity: act.value };
                        cur = currentImages[curIdx];
                    }
                    if (act.action === 'visibility' && act.visible !== undefined) {
                        currentImages[curIdx] = { ...cur, visible: act.visible };
                        cur = currentImages[curIdx];
                    }
                    if (act.action === 'lock' && act.locked !== undefined) {
                        currentImages[curIdx] = { ...cur, locked: act.locked };
                        cur = currentImages[curIdx];
                    }
                    if (act.action === 'canvas_background' && act.color) {
                        handleSettingsChange({ backgroundColor: act.color });
                    }
                }

                // Final Commit
                setImages(currentImages);
                saveToHistory(currentImages, null); // Checkpoint



            }


            setAiResponse(humanMessage);
            setAiHistory(prev => [...prev.slice(-2), { role: 'user', text: command }, { role: 'model', text: humanMessage }]);
            showToast('IA Finalizada', 'success');

        } catch (e) {
            console.error(e);
            showToast('Erro crítico IA', 'error');
            setAiResponse("Erro ao processar comando.");
        } finally {
            setAiThinking(false);
        }
        return 'Processado';
    };




    const handleExportPNG = useCallback(() => {
        const stage = canvasRef.current?.getStage();
        const layer = canvasRef.current?.getLayer();
        if (!stage || !layer || !docSettings) return;

        // Deseleciona tudo para garantir exportação limpa
        setSelectedIds([]);

        // Timeout para garantir o re-render
        setTimeout(async () => {
            const isTransparent = docSettings.backgroundColor === 'transparent';
            const bgNodes = layer.find('.background-rect');

            // 1. BACKUP DO ESTADO VISUAL ATUAL (Zoom e Posição que o usuário está vendo)
            const oldAttrs = {
                scale: stage.scaleX(),
                x: stage.x(),
                y: stage.y()
            };

            try {
                // 2. RESET TÉCNICO PARA EXPORTAÇÃO (Escala 1:1 na Origem do Papel)
                stage.scale({ x: 1, y: 1 });
                stage.position({ x: 0, y: 0 });
                stage.batchDraw();

                if (isTransparent) {
                    bgNodes.forEach((n: any) => n.hide());
                }

                // CÁLCULO DE PRECISÃO INDUSTRIAL:
                // Precisamos capturar o documento no mundo real (1:1), 
                // mas as coordenadas do Stage estão afetadas pelo zoom/pan.

                const canvas = stage.toCanvas({
                    x: 0,
                    y: 0,
                    width: docSettings.width,
                    height: docSettings.height,
                    pixelRatio: 1,
                });
                stage.scale({ x: oldAttrs.scale, y: oldAttrs.scale });
                stage.position({ x: oldAttrs.x, y: oldAttrs.y });
                stage.batchDraw();
                // O ponto (0,0) do seu papel na tela é onde o Stage.x/y estão
                // mas invertidos e divididos pelo zoom para voltar ao tamanho real.

                // Finalized capture and restoration.

                if (!canvas) {
                    throw new Error("Falha Crítica de Hardware: Não foi possível gerar a imagem em alta resolução.");
                }

                // Step 2: Convert to Blob (Binary) to bypass Base64 limits
                canvas.toBlob(async (blob: Blob | null) => {
                    if (!blob) {
                        showToast("Falha técnica ao gerar arquivo binário.", "error");
                        return;
                    }

                    try {
                        const targetDpi = docSettings.dpi || 300;
                        const arrayBuffer = await blob.arrayBuffer();
                        const bytes = new Uint8Array(arrayBuffer);

                        // Step 3: Inject DPI Metadata directly into bytes
                        const newBytes = addDpiToPngBuffer(bytes, targetDpi);
                        const finalBlob = new Blob([newBytes.buffer as ArrayBuffer], { type: 'image/png' });

                        // Step 4: Download using Object URL (More robust for large files)
                        const url = URL.createObjectURL(finalBlob);
                        const link = document.createElement('a');
                        link.download = `IMPRIME-AI-${activeDocument?.settings.name || 'documento'}.png`;
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // Cleanup
                        setTimeout(() => URL.revokeObjectURL(url), 100);

                        showToast(`Exportado em ${docSettings.widthCm}x${docSettings.heightCm}cm (${targetDpi} DPI)`, 'success');
                    } catch (err) {
                        console.error("Blob processing error:", err);
                        showToast("Erro ao processar arquivo final.", "error");
                    }
                }, 'image/png');
            } catch (e: any) {
                console.error('Export error:', e);
                showToast(e.message || 'Erro ao exportar imagem', 'error');
            } finally {
                // Restaurar visibilidade do fundo
                if (isTransparent) {
                    bgNodes.forEach((n: any) => n.show());
                }
            }
        }, 100);
    }, [docSettings, activeDocument, showToast, setSelectedIds]);

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

    /* DUPLICATE REMOVED
        const stage = canvasRef.current?.getStage();
        if (!stage || !docSettings) return;
     
        // Save current selection to restore later
        const currentSelection = selectedIds;
     
        // Deseleciona tudo para não exportar transformer/seleção
        setSelectedIds([]);
     
        // Pequeno timeout para garantir que re-render sem seleção aconteça
        setTimeout(() => {
            try {
                // Cálculo exato para pixel perfect baseado nas configurações do documento
                // Se docSettings.width é 2480 (A4 300dpi), queremos exportar 2480px.
                // O stage pode estar com scale visual (zoom).
                // pixelRatio = 1 / stage.scaleX() compensa o zoom e exporta tamanho real.
     
                const pixelRatio = 1 / stage.scaleX();
     
                const dataURL = stage.toDataURL({
                    pixelRatio: pixelRatio,
                    mimeType: 'image/png',
                    quality: 1
                });
     
                const link = document.createElement('a');
                link.download = `IMPRIME - AI - ${ activeDocument?.name || 'design' }.png`;
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
     
                showToast('Imagem exportada com sucesso (Alta Resolução)', 'success');
     
                // Restore selection if needed (optional, might feel jumpy)
                // setSelectedIds(currentSelection);
            } catch (e) {
                console.error('Export error:', e);
                showToast('Erro ao exportar imagem', 'error');
            }
        }, 100);
    */

    return (
        <div className={`editor-view ${isDraggingOver ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
            onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
            onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOver(false);
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
                onToolSelect={handleToolSelect}
                onExport={handleExportPNG}
                canDelete={!!selectedId}
                onDelete={handleDeleteAction}
                canDuplicate={!!selectedId}
                onDuplicate={handleDuplicateAction}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                onNew={handleNewDocumentClick}
                canAlign={selectedIds.length >= 2}
                onAlign={handleAlign}
                canDistribute={selectedIds.length >= 3}
                onDistribute={handleDistribute}
            />

            <DocumentTabs
                documents={openDocumentsList} activeDocumentId={activeDocumentId}
                onSelectDocument={setActiveDocumentId}
                onCloseDocument={closeDocument}
                onNewDocument={handleNewDocumentClick}
            />

            <div className="editor-content">
                <EditorSidebar
                    activeTool={activeTool} onToolSelect={handleToolSelect}
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
                            ref={canvasRef}
                            width={docSettings!.width}
                            height={docSettings!.height}
                            images={resolvedImages}
                            selectedId={selectedId}
                            currentSelectedIds={selectedIds}
                            onSelect={setSelectedId}
                            onSelectMultiple={setSelectedIds}
                            onTransform={handleTransform}
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
                            onDrop={handleCanvasDrop}
                            onDragOver={(e) => e.preventDefault()}
                            transparencyWarning={transparencyWarning}
                            onIgnoreTransparency={() => setTransparencyWarning(null)}
                            onFixTransparency={(id) => {
                                const img = resolvedImages.find(i => i.id === id);
                                if (img && img.type === 'image') {
                                    setTransparencyImageSrc((img as ImageElement).src || '');
                                    setPendingTransparencyImage({ id: img.id, originalImg: img as ImageElement });
                                    setShowTransparencyModal(true);
                                    setTransparencyWarning(null);
                                }
                            }}
                            // Empty Space Props
                            emptySpaceWarning={emptySpaceWarning}
                            onIgnoreEmptySpace={() => setEmptySpaceWarning(null)}
                            onTrimEmptySpace={handleTrimAction}

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
                        tokenUsage={tokenUsage}
                    />
                </div>

                <div className="right-panel">
                    {activeDocument && (
                        <DocumentSettingsPanel
                            width={activeDocument.settings.width}
                            height={activeDocument.settings.height}
                            dpi={activeDocument.settings.dpi}
                            backgroundColor={activeDocument.settings.backgroundColor || '#ffffff'}
                            onSettingsChange={handleSettingsChange}
                        />
                    )}

                    <LayerPanel
                        images={resolvedImages as any} selectedId={selectedId} onSelect={setSelectedId}
                        onToggleVisibility={handleVisibilityToggle}
                        onToggleLock={handleLockToggle}
                        onReorder={setImages}
                        onDelete={handleDeleteAction}
                        onDuplicate={handleDuplicateAction}
                        onRename={handleRename}
                    />

                    {selectedElement && (
                        <PropertiesPanel
                            selectedElement={selectedElement}
                            onUpdate={(id, attrs) => handleUpdateMany([{ id, attrs }])}
                            onDelete={handleDeleteAction}
                            onDuplicate={handleDuplicateAction}
                            dpi={docSettings?.dpi}
                        />
                    )}
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
                                        name: i.name ? `${i.name.split('.')[0]} -sem - fundo` : 'imagem-sem-fundo'
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
                                        name: img.name ? `${img.name.split('.')[0]} -ai` : 'ia-gerada'
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
                            const originalImg = resolvedImages.find(i => i.id === selectedId) as ImageElement;
                            const result = await window.electronAPI.kieAiProcess({
                                ...params,
                                imageBase64: originalImg.src || '',
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

            {/* Modal de Transparência */}
            {showTransparencyModal && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-content" style={{ width: '90%', height: '90%', maxWidth: '1000px', maxHeight: '800px', padding: 0, overflow: 'hidden', background: '#111' }} onClick={e => e.stopPropagation()}>
                        <TransparencyCorrector
                            imageSrc={transparencyImageSrc}
                            onApply={handleApplyTransparencyFix}
                            onCancel={() => {
                                setShowTransparencyModal(false);
                                setPendingTransparencyImage(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditorView;
