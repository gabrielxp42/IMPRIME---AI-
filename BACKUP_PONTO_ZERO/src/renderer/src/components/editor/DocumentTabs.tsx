/**
 * DocumentTabs - Barra de navegação entre documentos abertos
 * Similar ao Photoshop
 */

import React from 'react';
import './DocumentTabs.css';

export interface OpenDocument {
    id: string;
    name: string;
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

    return (
        <div className="document-tabs">
            <div className="tabs-container">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className={`document-tab ${activeDocumentId === doc.id ? 'active' : ''}`}
                        onClick={() => onSelectDocument(doc.id)}
                        title={`${doc.name} - ${doc.width}×${doc.height}px @ ${doc.dpi}DPI`}
                    >
                        <span className="tab-icon">📄</span>
                        <span className="tab-name">
                            {doc.hasUnsavedChanges && <span className="unsaved-dot">●</span>}
                            {doc.name}
                        </span>
                        <span className="tab-dimensions">
                            {doc.width}×{doc.height}
                        </span>
                        <button
                            className="tab-close"
                            onClick={(e) => handleClose(e, doc.id)}
                            title="Fechar documento"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            <button
                className="new-tab-btn"
                onClick={onNewDocument}
                title="Novo Documento (Ctrl+N)"
            >
                <span>+</span>
            </button>
        </div>
    );
};

export default DocumentTabs;
