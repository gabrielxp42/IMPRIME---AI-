import React from 'react';
import './LiquidAlert.css';

interface LiquidAlertProps {
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    onClose: () => void;
}

const LiquidAlert: React.FC<LiquidAlertProps> = ({ isOpen, type, title, message, onClose }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '✨';
        }
    };

    return (
        <div className="liquid-overlay" onClick={(e) => {
            // Opcional: fechar ao clicar fora, mas para erros críticos talvez seja melhor forçar o botão
            // onClose(); 
        }}>
            <div className={`liquid-alert ${type}`} onClick={(e) => e.stopPropagation()}>
                <div className="liquid-icon">
                    {getIcon()}
                </div>
                <h3>{title}</h3>
                <p>{message}</p>
                <button className="liquid-button" onClick={onClose} autoFocus>
                    OK
                </button>
            </div>
        </div>
    );
};

export default LiquidAlert;
