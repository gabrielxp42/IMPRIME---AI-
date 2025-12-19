/**
 * ConfirmDialog - Modal de Confirmação Premium
 * Para ações destrutivas com UX fluida
 */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X, Trash2, Check } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    // Focus trap e keyboard handling
    useEffect(() => {
        if (!isOpen) return;

        // Focus no primeiro botão quando abre
        confirmBtnRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
            if (e.key === 'Enter') {
                onConfirm();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onCancel]);

    // Click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <Trash2 size={24} />;
            case 'warning':
                return <AlertTriangle size={24} />;
            default:
                return <Check size={24} />;
        }
    };

    return (
        <div
            className="confirm-dialog-overlay"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
        >
            <div className={`confirm-dialog ${variant}`} ref={dialogRef}>
                <button
                    className="dialog-close"
                    onClick={onCancel}
                    aria-label="Fechar"
                >
                    <X size={18} />
                </button>

                <div className={`dialog-icon ${variant}`} aria-hidden="true">
                    {getIcon()}
                </div>

                <h3 id="confirm-title" className="dialog-title">{title}</h3>
                <p id="confirm-message" className="dialog-message">{message}</p>

                <div className="dialog-actions">
                    <button
                        className="dialog-btn secondary"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        className={`dialog-btn primary ${variant}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>

                <p className="dialog-hint">
                    Pressione Enter para confirmar ou ESC para cancelar
                </p>
            </div>
        </div>
    );
};

export default ConfirmDialog;
