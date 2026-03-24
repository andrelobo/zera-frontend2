# Parecer de Aderência dos Autocompletes ao Fluxo Fiscal

Data: 24/03/2026

## Objetivo

Este documento registra a avaliação dos fluxos de autocomplete e autopreenchimento do `zera-frontend` em comparação com o padrão funcional do `novastelas`, considerando que:

- o `novastelas` foi a base conceitual do desenho do fluxo
- o `zera-frontend` opera com a infraestrutura real do produto
- a origem dos dados pode ser diferente, mas o comportamento de preenchimento precisa respeitar o fluxo fiscal desenhado

## Diretriz Aplicada

Foi adotada a seguinte regra:

- preservar o resultado funcional do `novastelas`
- usar a nossa API e o nosso backend sempre que possível
- não travar campos sem necessidade
- manter possibilidade de edição manual quando o fluxo operacional exigir ajuste
- não introduzir regressão fiscal nem visual desnecessária

Em termos práticos:

- equivalência de comportamento vale mais do que equivalência literal de implementação
- quando o `zera-frontend` reduz esforço operacional sem violar o desenho fiscal, a melhoria é considerada válida

## Conclusão Geral

O `zera-frontend` está aderente ao fluxo fiscal de autocomplete nos pontos principais de cadastro e emissão. Onde ele difere do `novastelas`, a diferença hoje é, em sua maior parte, consequência da adaptação ao backend real e, em alguns pontos, uma melhoria objetiva de UX sem perda de controle operacional.

Não foi identificado desvio que descaracterize o desenho do fluxo fiscal.

## Situação por Bloco

### 1. Cadastro e atualização de prestador

Status:
- aderente ao fluxo esperado

Comportamento:
- preenchimento por CNPJ continua existindo
- preenchimento por CEP continua existindo
- dados principais do prestador continuam sendo sugeridos automaticamente
- o fluxo está adaptado para usar a nossa API, com melhor controle da fonte do dado

Conclusão:
- comportamento compatível com o padrão esperado

### 2. Cadastro e atualização de tomador

Status:
- aderente ao fluxo esperado

Comportamento:
- preenchimento por documento continua existindo
- preenchimento por CEP continua existindo
- os dados principais do tomador continuam sendo sugeridos corretamente
- o fluxo no `zera-frontend` hoje tem proteção melhor contra resíduo de autofill anterior

Conclusão:
- comportamento compatível com o padrão esperado

### 3. Parâmetros municipais: CNAE, CTN e NBS

Status:
- aderente ao desenho funcional

Comportamento:
- pesquisa assistida continua existindo
- vínculos continuam sendo sugeridos e reaproveitados
- o `zera-frontend` mantém o comportamento de auto-hidratação inicial, mas hoje preserva melhor a edição manual do usuário

Conclusão:
- aderente ao fluxo, com melhoria de usabilidade

### 4. Nova DANFSE: Tomador

Status:
- aderente ao fluxo esperado

Comportamento:
- seleção de tomador já cadastrado continua funcionando
- preenchimento manual por CNPJ na emissão voltou a ficar assistido
- quando o usuário digita um CNPJ válido, o sistema consulta a nossa API e preenche os dados principais do tomador

Conclusão:
- o principal gap anterior desse bloco foi resolvido

### 5. Nova DANFSE: Local da Prestação

Status:
- aderente ao fluxo esperado

Comportamento:
- a lista de municípios continua sendo assistida
- o `zera-frontend` consulta primeiro a nossa API
- quando necessário, faz fallback direto ao IBGE, preservando o comportamento esperado do `novastelas`

Conclusão:
- aderente e mais resiliente

### 6. Nova DANFSE: Serviço Prestado

Status:
- aderente no objetivo funcional, mas não literal 1:1

Comportamento atual do `zera-frontend`:
- favorito pode preencher `CTN` e `Descrição do Serviço`
- `CTN` aceita digitação manual de forma mais livre
- `Lista Serviço` ajuda mais no preenchimento
- os campos continuam editáveis

Diferença em relação ao `novastelas`:
- o `zera-frontend` é mais assistido
- o `novastelas` é mais conservador em alguns preenchimentos automáticos

Leitura técnica e operacional:
- essa diferença não representa quebra do fluxo fiscal
- ela reduz digitação e esforço operacional
- ela só é saudável porque os campos continuam podendo ser corrigidos manualmente

Conclusão:
- a diferença é aceitável e pode ser tratada como melhoria de UX, não como desvio fiscal

## Gaps Restantes

No momento, os gaps remanescentes não são de ausência de autocomplete essencial. O que resta são diferenças finas de comportamento, especialmente no bloco `Serviço Prestado`, em que o `zera-frontend` está mais assistido do que o `novastelas`.

Essas diferenças devem ser entendidas como:

- adaptação ao backend real
- melhoria de produtividade do usuário
- não alteração do desenho tributário central

## Parecer Final

O fluxo de autocompletes do `zera-frontend` pode ser considerado aderente ao padrão funcional do `novastelas`, respeitando o desenho fiscal original, mesmo com fontes de dados diferentes.

Onde houve divergência, ela foi feita para:

- usar a infraestrutura real do produto
- reduzir esforço operacional
- preservar possibilidade de edição
- evitar regressão de fluxo

Portanto, a recomendação é:

- manter a UX mais assistida do `zera-frontend`
- seguir observando o bloco `Serviço Prestado` como diferença consciente de produto
- não forçar equivalência literal quando ela piorar a operação real
