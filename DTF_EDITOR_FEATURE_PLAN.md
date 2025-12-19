# 🎨 Plano de Features: Editor DTF para Não-Designers

## 🎯 Objetivo Principal
Criar um editor simplificado para pessoas **sem conhecimento de design** criarem arquivos prontos para **impressão DTF (Direct to Film)** com qualidade profissional.

---

## 📋 Checklist de Features Essenciais

### ✅ **JÁ IMPLEMENTADO**
- [x] Editor de canvas com Konva.js
- [x] Drag & drop de imagens
- [x] Controles de transformação (resize, rotate, move)
- [x] Camadas (layers)
- [x] Histórico (Ctrl+Z/Ctrl+Y)
- [x] Múltiplos documentos
- [x] Exportação PNG 300 DPI
- [x] Remoção de fundo
- [x] IA para comandos naturais

---

## 🚀 **FEATURES PRIORITÁRIAS** (Essenciais para DTF)

### 1. ⚙️ **Configuração Automática DTF**
**Motivação:** Usuários não-técnicos precisam de configurações "prontas para usar"

**Features:**
- [ ] Templates pré-configurados para DTF:
  - Tamanho A4 (210×297mm @ 300 DPI)
  - Tamanho A3 (297×420mm @ 300 DPI)
  - Tamanho personalizado (com validação DTF)
- [ ] Preset "DTF Print Ready":
  - Fundo transparente obrigatório
  - 300 DPI garantido
  - Avisos de área de sangria (bleed)
- [ ] Validador de arquivo DTF:
  - ✓ Resolução mínima 300 DPI
  - ✓ Fundo transparente
  - ✓ Tamanho de linha mínimo (0.5mm)
  - ✓ Texto convertido ou > 6pt

---

### 2. 📐 **Ferramentas de Formas (Shapes)** ⭐ PRIORIDADE ALTA
**Motivação:** Canva tem shapes, usuários precisam criar logos/elementos sem Photoshop

**Features Konva.js:**
- [ ] **Formas Básicas:**
  ```tsx
  - Retângulo (Konva.Rect)
  - Círculo (Konva.Circle)
  - Elipse (Konva.Ellipse)
  - Linha (Konva.Line)
  - Polígono (Konva.RegularPolygon)
  - Estrela (Konva.Star)
  - Anel (Konva.Ring)
  ```
- [ ] **Controles de Forma:**
  - Cor de preenchimento (seletor visual)
  - Cor de borda
  - Espessura de borda (min 0.5mm para DTF)
  - Opacidade
  - Arredondar cantos (border-radius)
- [ ] **Formas Customizadas:**
  - Importar SVG (Konva.Path)
  - Biblioteca de ícones pré-feitos

**UI Sugerida:**
```
Toolbar │ Shapes ▼  │
        ├─ Rectangle
        ├─ Circle
        ├─ Star
        ├─ Line
        └─ Import SVG...
```

---

### 3. 🎨 **Ajustes de Imagem/Cor** (Filters Konva.js)
**Motivação:** DTF precisa de cores vibrantes e ajustes precisos

**Filters disponíveis:**
- [ ] **Brightness** (Brilho) - Konva.Filters.Brighten
- [ ] **Contrast** (Contraste) - Konva.Filters.Contrast
- [ ] **Saturate** (Saturação) - Konva.Filters.HSL
- [ ] **Grayscale** (Preto e Branco) - Konva.Filters.Grayscale
- [ ] **Invert** (Inverter cores) - Konva.Filters.Invert
- [ ] **Blur** (Desfoque) - Konva.Filters.Blur
- [ ] **Sharpen** (Nitidez) - Konva.Filters.Enhance

**UI Sugerida:**
```
Adjust Panel
├─ Brightness:  [─────●───] 0
├─ Contrast:   [─────●───] 0
├─ Saturation: [─────●───] 0
└─ [Grayscale] [Invert] [Reset]
```

**Implementação:**
```tsx
image.cache();
image.filters([Konva.Filters.Brighten, Konva.Filters.Contrast]);
image.brightness(0.3);
image.contrast(20);
layer.batchDraw();
```

---

### 4. ✍️ **Ferramenta de Texto Avançada**
**Motivação:** 80% dos designs DTF têm texto (nomes, frases, logos)

**Features:**
- [ ] **Textos Editáveis:**
  - Fontes Google Fonts integradas
  - Tamanho mínimo 6pt (validação DTF)
  - Negrito, itálico, sublinhado
  - Alinhamento (esquerda, centro, direita)
- [ ] **Efeitos de Texto:**
  - Cor de preenchimento
  - Contorno (stroke)
  - Sombra (shadow)
  - Transformar em curva (outline para DTF)
- [ ] **Textos Curvos:**
  - Texto em arco (Konva.TextPath)
  - Texto em círculo

**Konva Implementation:**
```tsx
const text = new Konva.Text({
  text: 'NOME AQUI',
  fontSize: 48,
  fontFamily: 'Arial Black',
  fill: 'white',
  stroke: 'black',
  strokeWidth: 2,
  shadow: {
    color: 'black',
    blur: 10,
    offset: { x: 5, y: 5 },
    opacity: 0.5
  }
});
```

---

### 5. 🎨 **Biblioteca de Assets** (Como Canva)
**Motivação:** Não-designers precisam de elementos prontos

**Assets:**
- [ ] **Templates Prontos:**
  - Camisetas básicas
  - Logos simples
 - Frases populares
  - Layouts de aniversário/eventos
- [ ] **Elementos Gráficos:**
  - Ícones (coração, estrela, raio, etc)
  - Formas decorativas
  - Divisores/ornamentos
- [ ] **Fontes Populares:**
  - 50+ fontes Google Fonts
  - Pré-visualização em tempo real

**UI:**
```
Sidebar
├─ 📁 Templates
├─ 🎨 Shapes
├─ 🖼️ Elements
├─ ✍️ Text
└─ 🌈 Colors
```

---

### 6. 📏 **Guias e Alinhamento** (Smart Guides)
**Motivação:** Facilita posicionamento preciso sem experiência

**Features Konva.js:**
- [ ] **Snap to Grid:**
  ```tsx
  shape.on('dragmove', () => {
    shape.x(Math.round(shape.x() / 10) * 10);
    shape.y(Math.round(shape.y() / 10) * 10);
  });
  ```
- [ ] **Smart Guides:**
  - Linha de centro (horizontal/vertical)
  - Alinhamento entre objetos
  - Espaçamento igual
- [ ] **Réguas:**
  - Mostrar dimensões em cm/mm
  - Área de segurança (safe zone)

---

### 7. 🖌️ **Ferramentas de Desenho** (Para Criatividade)
**Motivação:** Usuários querem personalizar com toque manual

**Features:**
- [ ] **Pincel Livre** (Konva.Line com draggable)
- [ ] **Formas à Mão Livre**
- [ ] **Borracha** (apagar partes)
- [ ] **Caneta (Pen Tool)** - para curvas Bézier

---

### 8. 🎭 **Máscaras e Recortes**
**Motivação:** Criar formas personalizadas (círculo, estrela, etc)

**Konva Implementation:**
```tsx
image.clipFunc((ctx) => {
  ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
});
```

**Features:**
- [ ] Máscara circular
- [ ] Máscara retangular
- [ ] Máscara personalizada (qualquer forma)

---

### 9. 📊 **Camadas Avançadas**
**Motivação:** Organização visual e controle

**Features Adicionais:**
- [ ] **Grupos de Camadas:**
  - Agrupar elementos (Konva.Group)
  - Expandir/colapsar grupos
- [ ] **Blending Modes:**
  - Multiply, Screen, Overlay
  - Konva.globalCompositeOperation
- [ ] **Opacidade por camada**
- [ ] **Efeitos por camada:**
  - Sombra em grupo
  - Brilho em grupo

---

### 10. 🎯 **Pré-Visualização DTF**
**Motivação:** Ver como ficará impresso ANTES de exportar

**Features:**
- [ ] **Preview em Camiseta:**
  - Mockup de camiseta (branca/preta)
  - Ver como cores aparecem em tecido escuro
- [ ] **Simulação de Impressão:**
  - Mostrar camada branca (white underbase)
  - Avisar áreas transparentes
- [ ] **Checklist Final:**
  ```
  ✓ Resolução 300 DPI
  ✓ Fundo transparente
  ✓ Linhas > 0.5mm
  ✓ Texto > 6pt
  ⚠ Pronto para DTF!
  ```

---

## 📱 **Features de UX (Simplificar para Não-Designers)**

### 11. 🎨 **Paletas de Cores**
- [ ] Seletor de cores visual (color picker)
- [ ] Paletas pré-definidas
- [ ] Pipeta (eyedropper) - pegar cor de imagem
- [ ] Histórico de cores usadas

### 12. 🔧 **Controles Visuais**
- [ ] Sliders grandes e claros
- [ ] Preview em tempo real
- [ ] Undo visual (mostrar anterior)
- [ ] Tooltips em tudo

### 13. 🎓 **Modo Tutorial**
- [ ] Onboarding interativo
- [ ] Dicas contextuais
- [ ] Vídeos curtos integrados

---

## 🛠️ **Implementação Técnica**

### Prioridade 1 (Próximas 2 semanas):
1. Shapes básicas (Rect, Circle, Star)
2. Filters de imagem (Brightness, Contrast, Saturation)
3. Ferramenta de texto com Google Fonts  
4. Validador DTF (300 DPI check)

### Prioridade 2 (1 mês):
1. Biblioteca de templates
2. Smart guides e snapping
3. Preview DTF em camiseta
4. Máscaras e recortes

### Prioridade 3 (2 meses):
1. Desenho à mão livre
2. Textos curvos
3. Blending modes
4. Grupos de camadas

---

## 💰 **Comparação: Canva vs Nosso Editor**

| Feature | Canva | Nosso Editor DTF |
|---------|-------|------------------|
| Templates | ✅ 1M+ | 🟡 50+ (focado DTF) |
| Shapes | ✅ | ⭐ **IMPLEMENTAR** |
| Texto | ✅ | ⭐ **MELHORAR** |
| Filtros | ✅ Avançado | ⭐ **IMPLEMENTAR** |
| IA | 🟡 Básica | ✅ **MELHOR** |
| DTF Ready | ❌ | ✅ **ÚNICO** |
| Preço | $13/mês | **GRÁTIS** |

---

## 🎯 **Diferencial Competitivo**

Nosso editor será **o único** com:
1. ✅ Validação DTF automática
2. ✅ Preview em produto real
3. ✅ IA que entende comandos em português
4. ✅ Export otimizado para DTF (PNG 300 DPI transparente)
5. ✅ 100% focado em impressão, não social media

**Público-alvo:**
- Donos de lojas de estamparia
- Empreendedores de DTF
- Pessoas fazendo designs personalizados
- Pequenos negócios sem designer

---

## 📝 **Próximos Passos**

Qual feature quer que eu implemente PRIMEIRO?
A) Shapes (formas básicas)
B) Filtros de imagem (brilho, contraste)
C) Texto avançado (fontes + efeitos)
D) Templates DTF prontos
E) Todas acima (plano completo)
