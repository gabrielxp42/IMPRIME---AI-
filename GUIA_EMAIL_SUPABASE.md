# 📧 Como Arrumar o E-mail de Confirmação "Feio"

Você não gostou do e-mail padrão do Supabase (e com razão, é feio e em inglês). Aqui está como personalizar para ficar profissional:

1.  **Acesse o Painel do Supabase**:
    *   Entre em: [https://supabase.com/dashboard/project/kvvwhponzqfyhhntfxvf/auth/templates](https://supabase.com/dashboard/project/kvvwhponzqfyhhntfxvf/auth/templates)
    *   (Se o link não abrir direto, vá em **Authentication** -> **Email Templates** no menu lateral).

2.  **Edite o Template "Confirm Signup"**:
    *   Altere o **Subject** para algo como: `Confirme sua conta no IMPRIME AI 🚀`
    *   No corpo do e-mail (**Body**), você pode usar HTML. Copie e cole este modelo simples e limpo:

```html
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #7c3aed;">Bem-vindo ao IMPRIME AI!</h1>
  <p>Falta pouco para você começar a automatizar seu trabalho.</p>
  <p>Clique no botão abaixo para confirmar seu e-mail:</p>
  <a href="{{ .ConfirmationURL }}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">Confirmar Minha Conta</a>
  <p style="margin-top: 30px; color: #666; font-size: 12px;">Se você não criou esta conta, ignore este e-mail.</p>
</div>
```

3.  **Salvar**: Clique em "Save".

---

## 🔗 Sobre o Link Abrir no Navegador
Quando o usuário clica no link, ele sempre abrirá no **Navegador Padrão** do computador (Chrome, Edge, etc.). Isso é normal.
Para que o fluxo seja perfeito:
1.  Usuário confirma no navegador.
2.  Navegador diz "Conta confirmada!".
3.  Usuário volta para o App IMPRIME AI e faz login.

*Dica Pro: Existem formas de fazer o link abrir o app direto (Deep Linking), mas exige configuração complexa no Windows Registry e não recomendo fazer agora para não atrasar o lançamento.*
