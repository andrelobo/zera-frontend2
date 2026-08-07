# Contrato Mínimo de B.I. no Frontend

Atualizado em `2026-03-11`.

Objetivo:
- alinhar o frontend ao contrato canônico de B.I. do backend;
- separar claramente o que é `emissão` do que é `analytics`;
- evitar regra fiscal inventada na UI.

Este contrato integra o frontend ao ZERA como plataforma SaaS fiscal multiempresa.
Emissao e analytics sao capacidades complementares: dashboards, relatorios e
inteligencia tributaria consomem dados canonicos do backend sem substituir o motor
fiscal deterministico.

## 1. Regra canônica do frontend

- O frontend deve consumir dados canônicos do backend.
- O frontend pode enviar dados adicionais úteis para B.I. quando isso não alterar a regra de emissão.
- O frontend não deve inferir regra fiscal sem validação contábil.
- Quando houver dúvida entre UI e API, a verdade operacional é o retorno da API.

## 2. Emissão x B.I.

- `Emissão` usa o subconjunto mínimo necessário para autorizar a nota.
- `B.I.` usa uma camada mais ampla de dados:
  - cadastro fiscal do prestador;
  - catálogo operacional;
  - dados do tomador;
  - valores e retenções da emissão;
  - snapshots derivados seguros.

Resumo:
- todo dado de emissão pode alimentar B.I.;
- nem todo dado de B.I. precisa participar da emissão.

## 3. Campos do frontend que já devem seguir o contrato analítico

### 3.1 Empresa

Consumir do backend quando disponíveis:
- `simplesSnapshot`
- `biCatalogoResumo`
- `parametroMunicipal`
- `configOperacionais`
- `cnaeFiscal`
- `ctnCodigo`
- `nbsCodigo`
- `rbt12`
- `aliquotaSimplesNacional`
- `apuracaoSimplesNacional`

### 3.2 Tomador

Consumir/preservar:
- `cpfCnpj`
- `razaoSocial`
- `nomeFantasia`
- `inscricaoMunicipal`
- `inscricaoEstadual`
- `suframa`
- `substitutoTributario`
- `email`
- `whatsapp`
- `endereco.*`
- `servicos[]`

### 3.3 Emissão NFSe

Enviar/manter:
- `codigoServico`
- `descricaoServico`
- `valorServico`
- `baseCalculo`
- `desconto`
- `aliquotaIss`
- `valorIss`
- `retPis`
- `retCofins`
- `retCsll`
- `retIr`
- `retInss`
- `localPrestacao`
  - `pais`
  - `uf`
  - `municipio`

## 4. Regras operacionais importantes

### 4.1 Local da prestação

- `localPrestacao` deve seguir no payload da emissão por utilidade analítica.
- No cenário atual, ele não é tratado como requisito crítico de autorização.
- O objetivo é enriquecer B.I. e relatórios, não mudar a regra fiscal atual.

### 4.2 Tributação total

- O frontend não deve preencher `tributacaoTotal` artificialmente.
- As retenções individuais continuam sendo a fonte confiável:
  - `retPis`
  - `retCofins`
  - `retCsll`
  - `retIr`
  - `retInss`
- Qualquer agregação em `tributacaoTotal` depende de definição do contador.

### 4.3 Dashboard e relatórios

- O dashboard pode consumir `simplesSnapshot`, `biCatalogoResumo` e `biSummary` sem recalcular regra fiscal.
- A UI deve preferir campos analíticos persistidos a parsing de payload bruto.

## 5. Quando desconfiar do frontend

Se houver divergência entre o que a tela mostra e o esperado para emissão/B.I.:
1. inspecionar a resposta de `GET /empresas`;
2. validar `parametroMunicipal`, `ctnCodigo`, `nbsCodigo`, `simplesSnapshot` e `biCatalogoResumo`;
3. inspecionar a resposta de `GET /nfse/bi/summary`;
4. só depois revisar comportamento visual da tela.

## 6. Próximos passos recomendados

### Alta prioridade
- usar `simplesSnapshot` como fonte de leitura tributária consolidada;
- usar `biCatalogoResumo` para auditoria e completude de cadastro;
- manter `localPrestacao` no payload da emissão.

### Média prioridade
- evoluir relatórios e dashboard para ler os novos campos analíticos do backend;
- formalizar exports analíticos.

### Fora do escopo desta semana
- webhooks como canal principal de atualização de status;
- polling apenas como fallback na próxima etapa.
