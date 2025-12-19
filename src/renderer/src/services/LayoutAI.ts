import { GoogleGenerativeAI } from '@google/generative-ai';

interface LayoutItem {
    id: string;
    width: number;
    height: number;
    x: number;
    y: number;
}

interface LayoutRequest {
    items: LayoutItem[];
    containerWidth: number;
    containerHeight: number;
    userPrompt: string;
}

interface LayoutResponse {
    items: { id: string; x: number; y: number; width?: number; height?: number }[];
    explanation?: string;
}

class LayoutAIService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    initialize(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    async generateLayout(request: LayoutRequest): Promise<LayoutResponse> {
        if (!this.model) {
            throw new Error("IA não inicializada ou chave API faltando.");
        }

        const prompt = `
        Aja como um especialista em layout gráfico e pre-impressão.
        Eu tenho um canvas de ${request.containerWidth}x${request.containerHeight} pixels.
        Eu tenho os seguintes itens (imagens):
        ${JSON.stringify(request.items, null, 2)}

        O usuário quer: "${request.userPrompt}"

        Retorne APENAS um JSON com as novas coordenadas (x, y) e opcionalmente tamanho (width, height) para cada item pelo ID.
        Não mude o tamanho a menos que pedido explicitamente ou necessário para caber (ex: grid).
        Tente usar o espaço de forma eficiente.
        Formato de resposta: { "items": [ { "id": "...", "x": 0, "y": 0 } ] }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Limpar markdown code blocks se houver
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Erro ao gerar layout com IA:", error);
            throw new Error("Falha ao processar layout inteligente.");
        }
    }
}

export const layoutAI = new LayoutAIService();
