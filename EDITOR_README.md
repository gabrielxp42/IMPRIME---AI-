# 🎨 Editor de Imagens com Konva.js + SAM

Editor de imagens premium integrado na aplicação Electron, com suporte a **Segment Anything Model (SAM)** para remoção inteligente de fundo.

## ✨ Funcionalidades

### 🖼️ Editor de Canvas
- **Drag & Drop**: Arraste imagens diretamente para o editor
- **Múltiplas camadas**: Adicione várias imagens e organize em camadas
- **Transformações**: Mova, redimensione e rotacione objetos livremente
- **Gerenciamento de camadas**: Visibilidade, bloqueio, reordenação
- **Exportação PNG**: Exporte com fundo transparente

### 🎯 Remoção de Fundo Inteligente
- **Modo Pontos**: Clique para marcar foreground/background
- **Modo Box**: Desenhe uma caixa ao redor do objeto
- **Preview em tempo real**: Visualize a máscara antes de aplicar
- **Refinamento com rembg**: Bordas suaves e detalhes preservados

## 🚀 Como Usar

### 1. Acessar o Editor
Na barra lateral, clique em **✏️ Editor**

### 2. Adicionar Imagens
- Arraste arquivos para a área do canvas, ou
- Clique no botão **➕ Add Image** na toolbar

### 3. Editar Imagens
- **Selecionar**: Clique na imagem
- **Mover**: Arraste a imagem selecionada
- **Redimensionar**: Use os handles nos cantos
- **Duplicar**: `Ctrl+D` ou botão na toolbar
- **Deletar**: `Delete` ou botão na toolbar

### 4. Remover Fundo
1. Selecione uma imagem
2. Clique em **🎯 BG Remove** ou pressione `B`
3. Escolha o modo:
   - **📍 Pontos**: Clique no objeto (verde) ou background (Shift+clique = vermelho)
   - **▭ Box**: Desenhe uma caixa ao redor do objeto
4. Clique em **Generate Mask**
5. Ajuste a opacidade do preview se necessário
6. Clique em **Refine Edges** para melhorar bordas
7. Clique em **Apply & Close** para finalizar

### 5. Exportar
- Clique em **💾 Export** ou `Ctrl+E`
- A imagem será salva como PNG com transparência

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `V` | Ferramenta de seleção |
| `B` | Remoção de fundo |
| `Delete` | Deletar selecionado |
| `Ctrl+D` | Duplicar |
| `Ctrl+E` | Exportar |
| `Esc` | Desselecionar / Fechar |

## 🔧 Backend SAM (Opcional)

Para usar o SAM real (segmentação de alta qualidade), inicie o servidor Python:

```bash
cd src/backend
start_server.bat
```

**Requisitos:**
- Python 3.10+
- 4GB+ RAM (8GB recomendado)
- GPU NVIDIA opcional (mais rápido)

**Modelos baixados automaticamente:**
- SAM ViT-B (~380MB)

Sem o backend, o editor usa fallbacks inteligentes:
- GrabCut (OpenCV) para seleção por box
- Similaridade de cor para seleção por pontos

## 📁 Estrutura de Arquivos

```
src/
├── renderer/src/
│   ├── components/
│   │   ├── EditorView.tsx       # View principal
│   │   └── editor/
│   │       ├── KonvaCanvas.tsx  # Canvas Konva
│   │       ├── Toolbar.tsx      # Barra de ferramentas
│   │       ├── LayerPanel.tsx   # Painel de camadas
│   │       └── BackgroundRemovalTool.tsx
│   └── services/
│       └── sam-api.ts           # Cliente API SAM
│
└── backend/
    ├── sam_server.py            # Servidor FastAPI
    ├── requirements.txt         # Dependências Python
    └── start_server.bat         # Script de inicialização
```

## 🎨 Design

O editor foi projetado com:
- **Dark theme** premium com gradientes
- **Animações suaves** e micro-interações
- **Responsivo** para diferentes tamanhos de tela
- **Acessível** com suporte a teclado
- **Moderno** inspirado em Figma/Canva

---

**Desenvolvido com ❤️ usando Konva.js, React, FastAPI e SAM**
