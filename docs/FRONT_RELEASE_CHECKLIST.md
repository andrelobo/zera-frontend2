# Front Release Checklist

Este checklist existe para reduzir regressao em `Prestador`, `Tomador`, `Emissao` e `Certificado`.

Premissa canonica:
- este checklist protege fluxos de um frontend **ja em producao**
- trate toda release como mudanca sobre operacao real, e nao como experimento isolado

## Regras

1. Nao misturar refactor visual com regra de negocio nas areas criticas.
2. Toda mudanca nessas areas precisa passar no pacote `test:critical`.
3. Toda release precisa passar no checklist manual abaixo.

## Comandos Obrigatorios

Antes de liberar:

```bash
yarn test:critical
yarn build
```

Se a mudanca tocar apenas arquivos do pacote critico:

```bash
yarn vitest run <arquivo-do-teste>
```

## Pacote Critico Coberto

- `src/pages/empresa-form.autocomplete-fixtures.test.ts`
- `src/pages/empresa-form.save-reload.test.ts`
- `src/components/prestador/prestador-cards.test.tsx`
- `src/components/prestador/CertificadoDigitalCard.test.tsx`
- `src/components/TomadorSection.test.tsx`
- `src/components/tomador-section.logic.test.ts`
- `src/components/emissao/TomadorEmissao.test.tsx`
- `src/components/emissao/PrestadorSection.test.tsx`
- `src/components/emissao/PrestacaoServicoSection.test.tsx`
- `src/components/emissao/prestacao-servico.logic.test.ts`
- `src/pages/nfseEmit.mappers.test.ts`
- `src/utils/validators.test.ts`

## Fluxos Criticos

### 1. Novo Prestador com CNPJ

- Abrir cadastro novo de prestador
- Digitar CNPJ valido com 14 digitos
- Confirmar autocomplete de:
  - razao social
  - nome fantasia
  - endereco
  - cidade
  - UF
- Confirmar que `Inscricao Municipal` manual nao e sobrescrita

### 2. Update de Prestador

- Abrir empresa existente
- Editar:
  - logradouro
  - localidade / UF
  - CEP
  - WhatsApp
- Confirmar que os campos continuam editaveis apos valor preenchido
- Salvar
- Recarregar
- Confirmar que a tela permanece na mesma aba

### 3. Certificado no Cadastro do Prestador

- Abrir prestador existente
- Se ja houver certificado:
  - confirmar que o card mostra resumo
  - confirmar que os campos de importacao ficam ocultos
- Clicar em `Substituir certificado`
- Confirmar reexibicao de:
  - arquivo
  - senha
- Fazer upload de `.pfx`/`.p12`
- Confirmar sucesso e refresh do cadastro

### 4. Tomador PF

- Abrir cadastro de tomador
- Iniciar com CPF
- Confirmar ocultacao dos campos de PJ
- Se o CPF ja existir:
  - confirmar aviso de duplicidade
  - confirmar bloqueio do submit

### 5. Tomador PJ

- Abrir cadastro de tomador
- Iniciar com CNPJ
- Confirmar exibicao dos campos de PJ
- Confirmar autocomplete/merge sem perder dados complementares

### 6. Emissao com Prestador

- Abrir emissao
- Confirmar autocomplete do prestador por CNPJ
- Confirmar que endereco, CEP, localidade/UF e WhatsApp continuam editaveis

### 7. Emissao com Tomador

- Digitar CPF no tomador
- Confirmar ocultacao de `Inscricao Municipal`
- Digitar CNPJ existente
- Confirmar aviso de tomador ja cadastrado
- Confirmar mascara correta do documento

### 8. Emissao com Servico

- Confirmar favoritos carregando do cadastro salvo
- Trocar favorito
- Confirmar update de:
  - CTN
  - descricao do servico
- Selecionar item em `Lista Servico`
- Confirmar que codigo e descricao atualizam corretamente

## Emissao - Checklist Atual com CPF, favoritos e Emissao Rapida

Este bloco protege o estado atual do produto:
- CPF de tomador ja consulta o backend em `GET /tomadores/lookup/cpf?cpf=`
- a resposta do Hub do Desenvolvedor pode ser parcial e deve degradar para preenchimento manual
- emissao normal (`/nfse/emitir`) e emissao rapida (`/nfse/quick`) continuam convivendo, mas com responsabilidades diferentes

Leitura correta:
- a DANFSE normal pressupoe tomador suficientemente completo para atender o contrato fiscal
- a Emissao Rapida continua sendo o fluxo canonico para CPF sem cadastro previo quando o objetivo e emitir com payload minimo
- a Emissao Rapida nao deve criar novo tomador no seletor da DANFSE; aparicoes antigas devem ser tratadas como legado de dados

### 9. DANFSE com tomador PJ ja cadastrado

- Abrir `Nova DANFSE`
- Selecionar tomador PJ no botao `Selecione (n)`
- Confirmar preenchimento de:
  - documento
  - razao social
  - inscricao municipal (quando existir)
  - endereco
- Emitir
- Confirmar submit sem erro de payload incompleto do tomador

### 10. DANFSE com tomador PF ja cadastrado

- Abrir `Nova DANFSE`
- Selecionar tomador PF ja salvo
- Confirmar:
  - label `Nome` no lugar de `Razao Social`
  - ocultacao de `Inscricao Municipal`
  - preenchimento de nome
  - preenchimento de endereco quando existir no cadastro
- Emitir
- Confirmar submit sem erro de payload incompleto do tomador

### 11. DANFSE com tomador digitado manualmente por CNPJ

- Abrir `Nova DANFSE`
- Digitar CNPJ valido de tomador nao selecionado na lista
- Confirmar tentativa de preenchimento assistido
- Validar se vieram, no minimo:
  - razao social
  - CEP
  - logradouro
  - bairro
  - municipio / UF
- Emitir
- Se o endereco nao vier completo, confirmar que o fluxo nao e tratado como pronto para emissao por engano

### 12. DANFSE com tomador digitado manualmente por CPF

- Abrir `Nova DANFSE`
- Digitar CPF valido de tomador nao selecionado na lista
- Confirmar tentativa de lookup em `GET /tomadores/lookup/cpf?cpf=`
- Confirmar que a tela preenche `Nome` quando o provider devolver nome legivel
- Confirmar que ausencia de endereco/contato nao apaga digitacao manual nem trava a tela indevidamente

### 12.1 DANFSE sem tomador suficiente

- Abrir `Nova DANFSE`
- Informar apenas documento e nome do tomador, sem endereco suficiente
- Tentar emitir
- Confirmar falha clara do fluxo
- Confirmar que isso nao e mascarado como sucesso nem erro fiscal ambiguo

### 13. Emissao Rapida com CPF sem cadastro previo

- Abrir `Emissao Rapida`
- Informar:
  - CNPJ do prestador
  - CPF do tomador
  - valor
  - codigo do servico
- Emitir
- Confirmar que o fluxo aceita payload minimo sem depender de cadastro previo do tomador
- Voltar para `Nova DANFSE`
- Confirmar que esse CPF novo nao foi adicionado ao seletor de tomadores por causa da emissao rapida

### 14. Servico Prestado na DANFSE

- Confirmar favoritos carregando do `Prestador > Parametros Municipais`
- Se houver dois favoritos salvos no prestador, confirmar que os dois aparecem no select
- Selecionar favorito
- Confirmar preenchimento de descricao e codigos disponiveis
- Confirmar que favorito sem CTN/NBS mostra a lacuna sem inventar codigo
- Selecionar item em `Lista Servico` sem `codigoServico`
- Confirmar que apenas a descricao e acrescentada
- Selecionar item em `Lista Servico` com `codigoServico`
- Confirmar que o CTN e reaproveitado

### 15. Regra tributaria sensivel na emissao

- Testar tomador marcado como `Substituto Tributario`
- Testar tomador nao substituto
- Confirmar impacto esperado em:
  - `ISS Retido`
  - aliquota automatica
  - card `Parametro Tributario Aplicado`

### 16. Pos-emissao

- Emitir pela DANFSE normal
- Emitir pela Emissao Rapida
- Confirmar invalidacao da listagem
- Confirmar que a nova emissao aparece sem refresh manual indevido

## Critio de Bloqueio de Release

Nao liberar se qualquer um destes pontos falhar:

- autocomplete de prestador nao preencher
- logradouro/localidade/CEP/WhatsApp travarem apos preenchimento automatico
- certificado continuar dependente da rota antiga no cadastro
- tomador CPF mostrar campos de PJ
- tomador duplicado permitir salvar
- save/reload do prestador voltar dados incoerentes
- favorito/lista servico na emissao reaproveitar dado antigo
- emissao rapida voltar a criar tomador novo no seletor da DANFSE

## Observacoes

- Teste automatizado reduz regressao conhecida.
- Checklist manual pega quebra de fluxo real.
- Os dois sao obrigatorios nas areas criticas.
