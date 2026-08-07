# Inventario de rebranding Jupati

Classificacao aplicada antes das alteracoes da primeira fase.

| Classe | Exemplos encontrados | Conduta |
|---|---|---|
| Marca visivel | metadata, `BrandLogo`, login, convite, sidebar, dashboard | Migrar para Jupati |
| Asset de marca | `zera-logo.*`, `zera-mark.*`, favicon | Criar assets Jupati e preservar legados temporariamente |
| Identificador tecnico | `zera_token`, rotas, nomes de repositorio, tipos e contratos da API | Preservar |
| Compatibilidade temporaria | chaves/eventos de tema e cache `zera_*` | Preservar leitura; migrar apenas com fallback controlado |
| Dado historico | fixtures e emissoes `PLUGNOTAS` | Preservar |
| Contrato publico | `/nfse/*`, `LOBONOTAS`, `PLUGNOTAS`, status fiscais | Preservar |
| UX de provider legado | filtros, sincronizacao e downloads remotos PlugNotas | Manter bloqueado; exibir somente como legado quando necessario |

## Escopo implementado

- fonte de verdade em `docs/JUPATI_DESIGN_SYSTEM.md`;
- tokens semanticos claro/escuro;
- assets vetoriais de implementacao;
- metadata, marca, login, convite, sidebar e shell;
- textos visiveis prioritarios;
- shell consolidado em Phosphor, mantendo light/dark;
- helper tipado de apresentacao de providers;
- dashboard principal e Dash2 aproximados dos tokens Jupati;
- status `CANCELED` na UI com leitura temporaria de `CANCELLED`;
- nenhuma mudanca em contrato fiscal, rota, persistencia ou autenticacao.

Os SVGs desta fase sao assets de implementacao coerentes com a direcao aprovada.
Nao substituem o master vetorial final previsto no design system.
