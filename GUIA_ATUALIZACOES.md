# Guia de Atualizações Automáticas (Auto-Updater)

Este guia explica como lançar uma nova versão do seu aplicativo para que os usuários recebam a atualização automaticamente.

## Pré-requisitos
1. Seu repositório no GitHub deve ser **Público** (para a configuração atual funcionar sem tokens complexos).
2. O arquivo `package.json` deve ter a versão correta.

---

## Passo a Passo para Lançar um Update

### 1. Atualize a Versão
Abra o arquivo `package.json` e aumente o número da versão.
*   Exemplo: Mudar de `"version": "1.0.0"` para `"version": "1.0.1"`.

### 2. Gere o Instalador
No terminal, pare o servidor de desenvolvimento (se estiver rodando) e execute:
```bash
npm run build
```
Isso vai criar os arquivos de instalação na pasta `release` (ou `dist`).

### 3. Publique no GitHub
1.  Vá para o seu repositório no GitHub.
2.  Clique em **Releases** (na barra lateral direita) -> **Draft a new release**.
3.  **Choose a tag**: Crie uma tag nova com o mesmo número da versão (ex: `v1.0.1`).
4.  **Release title**: Coloque o nome da versão (ex: "Versão 1.0.1 - Novas Features").
5.  **Description**: Descreva o que mudou.

### 4. Upload dos Arquivos (CRITICO)
Arraste os seguintes arquivos gerados na sua pasta `release` para a área de upload da Release no GitHub:
1.  O instalador: `Spot White Automation Setup 1.0.1.exe`
2.  O arquivo de controle: `latest.yml` (Este arquivo é essencial para o update funcionar!)

### 5. Publique
Clique em **Publish release**.

---

## Como funciona para o Usuário?

1.  O usuário abre o aplicativo (versão 1.0.0).
2.  O aplicativo verifica silenciosamente no GitHub se existe uma versão maior que a atual.
3.  Se encontrar (ex: 1.0.1), ele baixa a atualização em segundo plano enquanto o usuário trabalha.
4.  Quando o usuário fechar e abrir o app novamente, a nova versão será instalada automaticamente.

## Observações Importantes
*   **Repositório Privado:** Se seu repo for privado, o auto-updater precisa de configurações extras (tokens de acesso). O método acima assume repo público.
*   **Certificado:** Sem um certificado de assinatura de código (que é pago), o Windows pode mostrar aquela tela azul de "Windows protegeu o computador" na primeira instalação. Isso é normal para apps não certificados.
