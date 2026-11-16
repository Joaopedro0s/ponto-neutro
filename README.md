# Ponto Neutro · Gestão para estéticas e oficinas automotivas

> **Do motor ao brilho, com hora marcada.** Agenda, orçamentos e ordens de serviço num só painel, no lugar do caderno e das conversas soltas no WhatsApp.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green)
![Deploy](https://img.shields.io/badge/deploy-pendente-lightgrey)
<!-- Depois do deploy, troque o selo acima por: ![Deploy](https://img.shields.io/github/deployments/Joaopedro0s/ponto-neutro/production?label=vercel&logo=vercel) -->

## Demonstração

**Link:** _em breve_ (veja o [quadro de pendências](#quadro-de-pendências)).

Na tela de entrada, clique em **Entrar como demonstração**. Não é preciso cadastro. Se preferir digitar, use `demo@example.com` e a senha `demo1234`. Tudo o que aparece é fictício e pode ser alterado à vontade.

## Capturas de tela

| Entrada | Painel |
|---|---|
| ![Tela de entrada com logotipo, slogan e formulário](docs/screenshots/login.png) | ![Painel com indicadores, faturamento e veículos em serviço](docs/screenshots/dashboard.png) |
| **Agenda da semana** | **Clientes** |
| ![Agenda em grade de horas, colorida por profissional](docs/screenshots/agenda-semana.png) | ![Tabela de clientes com placas e total gasto](docs/screenshots/clientes.png) |
| **Orçamento** | **PDF do orçamento** |
| ![Orçamento com itens e total](docs/screenshots/orcamento.png) | ![PDF do orçamento com a identidade da empresa](docs/screenshots/orcamento-pdf.png) |

**No celular (390px):**

| Painel | Agenda do dia | Orçamentos |
|---|---|---|
| ![Painel no celular](docs/screenshots/dashboard-celular.png) | ![Agenda do dia no celular](docs/screenshots/agenda-dia-celular.png) | ![Lista de orçamentos no celular](docs/screenshots/orcamentos-celular.png) |

**Antes e depois do redesenho:**

| Antes | Depois |
|---|---|
| ![Agenda antes: cartões apertados](docs/screenshots/antes/agenda-semana.png) | ![Agenda depois: grade de horas](docs/screenshots/agenda-semana.png) |

Todas as telas, em 1440px e 390px, estão em [`docs/screenshots`](docs/screenshots) (as versões anteriores ao redesenho ficam em [`docs/screenshots/antes`](docs/screenshots/antes)). Elas são geradas por `npm run qa -- --capturas` (veja [Qualidade](#qualidade)).

### Quadro de pendências

| Item | Situação |
|---|---|
| Capturas com a paleta nova: todas as telas em 1440px e 390px, PDF e antes/depois | ✅ Feitas (dados do seed) |
| Publicar na Vercel e colocar o link da demonstração acima | ⏳ Pendente |
| Trocar o selo "deploy pendente" pelo selo da Vercel | ⏳ Pendente |
| Refazer as capturas a partir da versão publicada (o link do WhatsApp passa a mostrar o domínio real) | ⏳ Pendente |
| Preencher o nome na licença e os contatos de LinkedIn e e-mail no fim deste README | ⏳ Pendente |

## Sobre o projeto

Pequenas estéticas e oficinas costumam controlar a agenda num caderno e fechar orçamentos por mensagem. O resultado é conhecido: dois carros marcados no mesmo horário, orçamento que ninguém lembra se foi aprovado, cliente ligando para saber se o carro está pronto e nenhuma visão de quanto se faturou no mês.

Este sistema reúne essas pontas:

- **Agenda** que não deixa marcar o mesmo profissional em dois serviços ao mesmo tempo.
- **Orçamento** montado a partir do catálogo, enviado em PDF pelo WhatsApp e aprovado com um clique.
- **Ordem de serviço** criada na aprovação, acompanhada até a entrega.
- **Painel** com faturamento, taxa de aprovação e o que está acontecendo hoje.

É um projeto de portfólio: a empresa **Ponto Neutro**, a equipe, os clientes e os valores são inventados e servem para simular uma estética em funcionamento.

## Funcionalidades

**Acesso**
- Entrada com e-mail e senha, ou pelo botão **Entrar como demonstração**.
- Sessão guardada num cookie protegido; todas as páginas e ações conferem a sessão no servidor.

**Clientes e veículos**
- Cadastro de clientes (nome, telefone, e-mail, observações) e de veículos (placa Mercosul ou antiga, modelo, cor, ano).
- Busca única por nome, e-mail, final do telefone ou placa.
- **Histórico por placa**: atendimentos, orçamentos, OS e total gasto, numa linha do tempo.
- Atalhos para ligar, chamar no WhatsApp, agendar e orçar a partir da ficha.
- Exclusão bloqueada para quem tem histórico, para não perder registros.

**Agenda**
- Visão da semana (um dia por coluna) e do dia (uma coluna por profissional).
- Criar, editar, mudar a situação (agendado, confirmado, concluído, cancelado) e cancelar.
- O término é calculado pela duração do serviço no catálogo e precisa caber no expediente.
- **Sem conflito de horário** para o mesmo profissional, mesmo com duas pessoas salvando ao mesmo tempo.

**Orçamentos**
- Itens de peças e mão de obra, com quantidade (aceita decimais), valor unitário, desconto em R$ e total calculado na hora.
- Situações: rascunho → enviado → aprovado ou recusado.
- **PDF** com a identidade da empresa e **link para enviar pelo WhatsApp**. O cliente abre o PDF sem login.
- **Aprovar gera a ordem de serviço** automaticamente.

**Ordens de serviço**
- Quadro com as etapas **aguardando → em serviço → pronto para retirada → entregue**, com o horário de cada mudança.
- Troca de responsável e aviso ao cliente pelo WhatsApp quando o carro fica pronto.

**Painel**
- Faturamento do mês comparado ao mesmo período do mês anterior.
- Taxa de aprovação de orçamentos (últimos 30 dias).
- Faturamento por semana e serviços mais vendidos, em gráficos.
- Agenda de hoje e veículos em serviço.

**Catálogo de serviços**
- Preço de mão de obra e duração estimada por serviço, por categoria (estética, mecânica, funilaria).
- Serviços são desativados em vez de excluídos, para não quebrar orçamentos antigos.

## Tecnologias

| Tecnologia | Para quê | Por que esta |
|---|---|---|
| **Next.js 16** (App Router) | Páginas e regras de negócio no mesmo projeto | As telas são montadas no servidor, já com os dados, e as ações dos formulários (*Server Actions*) rodam lá também, sem uma API separada para manter. |
| **TypeScript** | Linguagem | Os tipos pegam erros antes de rodar, inclusive nos dados vindos do banco. |
| **Tailwind CSS 4 + shadcn/ui** | Visual | Componentes acessíveis prontos, com tokens próprios (cores, fontes, raios e movimento) documentados em `docs/design-system.md`. |
| **Prisma 7 + PostgreSQL** | Banco de dados | O Prisma gera consultas tipadas a partir do modelo. PostgreSQL roda em Neon ou Supabase, compatíveis com a Vercel. |
| **Zod** | Validação | Todo formulário é validado no servidor, com mensagens em português. |
| **@react-pdf/renderer** | PDF do orçamento | O PDF é desenhado com componentes React e gerado no servidor, sem precisar de um navegador. |
| **Recharts** | Gráficos do painel | Gráficos em React, simples de manter na paleta da marca. |
| **Node test runner + Playwright + axe** | Qualidade | Testes das contas e datas, e auditoria de acessibilidade das telas. |

## Estrutura e modelo de dados

```
prisma/
  schema.prisma        modelo de dados
  migrations/          histórico de mudanças no banco
  seed.ts              dados fictícios (um comando popula ou reseta)
scripts/qa.mjs         auditoria de acessibilidade e capturas de tela
docs/screenshots/      imagens usadas neste README
src/
  app/
    login/             tela de entrada e ações de login
    (app)/             área protegida: painel, agenda, orcamentos, ordens, clientes, veiculos, servicos
    compartilhar/      link público do PDF do orçamento
  components/          componentes reaproveitados (campos, botões, cabeçalhos, logotipo)
  lib/                 regras e utilidades: sessão, datas no fuso de SP, contas do orçamento, PDF, painel
```

```mermaid
erDiagram
  User ||--o{ Session : "tem"
  Customer ||--o{ Vehicle : "possui"
  Customer ||--o{ Appointment : "agenda"
  Customer ||--o{ Quote : "recebe"
  Vehicle ||--o{ Appointment : "é atendido em"
  Vehicle ||--o{ Quote : "é orçado em"
  Vehicle ||--o{ WorkOrder : "passa por"
  Service ||--o{ Appointment : "é agendado em"
  Service |o--o{ QuoteItem : "origina"
  Professional ||--o{ Appointment : "executa"
  Professional |o--o{ WorkOrder : "responde por"
  Quote ||--|{ QuoteItem : "contém"
  Quote ||--o| WorkOrder : "aprovado gera"

  Appointment { datetime startsAt datetime endsAt enum status }
  Quote { int number enum status decimal discount decimal total uuid shareToken }
  QuoteItem { enum kind string description decimal quantity decimal unitPrice }
  WorkOrder { int number enum status datetime startedAt datetime readyAt datetime deliveredAt }
  Service { string name enum category decimal price int durationMinutes bool active }
```

## Como rodar localmente

**Pré-requisitos:** Node.js 20 ou superior. Não é preciso instalar PostgreSQL nem Docker: o Prisma sobe um banco local.

```bash
git clone https://github.com/Joaopedro0s/ponto-neutro.git
cd ponto-neutro
npm install            # instala as dependências e gera o cliente do Prisma
npm run db:dev         # sobe o PostgreSQL local em segundo plano
cp .env.example .env   # as portas padrão do passo anterior já estão no exemplo
npm run db:migrate     # cria as tabelas
npm run db:seed        # popula (ou reseta) os dados fictícios
npm run dev            # abre em http://localhost:3000
```

Variáveis do `.env` (o modelo está em [`.env.example`](.env.example)):

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL. Qualquer provedor serve. |
| `SHADOW_DATABASE_URL` | Banco auxiliar usado só por `npm run db:migrate` no ambiente local. |
| `DATABASE_POOL_MAX` | Só para o banco local do `prisma dev`, que atende uma conexão por vez. Não defina em produção. |

As datas do seed são relativas ao dia em que ele roda. Rodar `npm run db:seed` de novo "atualiza" a demonstração para os últimos 3 meses.

### Deploy na Vercel

1. Crie um banco PostgreSQL gratuito no [Neon](https://neon.tech) ou no [Supabase](https://supabase.com). Pela integração da Vercel com o Neon, `DATABASE_URL` (com pooler) e `DATABASE_URL_UNPOOLED` (conexão direta) já são criadas.
2. Na Vercel, importe o repositório e confira essas variáveis em Production e Preview. No Supabase, use `DATABASE_URL` e `DIRECT_URL`. Não use `SHADOW_DATABASE_URL` nem `DATABASE_POOL_MAX` em produção.
3. Publique. O script `vercel-build` faz, nesta ordem:
   - `prisma migrate deploy`: aplica as migrações;
   - `tsx prisma/seed-if-empty.ts`: popula a demonstração **só se o banco estiver vazio**;
   - `next build`: gera o site.

   Migrações e seed usam a conexão direta (`DIRECT_URL` ou `DATABASE_URL_UNPOOLED`) quando ela existe; o app usa `DATABASE_URL`.
4. Coloque o link no topo deste README e marque o [quadro de pendências](#quadro-de-pendências).

**Seed automático, só em banco vazio.** O `seed-if-empty` confere usuários, profissionais, serviços, clientes, agendamentos e orçamentos. Se qualquer uma dessas tabelas tiver registros, imprime `Seed ignorado: banco já tem dados` e não altera nada. Por isso os deploys seguintes nunca apagam o que foi criado na demonstração. Se der erro, o build falha (código de saída diferente de 0).

**Resetar os dados de demonstração.** O `npm run db:seed` é destrutivo: apaga todas as tabelas (`TRUNCATE`) e recria a demonstração com datas dos últimos 3 meses a partir de hoje. Para rodar no banco de produção, a partir do seu computador:

```bash
DATABASE_URL="url-direta-do-banco-de-producao" npm run db:seed
```

Use a URL direta (o valor de `DATABASE_URL_UNPOOLED` ou `DIRECT_URL`). Não há reset automático: os dados só mudam quando alguém roda esse comando ou usa o sistema.

### Qualidade

```bash
npm test                    # contas do orçamento, datas, fuso, placas, telefones e senhas
npm run lint                # padrões de código
npm run typecheck           # tipos
npm run qa                  # com o app rodando: acessibilidade (WCAG 2.1 AA) e rolagem lateral em 56 telas (1440, 1024, 768 e 390px)
npm run qa -- --capturas    # o mesmo, salvando as capturas em docs/screenshots
```

O `qa` usa o Edge instalado no computador. Para usar o Chrome, rode com `QA_BROWSER=chrome`.

## Decisões de design e aprendizados

**Produto e interface** (detalhes em [`docs/design-system.md`](docs/design-system.md))
- **Preto com um único acento**: fundo #000000, superfícies em dois níveis e um vermelho-laranja (#FF422A) usado só em botão primário, item ativo do menu, anel de foco, série principal dos gráficos e dado de destaque. Códigos (ORC-0144), links e bordas ficam em branco ou cinza.
- **Sem decoração**: nenhuma forma, grade de fundo ou ilustração. Todo elemento gráfico carrega informação (gráfico, situação, ação) ou é a marca; a hierarquia vem de tipografia, espaçamento e contraste. Estados vazios e de erro são texto e uma ação.
- **Tipografia de sinalização**: Barlow Condensed em títulos e números, Geist no corpo e JetBrains Mono em placas e códigos. O corpo nunca fica abaixo de 14px.
- **Marca**: o "H" do câmbio com o ponto neutro no acento, num quadro escuro que funciona no tema escuro, no PDF claro e a 16px no favicon.
- **Situações com cores próprias**: recusado e cancelado em rosa (#FF8FA3), de propósito, para não se confundir com o acento. Sempre ponto colorido mais a palavra.
- **Cor por profissional**: cada um tem uma cor fixa em toda a interface; a ordem foi validada para daltonismo.
- **Agenda**: a visão padrão é o dia, com uma coluna por profissional e eixo de horas. A semana garante largura mínima por faixa, mostra só horário e serviço e abre os detalhes num popover ao clicar ou ao focar pelo teclado. No celular, lista do dia.
- **Larguras médias**: clientes viram cartões abaixo de 900px e orçamentos abaixo de 768px; na faixa de 768 a 1024px a tabela de orçamentos esconde a data para nada ser cortado.
- **Contraste medido, não estimado**: texto ≥ 4,5:1 e bordas de campos ≥ 3:1. Por isso o texto sobre o acento é preto (branco daria 3,5:1).
- **Acessibilidade**: foco visível em tudo, alvos de toque de 44px no celular, gráficos com os mesmos dados em tabela para leitores de tela e animações curtas que somem com "reduzir movimento". A auditoria automática passa sem apontamentos em 56 telas (14 telas em 1440, 1024, 768 e 390px).
- **Mensagens em português em todo lugar**, inclusive as de validação padrão.

**Regras de negócio**
- **Conflito de horário garantido no banco**: a checagem e a gravação rodam numa transação `Serializable`, então dois salvamentos simultâneos não ocupam o mesmo horário. Um horário que encosta no fim de outro (09:00–10:00 e 10:00–11:00) não é conflito.
- **Faturamento = OS entregues**: o dinheiro entra quando o carro é retirado. O comparativo usa o mesmo trecho do mês anterior (de 1 a 16 de outubro contra 1 a 16 de novembro), para não comparar meio mês com um mês inteiro.
- **Fluxo do orçamento**: rascunho → enviado → aprovado ou recusado. Cada passagem é conferida no servidor, e aprovar abre a OS na mesma transação.
- **Valores em centavos**: subtotal, desconto e total são calculados em números inteiros, com a mesma função no navegador (prévia) e no servidor (valor gravado).
- **Fuso fixo de São Paulo**: a Vercel roda em UTC, então todas as datas são convertidas explicitamente.
- **Exclusão protegida**: clientes e veículos com histórico não podem ser excluídos, e serviços do catálogo são desativados em vez de apagados.

**Técnica**
- **Sessão própria em vez de biblioteca**: token aleatório em cookie protegido, só o hash no banco e senha com `scrypt`, nativo do Node. É simples de entender e não depende de serviço externo.
- **Link público do PDF por token**: cada orçamento tem um UUID aleatório, e é esse link que vai pelo WhatsApp. Quem tem o link vê aquele orçamento, e só ele.
- **`cacheComponents` desligado**: o painel é todo por usuário e muda a cada acesso, então a renderização dinâmica padrão é mais simples.
- **Aprendizado com o banco local**: o PostgreSQL embutido do `prisma dev` atende uma conexão por vez. Consultas em paralelo derrubavam conexões, o que levou ao `DATABASE_POOL_MAX` só para o ambiente local.

**Dados fictícios (decisões tomadas sem interromper o trabalho)**
- **Veículos sem marca real**: o modelo é uma descrição genérica ("Hatch compacto 1.0", "SUV médio híbrido").
- **Telefones com DDD (00)**, que não existe, e e-mails no domínio `example.com`.
- **Funilaria no catálogo**: o escopo pede um funileiro na equipe, então o catálogo inclui "Reparo de pequenos amassados".
- **Fechado aos domingos**: num domingo, "agendamentos do dia" fica vazio de propósito.
- **Volume**: cerca de 300 agendamentos e 150 orçamentos em 3 meses, com sextas e sábados mais cheios.
- **Mês atual coerente**: a geração é aleatória e reproduzível; o seed testa sementes em sequência e grava a primeira em que o mês atual cresce entre 8% e 15% sobre o mesmo período do mês anterior, com a taxa de aprovação estável ou em leve alta.

## Próximos passos

- **Notificações automáticas pelo WhatsApp** (lembrete de agendamento e aviso de carro pronto), usando a API oficial em vez de links.
- **Pagamento online** do orçamento aprovado (Pix e cartão).
- **Multiempresa**: várias oficinas no mesmo sistema, cada uma com seus dados, equipe e identidade.

## Aviso

Este é um **projeto de demonstração**. A empresa "Ponto Neutro", o endereço, a equipe, os clientes, as placas, os telefones e os valores são **fictícios**. Qualquer semelhança com pessoas ou empresas reais é coincidência. Não há CPFs nem dados pessoais verdadeiros.

## Licença e contato

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).

- GitHub: [@Joaopedro0s](https://github.com/Joaopedro0s)
- LinkedIn: [seu-perfil](https://www.linkedin.com/in/seu-perfil)
- E-mail: seu-email@exemplo.com
