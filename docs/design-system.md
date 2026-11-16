# Sistema de design · Ponto Neutro

Tema escuro sobre preto, leitura técnica e sóbria, **um único acento**. A hierarquia vem de tipografia, espaçamento, alinhamento e contraste; **nada de decoração**. Tudo nasce dos tokens em [`src/app/globals.css`](../src/app/globals.css); nenhuma tela usa cor, raio ou duração solta.

## Cores

### Superfícies e texto

| Token | Valor | Uso | Contraste medido |
|---|---|---|---|
| `--background` | `#000000` | fundo da página | — |
| `--surface` | `#0A0A0A` | nível 1: cartões, barra lateral, tabelas | — |
| `--surface-2` | `#151515` | nível 2: item ativo, hover, popover, campos | — |
| `--border` | `#262626` | divisórias | — |
| `--border-strong` | `#3D3D3D` | divisória de destaque (popover, hover de cartão) | — |
| `--input` | `#6B6B6B` | borda de campos e botões "outline" | 3,4:1 no nível 2 |
| `--foreground` | `#FFFFFF` | texto principal | 21:1 no fundo |
| `--muted-foreground` | `#A8A8A8` | texto secundário | 8,8:1 no fundo · 8,3:1 no nível 1 · 7,7:1 no nível 2 |

Profundidade vem do **contraste entre superfícies**, não de sombras.

### Acento

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#FF422A` | ver regras abaixo · 5,7:1 como dado no nível 1 |
| `--primary-foreground` | `#000000` | texto sobre o acento: **6,1:1**. Branco daria 3,5:1 e **nunca** é usado. |
| `--accent-fg` | `#FF7A66` | acento como texto sobre fundo tingido: 6,9:1 |
| `--accent-soft` | acento 14% sobre o nível 1 | fundo do item ativo do menu |

**Onde o acento aparece (e só aí):**
1. Botões primários (uma ação principal por tela).
2. Item ativo do menu (fundo tingido, filete e ícone).
3. Anel de foco.
4. Série principal dos gráficos (barras de faturamento, minigráficos, ranking) e a linha da hora atual na agenda.
5. Dado de destaque (o total do orçamento).

**Onde nunca aparece:** códigos como ORC-0144 (fonte mono, texto principal), links comuns (branco sublinhado), bordas decorativas, títulos, cabeçalho do dia de hoje.

### Situações

Sempre **ponto colorido + palavra**; a cor nunca é a única pista.

| Situação | Cor | Texto no fundo suave |
|---|---|---|
| Concluído, aprovado, entregue | `--success` `#2FBF71` | 6,6:1 |
| Confirmado, enviado, pronto para retirada | `--info` `#38BDF8` | 7,2:1 |
| Rascunho, agendado, aguardando | `--muted-foreground` `#A8A8A8` | 6,6:1 |
| Atenção, em serviço | `--warning` `#F5B731` | 8,3:1 |
| Recusado, cancelado, erro | `--danger` `#FF8FA3` | 7,2:1 · rosa de propósito, para não se confundir com o acento |

### Profissionais

Cor fixa por profissional (ordem alfabética entre quem executa serviços, `src/lib/professionals.ts`), igual em agenda, painel e filtros. Mantidas da versão anterior:

| Token | Valor |
|---|---|
| `--pro-1` | `#199E70` |
| `--pro-2` | `#3987E5` |
| `--pro-3` | `#C98500` |
| `--pro-4` | `#9085E9` |
| `--pro-5` | `#E66767` (reserva) |

Pares vizinhos validados para daltonismo (ΔE ≥ 19,6). Texto branco sobre o bloco tingido: ≥ 14,8:1.

## Tipografia

| Papel | Fonte | Onde |
|---|---|---|
| Títulos, números grandes, rótulos técnicos | **Barlow Condensed** (500–700) | `font-display`, títulos de página em caixa alta, métricas, `.eyebrow` |
| Corpo | **Geist** | texto corrido e controles |
| Placas e códigos | **JetBrains Mono** | `.plate`, horários da grade, ORC-0001 |

| Classe | Tamanho | Uso |
|---|---|---|
| `text-xs` | 12px | **só** rótulos auxiliares (eixos, cabeçalho de tabela) |
| `text-sm` | 14px | corpo (mínimo) |
| `text-base` | 16px | campos no celular (evita zoom do iOS) |
| `text-2xl` | 24px | título de seção |
| `text-4xl` | 36px | título de página; números do painel no celular |
| `text-5xl` | 44px | números do painel a partir de 640px |

## Forma, espaço e movimento

- **Raios:** 10px (botões, campos), 12px (cartões, popover), 14px (menu "Mais").
- **Espaço:** escala de 4px do Tailwind.
- **Movimento:** 150ms (hover, cor) e 200–250ms (entrada de popover, números do painel). `prefers-reduced-motion` desliga tudo.

## Sem decoração

- Proibido: formas, blobs, círculos, ondas, grades ou padrões de fundo, partículas, ilustrações abstratas, ícones decorativos, degradês.
- Permitido: gráficos, selos de situação, ícones de **ação** (ligar, WhatsApp, PDF, menu), a marca, e a régua de horas da agenda (é a escala de tempo).
- Estados vazio, de erro e 404: título, uma frase e uma ação. Sem ilustração.

## Componentes

| Componente | Arquivo | Regras |
|---|---|---|
| Botão | `components/ui/button.tsx` | `default` (acento, texto preto), `outline`, `secondary`, `ghost`, `destructive`, `link`. 44px no celular. |
| Campo, select, textarea | `components/ui/input.tsx`, `components/form-field.tsx` | nível 2, borda `--input`; rótulo sempre visível; erro abaixo, ligado por `aria-describedby`. |
| Selo de situação | `components/status-badge.tsx` | ponto + palavra sobre fundo suave. |
| Cartão | `components/ui/card.tsx` | `Card` + `CardHeader` (rótulo `.eyebrow` + ação). |
| Tabela | `components/ui/table.tsx` | cabeçalho fixo; abaixo de 900px (clientes) e 768px (orçamentos) vira cartões. |
| Estado vazio | `components/empty-state.tsx` | só texto e ação. |
| Popover da agenda | `app/(app)/agenda/agenda-grid.tsx` | abre no clique ou ao focar o bloco pelo teclado; Enter leva o foco para dentro; Esc fecha e devolve o foco. |
| Navegação | `components/app-nav.tsx` | barra lateral ≥ 1024px; barra inferior + "Mais" no celular. |
| Logotipo | `components/logo.tsx` | quadro `#151515`, H branco, ponto `#FF422A`. Mesmas formas no favicon, no ícone do app e no PDF. |

## PDF do orçamento

Fundo branco. Acento `#E0301A` (4,6:1 no branco) nos filetes e no total; texto preto e cinza `#5C5C5C` (6,7:1). O ponto do logotipo mantém `#FF422A`, a cor da marca. Mesmas fontes, registradas a partir dos pacotes `@fontsource`.

## Decisões não especificadas no pedido

- **Borda de campos `#6B6B6B`, não `#3D3D3D`:** a "borda forte" daria 1,7:1 sobre o nível 2, abaixo do mínimo de 3:1 para elementos de interface. `#262626` e `#3D3D3D` ficam para divisórias.
- **Linha da hora atual no acento:** é dado de destaque (onde estamos no dia).
- **Dia de hoje na agenda sem acento:** cabeçalho e coluna com o nível 2, mais o rótulo "Hoje".
- **Etapa atual da OS em branco**, etapas concluídas em cinza: o acento fica reservado às ações.
- **Avatares de iniciais removidos** (clientes e barra lateral): repetiam o nome, sem informação nova.
- **Ícones das linhas do histórico removidos:** o texto já diz "Agendamento" ou "Orçamento".
- **Visão de semana sem iniciais no bloco:** o pedido limita o bloco a horário e serviço; o profissional aparece no popover, no filtro e na visão de dia (uma coluna por profissional).
- **Semana mais larga que a tela:** a grade rola para o lado dentro do próprio cartão; a página não rola.
- **Orçamentos entre 768 e 1024px:** a coluna Data é escondida para nada ser cortado; ela aparece no detalhe do orçamento.
- **Clientes abaixo de 900px:** cartões em duas colunas no tablet, uma no celular.
- **Minigráficos em todos os indicadores:** taxa de aprovação por semana e veículos na oficina por dia, para os cartões terem a mesma altura sem espaço vazio.
- **Toast não foi criado:** nenhum fluxo precisa; mensagens aparecem junto da ação.
- **Textos dos botões em caixa de frase** ("Novo agendamento"), padrão do português.
