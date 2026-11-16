# Sistema de design · Ponto Neutro

Conceito: **painel de instrumentos de um carro esportivo**. Tema escuro como padrão, leitura técnica e sóbria, um único acento forte. Tudo nasce dos tokens em [`src/app/globals.css`](../src/app/globals.css); nenhuma tela usa cor, raio ou duração solta.

## Cores

### Superfícies e texto

| Token | Valor | Uso | Contraste medido |
|---|---|---|---|
| `--background` | `#0E0F11` | fundo da página | — |
| `--surface` | `#15171A` | nível 1: cartões, barra lateral, tabelas | — |
| `--surface-2` | `#1C1F23` | nível 2: campos, hover, popover, menu "Mais" | — |
| `--border` | `#2A2E33` | divisórias decorativas | — |
| `--input` | `#6B727C` | borda de campos e botões "outline" | 3,4:1 no nível 2 (elemento de interface ≥ 3:1) |
| `--foreground` | `#F2F3F5` | texto principal | 17,3:1 no fundo · 14,9:1 no nível 2 |
| `--muted-foreground` | `#A6ACB5` | texto secundário | 8,4:1 no fundo · 7,2:1 no nível 2 |

Profundidade vem do **contraste entre superfícies**, não de sombras.

### Acento: laranja-sinal

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#FF6A1A` | ação principal, item ativo do menu, foco, dado em destaque (total, ponteiro, barras de série única) |
| `--primary-foreground` | `#0E0F11` | texto sobre o laranja: **6,7:1** (branco daria 2,9:1 e não passa) |
| `--accent-soft` | laranja 14% sobre o nível 1 | fundo do item ativo do menu e da coluna "hoje" |

Regra: o laranja aparece **uma vez por região** de atenção. Se tudo é laranja, nada é.

### Status

| Situação | Cor | Fundo suave | Texto no fundo suave |
|---|---|---|---|
| Sucesso (aprovado, concluído, entregue) | `--success` `#2FBF71` | `--success-soft` | 5,8:1 |
| Atenção (em serviço) | `--warning` `#F5B731` | `--warning-soft` | 7,2:1 |
| Erro (recusado, cancelado) | `--danger` `#F0505C` | `--danger-soft` | texto usa `--danger-fg` `#F67A84`: 5,7:1 (o `#F0505C` dava 4,3:1) |
| Informação (enviado, confirmado, pronto) | `--info` `#4C9AFF` | `--info-soft` | 5,0:1 |

Selos sempre trazem **ponto + palavra**: a cor nunca é a única pista.

### Profissionais

Cada profissional tem cor fixa, atribuída pela ordem alfabética entre quem executa serviços (`src/lib/professionals.ts`). A mesma cor aparece na agenda, no painel e nos filtros.

| Token | Valor |
|---|---|
| `--pro-1` | `#199E70` |
| `--pro-2` | `#3987E5` |
| `--pro-3` | `#C98500` |
| `--pro-4` | `#9085E9` |
| `--pro-5` | `#E66767` (reserva) |

Validado com o verificador de paletas para daltonismo: pares vizinhos com ΔE ≥ 19,6 (deuteranopia/protanopia) e ≥ 20,9 em visão normal. Com 4 ou mais cores lado a lado nenhuma paleta separa todos os pares para daltônicos, por isso **cada bloco da agenda mostra as iniciais do profissional** e os filtros mostram o nome.

## Tipografia

| Papel | Fonte | Onde |
|---|---|---|
| Títulos, números grandes, rótulos técnicos | **Barlow Condensed** (500–700) | `font-display`, títulos de página em caixa alta, métricas do painel, `.eyebrow` |
| Corpo | **Geist** | todo texto corrido e controles |
| Placas e códigos | **JetBrains Mono** | `.plate`, horários da grade, ORC-0001 |

Escala (nomes padrão do Tailwind, para o merge de classes reconhecer):

| Classe | Tamanho | Uso |
|---|---|---|
| `text-xs` | 12px | **só** rótulos auxiliares (eixos, cabeçalho de tabela, legenda) |
| `text-sm` | 14px | corpo (mínimo) |
| `text-base` | 16px | campos no celular (evita zoom do iOS) |
| `text-2xl` | 24px | título de seção e de diálogo |
| `text-4xl` | 36px | título de página |
| `text-5xl` | 44px | números do painel |

## Forma, espaço e movimento

- **Raios:** 10px (`rounded-lg`, botões e campos), 12px (`rounded-xl`, cartões), 14px (`rounded-2xl`, diálogos).
- **Espaço:** escala de 4px do Tailwind (`gap-1` = 4px, `p-5` = 20px…).
- **Bordas:** 1px; a barra lateral do item ativo e o filete do bloco da agenda usam 2–3px.
- **Movimento:** 150ms (hover, cores) e 200–250ms (entrada de popover, números do painel). `prefers-reduced-motion` desliga animações e transições no CSS global, e o contador do painel mostra o valor direto.
- **Detalhes de tema:** grade tracejada nos gráficos (como marcações de mostrador), régua de meia hora na agenda, mostrador com ponteiro nos estados vazio, 404 e erro.

## Componentes

| Componente | Arquivo | Regras |
|---|---|---|
| Botão | `components/ui/button.tsx` | variantes `default` (laranja), `outline`, `secondary`, `ghost`, `destructive`, `link`. Altura 44px no celular, 36–40px a partir de 640px. `buttonVariants` sempre passa pelo merge para funcionar em links. |
| Campo, select, textarea | `components/ui/input.tsx` (`fieldClass`), `components/form-field.tsx` | nível 2, borda `--input`, foco laranja; rótulo sempre visível; "(opcional)" quando não é obrigatório; erro abaixo, ligado por `aria-describedby`. |
| Selo de situação | `components/status-badge.tsx` | tons `neutral`, `info`, `progress`, `success`, `danger`. |
| Cartão | `components/ui/card.tsx` | `Card` + `CardHeader` (rótulo `.eyebrow` + ação à direita). |
| Tabela | `components/ui/table.tsx` | cabeçalho fixo em `.eyebrow`, linhas com hover; no celular vira lista de cartões. |
| Estado vazio | `components/empty-state.tsx` | mostrador + título + texto + ação de recuperação. |
| Skeleton | `components/ui/skeleton.tsx` | blocos do nível 2 pulsando (sem pulso com movimento reduzido). |
| Popover / diálogo | `app/(app)/agenda/agenda-grid.tsx` | `<dialog>` nativo: foco preso, Esc fecha, clique fora fecha. |
| Abas / segmentado | agenda (Semana/Dia), orçamentos (situação) | links com `aria-current`; estado na URL. |
| Linha de itens editável | `app/(app)/orcamentos/quote-form.tsx` | grade no desktop, cartão por item no celular; totais recalculados ao digitar. |
| Linha do tempo de etapas | `app/(app)/ordens/[id]/page.tsx`, painel | 4 etapas; atual em laranja, concluídas em cinza claro. |
| Navegação | `components/app-nav.tsx` | barra lateral ≥ 1024px; barra inferior + "Mais" no celular. |
| Logotipo | `components/logo.tsx` | `LogoMark` (símbolo) e `Logo` (horizontal, opcional com slogan). Mesmas formas em `app/icon.svg`, `app/apple-icon.tsx` e no PDF. |

## Logotipo

Padrão em H do câmbio (três vias e a travessa) com o **ponto neutro** no centro em laranja, num quadro grafite. O quadro escuro faz o símbolo funcionar igual no tema escuro, em fundo claro (PDF) e a 16px (favicon). Wordmark em Barlow Condensed, caixa alta, "NEUTRO" no acento.

## PDF do orçamento

Fundo branco. O laranja-sinal fica nos elementos gráficos (ponto do logo, filetes); texto em laranja usa `#C2410C` (5,2:1 no branco). Mesmas fontes, registradas a partir dos pacotes `@fontsource`.

## Decisões não especificadas no pedido

- **Textos dos botões em caixa de frase** ("Novo agendamento"), não Title Case: é o padrão do português.
- **Toast não foi criado:** nenhum fluxo atual precisa; mensagens de sucesso e erro aparecem junto da ação (botão, formulário), onde o leitor de tela já anuncia.
- **"Serviços" fica no menu:** a rota já existia; no celular está em "Mais".
- **Agenda no celular é sempre lista por horário**, inclusive na visão "Semana" (agrupada por dia).
- **Linha da hora atual** é calculada no navegador e atualizada a cada minuto, para não divergir do horário do servidor.
- **Indicadores sem série natural** (taxa de aprovação, veículos na oficina) não têm minigráfico; mostram a variação ou o detalhe em texto.
- **Variação de "agendamentos hoje"** compara com o mesmo dia da semana anterior (segunda com segunda), não com o mês.
- **Gráficos ocultos para leitor de tela**, com os mesmos dados em tabela ou lista de texto.
- **Cabeçalho do celular só com a marca:** a navegação fica embaixo, ao alcance do polegar.
