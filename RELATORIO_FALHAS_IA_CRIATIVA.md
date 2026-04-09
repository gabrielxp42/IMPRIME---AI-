# Relatório de Análise: Estúdio Criativo IA (AICreativePanel)

## Resumo Executivo
A ferramenta "Estúdio Criativo", em seu estado atual, **não atende às necessidades de um fluxo de trabalho profissional de gráfica**. A implementação atual foca em filtros artísticos ("brinquedo") em vez de ferramentas de produção (vetorização, restauração, limpeza), além de apresentar falhas críticas de usabilidade na ferramenta de pincel (brush).

## Falhas Críticas & Bugs

### 1. Ferramentas de Desenho (Brush/Mask) - "Inutilizável"
*   **Cursor Falso**: O cursor visual (círculo roxo) não representa com precisão a área de atuação do pincel. O cálculo de coordenadas sofre de latência e desvios dependendo do zoom/proporção da imagem.
*   **Performance Ruim**: O traço do pincel tem "lag" perceptível, tornando impossível fazer seleções de precisão em bordas de logos ou textos.
*   **Sem Histórico (Undo/Redo)**: Se o usuário errar um traço da máscara, a única opção é "Limpar Tudo". Não existe `Ctrl+Z` para desfazer o último traço.
*   **Slider de Tamanho**: O controle deslizante é impreciso e visualmente desconectado do cursor.

### 2. Funcionalidade & Utilidade - "Foco Errado"
*   **Presets Irrelevantes**: Opções como "Pintura a Óleo", "Cyberpunk" e "Aquarela" são inúteis para finalização de arquivos para impressão e gráfica.
*   **Falta de Ferramentas Reais**: O usuário precisa de:
    *   **Vetorização**: Transformar foto de camiseta/logo em arte chapada.
    *   **Restauração**: Recriar textos "grotescos" com fontes profissionais.
    *   **Limpeza**: Remover fundos complexos (ex: marrom para preto) ou marcas d'água.
*   **Botões "Placebo"**: Os botões "Toque Mágico", "Mudar Ambiente" e "Remover Objeto" são apenas decorativos no código atual; não executam nenhuma ação específica ou prompt otimizado.

### 3. Interface (UI/UX)
*   **Janela "Falsa"**: Os botões de minimizar/maximizar no topo da janela não funcionam, quebrando a expectativa de uma janela flutuante real.
*   **Floating Toolbar Quebrada**: A barra de ferramentas flutuante fica fixa em coordenadas absolutas (`top: 20px`), sobrepondo a imagem de forma desajeitada quando se faz pan/zoom.
*   **Perda de Contexto**: Ao clicar em uma sugestão de estilo, o prompt do usuário é totalmente apagado e substituído, causando perda de trabalho.
*   **Feedback de Máscara**: A cor roxa da máscara dificulta ver o contraste da imagem original abaixo, atrapalhando a precisão.

## Recomendações de Correção Imediata

1.  **Substituir Presets Artísticos por Presets de Produção**:
    *   Criar botões rápidos para: "Vetorizar Logo", "Limpar Fundo", "Melhorar Resolução/Traço", "Remover Texto/Objeto".
2.  **Reescrever a Engine do Pincel**:
    *   Usar cursor nativo ou renderização de alta performance para o brush.
    *   Implementar pilha de histórico (Undo/Redo) real para a máscara.
3.  **Refatorar o Prompting pela IA**:
    *   Configurar o Gemini para atuar como "Designer Restaurador" e não "Artista Criativo". O prompt do sistema deve priorizar fidelidade, traços limpos e cores sólidas (CMYK friendly).
4.  **Interface Profissional**:
    *   Remover elementos "gamer/cyberpunk" desnecessários.
    *   Focar em área de trabalho limpa e controles precisos.

---
**Status**: A ferramenta precisa ser reescrita com foco em **Edição Generativa Técnica** (Inpainting/Img2Img focado em correção) em vez de Filtros Criativos.
