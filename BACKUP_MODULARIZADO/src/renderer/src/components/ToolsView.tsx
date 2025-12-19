import React, { useState, useEffect } from 'react';
import './ToolsView.css';

interface Effect {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    processFn: ((inputFile: string | null) => Promise<{ success: boolean; error?: string }>) | null;
}

const ToolsView: React.FC = () => {
    // Document handling
    const [useActiveDocument] = useState(true);
    const [activeDocument, setActiveDocument] = useState<{ path?: string; name?: string } | null>(null);

    // General UI state
    const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
    const [messages, setMessages] = useState<{ [key: string]: { type: 'success' | 'error' | 'info'; text: string } }>({});

    useEffect(() => {
        if (useActiveDocument) {
            const check = async () => {
                try {
                    const result = await window.electronAPI.getActiveDocument();
                    if (result.success) {
                        setActiveDocument({ path: result.path, name: result.name || 'Documento não salvo' });
                    } else {
                        setActiveDocument(null);
                    }
                } catch {
                    setActiveDocument(null);
                }
            };
            check();
            const interval = setInterval(check, 2000);
            return () => clearInterval(interval);
        }
    }, [useActiveDocument]);

    // ----- General effect handling -----
    const effects: Effect[] = [
        {
            id: 'halftone-dark',
            name: 'Halftone Cor Escura',
            description: 'Aplica efeito halftone profissional para tecidos escuros.',
            icon: '🌑',
            color: '#2d2d44',
            processFn: window.electronAPI.processHalftoneDirectDTF,
        },
        {
            id: 'halftone-light',
            name: 'Halftone Cor Clara',
            description: 'Aplica efeito halftone profissional para tecidos claros.',
            icon: '☀️',
            color: '#4a90e2',
            processFn: window.electronAPI.processHalftoneDirectDTFLight,
        },
    ];

    const handleProcessEffect = async (effect: Effect) => {
        if (!useActiveDocument) {
            setMessages(prev => ({ ...prev, [effect.id]: { type: 'error', text: 'Por favor, use o documento aberto no Photoshop.' } }));
            return;
        }
        if (!activeDocument) {
            setMessages(prev => ({ ...prev, [effect.id]: { type: 'error', text: 'Nenhum documento aberto no Photoshop. Abra uma imagem primeiro.' } }));
            return;
        }
        setProcessing(prev => ({ ...prev, [effect.id]: true }));
        setMessages(prev => ({ ...prev, [effect.id]: { type: 'info', text: 'Processando...' } }));
        try {
            const result = await effect.processFn!(null);
            if (result.success) {
                setMessages(prev => ({ ...prev, [effect.id]: { type: 'success', text: `${effect.name} aplicado com sucesso!` } }));
            } else {
                setMessages(prev => ({ ...prev, [effect.id]: { type: 'error', text: `Erro: ${result.error || 'Erro desconhecido'}` } }));
            }
        } catch (e) {
            setMessages(prev => ({ ...prev, [effect.id]: { type: 'error', text: `Erro: ${(e as Error).message}` } }));
        } finally {
            setProcessing(prev => ({ ...prev, [effect.id]: false }));
        }
    };

    return (
        <div className="tools-view">
            <div className="tools-header">
                <h1>EFEITOS</h1>
                <p className="tools-subtitle">Galeria de efeitos profissionais</p>
            </div>
            <div className="tools-content">
                <div className="input-mode-section">
                    <h2>📄 Documento Ativo</h2>
                    {activeDocument ? (
                        <p className="document-name">
                            <span>✅</span> <span><strong>Documento:</strong> {activeDocument.name}</span>
                        </p>
                    ) : (
                        <p className="document-name no-document">
                            <span>⚠️</span> <span>Aguardando documento... Abra uma imagem no Photoshop</span>
                        </p>
                    )}
                </div>
                <div className="effects-gallery">
                    <h2>🎨 Galeria de Efeitos</h2>
                    <div className="effects-grid">
                        {effects.map(effect => (
                            <div key={effect.id} className="effect-card">
                                <div className="effect-card-header" style={{ borderLeftColor: effect.color }}>
                                    <div className="effect-icon" style={{ backgroundColor: `${effect.color}20` }}>{effect.icon}</div>
                                    <h3>{effect.name}</h3>
                                </div>
                                <div className="effect-card-body">
                                    <p>{effect.description}</p>
                                    <button
                                        className={`effect-button ${processing[effect.id] ? 'processing' : ''}`}
                                        onClick={() => handleProcessEffect(effect)}
                                        disabled={processing[effect.id] || !activeDocument}
                                        style={{
                                            background: processing[effect.id]
                                                ? 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)'
                                                : `linear-gradient(135deg, ${effect.color} 0%, ${effect.color}dd 100%)`,
                                        }}
                                    >
                                        {processing[effect.id] ? (
                                            <>
                                                <span className="spinner" />
                                                <span>Processando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🎨</span>
                                                <span>Aplicar Efeito</span>
                                            </>
                                        )}
                                    </button>
                                    {messages[effect.id] && (
                                        <div className={`message ${messages[effect.id].type}`}>
                                            <span>{messages[effect.id].type === 'success' ? '✅' : messages[effect.id].type === 'error' ? '❌' : 'ℹ️'}</span>
                                            <span>{messages[effect.id].text}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="info-box">
                    <h3>💡 Dica</h3>
                    <p>Estes efeitos funcionam sozinhos ou em conjunto com o Spot White.</p>
                </div>
            </div>
        </div>
    );
};

export default ToolsView;
