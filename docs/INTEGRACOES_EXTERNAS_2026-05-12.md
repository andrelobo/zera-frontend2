# Integracoes Externas - Auditoria 2026-05-12

Resumo tecnico de trabalho para o time. Este arquivo complementa o `CONTEXT.md`.

- `tomadores` por CPF:
  - o frontend usa o backend em `GET /tomadores/lookup/cpf`
  - a fonte externa por tras e o Hub do Desenvolvedor

- `prestador` e `tomador` por CNPJ:
  - o frontend usa o backend para pre-visualizacao e cadastro
  - a cadeia principal de dados empresariais fica no backend

- `CEP`:
  - o fluxo padrao do frontend usa o backend em `GET /empresas/lookup/cep/:cep`

- `municipios por UF`:
  - existe consumo via backend em `GET /empresas/lookup/municipios`
  - ainda existem duas chamadas diretas ao IBGE no frontend ativo:
    - `src/services/location.ts`
    - `src/components/emissao/PrestacaoServicoSection.tsx`

Direcao correta:
- centralizar o consumo externo no backend do ZERA
- remover chamadas diretas do frontend para servicos externos
- manter o frontend falando apenas com contratos internos do proprio ZERA
