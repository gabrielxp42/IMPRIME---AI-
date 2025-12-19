/**
 * ToastNotification - Sistema de Notificações Premium
 * Toast messages com animações e variantes
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import './ToastNotification.css';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => string;
    hideToast: (id: string) => void;
    updateToast: (id: string, message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000): string => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        setToasts(prev => [...prev, { id, message, type, duration }]);

        // Auto dismiss (except loading toasts)
        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                hideToast(id);
            }, duration);
        }

        return id;
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateToast = useCallback((id: string, message: string, type?: ToastType) => {
        setToasts(prev => prev.map(t =>
            t.id === id ? { ...t, message, type: type || t.type } : t
        ));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, updateToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={hideToast} />
        </ToastContext.Provider>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" role="region" aria-label="Notificações" aria-live="polite">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 200);
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'loading':
                return <Loader2 size={20} className="toast-spinner" />;
            default:
                return <Info size={20} />;
        }
    };

    return (
        <div
            className={`toast-item ${toast.type} ${isExiting ? 'exiting' : ''}`}
            role="alert"
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
            <div className="toast-icon" aria-hidden="true">
                {getIcon()}
            </div>
            <span className="toast-message">{toast.message}</span>
            {toast.type !== 'loading' && (
                <button
                    className="toast-close"
                    onClick={handleDismiss}
                    aria-label="Fechar notificação"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

// Componente standalone para uso sem contexto
interface StandaloneToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose?: () => void;
}

export const StandaloneToast: React.FC<StandaloneToastProps> = ({
    message,
    type = 'info',
    isVisible,
    onClose
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
        } else {
            const timer = setTimeout(() => setShow(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!show) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'loading':
                return <Loader2 size={20} className="toast-spinner" />;
            default:
                return <Info size={20} />;
        }
    };

    return (
        <div className="toast-container standalone">
            <div
                className={`toast-item ${type} ${!isVisible ? 'exiting' : ''}`}
                role="alert"
            >
                <div className="toast-icon" aria-hidden="true">
                    {getIcon()}
                </div>
                <span className="toast-message">{message}</span>
                {onClose && type !== 'loading' && (
                    <button
                        className="toast-close"
                        onClick={onClose}
                        aria-label="Fechar notificação"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ToastProvider;
