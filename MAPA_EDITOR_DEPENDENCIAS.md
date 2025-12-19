# 🗺️ MAPA DE DEPENDÊNCIAS E FLUXOS - EDITOR

> **Documento Complementar** à Análise Completa  
> **Data**: 10/12/2024

---

## 📦 DEPENDÊNCIAS EXTERNAS

### **Produção**

```mermaid
graph TD
    Editor[EditorView] --> React[react ^18.x]
    Editor --> Konva[konva + react-konva]
    Editor --> GoogleAI[@google/generative-ai]
    Editor --> CompareSlider[react-compare-slider]
    Editor --> UseImage[use-image]
    
    Konva --> Canvas[HTML5 Canvas]
    GoogleAI --> GeminiAPI[Gemini 2.5 Flash API]
    
    style Editor fill:#4CAF50,color:#fff
    style Konva fill:#FF9800,color:#fff
    style GoogleAI fill:#2196F3,color:#fff
```

| Dependência | Versão | Uso | Crítica? |
|-------------|--------|-----|----------|
| `react` | 18.x | Framework base | ✅ Sim |
| `konva` | Latest | Renderização canvas | ✅ Sim |
| `react-konva` | Latest | Bindings React↔Konva | ✅ Sim |
| `use-image` | Latest | Hook para carregar imagens | ⚠️ Média |
| `@google/generative-ai` | Latest | Cliente Gemini | ⚠️ Média |
| `react-compare-slider` | Latest | Comparação antes/depois | ❌ Baixa |

### **Desenvolvimento**

```json
{
  "typescript": "^5.x",
  "vite": "^5.x",
  "electron": "^28.x"
}
```

---

## 🔄 FLUXO DE DADOS PRINCIPAL

### **1. Inicialização da Aplicação**

```
App.tsx
  ↓
  Verifica rota /editor
  ↓
  <EditorView geminiApiKey={key} />
  ↓
  useState: documents (vazio)
  ↓
  Mostra Modal de Novo Documento
  ↓
  Usuário cria documento
  ↓
  Renderiza interface completa
```

### **2. Criação de Documento**

```typescript
// ENTRADA
User clicks "Novo Documento"
  ↓
<NewDocumentModal isOpen={true} />
  ↓
Usuário seleciona predefinição ou custom
  ↓
handleCreateDocument(settings: DocumentSettings)

// PROCESSAMENTO
  ↓
generateDocId() → "doc-1702123456-abc123"
  ↓
Cria Document {
    id,
    settings,
    images: [],
    selectedIds: [],
    history: [],
    historyIndex: -1,
    hasUnsavedChanges: false
}
  ↓
setDocuments([...prev, newDoc])
setActiveDocumentId(newDoc.id)

// SAÍDA
  ↓
KonvaCanvas renderiza com documento vazio
Toolbar habilitado
LayerPanel vazio
DocumentSettingsPanel mostra configurações
```

---

## 🖼️ FLUXO DE ADIÇÃO DE IMAGEM

### **Método 1: Upload**

```
User clica "Adicionar Imagem" (Toolbar)
  ↓
triggerAddImage()
  ↓
fileInputRef.current.click()
  ↓
<input type="file" onChange={handleFileInputChange} />
  ↓
handleAddImage(file: File)
  ↓
FileReader.readAsDataURL(file)
  ↓
new Image().onload
  ↓
Calcula dimensões (max 80% da folha)
  ↓
Cria ImageElement {
    id: generateId(),
    src: dataURL,
    x: centralizado,
    y: centralizado,
    width, height,
    rotation: 0,
    scaleX: 1, scaleY: 1,
    visible: true,
    locked: false,
    name: filename
}
  ↓
setImages([...prev, newImage])
saveToHistory()
setSelectedId(newImage.id)
  ↓
KonvaCanvas re-renderiza
LayerPanel adiciona camada
FloatingElementBar aparece
```

### **Método 2: Drag & Drop**

```
User arrasta arquivo sobre a aplicação
  ↓
handleDragOver() → setIsDraggingOver(true)
  ↓
Visual feedback: overlay com "Solte aqui"
  ↓
User solta arquivo
  ↓
handleDrop(e: DragEvent)
  ↓
Filtra files: apenas image/*
  ↓
Para cada file: handleAddImage(file)
  ↓
[mesmo fluxo que Upload]
```

### **Método 3: Clipboard (Ctrl+V)**

```
User pressiona Ctrl+V
  ↓
handlePaste(e: ClipboardEvent)
  ↓
Verifica e.clipboardData.items
  ↓
Encontra item com type.includes('image')
  ↓
item.getAsFile()
  ↓
FileReader.readAsDataURL(blob)
  ↓
[mesmo fluxo que Upload]
```

---

## 🎨 FLUXO DE TRANSFORMAÇÃO DE IMAGEM

### **Movimento (Drag)**

```
User clica e arrasta imagem
  ↓
URLImage.handleDragStart(e)
  ↓
Armazena dragStartPos = { x, y }
  ↓
Se Alt pressionado:
    ↓
    Cria clone visual (Konva)
    ↓
    Clone segue cursor
    ↓
    Ao soltar: onDuplicate({ x, y, sourceId })
Senão:
    ↓
    onSelect(false) → seleciona imagem
    ↓
    handleDragMove(e) a cada movimento
        ↓
        Se Shift pressionado:
            Restringe movimento (H ou V)
        ↓
        Calcula snapping
        ↓
        getGuides() → linhas azuis
        ↓
        Ajusta posição baseado em snapping
    ↓
    handleDragEnd(e)
        ↓
        onTransform(id, { x: finalX, y: finalY })
        ↓
        setImages(updatedImages)
        saveToHistory()
```

### **Escala (Transformer Handles)**

```
User arrasta handle do Transformer
  ↓
URLImage.handleTransform()
  ↓
Em tempo real:
    onTransform({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY()
    })
  ↓
Ao soltar:
    handleTransformEnd()
    ↓
    Normaliza scale para width/height
    ↓
    width = width * scaleX
    height = height * scaleY
    scaleX = 1, scaleY = 1
    ↓
    onTransform({ width, height, scaleX: 1, scaleY: 1 })
    ↓
    setImages(updatedImages)
    saveToHistory()
```

### **Rotação (Transformer)**

```
User arrasta rotator do Transformer
  ↓
handleTransform() atualiza rotation em tempo real
  ↓
handleTransformEnd() salva estado final
  ↓
saveToHistory()
```

---

## 🧠 FLUXO DO ASSISTENTE DE IA

### **Inicialização**

```
EditorView renderiza
  ↓
<AIAssistant
    context={{ selectedId, imagesCount, canvasSize }}
    onExecuteCommand={handleAICommand}
/>
  ↓
Avatar flutuante no canto (posição inicial)
isOpen = false
```

### **Interação do Usuário**

```
User clica no avatar ✨
  ↓
setIsOpen(true)
  ↓
Chat window expande
  ↓
User digita comando: "Repetir 13 vezes"
  ↓
handleSubmit(e)
  ↓
setMessages([...prev, { role: 'user', text: cmd }])
setIsThinking(true)
  ↓
await onExecuteCommand(cmd)
```

### **Processamento do Comando**

```
handleAICommand(command: string)
  ↓
Se geminiApiKey ausente:
    ↓
    Fallback local (regex simples)
    ↓
    Retorna resposta básica
Senão:
    ↓
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    ↓
    Monta contexto:
        - Histórico da conversa (últimos 4 turnos)
        - Elementos atuais (agrupados por tamanho)
        - Seleção atual (dimensões)
        - Dimensões da folha
    ↓
    Monta prompt com comandos JSON
    ↓
    const result = await model.generateContent(prompt)
    ↓
    text = response.text()
    ↓
    actionData = JSON.parse(text)
    ↓
    Para cada ação em actionData:
        ↓
        Switch (action.action):
            case 'fill':
                ↓
                Calcula grid (cols, rows)
                ↓
                Gera newImgs[]
                ↓
                setImages(sanitizeImages(finalImages))
                saveToHistory()
            case 'clear':
                ↓
                setImages([])
                saveToHistory()
            case 'resize':
                ↓
                Converte unidades (cm→px)
                ↓
                Atualiza scaleX, scaleY
                ↓
                setImages(updatedImages)
                saveToHistory()
            case 'remove-background':
                ↓
                Chama window.electronAPI.removeBackgroundBase64()
                ↓
                Atualiza src da imagem
            case 'trim':
                ↓
                trimTransparentPixels(src)
                ↓
                Atualiza width, height, src
            case 'delete':
                ↓
                Remove da lista
            case 'chat':
                ↓
                Retorna action.response
    ↓
    Retorna resultado(s)
  ↓
setMessages([...prev, { role: 'ai', text: result }])
setIsThinking(false)
```

---

## 🎯 FLUXO DE REMOÇÃO DE FUNDO

### **Trigger**

```
Opção 1: User clica 🎯 na Toolbar
  ↓
  Se selectedId existe:
      setShowBackgroundRemoval(true)

Opção 2: User clica 🎯 na FloatingElementBar
  ↓
  onRemoveBackground()
  ↓
  setShowBackgroundRemoval(true)

Opção 3: Comando de IA
  ↓
  action.action === 'remove-background'
  ↓
  Chama electronAPI diretamente OU abre ferramenta
```

### **Modal de Remoção**

```
<BackgroundRemovalTool
    imageSrc={selectedImage.src}
    onApply={handleApplyBackgroundRemoval}
    onCancel={() => setShowBackgroundRemoval(false)}
/>
  ↓
Carrega imagem no canvas
  ↓
User seleciona modo (Rápido ⚡ ou Precisão 🎯)
  ↓
User clica "Remover Fundo"
  ↓
setProcessing(true)
  ↓
Extrai base64 da imagem
  ↓
await window.electronAPI.removeBackgroundBase64(
    base64Data,
    mode === 'precision'  // highPrecision flag
)
  ↓
[Main Process executa Python rembg]
  ↓
Retorna { success, resultBase64, error }
  ↓
Se success:
    processedSrc = `data:image/png;base64,${resultBase64}`
    setResultImage(processedSrc)
    setShowComparison(true)
    ↓
    <ReactCompareSlider> mostra antes/depois
    ↓
    User clica "Aplicar Resultado"
    ↓
    onApply(processedSrc)
  ↓
handleApplyBackgroundRemoval(processedSrc)
  ↓
Tenta auto-trim:
    ↓
    trimResult = await trimTransparentPixels(processedSrc)
    ↓
    Se trimResult:
        Atualiza src, width, height
        Mensagem: "Fundo removido + auto-trim"
    Senão:
        Apenas atualiza src
        Mensagem: "Fundo removido"
  ↓
setImages(updatedImages)
saveToHistory()
setShowBackgroundRemoval(false)
```

---

## ⏮️ FLUXO DE UNDO/REDO

### **Salvando no Histórico**

```
Qualquer operação que muda images:
  ↓
saveToHistory(newImages, selectedId, selectedIds)
  ↓
Se isUndoRedo.current === true:
    ↓
    Ignora (evita loop)
    return
  ↓
Cria newState = {
    images: JSON.parse(JSON.stringify(newImages)),  // Deep clone
    selectedId,
    selectedIds
}
  ↓
Pega histórico atual até historyIndex
  ↓
Adiciona newState
  ↓
Se history.length > MAX_HISTORY (50):
    Shift (remove primeiro)
  ↓
Atualiza document.history
document.historyIndex++
```

### **Undo (Ctrl+Z)**

```
User pressiona Ctrl+Z
  ↓
handleUndo()
  ↓
Se historyIndex <= 0:
    return (nada para desfazer)
  ↓
isUndoRedo.current = true
  ↓
prevState = history[historyIndex - 1]
  ↓
updateActiveDocument({
    images: prevState.images,
    selectedIds: prevState.selectedIds || (prevState.selectedId ? [prevState.selectedId] : []),
    historyIndex: historyIndex - 1
})
  ↓
KonvaCanvas re-renderiza com estado anterior
LayerPanel atualiza
  ↓
showStatus('↩️ Desfeito')
```

### **Redo (Ctrl+Y)**

```
User pressiona Ctrl+Y
  ↓
handleRedo()
  ↓
Se historyIndex >= history.length - 1:
    return (no futuro para refazer)
  ↓
isUndoRedo.current = true
  ↓
nextState = history[historyIndex + 1]
  ↓
updateActiveDocument({
    images: nextState.images,
    selectedIds: nextState.selectedIds || ...,
    historyIndex: historyIndex + 1
})
  ↓
KonvaCanvas re-renderiza com estado futuro
  ↓
showStatus('↪️ Refeito')
```

---

## 💾 FLUXO DE EXPORTAÇÃO

### **Trigger**

```
User clica "💾 Exportar" na Toolbar
  ↓
handleExport()
```

### **Processo**

```
Cria canvas temporário offscreen
  ↓
canvas.width = docSettings.width
canvas.height = docSettings.height
  ↓
Se backgroundColor !== 'transparent':
    ↓
    ctx.fillRect(0, 0, width, height) com cor de fundo
  ↓
Para cada imagem visível (em ordem):
    ↓
    imgElement = new Image()
    imgElement.src = img.src
    ↓
    await imgElement.onload
    ↓
    ctx.save()
    ctx.translate(img.x + img.width/2, img.y + img.height/2)
    ctx.rotate(img.rotation * PI/180)
    ctx.drawImage(
        imgElement,
        -img.width/2 * img.scaleX,
        -img.height/2 * img.scaleY,
        img.width * img.scaleX,
        img.height * img.scaleY
    )
    ctx.restore()
  ↓
dataURL = canvas.toDataURL('image/png')
  ↓
Cria link <a> temporário
link.download = `${docSettings.name || 'imagem'}.png`
link.href = dataURL
  ↓
link.click()
  ↓
Remove link do DOM
  ↓
showStatus('📥 Imagem exportada!')
```

**NOTA**: Processo é **sequencial** (await em loop) - pode ser lento para muitas imagens.

---

## 🔄 FLUXO DE SELEÇÃO MÚLTIPLA

### **Método 1: Shift+Click**

```
User clica com Shift pressionado
  ↓
URLImage.onClick(e)
  ↓
e.evt.shiftKey === true
  ↓
Se onSelectMultiple existe:
    ↓
    currentIds = selectedIds || []
    ↓
    Se image.id já está em currentIds:
        newIds = currentIds.filter(id !== image.id)  // Remove
    Senão:
        newIds = [...currentIds, image.id]  // Adiciona
    ↓
    onSelectMultiple(newIds)
    ↓
    setSelectedIds(newIds)
```

### **Método 2: Box Selection (Shift+Drag no fundo)**

```
User pressiona Shift + clica no fundo vazio
  ↓
handleStageMouseDown(e)
  ↓
Se !isShiftPressed: return
Se !clickedOnEmpty: return
  ↓
stage.draggable(false)  // Desabilita pan
  ↓
selectionStartPos.current = { x, y }
setSelectionRect({ x, y, width: 0, height: 0 })
  ↓
User arrasta mouse
  ↓
handleStageMouseMove(e)
  ↓
Calcula retângulo atual
setSelectionRect({ x, y, width, height })
  ↓
KonvaCanvas renderiza retângulo visual
  ↓
User solta mouse
  ↓
handleStageMouseUp()
  ↓
Para cada imagem:
    ↓
    Verifica interseção com selectionRect
    ↓
    Se intersecta: adiciona ID à lista
  ↓
onSelectMultiple(selectedImagesIds)
  ↓
setSelectedIds(ids)
stage.draggable(true)  // Re-habilita pan
selectionStartPos.current = null
setSelectionRect(null)
```

### **Método 3: Ctrl+A**

```
User pressiona Ctrl+A
  ↓
handleKeyDown: Ctrl+A
  ↓
selectAll()
  ↓
selectedIds = images.map(img => img.id)
  ↓
setSelectedIds(selectedIds)
  ↓
showStatus(`${images.length} elementos selecionados`)
```

---

## 🎛️ FLUXO DE CONFIGURAÇÕES DO DOCUMENTO

### **Mudança de Dimensões**

```
User edita width ou height no DocumentSettingsPanel
  ↓
handleWidthChange(e) ou handleHeightChange(e)
  ↓
Atualiza estado local (widthInput, heightInput)
  ↓
User clica "Aplicar" ou pressiona Enter
  ↓
handleApply()
  ↓
Converte de cm para px (se unit === 'cm')
  ↓
onSettingsChange({ width: newPx, height: newPx })
  ↓
updateActiveDocument(doc => ({
    ...doc,
    settings: { ...doc.settings, width: newPx, height: newPx }
}))
  ↓
KonvaCanvas re-renderiza com novo tamanho
CheckerboardBackground ajusta
Snapping guides recalculadas
```

### **Mudança de DPI**

```
User seleciona novo DPI no dropdown
  ↓
onChange={(e) => onSettingsChange({ dpi: parseInt(e.target.value) })}
  ↓
updateActiveDocument(doc => ({
    ...doc,
    settings: { ...doc.settings, dpi: newDpi }
}))
  ↓
FloatingElementBar recalcula conversões cm↔px
```

### **Predefinições**

```
User clica em predefinição (ex: "A4 Retrato")
  ↓
handlePresetClick(preset)
  ↓
setWidthInput(pxToCm(preset.width))
setHeightInput(pxToCm(preset.height))
setDpi(preset.dpi)
  ↓
Chama handleApply() automaticamente
  ↓
Atualiza documento com novos settings
```

---

## 🧩 FLUXO DE GERENCIAMENTO DE CAMADAS

### **Reordenação (Drag & Drop)**

```
User arrasta camada no LayerPanel
  ↓
handleDragStart(e, id)
  ↓
setDraggedId(id)
  ↓
User passa sobre outra camada
  ↓
handleDragOver(e)
  ↓
Visual feedback (hover state)
  ↓
User solta
  ↓
handleDrop(e, targetId)
  ↓
draggedIndex = images.findIndex(img => img.id === draggedId)
targetIndex = images.findIndex(img => img.id === targetId)
  ↓
newOrder = [...images]
newOrder.splice(draggedIndex, 1)  // Remove
newOrder.splice(targetIndex, 0, draggedItem)  // Insere
  ↓
onReorder(newOrder)
  ↓
setImages(newOrder)
saveToHistory()
  ↓
KonvaCanvas re-renderiza
Layer order atualizada (z-index)
```

### **Toggle Visibilidade**

```
User clica ícone 👁️ na camada
  ↓
onClick={(e) => { e.stopPropagation(); onToggleVisibility(id); }}
  ↓
handleToggleVisibility(id)
  ↓
newImages = images.map(img =>
    img.id === id ? { ...img, visible: !img.visible } : img
)
  ↓
setImages(newImages)
saveToHistory()
  ↓
KonvaCanvas: URLImage com visible=false retorna null
Imagem desaparece do canvas
```

### **Lock/Unlock**

```
User clica ícone 🔒 na camada
  ↓
onToggleLock(id)
  ↓
handleToggleLock(id)
  ↓
newImages = images.map(img =>
    img.id === id ? { ...img, locked: !img.locked } : img
)
  ↓
setImages(newImages)
saveToHistory()
  ↓
KonvaCanvas: <KonvaImage draggable={!image.locked} />
Imagem não pode mais ser movida/editada
Transformer não anexa
```

---

## 📱 FLUXO DE MÚLTIPLOS DOCUMENTOS

### **Criação de Documento Adicional**

```
User clica "+" na barra de DocumentTabs
  ↓
onNewDocument()
  ↓
setShowNewDocModal(true)
  ↓
[mesmo fluxo de criação inicial]
  ↓
Novo documento adicionado a documents[]
setActiveDocumentId(newDoc.id)
```

### **Troca de Documento**

```
User clica em outra aba
  ↓
onSelectDocument(id)
  ↓
setActiveDocumentId(id)
  ↓
React re-renderiza:
    activeDocument = documents.find(d => d.id === id)
    images = activeDocument.images
    selectedIds = activeDocument.selectedIds
    docSettings = activeDocument.settings
  ↓
KonvaCanvas re-renderiza com novo documento
LayerPanel mostra camadas do novo documento
DocumentSettingsPanel mostra settings do novo documento
```

### **Fechamento de Documento**

```
User clica "×" na aba
  ↓
onCloseDocument(id)
  ↓
Se hasUnsavedChanges:
    ⚠️ Atualmente não há confirmação (TODO)
  ↓
setDocuments(prev => prev.filter(d => d.id !== id))
  ↓
Se id === activeDocumentId:
    ↓
    Se remaining.length > 0:
        setActiveDocumentId(remaining[ultimo].id)
    Senão:
        setActiveDocumentId(null)
        setShowNewDocModal(true)  // Força criar novo
```

---

## 🔌 INTEGRAÇÃO ELECTRON IPC

### **Handlers Disponíveis**

```typescript
// Definidos no Main Process
interface ElectronAPI {
    removeBackgroundBase64: (
        base64: string, 
        highPrecision: boolean
    ) => Promise<{
        success: boolean;
        resultBase64?: string;
        error?: string;
    }>;
    
    readFileAsDataUrl: (
        filePath: string
    ) => Promise<string>;
}
```

### **Fluxo de IPC**

```
Renderer Process (EditorView)
  ↓
window.electronAPI.removeBackgroundBase64(base64, false)
  ↓
[Bridge - preload.ts]
ipcRenderer.invoke('remove-background-base64', base64, false)
  ↓
Main Process (main/index.ts)
  ↓
ipcMain.handle('remove-background-base64', async (event, base64, highPrecision) => {
    // Salva arquivo temporário
    const tempInput = `${tmpdir}/input.png`
    fs.writeFileSync(tempInput, Buffer.from(base64, 'base64'))
    
    // Executa Python
    const pythonScript = isDev
        ? 'scripts/background_remover.py'
        : path.join(process.resourcesPath, 'background_remover.exe')
    
    const args = highPrecision
        ? [tempInput, tempOutput, '--precision']
        : [tempInput, tempOutput]
    
    execFile(pythonScript, args, (error, stdout, stderr) => {
        if (error) return { success: false, error: stderr }
        
        const result = fs.readFileSync(tempOutput)
        return { 
            success: true, 
            resultBase64: result.toString('base64') 
        }
    })
})
  ↓
Retorna para Renderer Process
```

---

## 🎯 PONTOS DE EXTENSÃO

### **Para Adicionar Nova Ferramenta**

1. **Definir tipo**:
```typescript
// Toolbar.tsx
type Tool = 'select' | 'crop' | 'text' | 'shapes' | ...;
```

2. **Adicionar botão**:
```typescript
const tools = [
    { id: 'text', label: 'Texto', icon: 'T', tooltip: 'Adicionar Texto (T)' }
];
```

3. **Handler em EditorView**:
```typescript
useEffect(() => {
    if (activeTool === 'text') {
        handleAddText();
        setActiveTool('select');
    }
}, [activeTool]);
```

### **Para Adicionar Novo Comando de IA**

1. **Documentar no prompt**:
```typescript
// handleAICommand
const prompt = `
...
3. ADICIONAR TEXTO:
{
    "action": "add-text",
    "text": "...",
    "fontSize": number,
    "x": number,
    "y": number
}
`;
```

2. **Handler no switch**:
```typescript
if (action.action === 'add-text') {
    const newText: TextElement = {
        id: generateId(),
        type: 'text',
        text: action.text,
        ...
    };
    // Adiciona à lista
}
```

### **Para Adicionar Novo Tipo de Elemento**

1. **Estender interface**:
```typescript
interface TextElement {
    id: string;
    type: 'text';
    text: string;
    fontSize: number;
    fontFamily: string;
    fill: string;
    x: number;
    y: number;
    rotation: number;
}

type CanvasElement = ImageElement | TextElement | ShapeElement;
```

2. **Renderizar em KonvaCanvas**:
```typescript
{elements.map(element => {
    if (element.type === 'image') {
        return <URLImage key={element.id} image={element} />
    }
    if (element.type === 'text') {
        return <Text key={element.id} {...element} />
    }
})}
```

---

## 🔍 DEBUGGING & MONITORAMENTO

### **Logs Estratégicos**

```typescript
// EditorView.tsx - Linha 806-1272 (handleAICommand)
console.log("🤖 Comando AI recebido:", command);
console.log(`[AI-ACTION ${index}/${actions.length}] Executando:`, action.action);

// KonvaCanvas.tsx
console.log('[ALT+DRAG] DragStart, altKey:', e.evt.altKey);
console.log('[SPACING] Guias encontradas:', spacingGuides.length);

// BackgroundRemovalTool.tsx
console.log('[ALT+DRAG] Chamando onDuplicate com posição:', finalX, finalY, image.id);
```

### **Performance Tracking**

```typescript
// Sugestão: adicionar em operações críticas
console.time('export-image');
await handleExport();
console.timeEnd('export-image');

console.time('ai-command');
const result = await handleAICommand(command);
console.timeEnd('ai-command');
```

### **Error Tracking**

```typescript
// Atual: try/catch básicos
try {
    // ...
} catch (error) {
    console.error('Erro:', error);
    showStatus('❌ Erro');
}

// Sugestão: Sentry integration
Sentry.captureException(error, {
    tags: { module: 'editor', action: 'remove-background' },
    extra: { imageId, mode }
});
```

---

## 📊 ESTADO GLOBAL DA APLICAÇÃO

### **Hierarquia de Estado**

```
EditorView (Top-level)
├── documents: Document[]
├── activeDocumentId: string | null
├── showNewDocModal: boolean
├── activeTool: Tool
├── showBackgroundRemoval: boolean
├── isLoading: boolean
├── statusMessage: string | null
├── isDraggingOver: boolean
├── pendingFiles: File[]
└── aiHistory: {}[]

Document (Per-document state)
├── id: string
├── settings: DocumentSettings
│   ├── width: number
│   ├── height: number
│   ├── dpi: number
│   ├── backgroundColor: string
│   └── name: string
├── images: ImageElement[]
├── selectedIds: string[]
├── history: HistoryState[]
├── historyIndex: number
└── hasUnsavedChanges: boolean

KonvaCanvas (Local UI state)
├── scale: number
├── stagePos: { x, y }
├── containerSize: { width, height }
├── isShiftPressed: boolean
├── isDraggingFile: boolean
├── guides: SnapLine[]
├── spacingGuides: SpacingGuide[]
└── selectionRect: {...} | null
```

---

## 🎓 PADRÕES E CONVENÇÕES

### **Nomenclatura**

- **Componentes**: PascalCase (`KonvaCanvas`, `LayerPanel`)
- **Hooks**: camelCase com prefixo `use` (`useImage`, `useCallback`)
- **Handlers**: camelCase com prefixo `handle` (`handleTransform`, `handleDuplicate`)
- **Props**: camelCase (`selectedId`, `onTransform`)
- **Types/Interfaces**: PascalCase (`ImageElement`, `Tool`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_HISTORY`)

### **Estrutura de Arquivos**

```
ComponentName.tsx
ComponentName.css
```

### **Imports**

```typescript
// Libs externas primeiro
import React, { useState } from 'react';
import Konva from 'konva';

// Componentes locais
import LayerPanel from './editor/LayerPanel';

// Utils
import { trimTransparentPixels } from '../utils/imageProcessing';

// Estilos
import './EditorView.css';
```

---

**Última Atualização**: 2024-12-10 08:51 BRT
