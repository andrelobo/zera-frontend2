# ZERA Frontend – Current State

Snapshot operacional do frontend em **17/03/2026**.

## 0. Delta critico de hoje (17/03/2026) - refetch automatico de NFSe

Fonte: `codigo local` + `execucao local`.

Mudanca aplicada:
- `src/pages/NfseDetailPage.tsx`
  - passa a fazer `refetch` automatico a cada `15s` enquanto a emissao estiver em:
    - `PENDING`
    - `PROCESSING`
  - o mesmo intervalo vale para:
    - detalhe da NFSe
    - artifacts
    - provider response
- `src/pages/NfseListPage.tsx`
  - passa a fazer `refetch` automatico a cada `15s` quando houver ao menos uma emissao ativa na lista (`PENDING`/`PROCESSING`)

Objetivo:
- reduzir necessidade de refresh manual para acompanhar transicao de status.

Garantia de nao regressao:
- nenhum payload foi alterado;
- nenhum fluxo de emissao foi alterado;
- mudanca restrita a reconsulta de dados em tela.

Validacao:
- `yarn eslint src/pages/NfseDetailPage.tsx src/pages/NfseListPage.tsx` -> `PASS`

## 0. Delta critico de hoje (16/03/2026) - cards 1/2/3 de Parametros Municipais

Fonte: `codigo local` + `execucao local`.

Mudanca aplicada em `src/components/CTNSection.tsx`:
- removida a borda azul fixa (`radio-card-selected`) dos 3 cards:
  - `1. Código Cnae`
  - `2. Código Tributação Nacional`
  - `3. Nomenclatura Brasileira Serviços`
- efeito azul agora fica apenas no `hover` (classe base `radio-card`), como no comportamento esperado.

Garantia de nao regressao funcional:
- nenhuma regra de preenchimento automatico/autocomplete foi alterada;
- nenhuma regra de salvamento de `parametroMunicipal` foi alterada.

Validacao:
- `yarn test` -> 16 arquivos, 61 testes, `PASS`
- `yarn build` -> `PASS`

## 0. Delta critico de hoje (16/03/2026)

Fonte: `contrato backend`.

Novo dado canonico disponivel no backend para futuro consumo no frontend:
- `prontoParaBi`
- `percentualCompletudeBi`
- `camposFaltantesBi`

Leitura correta:
- `statusCadastro` / `prontoParaEmitir` continuam tratando completude minima para cadastro/emissao;
- `prontoParaBi` passa a representar completude analitica do prestador.

Estado atual do frontend:
- ainda nao ha bloco visual consumindo esses campos;
- o backend ja passou a ser a fonte canonica dessa separacao.

## 0. Delta crítico de hoje (11/03/2026)

Fonte: `codigo local`.

Melhorias recentes de contrato/frontend para B.I.:

- `src/pages/NfseEmitPage.tsx`
  - payload da emissao agora envia `localPrestacao` (`pais`, `uf`, `municipio`) de forma aditiva.
  - preenchimento artificial de `tributacaoTotal` foi removido do frontend para evitar contaminar B.I. com regra contábil não validada.
- `src/types/api.ts`
  - `EmitirNfseRequest` passou a declarar `localPrestacao?`.
  - `Empresa` passou a declarar `simplesSnapshot?`.
  - `Empresa` passou a declarar `biCatalogoResumo?`.
  - `NfseBiSummary` passou a aceitar:
    - `tributacaoTotal?`
    - `topMunicipiosPrestacao?`
    - `topTomadores?`
- `src/services/api.ts`
  - `normalizeEmpresa()` passou a consumir `simplesSnapshot` vindo do backend.
- `docs/BI_CONTRATO_MINIMO.md`
  - contrato mínimo de B.I. formalizado para frontend.

Regra operacional vigente:
- `tributacaoTotal` não deve ser inventado no frontend.
- até alinhamento com contador/regra fiscal, as retenções individuais continuam sendo a fonte confiável para analytics:
  - `retPis`
  - `retCofins`
  - `retCsll`
  - `retIr`
  - `retInss`

## 1. Estado vigente

- App principal em React + Vite, consumindo `zera-backend`.
- Fluxo canônico preservado:
  - backend resolve e normaliza;
  - frontend consome, apresenta e envia payload coerente.

## 2. Delta crítico de hoje

### 2.1 Prestador -> Parâmetros Fiscais -> Emissão

Diagnóstico consolidado:
- a tela de `Parâmetros Municipais` podia aparentar consistência por fallback local do frontend;
- a verdade operacional passou a ser sempre o retorno real de `GET /empresas`.

Problema observado em produção:
- API devolvia:
  - `parametroMunicipal: []`
  - `ctnCodigo: "040101"`
  - `nbsCodigo: "1.2301.22.00"`
- consequência:
  - DANFSE/emissão renderizava `04.01.01 / Medicina`.

Correção aplicada no frontend:
- `src/pages/EmpresaFormPage.tsx`
  - o `Salvar` agora envia `parametroMunicipal` canônico quando a UI estiver montada por fallback local;
  - `ctnCodigo` e `nbsCodigo` enviados no `PATCH` passam a derivar do primeiro vínculo real do CNAE principal.

Resultado esperado após save + reload:
- `GET /empresas` deve devolver:
  - `parametroMunicipal` preenchido
  - `ctnCodigo = "041601"`
  - `nbsCodigo = "1.2301.98.00"`

### 2.2 Ticker global

Arquivos:
- `src/components/GlobalTicker.tsx`
- `src/index.css`

Estado atual:
- ticker usa faixa duplicada contínua;
- animação desloca até `-50%`;
- buraco visual no fim do loop foi eliminado.

### 2.3 Prestador -> Parâmetros Federais

Arquivo:
- `src/pages/EmpresaFormPage.tsx`

Estado atual:
- campo `Simples Nacional` (alíquota) foi ampliado para acomodar corretamente valores com 2 casas decimais.

### 2.4 Dashboard

Arquivos:
- `src/components/Dashboard.tsx`
- `src/hooks/useDashboardData.ts`

Estado atual:
- `Cliente sem nome` foi substituído por `Emissão expressa` quando não existir razão social do tomador;
- seções fracas/zeradas foram condicionadas:
  - `Split Payment` só aparece com dado real;
  - `ISS Retido por Mês` só aparece com retenção real;
  - `Faturamento por Cliente` só aparece com distribuição real;
- dashboard recebeu reforço visual executivo:
  - hero superior;
  - KPIs principais destacados;
  - hierarquia mais forte para apresentação externa.

## 3. Testes/validação recentes

- `eslint src/pages/EmpresaFormPage.tsx` sem erro
- `eslint src/components/Dashboard.tsx src/hooks/useDashboardData.ts` sem erro
- `eslint src/components/GlobalTicker.tsx` sem erro

## 4. Regra operacional

Sempre que houver divergência entre o que a UI aparenta e o que a emissão mostra:
1. inspecionar `GET /empresas`;
2. validar `parametroMunicipal`, `ctnCodigo`, `nbsCodigo`;
3. só depois investigar a renderização do frontend.
