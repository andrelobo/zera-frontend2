# CONTEXT.md

Documento canonico do projeto `zera-frontend`.
Objetivo: fonte unica de contexto tecnico para desenvolvimento, review e manutencao.
Escopo deste arquivo: app frontend na raiz deste repositorio `zera-frontend/` (onde fica o `package.json`).
Padrao de auditabilidade: cada afirmacao relevante deve indicar origem (`codigo local`, `execucao local`, `Swagger/backend`) e timestamp da ultima verificacao.

## 0. Premissa Canonica de Operacao

- o `zera-frontend` deve ser tratado como **frontend ja em producao**
- qualquer alteracao em dashboard, prestador, tomador, emissao, certificado ou polling visual deve assumir:
  - usuarios reais
  - dados reais
  - risco real de regressao
- quando houver duvida entre "fluxo em ajuste" e "produto ainda nao produtivo", a leitura canonica correta e:
  - **o ZERA ja esta em PROD**

Regra de trabalho:
- a UI nao e laboratorio isolado; ela e camada ativa de uma operacao fiscal real
- por isso, toda mudanca deve priorizar:
  - preservacao de contrato com backend
  - estabilidade dos fluxos criticos
  - leitura correta do estado real da API
  - reducao de regressao visual/comportamental

Leitura correta dos updates deste arquivo:
- melhorias, alinhamentos visuais, rollout de polling e ajustes de BI acontecem sobre uma base ja produtiva
- homologacao pontual de algum fluxo nao revoga a premissa de sistema em producao


## 0. Atualizacao de Contexto (2026-05-18) - novo patamar multi-prestador e impacto direto na leitura da listagem DANFSE
Fonte: `execucao real` + `codigo local` + `build local`.

Leitura consolidada:
- o frontend ja participa da primeira etapa funcional de multi-prestador com seletor explicito de empresa na `Nova DANFSE` e na `Emissao Rapida`
- o segundo prestador ja emitiu nota real apos sincronizacao com a PlugNotas e configuracao operacional complementar no provider
- isso muda a leitura do produto: a listagem operacional de NFSe nao pode mais pressupor que todas as notas pertencem implicitamente a um unico prestador
- a tela `Notas Fiscais` passou a explicitar tambem a prestadora responsavel por cada emissao, sem perder o foco em status e tomador

Regra operacional desta frente:
1. multi-prestador deixou de ser preparacao interna e virou realidade operacional assistida
2. qualquer quadro/listagem de emissao deve passar a considerar prestador como informacao de primeira classe
3. a evolucao da listagem deve preservar os sinais atuais de status, tomador e acoes, apenas ampliando o contexto para a prestadora
4. nao voltar a assumir prestador unico por omissao visual

## 0. Atualizacao de Contexto (2026-05-14) - dominio `zera.net.br` e regra canonica de CORS
Fonte: `execucao real` + `codigo local`.

Leitura consolidada:
- o frontend passou a operar pelo dominio `https://zera.net.br`
- a troca de dominio nao pode ser lida como mudanca apenas de Vercel ou DNS
- no modelo atual do ZERA, qualquer nova origem publica do frontend depende de ajuste correspondente em `CORS_ORIGINS` no backend
- a falha observada apos a mudanca foi preflight `OPTIONS` retornando erro antes de `/health` e `/auth/login`
- a causa real nao estava em `FRONTEND_URL` nem em `FRONTEND_APP_URL`, e sim na allowlist de CORS do backend

Regra canonica desta frente:
1. novo dominio, subdominio ou alias publico do frontend exige revisar `CORS_ORIGINS` no backend
2. mudar URL publica sem alinhar CORS pode derrubar login, healthcheck e demais chamadas do navegador
3. a validacao correta dessa mudanca e testar `OPTIONS`, `/health` e `/auth/login` apos o redeploy
4. manter o lema: sem quebrar, sem regredir, uma coisa de cada vez

## 0. Atualizacao de Contexto (2026-05-12) - auditoria das integracoes externas e verdade atual da centralizacao
Fonte: `codigo local` + `docs locais`.

Leitura consolidada:
- o frontend ja conversa com o backend do ZERA para os fluxos centrais de:
  - CPF de tomador
  - CNPJ de prestador/tomador
  - CEP
- a borda canonica de CPF continua sendo `GET /tomadores/lookup/cpf`
- a borda canonica de CEP continua sendo `GET /empresas/lookup/cep/:cep`
- a borda canonica de municipios existe em `GET /empresas/lookup/municipios`

Verdade atual que nao deve ser omitida:
- ainda existem duas chamadas diretas do frontend ao `IBGE Localidades` em fluxo ativo da emissao
- elas aparecem exatamente em:
  - `src/services/location.ts`
  - `src/components/emissao/PrestacaoServicoSection.tsx`
- `src/services/location.ts` alimenta `LocalPrestacaoSection`, que esta ligada a `NfseEmitPage`
- `src/components/emissao/PrestacaoServicoSection.tsx` tambem esta ligado diretamente a `NfseEmitPage`

Regra canonica desta frente:
1. a direcao correta e o frontend falar somente com o backend do ZERA
2. consumo direto de servicos externos no navegador deve ser tratado como divida tecnica remanescente
3. qualquer centralizacao futura deve preservar comportamento e nao misturar limpeza arquitetural com alteracao fiscal
4. manter o lema: sem quebrar, sem regredir, uma coisa de cada vez

## 0. Atualizacao de Contexto (2026-04-21) - DANFSE padrao com tomador manual, endereco obrigatorio e escolha de cadastro
Fonte: `codigo local` + `testes locais` + `build local`.

Leitura consolidada:
- a DANFSE padrao continua sendo o fluxo completo de emissao
- agora ela tambem permite preencher tomador manual/avulso sem depender previamente do cadastro de tomadores
- quando o CPF/CNPJ digitado nao existe no cadastro, ou quando o tomador cadastrado esta sem endereco fiscal completo, a tela abre o bloco `Dados do tomador para esta nota`
- esse bloco coleta os dados que o backend ja exigia para a emissao:
  - CEP
  - logradouro
  - numero
  - bairro
  - complemento
  - cidade/UF
  - e-mail
- o CEP digitado nesse bloco consulta a mesma fonte de CEP usada no restante do frontend e preenche endereco quando houver retorno util

Validacao antes do backend:
- a tela agora bloqueia a emissao padrao antes de chamar a API se faltar:
  - CEP valido do tomador
  - logradouro do tomador
  - numero do tomador
  - bairro do tomador
- isso substitui o erro bruto do backend por mensagem local clara, sem relaxar a regra fiscal

Cadastro do tomador a partir da emissao:
- para tomador manual/nao cadastrado, a DANFSE mostra a pergunta `Cadastrar no cadastro de tomadores?`
- o padrao para tomador manual e `Nao`
- se o usuario marcar `Sim`, o frontend envia `syncTomadorCadastro: true`
- se o usuario mantiver `Nao`, o frontend envia `syncTomadorCadastro: false`
- quando o tomador ja existe no cadastro, a pergunta nao aparece e o comportamento segue estavel

Regra operacional:
1. DANFSE padrao pode emitir para tomador nao cadastrado, desde que os dados fiscais obrigatorios sejam informados na propria tela
2. Emissao Rapida continua sendo payload minimo e nao vira cadastro formal de tomador
3. cadastro de tomador a partir da DANFSE padrao virou decisao explicita do usuario
4. nao inventar endereco, nao inferir dados ausentes e nao criar tomador sem escolha consciente
5. manter o mantra: sem quebrar, sem regredir, uma coisa de cada vez

Validacao desta rodada:
- `npm test -- src/components/emissao/TomadorEmissao.test.tsx src/pages/NfseEmitPage.tomador-substituto.test.tsx`
- `npm run build`


## 0. Atualizacao de Contexto (2026-05-18) - emissao entrou na primeira etapa funcional de multi-prestador
Fonte: `codigo local` + `build local`.

Leitura consolidada:
- `Nova DANFSE` e `Emissao Rapida` deixaram de assumir a Burgus como prestador unico operacional
- as duas telas agora possuem seletor explicito de prestador
- a troca de prestador limpa tomador e servico na `Nova DANFSE` para evitar mistura entre empresas
- `Emissao Rapida` continua enviando o mesmo contrato de backend (`cnpj`, `cpfTomador`, `valor`, `codigoServico`), mudando apenas a origem do `cnpj`
- o frontend continua dependente do backend para a aptidao real de emissao; selecionar empresa na tela nao basta sem sincronizacao da cadeia PlugNotas
- o cadastro do prestador ganhou uma acao explicita `Sincronizar com a PlugNotas` para subir certificado/cadastro do lado do provider sem acoplar isso ao botao de salvar nesta rodada

Regra operacional:
1. esta rodada e a primeira etapa funcional de multi-prestador, ainda conservadora
2. o frontend nao deve mais fixar Burgus ou qualquer empresa como prestador padrao absoluto
3. a aptidao real do novo prestador continua dependendo de certificado, parametros e sincronizacao com a PlugNotas
4. nao transformar salvar cadastro em sincronizacao automatica de provider sem validacao operacional previa

## 0. Atualizacao de Contexto (2026-04-21) - listagem de NFSe volta a exibir ultimas 10 emissoes
Fonte: `codigo local` + `build local`.

Leitura consolidada:
- a tela `Notas Fiscais` deixou de ficar limitada a uma unica emissao visivel
- a listagem agora busca `page = 1`, `limit = 10`, `sort = createdAt`, `order = DESC`
- objetivo: mostrar as ultimas 10 emissoes mais recentes com seus respectivos status
- a coluna `Status` permanece como fonte visual principal do estado da emissao
- os filtros de `Status` e `Provedor` continuam funcionando sobre esse recorte
- a listagem agora explicita tambem a prestadora responsavel pela emissao, preservando o tomador como eixo operacional relevante por linha
- polling visual continua ativo apenas quando houver emissao em `PENDING` ou `PROCESSING`

Regra operacional:
1. nao apagar historico
2. nao reintroduzir paginacao nesta rodada
3. manter a listagem como quadro operacional das ultimas 10 emissoes
4. preservar detalhes, PDF e download por linha

## 0. Atualizacao de Contexto (2026-04-21) - tema visual elegante azul, icones condicionais e onboarding de usuarios
Fonte: `codigo local` + `git log local` + `build local`.

Leitura consolidada:
- o frontend passou a ter duas alternancias independentes no menu do usuario:
  - `Tema claro/escuro` controla o tema base via `next-themes`
  - `Visual elegante/classico` controla apenas a camada visual propria do ZERA
- o `ThemeProvider` nao deve mais forcar somente tema claro; o dark mode do Tema 1 voltou a poder ser alternado pelo usuario
- o `Visual elegante` e aplicado por `body.theme-elegant`, persistido em `localStorage` e sincronizado por hook compartilhado
- a paleta canonica do `Visual elegante` voltou para a familia azul do ZERA; nao usar verde/marrom como direcao dessa frente
- a fonte do `Visual elegante` e `Manrope`, mantendo leitura mais fina/elegante sem trocar a base funcional

Regra canonica dos icones:
- o kit novo e `@phosphor-icons/react`
- Phosphor deve aparecer somente quando `Visual elegante` estiver ativo
- o tema classico continua com `lucide-react`
- a troca de icones aplicada ate aqui fica restrita a casca do app:
  - sidebar
  - header
  - menu do usuario
  - toggles de tema/visual
- nao trocar icones globalmente em formularios fiscais, emissao, prestador ou tomador sem rodada especifica

Onboarding de usuarios no frontend:
- area admin de usuarios esta acessivel pelo menu do usuario em `/users`
- rotas atuais:
  - `/users`
  - `/users/novo`
  - `/users/:id`
  - `/accept-invite`
- admin pode:
  - listar usuarios
  - editar perfil/status/senha
  - remover usuario
  - criar usuario manualmente
  - gerar convite seguro e copiar link de primeiro acesso
- usuario convidado define a propria senha em `/accept-invite?token=...`
- se o backend nao devolver `inviteUrl`, o frontend monta o link usando `window.location.origin`
- senha nao deve trafegar por e-mail; o link de convite e a trilha recomendada

Validacao desta rodada:
- `yarn build` passou apos a troca visual e inclusao do Phosphor

Regra operacional:
1. tema elegante deve ser evoluido atras do toggle, sem alterar contratos fiscais
2. kit novo de icones e exclusivo do visual elegante
3. tema classico continua servindo como baseline anti-regressao
4. qualquer expansao de icones para telas internas deve ser feita uma tela por vez

## 0. Atualizacao de Contexto (2026-04-20) - DANFSE, CPF, servicos favoritos e emissao rapida sem poluir tomadores
Fonte: `codigo local` + `testes locais` + `validacao funcional real`.

Leitura consolidada:
- a DANFSE normal segue como fluxo completo de emissao, com tomador selecionado ou preenchido manualmente
- o enriquecimento por CPF agora tambem participa do tomador digitado manualmente na DANFSE
- quando o documento for CPF, a UI deve usar leitura de pessoa fisica:
  - label `Nome`
  - sem campos de PJ como inscricao municipal
- quando o CPF existir localmente, o frontend pode preencher os dados salvos e ainda consultar o Hub do Desenvolvedor para complemento
- quando o Hub devolver apenas nome/data/genero, isso e sucesso parcial, nao falha visual

Servicos na DANFSE:
- `Servicos Favoritos` deve vir do cadastro atual do prestador em `Prestador > Parametros Municipais`
- se o prestador tiver dois favoritos salvos, os dois precisam aparecer na emissao
- a lista da DANFSE nao deve depender de historico do tomador nem de dados antigos contaminando o select
- a tela pode exibir itens sem CTN/NBS apenas quando o cadastro realmente estiver incompleto; nesse caso, a leitura correta e revisar/salvar o prestador

Emissao rapida:
- `Emissao Rapida` continua sendo o fluxo para emitir com payload minimo, inclusive CPF sem cadastro completo
- ela nao deve ser tratada como fonte de cadastro formal de tomadores para o seletor da DANFSE
- tomadores antigos que ja tenham sido criados por emissao rapida sao legado de banco e exigem limpeza propria, fora de mudancas visuais

Regra operacional:
1. nao misturar correcao visual com alteracao fiscal
2. nao inferir dados ausentes do Hub no frontend
3. nao sobrescrever dados manuais bons com retorno parcial
4. validar servicos favoritos sempre contra o cadastro vigente do prestador
5. manter a premissa: sem quebrar, sem regredir, uma coisa de cada vez

## 0. Atualizacao de Contexto (2026-04-17) - CPF de tomador em producao com retorno parcial do Hub do Desenvolvedor
Fonte: `codigo local` + `curl em producao` + `validacao funcional real`.

Leitura consolidada:
- a rota de lookup de CPF para tomadores PF esta ativa em producao no backend
- o fluxo deixou de estar bloqueado por rota ausente ou token faltando
- o retorno real observado para CPF valido confirmou a integracao funcionando, mas com payload parcial

Evidencia funcional desta rodada:
- `GET /tomadores/lookup/cpf?cpf=` respondeu em producao
- o backend encontrou CPF real e devolveu `found: true`
- o retorno observado trouxe:
  - `nome`
  - `dataNascimento`
  - `genero`
  - `lastUpdate`
- o mesmo retorno nao trouxe:
  - `email`
  - `telefone`
  - `endereco`

Leitura canonica correta agora:
1. a integracao de CPF para `tomadores` esta funcional
2. o endpoint correto continua sendo `cadastropf`
3. o frontend deve preencher automaticamente apenas os campos realmente entregues pela fonte
4. ausencia de contato/endereco nao deve ser tratada como erro do frontend
5. a leitura mais provavel no momento e restricao de cobertura/LGPD/escopo da conta junto ao Hub do Desenvolvedor

Regra operacional:
- quando vier apenas payload parcial, o produto deve:
  - preencher `nome` quando disponivel
  - preservar digitacao manual dos demais campos
  - nao sobrescrever nem perder dados vindos das outras trilhas ja existentes


## 0. Atualizacao de Contexto (2026-04-16) - enriquecimento de tomador PF por CPF integrado via backend
Fonte: `codigo local` + `testes locais` + `build local`.

Leitura consolidada:
- o enriquecimento de tomador por CPF deixou de ser apenas frente autorizada e passou a estar integrado no produto
- a integracao usa o backend do ZERA como borda para o `cadastropf` do Hub do Desenvolvedor
- o endpoint aditivo introduzido foi `GET /tomadores/lookup/cpf?cpf=`

Regra canonica desta integracao:
1. vale apenas para `tomadores` pessoa fisica
2. nao altera nem substitui o fluxo atual de `CNPJ`
3. nao toca `prestador`
4. o preenchimento continua assistido, nunca bloqueante
5. payload mascarado por LGPD passa a ser tratado como encontrado, mas nao util para autopreenchimento

Campos assistivos atualmente considerados uteis:
- nome
- email
- telefone / whatsapp
- endereco quando vier com granularidade suficiente para uso real

Leitura operacional correta agora:
- `CNPJ` continua sendo a trilha canonica para tomador PJ
- `CPF` agora tem enriquecimento incremental por fonte externa sem perder os dados das outras APIs ja usadas pelo sistema
- se a fonte vier mascarada, o usuario continua no fluxo manual sem quebra

Validacao desta rodada:
- testes focados de backend e frontend passaram
- build do frontend passou

## 0. Atualizacao de Contexto (2026-04-08) - favoritos do prestador isolados e refresh de emissao alinhado ao webhook rapido
Fonte: `codigo local` + `observacao funcional real`.

Leitura consolidada:
- o comportamento anterior de `Servicos Favoritos` na `Nova DANFSE` estava semanticamente impreciso:
  - a UI parecia prometer "favoritos do prestador"
  - mas, em alguns casos como o tomador `Andre`, a lista tambem misturava historico salvo no tomador
- isso explicava a aparicao de servicos antigos nao mais cadastrados no prestador

Correcao aplicada:
- o select `Servicos Favoritos` passou a refletir apenas o cadastro atual do prestador
- o historico de servicos do tomador deixou de contaminar essa lista
- o rotulo visual `[Tomador]` foi removido, porque ele induzia a leitura errada do componente

Leitura correta dessa tela a partir de agora:
- `Servicos Favoritos` = favoritos do prestador
- historico do tomador permanece um dado legado do backend, mas nao deve dirigir esse select

Atualizacao adicional da mesma rodada:
- com o webhook homologado no backend, a conclusao de algumas emissoes passou a acontecer em poucos segundos
- isso revelou um detalhe de UX:
  - a navegacao para `/nfse` podia reaproveitar cache recente e exigir refresh manual para o usuario perceber a nova emissao imediatamente
- correcao aplicada:
  - `Nova DANFSE` e `Emissao Rapida` agora invalidam queries `nfse` antes de navegar para a listagem

Leitura operacional correta:
1. nao houve mudanca de fluxo fiscal
2. nao houve mudanca de calculo
3. houve apenas:
  - saneamento semantico do select de favoritos
  - reforco de sincronizacao visual da listagem apos emissao

Ganho operacional percebido na mesma frente:
- antes da homologacao efetiva do webhook no backend, o fechamento visual de uma emissao ate `AUTORIZADA` podia levar cerca de **1min20s**
- com o webhook homologado e aplicado em producao, esse tempo caiu para aproximadamente **15s**
- implicacao correta no frontend:
  - a UI passou a conviver com conclusao muito mais rapida da emissao
  - por isso a invalidacao de cache antes de navegar para `/nfse` deixou de ser apenas conveniencia e passou a ser ajuste importante de percepcao operacional

## 0. Atualizacao de Contexto (2026-04-08) - `cadastropf` pago e frente liberada para implementacao assistida
Fonte: `decisao operacional` + `validacao previa de viabilidade tecnica`.

Leitura consolidada:
- a API do Hub do Desenvolvedor para enriquecimento de CPF foi contratada/paga
- isso muda a situacao anterior da frente:
  - deixa de ser apenas estudo de viabilidade
  - passa a ser frente autorizada para implementacao tecnica

Leitura correta dessa autorizacao:
- o pagamento da API **nao** transforma automaticamente o autocomplete em feature pronta
- o que ficou liberado foi:
  - prosseguir com implementacao do fluxo de autocomplete de tomador por CPF
  - dentro do contexto de cadastro/emissao
  - com foco em preenchimento assistido do maior numero possivel de campos uteis

Regra canonica de implementacao:
1. integrar via backend do ZERA, nao diretamente no frontend
2. tratar como preenchimento assistido, nunca bloqueio de cadastro
3. limitar a automacao ao contexto de tomador por CPF
4. preencher o maximo de campos uteis para emissao sem inventar regra fiscal

Campos-alvo iniciais desta frente:
- nome
- CEP
- logradouro
- numero
- complemento
- bairro
- cidade
- UF
- telefone / whatsapp
- email

Campos que permanecem fora do escopo desse autocomplete:
- substituto tributario
- regra fiscal
- decisao automatica de emissao

Leitura operacional correta hoje:
- a frente de enriquecimento por CPF continua sensivel
- porem agora ela ja pode sair de analise e entrar em implementacao incremental
- o mantra segue o mesmo:
  - sem quebrar
  - sem regredir
  - uma coisa de cada vez

## 0. Atualizacao de Contexto (2026-04-07) - quadro de emissoes e filtro de provedor
Fonte: `codigo local` + `teste funcional manual` + `testes locais` + `build local`.

Leitura consolidada:
- a listagem de NFSe ganhou uma leitura operacional mais controlada para apresentacao/revisao
- a direcao do P.O para esta rodada foi:
  - nao apagar historico
  - limpar visualmente o quadro
  - deixar apenas uma emissao visivel para avaliacao do designer

Mudanca aplicada na listagem:
- a tela de `Notas Fiscais` passou a exibir apenas a ultima emissao visivel no quadro
- a paginacao foi retirada dessa visao amostral
- o historico permanece preservado no backend e continua disponivel para uso futuro, inclusive por IA
- a tela passou a explicitar isso visualmente:
  - mostra apenas a ultima emissao
  - informa que o historico segue preservado

Correcao critica descoberta na rodada:
- o filtro de `Provedor` estava com bug real
- ao selecionar `PlugNotas`, o frontend enviava `plugnotas` minusculo
- a listagem/contrato trabalhava com `PLUGNOTAS`
- efeito observado:
  - o quadro podia ficar vazio mesmo quando a emissao era da propria PlugNotas

Correcao aplicada:
- o frontend deixou de normalizar `provider` para minusculas ao listar NFSe
- a selecao `PlugNotas` voltou a casar corretamente com emissoes reais do provider

Leitura operacional correta:
- o vazio observado no quadro nao era apenas falta de emissao ou recorte temporal
- havia bug de filtro no frontend
- a visao correta agora e:
  - ultima emissao visivel no quadro
  - historico preservado
  - filtro `PlugNotas` coerente com o backend

## 0. Atualizacao de Contexto (2026-04-07) - tomador, observabilidade admin, prestador e navegação
Fonte: `codigo local` + `testes locais` + `build local` + `direcionamento explicito do P.O`.

Leitura consolidada:
- a rodada recente voltou a privilegiar mudanca pequena, visivel e verificavel
- o mantra operacional continua sendo:
  - sem quebrar
  - sem regredir
  - uma coisa de cada vez

Tomadores - cadastro:
- `Nome Fantasia` e `Suframa` foram removidos da interface do cadastro de tomador
- a remocao foi feita sem limpeza agressiva de payload legado
- `Inscricao Municipal` e `Inscricao Estadual` passaram a fazer parte do formulario, com a regra:
  - aparecem ao lado de `CNPJ/CPF`
  - permanecem visiveis apenas em contexto de `CNPJ`
  - somem automaticamente quando o documento entra em contexto de `CPF`

Emissao - Tomador:
- o botao `Selecione (n)` do card `Tomador(a)` recebeu destaque visual mais forte
- a animacao nao ficou permanente; ela so aparece quando a selecao ainda esta pendente e o card segue vazio
- a leitura correta e:
  - trata-se de chamada operacional guiada pelo P.O
  - nao e nova regra fiscal

Observabilidade interna:
- entrou acesso admin-only para `Observabilidade Fiscal`
- o atalho fica no menu do usuario, acima de `Sair`
- a tela passou a ser a referencia visual do frontend para:
  - diagnostico do webhook
  - consulta por `externalId`
  - leitura de `timeline`
  - comparacao pratica entre `webhook` e `polling`

Prestador - Regime Tributario:
- a aba `Regime Tributario` passou a mostrar tambem o card:
  - `Prestacao de servicos, exceto para o exterior.`
- o card foi reaproveitado do componente ja existente na emissao, evitando divergencia desnecessaria

Navegacao:
- `Gestor AI` saiu do menu lateral enquanto a frente sera retrabalhada
- a rota/pagina nao foi apagada; apenas saiu da navegacao principal

Leitura operacional correta do frontend hoje:
- a base continua produtiva
- as mudancas recentes sao de UX e operacao interna
- nao houve remodelagem ampla de contrato nem refactor estrutural

## 0. Atualizacao de Contexto (2026-03-25) - tomador CPF, `cadastropf` e criterio real de adocao
Fonte: `codigo local` + `documentacao oficial do fornecedor` + `portal legacy do fornecedor` + `retorno do suporte` + `teste real manual`.

Leitura consolidada:
- havia confusao entre dois servicos diferentes do HUBDEV:
  - `nome_cpf` / `cpf`
  - `cadastropf`
- a leitura correta agora e:
  - `nome_cpf` / `cpf` servem para nome + data de nascimento + situacao cadastral
  - `cadastropf` e o servico rico de enriquecimento de dados pessoais por CPF

O que ficou comprovado:
- o endpoint relevante para o caso de uso do ZERA e:
  - `GET /v2/cadastropf/?cpf=...&token=...`
- segundo a documentacao e o suporte, esse servico pode retornar:
  - nome completo
  - data de nascimento
  - genero
  - nome da mae
  - telefones
  - enderecos
  - emails
  - salario estimado
- no teste real manual com token de validacao, o retorno trouxe de fato:
  - `nomeCompleto`
  - `dataDeNascimento`
  - `listaTelefones`
  - `listaEnderecos`
  - `listaEmails`
  - `nomeDaMae`
  - `genero`
  - `salarioEstimado`
  - `lastUpdate`

Limitacao critica comprovada:
- no estado atual do plano/token, os dados vieram fortemente ofuscados por LGPD
- exemplos observados:
  - telefone mascarado
  - endereco mascarado
  - cidade/UF mascaradas
  - CEP mascarado
  - email mascarado
- alem disso, ja houve suspeita operacional de desatualizacao em parte dos dados retornados

Conclusao operacional correta:
- o P.O estava certo sobre a existencia de uma API capaz de enriquecer tomador por CPF
- porem, no estado atual do contrato/plano, o retorno ainda nao provou valor suficiente para autopreenchimento confiavel em producao
- antes de qualquer integracao no fluxo do ZERA, ainda faltam:
  - liberacao LGPD para campos completos
  - novo teste real com dados legiveis
  - validacao de atualidade/confiabilidade dos campos principais

Regra de adocao definida:
1. nao integrar `cadastropf` no frontend diretamente
2. quando aprovado, integrar via backend do ZERA
3. tratar como autocomplete assistido, nunca bloqueio de cadastro
4. so promover para fluxo real apos prova de:
   - legibilidade
   - atualidade
   - confiabilidade

Documentacao local criada:
- `docs/HUBDEV_CADASTROPF_SUPORTE_2026-03-25.md`

## 0. Atualizacao de Contexto (2026-03-24) - incidente em PROD no frontend e regressao visual no Prestador
Fonte: `codigo local` + `erro observado em producao` + `validacao visual manual`.

Leitura consolidada:
- houve incidente real em producao no frontend durante a rodada de ajustes de performance e prestador
- o erro `e.then is not a function` / cache quebrado no boot e o erro `empresaQuery is not defined` confirmaram que:
  - alteracoes em `App.tsx`, `LoginPage.tsx` e `EmpresaFormPage.tsx` exigem cautela maxima
  - correcao ampla em cadeia durante incidente piora risco em vez de reduzi-lo
- a regra operacional correta a partir desta rodada e:
  - primeiro estabilizar producao
  - depois aplicar patch minimo, isolado e verificavel

O que ficou canonico:
- o cache persistido do dashboard no frontend pode derrubar o boot se vier invalido
- referencias soltas a hooks/queries inexistentes em `EmpresaFormPage.tsx` sao risco real de quebra total da tela de prestador
- correcoes visuais no card do prestador devem ficar restritas a `src/components/prestador/EmpresaCard.tsx`
- nao misturar no mesmo passo:
  - layout do prestador
  - remocao de CNAE
  - hidratacao/reidratação
  - regras de save

Leitura correta do estado atual:
- o problema do Simples Nacional nao estava na matematica, e sim na semantica dos labels
- `% ISS (ref.)` e o ISS efetivo estimado
- `% ISS` na tabela do anexo representa participacao do ISS dentro do DAS da faixa, nao a aliquota efetiva final
- o card `Prestador(a)` teve regressao visual real na linha de `Nome Fantasia` + `Optante Simples`
- a correcao final dessa regressao deve ser lida como ajuste de grid/layout, nao como mudanca funcional

Regra de trabalho reforcada por evidencia:
- sem quebrar
- sem regredir
- uma coisa de cada vez
- em incidente de producao:
  - evitar revert amplo com multiplos conflitos
  - evitar mexer em mais de um arquivo por rodada
  - preferir patch minimo no ponto exato do sintoma

## 0. Atualizacao de Contexto (2026-03-24) - autocomplete, emissao e primeira pintura do dashboard
Fonte: `codigo local` + `testes locais` + `build local`.

### Autocomplete - leitura comparativa com `novastelas`

Documentos principais:
- `docs/AUTOCOMPLETE_COMPARATIVO_NOVASTELAS.md`
- `docs/PARECER_AUTOCOMPLETE_FLUXO_FISCAL.md`

Leitura consolidada:
- o `zera-frontend` nao replica o `novastelas` de forma cega
- a regra correta passou a ser:
  - usar nossa API e nosso backend sempre que possivel
  - manter equivalencia funcional de preenchimento
  - preservar editabilidade dos campos
- conclusao consolidada da rodada:
  - `Prestador` cadastro/update: aderente ao fluxo esperado
  - `Tomador` cadastro/update: aderente ao fluxo esperado
  - `Tomador` manual na `Nova DANFSE`: autocomplete restaurado usando nossa API
  - `Local da Prestacao`: API propria primeiro, com fallback ao IBGE
  - `Servico Prestado`: permanece mais assistido que o `novastelas`, sem bloquear edicao

Direcao de produto assumida:
- manter a UX mais assistida do `zera-frontend`
- explicar ao P.O e ao contador senior que o objetivo nao e copiar fonte de dados, e sim garantir preenchimento correto com menos atrito operacional

### Nova DANFSE - emissao e parametro tributario

Arquivos principais:
- `src/pages/NfseEmitPage.tsx`
- `src/pages/nfseEmit.tributacao.ts`
- `src/components/emissao/PrestacaoServicoSection.tsx`
- `src/components/emissao/TomadorEmissao.tsx`
- `src/components/emissao/ParametrosTributariosSNCard.tsx`

Leitura consolidada:
- `CTN` e `Descricao do Servico` continuam assistidos, mas sem travar o usuario
- `Codigo Tributacao Nacional` aceita digitacao manual real
- o favorito continua como sugestao forte, nao como bloqueio
- o tomador manual voltou a preencher corretamente por CNPJ na emissao
- a camada de emissao passou a expor visualmente o `Parametro Tributario Aplicado`

Leitura operacional:
- o `zera-frontend` ficou mais proximo do `novastelas` na automacao de ISS da `Nova DANFSE`
- ao mesmo tempo, preservou a linha correta do produto:
  - sem criar campo novo no form
  - sem mudar layout principal
  - sem tirar liberdade de edicao

### Simples Nacional - alinhamento com `novastelas`

Arquivos principais:
- `src/utils/simples-nacional.ts`
- `src/components/SimplesNacionalSection.tsx`
- `src/components/TabelaAnexoIII.tsx`

Leitura consolidada:
- o nucleo de calculo do Simples / Anexo III foi alinhado aos percentuais do `novastelas`
- o card de apuracao de Simples Nacional deve ser lido como 100% alinhado ao `novastelas`
- a tabela do Anexo III voltou a renderizar corretamente o percentual de ISS da faixa, sem `NaN%`

Regra de interpretacao:
- no card acima, `% ISS (ref.)` representa a referencia efetiva
- na tabela, `% ISS` continua significando percentual da faixa, como ja ocorre no `novastelas`

### Dashboard - primeira pintura apos login

Arquivos principais:
- `src/App.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/components/Dashboard.tsx`
- `src/components/dashboard/SimplesNacionalDashboard.tsx`
- `src/components/dashboard/EmissoesResumoMini.tsx`
- `src/hooks/useDashboardData.ts`

Leitura consolidada:
- o dashboard passou a priorizar primeira pintura e percepcao de velocidade
- o shell da tela aparece antes
- o topo recebeu skeleton mais intencional
- o snapshot persistido do dashboard foi reforcado
- a rota e as queries principais passaram a ser aquecidas ja na tela de login
- a terceira linha do dashboard foi empurrada para depois da primeira pintura

Protecao importante aplicada:
- a otimizacao nao pode sumir com competencias historicas
- meses antigos continuam sendo montados a partir da historia de NFSe, em background

Leitura operacional:
- a tela logo apos login deve ficar "na cara do cliente" mais rapido
- qualquer futura otimizacao do dashboard deve preservar:
  - competencias historicas
  - leitura de negocio do `Gestor AI`
  - integridade dos dados reais

## 0. Atualizacao de Contexto (2026-03-21) - prestador, portal nacional e limpeza de UX
Fonte: `codigo local` + `testes locais` + `build local`.

### Cadastro de Prestador - Portal Nacional

Arquivos principais:
- `src/pages/EmpresaFormPage.tsx`
- `src/lib/nfse-provider.ts`
- `src/services/api.ts`
- `src/components/prestador/IdentificacaoDocumentoCard.tsx`

Leitura consolidada:
- os campos do card `Portal Nacional`
  - `NFS-e Nº`
  - `DPS Nº`
  - `Serie DPS Nº`
  deixaram de ser tratados como fonte primaria do cadastro
- a leitura correta agora e:
  - espelhar a **ultima emissao** da empresa
  - priorizando resposta/protocolo real da NFSe
  - sem depender dos valores antigos persistidos "so para constar" no cadastro

Protecoes aplicadas:
- o frontend passou a buscar `provider-response` pelo `externalId/protocolo` da emissao quando necessario
- o card nao deve mais exibir por alguns instantes os valores antigos do banco antes da sincronizacao correta
- durante a sincronizacao do `Portal Nacional`, o formulario evita piscar o valor legado e so mostra o valor correto quando a fonte real responder

Leitura operacional:
- esses campos **nao mudam a emissao**
- eles sao apenas reflexo/espelho do retorno do provider
- qualquer nova emissao autorizada tende a substituir esses numeros pelos dados reais mais recentes

### DANFSe - botoes simplificados

Arquivos principais:
- `src/pages/NfseListPage.tsx`
- `src/pages/NfseDetailPage.tsx`

Ajuste consolidado:
- os botoes `Imprimir` foram removidos da UX principal
- a direcao correta passou a ser:
  - `Detalhes da DANFSE`
  - `Visualizar PDF`
  - `Baixar PDF`
- justificativa:
  - o PDF ja permite impressao pelo viewer/navegador
  - remover botao redundante reduz ruido e evita promessa ambigua

Leitura operacional:
- `Visualizar` generico foi considerado ambiguidade ruim
- a UX correta agora separa melhor:
  - tela interna da nota
  - abertura do PDF/DANFSe

### Validacao executada nesta rodada

- `npm test -- src/services/api.new-flows.test.ts src/lib/nfse-provider.test.ts src/pages/empresa-form.save-reload.test.ts src/components/prestador/prestador-cards.test.tsx`
  - `30/30` testes passando
- `npm run build`
  - passando

## 0. Atualizacao de Contexto (2026-03-21)
Fonte: `codigo local` + `pull remoto` + `docs locais`.

### Leitura consolidada do estado atual

- o `zera-frontend` continua devendo ser lido como **frontend em producao**
- a rodada consolidada mais recente combinou:
  - melhoria de infraestrutura/percepcao de velocidade
  - ajustes visuais de baixo risco
  - reorganizacao de UX da DANFSe
  - reforco do `Gestor AI`
  - protecoes explicitas contra regressao em fluxos criticos

Leitura operacional correta de agora:
1. a UX melhorou sem troca de regra fiscal
2. a performance percebida melhorou por:
   - infra melhor
   - front menos custoso em pontos pesados
3. `Prestador`, `Tomador`, `Emissao` e `Certificado` seguem sendo areas sensiveis e protegidas por checklist/manual + testes

### DANFSe

Arquivos principais:
- `src/pages/NfseListPage.tsx`
- `src/pages/NfseDetailPage.tsx`

Estado consolidado:
- listagem passou a concentrar acoes rapidas de uso operacional
- tela detalhada passou a concentrar acoes principais no topo
- downloads locais e acoes de visualizacao/impressao foram reorganizados para reduzir duplicidade e friccao
- polling visual de status continua relevante:
  - detalhe da NFSe com `refetch` automatico enquanto houver status ativo
  - listagem com `refetch` automatico quando houver emissoes ainda em processamento

Regra operacional:
- nenhuma mudanca dessa frente deve inventar estado proprio divergente da API
- o frontend apenas melhora leitura e acompanhamento do estado real da emissao

### Gestor AI

Arquivos principais:
- `src/pages/GestorAiPage.tsx`
- `src/components/dashboard/GestorAiTabela.tsx`
- `src/hooks/useDashboardData.ts`

Estado consolidado:
- o `Gestor AI` esta orientado a **visao por tomador**
- a tabela representa:
  - tomador
  - quantidade de notas
  - valores das notas emitidas
  - total emitido
  - ticket medio
  - percentual do faturamento

Leitura operacional:
- esta rota nao deve sacrificar leitura de negocio para "ganho tecnico" pequeno
- quando houver disputa entre performance e visibilidade do faturamento por tomador, a prioridade correta e:
  - preservar leitura do negocio
  - sem perder notas legadas/sem metadata perfeita

### Performance conservadora

Arquivos/areas relacionados:
- `src/App.tsx`
- `src/hooks/useDashboardData.ts`
- `src/components/LoadingState.tsx`

Estado consolidado:
- rotas pesadas passaram por alivio conservador de carregamento
- o app ganhou melhor percepcao de resposta, especialmente em dashboard e modulos grandes
- o `LoadingState` atual foi simplificado e mantido neutro, sem inventar nova regra visual de negocio

Leitura operacional:
- ainda existe espaco para evolucao comparando com apps de mercado
- mas a linha correta continua sendo:
  - otimizar sem quebrar
  - otimizar sem esconder dado real
  - otimizar sem regressao em dashboard/Gestor AI/cadastro

### Cadastro de Prestador

Arquivos principais:
- `src/pages/EmpresaFormPage.tsx`
- `src/components/prestador/ContatoCard.tsx`
- `src/components/prestador/EnderecoCard.tsx`
- `src/components/prestador/CertificadoDigitalCard.tsx`

Estado consolidado da frente:
- houve historico recente de bugs comportamentais em campos do cadastro
- o projeto agora documenta claramente que esses campos devem ser tratados como fluxo critico de producao
- a direcao correta e:
  - nao misturar ajuste visual com regra
  - nao remascarar campo sensivel durante digitacao se isso gerar travamento
  - nao sobrescrever input manual do usuario indevidamente

Campos sensiveis explicitamente reconhecidos:
- `WhatsApp`
- `Localidade / UF`
- `CEP`
- `Numero`
- `Inscricao Municipal`
- `Certificado`
- `NFS-e Nº`
- `DPS Nº`
- `Serie DPS Nº`

### Release safety

Documento novo e importante:
- `docs/FRONT_RELEASE_CHECKLIST.md`

Leitura canonica:
- esse checklist nao e opcional em mudanca de `Prestador`, `Tomador`, `Emissao` e `Certificado`
- a release correta nessas areas exige:
  - `test:critical`
  - `build`
  - checklist manual de fluxo real

Regra consolidada:
- nao liberar mudanca nessas areas se:
  - autocomplete quebrar
  - logradouro/localidade/CEP/WhatsApp travarem
  - save/reload voltar incoerente
  - favorito/lista servico reaproveitar residuo antigo

## 0. Atualizacao de Contexto (2026-03-17)
Fonte: `codigo local` + `execucao local`.

### NFSe - atualizacao automatica de status em tela

Arquivos:
- `src/pages/NfseDetailPage.tsx`
- `src/pages/NfseListPage.tsx`

Ajuste aplicado:
- detalhe da NFSe agora faz `refetch` automatico a cada `15s` enquanto o status estiver em:
  - `PENDING`
  - `PROCESSING`
- lista de NFSe agora faz `refetch` automatico a cada `15s` quando houver pelo menos uma emissao ativa na lista.

Objetivo:
- reduzir dependencia de refresh manual para visualizar transicoes de status vindas do backend.

Escopo:
- nenhuma regra fiscal foi alterada;
- nenhuma estrutura de payload foi alterada;
- mudanca restrita a polling de query no frontend.

Validacao local:
- `yarn eslint src/pages/NfseDetailPage.tsx src/pages/NfseListPage.tsx` -> passando.

## 0. Atualizacao de Contexto (2026-03-16)
Fonte: `codigo local` + `execucao local`.

### Prestador -> Parâmetros Municipais (cards 1/2/3)

Ajuste visual aplicado em `CTNSection`:
- cards `1. Código Cnae`, `2. Código Tributação Nacional` e `3. Nomenclatura Brasileira Serviços` nao ficam mais com borda azul fixa quando selecionados;
- borda azul permanece apenas no `hover`, alinhando com o comportamento solicitado.

Escopo:
- mudanca somente de estilo (classe de estado selecionado removida desses 3 cards);
- regras de autocomplete, vinculos CNAE/CTN/NBS e payload de save permanecem inalteradas.

Validacao local:
- `yarn test` -> 16 arquivos / 61 testes passando;
- `yarn build` -> passando.

## 0. Atualizacao de Contexto (2026-03-16)
Fonte: `codigo local` + `contrato backend`.

### B.I. - prontidao analitica agora separada no backend

- o backend passou a expor no retorno normalizado de empresa:
  - `prontoParaBi`
  - `percentualCompletudeBi`
  - `camposFaltantesBi`
- objetivo:
  - separar completude minima de emissao da completude analitica para B.I.

Observacao operacional:
- o frontend ainda nao consome esses campos visualmente;
- a fonte canonica agora existe no backend, pronta para uso em UX futura de prestador/onboarding.

## 0. Atualizacao de Contexto (2026-03-11)
Fonte: `codigo local` + `contrato backend`.

### B.I. - contrato ampliado no frontend

Arquivos:
- `src/pages/NfseEmitPage.tsx`
- `src/services/api.ts`
- `src/types/api.ts`
- `docs/BI_CONTRATO_MINIMO.md`

Melhorias recentes:
- payload da emissao agora envia `localPrestacao` (`pais`, `uf`, `municipio`) de forma aditiva para analytics.
- preenchimento artificial de `tributacaoTotal` foi removido do frontend; retencoes individuais permanecem como fonte confiavel.
- `Empresa` passou a aceitar:
  - `simplesSnapshot?`
  - `biCatalogoResumo?`
- `NfseBiSummary` passou a aceitar:
  - `tributacaoTotal?`
  - `topMunicipiosPrestacao?`
  - `topTomadores?`
- `normalizeEmpresa()` passou a consumir `simplesSnapshot` vindo do backend.

Regra canônica do frontend:
- frontend consome e apresenta dado canônico do backend;
- frontend nao deve inventar regra fiscal para B.I.;
- em caso de divergencia, a verdade operacional continua sendo a API.

## 0. Atualizacao de Contexto (2026-03-10)
Fonte: `codigo local` + `execucao local`.

### Emissao (DANFSE) - servicos

Arquivos:
- `src/pages/nfseEmit.mappers.ts`
- `src/pages/nfseEmit.mappers.test.ts`

Correcao aplicada:
- `Lista Servico` passa a considerar somente dados canonicos de `configOperacionais` (`natureza` e `descricao`).
- Removido aproveitamento de chaves legadas que causavam "residuo" de servicos antigos.
- Deduplicacao por combinacao normalizada (`natureza + descricao`) para evitar opcoes repetidas.

Validacao:
- `yarn vitest run src/pages/nfseEmit.mappers.test.ts` -> passando.
- `yarn build` -> passando.

Observacoes operacionais:
- `Servicos Favoritos` e `Lista Servico` dependem do retorno de `GET /empresas`.
- Para alimentar corretamente a DANFSE, o prestador precisa ter:
  - `configOperacionais` preenchido.
  - `parametroMunicipal` preenchido e coerente com CNAE/CTN/NBS.

### Ambiente de producao (front)

Config canonica:
- `VITE_API_BASE_URL=https://zera-backend.onrender.com`

Regra:
- remover qualquer referencia ativa a `zera-backend-1.onrender.com` para evitar divergencia de dados entre ambientes.

## 0. Atualizacao de Contexto (2026-03-07)
Fonte: `codigo local` + `validacao funcional em producao`.

### Prestador -> Parametros Fiscais -> Emissao

Diagnostico consolidado:
- A tela de `Parâmetros Municipais` podia aparentar estar correta por fallback local do frontend.
- A prova canonica passou a ser o retorno real de `GET /empresas`.
- Em producao foi validado um caso em que a API retornava:
  - `cnaeFiscal: "8650003"`
  - `parametroMunicipal: []`
  - `ctnCodigo: "040101"`
  - `nbsCodigo: "1.2301.22.00"`
- Consequencia direta:
  - DANFSE/emissao preenchia `04.01.01` + `Medicina`.

Correcao aplicada no frontend:
- `src/pages/EmpresaFormPage.tsx`
  - ao salvar, o payload passa a enviar `parametroMunicipal` canonico;
  - `ctnCodigo` e `nbsCodigo` enviados no `PATCH` passam a derivar do primeiro vinculo real do CNAE principal, e nao de estado legado solto.

Regra operacional atual:
- frontend continua sendo consumidor/apresentador;
- mas o payload de save foi endurecido para nao mandar estado inconsistente quando a UI estiver montada por fallback local.

### Ticker global

Arquivos:
- `src/components/GlobalTicker.tsx`
- `src/index.css`

Ajuste aplicado:
- o ticker foi reconectado ao motor real de animacao do projeto;
- o loop continuo deixou de gerar buraco visual no final;
- estrategia atual:
  - faixa duplicada
  - animacao unica do conjunto
  - deslocamento ate `-50%`

### Prestador -> Parametros Federais

Arquivo:
- `src/pages/EmpresaFormPage.tsx`

Ajuste aplicado:
- campo `Simples Nacional` (aliquota) ampliado para comportar corretamente valores com 2 casas decimais + `%`.

### Dashboard

Arquivos:
- `src/components/Dashboard.tsx`
- `src/hooks/useDashboardData.ts`

Ajustes recentes:
- rotulo `Cliente sem nome` substituido por `Emissão expressa` quando a nota vier sem razao social do tomador;
- secoes fracas/zeradas foram condicionadas:
  - `Split Payment` so aparece com dado real;
  - `ISS Retido por Mês` so aparece com retencao real;
  - `Faturamento por Cliente` so aparece quando houver distribuicao real;
- dashboard recebeu reforco visual executivo:
  - hero superior institucional;
  - KPIs principais destacados;
  - melhor hierarquia para apresentacao externa.

## 0. Atualizacao de Contexto (2026-03-05)
Fonte: `codigo local` + validacao funcional em ambiente de producao.

- Fluxo de emissao:
  - apos emitir, UX direciona para listagem de emissoes (`/nfse`) para acompanhamento.
  - status visual de notas pendentes foi ajustado para linguagem de usuario (`Processando`).
- Autocomplete de CNPJ:
  - front exibe `Fonte do autocomplete` de forma discreta quando backend retorna `fonteConsulta`.
  - rotulos suportados: `CNPJa`, `ReceitaWS`, `BrasilAPI`, `BrasilAPI + ReceitaWS`, `PlugNotas`.
- Prestador em emissao:
  - secao do prestador passou a mesclar dados de cadastro local + preview por CNPJ para melhorar preenchimento.
  - CNPJ pode ficar bloqueado no fluxo de emissao para evitar trocas acidentais durante o preenchimento.

Observacao operacional:
- Se a UI mostrar `Fonte do autocomplete: ReceitaWS`, o fallback veio do backend.
- A correcao definitiva desse ponto depende de runtime do backend com CNPJA efetivamente ativo em producao.

## 0. Atualizacao de Contexto (2026-03-03)
Fonte: `codigo local` + `execucao local`.

- Prestador (cadastro/regime/parametros) alinhado visualmente ao `telasnovas` nas rotas de formulario (`/empresas/nova` e `/empresas/:id`).
- Tomador (cadastro) alinhado ao `telasnovas` em `/tomadores/novo` e `/tomadores/:id`.
- Emissao (DANFSE) recebeu clone de layout/regras solicitado, mantendo integracoes com backend.
- Navegacao lateral corrigida:
  - subabas de prestador agora abrem formulario com `?secao=cadastro|regime|parametros` (nao mais lista de empresas).
- Cadastro do prestador recebeu cards adicionados:
  - `Certificado CNPJ A1` (`Arquivo do Certificado`, `Senha do Certificado`);
  - `Portal Nacional` (`NFS-e Nº`, `DPS Nº`, `Série DPS Nº`).

Arquivos-chave alterados neste ciclo:
- `src/pages/EmpresaFormPage.tsx`
- `src/pages/TomadorFormPage.tsx`
- `src/pages/NfseEmitPage.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/PrestadorSection.tsx`
- `src/components/CTNSection.tsx`
- `src/components/CNAESection.tsx`
- `src/components/ConfigOperacionaisSection.tsx`
- `src/components/prestador/CertificadoDigitalCard.tsx` (novo)
- `src/components/prestador/IdentificacaoDocumentoCard.tsx` (novo)

Validacao local mais recente:
- `yarn build` executado com sucesso em `2026-03-03` apos as alteracoes.

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

## 12. Handover 2026-03-02

### 12.1 Decisões e ajustes aplicados no front
- Emissão:
  - Após sucesso na emissão normal e rápida, o fluxo foi ajustado para redirecionar para `/nfse` (listagem) para acompanhamento de status.
- Prestador (`/empresas/nova`):
  - Fluxo atualizado para carregar empresa existente automaticamente no formulário quando já houver cadastro.
  - Hidratação de dados passou a priorizar dados completos via backend para refletir abas de cadastro, regime e parâmetros.
- Autocomplete CNPJ:
  - Mensagem de UX atualizada para refletir estratégia com CNPJA primária e fallback no backend.
- Normalização visual no cadastro do prestador:
  - Campos textuais principais em maiúsculas no front (exceto email).
  - CNPJ com máscara ao carregar dados no formulário.
  - Logradouro normalizado para maiúsculas com prefixo `R` no lugar de `RUA`.
- Telefone/WhatsApp:
  - Máscara ajustada para inserir um único `9` após DDD quando número vier com 10 dígitos (padrão celular BR), sem duplicar quando já houver 11 dígitos.

### 12.2 Estado atual para continuar em casa
- Arquivos com mudanças locais relevantes no frontend:
  - `src/pages/EmpresaFormPage.tsx`
  - `src/pages/TomadorFormPage.tsx`
  - `src/utils/validators.ts`
- Esses ajustes estão prontos para commit/push conforme comandos já validados em terminal.

### 12.3 Pendências recomendadas
1. Validar em produção os fluxos:
   - abertura de `/empresas/nova` com empresa pré-carregada;
   - atualização de completude após salvar campos de regime;
   - máscara e auto-inserção do `9` em todos os formulários de telefone.
2. Revisar cobertura de testes de formatação de telefone e normalização de logradouro.
3. Registrar no QA checklist visual os padrões exigidos pelo cliente (maiúsculas e abreviações).
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

## 21. Atualizacao Operacional (2026-02-28)

### 21.1 Emissao normal (DANFSE) – protecao contra E0625
Fonte: `codigo local` (`src/pages/NfseEmitPage.tsx`)

- Ajuste aplicado no payload do formulario normal:
  - `servico.iss.aliquota` agora so e enviada quando `issRetido=true`.
  - quando `issRetido=false`, o campo vai como `undefined` (nao enviado).
- Objetivo: evitar rejeicao fiscal E0625 em contexto de Simples Nacional sem retencao.

### 21.2 Lookup de CEP – tolerancia a ambiente sem endpoint
Fonte: `codigo local` (`src/services/cep.ts`)

- `lookupCep` passou a usar `skipGlobalErrorToast: true`.
- Para `404`, o front retorna fallback vazio (sem quebrar formulario) em vez de disparar erro global.
- Com backend atualizado, o endpoint oficial esperado permanece:
  - `GET /empresas/lookup/cep/:cep`

### 21.3 Contrato de lookup de municipios
Fonte: `codigo local` + `backend atualizado em 2026-02-28`

- O frontend segue usando:
  - `GET /empresas/lookup/municipios?uf=XX`
- O backend agora expõe este endpoint de forma oficial, removendo divergencia observada anteriormente.

### 21.4 Validacao local desta rodada (2026-02-28)
Fonte: `execucao local`

- `npm run test` -> **17 testes passando**
- `npm run build` -> **ok**
- `npm run lint` -> sem erros (warnings recorrentes de hooks/fast-refresh mantidos)

### 21.5 Rastreabilidade
- Ultima atualizacao: 2026-02-28T13:10:00-04:00
- Responsavel: Codex (GPT-5)
- Tipo de atualizacao: alinhamento de contrato com backend (`lookup`) + protecao de payload de emissao para reduzir rejeicoes fiscais em producao.

## 22. Atualizacao Operacional (2026-02-28) – Cadastro em etapas com aviso de parcial

### 22.1 Objetivo
Fonte: `codigo local` (`src/pages/EmpresaFormPage.tsx`)

- Tornar o fluxo resiliente para interrupções (queda de internet/energia) sem induzir usuário a emitir com cadastro incompleto.

### 22.2 Ajustes no front
Fonte: `codigo local` (`src/pages/EmpresaFormPage.tsx`, `src/services/api.ts`, `src/types/api.ts`)

- O front passou a consumir metadados de completude retornados pela API de empresas:
  - `statusCadastro`
  - `prontoParaEmitir`
  - `percentualCompletude`
  - `camposFaltantes`
  - `camposFaltantesEmissao`
- Ao salvar prestador:
  - se `statusCadastro=PENDENTE`, mostra toast de "cadastro salvo parcialmente";
  - mantém usuário no fluxo de cadastro (não finaliza como sucesso completo);
  - exibe banner com pendências e aviso explícito de bloqueio de emissão.
- Quando completo:
  - mantém comportamento de sucesso padrão e retorno à listagem.

### 22.3 Contrato operacional com backend
Fonte: `backend atualizado em 2026-02-28`

- Emissão agora depende de `prontoParaEmitir=true`.
- Erros esperados em bloqueio de emissão por cadastro parcial:
  - `PRESTADOR_INCOMPLETO` (emissão normal)
  - `QUICK_PRESTADOR_INCOMPLETO` (emissão rápida)

### 22.4 Validacao local desta rodada (2026-02-28)
Fonte: `execucao local`

- `npm run test` -> **17 testes passando**
- `npm run build` -> **ok**
- `npm run lint` -> sem erros (warnings recorrentes mantidos)

### 22.5 Rastreabilidade
- Ultima atualizacao: 2026-02-28T14:35:00-04:00
- Responsavel: Codex (GPT-5)
- Tipo de atualizacao: suporte a cadastro parcial orientado por completude e avisos operacionais para evitar emissão com prestador incompleto.

## 23. Atualizacao Operacional (2026-02-28) – Revalidacao completa do frontend

### 23.1 Escopo
Fonte: `execucao local`

- Revalidar qualidade tecnica atual do front apos as ultimas entregas de backend e testes.
- Confirmar estado de lint, testes automatizados e build de producao.

### 23.2 Validacao local desta rodada (2026-02-28)
Fonte: `execucao local`

- `npm run lint` -> **0 erros / 13 warnings**
  - warnings recorrentes de `react-hooks/exhaustive-deps` e `react-refresh/only-export-components`.
- `npm test` -> **3 arquivos / 17 testes passando**.
- `npm run build` -> **ok**.
  - observacao: warning de chunk grande do Vite mantido (`index-*.js` acima de 500 kB), sem bloquear build.

### 23.3 Resultado operacional

- Frontend validado para continuidade da operacao.
- Nao houve falha bloqueante em lint/test/build nesta rodada.
- Pendencias atuais permanecem concentradas em warnings nao bloqueantes (hooks/fast-refresh/chunking).

### 23.4 Rastreabilidade

- Ultima atualizacao: 2026-02-28T19:58:00-04:00
- Responsavel: Codex (GPT-5)
- Tipo de atualizacao: revalidacao tecnica completa (lint, testes e build) e consolidacao documental.

## 24. Snapshot Canonico (2026-03-05)

Fonte: `codigo local` + `git log` em `main` (sem alteracoes locais).

### 24.1 Estado vigente para operacao

- Branch `main` sincronizada com `origin/main`.
- Ultimo commit no front: `514a0f8` (`feat(dashboard): homologar 1:1 e integrar dados analiticos do backend`).
- Ciclo recente consolidado:
  - clone 1:1 de formularios (cadastro/regime/parametros) com base em `novastelas`;
  - ajustes de ordem/hierarquia de componentes no regime tributario;
  - persistencia de `cnaesLista`, `parametroMunicipal` e lista de servicos do prestador;
  - alinhamento visual/funcional do dashboard para consumo de dados do backend.

### 24.2 Contrato operacional front-back atualmente assumido

- Prestador:
  - formulario em 3 blocos (`dados cadastrais`, `regime tributario`, `parametros fiscais`) com salvamento no backend.
  - completude orientada por backend (`statusCadastro`, `prontoParaEmitir`, `camposFaltantes*`).
- Tomadores:
  - cadastro completo e uso em emissao via autocomplete por `empresaCnpj`.
- Emissao:
  - fluxo normal e rapido mantidos;
  - pos-emissao redireciona para listagem para acompanhamento de status.
- Dashboard:
  - componente homologado 1:1 e alimentado por `nfseApi.biSummary`/dados de emissao.

### 24.3 Gaps e riscos abertos (nao bloqueantes de build)

- Warnings recorrentes de lint (`react-hooks/exhaustive-deps`, `react-refresh/only-export-components`).
- Bundle principal ainda elevado (>500 kB apos minificacao) com warning de chunking.
- Existem componentes legados com consultas externas diretas (fora do fluxo backend-first), devendo ser convergidos gradualmente para endpoints internos.

### 24.4 Proximo passo recomendado

1. Consolidar padrao backend-first para autocomplete/lookup em todos os forms.
2. Reduzir bundle com code-splitting por rota pesada (dashboard/emissao).
3. Revisar e reduzir warnings de hooks para diminuir risco de regressao de estado em formularios.

### 24.5 Rastreabilidade

- Ultima atualizacao: 2026-03-05T09:30:00-04:00
- Responsavel: Codex (GPT-5)
- Tipo de atualizacao: consolidacao canonica de estado apos ciclo de homologacao visual/UX e dashboard.

## 25. Atualizacao Operacional (2026-03-06) - DANFSE, CNPJ e Portal Nacional

### 25.1 Escopo
Fonte: `codigo local` + `validacao local`

- Corrigir preenchimento de `Servicos Favoritos`/`Lista Servico` na DANFSE com contrato real de producao.
- Padronizar exibicao de CNPJ no frontend (mascara `00.000.000/0000-00`) em telas chave.
- Melhorar a sinalizacao visual no cadastro de prestador sobre certificado digital ja importado.

### 25.2 Ajustes DANFSE (emissao)
Fonte: `src/pages/NfseEmitPage.tsx`, `src/pages/nfseEmit.mappers.ts`

- Mapeamentos de DANFSE extraidos para modulo dedicado testavel:
  - `mapFavoritosFromParametroMunicipal`
  - `mapListaServicoFromConfig`
  - `pickEmpresaForEmissao`
  - `hasFavoriteConfig`
- Parser de favoritos/lista servico endurecido para variacoes de chave (formato atual e legado).
- `Servicos Favoritos` passou a ter fallback operacional quando `parametroMunicipal` vier vazio:
  - usa `cnaeFiscal + ctnCodigo + nbsCodigo` do prestador para nao deixar fluxo travado.
- Se nao houver parametros municipais/config operacional, front exibe aviso orientativo.

### 25.3 Testes especificos adicionados
Fonte: `src/pages/nfseEmit.mappers.test.ts`, `src/services/api.new-flows.test.ts`

- Cobertura dedicada para relacao entre dados de prestador e campos da DANFSE:
  - favoritos com formato atual;
  - favoritos com formato legado;
  - fallback de favoritos quando `parametroMunicipal=[]`;
  - lista de servico com formatos atual/legado;
  - selecao de empresa para emissao por completude.
- Cobertura de normalizacao de resposta da API quando `parametroMunicipal/configOperacionais` vierem como:
  - JSON string;
  - objeto wrapper (`items/rows/data/value/result`).

### 25.4 Padronizacao CNPJ no frontend
Fonte: `src/services/api.ts` + telas de exibicao/entrada

- CNPJ normalizado para mascara `00.000.000/0000-00` em pontos principais:
  - listagem de empresas;
  - emissao rapida;
  - certificado digital;
  - DANFSE print/detalhe;
  - hidratacao de prestador na emissao.
- Normalizacao evita mascarar valores invalidos/parciais (aplica mascara completa apenas com 14 digitos).

### 25.5 Cadastro de prestador - Portal Nacional
Fonte: `src/components/prestador/IdentificacaoDocumentoCard.tsx`, `src/pages/EmpresaFormPage.tsx`

- Card `Portal Nacional` na tela de update passou a sinalizar certificado importado:
  - nome do arquivo;
  - data/hora de upload.
- Objetivo: reduzir ambiguidade operacional quando existe certificado salvo no cadastro.

### 25.6 Validacao local desta rodada
Fonte: `execucao local`

- `yarn eslint` (arquivos impactados) -> sem erros bloqueantes.
- `yarn test` -> `26/26` testes passando.
- `yarn build` -> ok.

### 25.7 Rastreabilidade

- Ultima atualizacao: 2026-03-06T18:20:00-04:00
- Responsavel: Codex (GPT-5)
- Tipo de atualizacao: hardening de DANFSE (favoritos/lista servico), padronizacao de CNPJ e melhoria operacional do card Portal Nacional.
