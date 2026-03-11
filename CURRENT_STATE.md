# ZERA Frontend – Current State

Snapshot operacional do frontend em **07/03/2026**.

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
