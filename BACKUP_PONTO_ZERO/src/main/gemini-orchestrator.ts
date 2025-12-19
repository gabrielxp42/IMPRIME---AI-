import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiOrchestrator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async orchestrateProcess(filePath: string): Promise<void> {
    const prompt = `
Você é um orquestrador de automação do Photoshop. 
Um arquivo está sendo processado: ${filePath}

O processo deve:
1. Abrir o arquivo no Photoshop
2. Executar a ação "SPOTWHITE-PHOTOSHOP" do conjunto "Mask Processing Economy"
3. Salvar como TIFF com fundo transparente

Verifique se há algum problema potencial e forneça orientações.
Responda apenas com "OK" se tudo estiver correto, ou descreva o problema se houver.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('Gemini Response:', text);

      if (!text.toLowerCase().includes('ok')) {
        console.warn('Gemini detectou possível problema:', text);
      }
    } catch (error) {
      console.error('Erro ao comunicar com Gemini:', error);
      // Não bloquear o processo se o Gemini falhar
    }
  }

  async explainValidationError(errorInfo: {
    file: string;
    errors: string[];
    info?: {
      dpi?: number;
      widthCm?: number;
      heightCm?: number;
    };
  }): Promise<string> {
    const prompt = `
Você é um assistente especializado em ajudar usuários a entender e corrigir erros de validação de imagens para impressão DTF.

O usuário está tendo problemas com o arquivo: ${errorInfo.file}

ERROS ENCONTRADOS:
${errorInfo.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

${errorInfo.info ? `INFORMAÇÕES DO ARQUIVO:
- DPI: ${errorInfo.info.dpi || 'N/A'}
- Largura: ${errorInfo.info.widthCm || 'N/A'} cm
- Altura: ${errorInfo.info.heightCm || 'N/A'} cm` : ''}

CONTEXTO IMPORTANTE:
- O usuário pode estar usando Canva, Photoshop, ou outras ferramentas
- Se mencionar Canva, dê instruções específicas de exportação do Canva
- Seja específico sobre como corrigir no software que o usuário está usando

Sua tarefa:
1. Explique de forma CLARA e SIMPLES o que está errado
2. Explique POR QUE isso é um problema (contextualize para impressão DTF)
3. Forneça passos CONCRETOS e PRÁTICOS para corrigir
   - Se o erro for de DPI baixo, explique como aumentar no software usado
   - Se o erro for de dimensões, explique como ajustar
   - Mencione alternativas (ex: ajustar no Photoshop se exportou do Canva)
4. Seja EMPÁTICO e ENCORAJADOR
5. Use linguagem acessível para iniciantes
6. Se o DPI estiver muito baixo (ex: 76), explique que precisa ser pelo menos 200-300 para impressão de qualidade

Formato da resposta:
- Comece com uma explicação breve e empática do problema
- Liste os passos para corrigir de forma numerada e detalhada
- Mencione ferramentas específicas (Canva, Photoshop, etc.) se relevante
- Termine com uma mensagem encorajadora

IMPORTANTE: 
- Seja específico e prático
- Não use termos técnicos demais
- Dê exemplos concretos
- Se o DPI for muito baixo, explique que isso afeta a qualidade da impressão
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro ao gerar explicação:', error);
      return this.getFallbackExplanation(errorInfo);
    }
  }

  private getFallbackExplanation(errorInfo: {
    errors: string[];
    info?: {
      dpi?: number;
      widthCm?: number;
      heightCm?: number;
    };
  }): string {
    let explanation = '🔍 **Análise do Erro:**\n\n';

    errorInfo.errors.forEach((error, idx) => {
      explanation += `${idx + 1}. ${error}\n\n`;
    });

    explanation += '💡 **O que fazer:**\n\n';

    if (errorInfo.errors.some(e => e.includes('DPI'))) {
      explanation += '• Ajuste a resolução da imagem para entre 200-300 DPI\n';
      explanation += '• No Photoshop: Imagem → Tamanho da Imagem → Resolução\n';
    }

    if (errorInfo.errors.some(e => e.includes('Largura'))) {
      explanation += '• Ajuste a largura para 58cm (±0.5cm)\n';
      explanation += '• No Photoshop: Imagem → Tamanho da Imagem → Largura\n';
    }

    if (errorInfo.errors.some(e => e.includes('Altura'))) {
      explanation += '• Aumente a altura para pelo menos 50cm\n';
      explanation += '• No Photoshop: Imagem → Tamanho da Imagem → Altura\n';
    }

    return explanation;
  }

  async validateBeforeProcessing(filePath: string, validationResults: any[]): Promise<boolean> {
    const prompt = `
Analise os seguintes resultados de validação de arquivos:

${JSON.stringify(validationResults, null, 2)}

Determine se é seguro prosseguir com o processamento Spot White.
Responda apenas com "SIM" ou "NÃO" seguido de uma breve explicação.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim().toUpperCase();

      return text.startsWith('SIM');
    } catch (error) {
      console.error('Erro ao validar com Gemini:', error);
      // Em caso de erro, permitir processamento (fail-safe)
      return true;
    }
  }
}

