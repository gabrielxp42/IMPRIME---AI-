/**
 * Chat de Teste Simples - Janela Flutuante
 * Para testar a API Gemini de forma isolada
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './TestChatWindow.css';

interface Message {
    role: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

interface TestChatWindowProps {
    apiKey: string;
    onClose: () => void;
}

const TestChatWindow: React.FC<TestChatWindowProps> = ({ apiKey, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: '🤖 Chat de teste iniciado! Envie uma mensagem para testar a API.', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Instância ÚNICA da API
    const genAIRef = useRef<GoogleGenerativeAI | null>(null);
    const modelRef = useRef<any>(null);

    // Lista de Modelos 2025 COMPLETA
    const models = [
        { id: 'gemini-2.5-flash', name: '⚡ Gemini 2.5 Flash (RECOMENDADO)' },
        { id: 'gemini-3-pro', name: '🧠 Gemini 3 Pro (Multimodal Avançado)' },
        { id: 'gemini-2.5-flash-lite', name: '🚀 Gemini 2.5 Flash-Lite (Ultra Rápido)' },
        { id: 'gemini-2.5-pro', name: '🎓 Gemini 2.5 Pro (Raciocínio complexo)' },
        { id: 'gemini-2.0-flash', name: '🕰️ Gemini 2.0 Flash (Legado)' },
        { id: 'gemini-2.0-flash-lite', name: '🕰️ Gemini 2.0 Flash-Lite (Legado)' },
    ];

    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

    // Inicializar API quando Key ou Modelo mudar
    useEffect(() => {
        if (!apiKey) {
            setError('API Key não configurada');
            return;
        }

        console.log(`[TestChat] 🔄 Inicializando API com modelo: ${selectedModel}...`);
        try {
            genAIRef.current = new GoogleGenerativeAI(apiKey);
            modelRef.current = genAIRef.current.getGenerativeModel({
                model: selectedModel,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            });
            console.log('[TestChat] ✅ API inicializada com sucesso!');
            setError(null);

            // Mensagem de sistema indicando a troca
            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    text: `🔄 Modelo alterado para: **${models.find(m => m.id === selectedModel)?.name}**`,
                    timestamp: new Date()
                }
            ]);

        } catch (err: any) {
            console.error('[TestChat] ❌ Erro ao inicializar:', err);
            setError(`Erro ao inicializar: ${err.message}`);
        }
    }, [apiKey, selectedModel]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            console.log('[TestChat] 📤 Enviando mensagem:', input);

            if (!modelRef.current) {
                throw new Error('Modelo não inicializado');
            }

            const result = await modelRef.current.generateContent(input);
            const response = await result.response;
            const text = response.text();

            console.log('[TestChat] 📥 Resposta recebida:', text);

            const aiMessage: Message = {
                role: 'ai',
                text: text,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (err: any) {
            console.error('[TestChat] ❌ Erro completo:', err);
            console.error('[TestChat] Stack:', err.stack);

            let errorMsg = err.message || 'Erro desconhecido';

            // Detectar tipos específicos de erro
            if (err.message?.includes('429') || err.status === 429) {
                errorMsg = '⚠️ Rate limit atingido (429)';
            } else if (err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
                errorMsg = '⚠️ Quota excedida (RESOURCE_EXHAUSTED)';
            } else if (err.message?.includes('API key')) {
                errorMsg = '❌ Problema com API Key';
            }

            setError(errorMsg);

            const errorMessage: Message = {
                role: 'ai',
                text: `❌ ERRO: ${errorMsg}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="test-chat-overlay">
            <div className="test-chat-window">
                <div className="test-chat-header">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h3>🧪 Chat de Teste</h3>

                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                outline: 'none',
                                cursor: 'pointer',
                                marginTop: '4px'
                            }}
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id} style={{ background: '#333' }}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button onClick={onClose} className="test-chat-close">✕</button>
                </div>

                {error && (
                    <div className="test-chat-error">
                        <strong>⚠️ Erro:</strong> {error}
                    </div>
                )}

                <div className="test-chat-info">
                    <div>📊 <strong>Modelo Ativo:</strong> {models.find(m => m.id === selectedModel)?.name}</div>
                    <div>🔑 <strong>API Key:</strong> {apiKey.substring(0, 10)}...</div>
                    <div>💬 <strong>Mensagens:</strong> {messages.filter(m => m.role === 'user').length}</div>
                </div>

                <div className="test-chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`test-chat-message ${msg.role}`}>
                            <div className="test-chat-message-role">
                                {msg.role === 'user' ? '👤 Você' : '🤖 Gemini'}
                            </div>
                            <div className="test-chat-message-text">{msg.text}</div>
                            <div className="test-chat-message-time">
                                {msg.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="test-chat-message ai loading">
                            <div className="test-chat-message-role">🤖 Gemini</div>
                            <div className="test-chat-message-text">
                                <span className="dots">Pensando</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="test-chat-input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite qualquer coisa para testar..."
                        disabled={isLoading}
                        className="test-chat-input"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="test-chat-send"
                    >
                        {isLoading ? '⏳' : '📤'}
                    </button>
                </div>

                <div className="test-chat-footer">
                    <small>
                        💡 Este é um teste SIMPLES. Se funcionar aqui mas não no editor, o problema está na implementação complexa.
                    </small>
                </div>
            </div>
        </div>
    );
};

export default TestChatWindow;
