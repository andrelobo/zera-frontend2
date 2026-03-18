# Dashboard Review

Este documento registra, de forma objetiva, por que o dashboard atual passa a percepcao de "horroroso" e qual foi a direcao adotada no `Dash2`.

## Objetivo

Separar claramente:

- problemas de regra de negocio: nao encontrados nesta revisao
- problemas de leitura, composicao e acabamento visual: encontrados em varios pontos

O `Dash2` foi criado para atacar apenas a segunda categoria.

## O que esta ruim no dashboard atual

### 1. Hierarquia visual fraca

O painel atual nao deixa claro, em poucos segundos, qual e a informacao principal.

Sinais disso:

- muitos cards com peso parecido
- ausencia de um bloco hero forte
- varios KPIs pequenos competindo no mesmo nivel
- falta de uma leitura natural do tipo:
  - onde estou
  - quanto faturei
  - quanto devo recolher
  - onde esta o risco

Impacto:

- usuario precisa "decodificar" o painel
- sensacao de painel tecnico em vez de produto premium

### 2. Densidade excessiva

Ha informacao demais por area util.

Sinais disso:

- textos em `text-[7px]`, `text-[8px]`, `text-[9px]`
- muitas labels por card
- tabelas muito comprimidas
- badges e microanotacoes demais

Impacto:

- cansaco visual
- leitura truncada em telas menores
- impressao de ferramenta improvisada

### 3. Linguagem visual inconsistente

Os componentes nao parecem pertencer ao mesmo sistema.

Sinais disso:

- alguns cards usam headers coloridos fortes
- outros usam superficies neutras
- alguns parecem widgets de BI
- outros lembram blocos administrativos
- o topo nao conversa com o corpo do painel

Impacto:

- o produto perde unidade
- o dashboard parece montado por partes

### 4. Excesso de cor sem papel claro

Cor hoje e usada demais e sem uma hierarquia forte.

Sinais disso:

- verde, azul, vermelho, laranja e accent disputando atencao
- headers coloridos em varios cards
- badges coloridos em excesso
- semanticamente nem sempre fica claro o que e dado principal, alerta ou apoio

Impacto:

- ruido
- leitura menos elegante
- sensacao visual amadora

### 5. Informacao tecnica e informacao executiva misturadas

O mesmo nivel de destaque e dado para:

- resumo executivo
- simulacao
- split payment
- partilha
- tabelas detalhadas
- distribuicao por cliente
- servicos executados

Impacto:

- falta de foco
- usuario nao sabe o que olhar primeiro

### 6. Tipografia pequena demais

O dashboard atual depende demais de textos minimos para caber.

Impacto:

- a interface parece apertada
- a leitura nao transmite seguranca
- o painel perde "presenca"

### 7. Cards demais, narrativa de menos

O dashboard atual parece um mosaico de widgets.

Problema central:

- existe muita componenteizacao
- mas pouca direcao editorial

Em um dashboard premium, os dados precisam contar uma historia.

## Onde os problemas aparecem no codigo

Arquivos mais criticos:

- `src/components/Dashboard.tsx`
- `src/components/dashboard/SimplesNacionalDashboard.tsx`
- `src/components/dashboard/DashboardCard.tsx`
- `src/components/dashboard/DashboardHeader.tsx`
- `src/components/dashboard/EmissoesResumoMini.tsx`
- `src/components/dashboard/ParticipacaoClientes.tsx`
- `src/components/dashboard/ServicosExecutados.tsx`

## O que precisava mudar

Direcao adotada para o redesign:

- menos widgets por tela
- mais respiro
- um topo hero real
- KPIs prioritarios em destaque
- alertas subindo na hierarquia
- listas e detalhes descendo para papel de apoio
- superficies mais sofisticadas
- menos cor, com mais intencao
- tipografia maior
- leitura mais executiva

## O que o Dash2 faz

O `Dash2` foi criado com estas regras:

- nao altera motor de calculo
- nao altera contrato de dados
- nao altera `useDashboardData`
- nao altera logica de negocio
- muda apenas:
  - composicao
  - hierarquia
  - presentacao
  - narrativa visual

## Decisoes do Dash2

### Topo hero

Funcao:

- ancorar o usuario
- mostrar contexto
- destacar os dois numeros mais importantes

### Linha de KPIs enxuta

Funcao:

- resumir operacao do mes sem poluir

### Bloco de alertas separado

Funcao:

- dar peso visual ao risco
- parar de esconder alerta no meio do painel

### Clientes e emissoes como apoio

Funcao:

- deixar a analise operacional mais elegante
- reduzir sensacao de "tabela apertada"

### Resumo final explicativo

Funcao:

- explicar visualmente por que o Dash2 existe
- deixar claro que o redesign nao mexe nas regras

## Conclusao

O problema do dashboard atual nao e falta de dado.

O problema principal e:

- excesso de densidade
- baixa hierarquia
- mistura de linguagens visuais
- pouca direcao editorial

Por isso, a estrategia correta nao foi mexer nas regras.

Foi criar um novo dashboard paralelo, `Dash2`, com a mesma inteligencia e uma casca visual muito melhor.
