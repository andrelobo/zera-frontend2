# ZERA Frontend – Current State

Snapshot operacional do frontend em **07/04/2026**.

## 0. Atualizacao rapida (08/04/2026) - favoritos do prestador isolados e refresh de emissao endurecido

Fonte: `codigo local` + `observacao funcional real em producao` + `build local`.

Leitura consolidada:
- o select `Servicos Favoritos` da `Nova DANFSE` deixou de misturar historico do tomador com cadastro atual do prestador
- a regra correta ficou explicita:
  - esse select deve refletir apenas os favoritos vigentes do prestador
- isso eliminou o caso em que o tomador `Andre` contaminava a lista com servicos antigos nao mais cadastrados no prestador

Correcao visual/comportamental aplicada:
- foi removido o rotulo `[Tomador]` dos itens do select
- o frontend deixou de misturar:
  - favoritos do prestador
  - historico `servicos` salvo no tomador

Leitura adicional desta rodada:
- depois da homologacao real do webhook, uma emissao passou a fechar rapido demais para a UI de listagem acompanhar sem refresh manual
- por isso, as telas de emissao agora invalidam o cache de `NFSe` logo apos sucesso em:
  - `Nova DANFSE`
  - `Emissao Rapida`

Regra operacional correta agora:
1. `Servicos Favoritos` = cadastro atual do prestador
2. historico do tomador nao deve contaminar esse select
3. emissao continua com o mesmo fluxo funcional
4. o refresh da listagem ficou mais resiliente ao webhook rapido, sem mexer em calculo ou payload

## 0. Atualizacao rapida (07/04/2026) - listagem de NFSe reduzida e filtro `PlugNotas` corrigido

Fonte: `codigo local` + `teste funcional manual` + `testes locais` + `build local`.

Leitura consolidada:
- a tela `Notas Fiscais` entrou em modo de quadro reduzido
- o objetivo desta rodada foi deixar apenas uma emissao visivel para avaliacao de layout/comentarios, sem apagar historico

Estado atual da listagem:
- mostra apenas a ultima emissao visivel
- nao depende mais de corte por data para decidir qual emissao aparece
- a paginacao foi removida dessa visao
- a tela informa que o historico permanece preservado

Bug corrigido na mesma frente:
- o filtro `PlugNotas` estava enviando `provider` em minusculas
- isso quebrava o casamento com o backend e podia esconder emissões reais da propria PlugNotas
- agora o filtro envia `PLUGNOTAS` corretamente

Leitura operacional correta:
1. historico nao foi apagado
2. o quadro foi reduzido visualmente para uma unica emissao
3. o filtro por provedor voltou a refletir o provider real das notas
4. se a lista ficar vazia com `PlugNotas`, a leitura automatica anterior de "nao ha emissao" ja nao vale como padrao

## 0. Atualizacao rapida (07/04/2026) - tomadores, observabilidade admin, prestador e emissao

Fonte: `codigo local` + `testes locais` + `build local`.

Leitura consolidada:
- a rodada recente foi pequena e cirurgica
- o frontend recebeu ajustes em:
  - cadastro de tomadores
  - menu/operacao interna
  - card de regime tributario do prestador
  - chamada visual de selecao pendente na emissao

Tomadores - cadastro:
- `Nome Fantasia` e `Suframa` foram removidos da interface
- `Inscricao Municipal` e `Inscricao Estadual` agora existem no formulario
- regra vigente:
  - aparecem ao lado de `CNPJ/CPF`
  - so aparecem para `CNPJ`
  - somem para `CPF`

Observabilidade Fiscal:
- entrou tela admin-only acessivel pelo menu do usuario
- a tela consulta:
  - `GET /nfse/webhook/diagnostico`
  - `GET /nfse/external/:externalId/observability`
- no frontend, ela virou a fonte de verdade visual para:
  - `Segredo`
  - `Header`
  - `Polling Fallback`
  - `Sync Autorizado`
  - `timeline` da emissao

Prestador:
- a aba `Regime Tributario` passou a mostrar o card:
  - `Prestacao de servicos, exceto para o exterior.`

Menu lateral:
- `Gestor AI` foi ocultado da navegacao lateral
- a pagina continua existindo internamente

Emissao:
- o seletor de tomador `Selecione (n)` agora recebe destaque forte quando a selecao ainda esta pendente
- a animacao para assim que o tomador deixa de estar pendente

Regra operacional consolidada desta rodada:
1. sem quebrar
2. sem regressao
3. uma coisa de cada vez

## 0. Atualizacao rapida (25/03/2026) - tomador CPF e validacao real do `cadastropf`

Fonte: `documentacao oficial do fornecedor` + `suporte do fornecedor` + `teste manual real`.

Leitura consolidada:
- o caso de uso de autocomplete rico para tomador por CPF foi analisado de ponta a ponta
- a API simples `cpf` / `nome_cpf` nao resolve o cadastro completo
- o servico correto do fornecedor para enriquecimento de PF e:
  - `cadastropf`

O que foi confirmado:
- o `cadastropf` retorna estrutura rica de dados pessoais
- no teste manual, vieram:
  - nome completo
  - data de nascimento
  - nome da mae
  - genero
  - telefones
  - enderecos
  - emails
  - salario estimado
- isso confirma viabilidade tecnica **em tese** para enriquecer o cadastro de tomador CPF

O que impediu a adocao imediata:
- os campos vieram fortemente ofuscados por LGPD no plano/token atual
- houve suspeita de desatualizacao em parte dos dados retornados
- por isso, a utilidade pratica para autopreenchimento em producao ainda nao ficou comprovada

Decisao operacional atual:
1. nao integrar `cadastropf` no ZERA por enquanto
2. registrar o achado como frente valida, mas dependente de:
   - liberacao LGPD
   - novo teste com campos legiveis
   - validacao de atualidade dos dados
3. quando houver prova suficiente, integrar via backend do ZERA, nao direto do frontend

Tomador - direcao de tela atual:
- `Substituto Tributario` continua sendo campo necessario no fluxo
- `Inscricao Municipal` e `Inscricao Estadual` nao sao mais tratadas como requisito de equivalencia para o formulario atual de tomador
- ajustes de layout nessa tela devem respeitar a regra:
  - botoes embaixo
  - sem inventar barra de acoes fora do padrao do front
  - uma alteracao visual por vez

## 0. Atualizacao rapida (24/03/2026) - autocomplete consolidado, emissao assistida e dashboard mais rapido

Fonte: `codigo local` + `testes locais` + `build local`.

Leitura consolidada:
- o frontend foi consolidado como camada produtiva, nao como espelho literal do `novastelas`
- a direcao correta ficou explicita:
  - equivalencia funcional de preenchimento
  - uso prioritario da nossa API
  - menor atrito operacional para o usuario
- o dashboard recebeu mais uma rodada de aceleracao da primeira pintura apos login

### Autocomplete

Documentos principais:
- `docs/AUTOCOMPLETE_COMPARATIVO_NOVASTELAS.md`
- `docs/PARECER_AUTOCOMPLETE_FLUXO_FISCAL.md`

Estado atual:
- `Prestador` cadastro/update: alinhado no preenchimento principal
- `Tomador` cadastro/update: alinhado no preenchimento principal
- `Tomador` manual na `Nova DANFSE`: autocomplete por CNPJ restaurado usando nossa API
- `Local da Prestacao`: nossa API primeiro, fallback ao IBGE
- `Servico Prestado`: segue mais assistido que o `novastelas`, sem travar campos

Leitura correta:
- o `zera-frontend` pode divergir de forma controlada do `novastelas` quando isso reduz digitacao e erro, sem perder editabilidade

### Nova DANFSE

Arquivos principais:
- `src/pages/NfseEmitPage.tsx`
- `src/pages/nfseEmit.tributacao.ts`
- `src/components/emissao/PrestacaoServicoSection.tsx`
- `src/components/emissao/TomadorEmissao.tsx`
- `src/components/emissao/ParametrosTributariosSNCard.tsx`

Estado atual:
- automacao de ISS ficou mais proxima do `novastelas`
- `Parametro Tributario Aplicado` agora fica visivel na emissao
- `Codigo Tributacao Nacional` continua editavel
- `Descricao do Servico` continua editavel mesmo com autopreenchimento

### Simples Nacional

Arquivos principais:
- `src/utils/simples-nacional.ts`
- `src/components/SimplesNacionalSection.tsx`
- `src/components/TabelaAnexoIII.tsx`

Estado atual:
- calculo de Simples / Anexo III alinhado ao `novastelas`
- card de apuracao de Simples deve ser lido como 100% alinhado
- tabela do Anexo III voltou a renderizar o `% ISS` corretamente

### Dashboard e pos-login

Arquivos principais:
- `src/App.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/hooks/useDashboardData.ts`
- `src/components/Dashboard.tsx`
- `src/components/dashboard/SimplesNacionalDashboard.tsx`

Estado atual:
- snapshot persistido reforcado
- rota do dashboard pre-aquecida na tela de login
- queries principais do dashboard prefetch apos autenticacao
- shell e topo aparecem antes
- blocos secundarios abaixo da dobra ficaram menos criticos para a primeira pintura
- competencias historicas continuam existindo e nao podem ser sacrificadas por performance

Regra operacional consolidada:
1. sem quebrar
2. sem regressao
3. uma coisa de cada vez

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
