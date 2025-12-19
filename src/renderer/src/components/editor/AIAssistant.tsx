import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Copy, Send, Sparkles, X } from 'lucide-react';
import './AIAssistant.css';

interface AIAssistantProps {
    context: {
        selectedId: string | null;
        imagesCount: number;
        canvasSize: { width: number; height: number };
    };
    onExecuteCommand: (command: string) => Promise<string>;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ context, onExecuteCommand }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // Initial State: Bot Greeting
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
        { role: 'ai', text: 'Olá! Sou sua Designer AI. Posso criar layouts, editar imagens ou apenas conversar. Como posso ajudar?' }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userCmd = input;
        setMessages(prev => [...prev, { role: 'user', text: userCmd }]);
        setInput('');
        setIsThinking(true);

        try {
            // Execute command via EditorView logic
            const response = await onExecuteCommand(userCmd);
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Tive um problema técnico. Tente novamente?' }]);
        } finally {
            setIsThinking(false);
            // Re-focus input for fluidity
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const copyConversation = () => {
        const text = messages.map(m => `[${m.role.toUpperCase()}] ${m.text}`).join('\n');
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    return (
        <div className="ai-assistant-container" style={{ bottom: 20, right: 20 }}>

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-window">
                    {/* Header */}
                    <div className="ai-header">
                        <div className="ai-title">
                            <MessageSquare size={16} />
                            <span>Conversa</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-copy" onClick={copyConversation} title="Copiar conversa">
                                <Copy size={12} /> Copiar
                            </button>
                            <button className="btn-copy" onClick={() => setIsOpen(false)} title="Fechar" style={{ border: 'none', background: 'transparent' }}>
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="ai-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-message ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isThinking && (
                            <div className="ai-message ai">
                                <div className="thinking-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form className="ai-input-area" onSubmit={handleSubmit}>
                        <div className="ai-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                className="ai-input-field"
                                placeholder="Ex: Crie um grid com 4 cópias..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="btn-send" disabled={!input.trim() || isThinking}>
                                <Send size={14} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Avatar Toggle Button */}
            <div className="ai-avatar" onClick={() => setIsOpen(!isOpen)}>
                {/* Glow Effect when thinking */}
                <div className={`ai-glow ${isThinking ? 'thinking' : ''}`}></div>

                {isOpen ? (
                    <X className="ai-icon" />
                ) : (
                    <Sparkles className="ai-icon" />
                )}
            </div>
        </div>
    );
};

export default AIAssistant;
