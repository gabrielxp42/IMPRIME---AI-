import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, History, Mic, Send, Trash2 } from 'lucide-react';
import './Assistant.css';

// --- TIPOS ---
export interface AICommand {
  type: 'command';
  action: 'duplicate' | 'resize' | 'delete' | 'arrange' | 'fill_sheet' | 'remove_bg';
  params: any;
  message: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isCommand?: boolean; // Se foi uma resposta de comando invisível no chat principal
}

interface AssistantProps {
  isOpen: boolean; // Controla se o PAINEL DE HISTÓRICO está aberto
  onToggle: () => void; // Abre/Fecha histórico
  geminiApiKey: string;
  onExecuteCommand: (command: AICommand) => void; // Callback para o Editor executar
}

const HISTORY_STORAGE_KEY = 'spot_white_agent_history_v2';

const Assistant: React.FC<AssistantProps> = ({
  isOpen,
  onToggle,
  geminiApiKey,
  onExecuteCommand
}) => {
  // Estado do Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado do "Balão Roxo" (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs de UI
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Carregar Histórico
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error("Erro histórico", e);
        // Se der erro, zera para não bugar
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      }
    }
  }, []);

  // 2. Salvar Histórico
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Função para Limpar Histórico (Começar do 0)
  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja apagar todo o histórico da conversa?')) {
      setMessages([]);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      showToast("🧹 Histórico limpo! Começando do zero.");
    }
  };

  // Scroll automático
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Função para mostrar Toast Roxo temporário
  const showToast = (text: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(text);
    // Some após 3 segundos (tempo para ler)
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  // --- LÓGICA DE IA (O CÉREBRO) ---
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    setInput('');
    setIsProcessing(true);

    // 1. Adicionar mensagem do usuário na tela imediatamente
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (!geminiApiKey) throw new Error("Chave API não configurada");

      // Importação dinâmica do Gemini
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      // Usar modelo Flash para velocidade
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // PROMPT DE SISTEMA REVISADO (FOCO EM CONVERSA + COMANDOS)
      const systemPrompt = `
        VOCÊ É O "SPOT", UM ASSISTENTE DE DESIGN AMIGÁVEL E INTELIGENTE.
        
        SEU COMPORTAMENTO:
        1. CONVERSA NORMAL: Se o usuário disser "Oi", "Tudo bem?", ou fizer perguntas gerais, responda como um chat normal. NÃO TENTE EXECUTAR COMANDOS.
        2. COMANDOS DE EDITOR: APENAS se o usuário pedir explicitamente uma ação abaixo, gere o JSON de comando.

        SUAS HABILIDADES (COMANDOS DISPONÍVEIS):
        - DUPLICAR: { "action": "duplicate", "params": { "count": number } }
        - REDIMENSIONAR: { "action": "resize", "params": { "width": "50%", "height": "auto" } }
        - ARRANJAR/ALINHAR: { "action": "arrange", "params": { "type": "grid" } }
        - DELETAR/APAGAR: { "action": "delete", "params": {} }
        - REMOVER FUNDO: { "action": "remove_bg", "params": {} }
        - PREENCHER: { "action": "fill_sheet", "params": { "gap": 10 } }
        - IA CRIATIVA (EDITAR/GERAR/VETORIZAR): { "action": "ai_image", "params": { "prompt": "descrição do que fazer com a imagem", "model": "nano-banana" | "nano-banana-pro" } }
          Use "nano-banana-pro" APENAS se o usuário pedir alta qualidade, fidelidade extrema ou texto preciso. Caso contrário, use "nano-banana".
          Exemplos: "revetorize", "estilo cartoon", "mude as cores para neon", "transforme em ilustração".

        REGRAS CRÍTICAS DE RESPOSTA:
        - SE FOR CONVERSA: Apenas responda o texto. Ex: "Olá! Como posso ajudar na sua arte hoje?"
        - SE FOR COMANDO: Responda ESTRITAMENTE um bloco JSON.
          Exemplo:
          \`\`\`json
          {
            "type": "command",
            "action": "duplicate",
            "params": { "count": 1 },
            "message": "Duplicando imagem..."
          }
          \`\`\`
      `;

      // Histórico para o Gemini
      const chatHistory = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(`SYSTEM: ${systemPrompt}\nUSER: ${userText}`);
      const responseText = result.response.text();
      console.log("🤖 Resposta IA:", responseText); // Debug

      // LÓGICA DE PARSE (COMANDO VS TEXTO)
      let isCommand = false;
      let finalContent = responseText;

      // Tenta encontrar JSON no texto (suporta markdown ```json ... ```)
      const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/) || responseText.match(/(\{[\s\S]*?\})/);

      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1];
          const commandObj = JSON.parse(jsonStr);

          if (commandObj.type === 'command' && commandObj.action) {
            isCommand = true;
            finalContent = commandObj.message || "Comando executado.";

            // Executa a ação
            onExecuteCommand(commandObj);
            showToast(`⚡ ${finalContent}`);
          }
        } catch (e) {
          console.error("Falha ao parsear JSON detectado:", e);
          // Se falhar o parse, trata como texto normal
        }
      }

      // Se não for comando, mostra a resposta no chat
      // Se for comando, mostra o feedback curto no chat também
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent.replace(/```json[\s\S]*?```/g, '').trim() || finalContent, // Remove o JSON do visual se sobrar
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error: any) {
      console.error("Erro AI:", error);
      showToast("❌ Erro de conexão com IA");
      setMessages(prev => [...prev, { id: 'err', role: 'system', content: `Erro: ${error.message || 'Falha na requisição'}`, timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDERIZAÇÃO ---
  return (
    <>
      {/* 1. BALÃO ROXO (TOAST) - Aparece no meio/topo ou perto da barra */}
      {toastMessage && (
        <div className="agent-toast-bubble">
          <div className="agent-avatar">🟣</div>
          <div className="agent-message">{toastMessage}</div>
        </div>
      )}

      {/* 2. CHAT FLUTUANTE COMPLETO (Só se isOpen) */}
      {isOpen && (
        <div className="agent-history-panel glass-panel">
          <div className="agent-header">
            <h3>Designer Pessoal</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleClearHistory}
                className="close-btn"
                title="Limpar Histórico"
                style={{ color: '#ef4444' }} // Vermelho para perigo/apagar
              >
                <Trash2 size={16} />
              </button>
              <button onClick={onToggle} className="close-btn"><X size={16} /></button>
            </div>
          </div>

          <div className="agent-messages-list">
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255,255,255,0.4)',
                gap: '10px'
              }}>
                <MessageSquare size={32} />
                <p>Histórico limpo.<br />Como posso ajudar?</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.role}`}>
                  <span className="bubble-text">{m.content}</span>
                  <span className="bubble-time">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}

            {isProcessing && <div className="typing-dots">...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="agent-input-area">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ex: Duplicar 5 vezes..."
              disabled={isProcessing}
              autoFocus
            />
            <button onClick={handleSend} disabled={isProcessing || !input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Assistant;
