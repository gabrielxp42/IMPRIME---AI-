# 🛠️ Comandos Úteis - Spot White Automation

## 📦 Desenvolvimento

### Iniciar em modo desenvolvimento
```bash
npm run dev
```

### Verificar dependências
```bash
npm install
```

### Limpar cache e reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🏗️ Build e Distribuição

### Build para produção
```bash
npm run build
```
**Output**: `dist/` (executáveis para Windows)

### Criar apenas o instalador
```bash
npm run build -- --win nsis
```

### Criar apenas portable
```bash
npm run build -- --win portable
```

---

## 🧪 Testes

### Verificar TypeScript (sem executar)
```bash
npx tsc --noEmit
```

### Verificar linting
```bash
npm run lint
```

### Limpar logs de desenvolvimento
```bash
# Windows PowerShell
Remove-Item "$env:APPDATA\spot-white-automation\logs\*" -Force
```

---

## 🐛 Debug e Troubleshooting

### Ver logs em tempo real (desenvolvimento)
1. Abra o DevTools: `Ctrl + Shift + I`
2. Vá para aba "Console"

### Exportar logs do usuário
1. Abra o app
2. Vá em **Configurações** → **Logs e Suporte**
3. Clique em **📥 Exportar Logs**

### Abrir pasta de logs manualmente
```bash
# Windows PowerShell
explorer "$env:APPDATA\spot-white-automation\logs"
```

### Verificar se Python/pywin32 estão instalados
```bash
python --version
python -c "import win32com.client; print('pywin32 OK')"
```

---

## 🔧 Manutenção

### Atualizar dependências (cuidado!)
```bash
npm update
```

### Verificar dependências desatualizadas
```bash
npm outdated
```

### Limpar build anterior
```bash
# PowerShell
Remove-Item -Recurse -Force dist
```

---

## 📊 Informações do Projeto

### Ver tamanho do build
```bash
# Após build
Get-ChildItem -Recurse dist | Measure-Object -Property Length -Sum
```

### Contar linhas de código
```bash
# PowerShell
(Get-Content -Path "src/**/*.ts","src/**/*.tsx" | Measure-Object -Line).Lines
```

---

## 🚀 Lançamento

### Checklist pré-lançamento
1. [ ] Executar `npm run build`
2. [ ] Testar instalador em máquina limpa
3. [ ] Verificar logs após instalação
4. [ ] Executar checklist de testes
5. [ ] Criar tag de versão no Git

### Criar tag de versão
```bash
git tag -a v1.0.0 -m "Versão 1.0.0 - Lançamento inicial"
git push origin v1.0.0
```

---

## 🆘 Comandos de Emergência

### App não abre após build
```bash
# Verificar logs do Electron
# Windows: %APPDATA%\spot-white-automation\logs\
```

### Erro de dependências Python
```bash
pip install --upgrade pywin32
python -m pip install --force-reinstall pywin32
```

### Reinstalar Electron
```bash
npm uninstall electron
npm install electron --save-dev
```

### Reset completo do projeto
```bash
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

---

## 📝 Aliases Úteis (Opcional)

Adicione ao seu `~/.bashrc` ou `~/.zshrc`:

```bash
# Spot White Automation
alias swa-dev='cd "/c/Users/Direct/Videos/automação photoshop2" && npm run dev'
alias swa-build='cd "/c/Users/Direct/Videos/automação photoshop2" && npm run build'
alias swa-logs='explorer "$env:APPDATA/spot-white-automation/logs"'
```

---

## 🔍 Debug Avançado

### Modo verbose do Electron
```bash
# No package.json, adicione:
"dev": "electron . --enable-logging"
```

### Desabilitar cache do Electron
```bash
# Adicione no main.ts:
app.commandLine.appendSwitch('disable-http-cache')
```

### Ver todas as variáveis de ambiente
```bash
# No código TypeScript:
console.log(process.env)
```

---

## 📚 Documentação Útil

- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Electron Builder](https://www.electron.build/)
- [pywin32 Docs](https://mhammond.github.io/pywin32/)

---

**Dica Final**: Sempre faça backup antes de comandos destrutivos! 💾
