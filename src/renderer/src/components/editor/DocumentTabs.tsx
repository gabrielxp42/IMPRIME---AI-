/**
 * DocumentTabs - Barra de navegação entre documentos abertos
 * Com acessibilidade completa (ARIA)
 */

import React from 'react';
import { Plus, FileText, X } from 'lucide-react';
import './DocumentTabs.css';

export interface OpenDocument {
    id: string;
    name?: string;
    width: number;
    height: number;
    dpi: number;
    hasUnsavedChanges: boolean;
}

interface DocumentTabsProps {
    documents: OpenDocument[];
    activeDocumentId: string | null;
    onSelectDocument: (id: string) => void;
    onCloseDocument: (id: string) => void;
    onNewDocument: () => void;
}

const DocumentTabs: React.FC<DocumentTabsProps> = ({
    documents,
    activeDocumentId,
    onSelectDocument,
    onCloseDocument,
    onNewDocument,
}) => {
    const handleClose = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onCloseDocument(id);
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectDocument(id);
        }
        if (e.key === 'Delete' || (e.key === 'w' && (e.ctrlKey || e.metaKey))) {
            e.preventDefault();
            onCloseDocument(id);
        }
    };

    return (
        <div className="document-tabs" role="tablist" aria-label="Documentos abertos">
            <div className="tabs-container">
                {documents.map((doc, index) => (
                    <div
                        key={doc.id}
                        className={`document-tab ${activeDocumentId === doc.id ? 'active' : ''}`}
                        onClick={() => onSelectDocument(doc.id)}
                        onKeyDown={(e) => handleKeyDown(e, doc.id)}
                        title={`${doc.name} - ${doc.width}×${doc.height}px @ ${doc.dpi}DPI`}
                        role="tab"
                        aria-selected={activeDocumentId === doc.id}
                        aria-controls={`panel-${doc.id}`}
                        tabIndex={activeDocumentId === doc.id ? 0 : -1}
                    >
                        <span className="tab-icon" aria-hidden="true">
                            <FileText size={14} />
                        </span>
                        <span className="tab-name">
                            {doc.hasUnsavedChanges && (
                                <span className="unsaved-dot" aria-label="Alterações não salvas">●</span>
                            )}
                            {doc.name}
                        </span>
                        <span className="tab-dimensions" aria-label={`${doc.width} por ${doc.height} pixels`}>
                            {doc.width}×{doc.height}
                        </span>
                        <button
                            className="tab-close"
                            onClick={(e) => handleClose(e, doc.id)}
                            title="Fechar documento (Ctrl+W)"
                            aria-label={`Fechar ${doc.name}`}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                className="new-tab-btn"
                onClick={onNewDocument}
                title="Novo Documento (Ctrl+N)"
                aria-label="Criar novo documento"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};

export default DocumentTabs;
