import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentSettings, CanvasElement, HistoryState } from '../types/canvas-elements';

const MAX_HISTORY = 50;

export const useEditorDocuments = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

    const activeDocument = documents.find(d => d.id === activeDocumentId) || null;

    const createDocument = useCallback((settings: DocumentSettings) => {
        const newDoc: Document = {
            id: uuidv4(),
            settings,
            images: [],
            selectedIds: [],
            history: [{ images: [], selectedId: null, selectedIds: [] }],
            historyIndex: 0,
            hasUnsavedChanges: false
        };
        setDocuments(prev => [...prev, newDoc]);
        setActiveDocumentId(newDoc.id);
        return newDoc.id;
    }, []);

    const closeDocument = useCallback((id: string) => {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (id === activeDocumentId) {
            setActiveDocumentId(null);
        }
    }, [activeDocumentId]);

    const updateActiveDocument = useCallback((updateFn: (doc: Document) => Document) => {
        if (!activeDocumentId) return;
        setDocuments(prev => prev.map(doc => doc.id === activeDocumentId ? updateFn(doc) : doc));
    }, [activeDocumentId]);

    const saveToHistory = useCallback((newImages: CanvasElement[], newSelectedId: string | null, newSelectedIds?: string[]) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== activeDocumentId) return doc;

            // SMART SHALLOW CLONE STRATEGY
            // We rely on newImages already being a new array reference (from setImages immutability)
            // But for history safety, we ensure the history entry holds a snapshot.

            const newState: HistoryState = {
                images: newImages, // Expecting newImages to be a fresh array
                selectedId: newSelectedId,
                selectedIds: newSelectedIds || (newSelectedId ? [newSelectedId] : [])
            };

            const newHistory = doc.history.slice(0, doc.historyIndex + 1);
            newHistory.push(newState);
            if (newHistory.length > MAX_HISTORY) {
                newHistory.shift();
            }

            return {
                ...doc,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                hasUnsavedChanges: true
            };
        }));
    }, [activeDocumentId]);

    const undo = useCallback(() => {
        updateActiveDocument(doc => {
            if (doc.historyIndex > 0) {
                const newIndex = doc.historyIndex - 1;
                const prevState = doc.history[newIndex];
                return {
                    ...doc,
                    historyIndex: newIndex,
                    images: prevState.images,
                    selectedIds: prevState.selectedIds || [],
                    activeLayerId: prevState.selectedId // Sync selection? EditorView sets selectedIds derived from doc state usually
                };
            }
            return doc;
        });
    }, [updateActiveDocument]);

    const redo = useCallback(() => {
        updateActiveDocument(doc => {
            if (doc.historyIndex < doc.history.length - 1) {
                const newIndex = doc.historyIndex + 1;
                const nextState = doc.history[newIndex];
                return {
                    ...doc,
                    historyIndex: newIndex,
                    images: nextState.images,
                    selectedIds: nextState.selectedIds || [],
                    activeLayerId: nextState.selectedId
                };
            }
            return doc;
        });
    }, [updateActiveDocument]);

    const canUndo = activeDocument ? activeDocument.historyIndex > 0 : false;
    const canRedo = activeDocument ? activeDocument.historyIndex < activeDocument.history.length - 1 : false;

    return {
        documents,
        activeDocumentId,
        activeDocument,
        setDocuments, // Expose for complex operations if needed, but try to use helpers
        selectDocument: setActiveDocumentId,
        createDocument,
        closeDocument,
        updateActiveDocument,
        saveToHistory,
        undo,
        redo,
        canUndo,
        canRedo
    };
};
