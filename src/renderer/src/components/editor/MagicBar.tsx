/**
 * MagicBar - Barra de Comandos IA Premium
 * UX: Sugestões inteligentes, feedback visual, acessibilidade completa
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MagicBar.css';

interface MagicBarProps {
    onCommand: (text: string) => Promise<string> | void;
    isProcessing?: boolean;
    suggestions?: string[];
    aiResponse?: string | null;
    history?: { role: 'user' | 'model'; text: string }[];
    currentModel?: string;
    onModelChange?: (model: string) => void;
    hasSelection?: boolean;
    onPaintClick?: () => void;
    onInputChange?: (val: string) => void;
    initialInput?: string;
}

const MODELS = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Máxima qualidade', type: 'pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Equilibrado', type: 'flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Lite', desc: 'Econômico', type: 'lite' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Clássico', type: 'flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Backup', type: 'lite' },
];

// Sugestões contextuais baseadas no estado do canvas
const getContextualSuggestions = (hasSelection: boolean): string[] => {
    if (hasSelection) {
        return [
            "Remover fundo",
            "Duplicar em grade 3x3",
            "Preencher folha A4",
            "Centralizar na folha",
            "Redimensionar para 10cm"
        ];
    }
    return [
        "Adicionar número 7 do Flamengo",
        "Criar grid de adesivos",
        "Limpar canvas",
        "Organizar elementos"
    ];
};

const MagicBar: React.FC<MagicBarProps> = ({
    onCommand,
    isProcessing = false,
    suggestions: externalSuggestions,
    aiResponse = null,
    history = [],
    currentModel = 'gemini-2.0-flash-exp',
    onModelChange,
    hasSelection = false,
    onPaintClick,
    onInputChange,
    initialInput = ''
}) => {
    const [input, setInput] = useState(initialInput);
    const [showHistory, setShowHistory] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [transientResponse, setTransientResponse] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const historyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const suggestions = externalSuggestions || getContextualSuggestions(false);

    // Auto-scroll history
    useEffect(() => {
        if (showHistory && historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [showHistory, history, aiResponse]);

    // Show ephemeral bubble when there's an AI response
    useEffect(() => {
        if (aiResponse) {
            setTransientResponse(aiResponse);

            // Play subtle notification sound
            try {
                const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYSWv+BAAAAAAAAAAAAAAAAAAAAAP/7UMQAA8AAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEAIPAAAGQAAAAIAAANIAAAATVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==');
                audio.volume = 0.15;
                audio.play().catch(() => { });
            } catch (e) { }

            // Auto hide after 6s
            const timer = setTimeout(() => {
                setTransientResponse(null);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [aiResponse]);

    // Close model selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowModelSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut to focus (Ctrl+/)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            // Escape to close
            if (e.key === 'Escape') {
                setShowHistory(false);
                setShowModelSelector(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isProcessing) return;

        onCommand(input);
        setInput('');
        if (onInputChange) onInputChange('');
        setShowHistory(false);
    }, [input, isProcessing, onCommand]);

    const handleSuggestion = useCallback((s: string) => {
        onCommand(s);
        setShowHistory(false);
    }, [onCommand]);

    const getCurrentModelInfo = () => {
        return MODELS.find(m => m.id === currentModel) || MODELS[0];
    };

    return (
        <div
            className="magic-bar-overlay"
            ref={containerRef}
            role="search"
            aria-label="Barra de comandos da IA Designer"
        >
            {/* MODEL SELECTOR DROPDOWN */}
            {showModelSelector && onModelChange && (
                <div
                    className="model-selector-popup"
                    role="listbox"
                    aria-label="Seletor de modelo de IA"
                >
                    <div className="model-selector-header">Escolha a Inteligência</div>
                    {MODELS.map(model => (
                        <div
                            key={model.id}
                            className={`model-option ${currentModel === model.id ? 'selected' : ''}`}
                            onClick={() => {
                                onModelChange(model.id);
                                setShowModelSelector(false);
                            }}
                            role="option"
                            aria-selected={currentModel === model.id}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    onModelChange(model.id);
                                    setShowModelSelector(false);
                                }
                            }}
                        >
                            <div className={`model-icon ${model.type}`} aria-hidden="true" />
                            <div className="model-info">
                                <span className="model-name">{model.name}</span>
                                <span className="model-desc">{model.desc}</span>
                            </div>
                            {currentModel === model.id && <span className="check" aria-hidden="true">✓</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* HISTORY OVERLAY */}
            {showHistory && (history.length > 0 || aiResponse) && (
                <div
                    className="magic-history-panel"
                    ref={historyRef}
                    role="log"
                    aria-label="Histórico de conversa com IA"
                    aria-live="polite"
                >
                    {history.length === 0 && (
                        <div className="history-empty">
                            <span className="empty-icon">💬</span>
                            <p>Comece uma conversa com sua Designer IA</p>
                        </div>
                    )}
                    {history.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`history-message ${msg.role === 'user' ? 'user' : 'ai'}`}
                            role={msg.role === 'user' ? 'note' : 'status'}
                        >
                            {msg.role === 'model' && <span className="ai-avatar">✨</span>}
                            <span className="message-text">{msg.text}</span>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="history-message ai processing" aria-label="Processando...">
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                        </div>
                    )}
                </div>
            )}

            {/* TRANSIENT PURPLE BUBBLE */}
            {transientResponse && !showHistory && (
                <div
                    className="transient-bubble"
                    onClick={() => setShowHistory(true)}
                    role="alert"
                    aria-live="assertive"
                >
                    <span className="sparkle-icon" aria-hidden="true">✨</span>
                    <p>{transientResponse}</p>
                    <span className="bubble-hint">Clique para ver histórico</span>
                </div>
            )}

            {/* MAIN BAR */}
            <div className={`magic-bar-container ${isProcessing ? 'processing' : ''} ${isFocused ? 'focused' : ''}`}>
                {/* Model Indicator/Selector */}
                <button
                    className="magic-icon"
                    onClick={() => onModelChange && setShowModelSelector(!showModelSelector)}
                    title={`Modelo: ${getCurrentModelInfo().name}`}
                    aria-label={`Modelo atual: ${getCurrentModelInfo().name}. Clique para trocar`}
                    aria-haspopup="listbox"
                    aria-expanded={showModelSelector}
                >
                    <div className={`model-indicator ${getCurrentModelInfo().type}`} />
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={showModelSelector ? 'active-model-icon' : ''}
                        aria-hidden="true"
                    >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    className="magic-input"
                    placeholder={isProcessing ? "✨ Processando..." : "✨ Converse com sua Designer... (Ctrl+/)"}
                    value={input}
                    onChange={(e) => {
                        const val = e.target.value;
                        setInput(val);
                        if (onInputChange) onInputChange(val);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                        if (e.key === 'ArrowUp' && history.length > 0) {
                            // Navigate history
                            const lastUserMsg = [...history].reverse().find(h => h.role === 'user');
                            if (lastUserMsg) setInput(lastUserMsg.text);
                        }
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        if (history.length > 0 && !transientResponse) setShowHistory(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    disabled={isProcessing}
                    aria-label="Campo de comando para IA Designer"
                    aria-describedby="magic-bar-hint"
                />
                <span id="magic-bar-hint" className="sr-only">
                    Digite um comando para a IA, como "remover fundo" ou "duplicar 4 vezes"
                </span>

                <div className="magic-actions">
                    <button
                        className={`magic-btn-icon ${showHistory ? 'active' : ''}`}
                        title="Ver histórico de conversa"
                        onClick={() => setShowHistory(!showHistory)}
                        aria-label={showHistory ? "Fechar histórico" : "Ver histórico de conversa"}
                        aria-pressed={showHistory}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {history.length > 0 && (
                            <span className="history-badge" aria-label={`${history.length} mensagens`}>
                                {history.length > 9 ? '9+' : history.length}
                            </span>
                        )}
                    </button>
                    {hasSelection && onPaintClick && (
                        <button
                            className="magic-btn-icon paintbrush-btn"
                            title="Pintar área para IA (M)"
                            onClick={onPaintClick}
                            aria-label="Pintar área para IA"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m12 22 5-5" />
                                <path d="M9 20.5 7 18.5" />
                                <path d="M15.5 14 13.5 12" />
                                <path d="M21.5 6.5 17.5 2.5" />
                                <path d="M22 6c0 1-1 3.5-3.5 3.5S15 8.5 15 7.5 16.5 4 19 4s3 1 3 2Z" />
                            </svg>
                        </button>
                    )}
                    <button
                        className="magic-btn-icon magic-btn-send"
                        disabled={!input.trim() || isProcessing}
                        onClick={() => handleSubmit()}
                        aria-label="Enviar comando"
                    >
                        {isProcessing ? (
                            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="60" strokeDashoffset="20" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* SUGGESTIONS */}
            {!input && !showHistory && !transientResponse && !isProcessing && (
                <div className="magic-suggestions" role="list" aria-label="Sugestões de comandos">
                    {suggestions.slice(0, 4).map((s, i) => (
                        <button
                            key={i}
                            className="magic-chip"
                            onClick={() => handleSuggestion(s)}
                            role="listitem"
                            tabIndex={0}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MagicBar;
