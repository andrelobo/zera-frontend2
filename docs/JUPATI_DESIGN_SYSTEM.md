# JUPATI — Sistema de Identidade e Design de Produto

> Especificação visual e técnica para a migração do frontend anteriormente chamado ZERA.

| Campo | Definição |
|---|---|
| Status | Direção visual aprovada; implementação pendente |
| Versão | 0.1 |
| Data | 7 de agosto de 2026 |
| Produto | Jupati |
| Pronúncia | ju-pa-TI |
| Assinatura | Sua operação, bem conectada. |
| Responsável institucional | Muirakitan Tecnologia |
| Motor fiscal | LOBONOTAS |
| Provider histórico | PlugNotas — `LEGACY_DISABLED` |

## 1. Objetivo deste documento

Este documento transforma a direção visual aprovada da Jupati em regras implementáveis no frontend React, TypeScript, Tailwind CSS e shadcn/ui.

Ele deve orientar:

- rebranding visual de ZERA para Jupati;
- reconstrução do componente de marca e dos assets;
- criação dos design tokens;
- padronização de layout, componentes, estados e gráficos;
- revisão da linguagem usada na interface;
- migração incremental sem alterar contratos fiscais ou dados históricos.

Este documento não autoriza renomear repositórios, banco, rotas da API, collections, providers fiscais ou identificadores históricos. Essas mudanças pertencem ao plano técnico de migração de marca.

## 2. Fundamentos da marca

### 2.1 Posicionamento

Jupati é uma plataforma brasileira de operação e inteligência para empresas e contabilidades, com núcleo fiscal próprio.

Jupati não deve ser apresentada apenas como emissor de NFS-e e ainda não deve ser apresentada como ERP completo.

Proposta central:

> Conectar empresas, pessoas, serviços, documentos, dados e inteligência em uma operação segura e compreensível.

### 2.2 Arquitetura de marca

| Camada | Nome | Papel na comunicação |
|---|---|---|
| Produto | Jupati | Marca percebida pelo usuário |
| Motor fiscal | LOBONOTAS | Infraestrutura fiscal própria; visível apenas quando houver valor técnico ou operacional |
| Empresa | Muirakitan Tecnologia | Responsabilidade institucional e jurídica |
| Provider legado | PlugNotas | Compatibilidade histórica, permanentemente `LEGACY_DISABLED` |

Regras:

- escrever **JUPATI** apenas no logotipo, títulos institucionais e peças de alta ênfase;
- escrever **Jupati** em frases e textos corridos;
- usar “Uma solução Muirakitan Tecnologia” em rodapés institucionais, documentos e tela de acesso;
- não usar LOBONOTAS como marca principal do produto;
- não expor PlugNotas em fluxos operacionais novos;
- quando necessário em histórico administrativo, apresentar “Legado (PlugNotas)”, sem ações de sincronização ou transmissão.

### 2.3 Personalidade

A marca deve transmitir, nesta ordem:

1. confiança;
2. clareza operacional;
3. conexão;
4. inteligência;
5. origem amazônica contemporânea;
6. tecnologia.

A tecnologia é o meio. A promessa principal é uma operação segura, organizada e compreensível.

### 2.4 Princípios de experiência

- **Clareza antes de efeito:** nenhuma textura, animação ou decoração pode competir com dados fiscais.
- **Confiança antes de velocidade aparente:** ações críticas mostram contexto, confirmação e consequência.
- **Inteligência assistiva:** a plataforma recomenda e explica; não toma decisões fiscais irreversíveis sem supervisão.
- **Origem sem folclore:** referências amazônicas aparecem em estrutura, movimento, matéria e cor, não em clichês.
- **Consistência sem rigidez:** os mesmos tokens semânticos controlam todas as telas.

## 3. Conceito visual aprovado

A identidade nasce da combinação de três elementos:

1. **fibras entrelaçadas da jupati** — integração e resistência;
2. **fluxo dos rios amazônicos** — continuidade e adaptação;
3. **módulos e dados conectados** — plataforma e inteligência operacional.

O símbolo é uma trama horizontal formada por linhas curvas que se cruzam em um núcleo. Ele não deve parecer:

- uma folha ecológica genérica;
- um circuito eletrônico literal;
- uma onda isolada;
- uma malha de blockchain;
- um ornamento indígena reproduzido sem contexto;
- um ícone de IA, robô, cérebro ou chip.

### 3.1 Uso das referências naturais

| Referência | Tradução visual |
|---|---|
| Nervura da folha | Linhas paralelas e ritmo |
| Fibra trançada | Cruzamento e estrutura |
| Rio sinuoso | Curvas contínuas |
| Floresta vista de cima | Profundidade e contraste |
| Fruto modular | Padrões secundários, nunca o símbolo principal |

## 4. Sistema de logotipo

### 4.1 Assinaturas previstas

O pacote de marca final deve conter:

- símbolo isolado;
- logotipo horizontal: símbolo + JUPATI;
- logotipo vertical: símbolo acima de JUPATI;
- assinatura com tagline;
- versões positiva, negativa e monocromática;
- ícone quadrado para app;
- favicon simplificado.

### 4.2 Wordmark

O nome deve usar letras geométricas, espaçamento aberto e peso médio. O `A` pode receber um recorte próprio, desde que continue legível em tamanhos pequenos.

O wordmark exibido na prancha é uma referência de direção, não um arquivo final para produção. Antes da publicação, deve ser redesenhado e entregue em SVG vetorial com curvas consistentes.

### 4.3 Área de proteção

Definir `x` como a espessura visual média de uma linha do símbolo.

- proteção mínima ao redor do símbolo: `4x`;
- proteção mínima ao redor da assinatura horizontal: `3x`;
- nenhum texto, borda ou ícone deve entrar nessa área.

### 4.4 Tamanhos mínimos

| Uso | Mínimo |
|---|---:|
| Símbolo digital | 24 px |
| Favicon simplificado | 16 px |
| Assinatura horizontal | 120 px de largura |
| Assinatura com tagline | 220 px de largura |
| Impressão do símbolo | 8 mm |

Em 16 px, usar uma versão simplificada com menos linhas. Não comprimir o símbolo completo até perder os cruzamentos.

### 4.5 Usos incorretos

- não rotacionar;
- não alterar a proporção;
- não trocar individualmente as cores das linhas;
- não aplicar glow neon;
- não usar sombra pesada;
- não colocar sobre imagem sem contraste suficiente;
- não animar continuamente em telas operacionais;
- não substituir o símbolo por uma palmeira literal.

## 5. Paleta cromática

### 5.1 Cores primitivas

As cores abaixo foram consolidadas a partir da prancha aprovada.

| Token | Hex | Uso principal |
|---|---|---|
| `night-950` | `#071020` | Fundo institucional, login, sidebar |
| `night-900` | `#0A1728` | Cards escuros, popovers escuros |
| `night-800` | `#122238` | Hover e superfícies elevadas escuras |
| `forest-700` | `#384E37` | Marca em fundo claro, ações institucionais |
| `forest-600` | `#466A3F` | Botão primário no modo claro |
| `leaf-500` | `#6CA65D` | Destaque, foco, seleção e dados ativos |
| `sage-400` | `#829B7F` | Informação secundária e gráficos |
| `stone-500` | `#A7A7A5` | Texto auxiliar no modo escuro |
| `silver-300` | `#C3C5B6` | Linhas claras do símbolo, divisores escuros |
| `ivory-100` | `#EBE6DE` | Texto claro e superfícies de marca |
| `warm-50` | `#F7F5F0` | Fundo operacional claro |
| `white` | `#FFFFFF` | Cards e conteúdo de alta legibilidade |

### 5.2 Regra de contraste do verde

`leaf-500` com texto branco produz contraste aproximado de `2.90:1` e não atende WCAG AA para texto normal.

Uso correto:

```text
fundo #6CA65D + texto #071020 = aproximadamente 6.57:1
```

Para botão com texto branco no modo claro, usar `forest-600`:

```text
fundo #466A3F + texto #FFFFFF = aproximadamente 6.19:1
```

### 5.3 Cores semânticas

As cores semânticas não devem depender apenas de verde e vermelho; sempre combinar cor, ícone e texto.

| Estado | Hex base | Significado |
|---|---|---|
| Sucesso | `#256D4A` | Concluído, autorizado, válido |
| Atenção | `#B45309` | Revisão necessária, vencimento próximo |
| Erro | `#B42318` | Falha, rejeição, inválido |
| Informação | `#2D5E80` | Orientação, processamento neutro |
| Legado | `#5F6673` | Registro histórico sem operação disponível |

Não usar o verde de marca para representar automaticamente “sucesso”. Marca e estado precisam continuar distinguíveis.

## 6. Tokens semânticos para Tailwind/shadcn

O frontend atual já usa variáveis HSL integradas ao Tailwind. A migração deve preservar os nomes semânticos e substituir seus valores.

### 6.1 Tema claro

```css
:root {
  --background: 43 30% 95%;          /* #F7F5F0 */
  --foreground: 218 64% 8%;          /* #071020 */

  --card: 0 0% 100%;
  --card-foreground: 218 64% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 218 64% 8%;

  --primary: 110 25% 33%;            /* #466A3F */
  --primary-foreground: 0 0% 100%;
  --secondary: 37 25% 90%;           /* #EBE6DE */
  --secondary-foreground: 218 64% 8%;
  --accent: 108 29% 51%;             /* #6CA65D */
  --accent-foreground: 218 64% 8%;

  --muted: 43 18% 92%;
  --muted-foreground: 215 12% 38%;
  --border: 60 8% 82%;
  --input: 60 8% 78%;
  --ring: 108 29% 51%;

  --success: 151 49% 29%;
  --success-foreground: 0 0% 100%;
  --warning: 26 90% 37%;
  --warning-foreground: 0 0% 100%;
  --destructive: 4 76% 40%;
  --destructive-foreground: 0 0% 100%;

  --app-header: 218 64% 8%;
  --sidebar-background: 218 64% 8%;
  --sidebar-foreground: 37 25% 90%;
  --sidebar-primary: 108 29% 51%;
  --sidebar-primary-foreground: 218 64% 8%;
  --sidebar-accent: 215 51% 15%;
  --sidebar-accent-foreground: 37 25% 90%;
  --sidebar-border: 215 32% 24%;
  --sidebar-ring: 108 29% 51%;

  --radius: 0.625rem;
}
```

### 6.2 Tema escuro

```css
.dark {
  --background: 218 64% 8%;          /* #071020 */
  --foreground: 37 25% 90%;          /* #EBE6DE */

  --card: 214 60% 10%;               /* #0A1728 */
  --card-foreground: 37 25% 90%;
  --popover: 214 60% 10%;
  --popover-foreground: 37 25% 90%;

  --primary: 108 29% 51%;            /* #6CA65D */
  --primary-foreground: 218 64% 8%;
  --secondary: 215 51% 15%;          /* #122238 */
  --secondary-foreground: 37 25% 90%;
  --accent: 108 29% 51%;
  --accent-foreground: 218 64% 8%;

  --muted: 215 35% 14%;
  --muted-foreground: 60 1% 65%;     /* #A7A7A5 */
  --border: 215 28% 23%;
  --input: 215 28% 23%;
  --ring: 114 12% 55%;               /* #829B7F */

  --success: 145 44% 46%;
  --success-foreground: 218 64% 8%;
  --warning: 38 86% 58%;
  --warning-foreground: 218 64% 8%;
  --destructive: 4 72% 58%;
  --destructive-foreground: 218 64% 8%;

  --app-header: 218 64% 8%;
  --sidebar-background: 218 64% 8%;
  --sidebar-foreground: 37 25% 90%;
  --sidebar-primary: 108 29% 51%;
  --sidebar-primary-foreground: 218 64% 8%;
  --sidebar-accent: 215 51% 15%;
  --sidebar-accent-foreground: 37 25% 90%;
  --sidebar-border: 215 28% 23%;
  --sidebar-ring: 114 12% 55%;
}
```

## 7. Tipografia

O sistema usa fontes já presentes no frontend, evitando nova dependência.

| Papel | Fonte | Pesos |
|---|---|---|
| Wordmark | Desenho vetorial próprio | — |
| Títulos e números de destaque | Manrope | 500, 600, 700 |
| Interface e textos | Inter | 400, 500, 600, 700 |
| Dados tabulares | Inter com `tabular-nums` | 500, 600 |

Escala recomendada:

| Token | Tamanho / linha | Uso |
|---|---|---|
| `display` | 40 / 48 px | Login e comunicação institucional |
| `h1` | 30 / 38 px | Título de página |
| `h2` | 24 / 32 px | Seção principal |
| `h3` | 18 / 26 px | Card e agrupamento |
| `body` | 14 / 22 px | Interface padrão |
| `body-sm` | 13 / 19 px | Apoio e tabelas densas |
| `caption` | 12 / 16 px | Metadados |
| `overline` | 10 / 14 px | Rótulo curto em caixa alta |

Regras:

- evitar `font-black` na interface;
- não usar texto menor que 12 px para conteúdo relevante;
- títulos podem usar Manrope; campos, botões e tabelas permanecem em Inter;
- valores financeiros e tributários usam `font-variant-numeric: tabular-nums`;
- caixa alta somente em overlines curtos e labels de agrupamento.

## 8. Espaçamento, forma e elevação

### 8.1 Grade

Usar base de 4 px.

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

### 8.2 Raios

| Token | Valor | Uso |
|---|---:|---|
| `radius-sm` | 6 px | Badge, tooltip |
| `radius-md` | 10 px | Input e botão |
| `radius-lg` | 14 px | Card padrão |
| `radius-xl` | 18 px | Modal e painel de destaque |
| `radius-full` | 999 px | Avatar, status e toggle |

Evitar raios de 24–32 px em cards operacionais. Eles podem aparecer apenas em áreas institucionais ou hero.

### 8.3 Sombras

```css
--shadow-sm: 0 1px 2px rgb(7 16 32 / 0.06);
--shadow-md: 0 12px 32px -22px rgb(7 16 32 / 0.34);
--shadow-lg: 0 24px 60px -32px rgb(7 16 32 / 0.48);
```

No modo escuro, priorizar borda e mudança de superfície. Evitar sombras pretas profundas.

## 9. Layout da aplicação

### 9.1 Estratégia de superfície

- login, sidebar, header e onboarding usam `night-950` como superfície de marca;
- formulários, tabelas e telas densas usam modo claro por padrão;
- modo escuro completo continua disponível;
- textura de fibras pode aparecer em baixa opacidade apenas em superfícies institucionais;
- áreas fiscais nunca recebem textura atrás de campos ou números.

### 9.2 Sidebar

- fundo `night-950`;
- símbolo + JUPATI no topo quando expandida;
- apenas símbolo quando recolhida;
- item ativo com `leaf-500` e texto `night-950`;
- hover inativo em `night-800`;
- agrupamentos por capacidade do produto, não por provider;
- rodapé: “Uma solução Muirakitan Tecnologia”.

Arquitetura inicial sugerida:

```text
Visão geral
Empresas
Tomadores
Serviços
Operação fiscal
Insights
Automação
Administração
```

Exibir somente módulos implementados. Não criar links vazios para sugerir um ERP que ainda não existe.

### 9.3 Header

- fundo de marca ou superfície elevada conforme a tela;
- menu lateral, contexto da empresa, alertas e conta;
- KPIs tributários não devem ocupar permanentemente o header em telas pequenas;
- ações principais pertencem ao cabeçalho da página, não ao header global.

### 9.4 Conteúdo

- largura máxima recomendada: 1440 px;
- padding: 16 px mobile, 24 px tablet, 32 px desktop;
- formulários longos: máximo de 960–1120 px;
- tabelas podem ocupar toda a largura disponível;
- uma ação primária por região visual.

## 10. Componentes

### 10.1 Botões

| Variante | Uso |
|---|---|
| Primary | Próxima ação operacional clara |
| Secondary | Ação complementar |
| Outline | Filtros, navegação e ações neutras |
| Ghost | Controles de baixa ênfase |
| Destructive | Cancelar, excluir ou revogar |

Regras:

- altura padrão: 40 px; compacto: 32 px; destacado: 44 px;
- verbos explícitos: “Emitir NFS-e”, “Salvar empresa”, “Cancelar nota”;
- não usar apenas “OK”, “Sim” ou “Enviar” em operação fiscal;
- botão destrutivo exige confirmação contextual;
- loading preserva a largura e informa o que está acontecendo.

### 10.2 Inputs e formulários

- label sempre visível;
- placeholder é exemplo, nunca substitui label;
- ajuda e erro ficam abaixo do campo;
- borda de foco usa `ring` e não depende apenas da cor;
- campos fiscais relacionados devem ser agrupados semanticamente;
- valores carregados automaticamente devem informar sua origem quando relevante;
- edição manual continua possível quando a regra fiscal permitir.

### 10.3 Cards

- card padrão: borda sutil, `radius-lg`, sombra discreta;
- título, descrição curta, conteúdo e ações em regiões consistentes;
- KPI card contém um valor principal, contexto temporal e tendência;
- não transformar toda informação em card; listas densas continuam listas ou tabelas.

### 10.4 Tabelas

- cabeçalho persistente quando houver rolagem extensa;
- números alinhados à direita e com `tabular-nums`;
- texto principal + metadado secundário em vez de colunas redundantes;
- ações por linha em menu contextual;
- estado vazio explica o próximo passo;
- mobile usa lista responsiva, não tabela espremida.

### 10.5 Status fiscais

| Status técnico | Rótulo na interface | Tom |
|---|---|---|
| `AUTHORIZED` | Autorizada | Sucesso |
| `PENDING` | Aguardando processamento | Informação |
| `PROCESSING` | Processando | Informação com progresso |
| `ERROR` | Erro no processamento | Erro |
| `REJECTED` | Rejeitada | Erro |
| `CANCELED` | Cancelada | Neutro/destrutivo |

O frontend deve padronizar `CANCELED`. Não introduzir `CANCELLED` em novos contratos ou componentes.

### 10.6 Provider na interface

Para usuário operacional:

- `LOBONOTAS` → “LOBONOTAS — Ambiente Nacional”, valorizando o motor fiscal próprio e contextualizando o destino da operação;
- `PLUGNOTAS` → “PlugNotas — legado desativado” apenas em documentos históricos;
- não mostrar filtro PlugNotas em fluxos de novas operações;
- nunca oferecer sincronização, emissão, cancelamento ou download remoto pelo provider legado.

O nome LOBONOTAS não deve ser ocultado em selects, detalhes ou observabilidade. A expressão “Ambiente Nacional” descreve o ambiente fiscal, não substitui o nome do motor próprio.

## 11. Gráficos e inteligência

Ordem de cores para séries categóricas:

```text
#6CA65D, #829B7F, #C3C5B6, #2D5E80, #B45309, #735A8D
```

Regras:

- verde de marca representa a série principal, não sucesso automático;
- limite recomendado de cinco séries simultâneas;
- eixos e grades usam baixo contraste;
- tooltip sempre mostra unidade, período e valor formatado;
- gráficos precisam de resumo textual ou tabela acessível;
- evitar donut quando a comparação precisa ser precisa;
- IA e recomendações devem diferenciar fato, inferência e sugestão.

## 12. Iconografia, padrões e imagem

### 12.1 Ícones

Padronizar a interface em uma única família. A recomendação é Phosphor, peso `regular` ou `duotone` de forma controlada.

- tamanho padrão: 16 ou 20 px;
- ícone nunca substitui sozinho o rótulo de uma ação crítica;
- evitar misturar Lucide e Phosphor na mesma superfície;
- ícones de provider não são elementos de navegação principal.

### 12.2 Padrão de fibras

O padrão derivado do símbolo pode ser usado em:

- login;
- onboarding;
- empty states institucionais;
- capa de relatório;
- loading de marca.

Opacidade máxima recomendada: 8% no modo claro e 12% no modo escuro.

### 12.3 Fotografia

Quando necessária, a fotografia deve mostrar empresas, profissionais e ambientes reais do Brasil e da Amazônia urbana, evitando estética genérica de banco internacional.

## 13. Movimento

- transições de estado: 120–180 ms;
- abertura de painel/modal: 180–240 ms;
- easing padrão: `cubic-bezier(0.2, 0, 0, 1)`;
- respeitar `prefers-reduced-motion`;
- o símbolo pode ser animado apenas em loading, entrada institucional ou lançamento;
- não animar gráficos e indicadores continuamente;
- nenhum bounce contínuo em informação operacional.

## 14. Voz e microcopy

A voz da Jupati é clara, segura, direta e humana.

Preferir:

- “Revise os dados antes de emitir.”
- “A nota foi autorizada pelo Ambiente Nacional.”
- “Não foi possível concluir a transmissão. Nenhuma nova tentativa será feita sem sua confirmação.”
- “Esta emissão pertence ao histórico legado e está disponível apenas para consulta.”

Evitar:

- “Algo deu errado!”;
- “Oops”;
- “Mágica da IA”;
- promessas de automação total;
- jargão do provider em telas comuns;
- mensagens que culpem o usuário.

### 14.1 Nome das capacidades

| Evitar | Preferir |
|---|---|
| Painel de Emissão de NFSe | Operação e inteligência empresarial |
| Inteligência Fiscal IA | Insights da operação |
| Banco (ZERA) | Base Jupati |
| Sincronizar com PlugNotas | Remover ação |
| Prestador PlugNotas | Empresa prestadora |

## 15. Acessibilidade

Requisitos mínimos:

- WCAG 2.2 AA;
- contraste de 4.5:1 para texto normal e 3:1 para texto grande;
- foco visível em todos os controles;
- navegação completa por teclado;
- labels e descrições associadas a inputs;
- `aria-live` em processamento e resultado assíncrono;
- status nunca representado somente por cor;
- alvo de toque mínimo de 44 × 44 px em mobile;
- zoom de 200% sem perda de operação;
- preferência de movimento reduzido respeitada;
- ordem de tabulação igual à ordem visual.

## 16. Responsividade

| Faixa | Diretriz |
|---|---|
| `< 640 px` | Uma coluna, ações críticas fixadas com cuidado, listas no lugar de tabelas |
| `640–1023 px` | Sidebar recolhível, grids de até duas colunas |
| `1024–1439 px` | Layout operacional completo |
| `>= 1440 px` | Conteúdo centralizado, tabelas amplas e painéis auxiliares |

O produto deve continuar utilizável em smartphone, especialmente para consulta, emissão rápida, acompanhamento e tratamento de pendências.

## 17. Migração do frontend atual

### 17.1 Pontos visuais já identificados

| Local atual | Mudança esperada |
|---|---|
| `src/components/BrandLogo.tsx` | Substituir símbolo e textos ZERA por assets Jupati |
| `public/zera-logo.*` | Criar assets Jupati; manter os antigos somente durante transição controlada |
| `public/zera-mark.svg` | Substituir pelo símbolo vetorial final |
| `public/favicon.*` | Gerar favicon simplificado Jupati |
| `index.html` | Atualizar title, description, author e Open Graph |
| `src/index.css` | Aplicar tokens Jupati e remover temas visuais concorrentes |
| `src/lib/visual-theme.ts` | Migrar para um único sistema visual Jupati + light/dark |
| `src/components/AppSidebar.tsx` | Trocar “Skale IA” pela marca Jupati e revisar arquitetura |
| `src/pages/LoginPage.tsx` | Aplicar superfície institucional e novo posicionamento |
| textos “Banco (ZERA)” | Alterar para “Base Jupati” |
| textos operacionais PlugNotas | Remover; preservar apenas leitura histórica |

### 17.2 Identificadores técnicos

Não executar substituição global de `zera` por `jupati`.

Classificação:

| Tipo | Conduta |
|---|---|
| Textos visíveis e metadata | Renomear para Jupati |
| Assets de marca | Criar novos arquivos e migrar referências |
| Chaves de tema/cache não sensíveis | Migrar com leitura temporária da chave antiga |
| Eventos do browser | Aceitar evento antigo durante uma versão de transição |
| `zera_token` | Não renomear dentro da refatoração visual; tratar junto da estratégia de autenticação |
| Rotas `/nfse/*` | Preservar |
| Provider `LOBONOTAS` | Preservar |
| Provider histórico `PLUGNOTAS` | Preservar nos dados; bloquear operação |
| Test fixtures históricas | Preservar quando descrevem comportamento histórico real |

### 17.3 Migração de preferências locais

Sugestão para preferências não sensíveis:

```ts
const oldValue = localStorage.getItem('zera_visual_theme_v1');
const newValue = localStorage.getItem('jupati_theme_v1');

if (!newValue && oldValue) {
  localStorage.setItem('jupati_theme_v1', normalizeLegacyTheme(oldValue));
}
```

Remover a leitura da chave antiga após uma janela de transição definida. Não aplicar esse padrão automaticamente ao token de autenticação.

## 18. Ordem recomendada de implementação

### Fase 1 — Fundamentos

- aprovar e vetorizar símbolo/wordmark;
- gerar SVGs, PNG social e favicons;
- inserir tokens primitivos e semânticos;
- criar testes básicos de contraste e renderização da marca.

### Fase 2 — Shell

- `BrandLogo`;
- login;
- sidebar;
- header;
- metadata;
- loading, empty state e erro global.

### Fase 3 — Componentes

- botões, inputs e selects;
- cards e dialogs;
- badges e status;
- tabelas e paginação;
- toasts e confirmações.

### Fase 4 — Páginas

- dashboard;
- empresas e tomadores;
- emissão/listagem/detalhe;
- certificado;
- usuários;
- observabilidade e insights.

### Fase 5 — Limpeza e validação

- remover `classic/elegant` quando não houver mais dependências;
- revisar todas as ocorrências visíveis de ZERA e Skale;
- bloquear/remover UX operacional PlugNotas;
- testar light/dark, mobile e teclado;
- executar testes, lint e build;
- realizar revisão visual comparativa por página.

## 19. Critérios de aceite

A migração visual só está pronta quando:

- não existe ZERA ou Skale visível na interface nova;
- Jupati aparece com grafia, assinatura e área de proteção consistentes;
- o símbolo final está em vetor e funciona entre 16 px e grandes formatos;
- cores são aplicadas por tokens semânticos, sem hex disperso nos componentes;
- contrastes essenciais atendem WCAG AA;
- light e dark mantêm hierarquia e legibilidade;
- mobile permite concluir os fluxos críticos;
- `CANCELED` é o único status canônico de cancelamento no frontend;
- LOBONOTAS permanece funcional sem ser confundido com a marca do produto;
- PlugNotas aparece somente quando necessário para leitura histórica e nunca oferece ação externa;
- testes, lint e build estão verdes;
- o rebranding não altera contratos fiscais, dados históricos ou rotas públicas.

## 20. Decisões ainda pendentes

Antes de publicar a identidade, ainda precisam ser concluídos:

1. busca e decisão jurídica sobre a marca Jupati no INPI;
2. disponibilidade e aquisição dos domínios escolhidos;
3. desenho vetorial final do símbolo e do wordmark;
4. definição das variantes oficiais de logo;
5. decisão sobre o nome técnico dos repositórios e pacotes;
6. plano de transição de domínio e metadata;
7. inventário final de textos, assets e identificadores técnicos.

Até essas decisões, Jupati é a direção de produto aprovada, mas ZERA pode continuar existindo internamente onde a troca prematura causar risco técnico.

---

**JUPATI**  
Sua operação, bem conectada.  
Uma solução Muirakitan Tecnologia.
