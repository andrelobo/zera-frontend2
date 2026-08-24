<div align="center">
  <img src="./public/brand/jupati-readme.svg" width="760" alt="Jupati — sua operação, bem conectada." />
</div>

<p align="center">
  Interface operacional da plataforma Jupati para empresas e contabilidades.<br />
  Operação fiscal, inteligência e dados conectados com clareza e segurança.
</p>

<p align="center">
  <strong>Frontend oficial</strong> · React · TypeScript · Vite · Tailwind · shadcn/ui
</p>

---

## Jupati Web

Este repositório entrega a experiência web da **Jupati**, plataforma brasileira de
operação e inteligência com núcleo fiscal próprio. A interface conecta cadastro de
prestadores e tomadores, emissão de NFS-e, artefatos fiscais, observabilidade, B.I.
e inteligência operacional.

> **Sua operação, bem conectada.**

O nome técnico `zera-frontend2` é preservado temporariamente para não quebrar
deploy, integrações e histórico. Na experiência do usuário, a arquitetura de marca
é:

| Camada | Nome | Papel |
|---|---|---|
| Plataforma | **Jupati** | Produto e experiência do usuário |
| Motor fiscal | **LOBONOTAS** | Núcleo próprio da NFS-e Padrão Nacional |
| Empresa | **Muirakitan Tecnologia** | Responsabilidade institucional |
| Provider histórico | **PlugNotas** | Leitura histórica; `LEGACY_DISABLED` |

## Identidade visual

A identidade traduz fibras entrelaçadas da jupati, rios amazônicos e dados
conectados em um sistema contemporâneo. Clareza e confiança têm prioridade sobre
efeitos decorativos, especialmente em telas fiscais.

### Paleta principal

| Token | Cor | Uso |
|---|---:|---|
| `night-950` | `#071020` | Sidebar e superfícies institucionais |
| `night-900` | `#0A1728` | Cards e popovers escuros |
| `forest-700` | `#384E37` | Marca em fundo claro |
| `leaf-500` | `#6CA65D` | Ações, foco e dados ativos |
| `sage-400` | `#829B7F` | Informação secundária e gráficos |
| `silver-300` | `#C3C5B6` | Trama e divisores |
| `ivory-100` | `#EBE6DE` | Texto claro e superfícies de marca |
| `warm-50` | `#F7F5F0` | Fundo operacional claro |

### Assets oficiais

- [`jupati-logo.svg`](./public/brand/jupati-logo.svg) — assinatura horizontal;
- [`jupati-mark.svg`](./public/brand/jupati-mark.svg) — símbolo isolado;
- [`jupati-readme.svg`](./public/brand/jupati-readme.svg) — apresentação técnica;
- [`JUPATI_DESIGN_SYSTEM.md`](./docs/JUPATI_DESIGN_SYSTEM.md) — especificação
  completa de marca, tokens, componentes, acessibilidade e responsividade.

## LOBONOTAS na interface

LOBONOTAS é apresentado como **“LOBONOTAS — Ambiente Nacional”**. A interface
consome contratos canônicos do backend e não interpreta regras fiscais por conta
própria.

- emissões novas pertencem exclusivamente ao LOBONOTAS;
- XML e PDF LOBONOTAS recebem identificação explícita;
- documentos PlugNotas permanecem visíveis apenas como histórico desativado;
- sincronização, download remoto e novas operações PlugNotas não são oferecidos;
- polling visual acompanha emissões ativas sem substituir a reconciliação do backend.

## Experiência do produto

### Operação fiscal

- emissão normal e emissão rápida de NFS-e;
- seleção explícita de prestador;
- cadastro e autocomplete de tomadores e serviços;
- acompanhamento de status, XML e DANFSe;
- cancelamento, substituição e detalhe da emissão;
- mensagens e bloqueios alinhados ao contrato do backend.

### Multiempresa e governança

- gestão de prestadores, certificados e parâmetros municipais;
- dados dependentes da empresa selecionada;
- usuários, convites e perfis de acesso;
- papel `readonly` sem CTAs de escrita;
- isolamento visual e operacional por prestador.

### B.I. e inteligência

- dashboards fiscal e executivo;
- indicadores de faturamento, impostos, retenções e tomadores;
- Jupati Insights para leitura consolidada por tomador;
- observabilidade administrativa de webhook, polling e timeline;
- nenhuma sugestão de IA executa uma ação fiscal irreversível.

## IA, skills, agentes e RAG

A interface é a camada de apresentação da inteligência assistiva da Jupati. O
backend mantém regras, auditoria e diagnóstico; o frontend explica evidências e
preserva supervisão humana.

| Capacidade | Estado na experiência |
|---|---|
| Contexto canônico | Documenta decisões e evita leitura histórica incorreta |
| Skills | Orientam desenvolvimento especializado e validação por domínio |
| `DiagnoseAgent` | Backend implementado; consumo de diagnóstico é read-only |
| Jupati Insights | Implementado como leitura operacional por tomador |
| Tool calling | Deve passar por contratos explícitos e ações supervisionadas |
| Memória operacional | Evolução incremental, sem segredos ou XML bruto |
| RAG | Planejado para normas e evidências com fonte/versionamento |
| Multiagentes | Futuro, restrito a subtarefas auditáveis e sem autonomia fiscal |

Princípio central:

> A IA recomenda e explica; regras determinísticas e pessoas autorizadas decidem.

## SDD — Specification-Driven Development

Frontend e backend evoluem pelo mesmo ciclo de **SDD**:

```text
Contexto e problema real
        ↓
Especificação de UX + contrato da API
        ↓
Slice pequeno em branch própria
        ↓
Testes críticos + build + lint
        ↓
PR, deploy e validação visual
        ↓
Evidência registrada no contexto
```

No frontend isso significa:

- começar pela regra de negócio e pelo contrato canônico do backend;
- documentar estados, responsividade e critérios de aceite;
- não inventar cálculo tributário na interface;
- preservar o dashboard clássico como baseline anti-regressão quando aplicável;
- testar os fluxos críticos antes do release;
- registrar a evidência de produção em `CURRENT_STATE.md`.

Referências:

- [`CURRENT_STATE.md`](./CURRENT_STATE.md)
- [`CONTEXT.md`](./CONTEXT.md)
- [`FRONT_RELEASE_CHECKLIST.md`](./docs/FRONT_RELEASE_CHECKLIST.md)
- [`JUPATI_DESIGN_SYSTEM.md`](./docs/JUPATI_DESIGN_SYSTEM.md)
- [`BI_CONTRATO_MINIMO.md`](./docs/BI_CONTRATO_MINIMO.md)

## Arquitetura

```text
Navegador
   |
   v
Jupati Web — React/Vite
   |
   | /api/* (proxy Vercel)
   v
Jupati Backend — NestJS/Oracle VPS
   |
   +-- MongoDB Atlas
   +-- LOBONOTAS -> Ambiente Nacional da NFS-e
```

O proxy evita mixed content entre o frontend HTTPS e a origem HTTP privada da VPS.
O navegador não deve apontar diretamente para o IP do backend.

## Stack

- React 18 + TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui + Radix UI
- Vitest + Testing Library
- Vercel

## Desenvolvimento local

### Requisitos

- Node.js 20.x
- npm

### Instalação

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:8080`.

### Configuração da API

```env
VITE_API_BASE_URL=/api
ORACLE_BACKEND_URL=http://BACKEND_INTERNO:3000
```

Segredos e endereços reais pertencem ao ambiente da Vercel, nunca ao repositório.

## Qualidade

```bash
npm test
npm run build
npm run lint
```

Baseline validado em **24/08/2026**:

- **152 testes** aprovados em 28 arquivos;
- build Vite de produção aprovado;
- lint com zero erros;
- warnings preexistentes não bloqueantes documentados.

Para release de fluxos fiscais, execute também:

```bash
npm run test:critical
```

## Rotas principais

| Rota | Experiência |
|---|---|
| `/` | Home operacional multiempresa |
| `/dashboard-classico` | Baseline histórico anti-regressão |
| `/dash2` | Trilha executiva |
| `/nfse` e `/nfse/:id` | Listagem e detalhe de NFS-e |
| `/nfse/nova` | Nova DANFSe |
| `/nfse/rapida` | Emissão rápida |
| `/empresas*` | Prestadores, regime, parâmetros e certificado |
| `/tomadores*` | Gestão de tomadores |
| `/users*` | Usuários e convites |
| `/gestor-ai` | Jupati Insights |
| `/observabilidade-fiscal` | Diagnóstico administrativo |

## Deploy

A aplicação usa roteamento client-side e requer fallback para `index.html`.

- Vercel: configuração em [`vercel.json`](./vercel.json);
- proxy do backend: [`api/proxy.ts`](./api/proxy.ts);
- fallback alternativo: `VITE_ROUTER_MODE=hash`;
- redirecionamento compatível: [`public/_redirects`](./public/_redirects).

---

<p align="center">
  <strong>Jupati</strong> · Sua operação, bem conectada.<br />
  Uma solução Muirakitan Tecnologia.
</p>
