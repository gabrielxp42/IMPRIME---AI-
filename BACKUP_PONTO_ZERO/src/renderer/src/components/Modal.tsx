import React, { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  children?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  onOpenFolder?: () => void;
  openFolderText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  children,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onOpenFolder,
  openFolderText = 'Abrir pasta'
}) => {
  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container modal-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            {type === 'success' && '✓'}
            {type === 'error' && '✗'}
            {type === 'warning' && '⚠'}
            {type === 'info' && 'ℹ'}
          </div>
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          {children}
        </div>
        <div className="modal-footer">
          {onConfirm ? (
            <>
              <button className="modal-button modal-button-secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button className="modal-button" onClick={handleConfirm}>
                {confirmText}
              </button>
            </>
          ) : (
            <>
              {onOpenFolder && (
                <button className="modal-button modal-button-folder" onClick={onOpenFolder}>
                  📁 {openFolderText}
                </button>
              )}
              <button className="modal-button" onClick={onClose}>OK</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;

