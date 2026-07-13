# Design System - Especificação Visual para Claude Code

> Documento de referência visual extraído e sintetizado a partir de 4 interfaces de referência (apps de nutrição/IA, fitness, smart home e produtividade). Define os tokens exatos de cor, tipografia, espaçamento e efeitos visuais usados no componente `AriaDashboard`. Claude Code deve tratar estes valores como fonte da verdade ao implementar qualquer tela nova dentro desta mesma linguagem visual.

---

## 1. Paleta de cores

### 1.1 Cores primárias

| Token | Papel | HEX / valor | Uso |
|---|---|---|---|
| `base` | Fundo base | `#0B0C0E` | Fundo geral da aplicação — quase preto, com leve subtom quente (nunca preto puro `#000000`) |
| `glass` | Superfície vidro (cards principais) | `rgba(255,255,255,0.045)` | Background dos cards com efeito glassmorphism |
| `glassBorder` | Borda da superfície vidro | `rgba(255,255,255,0.09)` | Borda de 1px dos cards com glassmorphism |
| `tile` | Superfície sólida | `#17181C` | Tiles de controle, avatar, badges de ícone |
| `tileBorder` | Borda da superfície sólida | `rgba(255,255,255,0.06)` | Borda de 1px dos tiles |
| `divider` | Linha divisória | `rgba(255,255,255,0.06)` | Separadores entre itens de lista (ex: sessões) |

### 1.2 Cores de texto

| Token | HEX | Uso |
|---|---|---|
| `textPrimary` | `#F5F3EF` | Títulos, valores em destaque, nomes — off-white quente, nunca branco puro `#FFFFFF` |
| `textSecondary` | `#9A9B9F` | Subtítulos, labels de seção |
| `textMuted` | `#6B6C70` | Metadados, timestamps, texto de menor hierarquia |

### 1.3 Acentos de assinatura

| Token | HEX | Papel semântico |
|---|---|---|
| `copper` (cobre) | `#E8935F` | Acento primário — energia, foco, CTA, elemento de assinatura (anel de progresso) |
| `moss` (musgo) | `#93A87E` | Acento secundário — estado calmo/positivo, contraponto ao cobre |

**Regra de uso:** cobre e musgo nunca competem em igual intensidade na mesma tela — um deles deve dominar visualmente por seção. No anel de progresso, os dois se combinam num gradiente linear (cobre → musgo) porque ali é o único ponto da interface onde a mistura das duas cores é intencional.

### 1.4 Acentos funcionais extras (uso pontual, não repetir sem necessidade)

| HEX | Uso observado |
|---|---|
| `#8AA0C7` | Estados neutros/informativos (ex: "não perturbe", "pausa") |
| `#C98AA3` | Estado adicional de variedade em grids de controle (ex: "som") |

Estes dois só devem ser usados quando o grid de controles/categorias tiver mais itens do que cobre + musgo conseguem cobrir sem repetição — nunca como substitutos dos acentos primários.

### 1.5 Regra de opacidade para variações de cor

Para gerar fundos/realces suaves a partir de uma cor sólida (`color`), usar o próprio HEX com sufixo de alpha de 2 dígitos, em vez de criar uma nova cor:

```
${color}14   → 8%  de opacidade (fundo sutil de tile ativo)
${color}18   → 9%  de opacidade (fundo de badge de ícone em lista)
${color}22   → 13% de opacidade (fundo de badge de ícone em chip/tile)
${color}55   → 33% de opacidade (borda de tile ativo)
```

---

## 2. Tipografia e espaçamento

### 2.1 Escala tipográfica

| Classe | Tamanho | Uso |
|---|---|---|
| `text-3xl` | 30px | Métrica hero (número central do anel de progresso) |
| `text-sm` | 14px | Títulos de item, nome do usuário, saudação |
| `text-xs` | 12px | Labels, subtítulos, metadados, timestamps — é o menor tamanho usado em toda a interface, nunca ir abaixo disso |

### 2.2 Pesos de fonte

Apenas dois pesos em toda a interface — nunca introduzir um terceiro:

- `font-medium` — uso padrão para títulos de item, labels de seção, valores
- `font-semibold` — reservado exclusivamente para a métrica hero (número grande do anel de progresso), para preservar seu destaque

`tracking-tight` deve ser aplicado apenas na métrica hero, para dar densidade ao número grande.

### 2.3 Espaçamento

| Contexto | Valor |
|---|---|
| Padding interno do card hero | `p-6` (24px) |
| Padding interno dos tiles de controle | `p-4` (16px) |
| Gap entre elementos relacionados (ex: chips de estatística) | `gap-3` (12px) |
| Gap do grid de controles rápidos | `gap-3` (12px) |
| Margem entre seções da tela | `mb-6` / `mt-6` (24px) |
| Padding vertical de item de lista (sessões) | `py-3` (12px) |

### 2.4 Progressão de border-radius (hierarquia visual)

O raio de borda cresce ou diminui conforme o nível de destaque/contêiner do elemento — esta progressão é uma regra estrutural, não estética isolada:

| Nível | Classe | Valor aprox. | Elementos |
|---|---|---|---|
| 1 — Circular/pill | `rounded-full` | 9999px | Avatar, badges de ícone circulares, dots de status, barra de navegação inferior, botão primário da nav |
| 2 — Contêiner principal | `rounded-3xl` | 24px | Card hero (anel de progresso), card de lista de sessões |
| 3 — Contêiner secundário | `rounded-2xl` | 16px | Tiles de controle rápido |
| 4 — Elemento interno | `rounded-xl` | 12px | Badges de ícone quadrados dentro de tiles/itens de lista |

Nunca pular um nível da hierarquia (ex: usar `rounded-xl` num card principal) — isso quebra a leitura de profundidade que a progressão cria.

---

## 3. Efeitos visuais

### 3.1 Glassmorphism (superfícies "vidro")

Aplicado nos cards principais (hero, lista de sessões, barra de navegação). Combinação exata de três propriedades — as três são obrigatórias juntas, nenhuma sozinha produz o efeito:

```css
background-color: rgba(255, 255, 255, 0.045);
border: 1px solid rgba(255, 255, 255, 0.09);
backdrop-filter: blur(20px);
```

**Importante:** isto não é um "vidro falso" feito só com opacidade — o `backdrop-filter: blur(20px)` é o que garante a profundidade real, desfocando o que estiver atrás do card. Sem ele, o card fica com aparência de superfície sólida translúcida, não de vidro.

### 3.2 Halo/glow ambiente (fundo da tela)

Dois blobs circulares desfocados, posicionados nos cantos opostos da tela, atrás de todo o conteúdo:

| Propriedade | Blob 1 (cobre) | Blob 2 (musgo) |
|---|---|---|
| Cor | `#E8935F` | `#93A87E` |
| Tamanho | 320px × 320px | 280px × 280px |
| Posição | `top: -60px; left: -60px` | `bottom: -40px; right: -40px` |
| Desfoque | `blur-3xl` | `blur-3xl` |
| Opacidade | `0.25` | `0.20` |
| `pointer-events` | `none` (não bloquear interação) | `none` |

Este halo é o que dá a sensação de profundidade/atmosfera ao fundo escuro, no lugar de uma foto de background — mantém a tela limpa mas evita que o preto fique "morto"/chapado.

### 3.3 Anel de progresso com gradiente (elemento de assinatura)

Este é o único elemento verdadeiramente vibrante da interface — todo o resto do sistema é deliberadamente contido para que este se destaque.

**Estrutura (SVG):**
1. Círculo de fundo (trilho): `stroke: rgba(255,255,255,0.08)`, sem preenchimento.
2. Círculo de progresso: `stroke: url(#ringGradient)`, `stroke-linecap: round`, controlado por `stroke-dasharray` / `stroke-dashoffset` proporcional à porcentagem.
3. Gradiente linear (`<linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">`): stop em `0%` = `#E8935F` (cobre), stop em `100%` = `#93A87E` (musgo).
4. SVG inteiro rotacionado `-90deg` para o progresso começar no topo do círculo.

**Parâmetros:**
```
size (diâmetro total): 148px
strokeWidth: 10px
radius: (size - strokeWidth) / 2
circumference: 2 * π * radius
strokeDashoffset: circumference * (1 - percentual / 100)
```

**Halo local (atrás do próprio anel, distinto do halo de fundo da seção 3.2):**
```
tamanho: 70% do diâmetro do anel
cor: #E8935F (cobre)
desfoque: blur-2xl
opacidade: 0.40
```

**Animação:** a transição do progresso deve usar `transition: all 700ms ease-out` no `stroke-dashoffset`, para o anel "preencher" suavemente ao carregar ou ao mudar de valor — nunca um salto instantâneo.

**Conteúdo central:** número grande (`text-3xl font-semibold tracking-tight`, cor `textPrimary`) sobreposto ao centro do anel, com um label pequeno (`text-xs`, cor `textSecondary`) logo abaixo.

---

*Fim da especificação de design system. Este documento deve ser lido em conjunto com `contexto-claude-code.md` quando ambos existirem no mesmo projeto — este cobre exclusivamente tokens visuais, o outro cobre lógica de negócio e arquitetura de dados.*
