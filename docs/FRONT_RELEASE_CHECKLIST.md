# Front Release Checklist

Este checklist existe para reduzir regressao em `Prestador`, `Tomador`, `Emissao` e `Certificado`.

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

## Critio de Bloqueio de Release

Nao liberar se qualquer um destes pontos falhar:

- autocomplete de prestador nao preencher
- logradouro/localidade/CEP/WhatsApp travarem apos preenchimento automatico
- certificado continuar dependente da rota antiga no cadastro
- tomador CPF mostrar campos de PJ
- tomador duplicado permitir salvar
- save/reload do prestador voltar dados incoerentes
- favorito/lista servico na emissao reaproveitar dado antigo

## Observacoes

- Teste automatizado reduz regressao conhecida.
- Checklist manual pega quebra de fluxo real.
- Os dois sao obrigatorios nas areas criticas.
