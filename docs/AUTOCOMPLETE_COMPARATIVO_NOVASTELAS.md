# Autocomplete: ZERA x Novastelas

Data de referência: 24/03/2026

Regra de trabalho:
- Sem quebrar.
- Sem regressão.
- Uma coisa de cada vez.

## Objetivo

Este documento compara os fluxos de autocomplete e autopreenchimento do `zera-frontend` com o `novastelas`, com foco em:

- comportamento de preenchimento
- campos efetivamente alimentados
- possibilidade de edição após o preenchimento
- equivalência funcional, mesmo quando a fonte de dados é diferente

O critério principal aqui não é a origem do dado. O `novastelas` usa APIs externas e Supabase em vários pontos. O `zera-frontend` usa a nossa API, o nosso backend e, quando necessário, integrações externas por trás dele. O que importa neste comparativo é: o usuário recebe o mesmo preenchimento esperado ou melhor, sem perder capacidade de edição.

## Resumo Executivo

Situação geral:
- `Prestador` no cadastro/update: aderente e mais robusto no `zera-frontend`
- `Tomador` no cadastro/update: aderente e mais robusto no `zera-frontend`
- `CNAE` e `CTN/NBS` em parâmetros municipais: funcionalmente equivalentes, com adaptação maior no `zera-frontend`
- `Local da Prestação` na emissão: aderente ao `novastelas` em comportamento
- `Serviço Prestado` na emissão: não é literal 1:1; em vários pontos o `zera-frontend` está mais assistido
- `Tomador` na `Nova DANFSE`: o autocomplete manual por CNPJ agora está alinhado no núcleo do fluxo

Conclusão curta:
- o `zera-frontend` está bem aderente ao padrão do `novastelas` nos fluxos centrais de cadastro
- na emissão, o comportamento está mais adaptado ao backend real e em alguns trechos mais produtivo
- os gaps que restam hoje são mais de comportamento fino do `Serviço Prestado` do que de ausência de autocomplete core

## Metodologia

Comparação feita sobre os componentes e páginas abaixo:

`zera-frontend`
- `src/pages/EmpresaFormPage.tsx`
- `src/components/PrestadorSection.tsx`
- `src/components/TomadorSection.tsx`
- `src/pages/TomadorFormPage.tsx`
- `src/components/CNAESection.tsx`
- `src/components/CTNSection.tsx`
- `src/components/emissao/PrestadorSection.tsx`
- `src/components/emissao/TomadorEmissao.tsx`
- `src/components/emissao/PrestacaoServicoSection.tsx`
- `src/components/emissao/LocalPrestacaoSection.tsx`

`novastelas`
- `src/components/PrestadorSection.tsx`
- `src/components/TomadorSection.tsx`
- `src/components/CNAESection.tsx`
- `src/components/CTNSection.tsx`
- `src/components/emissao/TomadorEmissao.tsx`
- `src/components/emissao/PrestacaoServicoSection.tsx`
- `src/components/emissao/LocalPrestacaoSection.tsx`
- `src/pages/Index.tsx`
- `src/pages/EmissaoNFSe.tsx`

## Matriz de Equivalência

### 1. Cadastro/Update de Prestador

Status:
- Equivalente no preenchimento principal
- Melhor adaptado no `zera-frontend`

`novastelas`
- consulta CNPJ via `BrasilAPI` com fallback `ReceitaWS`
- consulta CEP via `BrasilAPI`
- preenche:
  - razão social
  - nome fantasia
  - CEP
  - logradouro
  - número
  - complemento
  - bairro
  - localidade/UF
  - email
  - telefone/whatsapp
  - optante do Simples

`zera-frontend`
- usa `empresasApi.getByCnpj` e `empresasApi.previewByCnpj`
- o backend resolve a melhor fonte disponível
- consulta CEP via `lookupCep`
- preenche os mesmos blocos principais
- também informa a fonte do autocomplete quando aplicável
- faz merge mais seguro entre dado já salvo e preview externo

Observações:
- no `zera-frontend`, a regra operacional mantém `inscricaoMunicipal` fora do autocomplete principal
- isso não piora o fluxo em relação ao `novastelas`
- do ponto de vista do P.O, o preenchimento relevante do prestador está aderente

Veredito:
- equivalente no resultado esperado do usuário
- melhor no controle e observabilidade da fonte

### 2. Cadastro/Update de Tomador

Status:
- Equivalente no preenchimento principal
- Melhor adaptado no `zera-frontend`

`novastelas`
- consulta CNPJ via `ReceitaWS` com fallback `BrasilAPI`
- consulta CEP via `BrasilAPI`
- preenche:
  - razão social
  - nome fantasia
  - CEP
  - logradouro
  - número
  - complemento
  - bairro
  - localidade/UF
  - email
  - whatsapp

`zera-frontend`
- consulta CNPJ via `empresasApi.previewByCnpj`
- consulta CEP via `lookupCep`
- preenche os mesmos campos principais
- além disso, aproveita melhor os dados normalizados do backend
- limpa campos de autofill antigos quando o documento muda, evitando “resíduos” de outro tomador
- exibe a fonte do autocomplete

Observações:
- o `zera-frontend` também trata melhor o contexto CPF x CNPJ
- isso reduz preenchimento incorreto quando o tomador é pessoa física

Veredito:
- equivalente ou melhor no comportamento de preenchimento
- mais seguro contra sujeira de estado antigo

### 3. CNAE no Cadastro/Regime

Status:
- Funcionalmente equivalente
- Não é implementação literal 1:1

`novastelas`
- busca CNAE em lista local
- resolve anexo via Supabase e edge function de fallback

`zera-frontend`
- busca CNAE em lista local
- resolve anexo via nossa API
- hidrata também CNAEs já existentes quando faltam anexos

Observações:
- para o usuário, a experiência continua sendo “pesquiso o CNAE e vejo descrição/anexo”
- a divergência é de infraestrutura e estratégia de lookup
- o `zera-frontend` ainda promove o CNAE selecionado como principal em alguns fluxos, comportamento mais forte que o do `novastelas`

Veredito:
- equivalente na experiência principal de autocomplete
- diferente na implementação interna

### 4. CTN/NBS em Parâmetros Municipais

Status:
- Muito próximo
- `zera-frontend` está mais adaptado

`novastelas`
- busca CNAE, CTN e NBS por listas locais
- usa defaults derivados de LC116/CTN/NBS
- sincroniza com regime tributário

`zera-frontend`
- usa o mesmo núcleo local para busca de CTN/NBS
- adiciona defaults mais ricos com `getDefaultVinculosForCnae`
- sincroniza com CNAEs do regime
- hoje já protege o campo para não sobrescrever a digitação manual do usuário

Observações:
- o comportamento final para quem usa o campo é equivalente ou melhor
- a lógica do `zera-frontend` está mais robusta para o backend atual

Veredito:
- equivalente no objetivo de preenchimento assistido
- mais completo no `zera-frontend`

### 5. Prestador na Nova DANFSE

Status:
- Equivalente ou melhor no `zera-frontend`

`novastelas`
- reutiliza o componente de prestador com busca externa direta

`zera-frontend`
- usa `components/emissao/PrestadorSection.tsx`
- consulta a nossa API para reaproveitar cadastro já salvo e preview
- mostra a fonte do autocomplete
- suporta `lockCnpj` no fluxo de emissão

Veredito:
- equivalente no preenchimento visível
- melhor alinhado ao produto real no `zera-frontend`

### 6. Tomador na Nova DANFSE

Status:
- Aderente no núcleo do fluxo
- Ainda mais enxuto visualmente do que o cadastro

`novastelas`
- carrega tomadores cadastrados via Supabase
- permite selecionar um tomador existente
- ao digitar CNPJ manualmente, dispara autocomplete remoto
- ao digitar CEP manualmente, dispara autocomplete remoto

`zera-frontend`
- carrega tomadores pela nossa API
- permite selecionar um tomador existente
- detecta se o documento digitado já corresponde a tomador cadastrado
- agora também faz autocomplete manual por CNPJ na emissão usando a nossa API
- faz preenchimento interno dos dados do tomador a partir desse lookup

Veredito:
- aderente no que importa para autocomplete do documento
- a diferença restante é mais de composição visual do bloco do que de falta de preenchimento

### 7. Serviço Prestado na Nova DANFSE

Status:
- Não é literal 1:1
- Em vários pontos o `zera-frontend` está mais assistido

#### 7.1 Serviços Favoritos

`novastelas`
- ao selecionar favorito, preenche CTN
- não joga automaticamente a descrição técnica no campo digitável

`zera-frontend`
- ao selecionar favorito, preenche CTN
- também pode preencher a descrição do serviço
- a descrição continua editável

Leitura:
- não é igual ao `novastelas`
- mas melhora UX ao reduzir digitação sem travar o campo

#### 7.2 Código Tributação Nacional

`novastelas`
- essencialmente dependente da seleção via dropdown

`zera-frontend`
- mantém dropdown
- também aceita digitação manual com commit em `blur` ou `Enter`

Leitura:
- não é igual
- mas é uma melhoria operacional útil

#### 7.3 Lista Serviço

`novastelas`
- acrescenta a descrição escolhida ao texto do serviço

`zera-frontend`
- pode preencher descrição
- e, quando disponível, também consegue ajustar código do serviço e alíquota a partir da configuração

Leitura:
- não é equivalente literal
- é mais “inteligente”, mas também mais opinado

Veredito geral do bloco:
- o comportamento difere do `novastelas`
- porém a diferença, em boa parte, favorece a operação
- deve continuar sendo observada com cuidado para não travar campos

### 8. Local da Prestação na Nova DANFSE

Status:
- Aderente ao `novastelas`
- API primeiro, fallback externo depois

`novastelas`
- busca municípios diretamente no serviço do IBGE

`zera-frontend`
- usa `listMunicipiosByUf`
- consulta primeiro o endpoint do backend `/empresas/lookup/municipios`
- se vier vazio ou indisponível, faz fallback direto ao IBGE

Veredito:
- aderente em comportamento
- preserva a preferência pela nossa API sem perder o fallback do `novastelas`

## Conclusão Final

Se a pergunta for:

"Os autocompletes do `zera-frontend` estão sendo feitos exatamente igual ao `novastelas`?"

A resposta correta é:
- não, não estão 100% literais

Se a pergunta for:

"Os fluxos principais estão preenchendo corretamente, mesmo usando fontes diferentes?"

A resposta correta é:
- sim, na maior parte dos fluxos centrais

Situação consolidada:
- `Prestador` cadastro/update: adequado
- `Tomador` cadastro/update: adequado
- `CNAE` e `CTN/NBS`: adequados
- `Prestador` na emissão: adequado
- `Tomador` na emissão: adequado no núcleo do autocomplete
- `Local da Prestação`: adequado
- `Serviço Prestado` na emissão: diferente, porém em vários pontos melhor para o usuário

## Recomendação Objetiva

Prioridade 1:
- decidir conscientemente se o comportamento mais assistido de `Serviço Prestado` no `zera-frontend` será mantido como melhoria oficial de UX

Prioridade 2:
- manter a regra atual do projeto:
  - usar a nossa API sempre que possível
  - preservar edição manual
  - não travar campo sem necessidade
  - não sacrificar o backend real para imitar protótipo

## Parecer para o P.O

O `zera-frontend` já está bem alinhado ao padrão funcional do `novastelas` nos fluxos principais de cadastro e emissão, mesmo usando fontes de dados diferentes. Onde ele difere, na maior parte dos casos, a diferença vem da adaptação necessária ao backend real e, em alguns pontos, melhora a experiência do usuário. O ponto que ainda merece decisão consciente não é ausência de autocomplete principal, e sim se o comportamento mais assistido do bloco `Serviço Prestado` será mantido como melhoria oficial do produto.
