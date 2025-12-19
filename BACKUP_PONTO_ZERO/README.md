# Spot White Automation

Aplicação desktop para automação do Photoshop com interface moderna similar ao Upscayl.

## Funcionalidades

- ✅ Detecção automática do Photoshop instalado no PC
- ✅ Seleção de arquivos PNG ou PDF
- ✅ Validação automática de DPI, largura e altura
- ✅ Processamento Spot White via ação do Photoshop
- ✅ Salvamento automático em TIFF com transparência
- ✅ Integração com Google Gemini para orquestração
- ✅ Interface moderna com tema dark e workflow passo a passo

## Requisitos

- Node.js 18+ 
- Python 3.x instalado e no PATH
- Biblioteca Python `pywin32` (instale com: `pip install pywin32`)
- Photoshop instalado (qualquer versão)
- Chave API do Google Gemini

## Instalação

### 1. Instalar dependências Node.js
```bash
npm install
```

### 2. Instalar dependências Python
```bash
pip install pywin32
```

**Nota**: Se você usar `python3` em vez de `python`, use:
```bash
python3 -m pip install pywin32
```

## Desenvolvimento

```bash
npm run dev
```

Isso iniciará:
- Servidor Vite na porta 5173
- Aplicação Electron

## Build

```bash
npm run build
```

Isso criará um executável na pasta `release/`.

## Configuração

### Validação de Imagens

A aplicação valida automaticamente:
- **DPI**: Entre 200-300 (configurável)
- **Largura**: 58cm (configurável)
- **Altura mínima**: 50cm (configurável)

### Google Gemini

Você precisa de uma chave API do Google Gemini. Obtenha em: https://makersuite.google.com/app/apikey

## Uso

1. **Passo 1**: Selecione os arquivos PNG ou PDF
2. **Passo 2**: Valide os arquivos (verifica DPI, dimensões)
3. **Passo 3**: Defina a pasta de saída
4. **Passo 4**: Clique em "Spot White" para processar

## Ação do Photoshop

Certifique-se de que a ação `SPOTWHITE-PHOTOSHOP` existe no seu Photoshop no conjunto "Mask Processing Economy".

## Estrutura do Projeto

```
├── src/
│   ├── main/           # Processo principal Electron
│   │   ├── main.ts
│   │   ├── photoshop-automation.ts
│   │   ├── photoshop-detector.ts
│   │   ├── image-validator.ts
│   │   ├── gemini-orchestrator.ts
│   │   └── photoshop_automation.py  # Script Python para COM
│   └── renderer/       # Interface React
│       └── src/
│           ├── App.tsx
│           └── components/
├── dist/               # Arquivos compilados
├── scripts/            # Scripts de build
│   └── copy-python-script.js
├── requirements.txt    # Dependências Python
└── release/            # Executáveis
```

## Notas Técnicas

### Integração COM com Photoshop

A integração COM com Photoshop no Windows é feita através de Python usando a biblioteca `pywin32`. O script Python (`photoshop_automation.py`) é chamado pelo processo Electron para executar ações no Photoshop.

**Por que Python?**
- Python com `pywin32` oferece uma interface mais estável e confiável para automação COM no Windows
- Melhor tratamento de erros e exceções
- Mais fácil de depurar e manter

### Validação de PDFs

PDFs são validados usando `pdf-lib`. O DPI é assumido como 300 para PDFs de alta qualidade.

## Licença

MIT

