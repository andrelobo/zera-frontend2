# CONTEXT.md

Documento canonico do projeto `zera-frontend`.
Objetivo: fonte unica de contexto tecnico para desenvolvimento, review e manutencao.
Escopo deste arquivo: app frontend na raiz deste repositorio `zera-frontend/` (onde fica o `package.json`).
Padrao de auditabilidade: cada afirmacao relevante deve indicar origem (`codigo local`, `execucao local`, `Swagger/backend`) e timestamp da ultima verificacao.

## 1. Identificacao do Projeto
- Nome tecnico: `vite_react_shadcn_ts`
- Dominio funcional: painel web para emissao e acompanhamento de NFSe (PlugNotas/NFS-e Nacional), com gestao de empresas e usuarios
- Stack principal: React 18 + TypeScript + Vite + React Router + TanStack Query + Axios + Tailwind + shadcn/ui
- Diretorio raiz do app (neste repositorio): `zera-frontend/` (raiz atual)

## 2. Matriz de Evidencias (auditoria rapida)
Timestamp base desta revisao editorial: `2026-02-17T12:06:06-04:00`.

- Evidencia E1 (codigo local): `package.json` confirma nome tecnico, scripts (`dev/build/lint/test`) e stack principal.
- Evidencia E2 (codigo local): `src/App.tsx` confirma composicao global, provider chain e rotas publicas/protegidas.
- Evidencia E3 (codigo local): `src/contexts/AuthContext.tsx` confirma armazenamento de token (`zera_token`), `refreshUser()`, `login()` assincrono e criterio de `isAuthenticated`.
- Evidencia E4 (codigo local): `src/lib/api.ts` confirma `VITE_API_BASE_URL` com fallback `http://localhost:3000`, interceptor JWT e tratamento global de `401`.
- Evidencia E5 (codigo local): `src/services/api.ts` confirma contratos consumidos por Auth/NFSe/Empresas/Usuarios.
- Evidencia E6 (codigo local): `src/pages/DashboardPage.tsx` confirma cache local (`zera_dashboard_valores_v1`) e snapshot (`zera_dashboard_snapshot_v1`).
- Evidencia E7 (codigo local): `index.html`, `vite.config.ts` e `README.md` confirmam branding `ZERA` e remocao de referencias Lovable.
- Evidencia E8 (codigo local): `src/test/setup.ts` e `src/test/example.test.ts` confirmam setup de testes e cobertura minima atual.
- Evidencia E9 (codigo local): `src/pages/CertificadoDigitalPage.tsx` confirma fluxo de importacao de certificado (.pfx/.p12) com validacao e exibicao de retorno nao sensivel.
- Evidencia E10 (codigo local): `src/pages/NfseQuickEmitPage.tsx` confirma fluxo de emissao rapida (`CPF + valor`) e tratamento de bloqueio por ausencia de certificado.
- Evidencia E11 (codigo local): `src/services/api.ts` confirma novos endpoints `POST /empresas/certificado/import` (multipart) e `POST /nfse/quick`.
- Evidencia E12 (execucao local): `npm run test` e `npm run build` executados com sucesso em `2026-02-16T10:21:57-04:00`.
- Evidencia E13 (execucao local): `yarn run test` executado com sucesso em `2026-02-16T11:19:03-04:00` (5 testes).
- Evidencia E14 (codigo local): `src/pages/NfseQuickEmitPage.tsx` confirma UX sem duplicidade de seletor de empresa (somente autocomplete), debounce de busca (250ms) e refinamento de feedback para servicos.
- Evidencia E15 (codigo local): `src/lib/api.ts` + `src/services/api.ts` confirmam opcao `skipGlobalErrorToast` para evitar toast transitario no fallback de `GET /nfse/servicos` -> `/nfse/servicos/autocomplete`.
- Evidencia E16 (execucao local): `npm run test` e `npm run lint` executados com sucesso em `2026-02-16T17:39:14-04:00` (8 testes; lint sem erros, apenas warnings recorrentes).
- Evidencia E17 (codigo local): `src/pages/NfseEmitPage.tsx` e `src/pages/NfseQuickEmitPage.tsx` confirmam padronizacao de autocomplete (empresa e servico), debounce de 250ms e sincronizacao do codigo de servico com o texto digitado para evitar selecao stale.
- Evidencia E18 (codigo local): `src/services/cep.ts`, `src/pages/EmpresaFormPage.tsx` e `src/pages/NfseEmitPage.tsx` confirmam lookup de CEP para autocomplete de endereco (logradouro/bairro/cidade/UF), com mascara e normalizacao de CEP.
- Evidencia E19 (execucao local): `yarn run test` executado com sucesso em `2026-02-17T12:06:06-04:00` (3 arquivos, 17 testes, todos passando).
- Evidencia E20 (codigo local): `tailwind.config.ts` e `src/index.css` confirmam extensao de paleta `zera.*` (light/dark) e remapeamento de tokens shadcn (`--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, `--border`, `--muted`, `--ring`) para o novo padrao visual.
- Evidencia E21 (codigo local): `src/pages/EmpresaFormPage.tsx` confirma expansao do formulario de empresas com novos campos cadastrais/fiscais (situacao cadastral, CNAE, natureza juridica, porte, capital social, simples/MEI e datas) e endereco detalhado (`numero`, `complemento`, `bairro`), mantendo campos existentes.
- Evidencia E22 (codigo local): `src/pages/EmpresaFormPage.tsx` confirma reorganizacao visual em secoes (`Dados da Empresa`, `Enquadramento Fiscal`, `Endereco`, `Contato`) com icones (`Building2`, `FileText`, `MapPin`, `Phone`).
- Evidencia E23 (codigo local): `src/services/api.ts` e `src/types/api.ts` confirmam ampliacao de contratos de `Empresa`/`CreateEmpresaRequest`/`UpdateEmpresaRequest` para suportar novos campos do backend e preparacao inicial de busca de empresas com `q`/`limit` no metodo `empresasApi.list`.
- Evidencia E24 (execucao local): `npm run test` executado com sucesso em `2026-02-21T11:34:27-04:00` (3 arquivos, 17 testes, todos passando).
- Evidencia E25 (execucao local): `npm run lint` executado com sucesso em `2026-02-21T11:34:16-04:00` (0 erros; 10 warnings recorrentes de fast-refresh e `react-hooks/exhaustive-deps` em `DashboardPage`).
- Evidencia E26 (codigo local): normalizacao documental de secoes/numeração e alinhamento de regra de certificado com backend em `2026-02-25`.

## 3. Como Rodar
- Instalar dependencias: `npm i` (ou `yarn`)
- Desenvolvimento: `npm run dev` (Vite em `http://localhost:8080`)
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint`
- Testes: `npm run test`

## 4. Variaveis de Ambiente
- `VITE_API_BASE_URL`: URL base da API backend
- Fallback atual se ausente: `http://localhost:3000`
- Arquivo de referencia: `.env.example`

## 5. Arquitetura de Frontend
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

## 6. Roteamento Atual
Rotas publicas:
- `/login`

Rotas protegidas:
- `/` -> Dashboard
- `/account` -> Minha Conta
- `/nfse` -> Lista NFSe
- `/nfse/nova` -> Emissao NFSe
- `/nfse/rapida` -> Emissao Rapida NFSe
- `/nfse/:id` -> Detalhe NFSe
- `/empresas` -> Lista Empresas
- `/empresas/nova` -> Criacao Empresa (via CNPJ)
- `/empresas/:id` -> Edicao Empresa
- `/certificado-digital` -> Importacao de Certificado Digital
- `/users` -> Lista Usuarios
- `/users/novo` -> Criacao Usuario
- `/users/:id` -> Edicao Usuario

Fallback:
- `*` -> `NotFound`

## 7. Autenticacao e Sessao
Fonte: `src/contexts/AuthContext.tsx`

- Token JWT em `localStorage` na chave `zera_token`
- Login aceita `accessToken` (contrato atual) e fallback `access_token`
- `refreshUser()` chama `/auth/me` e normaliza usuario (nome fallback para email)
- `isAuthenticated` depende de `user` carregado
- `login()` foi ajustado para fluxo assincrono: salva token e aguarda `refreshUser()` antes de concluir navegacao (evita necessidade de "2 tentativas" de login)

Comportamento global 401 (`src/lib/api.ts`):
- remove token
- redireciona para `/login`

## 8. Contratos de API (estado real)
Fonte principal: Swagger `/docs-json` do backend local.
Legenda de confianca:
- `Confirmado no front`: comportamento verificado no codigo deste repositorio
- `Depende de backend/Swagger`: contrato que exige validacao no backend em execucao

### 8.1 Auth
- `POST /auth/login` -> retorna `accessToken` (`Confirmado no front`; formato final depende de backend/Swagger)
- `GET /auth/me` -> usuario com `role` (`admin|manager|user`) e `status` (`active|inactive`) (`Confirmado no front`; valores finais dependem de backend/Swagger)

### 8.2 NFSe
- `GET /nfse` retorna **resumo paginado**: `{ items, meta }` (`Confirmado no front`; shape final depende de backend/Swagger)
- `GET /nfse/:id` retorna **resumo** (sem dados fiscais completos) (`Confirmado no front`; payload final depende de backend/Swagger)
- `POST /nfse/quick` aceita payload `{ cnpj, cpfTomador, valor, codigoServico }` e retorna contrato de emissao (`emissionId`, `idempotentReplay`, `result`) (`Confirmado no front`; regras finais dependem de backend/Swagger)
- `GET /nfse/servicos` usado para busca/listagem de catalogo de servicos (query `q`, `limit`, `page`) (`Confirmado no front`; shape final depende de backend/Swagger)
- `GET /nfse/servicos/autocomplete` mantido como fallback de busca (`Confirmado no front`)
- Dados fiscais completos (numero, tomador, servico, valor) ficam em:
  - `GET /nfse/:id/provider-response` (`Confirmado no front`; campos internos dependem de backend/provider)
- Artifacts:
  - `GET /nfse/:id/artifacts` -> `{ hasXml, hasPdf, ... }` (`Confirmado no front`; shape final depende de backend/Swagger)
  - downloads local/remoto por endpoints dedicados (`Confirmado no front`)

### 8.3 Empresas
- `POST /empresas` cria por CNPJ e aceita campos cadastrais/fiscais adicionais no front (`razaoSocial`, `nomeFantasia`, `inscricaoMunicipal`, `situacaoCadastral`, `dataSituacaoCadastral`, `dataInicioAtividade`, `cnaeFiscal`, `cnaeFiscalDescricao`, `porte`, `naturezaJuridica`, `capitalSocial`, `opcaoPeloSimples`, `dataOpcaoPeloSimples`, `dataExclusaoDoSimples`, `opcaoPeloMei`, `email`, `fone`, `endereco`) (`Confirmado no front`; validacao final depende de backend/Swagger)
- `GET /empresas/cnpj/:cnpj` usado para buscar/preencher prestador (`Confirmado no front`)
- `GET /empresas` usado para listagem e agora preparado no front para aceitar filtros de busca (`q`, `limit`) delegados ao backend (`Confirmado no front`; disponibilidade final depende de backend/Swagger)
- `PATCH /empresas/:id` aceita payload parcial com campos basicos e novos campos cadastrais/fiscais (`Confirmado no front`; regra final depende de backend/Swagger)
- `POST /empresas/certificado/import` aceita `multipart/form-data` (`cnpj`, `senhaCertificado`, `file`) para importacao de certificado A1 (`Confirmado no front`; metadados finais dependem de backend/Swagger)

### 8.4 Usuarios
- Roles atuais da API: `admin | manager | user` (`Confirmado no front`; fonte final depende de backend/Swagger)
- Front faz mapeamento de roles antigas para compatibilidade

## 9. Assuncoes do Backend (explicitas)
Estas assuncoes NAO devem ser tratadas como fatos canonicos sem verificacao no backend real.

- Assuncao A1: payload de `POST /auth/login` segue retornando `accessToken` (com tolerancia a `access_token` no front).
- Assuncao A2: `GET /nfse` mantem shape `{ items, meta }` com metadados de paginacao (`total`, `page`, `limit`, `totalPages`).
- Assuncao A3: `GET /nfse/:id` permanece resumo, e dados fiscais completos continuam no `GET /nfse/:id/provider-response`.
- Assuncao A4: endpoints de artifacts/download (`/artifacts`, `/xml`, `/pdf`, `/remote/xml`, `/remote/pdf`) permanecem ativos com semantica atual.
- Assuncao A5: `POST /empresas` continua aceitando payload minimo `{ cnpj }`.
- Assuncao A6: `PATCH /empresas/:id` continua aceitando payload parcial com campos atuais (`razaoSocial`, `nomeFantasia`, `inscricaoMunicipal`, `email`, `fone`, `endereco`).
- Assuncao A7: roles da API seguem `admin | manager | user` e status seguem `active | inactive`.
- Assuncao A8: erros de ausencia de certificado na emissao rapida seguem codigos operacionais (`CERTIFICADO_REQUIRED` ou `QUICK_PRESTADOR_NO_CERT`).

Checklist de validacao de assuncoes (sempre que houver mudanca de contrato):
1. Conferir Swagger/contrato do backend em execucao.
2. Registrar timestamp da verificacao em `Rastreabilidade de Atualizacao`.
3. Atualizar/remover assuncoes invalidadas.

## 10. Fluxos Funcionais
### 10.1 Emissao de NFSe
Tela: `src/pages/NfseEmitPage.tsx`

- Prestador pode ser obtido por:
  - selecao de empresa cadastrada, ou
  - busca por CNPJ (`/empresas/cnpj/:cnpj`)
- Payload enviado segue `EmitirNfseDto` (Swagger):
  - `prestador`, `tomador`, `servico`, `referenciaExterna`
- Regra operacional atual do DANFSE:
  - envia `servico.codigoTributacao` por padrao (`100`), com override via `VITE_NFSE_CODIGO_TRIBUTACAO_PADRAO`
- Front preenche campos inferidos do prestador (empresa) e envia tomador/servico do formulario
- UX atual de preenchimento:
  - empresa emissora via autocomplete (razao social/CNPJ) com debounce de 250ms
  - busca de servico via catalogo (`GET /nfse/servicos` com fallback `/nfse/servicos/autocomplete`) para sugerir `codigoNacional`
  - endereco do tomador com autocomplete por CEP (consulta externa), preenchendo logradouro/bairro/municipio/UF ao informar CEP valido
  - fallback operacional por CNPJ manual (`GET /empresas/cnpj/:cnpj`) permanece disponivel para carregar prestador

### 10.2 Lista de NFSe
Tela: `src/pages/NfseListPage.tsx`

- Usa `/nfse` para pagina/status/provider
- Como `/nfse` e resumo, a tela enriquece numero/tomador/valor consultando `provider-response` por linha

### 10.3 Detalhe da NFSe
Tela: `src/pages/NfseDetailPage.tsx`

- Usa `/nfse/:id` + `/nfse/:id/provider-response` + `/nfse/:id/artifacts`
- Dados exibidos sao extraidos de `provider-response.raw` (fallback robusto para formatos array/obj/string)
- Botao `Sincronizar` chama `POST /nfse/:id/sync-artifacts`

### 10.4 Dashboard
Tela: `src/pages/DashboardPage.tsx`

- Carrega lista base via `/nfse`
- Enriquece valores financeiros de autorizadas via `provider-response` (quando necessario)
- Possui cache local por emissao (`id + updatedAt`) para reduzir custo de refresh
- Possui snapshot local de KPIs/graficos para renderizacao imediata
- Botao `Recalcular do zero` limpa cache/snapshot e refaz calculo

### 10.5 Importacao de Certificado Digital
Tela: `src/pages/CertificadoDigitalPage.tsx`

- Formulario minimo: `cnpj`, `senhaCertificado`, `file (.pfx/.p12)`
- Validacao local antes de envio: campos obrigatorios e extensao permitida
- Envio em multipart para `POST /empresas/certificado/import`
- Feedback operacional:
  - loading durante envio
  - sucesso com `fileName`, `fileSize`, `uploadedAt`
  - erro padronizado (`code`, `message`, `correlationId`)
- Regra operacional alinhada ao backend:
  - no cadastro por CNPJ, empresa nova/incompleta pode exigir certificado previo (`CERTIFICADO_REQUIRED`);
  - na emissao (especialmente quick), ausencia de certificado bloqueia o fluxo (`QUICK_PRESTADOR_NO_CERT`).
- Restricao de seguranca: sem exibicao de conteudo sensivel do certificado

### 10.6 Endereco por CEP
Telas: `src/pages/EmpresaFormPage.tsx` e `src/pages/NfseEmitPage.tsx`

- CEP com mascara visual `00000-000` e normalizacao para 8 digitos no envio de payload
- Consulta automatica de CEP ao completar 8 digitos (fonte externa via `src/services/cep.ts`)
- Preenchimento assistido dos campos de endereco:
  - Empresa: `endereco`, `cidade`, `uf`
  - Tomador da emissao: `logradouro`, `bairro`, `municipio`, `uf`
- Feedback de UX:
  - estado de busca ("Buscando endereco pelo CEP...")
  - erro operacional quando CEP invalido/nao encontrado

### 10.7 Cadastro de Empresas (expandido)
Tela: `src/pages/EmpresaFormPage.tsx`

- Estrutura visual reorganizada em secoes:
  - `Dados da Empresa`
  - `Enquadramento Fiscal`
  - `Endereco`
  - `Contato`
- Novos campos incorporados para aderencia ao backend atualizado:
  - `situacaoCadastral`, `dataSituacaoCadastral`, `dataInicioAtividade`
  - `cnaeFiscal`, `cnaeFiscalDescricao`, `porte`, `naturezaJuridica`, `capitalSocial`
  - `opcaoPeloSimples`, `dataOpcaoPeloSimples`, `dataExclusaoDoSimples`, `opcaoPeloMei`
  - `endereco.numero`, `endereco.complemento`, `endereco.bairro`
- Compatibilidade de carga em edicao:
  - leitura com fallback camelCase/snake_case para campos legados e novos
- Observacao operacional:
  - regras finais de autocomplete de CNPJ/empresa serao totalmente orientadas por backend na proxima iteracao (apos confirmacao dos novos endpoints)

### 10.8 Emissao Rapida de NFSe
Tela: `src/pages/NfseQuickEmitPage.tsx`

- Formulario: `cnpj` + `cpfTomador` + `valor` + `codigoServico`
- UX atual de preenchimento:
  - empresa emissora via autocomplete (com dados de `/empresas`), preenchendo CNPJ automaticamente ao selecionar item
  - servico via busca no catalogo priorizando `GET /nfse/servicos` com fallback para `/nfse/servicos/autocomplete`, com supressao de toast global no erro esperado do primeiro endpoint

## 11. Atualizacao Operacional (2026-02-21)

### 11.1 O que foi entregue em commits recentes (frontend)
- `18b2978` `fix(empresas): melhora mapeamento do preview CNPJ e preenche campos fiscais pendentes`
- `240ff61` `style(layout): remove limites de largura e usa tela inteira nos formularios`
- `ecf9fcb` `feat(empresas): integra PrestadorSection e RegimeEParametrosSection no cadastro`
- `2a67a00` `style(empresas): replica layout de regime tributario e parametro fiscal da tela de referencia`
- `98f0b8e` `feat(empresas): adiciona layout de regime tributario e parametro fiscal no cadastro`
- `d80ee4b` `fix(empresas): amplia fallback de campos no preview e corrige parsing de data cadastral`
- `d891a66` `fix(empresas): adiciona aliases de preview por CNPJ para compatibilidade`
- `057e756` `fix(empresas): evita loop de erro no preview automático por CNPJ`
- `269e8d8` `fix(empresas): dispara preview automático ao completar CNPJ no cadastro`

### 11.2 Estado atual reportado em produção
- O fluxo de preview por CNPJ responde, porém ainda há relatos de campos sem preenchimento automático em alguns cenários.
- Campos críticos reportados:
  - `Data Situação Cadastral`
  - `Início de Atividade`
  - `CNAE Fiscal`

## 12. Atualizacao Operacional (2026-02-22)

### 12.1 Cadastro de Empresas - novos campos no frontend
Fonte: `codigo local` (`src/pages/EmpresaFormPage.tsx`, `src/components/PrestadorSection.tsx`, `src/services/api.ts`, `src/types/api.ts`)

- Campos adicionados e integrados no formulario de prestador:
  - `inscricaoEstadual`
  - `suframa`
  - `whatsapp`
- Persistencia:
  - `create/update` enviando os novos campos no payload para backend.
- Compatibilidade:
  - fallback de telefone/whatsapp mantido para conviver com contratos legados (`fone`/`telefone`).
- Regra mantida por orientacao funcional:
  - `Inscrição Municipal (IM)` **nao foi removida**; permanece para preenchimento manual.

### 12.2 UX de login para cold start (Render Free)
Fonte: `codigo local` (`src/pages/LoginPage.tsx`, `src/services/api.ts`)

- Warmup ao abrir `/login`:
  - chamada de pre-aquecimento via `GET /health` (`authApi.warmup`).
- Resiliencia no submit:
  - login com timeout maior (`30s`) e retry progressivo para falhas de rede/5xx.
- UX durante espera:
  - status de conexao por etapas (ex.: conectando/inicializando/autenticando);
  - dicas rotativas para orientar usuario contabil durante espera de cold start.
- Mensageria:
  - erros de login tratados de forma especifica (401, indisponibilidade, timeout), sem depender apenas de toast global.

### 12.3 Refino visual da tela de cadastro completa
Fonte: `codigo local` (`src/index.css`, `src/components/PrestadorSection.tsx`, `src/components/RegimeEParametrosSection.tsx`, `src/pages/EmpresaFormPage.tsx`)

- Hierarquia visual aprimorada:
  - badges de icones em gradiente (evita icones na mesma cor do texto);
  - subtitulos de secao;
  - card com faixa superior colorida usando paleta da marca.
- Escopo:
  - alteracao visual apenas (sem mudanca de regra de negocio do formulario).

### 12.4 Validacoes locais desta iteracao
Fonte: `execucao local`

- Build frontend executado com sucesso:
  - comando: `yarn build`
  - resultado: sucesso (Vite build concluido; warning de chunk grande mantido, sem bloqueio).

### 12.5 Dependência direta do backend
- Para esses campos, o frontend depende de `POST /empresas/preview`.
- A estratégia atual do frontend é:
  1. consumir campos normalizados do payload raiz;
  2. aplicar fallback via `providerData` quando disponível;
  3. inferir `regimeTributario = simples_nacional` quando detectar optante do Simples.
- Se os campos vierem ausentes já na resposta do backend, o front não consegue completar automaticamente.
  - busca com debounce de 250ms (empresa e servico) para reduzir flicker/chamadas e evitar feedback prematuro
  - codigo de servico sincronizado com o texto digitado no autocomplete (evita manter codigo antigo quando o usuario altera a busca)
  - campos com mascara visual para reduzir erro de digitacao (`CNPJ`, `CPF` e `valor` em formato monetario BRL)
- Envio para `POST /nfse/quick`
- Feedback operacional:
  - status `PENDING`: "Nota enviada para processamento."
  - `idempotentReplay = true`: "Reaproveitada por idempotencia."
- Regra de bloqueio: se backend retornar `CERTIFICADO_REQUIRED` ou `QUICK_PRESTADOR_NO_CERT`, emissao rapida fica bloqueada e direciona para importacao de certificado

## 13. Estado, Cache e UX de Dados
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

## 14. UI e Design System
- Base: shadcn/ui + Radix
- Tokens e tema: `src/index.css`
- Tailwind: `tailwind.config.ts`
- Alias: `@ -> src`
- Tema claro/escuro ativo via `next-themes`
- Botao de alternancia no header: `src/components/ThemeToggle.tsx`
- Paleta estendida no Tailwind: namespace `zera` (brand e dark tokens) em `tailwind.config.ts`
- Tokens HSL do shadcn atualizados em `src/index.css` para alinhar tema claro/escuro ao novo padrao de cor (brand navy/teal/amber)
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
- Cadastro de empresa reorganizado em cards por secao, com iconografia de apoio para leitura rapida dos blocos (empresa/fiscal/endereco/contato)

## 15. Testes e Qualidade
- Vitest: `vitest.config.ts` (`jsdom`)
- Setup: `src/test/setup.ts`
- Cobertura atual: teste exemplo + testes unitarios da camada de servicos para novos fluxos (`src/services/api.new-flows.test.ts`)
- Ultima execucao registrada: `npm run test` em `2026-02-21T11:34:27-04:00` (3 arquivos, 17 testes, todos passando)
- Revalidacao recente: `npm run lint` em `2026-02-21T11:34:16-04:00` (sem erros; warnings recorrentes de fast-refresh e `react-hooks/exhaustive-deps` em `DashboardPage`)
- ESLint sem erros bloqueantes; warnings recorrentes de fast-refresh em componentes UI
- `.gitignore` reforcado para env/build/cache/IDE e sem versionar secrets locais
- Build de validacao: registrar sempre data/hora explicita da ultima execucao (evitar "hoje"/"ontem")

## 16. Riscos Tecnicos Atuais
- Gargalo principal percebido: endpoint `/nfse` do backend pode levar ~8s (API local + MongoDB Atlas)
- Mesmo com otimizacoes de cache/snapshot no front, primeiro carregamento depende desse tempo de backend
- Front ainda depende de multiplas consultas de `provider-response` para enriquecer dados financeiros/visuais
- Cobertura de testes automatizados baixa

## 17. Convencoes para Novas Mudancas
- Toda integracao HTTP em `src/services/api.ts`
- Novos contratos tipados em `src/types/api.ts`
- Rotas autenticadas sob `ProtectedRoute`
- Novas telas devem ter loading/erro/vazio
- Mudancas de contrato devem ser verificadas no Swagger real antes de codar

## 18. Certificado Digital (PFX)
- Fato importante de negocio: emissao depende de certificado digital A1 (PFX/P12) por empresa
- Backend exposto para o front: `POST /empresas/certificado/import` (multipart com `cnpj`, `senhaCertificado`, `file`)
- Front implementa importacao sem exibir conteudo sensivel do certificado
- Regra de negocio vigente (backend): empresa nova/incompleta pode exigir certificado no cadastro (`CERTIFICADO_REQUIRED`) e a emissao bloqueia sem certificado vinculado (`QUICK_PRESTADOR_NO_CERT`)
- Persistem dependencias externas de provider para ciclo completo de emissao/renovacao, conforme regras do backend em execucao

## 19. Protocolo Canonico de Atualizacao (obrigatorio em todo commit)
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
3. Atualizar `Matriz de Evidencias` com data/hora e origem
4. Atualizar `Assuncoes do Backend` quando aplicavel
5. Atualizar rastreabilidade

Checklist de contrato vivo (pre-merge):
1. Conferir no Swagger real os contratos de `POST /auth/login`, `GET /auth/me`, `GET /nfse`, `GET /nfse/:id`, `GET /nfse/:id/provider-response`.
2. Validar o quick flow ponta a ponta: `POST /nfse/quick` com e sem `codigoServico`, incluindo erros `QUICK_PRESTADOR_NO_CERT` e `QUICK_CODIGO_SERVICO_INVALIDO`.
3. Validar fluxo de empresas: `POST /empresas/preview`, `POST /empresas` e `PATCH /empresas/:id`, com foco em normalizacao de campos fiscais/cadastrais.
4. Validar artifacts no detalhe: `GET /nfse/:id/artifacts`, `GET /nfse/:id/xml`, `GET /nfse/:id/pdf`, `GET /nfse/:id/remote/xml`, `GET /nfse/:id/remote/pdf`.
5. Registrar timestamp da verificacao e impactos neste arquivo antes do merge.

## 20. Rastreabilidade de Atualizacao
- Ultima atualizacao: 2026-02-26T09:10:00-04:00
- Responsavel: Codex (GPT-5)
- Tipo de atualizacao: registro de regressao de emissao DANFSE (E0312) com ajuste de contrato no frontend para envio de `codigoTributacao` padrao e alinhamento com payload historico aceito
- Observacao de continuidade: validar no `providerRequest.payload[0].servico[0]` a presenca de `codigo` + `codigoTributacao` em todo teste de emissao apos mudancas no formulario DANFSE.
