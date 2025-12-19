# 🎨 Sistema Híbrido de Remoção de Fundo - Documentação Final

## 📋 Visão Geral

O sistema implementa **dois modos de remoção de fundo**, cada um otimizado para casos de uso específicos:

### 1. **Modo Padrão (Rápido)** - `rembg`
- **Biblioteca**: `rembg` com modelo `u2net`
- **Velocidade**: ⚡ Rápido (segundos)
- **Uso**: 80-90% dos casos
- **Ideal para**: Objetos simples, produtos, logos básicos
- **Botão**: "✂️ Remover Fundo"

### 2. **Modo Alta Precisão** - `InSPyReNet`
- **Biblioteca**: `transparent-background` (InSPyReNet)
- **Velocidade**: 🐢 Moderado (10-30 segundos)
- **Uso**: 10-20% dos casos complexos
- **Ideal para**: Cabelos, pelos, transparências, detalhes finos
- **Botão**: "✨ Alta Precisão"

---

## 🏗️ Arquitetura

### **Backend (Python)**

#### `background_remover.py` (Modo Padrão)
```python
# Usa rembg com u2net
from rembg import remove, new_session

# Otimizações:
- Redimensiona imagens grandes (>1024px) para processamento rápido
- Restaura resolução original após processamento
- Opção de remover pretos internos
- Alpha matting desativado para velocidade
```

#### `background_remover_inspyrenet.py` (Alta Precisão)
```python
# Usa InSPyReNet via transparent-background
from transparent_background import Remover

# Características:
- Auto-instalação de dependências se necessário
- Suporte GPU (CUDA) se disponível
- Modo 'base' (SwinB) para máxima qualidade
- Modo 'fast' (Res2Net50) disponível se necessário
```

### **Handlers (TypeScript)**

#### `background-removal-handler.ts`
- Gerencia execução do `background_remover.exe`
- Passa parâmetros: `removeInternalBlacks`, `blackThreshold`
- Feedback de progresso via stderr

#### `background-removal-inspyrenet-handler.ts`
- Gerencia execução do `background_remover_inspyrenet.exe`
- Modo fixo: `'base'` (alta qualidade)
- Sem parâmetros de seleção (automático)

### **Frontend (React)**

#### `UpscaylView.tsx`
- **Dois botões** de remoção de fundo
- **Preview interativo** com `ReactCompareSlider`
- **Workflow de confirmação**: Preview → Confirmar/Cancelar → Aplicar
- **Sem fundo quadriculado** - fundo limpo da interface

---

## 🔧 Dependências Python

### Modo Padrão (rembg)
```bash
pip install rembg[gpu]  # ou rembg para CPU
```
- `rembg`
- `onnxruntime` (ou `onnxruntime-gpu`)
- `Pillow`
- `numpy`

### Modo Alta Precisão (InSPyReNet)
```bash
pip install transparent-background
```
- `transparent-background`
- `torch` / `torchvision`
- `timm`
- `opencv-python`
- `Pillow`
- `numpy`

**Nota**: O script `background_remover_inspyrenet.py` tenta instalar automaticamente se a biblioteca não estiver presente.

---

## 📦 Build e Empacotamento

### Scripts de Build (`package.json`)
```json
{
  "build:python": "pyinstaller --onefile --name background_remover ...",
  "build:python-inspyrenet": "pyinstaller --onefile --name background_remover_inspyrenet ..."
}
```

### Recursos Empacotados (`electron-builder.json`)
```json
{
  "extraResources": [
    "background_remover.exe",
    "background_remover_inspyrenet.exe"
  ]
}
```

**Removido do build**:
- ❌ `background_remover_manual.exe` (SAM)
- ❌ `sam_vit_b_01ec64.pth` (~375MB)
- ❌ `ImageSelector` component

**Economia de espaço**: ~375MB

---

## 🎯 Fluxo de Uso

### Modo Padrão
1. Usuário seleciona imagem
2. (Opcional) Faz upscale
3. Clica em "✂️ Remover Fundo"
4. Aguarda processamento (segundos)
5. Visualiza preview no slider
6. Confirma ou cancela
7. Se confirmar, imagem sem fundo vira a nova imagem de trabalho

### Modo Alta Precisão
1. Usuário seleciona imagem
2. (Opcional) Faz upscale
3. Clica em "✨ Alta Precisão"
4. Aguarda processamento (10-30s)
5. Visualiza preview no slider
6. Confirma ou cancela
7. Se confirmar, imagem sem fundo vira a nova imagem de trabalho

---

## ⚙️ Configurações Avançadas

### Modo Padrão
- **Remover pretos internos**: Checkbox para ativar
- **Sensibilidade de preto**: Slider 0-100 (threshold)

### Modo Alta Precisão
- Sem configurações (automático)
- Usa sempre modo `'base'` (SwinB)

---

## 🚀 Performance

### Modo Padrão (rembg)
- **Imagem 1024x1024**: ~2-5 segundos
- **Imagem 4096x4096**: ~5-10 segundos (redimensionada temporariamente)
- **GPU**: Acelera ~2-3x

### Modo Alta Precisão (InSPyReNet)
- **Imagem 1024x1024**: ~10-15 segundos
- **Imagem 4096x4096**: ~20-30 segundos
- **GPU**: Acelera ~3-5x

---

## 🐛 Troubleshooting

### "Biblioteca não encontrada"
- **Solução**: O script tenta instalar automaticamente
- **Manual**: `pip install rembg transparent-background`

### "Modelo não encontrado"
- **rembg**: Baixa automaticamente na primeira execução (~176MB)
- **InSPyReNet**: Baixa automaticamente na primeira execução (~140MB)
- **Local**: `~/.u2net/` e `~/.transparent-background/`

### "Processo muito lento"
- **Solução**: Instalar versão GPU das bibliotecas
- **CUDA**: `pip install onnxruntime-gpu torch torchvision --index-url https://download.pytorch.org/whl/cu118`

### "Erro ao empacotar"
- **PyInstaller**: Certifique-se de que todas as dependências estão instaladas
- **Hidden imports**: Adicionar ao `.spec` se necessário

---

## 📝 Notas de Desenvolvimento

### Por que InSPyReNet em vez de SAM?
- **SAM**: Excelente para segmentação com prompts, mas:
  - Requer seleção manual (ponto/caixa)
  - Modelo grande (~375MB)
  - Complexidade de UI
  - Não é especializado em remoção de fundo

- **InSPyReNet**: Especializado em remoção de fundo:
  - Automático (sem seleção)
  - Modelo menor (~140MB)
  - UI simples
  - Melhor qualidade para cabelos/transparências

### Por que manter rembg?
- **Velocidade**: 3-5x mais rápido que InSPyReNet
- **Eficiência**: Suficiente para 80-90% dos casos
- **Recursos**: Menor uso de memória/GPU

---

## 🔮 Melhorias Futuras

### Possíveis
- [ ] Modo "fast" do InSPyReNet como opção
- [ ] Cache de modelos para primeira execução mais rápida
- [ ] Processamento em batch
- [ ] Ajuste de parâmetros do InSPyReNet (threshold, etc.)

### Não Recomendadas
- ❌ Voltar ao SAM (complexidade desnecessária)
- ❌ Adicionar mais modelos (confusão para usuário)

---

## 📊 Comparação Final

| Característica | rembg (Padrão) | InSPyReNet (Alta Precisão) | SAM (Removido) |
|---|---|---|---|
| Velocidade | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Qualidade Geral | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Cabelos/Detalhes | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Facilidade de Uso | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Tamanho Modelo | 176MB | 140MB | 375MB |
| Automático | ✅ | ✅ | ❌ |
| GPU Opcional | ✅ | ✅ | ✅ |

---

## ✅ Conclusão

O sistema híbrido oferece:
- **Velocidade** para casos comuns (rembg)
- **Precisão** para casos complexos (InSPyReNet)
- **Simplicidade** de uso (ambos automáticos)
- **Flexibilidade** para o usuário escolher

**Recomendação de uso**:
- Use **Modo Padrão** primeiro
- Se o resultado não for satisfatório (especialmente em cabelos/detalhes), use **Alta Precisão**
