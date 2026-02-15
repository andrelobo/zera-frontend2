# CONTEXT.md

Documento canonico do projeto `zera-frontend2`.
Objetivo: fonte unica de contexto tecnico para desenvolvimento, review e manutencao.
Escopo deste arquivo: app frontend na pasta interna `zera-frontend2/` (onde fica o `package.json`).

## 1. Identificacao do Projeto
- Nome tecnico: `vite_react_shadcn_ts`
- Dominio funcional: painel web para emissao e acompanhamento de NFSe (PlugNotas/NFS-e Nacional), com gestao de empresas e usuarios
- Stack principal: React 18 + TypeScript + Vite + React Router + TanStack Query + Axios + Tailwind + shadcn/ui
- Diretorio raiz do app (neste repositorio): `zera-frontend2/` (pasta interna)

## 2. Como Rodar
- Instalar dependencias: `npm i` (ou `yarn`)
- Desenvolvimento: `npm run dev` (Vite em `http://localhost:8080`)
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint`
- Testes: `npm run test`

## 3. Variaveis de Ambiente
- `VITE_API_BASE_URL`: URL base da API backend
- Fallback atual se ausente: `http://localhost:3000`
- Arquivo de referencia: `.env.example`

## 4. Arquitetura de Frontend
- Entrada: `src/main.tsx`
- Composicao global: `src/App.tsx`
  - `QueryClientProvider`
  - `ThemeProvider` (`next-themes`)
  - `AuthProvider`
  - `TooltipProvider`
  - Toasters (`Toaster` e `Sonner`)
  - `BrowserRouter` ou `HashRouter` (controlado por `VITE_ROUTER_MODE`)
- Layout autenticado: `src/components/AppLayout.tsx`
- Guarda de rota: `src/components/ProtectedRoute.tsx`

## 5. Roteamento Atual
Rotas publicas:
- `/login`

Rotas protegidas:
- `/` -> Dashboard
- `/account` -> Minha Conta
- `/nfse` -> Lista NFSe
- `/nfse/nova` -> Emissao NFSe
- `/nfse/:id` -> Detalhe NFSe
- `/empresas` -> Lista Empresas
- `/empresas/nova` -> Criacao Empresa (via CNPJ)
- `/empresas/:id` -> Edicao Empresa
- `/users` -> Lista Usuarios
- `/users/novo` -> Criacao Usuario
- `/users/:id` -> Edicao Usuario

Fallback:
- `*` -> `NotFound`

## 6. Autenticacao e Sessao
Fonte: `src/contexts/AuthContext.tsx`

- Token JWT em `localStorage` na chave `zera_token`
- Login aceita `accessToken` (contrato atual) e fallback `access_token`
- `refreshUser()` chama `/auth/me` e normaliza usuario (nome fallback para email)
- `isAuthenticated` depende de `user` carregado
- `login()` foi ajustado para fluxo assincrono: salva token e aguarda `refreshUser()` antes de concluir navegacao (evita necessidade de "2 tentativas" de login)

Comportamento global 401 (`src/lib/api.ts`):
- remove token
- redireciona para `/login`

## 7. Contratos de API (estado real)
Fonte principal: Swagger `/docs-json` do backend local.
Legenda de confianca:
- `Confirmado no front`: comportamento verificado no codigo deste repositorio
- `Depende de backend/Swagger`: contrato que exige validacao no backend em execucao

### 7.1 Auth
- `POST /auth/login` -> retorna `accessToken` (`Confirmado no front`; formato final depende de backend/Swagger)
- `GET /auth/me` -> usuario com `role` (`admin|manager|user`) e `status` (`active|inactive`) (`Confirmado no front`; valores finais dependem de backend/Swagger)

### 7.2 NFSe
- `GET /nfse` retorna **resumo paginado**: `{ items, meta }` (`Confirmado no front`; shape final depende de backend/Swagger)
- `GET /nfse/:id` retorna **resumo** (sem dados fiscais completos) (`Confirmado no front`; payload final depende de backend/Swagger)
- Dados fiscais completos (numero, tomador, servico, valor) ficam em:
  - `GET /nfse/:id/provider-response` (`Confirmado no front`; campos internos dependem de backend/provider)
- Artifacts:
  - `GET /nfse/:id/artifacts` -> `{ hasXml, hasPdf, ... }` (`Confirmado no front`; shape final depende de backend/Swagger)
  - downloads local/remoto por endpoints dedicados (`Confirmado no front`)

### 7.3 Empresas
- `POST /empresas` cria por CNPJ (payload minimo: `{ cnpj }`) (`Confirmado no front`; validacao final depende de backend/Swagger)
- `GET /empresas/cnpj/:cnpj` usado para buscar/preencher prestador (`Confirmado no front`)
- `PATCH /empresas/:id` aceita payload parcial (`razaoSocial`, `nomeFantasia`, `inscricaoMunicipal`, `email`, `fone`, `endereco`) (`Confirmado no front`; regra final depende de backend/Swagger)

### 7.4 Usuarios
- Roles atuais da API: `admin | manager | user` (`Confirmado no front`; fonte final depende de backend/Swagger)
- Front faz mapeamento de roles antigas para compatibilidade

## 8. Fluxos Funcionais
### 8.1 Emissao de NFSe
Tela: `src/pages/NfseEmitPage.tsx`

- Prestador pode ser obtido por:
  - selecao de empresa cadastrada, ou
  - busca por CNPJ (`/empresas/cnpj/:cnpj`)
- Payload enviado segue `EmitirNfseDto` (Swagger):
  - `prestador`, `tomador`, `servico`, `referenciaExterna`
- Front preenche campos inferidos do prestador (empresa) e envia tomador/servico do formulario

### 8.2 Lista de NFSe
Tela: `src/pages/NfseListPage.tsx`

- Usa `/nfse` para pagina/status/provider
- Como `/nfse` e resumo, a tela enriquece numero/tomador/valor consultando `provider-response` por linha

### 8.3 Detalhe da NFSe
Tela: `src/pages/NfseDetailPage.tsx`

- Usa `/nfse/:id` + `/nfse/:id/provider-response` + `/nfse/:id/artifacts`
- Dados exibidos sao extraidos de `provider-response.raw` (fallback robusto para formatos array/obj/string)
- Botao `Sincronizar` chama `POST /nfse/:id/sync-artifacts`

### 8.4 Dashboard
Tela: `src/pages/DashboardPage.tsx`

- Carrega lista base via `/nfse`
- Enriquece valores financeiros de autorizadas via `provider-response` (quando necessario)
- Possui cache local por emissao (`id + updatedAt`) para reduzir custo de refresh
- Possui snapshot local de KPIs/graficos para renderizacao imediata
- Botao `Recalcular do zero` limpa cache/snapshot e refaz calculo

## 9. Estado, Cache e UX de Dados
- React Query global:
  - `retry: 1`
  - `staleTime: 30_000`
  - `refetchOnWindowFocus: false`
- Estados padrao:
  - `LoadingState`, `ErrorState`, `EmptyState`
- Dashboard:
  - cache local de valor por emissao: `zera_dashboard_valores_v1`
  - snapshot local de stats: `zera_dashboard_snapshot_v1`
  - composicao progressiva: render imediato de snapshot + enriquecimento em background

## 10. UI e Design System
- Base: shadcn/ui + Radix
- Tokens e tema: `src/index.css`
- Tailwind: `tailwind.config.ts`
- Alias: `@ -> src`
- Tema claro/escuro ativo via `next-themes`
- Botao de alternancia no header: `src/components/ThemeToggle.tsx`
- Ajustes recentes de layout no detalhe de NFSe para evitar overflow horizontal
- Branding/metadados atualizados:
  - titulo da aba: `ZERA`
  - favicon temporario em `public/favicon.svg` (azul)
  - `README.md` reescrito para contexto real do projeto
- Removidas referencias ao Lovable no front:
  - `index.html` (meta tags/titulo)
  - `vite.config.ts` (remocao de `lovable-tagger`)
  - `package.json` e `yarn.lock` (dependencia removida)
- Traducoes de UI aplicadas em textos visiveis e acessibilidade (`aria-label`/`sr-only`) sem alterar contratos tecnicos

## 11. Testes e Qualidade
- Vitest: `vitest.config.ts` (`jsdom`)
- Setup: `src/test/setup.ts`
- Cobertura atual: teste exemplo
- ESLint sem erros bloqueantes; warnings recorrentes de fast-refresh em componentes UI
- `.gitignore` reforcado para env/build/cache/IDE e sem versionar secrets locais
- Build de validacao executado com sucesso apos mudancas de hoje (`npm run build`)

## 12. Riscos Tecnicos Atuais
- Gargalo principal percebido: endpoint `/nfse` do backend pode levar ~8s (API local + MongoDB Atlas)
- Mesmo com otimizacoes de cache/snapshot no front, primeiro carregamento depende desse tempo de backend
- Front ainda depende de multiplas consultas de `provider-response` para enriquecer dados financeiros/visuais
- Cobertura de testes automatizados baixa

## 13. Convencoes para Novas Mudancas
- Toda integracao HTTP em `src/services/api.ts`
- Novos contratos tipados em `src/types/api.ts`
- Rotas autenticadas sob `ProtectedRoute`
- Novas telas devem ter loading/erro/vazio
- Mudancas de contrato devem ser verificadas no Swagger real antes de codar

## 14. Certificado Digital (PFX)
- Fato importante de negocio: emissao depende de certificado digital A1 (PFX/P12) por empresa
- No backend atual (Swagger local), **nao ha endpoint interno exposto** para upload/import de certificado
- Documentacao operacional aponta upload de certificado no provider PlugNotas (`/certificado` externo)
- Implicacao: fluxo completo de onboarding de certificado ainda depende do backend expor endpoint interno proprio ou de operacao fora do front

## 15. Protocolo Canonico de Atualizacao (obrigatorio em todo commit)
Sempre atualizar este arquivo quando o commit alterar:
- estrutura relevante
- rotas
- contratos/API
- autenticacao/autorizacao
- comportamento NFSe/empresas/usuarios/dashboard
- estrategia de cache/performance
- riscos tecnicos

Checklist por commit:
1. Atualizar secoes impactadas
2. Validar contratos com Swagger/backend real
3. Atualizar rastreabilidade

## 16. Rastreabilidade de Atualizacao
- Ultima atualizacao: 2026-02-14
- Responsavel: Codex (GPT-5)
- Tipo de atualizacao: branding/metadados (remocao Lovable, titulo ZERA, favicon), traducao de UI, ajuste de autenticacao (login sem 2 tentativas) e validacao por build
