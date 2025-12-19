import React, { useState, useRef, useEffect } from 'react';
import './Assistant.css';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AssistantProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  onGetErrorExplanation?: (errorInfo: any) => Promise<string>;
  validationErrors?: Array<{
    file: string;
    errors: string[];
    info?: any;
  }>;
}

const Assistant: React.FC<AssistantProps> = ({ 
  isOpen, 
  onClose, 
  geminiApiKey,
  onGetErrorExplanation,
  validationErrors = []
}) => {
  const getInitialMessage = () => {
    if (validationErrors.length > 0) {
      const errorCount = validationErrors.length;
      const firstError = validationErrors[0];
      const fileName = firstError.file.split('\\').pop() || firstError.file.split('/').pop() || firstError.file;
      return `👋 Olá! Vejo que você tem ${errorCount} arquivo(s) com erro de validação.\n\n📄 **Último erro detectado:**\n${fileName}\n\n❌ **Problemas encontrados:**\n${firstError.errors.slice(0, 2).map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n💡 **Como posso ajudar:**\n• Explicar detalhadamente o que está errado\n• Mostrar passo a passo como corrigir\n• Responder suas dúvidas\n\nPergunte sobre o erro ou digite "explicar erro" para uma análise completa!`;
    }
    return '👋 Olá! Eu sou seu assistente virtual. Posso te ajudar com:\n\n• Explicar erros de validação\n• Guiar você no processo\n• Resolver dúvidas sobre o sistema\n\nComo posso ajudar?';
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: getInitialMessage(),
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Atualizar mensagem inicial quando os erros mudarem
    if (validationErrors.length > 0 && messages.length === 1) {
      const errorCount = validationErrors.length;
      const firstError = validationErrors[0];
      const fileName = firstError.file.split('\\').pop() || firstError.file.split('/').pop() || firstError.file;
      const newMessage = `👋 Olá! Vejo que você tem ${errorCount} arquivo(s) com erro de validação.\n\n📄 **Último erro detectado:**\n${fileName}\n\n❌ **Problemas encontrados:**\n${firstError.errors.slice(0, 2).map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n💡 **Como posso ajudar:**\n• Explicar detalhadamente o que está errado\n• Mostrar passo a passo como corrigir\n• Responder suas dúvidas\n\nPergunte sobre o erro ou digite "explicar erro" para uma análise completa!`;
      
      setMessages([{
        id: '1',
        type: 'assistant',
        content: newMessage,
        timestamp: new Date()
      }]);
    }
  }, [validationErrors]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Resposta padrão ou integração com Gemini
      const response = await getAssistantResponse(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getAssistantResponse = async (query: string): Promise<string> => {
    // Respostas rápidas para perguntas comuns
    const lowerQuery = query.toLowerCase();
    
    // Detectar menções ao Canva e dar instruções específicas
    if (lowerQuery.includes('canva')) {
      if (validationErrors.length > 0 && onGetErrorExplanation) {
        const firstError = validationErrors[0];
        try {
          const explanation = await onGetErrorExplanation(firstError);
          return `🎨 **Você está usando Canva - Perfeito!**\n\nVejo que você está tendo problemas ao exportar do Canva. Aqui está o que está acontecendo:\n\n${explanation}\n\n📐 **Como exportar corretamente do Canva:**\n\n1. No Canva, vá em **"Download"** (canto superior direito)\n2. Escolha o formato **"PNG"** ou **"PDF"**\n3. **IMPORTANTE:** Clique em **"Mais opções"** ou **"Configurações"**\n4. Ajuste as configurações:\n   • **Resolução:** Escolha **"Alta qualidade"** ou configure para **200-300 DPI**\n   • **Tamanho:** Certifique-se de que a largura seja **58cm**\n   • **Altura:** Mínimo de **50cm**\n5. Clique em **"Download"**\n\n💡 **Dica:** Se o Canva não permitir ajustar DPI diretamente, exporte em alta resolução e depois ajuste no Photoshop usando "Imagem → Tamanho da Imagem".\n\nPrecisa de mais ajuda com o Canva?`;
        } catch (error) {
          return `🎨 **Você está usando Canva!**\n\nPara exportar corretamente do Canva:\n\n1. Vá em **Download** → Escolha **PNG** ou **PDF**\n2. Clique em **Mais opções**\n3. Configure:\n   • Resolução: **Alta qualidade** (200-300 DPI)\n   • Largura: **58cm**\n   • Altura: **Mínimo 50cm**\n4. Baixe o arquivo\n\nSe o Canva não permitir ajustar DPI, exporte em alta resolução e ajuste depois no Photoshop.`;
        }
      }
      return `🎨 **Sobre o Canva:**\n\nO Canva é uma ótima ferramenta! Para usar com o Spot White:\n\n**Configurações de Exportação:**\n• Formato: PNG ou PDF\n• Resolução: Alta qualidade (200-300 DPI)\n• Largura: 58cm\n• Altura: Mínimo 50cm\n\n**Passo a passo:**\n1. No Canva, clique em "Download"\n2. Escolha PNG ou PDF\n3. Clique em "Mais opções"\n4. Configure resolução e dimensões\n5. Baixe e use no Spot White\n\nSe tiver erros de validação, me mostre qual erro apareceu!`;
    }
    
    // Se o usuário mencionar erro e houver erros de validação, explicar o primeiro erro
    if ((lowerQuery.includes('erro') || lowerQuery.includes('problema') || lowerQuery.includes('tive um erro') || lowerQuery.includes('explicar erro') || lowerQuery.includes('não entendi')) && validationErrors.length > 0 && onGetErrorExplanation) {
      const firstError = validationErrors[0];
      try {
        const explanation = await onGetErrorExplanation(firstError);
        return explanation;
      } catch (error) {
        return 'Não foi possível gerar explicação detalhada no momento. Verifique os erros listados na interface.';
      }
    }
    
    if (lowerQuery.includes('como usar') || lowerQuery.includes('tutorial')) {
      return `📚 **Como usar o Spot White Automation:**\n\n1️⃣ **Selecionar arquivos** - Clique em "Selecionar arquivos" e escolha suas imagens PNG ou PDF\n\n2️⃣ **Validação automática** - Os arquivos são validados automaticamente (DPI, dimensões)\n\n3️⃣ **Definir pasta de saída** - Escolha onde os arquivos processados serão salvos\n\n4️⃣ **Processar** - Clique em "🚀 Spot White" para iniciar o processamento\n\n💡 **Dica:** Configure o nome do cliente antes de processar para personalizar os nomes dos arquivos!`;
    }
    
    if (lowerQuery.includes('dpi') || lowerQuery.includes('resolução')) {
      return `📐 **Sobre DPI (Resolução):**\n\n• **DPI** significa "Dots Per Inch" (Pontos por Polegada)\n• Valores recomendados: **200-300 DPI**\n• DPI muito baixo = imagem pixelada\n• DPI muito alto = arquivo muito pesado\n\n🔧 **Como ajustar:**\nVá em "Configurações" → "Configurações de Validação" → Ajuste DPI Mínimo e Máximo`;
    }
    
    if (lowerQuery.includes('nome do arquivo') || lowerQuery.includes('formato')) {
      return `📝 **Formato do nome do arquivo:**\n\nOs arquivos processados seguem o formato:\n\n\`\`\`\n(MEDIDA) - (NOME_CLIENTE) - (NOME_ARQUIVO).tiff\n\`\`\`\n\n**Exemplo:**\n\`1M - ADR - IMPRESSAODTF.tiff\`\n\n• **MEDIDA:** Calculada automaticamente pela altura (1M, 2M, etc.)\n• **NOME_CLIENTE:** O que você configurou no campo "Nome do Cliente"\n• **NOME_ARQUIVO:** Nome original do arquivo\n\n💡 Configure o nome do cliente na sidebar antes de processar!`;
    }
    
    if (lowerQuery.includes('photoshop') || lowerQuery.includes('ação')) {
      return `🎨 **Sobre o Photoshop:**\n\n• O Photoshop precisa estar **instalado e em execução**\n• A ação "SPOTWHITE-PHOTOSHOP" deve estar carregada no painel de ações\n• O conjunto de ações deve ser "DTF"\n\n🔧 **Se a ação não for encontrada:**\n1. Abra o Photoshop\n2. Vá em "Janela" → "Ações"\n3. Carregue o conjunto "DTF"\n4. Verifique se a ação "SPOTWHITE-PHOTOSHOP" está disponível`;
    }
    
    if (lowerQuery.includes('gemini') || lowerQuery.includes('api')) {
      return `🔑 **Sobre a Chave API do Gemini:**\n\n• A chave API é **obrigatória** para processar arquivos\n• Ela é usada para análise inteligente das imagens\n• Sua chave é salva localmente (não é enviada para servidores externos)\n\n🔧 **Como obter:**\n1. Acesse: https://makersuite.google.com/app/apikey\n2. Crie uma nova chave API\n3. Cole no campo "Chave API Google Gemini" na sidebar`;
    }

    // Resposta genérica
    return `🤔 Entendi sua pergunta sobre "${query}".\n\nPosso te ajudar com:\n\n• Explicar erros de validação\n• Guiar no processo de uso\n• Resolver problemas técnicos\n• Explicar configurações\n\nFaça uma pergunta mais específica ou me mostre um erro que você está enfrentando!`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Como usar?', query: 'Como usar o sistema?' },
    { label: 'Erro de DPI', query: 'Meu arquivo deu erro de DPI, o que fazer?' },
    { label: 'Formato arquivo', query: 'Como funciona o formato do nome do arquivo?' },
  ];

  if (!isOpen) return null;

  return (
    <div className="assistant-overlay" onClick={onClose}>
      <div className="assistant-container" onClick={(e) => e.stopPropagation()}>
        <div className="assistant-header">
          <div className="assistant-title">
            <div className="assistant-avatar">🤖</div>
            <div>
              <h3>Assistente Virtual</h3>
              <span className="assistant-status">Online</span>
            </div>
          </div>
          <button className="assistant-close" onClick={onClose}>×</button>
        </div>

        <div className="assistant-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message message-${message.type}`}>
              <div className="message-content">
                {message.content.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message message-assistant">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="assistant-quick-actions">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              className="quick-action-button"
              onClick={() => {
                setInputValue(action.query);
                setTimeout(() => handleSend(), 100);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="assistant-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta..."
            className="assistant-input"
            disabled={isTyping}
          />
          <button
            className="assistant-send"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;

