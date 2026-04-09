import React from 'react';
import { CheckCircle, Folder, ChevronRight, X } from 'lucide-react';
import './SuccessModal.css';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    successCount: number;
    totalCount: number;
    outputFolder: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    successCount,
    totalCount,
    outputFolder
}) => {
    if (!isOpen) return null;

    const handleOpenFolder = async () => {
        if (window.electronAPI && window.electronAPI.openFolder) {
            await window.electronAPI.openFolder(outputFolder);
        }
        onClose();
    };

    return (
        <div className="success-modal-overlay">
            <div className="success-modal-content">
                <button className="success-modal-close" onClick={onClose} aria-label="Fechar">
                    <X size={20} />
                </button>

                <div className="success-modal-header">
                    <div className="success-icon-container">
                        <CheckCircle className="success-icon" size={48} />
                    </div>
                    <h2>Processamento Concluído!</h2>
                    <p>
                        Processamos com sucesso <strong>{successCount}</strong> de {totalCount} {totalCount === 1 ? 'arquivo' : 'arquivos'}.
                    </p>
                </div>

                <div className="success-modal-body">
                    <div className="output-folder-info" title={outputFolder}>
                        <Folder size={18} className="folder-icon" />
                        <span className="folder-path">{outputFolder}</span>
                    </div>
                </div>

                <div className="success-modal-footer">
                    <button className="btn-ok" onClick={onClose}>
                        Entendido
                    </button>
                    <button className="btn-open-folder" onClick={handleOpenFolder}>
                        Abrir Pasta
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
