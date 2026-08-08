# ZERA Frontend – Current State

Snapshot operacional do frontend em **21/04/2026**.

## 0.1. ATUALIZACAO (08/08/2026) - LISTAS OPERACIONAIS JUPATI

- Listas de empresas, tomadores e usuarios receberam cabecalhos, superficies e hierarquia visual Jupati.
- Estados vazios e de erro compartilhados foram normalizados com tokens semanticos.
- Acoes por linha receberam rotulos acessiveis e confirmacoes destrutivas explicitas.
- Consultas, mutations, permissoes, rotas e contratos permaneceram inalterados.
- Validacao: `151/151` testes aprovados e lint sem erros; build registrado apos a verificacao final deste lote.

## 0.2. ATUALIZACAO (08/08/2026) - OPERACAO FISCAL E FORMULARIOS

- A listagem de documentos passou a ser apresentada como "Operacao fiscal", preservando a rota tecnica `/nfse`.
- Filtros apresentam LOBONOTAS como "Ambiente Nacional", PlugNotas como legado e MOCK como ambiente de teste.
- Emissao rapida, certificado digital e formulario de usuarios receberam cabecalhos e superficies Jupati.
- Chamadas de API, mutations, payloads, providers tecnicos, status e destinos de navegacao permaneceram inalterados.
- Validacao: `151/151` testes aprovados; lint e build registrados apos a verificacao final deste lote.

## 0. ATUALIZACAO (07/08/2026) - REBRANDING INCREMENTAL PARA JUPATI (FUNDAMENTOS + SHELL + LEITURA OPERACIONAL)

Fonte: `docs/JUPATI_DESIGN_SYSTEM.md` + prancha visual aprovada + codigo local +
testes + lint + build.

Estado atual:

- **Jupati** e a marca visivel do produto, com assinatura "Sua operacao, bem
  conectada."; LOBONOTAS permanece motor fiscal; Muirakitan Tecnologia, empresa
  responsavel; PlugNotas, provider historico `LEGACY_DISABLED`.
- Design system versionado em `docs/JUPATI_DESIGN_SYSTEM.md` e classificacao da
  migracao em `docs/JUPATI_REBRAND_INVENTORY.md`.
- Tokens semanticos Jupati aplicados em light/dark: azul-noturno, verde amazonico,
  prata, marfim e superficies claras; Manrope em titulos e Inter na interface.
- Novo `BrandLogo`/`BrandMark`, favicon e assets `public/brand/jupati-*`; SVG atual e
  asset de implementacao coerente com a direcao aprovada, **nao** o master vetorial
  definitivo ainda pendente.
- Metadata, login, convite, sidebar, header, home, Dash2, listagem/detalhe de NFS-e,
  loading e textos prioritarios migrados para a linguagem Jupati.
- Shell consolidado em Phosphor; seletor `classic/elegant` e implementacao associada
  removidos. Light/dark permanece.
- Provider na UI: LOBONOTAS -> "Ambiente Nacional"; PLUGNOTAS -> "Legado
  (PlugNotas)". Paineis de sincronizacao PlugNotas permanecem ocultos e sem acao.
- Status novo da UI = `CANCELED`; `CANCELLED` segue aceito somente como leitura
  temporaria de compatibilidade.

Compatibilidade preservada:

- nenhuma troca global de `zera`;
- `zera_token`, caches/eventos, nomes de repositorio, rotas `/nfse/*`, contratos da
  API, provider `LOBONOTAS`, dados/fixtures `PLUGNOTAS` e assets historicos ZERA nao
  foram renomeados nem removidos.

Validacao:

- `npm run build` -> OK;
- `npm run lint` -> 0 erros, 40 warnings preexistentes;
- `npm test` -> **151/151 testes verdes** (28 arquivos);
- `git diff --check` -> OK.

Proximos passos:

1. produzir e aprovar o master vetorial definitivo do simbolo/wordmark;
2. revisar visualmente todas as paginas em light/dark, mobile e zoom 200%;
3. continuar migracao de hardcodes visuais nas telas densas sem alterar semantica
   fiscal;
4. definir janela para remocao futura de assets e chaves visuais legadas.

## 0. ATUALIZACAO (05/08/2026) - ACOES DE SINCRONIZACAO/REMOTO PLUGNOTAS DESABILITADAS NA UI

Fonte: `codigo local` + `eslint local` + `build local` + `testes locais`.

Estado operacional:
- alinhado ao backend (kill switch `PLUGNOTAS_DISABLED`): a UI deixa de oferecer acoes de sincronizacao/download remoto que terminariam em erro para notas PlugNotas historicas.
- `NfseDetailPage.tsx`: botoes `Sincronizar`, `XML Remoto` e `PDF Remoto` desabilitados (com `title` explicativo) quando `nfse.provider` e PLUGNOTAS; `openPdfPreview` pula o fallback remoto para PLUGNOTAS (abre apenas PDF local, sem erro).
- `NfseListPage.tsx`: helper `isPlugNotasProvider`; `handleOpenPdf`/`handleDownloadPdf` recebem `provider` e pulam fallback remoto para PLUGNOTAS; handlers atualizados com `nfse.provider`.
- `EmpresaFormPage.tsx`: card `Sincronizacao com a PlugNotas` agora exibe Alert "Sincronizacao desabilitada" e o botao do mutation fica `disabled` com `title` explicativo (mutation/estados `syncPlugNotas*` preservados).
- Validacao local: `eslint` 0 erros (warnings pre-existentes); `npm run build` ok; `npm test` -> mesmo baseline (14 falhas pre-existentes, sem regressao).

Retomada:
1. commit + push (ex.: `feat(nfse): desabilita acoes de sincronizacao/remoto para notas PLUGNOTAS`);
2. apos deploy Vercel, conferir na tela (NFS-e 47 PlugNotas): botoes desabilitados e PDF/XML somente do persistido;
3. nenhum novo teste pendente de backend.

## 0. ATUALIZACAO (05/08/2026) - FIX DOWNLOAD DE XML/PDF NA TELA; AGUARDANDO COMMIT

Fonte: `execucao real em producao` + `codigo local` + `build local` + `testes locais`.

Estado operacional:
- o backend ja baixa XML/PDF da NFS-e 48 corretamente em producao (ver CURRENT_STATE.md do backend) — o problema restante era **so no frontend**:
  - `downloadFile` (`NfseDetailPage.tsx`) e `handleDownloadPdf` (`NfseListPage.tsx`) chamavam `a.click()` e **revogavam o blob URL imediatamente** (`URL.revokeObjectURL(url)` na linha seguinte), abortando o download no navegador.
- Fix aplicado (NAO commitado ainda):
  - `NfseDetailPage.tsx` `downloadFile`: revogacao movida para `window.setTimeout(() => URL.revokeObjectURL(url), 60_000)`; caminho remoto continua direto na URL sem blob.
  - `NfseListPage.tsx` `handleDownloadPdf`: mesma adia a revogacao (caminhos local e remoto).
  - `openBlobInNewTab` ja usava setTimeout — alinhado ao novo padrao.
- Validacao local:
  - `eslint` nos 2 arquivos -> 0 erros;
  - `npm run build` -> ok (`✓ built in 10.08s`);
  - `npm test` -> **135 passando / 14 falhas pre-existentes** (mesmo baseline, sem regressao).

Retomada:
1. commit + push do fix (ex.: `fix(nfse): adia revogacao do blob URL no download de XML/PDF`);
2. apos deploy Vercel, validar download pela tela no **front atual `https://manaus-nfse-dashboard.vercel.app`** (NFS-e 48) — XML e PDF;
3. sem novo teste pendente de backend; nova emissao LOBONOTAS deve fechar artefatos pelo caminho ja validado.

## 0. RETOMAR DAQUI (04/08/2026) - botao de reemissao temporariamente nao deve ser usado

Fonte: `frontend em producao` + `logs e respostas reais do backend/SEFIN`.

Estado operacional:
- a tela e o endpoint de reemissao funcionam, e o backend agora preserva corretamente `LOBONOTAS`
- a NFS-e PlugNotas numero 47 (`6a71420f451c04dbcc7a438c`) foi autorizada e sera mantida
- a origem que aparece como `NFSe 6a70eb85`, criada em 03/08/2026 15:27:02, e `6a70eb85caa874f842b4a576`
- **nao clicar novamente em `Tentar emitir novamente`** nesta origem ate o backend concluir GZip/Base64
- ultima chamada gerou DPS 60 no provider correto/SEFIN producao, mas recebeu `E1226 - Estrutura descompactada mal formada`; nenhuma NFS-e LOBONOTAS foi autorizada

Retomada:
1. backend implementa compactacao GZip + Base64Binary no campo JSON `dps`
2. backend implementa descompactacao da resposta NFS-e e testes deterministas
3. apos deploy confirmado, fazer uma unica tentativa pela mesma tela e acompanhar o novo ID

Backend relacionado ao pausar: `446a620`, deploy `30872158142` verde.

## 0. Atualizacao rapida (03/08/2026) - tentar novamente emissao que falhou antes da transmissao

Fonte: `codigo local` + `build local` + `teste focado`.

Estado atual:
- a tela de detalhe de uma NFSe `ERROR` passou a oferecer `Tentar emitir novamente` somente quando nao ha `externalId` nem resposta do provider
- a acao exige confirmacao explicita, chama `POST /nfse/:id/reemitir` e navega para a nova emissao
- a tentativa antiga permanece visivel como auditoria; perfil `readonly` nao recebe a acao
- o fluxo cobre a emissao LOBONOTAS `6a70eb85caa874f842b4a576`, que falhou antes da transmissao pelo erro de pipeline da numeracao DPS ja corrigido no backend

Validacao:
- `npm run build` -> ok
- `vitest run src/services/api.new-flows.test.ts` -> **20/20 testes** verdes
- lint dos arquivos alterados -> 0 erros
- pacote critico: 75 verdes / 3 falhas pre-existentes (PrestadorSection e CertificadoDigitalCard), sem relacao com esta mudanca

Leitura operacional correta:
1. abrir o detalhe da tentativa com erro e confirmar a reemissao cria uma nota nova com os mesmos dados fiscais
2. a UI nao oferece reemissao automatica quando ha qualquer evidencia de transmissao, evitando duplicidade fiscal
3. acompanhar a nova emissao ate `AUTHORIZED`, `PENDING` ou novo erro real do Ambiente Nacional

## 0. Atualizacao rapida (03/08/2026) - Slice 8 LOBONOTAS: municipios centralizados no backend (fim do IBGE direto)

Fonte: `codigo local` + `testes locais` + `build local`.

Estado atual:
- as duas chamadas diretas ao `IBGE Localidades` do fluxo de emissao foram removidas
- `src/components/emissao/PrestacaoServicoSection.tsx` e `src/services/location.ts` nao consomem mais `servicodados.ibge.gov.br`
- municipios por UF passam a vir exclusivamente de `GET /empresas/lookup/municipios` (rota canonica do backend)
- `listMunicipiosByUf` simplificada: retorna lista vazia em falha de rede/API e para UF invalida (sem fallback externo)

Leitura operacional correta:
1. o frontend fala somente com o backend do ZERA para municipios (direcao canonica)
2. `LocalPrestacaoSection` e o dropdown de municipio da emissao degradam para lista vazia se a API interna falhar, sem quebrar o form
3. nenhuma regra fiscal ou payload de emissao foi alterado
4. a divida registrada em `CONTEXT.md` (12/05/2026) e no roadmap (Slice 8, item 4) foi encerrada

Validacao:
- `vitest run src/services/location.test.ts` -> 3 testes passando
- `npm test` -> 134 passando / 14 falhas pre-existentes (mesmo baseline)
- `npm run build` -> ok
- `eslint` nos arquivos alterados -> 0 erros (4 warnings pre-existentes)

## 0. Atualizacao rapida (03/08/2026) - Slice 8 LOBONOTAS: frontend migrado para contrato canonico

Fonte: `codigo local` + `testes locais` + `build local`.

Estado atual:
- o frontend deixou de depender exclusivamente do shape legado da PlugNotas para ler numero/DPS da emissao
- `inferNfseDataFromProvider` passou a priorizar o bloco canonico neutro `canonico` (`numeroNfse`, `dpsNumero`, `dpsSerie`) antes de recorrer ao `providerResponse` bruto
- o contrato canonico e aditivo: quando o backend expuser `canonico`, ele vence; caso contrario, a inferencia legada continua funcionando (zero regressao)
- `ProviderResponse` ganhou o campo opcional `canonico` e o union `NfseProvider` ganhou `LOBONOTAS`
- a lista de NFSe passou a oferecer `Nacional` (LOBONOTAS) no filtro de provedor, preservando PlugNotas/Manaus/Mock
- o dashboard deixou de preferir itens `PLUGNOTAS`: agora prefere emissoes com identificadores fiscais reais, independente do provider

Leitura operacional correta:
1. o frontend esta pronto para consumir `canonico`/`status`/`provider` quando o backend publicar esses campos
2. emissoes legadas PLUGNOTAS continuam exibindo normalmente pelo fallback de shape
3. nenhum filtro ou tela quebra com o novo provider LOBONOTAS
4. a regra segue: sem quebrar, sem regredir, uma coisa de cada vez

Validacao:
- `vitest run src/lib/nfse-provider.test.ts src/hooks/useDashboardData.test.ts` -> 8 testes passando
- `npm test` -> 134 passando / 14 falhas pre-existentes (NfseEmitPage.tomador-substituto, NfseQuickEmitPage, tomadores.persistence, PrestadorSection, CertificadoDigitalCard) confirmadas tambem em checkout limpo
- `npm run build` -> ok
- `eslint` nos arquivos alterados -> 0 erros

## 0. Atualizacao rapida (19/05/2026) - frontend passou a respeitar a role `readonly`

Fonte: `codigo local` + `build local`.

Estado atual:
- a role `readonly` ja e entendida pelo frontend
- esse perfil pode ver:
  - home operacional
  - dashboards
  - listagem e detalhe de NFSe
  - listagem de prestadoras
  - listagem de tomadores
- esse perfil nao recebe CTA para:
  - emitir
  - emissao rapida
  - novo tomador
  - nova empresa
  - exclusoes
  - sincronizacao manual de artifacts
- rotas de formulario operacional exibem bloqueio explicito quando acessadas com `readonly`

Leitura operacional correta:
1. agora existe um perfil visual seguro para testes de investidor/demonstracao
2. o frontend ja nao trata `readonly` como `user` comum
3. o comportamento multi-prestador continua visivel para esse perfil, mas sem poder operacional

## 0. Atualizacao rapida (19/05/2026) - `/` virou home operacional multi-prestador

Fonte: `codigo local` + `build local`.

Estado atual:
- a rota `/` deixou de abrir o dashboard compacto legado
- agora ela entrega uma home de boas-vindas operacional com leitura consolidada de multi-prestador
- a home nova mostra:
  - quantidade de prestadoras
  - prontidao operacional
  - pendencias de onboarding
  - prestadoras com emissao recente
  - pulso das emissoes recentes por status
  - prioridades operacionais sugeridas
  - ultimas emissoes com prestadora, tomador e status
  - atalhos diretos para prestador, emissao e Dash2
- o dashboard antigo continua preservado em `/dashboard-classico`
- o `Dash2` permanece em `/dash2` como trilha executiva complementar

Leitura operacional correta:
1. o ponto de entrada do sistema agora respeita o fato de que o ZERA e multi-prestador
2. a home principal virou uma central de orientacao e acompanhamento, nao apenas um painel fiscal denso
3. dashboards antigos seguem acessiveis para comparacao e continuidade
4. a proxima camada natural dessa home e aprofundar status e filtros por prestadora

## 0. Atualizacao rapida (18/05/2026) - multi-prestador validado e nova exigencia para a listagem de NFSe

Fonte: `execucao real` + `codigo local` + `build local`.

Estado atual:
- `Nova DANFSE` e `Emissao Rapida` ja permitem escolher explicitamente a empresa prestadora
- um segundo prestador ja emitiu nota real apos sincronizacao com a PlugNotas e configuracao manual complementar da aba `NFS-e` no provider
- a tela do prestador agora precisa refletir esse cenario como sucesso com pendencia operacional manual, e nao como falha total de sincronizacao
- a tela do prestador agora tambem informa que a sincronizacao usa os dados atuais de serie/numeracao para tentar a configuracao minima da aba `NFS-e`
- o cadastro do prestador agora tambem persiste toggles operacionais da PlugNotas; a automacao direta dos toggles por ator continua condicionada ao contrato oficial do provider
- a listagem `Notas Fiscais` continua mostrando status, tomador, valor, provedor e data
- a listagem agora tambem contempla a prestadora associada a cada emissao

Leitura operacional correta:
1. a UI de emissao ja deixou de ser mono-prestador
2. a listagem operacional de NFSe precisa acompanhar essa mudanca e deixar a prestadora visivel
3. isso deve ser tratado como evolucao de leitura operacional, nao como refactor cosmetico
4. filtros e detalhes futuros devem considerar prestadora como eixo legitimo de navegacao

## 0. Atualizacao rapida (14/05/2026) - dominio `zera.net.br` e dependencia operacional de CORS no backend

Fonte: `execucao real` + `codigo local`.

Estado atual:
- o frontend passou a responder pelo dominio `https://zera.net.br`
- a mudanca de dominio por si so nao garante acesso funcional ao backend
- o comportamento observado em producao foi falha de `OPTIONS` em rotas como `/health` e `/auth/login`
- a causa real foi ausencia da nova origem publica em `CORS_ORIGINS` no backend

Leitura operacional correta:
1. mudar dominio do frontend exige revisar `CORS_ORIGINS` no backend
2. `FRONTEND_URL` e `FRONTEND_APP_URL` nao substituem a allowlist de CORS
3. quando houver novo dominio, subdominio ou alias publico, o backend deve ser redeployado com a origem nova liberada
4. o sintoma tipico desta falha e preflight `OPTIONS` quebrando antes do login ou do healthcheck

## 0. Atualizacao rapida (12/05/2026) - auditoria de integracoes externas e excecao atual do IBGE

Fonte: `codigo local` + `docs locais`.

Estado atual:
- o frontend usa o backend do ZERA como trilha principal para:
  - CPF de tomador
  - CNPJ de prestador/tomador
  - CEP
- municipios por UF ja possuem rota interna no backend
- apesar disso, ainda existem duas chamadas diretas ao `IBGE Localidades` no fluxo ativo da emissao:
  - `src/services/location.ts`
  - `src/components/emissao/PrestacaoServicoSection.tsx`

Leitura operacional correta:
1. a direcao canonica continua sendo frontend -> backend do ZERA -> servicos externos
2. as duas chamadas diretas ao IBGE devem ser tratadas como excecao remanescente
3. a auditoria executiva desta frente foi registrada fora do repo raiz em `AUDITORIA_INTEGRACOES_EXTERNAS_ZERA_2026-05-12.pdf`
4. qualquer correcao dessa centralizacao deve ser feita sem misturar ajuste arquitetural com regra fiscal

## 0. Atualizacao rapida (21/04/2026) - DANFSE padrao aceita tomador manual com decisao explicita de cadastro

Fonte: `codigo local` + `testes locais` + `build local`.

Estado atual:
- `Nova DANFSE` continua sendo o fluxo completo de emissao
- tomador manual/nao cadastrado agora pode ser usado na emissao padrao sem passar antes por `Tomadores`
- quando o tomador digitado nao existe no cadastro, ou veio incompleto, a tela abre `Dados do tomador para esta nota`
- os campos obrigatorios para evitar rejeicao da API sao:
  - CEP
  - logradouro
  - numero
  - bairro
- a tela tambem permite complemento, cidade/UF e e-mail
- CEP no bloco do tomador manual consulta endereco e preenche logradouro/bairro/cidade quando a fonte retornar dados

Decisao de cadastro:
- tomador manual mostra `Cadastrar no cadastro de tomadores?`
- padrao para manual: `Nao`
- `Nao` envia `syncTomadorCadastro: false`
- `Sim` envia `syncTomadorCadastro: true`
- tomador ja cadastrado nao mostra essa escolha

Regra operacional correta:
1. DANFSE padrao pode emitir para tomador avulso, desde que os dados fiscais completos estejam na tela
2. a tela bloqueia antes do backend se faltar endereco obrigatorio do tomador
3. cadastro a partir da emissao padrao e escolha explicita, nao efeito colateral invisivel
4. Emissao Rapida permanece isolada e sem cadastro formal de tomador

Validacao:
- `npm test -- src/components/emissao/TomadorEmissao.test.tsx src/pages/NfseEmitPage.tomador-substituto.test.tsx`
- `npm run build`

## 0. Atualizacao rapida (21/04/2026) - Emissao Rapida com prestador padrao unico

Fonte: `codigo local` + `build local`.

Estado atual:
- `Emissao Rapida` e `Nova DANFSE` agora trabalham com seletor explicito de prestador
- o `cnpj` enviado na emissao rapida vem da empresa escolhida pelo usuario, sem campo manual separado
- a `Nova DANFSE` hidrata o card do prestador a partir da empresa selecionada e limpa tomador/servico ao trocar de contexto
- a tela de cadastro do prestador passou a expor uma acao explicita de sincronizacao com a PlugNotas
- o frontend continua sem fazer cadastro automatico no provider ao salvar empresa; essa sincronizacao permanece acao separada nesta rodada

Regra operacional:
1. a UI ja entrou em primeira fase de multi-prestador
2. aptidao real de emissao ainda depende da cadeia PlugNotas no backend
3. CPF do tomador, valor e servico continuam com o mesmo contrato funcional

## 0. Atualizacao rapida (21/04/2026) - listagem de NFSe com ultimas 10 emissoes

Fonte: `codigo local` + `build local`.

Estado atual:
- `Notas Fiscais` mostra as ultimas 10 emissoes mais recentes
- a busca usa `limit = 10`, `page = 1`, `createdAt DESC`
- cada linha preserva numero, status, tomador, valor, provedor, data e acoes
- a tela agora exibe tambem a prestadora responsavel por cada nota
- o status continua visivel na tabela por `StatusBadge`
- o historico total continua preservado no backend; a tela e apenas um quadro operacional compacto

Regra operacional:
1. lista visivel = ultimas 10 emissoes
2. historico nao e apagado
3. filtros de status/provedor continuam aplicaveis
4. polling visual continua apenas para emissoes em andamento

## 0. Atualizacao rapida (21/04/2026) - visual elegante azul, Phosphor somente no Visual elegante e onboarding admin

Fonte: `codigo local` + `git log local` + `build local`.

Estado atual:
- o menu do usuario concentra as alternancias de UI:
  - `Tema claro/escuro` para o tema base
  - `Visual elegante/classico` para a camada visual experimental controlada
- `Visual elegante` usa `body.theme-elegant`, `localStorage` e hook compartilhado para sincronizar estado
- a direcao visual vigente do elegante e azul ZERA com `Manrope`
- `@phosphor-icons/react` foi adicionado como kit novo, mas sua renderizacao fica condicionada ao `Visual elegante`
- no tema classico, a casca continua com os icones `lucide-react`
- a troca de kit esta limitada a sidebar, header, dropdown do usuario e toggles

Regra anti-regressao:
1. nao trocar icones globalmente fora do `Visual elegante`
2. nao alterar telas fiscais internas junto com mudanca de tema
3. manter o tema classico como fallback visual seguro

Usuarios e onboarding:
- admin acessa `/users` pelo menu do usuario
- `/users/novo` permite gerar convite seguro ou criar usuario manual
- convite retorna link copiavel para `/accept-invite?token=...`
- usuario convidado define sua propria senha no primeiro acesso
- o fluxo recomendado nao envia senha por e-mail

Validacao:
- `yarn build` passou.

## 0. Atualizacao rapida (20/04/2026) - DANFSE alinhada ao CPF, favoritos do prestador e emissao rapida isolada

Fonte: `codigo local` + `testes locais` + `validacao funcional real`.

Leitura consolidada:
- `Nova DANFSE` usa CPF de tomador como pessoa fisica: label `Nome`, sem campos de PJ e com lookup assistido no backend
- quando o CPF ja existir na base local, a tela pode preencher o tomador salvo antes de complementar com Hub do Desenvolvedor
- resposta parcial do Hub continua valida apenas para os campos que vierem legiveis
- `Servicos Favoritos` na emissao deve refletir o que esta salvo em `Prestador > Parametros Municipais`
- `Emissao Rapida` nao deve cadastrar tomador no seletor da DANFSE; se aparecer registro antigo, tratar como legado de dados

Regra operacional atual:
1. DANFSE normal = fluxo completo, com tomador suficientemente preenchido
2. Emissao Rapida = payload minimo para emitir, sem virar cadastro formal de tomador
3. favoritos de servico = prestador vigente, nao historico de tomador
4. CPF = assistido e parcial quando a fonte externa entregar pouco dado

## 0. Atualizacao rapida (16/04/2026) - CPF de tomador integrado via backend com Hub do Desenvolvedor

Fonte: `codigo local` + `testes locais` + `build local`.

Leitura consolidada:
- `cadastropf` deixou de estar apenas documentado e passou a alimentar o produto
- o frontend agora consulta o backend em `GET /tomadores/lookup/cpf?cpf=` para enriquecimento de tomador PF
- a automacao foi limitada ao contexto de `tomadores`, preservando integralmente o fluxo existente de `CNPJ`

Comportamento atual:
- `Tomadores > Cadastro`: CPF valido tenta preenchimento assistido
- `Nova DANFSE`: CPF manual do tomador tambem tenta o mesmo enriquecimento
- dados mascarados por LGPD nao bloqueiam o fluxo e nao substituem preenchimento manual

Campos preenchidos quando vierem uteis:
- nome
- email
- telefone / whatsapp
- endereco com apoio de CEP quando necessario

Regra operacional correta agora:
1. `CPF` enriquecido = apoio de preenchimento
2. `CNPJ` continua no fluxo antigo
3. `prestador` nao participa dessa frente
4. a tela deve degradar para preenchimento manual se a fonte vier ofuscada ou parcial

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
