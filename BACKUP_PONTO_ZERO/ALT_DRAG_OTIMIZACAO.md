# SOLUÇÃO: Alt+Drag Otimizado

## Problema Atual
Quando usuário pressiona Alt durante drag, o código chama `onDuplicate()` imediatamente, o que:
1. Duplica a imagem no backend (lento)
2. Causa re-render do React (lag)
3. Animação não é fluida

## Solução Otimizada
Usar **ghost node** do Konva (técnica nativa):

### Mudanças em `handleDragStart`:
```typescript
// ANTES:
if (e.evt.altKey && onDuplicate) {
    onDuplicate(true); // ❌ Lag!
}

// DEPOIS:
if (e.evt.altKey && imageRef.current) {
    const ghost = imageRef.current.clone({ opacity: 0.6, listening: false });
    layer.add(ghost);
    isDuplicatingRef.current = { ghost, startPos };
}
```

### Mudanças em `handleDragMove`:
```typescript
// Se tem ghost, move ele ao invés da original
if (isDuplicating && ghost) {
    ghost.position(currentPos);
    node.position(startPos); // Original fica parada
}
```

### Mudanças em `handleDragEnd`:
```typescript
// Só duplicar quando soltar (não durante o drag)
if (isDuplicating && ghost) {
    ghost.destroy(); // Remover visual temporário
    onDuplicate(true); // Agora duplicar de verdade
}
```

## Benefícios
- ✅ 60 FPS fluido
- ✅ Feedback visual instantâneo
- ✅ Duplicação só ao soltar (1x call vs 60x calls)
