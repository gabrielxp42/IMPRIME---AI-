# ✅ Checklist de Testes Para Lançamento

## 🎯 Objetivo
Garantir que todas as funcionalidades estão funcionando corretamente antes do lançamento.

---

## 1️⃣ Sistema de Logging

### Teste 1.1: Geração de Logs
- [ ] Abra o aplicativo
- [ ] Execute algumas operações (processar imagem, validar, etc)
- [ ] Vá em **Configurações** → **Logs e Suporte**
- [ ] Clique em **📂 Abrir Pasta de Logs**
- [ ] ✅ **Esperado**: A pasta deve abrir e conter arquivos `.log`

### Teste 1.2: Exportação de Logs
- [ ] No mesmo local, clique em **📥 Exportar Logs**
- [ ] ✅ **Esperado**: Mensagem de sucesso com caminho do arquivo
- [ ] Abra o arquivo exportado
- [ ] ✅ **Esperado**: Arquivo contém logs consolidados com timestamps

### Teste 1.3: Rotação de Logs
- [ ] Execute operações pesadas (processar muitas imagens)
- [ ] Verifique a pasta de logs
- [ ] ✅ **Esperado**: Se um log passar de 5MB, um novo arquivo é criado

---

## 2️⃣ Removedor de Fundo Avançado

### Teste 2.1: Remoção de Fundo Básica
- [ ] Vá para a aba **Upscayl**
- [ ] Selecione uma imagem com fundo colorido
- [ ] Clique em **✂️ Remover Fundo** (sem marcar checkbox)
- [ ] ✅ **Esperado**: Fundo removido, imagem com transparência

### Teste 2.2: Remoção de Pretos Internos (Caso "Manga Rosa")
- [ ] Selecione uma imagem com:
  - Fundo preto externo
  - Detalhes pretos no design interno
- [ ] **Marque** ✂️ Remover pretos internos também
- [ ] Ajuste o slider (experimente valores 20, 30, 50)
- [ ] Clique em **✂️ Remover Fundo**
- [ ] ✅ **Esperado**: 
  - Fundo externo removido
  - Pretos internos também removidos
  - Cores do design preservadas

### Teste 2.3: Sensibilidade do Threshold
- [ ] Use a mesma imagem do teste 2.2
- [ ] Teste com **threshold baixo (10-20)**:
  - ✅ Remove apenas pretos puros
- [ ] Teste com **threshold médio (30-50)**:
  - ✅ Remove pretos e cinzas escuros
- [ ] Teste com **threshold alto (70-90)**:
  - ✅ Remove até tons cinza médio

### Teste 2.4: Fluxo Upscale + Remover Fundo
- [ ] Selecione uma imagem
- [ ] Clique em **🚀 Upscayl** primeiro
- [ ] Aguarde conclusão
- [ ] Clique em **✂️ Remover Fundo**
- [ ] ✅ **Esperado**: Fundo removido da versão em alta qualidade

### Teste 2.5: Fluxo Remover Fundo + Upscale
- [ ] Selecione uma imagem
- [ ] Clique em **✂️ Remover Fundo** primeiro
- [ ] Aguarde conclusão
- [ ] Clique em **🚀 Upscayl**
- [ ] ✅ **Esperado**: Imagem sem fundo é upscaled

---

## 3️⃣ Integração Geral

### Teste 3.1: Spot White (Padrão)
- [ ] Vá para aba **Spot White**
- [ ] Selecione imagens
- [ ] Configure modo **Padrão**
- [ ] Clique em **Processar**
- [ ] ✅ **Esperado**: Processamento concluído, logs gerados

### Teste 3.2: Spot White (Econômico)
- [ ] Mesmos passos do 3.1, mas modo **Econômico**
- [ ] ✅ **Esperado**: Processamento mais rápido

### Teste 3.3: Validação de Imagens
- [ ] Selecione imagens com DPI baixo ou dimensões incorretas
- [ ] ✅ **Esperado**: Erros de validação aparecem
- [ ] Logs devem conter detalhes do erro

### Teste 3.4: Ferramentas (Halftone)
- [ ] Vá para aba **Ferramentas**
- [ ] Teste **Halftone Direto DTF**
- [ ] ✅ **Esperado**: Processamento funciona, logs gerados

---

## 4️⃣ Build e Instalador

### Teste 4.1: Build de Desenvolvimento
```bash
npm run dev
```
- [ ] ✅ **Esperado**: Aplicativo abre sem erros
- [ ] ✅ Console sem erros críticos

### Teste 4.2: Build de Produção
```bash
npm run build
```
- [ ] ✅ **Esperado**: Build concluído sem erros
- [ ] ✅ Pasta `dist` criada

### Teste 4.3: Instalador NSIS
- [ ] Execute o instalador gerado
- [ ] Instale o aplicativo
- [ ] Abra o aplicativo instalado
- [ ] ✅ **Esperado**: Tudo funciona como em dev

### Teste 4.4: Versão Portable
- [ ] Execute a versão portable
- [ ] ✅ **Esperado**: Funciona sem instalação

---

## 5️⃣ Performance e Estabilidade

### Teste 5.1: Processamento em Lote
- [ ] Selecione 10+ imagens
- [ ] Processe com Spot White
- [ ] ✅ **Esperado**: 
  - Todas processadas sem crash
  - Logs de todas as operações

### Teste 5.2: Timeout de Remoção de Fundo
- [ ] Use uma imagem muito grande (>50MB)
- [ ] Remova o fundo
- [ ] ✅ **Esperado**: 
  - Timeout após 3 minutos OU
  - Processamento concluído

### Teste 5.3: Uso de Memória
- [ ] Processe várias imagens grandes
- [ ] Monitore uso de RAM (Task Manager)
- [ ] ✅ **Esperado**: Memória não cresce indefinidamente

---

## 6️⃣ UI/UX

### Teste 6.1: Responsividade
- [ ] Redimensione a janela
- [ ] ✅ **Esperado**: UI se adapta corretamente

### Teste 6.2: Mensagens de Feedback
- [ ] Execute operações
- [ ] ✅ **Esperado**: Mensagens claras de:
  - Sucesso (verde)
  - Erro (vermelho)
  - Info (azul)

### Teste 6.3: Estados de Botões
- [ ] Durante processamento:
  - ✅ Botões desabilitados
  - ✅ Spinner aparece
- [ ] Após conclusão:
  - ✅ Botões habilitados
  - ✅ Mensagem de sucesso

---

## 🐛 Bugs Conhecidos (para monitorar)

- [ ] `preload.ts` linha 54 - Duplicata removida (verificar se não há outros)
- [ ] Encoding de caminhos com caracteres especiais (ç, ã, etc) - testar
- [ ] Timeout muito longo em imagens gigantes - ajustar se necessário

---

## 📝 Notas Finais

### Aprovação para Lançamento:
- [ ] ✅ Todos os testes críticos passaram (1.x, 2.x, 3.x)
- [ ] ✅ Build funciona em ambiente limpo
- [ ] ✅ Instalador testado em máquina sem dependências
- [ ] ✅ Logs exportados e revisados
- [ ] ✅ Documentação atualizada (`README.md`)

### Checklist de Lançamento:
1. [ ] Criar tag de versão no Git (ex: `v1.0.0`)
2. [ ] Gerar release notes
3. [ ] Distribuir instalador
4. [ ] Preparar suporte (email, documentação)
5. [ ] Monitorar primeiros usos

---

**Data de início dos testes**: ___/___/______  
**Data de conclusão**: ___/___/______  
**Testado por**: ____________________  
**Status final**: [ ] Aprovado [ ] Requer ajustes

---
*Boa sorte com o lançamento! 🚀*
