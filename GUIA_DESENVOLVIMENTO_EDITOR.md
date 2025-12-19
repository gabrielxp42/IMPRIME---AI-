# 🚀 GUIA DE DESENVOLVIMENTO - EDITOR

> **Para trabalhar exclusivamente no módulo Editor**  
> **Data**: 10/12/2024

---

## 📋 RESUMO EXECUTIVO

Você está trabalhando **exclusivamente** no módulo **Editor** da aplicação. Este documento serve como seu guia de referência rápida para desenvolvimento focado e isolado.

### ✅ **O que você PODE fazer**:
- Modificar qualquer arquivo em `src/renderer/src/components/editor/`
- Modificar `src/renderer/src/components/EditorView.tsx`
- Modificar utils relacionados (`snapping.ts`, `imageProcessing.ts`)
- Adicionar novos componentes dentro do módulo Editor
- Melhorar UX/UI do editor
- Adicionar funcionalidades ao editor
- Otimizar performance do canvas

### ❌ **O que você NÃO PODE fazer**:
- Modificar outros módulos (Upscayl, Effects, Spot White)
- Alterar rotas principais da aplicação
- Modificar configurações globais do Electron
- Quebrar APIs existentes (manter compatibilidade)

---

## 📁 ARQUIVOS DO SEU ESCOPO

### **Componentes Principais**
```
src/renderer/src/components/
├── EditorView.tsx              ← SEU COMPONENTE RAIZ
└── editor/
    ├── KonvaCanvas.tsx         ← Canvas principal
    ├── Toolbar.tsx             ← Barra de ferramentas
    ├── LayerPanel.tsx          ← Painel de camadas
    ├── FloatingElementBar.tsx  ← Barra flutuante
    ├── DocumentSettingsPanel.tsx ← Configurações
    ├── DocumentTabs.tsx        ← Abas de documentos
    ├── NewDocumentModal.tsx    ← Modal de criação
    ├── BackgroundRemovalTool.tsx ← Remoção de fundo
    ├── AIAssistant.tsx         ← Assistente de IA
    └── [CSS correspondentes]
```

### **Utilitários**
```
src/renderer/src/utils/
├── snapping.ts                 ← Sistema de guias magnéticas
└── imageProcessing.ts          ← Processamento de imagem
```

### **Estilos**
```
src/renderer/src/components/editor/
├── KonvaCanvas.css
├── Toolbar.css
├── LayerPanel.css
├── FloatingElementBar.css
├── DocumentSettingsPanel.css
├── DocumentTabs.css
├── NewDocumentModal.css
├── BackgroundRemovalTool.css
└── AIAssistant.css
```

---

## 🎯 PRIORIDADES DE TRABALHO

### **SPRINT 1: Estabilização** (Esta Semana)

#### 1. Implementar Sistema de Grupos (Alta Prioridade)
**Arquivos a modificar**:
- `EditorView.tsx`: Remover "Em breve!" e implementar lógica
- `KonvaCanvas.tsx`: Suporte a elementos agrupados
- Novo: `editor/GroupElement.tsx`

**Checklist**:
- [ ] Criar interface `GroupElement`
- [ ] Modificar `CanvasElement` para união de tipos
- [ ] Implementar `handleGroupSelection()`
- [ ] Implementar `handleUngroupSelection()`
- [ ] Adicionar indicador visual de grupo no LayerPanel
- [ ] Transformações coordenadas ao mover grupo
- [ ] Testes manuais

**Exemplo de código**:
```typescript
// EditorView.tsx
interface GroupElement {
    id: string;
    type: 'group';
    children: string[];
    x: number;
    y: number;
    rotation: number;
    visible: boolean;
    locked: boolean;
    name?: string;
}

type CanvasElement = ImageElement | GroupElement;

const handleGroupSelection = useCallback(() => {
    if (selectedIds.length < 2) {
        showStatus('⚠️ Selecione 2+ elementos para agrupar');
        return;
    }
    
    const selectedElements = images.filter(img => selectedIds.includes(img.id));
    
    // Calcular bounding box
    let minX = Infinity, minY = Infinity;
    selectedElements.forEach(el => {
        if (el.x < minX) minX = el.x;
        if (el.y < minY) minY = el.y;
    });
    
    const newGroup: GroupElement = {
        id: generateId(),
        type: 'group',
        children: selectedIds,
        x: minX,
        y: minY,
        rotation: 0,
        visible: true,
        locked: false,
        name: `Grupo ${selectedIds.length}`
    };
    
    // Adiciona grupo e remove seleção
    setImages(prev => [...prev.filter(img => !selectedIds.includes(img.id)), newGroup]);
    setSelectedIds([newGroup.id]);
    saveToHistory();
    showStatus(`✅ ${selectedIds.length} elementos agrupados`);
}, [selectedIds, images]);
```

---

#### 2. Implementar Crop Tool (Alta Prioridade)
**Arquivos a criar/modificar**:
- Novo: `editor/CropTool.tsx`
- Novo: `editor/CropTool.css`
- `EditorView.tsx`: Handler para crop
- `Toolbar.tsx`: Ativar botão de crop

**Checklist**:
- [ ] Criar modal de crop com preview
- [ ] Retângulo de seleção de área
- [ ] Toggle lock ratio (proporção)
- [ ] Predefinições (1:1, 16:9, 4:3)
- [ ] Rotação + crop combinados
- [ ] Aplicar crop (gera nova imagem)
- [ ] Testes

**Interface do componente**:
```typescript
interface CropToolProps {
    imageSrc: string;
    onApply: (croppedSrc: string) => void;
    onCancel: () => void;
}
```

---

#### 3. Auto-Save Local (Alta Prioridade)
**Arquivos a modificar**:
- `EditorView.tsx`: Adicionar efeito de auto-save

**Checklist**:
- [ ] useEffect com intervalo de 30 segundos
- [ ] Salvar em localStorage (`doc-${id}`)
- [ ] Carregar documentos salvos ao inicializar
- [ ] Limpar documentos antigos (>7 dias)
- [ ] Indicador visual de "Salvo por último às HH:MM"

**Código**:
```typescript
// Auto-save a cada 30 segundos
useEffect(() => {
    if (!activeDocument) return;
    
    const saveInterval = setInterval(() => {
        if (activeDocument.hasUnsavedChanges) {
            try {
                localStorage.setItem(
                    `doc-autosave-${activeDocument.id}`,
                    JSON.stringify({
                        ...activeDocument,
                        savedAt: Date.now()
                    })
                );
                console.log('✅ Auto-save realizado');
            } catch (error) {
                console.error('❌ Erro no auto-save:', error);
            }
        }
    }, 30000); // 30 segundos
    
    return () => clearInterval(saveInterval);
}, [activeDocument]);

// Carregar ao inicializar
useEffect(() => {
    const savedKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('doc-autosave-')
    );
    
    const savedDocs: Document[] = savedKeys.map(key => {
        try {
            return JSON.parse(localStorage.getItem(key)!);
        } catch {
            localStorage.removeItem(key);
            return null;
        }
    }).filter(Boolean);
    
    if (savedDocs.length > 0) {
        // Perguntar ao usuário se quer recuperar
        const recover = confirm(`Encontrei ${savedDocs.length} documento(s) salvos. Deseja recuperar?`);
        if (recover) {
            setDocuments(savedDocs);
            setActiveDocumentId(savedDocs[0].id);
        }
    }
}, []);
```

---

### **SPRINT 2: Funcionalidades Core** (Próxima Semana)

#### 4. Exportação Avançada
**Arquivos**:
- Novo: `editor/ExportModal.tsx`
- `EditorView.tsx`: Substituir `handleExport`

**Features**:
- [ ] Escolha de formato (PNG, JPG, SVG)
- [ ] Configuração de qualidade (1-100)
- [ ] Opção: "Apenas selecionados"
- [ ] Opção: "Cada camada separadamente"
- [ ] Opção: "Com/sem fundo"
- [ ] Progress bar durante exportação

---

#### 5. Adicionar Texto
**Arquivos**:
- Novo: `editor/TextElement.tsx`
- Novo: `editor/TextToolbar.tsx`
- `EditorView.tsx`: Integração
- `KonvaCanvas.tsx`: Renderizar texto

**Features**:
- [ ] Caixa de texto editável
- [ ] Seleção de fonte (Google Fonts?)
- [ ] Tamanho, cor, alinhamento
- [ ] Efeitos: sombra, outline
- [ ] Transformações preservando legibilidade

---

### **SPRINT 3: Efeitos e Filtros** (Semana 3)

#### 6. Painel de Efeitos
**Arquivos**:
- Novo: `editor/EffectsPanel.tsx`
- Novo: `utils/imageEffects.ts`

**Efeitos Iniciais**:
- [ ] Blur
- [ ] Brightness/Contrast
- [ ] Saturação
- [ ] Filtro B&W
- [ ] Filtro Sepia

---

## 🛠️ PADRÕES DE CÓDIGO

### **Criando um Novo Componente**

```typescript
// editor/MeuComponente.tsx
import React, { useState, useCallback } from 'react';
import './MeuComponente.css';

interface MeuComponenteProps {
    // Props aqui
    onAction: () => void;
}

/**
 * Breve descrição do componente
 * 
 * @example
 * <MeuComponente onAction={() => console.log('ação')} />
 */
const MeuComponente: React.FC<MeuComponenteProps> = ({ onAction }) => {
    // Estado local
    const [localState, setLocalState] = useState(false);
    
    // Handlers
    const handleClick = useCallback(() => {
        setLocalState(true);
        onAction();
    }, [onAction]);
    
    return (
        <div className="meu-componente">
            <button onClick={handleClick}>
                Clique aqui
            </button>
        </div>
    );
};

export default MeuComponente;
```

### **Adicionando ao EditorView**

```typescript
// EditorView.tsx

// 1. Import
import MeuComponente from './editor/MeuComponente';

// 2. Estado (se necessário)
const [showMeuComponente, setShowMeuComponente] = useState(false);

// 3. Handler
const handleMeuComponente = useCallback(() => {
    // Lógica aqui
}, [dependencies]);

// 4. Render
return (
    <div className="editor-view">
        {/* ... outros componentes */}
        
        {showMeuComponente && (
            <MeuComponente 
                onAction={handleMeuComponente}
                onClose={() => setShowMeuComponente(false)}
            />
        )}
    </div>
);
```

---

## 🧪 TESTANDO SUAS MUDANÇAS

### **Checklist de Testes Manuais**

Antes de considerar uma feature completa:

#### ✅ **Funcionalidade Básica**
- [ ] A feature funciona conforme esperado?
- [ ] Edge cases cobertos? (ex: sem imagem selecionada)
- [ ] Mensagens de erro amigáveis?

#### ✅ **Undo/Redo**
- [ ] Ação salva no histórico?
- [ ] Ctrl+Z desfaz corretamente?
- [ ] Ctrl+Y refaz corretamente?

#### ✅ **Seleção Múltipla**
- [ ] Funciona com 1 elemento?
- [ ] Funciona com 2+ elementos?
- [ ] Funciona com 0 elementos (desabilitado)?

#### ✅ **Performance**
- [ ] Lag visível ao usar?
- [ ] Console mostra erros?
- [ ] Memory leaks? (abrir DevTools → Performance)

#### ✅ **UX**
- [ ] Loading states claros?
- [ ] Feedback visual ao usuário?
- [ ] Tooltips informativos?
- [ ] Atalhos de teclado documentados?

#### ✅ **Integração**
- [ ] Não quebrou outras features?
- [ ] LayerPanel atualiza corretamente?
- [ ] FloatingElementBar mostra botões corretos?
- [ ] DocumentTabs funcionam?

---

## 🐛 DEBUGGING

### **Console Logs Úteis**

```typescript
// Estado atual
console.log('[DEBUG] Estado atual:', {
    activeDocumentId,
    imagesCount: images.length,
    selectedIds,
    historyIndex
});

// Antes/Depois de operação
console.log('[BEFORE] Images:', images);
handleOperacao();
console.log('[AFTER] Images:', images);

// Performance
console.time('operacao-pesada');
await operacaoPesada();
console.timeEnd('operacao-pesada');
```

### **React DevTools**

1. Abra DevTools (F12)
2. Aba "Components"
3. Selecione `EditorView`
4. Veja props e state em tempo real

### **Konva DevTools**

```typescript
// No KonvaCanvas, adicione:
useEffect(() => {
    if (stageRef.current) {
        console.log('Konva Stage:', stageRef.current);
        console.log('Konva Layer:', stageRef.current.children[0]);
    }
}, []);

// Para inspecionar nó específico:
const node = stageRef.current?.findOne('#img-123');
console.log('Node attrs:', node?.attrs);
```

---

## 📝 COMMIT MESSAGES

Siga o padrão:

```
tipo(escopo): descrição curta

Descrição longa opcional explicando o que mudou e por quê.

Refs: #issue-number
```

**Tipos**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração de código
- `style`: Mudanças de estilo/formatação
- `perf`: Melhoria de performance
- `test`: Adição de testes
- `docs`: Documentação

**Exemplos**:
```
feat(editor): adiciona sistema de grupos

Implementa Ctrl+G para agrupar elementos e Ctrl+Shift+G para desagrupar.
Grupos podem ser movidos e transformados como unidade.

Refs: #42

---

fix(editor): corrige bug de undo após duplicação

O undo não funcionava corretamente após Alt+Drag porque o sourceId
não era salvo no histórico.

Refs: #57

---

perf(editor): otimiza exportação de imagens

Carrega imagens em paralelo ao invés de sequencial, reduzindo
tempo de exportação de ~10s para ~2s com 20 imagens.
```

---

## 🎨 GUIA DE ESTILO CSS

### **Nomenclatura BEM**

```css
/* Bloco */
.meu-componente { }

/* Elemento */
.meu-componente__titulo { }
.meu-componente__botao { }

/* Modificador */
.meu-componente--ativo { }
.meu-componente__botao--primario { }
```

### **Variáveis CSS (use as existentes)**

```css
:root {
    --primary-color: #4CAF50;
    --secondary-color: #2196F3;
    --text-color: #333;
    --bg-color: #fff;
    --border-radius: 8px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
}

.meu-componente {
    background: var(--bg-color);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
}
```

### **Responsividade**

```css
/* Mobile first */
.meu-componente {
    width: 100%;
}

/* Tablet */
@media (min-width: 768px) {
    .meu-componente {
        width: 50%;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .meu-componente {
        width: 33%;
    }
}
```

---

## 📚 RECURSOS DE REFERÊNCIA

### **Documentação**

- [Konva.js Docs](https://konvajs.org/docs/)
- [React Konva](https://konvajs.org/docs/react/)
- [Google Gemini API](https://ai.google.dev/tutorials/web_quickstart)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### **Exemplos Konva**

```typescript
// Image com filtros
<Image
    image={img}
    filters={[Konva.Filters.Blur]}
    blurRadius={10}
/>

// Grupo
<Group draggable>
    <Rect />
    <Circle />
</Group>

// Texto
<Text
    text="Hello"
    fontSize={30}
    fontFamily="Arial"
    fill="black"
/>

// Forma customizada
<Shape
    sceneFunc={(ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(100, 100);
        ctx.stroke();
    }}
/>
```

---

## 🔥 DICAS PARA PRODUTIVIDADE

### **1. Hot Reload**
O `npm run dev` já tem hot reload. Se não funcionar:
```bash
# Reinicie o servidor
npm run dev
```

### **2. TypeScript Strict Mode**
Já está ativado. Se der erro de tipo, corrija! Não use `any`.

### **3. VS Code Extensions Úteis**
- **ES7+ React/Redux/React-Native snippets**: `rafce` → componente
- **Auto Rename Tag**: Renomeia tags JSX automaticamente
- **Error Lens**: Mostra erros inline
- **Prettier**: Formatação automática

### **4. Snippets Úteis**

```json
// .vscode/snippets.json
{
    "React Functional Component": {
        "prefix": "rfc",
        "body": [
            "import React from 'react';",
            "import './${1:ComponentName}.css';",
            "",
            "interface ${1:ComponentName}Props {",
            "    $2",
            "}",
            "",
            "const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ $3 }) => {",
            "    return (",
            "        <div className=\"${1/(.*)/${1:/downcase}/}\">",
            "            $4",
            "        </div>",
            "    );",
            "};",
            "",
            "export default ${1:ComponentName};"
        ]
    }
}
```

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### **1. "Cannot read property 'x' of null"**
```typescript
// ❌ Ruim
const img = images.find(i => i.id === selectedId);
img.x = 100;  // ERRO se não encontrou

// ✅ Bom
const img = images.find(i => i.id === selectedId);
if (img) {
    img.x = 100;
}
```

### **2. "Maximum update depth exceeded"**
```typescript
// ❌ Causa loop infinito
useEffect(() => {
    setImages([...images, newImage]);
}, [images]);  // Depende de si mesmo!

// ✅ Correto
useEffect(() => {
    setImages(prev => [...prev, newImage]);
}, []);  // Sem dependência
```

### **3. "Cannot update during render"**
```typescript
// ❌ Ruim (setState durante render)
function MyComponent() {
    setLocalState(true);  // ERRO
    return <div>...</div>;
}

// ✅ Bom (setState em handler ou useEffect)
function MyComponent() {
    useEffect(() => {
        setLocalState(true);
    }, []);
    
    return <div>...</div>;
}
```

### **4. Konva não renderiza imagem**
```typescript
// ❌ Esqueceu de esperar carregar
<KonvaImage image={img} />  // img pode ser undefined

// ✅ Hook use-image
const [img] = useImage(src, 'anonymous');
if (!img) return null;
return <KonvaImage image={img} />;
```

---

## 📞 QUANDO PEDIR AJUDA

### **Antes de pedir ajuda, verifique**:
1. ✅ Li a documentação relevante?
2. ✅ Procurei no código existente por exemplo similar?
3. ✅ Chequei o console por erros?
4. ✅ Tentei debugar com console.log?
5. ✅ Pesquisei no Google/StackOverflow?

### **Como pedir ajuda efetivamente**:
```markdown
## Problema
[Descrição clara do que você está tentando fazer]

## O que tentei
[Código que você testou]

## Erro/Comportamento atual
[Mensagem de erro ou comportamento inesperado]

## Comportamento esperado
[O que deveria acontecer]

## Screensho/Console
[Se aplicável, imagem ou log do console]
```

---

## ✅ CHECKLIST DIÁRIO

Ao começar o dia:
- [ ] `git pull` (atualizar código)
- [ ] `npm install` (caso tenha novas dependências)
- [ ] `npm run dev` (iniciar servidor)
- [ ] Revisar ANALISE_COMPLETA_EDITOR.md para contexto
- [ ] Escolher 1 task do Sprint atual

Durante desenvolvimento:
- [ ] Commits frequentes (a cada feature pequena)
- [ ] Testar após cada mudança
- [ ] Manter console limpo (sem warnings)

Antes de finalizar:
- [ ] Testes manuais completos
- [ ] Commit final com mensagem descritiva
- [ ] Atualizar este documento se necessário

---

## 🎯 PRÓXIMA SESSÃO DE TRABALHO

**Tarefa Sugerida**: Implementar Sistema de Grupos

**Tempo Estimado**: 3-4 horas

**Passos**:
1. Criar interface `GroupElement` (30 min)
2. Modificar `EditorView.tsx` para handleGroupSelection (1h)
3. Modificar `KonvaCanvas.tsx` para renderizar grupos (1h)
4. Atualizar `LayerPanel.tsx` com indicador visual (30 min)
5. Testes completos (1h)

**Dúvidas Frequentes**:
- **Como agrupar visualmente?** Use `<Group>` do Konva
- **Como salvar no histórico?** Chama `saveToHistory()` após agrupar
- **Como desfazer?** Ctrl+Z já funciona, só precisa ter salvo corretamente

---

## 📌 LEMBRETES IMPORTANTES

1. **Sempre teste Undo/Redo** após implementar nova feature
2. **Não quebre compatibilidade** com histórico antigo
3. **Mantenha foco no Editor** - não altere outros módulos
4. **Documente decisões técnicas** (comentários no código)
5. **Performance importa** - evite re-renders desnecessários

---

**Última Atualização**: 2024-12-10 08:51 BRT

**Próxima Revisão**: Após implementação do Sistema de Grupos
