# Spec — Dashboard operacional Jupati

Status: aprovado para implementacao local  
Data: 31/08/2026  
Escopo: rota `/` (`DashboardPage`)

## Cenario

A home atual repete indicadores, usa textos longos e autorreferentes, lista todas as
prestadoras com o mesmo peso e nao oferece uma ordem de decisao clara. O usuario
precisa identificar em poucos segundos se a operacao esta saudavel, o que exige
acao e qual foi a atividade fiscal mais recente.

## Objetivo

Transformar `/` em um cockpit operacional compacto, com hierarquia editorial,
dados acionaveis e linguagem Jupati, sem alterar contratos fiscais, endpoints,
permissoes ou regras de negocio.

## Criterios de aceite

1. O topo identifica o periodo observado e oferece a acao primaria adequada ao
   papel: emitir para perfis operacionais e consultar notas para `readonly`.
2. A primeira dobra mostra quatro sinais distintos: prestadoras, autorizadas,
   processando e erros/rejeicoes nas ultimas emissoes carregadas.
3. A saude da fila apresenta percentual de autorizacao e distribuicao visual de
   status sem depender apenas de cor.
4. Prioridades sao ordenadas por severidade: erros fiscais, onboarding, revisao de
   prestadoras e, por ultimo, estado saudavel.
5. Prestadoras em estado saudavel nao dominam a tela; a home destaca no maximo
   quatro empresas que exigem acao.
6. Atividade recente mostra prestadora, tomador, valor e status, com link para o
   detalhe da emissao quando houver `id`.
7. Estados de loading, erro e vazio continuam explicitos e acessiveis.
8. Dashboard classico e Dash2 permanecem acessiveis, mas deixam de competir com a
   acao primaria da home.
9. Layout funciona em mobile, tablet e desktop, com contraste e rotulos textuais
   para estados semanticos.

## Contratos preservados

- `GET /empresas` via `empresasApi.list({ limit: 24 })`.
- `GET /nfse` via `nfseApi.list`, limitado as dez emissoes mais recentes.
- Tipos `Empresa` e `Nfse` existentes.
- Rotas `/nfse/nova`, `/nfse`, `/nfse/:id`, `/empresas`, `/dash2` e
  `/dashboard-classico`.
- Restricao de escrita para a role `readonly`.

## Modelo de apresentacao

O calculo visual sera extraido para funcoes puras testaveis:

- classificacao de prontidao da prestadora;
- resumo dos status das emissoes;
- percentual de autorizacao;
- prioridades ordenadas;
- selecao das prestadoras que exigem acao.

## Fora de escopo

- novos endpoints ou alteracao do backend;
- novos calculos tributarios;
- graficos historicos ou comparacao mensal;
- filtro global persistente por prestadora;
- alteracao do dashboard classico ou Dash2;
- animacoes decorativas, imagens geradas ou mudanca da identidade Jupati.

## Rastreabilidade de testes

- CA 2 e 3: resumo de fila e percentual com fila vazia e mista.
- CA 4: ordenacao deterministica das prioridades.
- CA 5: selecao limitada a quatro prestadoras nao saudaveis.
- CA 1 e 6: verificacao de composicao na pagina e preservacao das rotas.
