# Ligar um ambiente do Finance Brain (Supabase + Google + Vercel)

Passos feitos uma vez por ambiente: primeiro o de testes (preview), depois o de produção.
Chaves secretas nunca se colam em conversas nem no PMO: introduzem-se diretamente nos painéis e guardam-se no Vaultwarden.

## 1. Base de dados (Supabase)

1. Abrir o projeto no Supabase (testes: organização gratuita; produção: projeto Pro na UE).
2. **SQL Editor → New query**, colar e correr, por esta ordem:
   1. `supabase/migrations/20260929120000_s11_fundacoes.sql`
   2. `supabase/seed/01_estrutura.sql`
   3. Testes: `supabase/seed/02_pessoas_teste.sql` e `supabase/seed/03_documentos_teste.sql`
      Produção: `supabase/seed/02_pessoas_producao.sql` (sem documentos de teste)
3. **Project Settings → API**: copiar o *Project URL* e a *publishable key* (a chave pública). Nunca usar a *secret key* na app.

## 2. Entrar com Google (Google Cloud)

1. Em console.cloud.google.com, com a conta do projeto (franciscos@shaken.pt), criar o projeto "Finance Brain".
2. **APIs e serviços → Ecrã de consentimento OAuth**: tipo *Externo* (os domínios estão em Workspaces diferentes), nome "Finance Brain", email de suporte e de contacto do projeto. Âmbitos: só `email`, `profile` e `openid`. Publicar a aplicação ("Em produção"); com estes âmbitos não é precisa verificação do Google.
3. **Credenciais → Criar credenciais → ID de cliente OAuth → Aplicação Web**.
   URI de redirecionamento autorizado: `https://<ref-do-projeto>.supabase.co/auth/v1/callback` (o endereço aparece no Supabase, no passo seguinte).
4. Guardar o *Client ID* e o *Client secret* no Vaultwarden.

## 3. Autenticação (Supabase)

1. **Authentication → Sign In / Providers → Google**: ativar e colar o Client ID e o Client secret.
2. **Authentication → URL Configuration**:
   - *Site URL*: o endereço da app (testes: o link de preview; produção: o domínio final).
   - *Redirect URLs*: `https://*-finance-brain.vercel.app/**` (previews) e, em produção, `https://<domínio>/**`.
3. Link por email (alternativa ao Google): o envio de emails do Supabase sem SMTP próprio só chega a membros da organização Supabase. Para os outros utilizadores, configurar SMTP próprio em **Authentication → Emails → SMTP** (fica para antes do piloto).
4. Sessões (produção, plano Pro): **Authentication → Sessions**, limite de 30 dias de inatividade. A app pede nova entrada para configuração ao fim de 12 horas.

## 4. Variáveis no Vercel

**Project → Settings → Environment Variables**, para o ambiente certo (*Preview* = base de testes; *Production* = base de produção):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key do Supabase |

Depois, **Deployments → Redeploy** do último deploy desse ambiente. Sem estas variáveis, a app mostra a página "Este ambiente ainda não está ligado à base de dados".

## 5. Verificar

1. Abrir o link, "Entrar com Google" com a conta de trabalho.
2. Quem não está na lista de pessoas com "pode entrar" vê a mensagem "Esta conta não tem acesso".
3. Teste do critério de feito do S1.1: ver `specs/S1.1_fundacoes.md`, secção 10.

## Testes automáticos (para o Claude)

`npm run test:db` corre a migração, os dados de teste e os testes de acessos num Postgres local (`PGHOST`/`PGPORT`).
