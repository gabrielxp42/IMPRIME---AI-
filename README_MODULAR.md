# Spot White Automation - Projeto Modular

> **Automação Photoshop + Upscayl + Editor avançado**

## 🎯 Módulos

O projeto está organizado em **4 módulos independentes**:

### 1. 🎨 Spot White
Processamento em massa de imagens com ação Photoshop personalizada.
- 📁 `src/main/modules/spotwhite/`
- 🔧 Handlers: Photoshop automation, detector, orchestrator
- 🐍 Scripts: Python COM automation

### 2. ⬆️ Upscayl + Background Removal  
Upscaling com IA e remoção de fundo avançada.
- 📁 `src/main/modules/upscayl/`
- 🔧 Handlers: Upscaling, 4 modos de remoção de fundo
- 🐍 Scripts: rembg, u2net, SAM

### 3. 🎭 Effects
Halftone e efeitos especiais (planejado).
- 📁 `src/main/modules/effects/`

### 4. ✏️ Editor
Editor de imagens com Konva (canvas avançado).
- 📁 `src/renderer/src/components/editor/`

## 🚀 Como Usar

```bash
# Desenvolvimento
npm run dev

# Build de Produção
npm run build

# Instalar dependências Python
pip install pywin32 rembg pillow
```

## 📂 Estrutura

```
src/main/
├── core/           # Código compartilhado (logger, validator)
└── modules/        # Módulos isolados
    ├── spotwhite/
    ├── upscayl/
    ├── effects/
    └── editor/
```

## 🛡️ Backups

- `BACKUP_PONTO_ZERO/` - Antes da modularização
- `BACKUP_MODULARIZADO/` - Após modularização

## 🔧 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Electron + Node.js
- **Python**: Photoshop COM, rembg, PyInstaller
- **IA**: Upscayl (ESRGAN), U2-Net, SAM

---

**Projeto refatorado para colaboração multi-IA** 🤖✨
