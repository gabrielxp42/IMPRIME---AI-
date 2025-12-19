# IMPLEMENTAÇÃO: Seleção Múltipla + Box Selection + Grupos

## STATUS ATUAL
- ✅ Ctrl+A corrigido
- ❌ Ctrl+Z precisa verificar
- ⏳ Seleção múltipla (em andamento)

## MUDANÇAS NECESSÁRIAS

### 1. Estado (EditorView.tsx linha ~50)
```typescript
// ANTES:
const [selectedId, setSelectedId] = useState<string | null>(null);

// DEPOIS:
const [selectedIds, setSelectedIds] = useState<string[]>([]);
```

### 2. Atalhos a adicionar (linha ~580)
- ✅ Ctrl+A → Selecionar todos
- 🆕 Ctrl+G → Agrupar selecionados
- 🆕 Ctrl+Shift+G → Desagrupar

### 3. KonvaCanvas.tsx
- Adicionar onMouseDown para box selection
- Adicionar lógica Shift+Click

### 4. Tipo ImageElement
- Adicionar `groupId?: string` para agrupamento

## PRÓXIMOS PASSOS
1. Mudar `selectedId` → `selectedIds` (BREAKING CHANGE - precisa atualizar todo o código)
2. Adicionar box selection no canvas
3. Implementar grupos
