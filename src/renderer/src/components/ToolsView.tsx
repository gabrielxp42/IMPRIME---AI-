import React, { useState, useEffect } from 'react';
import './ToolsView.css';
import LiquidAlert from './ui/LiquidAlert';

interface Effect {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    processFn: () => Promise<{ success: boolean; error?: string }>;
}

const ToolsView: React.FC = () => {
    // Document handling
    const [useActiveDocument] = useState(true);
    const [activeDocument, setActiveDocument] = useState<{ path?: string; name?: string } | null>(null);

    // Configuration state
    const [lpi, setLpi] = useState<number>(45);

    // General UI state
    const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
    const [messages, setMessages] = useState<{ [key: string]: { type: 'success' | 'error' | 'info'; text: string } }>({});

    // Estado do novo sistema de alertas
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'info';
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    const showLiquidAlert = (type: 'success' | 'error' | 'info', title: string, message: string) => {
        setAlertConfig({
            isOpen: true,
            type,
            title,
            message
        });
    };

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

    // Available LPI options
    const lpiOptions = [25, 28, 30, 35, 38, 45, 50, 55, 60];

    // ----- General effect handling -----
    const effects: Effect[] = [
        {
            id: 'halftone-dark',
            name: 'Cor Escura (Rápido)',
            description: `Halftone Tradicional (Genérico). Otimizado para velocidade. (LPI Automático)`,
            icon: '⚡',
            color: '#1a1a1a',
            processFn: () => (window.electronAPI as any).processHalftone({ lpi, type: 'GENERIC_DARK' }),
        },
        {
            id: 'halftone-light',
            name: 'Cor Clara (Rápido)',
            description: `Halftone Tradicional (Genérico) para fundos claros. (LPI Automático)`,
            icon: '⚡',
            color: '#f0f0f0',
            processFn: () => (window.electronAPI as any).processHalftone({ lpi, type: 'GENERIC_LIGHT' }),
        },
        {
            id: 'halftone-roseta',
            name: 'Modo Roseta Pro',
            description: `Halftone clássico (Roseta) em ${lpi} LPI. Perfeito para simulações e artes complexas.`,
            icon: '🏵️',
            color: '#e91e63',
            processFn: () => (window.electronAPI as any).processHalftone({ lpi, type: 'RT' }),
        },
        {
            id: 'halftone-hybrid',
            name: 'Modo Híbrido Elite',
            description: `Halftone híbrido profissional com ${lpi} LPI. O ápice do detalhe para DTF.`,
            icon: '💎',
            color: '#4a90e2',
            processFn: () => (window.electronAPI as any).processHalftone({ lpi, type: 'HB' }),
        },
        {
            id: 'spotwhite-ext',
            name: 'Spot White Elite',
            description: 'Canal de Branco (Spot White) profissional extraído com precisão.',
            icon: '⚪',
            color: '#ffffff',
            processFn: () => (window.electronAPI as any).processSpotWhiteExtracted(),
        },
        {
            id: 'remove-black',
            name: 'Limpar Fundo Preto',
            description: 'Remove apenas o fundo preto da imagem (Sem Halftone).',
            icon: '⬛',
            color: '#333333',
            processFn: () => (window.electronAPI as any).removeColor('black'),
        },
        {
            id: 'remove-white',
            name: 'Limpar Fundo Branco',
            description: 'Remove apenas o fundo branco da imagem (Sem Halftone).',
            icon: '⬜',
            color: '#cccccc',
            processFn: () => (window.electronAPI as any).removeColor('white'),
        },
    ];

    const handleProcessEffect = async (effect: Effect) => {
        // 1. Feedback Visual - Estilo Liquid Glass
        showLiquidAlert('info', `Iniciando ${effect.name}`, `Enviando comando para o Photoshop...\n(LPI: ${lpi})`);

        setProcessing(prev => ({ ...prev, [effect.id]: true }));
        setMessages(prev => ({ ...prev, [effect.id]: { type: 'info', text: 'Processando...' } }));

        try {
            let result;

            // 2. Execução DIRETA (Sem abstração processFn)
            // Isso garante que funcione igual ao botão de teste
            switch (effect.id) {
                case 'halftone-dark':
                    result = await (window.electronAPI as any).processHalftone({ lpi, type: 'GENERIC_DARK' });
                    break;
                case 'halftone-light':
                    result = await (window.electronAPI as any).processHalftone({ lpi, type: 'GENERIC_LIGHT' });
                    break;
                case 'halftone-roseta':
                    result = await (window.electronAPI as any).processHalftone({ lpi, type: 'RT' });
                    break;
                case 'halftone-hybrid':
                    result = await (window.electronAPI as any).processHalftone({ lpi, type: 'HB' });
                    break;
                case 'spotwhite-ext':
                    result = await (window.electronAPI as any).processSpotWhiteExtracted();
                    break;
                case 'remove-black':
                    result = await (window.electronAPI as any).removeColor('black');
                    break;
                case 'remove-white':
                    result = await (window.electronAPI as any).removeColor('white');
                    break;
                default:
                    throw new Error('Efeito descocnhecido');
            }

            if (result.success) {
                setMessages(prev => ({ ...prev, [effect.id]: { type: 'success', text: '✅ Sucesso!' } }));
                showLiquidAlert('success', 'Sucesso!', 'Processo finalizado com sucesso!');
            } else {
                setMessages(prev => ({ ...prev, [effect.id]: { type: 'error', text: `Erro: ${result.error}` } }));
                showLiquidAlert('error', 'Erro no Photoshop', result.error || 'Erro desconhecido');
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => ({ ...prev, [effect.id]: { type: 'error', text: 'Erro interno.' } }));
            showLiquidAlert('error', 'Erro Interno', (e as Error).message);
        } finally {
            setProcessing(prev => ({ ...prev, [effect.id]: false }));
        }
    };

    return (
        <div className="tools-view">
            <div className="tools-header">
                <h1>EFEITOS ESPECIAIS</h1>
                <p className="tools-subtitle">Processamento Profissional para DTF</p>
            </div>
            <div className="tools-content">
                <div className="input-mode-section">
                    <h2>📄 Status da Conexão</h2>
                    {activeDocument ? (
                        <p className="document-name">
                            <span>✅</span> <span><strong>Conectado ao:</strong> {activeDocument.name}</span>
                        </p>
                    ) : (
                        <p className="document-name no-document">
                            <span>⚠️</span> <span>Aguardando Photoshop... Abra uma imagem.</span>
                        </p>
                    )}
                </div>

                <div className="filter-controls">
                    <div className="control-group">
                        <label>Frequência (LPI):</label>
                        <select
                            value={lpi}
                            onChange={(e) => setLpi(Number(e.target.value))}
                            className="lpi-select"
                        >
                            {lpiOptions.map(val => (
                                <option key={val} value={val}>{val} LPI</option>
                            ))}
                        </select>
                        <span className="control-hint">Define a resolução do ponto (válido para Roseta e Híbrido)</span>
                    </div>
                </div>

                <div className="effects-gallery">
                    <h2>🎨 Galeria de Processamento</h2>
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
                                        disabled={processing[effect.id]}
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
                                                <span>▶</span>
                                                <span>Executar</span>
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
                    <h3>💡 Dica de Performance</h3>
                    <p>Para resultados mais rápidos, utilize os modos com ícone de raio (⚡). Para máxima qualidade em degradês, use o modo Híbrido Elite.</p>
                </div>

                <div className="diagnostic-section" style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', fontSize: '13px', color: '#888', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>🛠️ Diagnóstico do Sistema</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={async () => {
                                try {
                                    const result = await (window.electronAPI as any).getActiveDocument();
                                    if (result.success) {
                                        alert(`✅ CONECTADO!\nDocumento: ${result.name}\nCaminho: ${result.path}`);
                                    } else {
                                        alert(`❌ ERRO NO PHOTOSHOP: ${result.error || 'Nenhum documento aberto.'}\n\nDica: Abra uma imagem no Photoshop e tente de novo.`);
                                    }
                                } catch (e) {
                                    alert(`❌ ERRO CRÍTICO (IPC): ${(e as Error).message}\nO Backend não responde.`);
                                }
                            }}
                            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#ccc', cursor: 'pointer' }}
                        >
                            Testar Photoshop
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const start = Date.now();
                                    const result = await (window.electronAPI as any).ipcRenderer.invoke('ping');
                                    const end = Date.now();
                                    alert(`✅ PING OK! (${end - start}ms)\nBackend respondendo em: ${result.timestamp}`);
                                } catch (e) {
                                    // Fallback se o wrap do preload for diferente
                                    try {
                                        const start = Date.now();
                                        const result = await (window.electronAPI as any).ping();
                                        const end = Date.now();
                                        alert(`✅ PING OK! (${end - start}ms)\nBackend respondendo em: ${result.timestamp}`);
                                    } catch (err) {
                                        alert(`❌ FALHA NO PING: ${(err as Error).message}`);
                                    }
                                }
                            }}
                            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#ccc', cursor: 'pointer' }}
                        >
                            Verificar Comunicação (Ping)
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    alert('Iniciando Teste Direto de Halftone (Cor Escura)...');
                                    const result = await (window.electronAPI as any).processHalftone({ lpi: 45, type: 'GENERIC_DARK' });
                                    if (result.success) {
                                        alert('✅ SUCESSO! O comando foi executado e o Photoshop deve ter respondido.');
                                    } else {
                                        alert(`❌ FALHA NO COMANDO: ${result.error}`);
                                    }
                                } catch (e) {
                                    alert(`❌ ERRO CRÍTICO JS: ${(e as Error).message}\nVerifique o console (F12)`);
                                }
                            }}
                            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#ff9800', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ⚡ Testar Halftone (Forçado)
                        </button>
                    </div>
                </div>
            </div>

            <LiquidAlert
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
            />
        </div>
    );
};

export default ToolsView;
