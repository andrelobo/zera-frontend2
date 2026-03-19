# ZERA Frontend

Aplicação frontend do projeto ZERA, construída com React, TypeScript e Vite.

## Premissa Canônica

Este frontend deve ser tratado como **aplicação já em produção**.

Implicações práticas:
- mudanças em UI e fluxo impactam operação real
- `ajustes`, `rollout` e `homologação` em docs de contexto não significam app "só em dev"; significam evolução controlada sobre uma base produtiva
- a prioridade padrão é preservar contrato com a API e evitar regressão em fluxos críticos

➡️ Antes de alterar telas, parta da premissa: **o ZERA já roda em PROD**.

## Requisitos

- Node.js 18+
- npm 9+

## Rodando localmente

```sh
npm install
npm run dev
```

Aplicação disponível em `http://localhost:8080`.

## Scripts

- `npm run dev`: inicia o servidor de desenvolvimento
- `npm run build`: gera build de produção
- `npm run build:dev`: gera build em modo desenvolvimento
- `npm run preview`: executa preview local da build
- `npm run lint`: executa lint
- `npm run test`: executa testes uma vez
- `npm run test:watch`: executa testes em modo watch

## Stack

- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui

## Deploy e roteamento SPA

Esta aplicação usa roteamento client-side. Em produção, configure rewrite para `index.html` para evitar 404 ao recarregar rotas internas.

- Netlify: arquivo `public/_redirects`
- Vercel: arquivo `vercel.json`
- Sem suporte a rewrite: defina `VITE_ROUTER_MODE=hash`
