import React, { useState, useEffect, useRef } from 'react';
import './AIAssistant.css';

interface AIAssistantProps {
    context: {
        selectedId: string | null;
        imagesCount: number;
        canvasSize: { width: number; height: number };
    };
    onExecuteCommand: (command: string) => Promise<string>; // Retorna a resposta do agente
}

const AIAssistant: React.FC<AIAssistantProps> = ({ context, onExecuteCommand }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
        { role: 'ai', text: 'Olá! Sou seu assistente criativo. Posso alinhar, duplicar ou criar layouts para você. O que vamos fazer?' }
    ]);
    const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 200 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // Auto-sugestão baseada no contexto
    useEffect(() => {
        if (context.selectedId) {
            // Exemplo de proatividade (pode ser mais complexo depois)
            // setMessages(prev => [...prev, { role: 'ai', text: 'Vi que você selecionou um objeto. Quer que eu o centralize?' }]);
        }
    }, [context.selectedId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userCmd = input;
        setMessages(prev => [...prev, { role: 'user', text: userCmd }]);
        setInput('');
        setIsThinking(true);

        try {
            // Simula tempo de "pensamento" ou chamada de API
            const response = await onExecuteCommand(userCmd);
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Desculpe, não entendi ou algo deu errado.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    // Lógica de Drag simples
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.ai-input-area')) return; // Não arrastar se clicar no input
        isDragging.current = true;
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                setPosition({
                    x: e.clientX - dragStart.current.x,
                    y: e.clientY - dragStart.current.y
                });
            }
        };
        const handleMouseUp = () => {
            isDragging.current = false;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Função para copiar toda a conversa
    const copyConversation = () => {
        const conversation = messages.map(msg => {
            const prefix = msg.role === 'user' ? '👤 VOCÊ' : '🤖 ASSISTENTE';
            return `${prefix}:\n${msg.text}\n`;
        }).join('\n');

        navigator.clipboard.writeText(conversation).then(() => {
            // Feedback visual temporário
            setMessages(prev => [...prev, { role: 'ai', text: '📋 Conversa copiada para área de transferência!' }]);
            setTimeout(() => {
                setMessages(prev => prev.filter((_, idx) => idx !== prev.length - 1));
            }, 2000);
        }).catch(() => {
            alert('Erro ao copiar. Tente novamente.');
        });
    };

    return (
        <div
            className={`ai-assistant-container ${isOpen ? 'open' : 'closed'}`}
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
        >
            {/* Avatar / Toggle */}
            <div className="ai-avatar" onClick={() => setIsOpen(!isOpen)}>
                <div className={`ai-glow ${isThinking ? 'thinking' : ''}`}></div>
                <span className="ai-icon">✨</span>
            </div>

            {/* Chat Area */}
            {isOpen && (
                <div className="ai-chat-window">
                    {/* Header com botão de copiar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        marginBottom: '8px'
                    }}>
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>💬 Conversa</span>
                        <button
                            onClick={copyConversation}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                color: '#fff',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            title="Copiar toda a conversa"
                        >
                            📋 Copiar
                        </button>
                    </div>

                    <div className="ai-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-message ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isThinking && <div className="ai-message ai thinking-dots"><span>.</span><span>.</span><span>.</span></div>}
                    </div>

                    <form className="ai-input-area" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Ex: Repetir imagem 10x..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoFocus
                        />
                        <button type="submit">➤</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIAssistant;
