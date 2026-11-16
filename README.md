# Gestão de Oficina e Estética

> README provisório. A versão completa, com capturas de tela e guia de deploy, chega na fase 9.

Sistema web para estéticas e oficinas automotivas: agenda, orçamentos, ordens de serviço e painel. Projeto de portfólio com **dados fictícios**.

## Como rodar localmente

Pré-requisitos: Node.js 20 ou superior.

```bash
npm install            # instala dependências e gera o cliente do Prisma
npm run db:dev         # sobe um PostgreSQL local (sem Docker) e mostra a URL
cp .env.example .env   # cole a URL em DATABASE_URL, se for diferente
npm run db:migrate     # cria as tabelas
npm run db:seed        # popula (ou reseta) os dados fictícios
npm run dev            # http://localhost:3000
```

Na tela de login, use **Entrar como demonstração** ou `demo@example.com` / `demo1234`.

As datas do seed são relativas ao dia em que ele roda: rodar `npm run db:seed` de novo "atualiza" a demonstração para os últimos 3 meses.

Qualquer PostgreSQL serve (Neon, Supabase, Docker): basta apontar `DATABASE_URL` para ele.

## Notas de decisão

- **Prisma 7 com `@prisma/adapter-pg`**: é o formato atual do Prisma e funciona igual na Vercel e em qualquer PostgreSQL.
- **Banco local com `prisma dev`**: evita exigir Docker para quem só quer testar.
- **Sessão em tabela própria** (token aleatório em cookie httpOnly; no banco fica só o hash): login simples sem serviço externo. Senhas com `scrypt`, nativo do Node.
- **`cacheComponents` desligado**: o painel é todo por usuário e muda a cada requisição, então a renderização dinâmica padrão é mais simples e suficiente.
- **Empresa fictícia "Ponto Neutro"**: o logotipo é o "H" do câmbio manual com o ponto no neutro. Telefones usam o DDD inexistente (00) para não coincidir com números reais.
- **Funilaria no catálogo**: o escopo pede um funileiro na equipe, então o catálogo inclui "Reparo de pequenos amassados" além dos serviços listados.
- **Fechado aos domingos**: a agenda segue o expediente de seg. a sáb. Num domingo, "agendamentos do dia" fica vazio de propósito.
- **Volume da demonstração**: cerca de 300 agendamentos e 150 orçamentos em 3 meses, com movimento crescendo rumo ao fim do ano e sextas e sábados mais cheios.
- **Banco local**: o `prisma dev` serve um único banco (`template1`) e um banco-sombra em outra porta, usado só pelas migrações.
- **Veículos sem marca real**: o campo “modelo” guarda uma descrição genérica (ex.: “Hatch compacto 1.0”), seguindo a regra de não usar marcas reais.
- **Desconto do orçamento em R$**, aplicado sobre a soma dos itens. Subtotal e total ficam gravados para o painel consultar rápido.
- **Ordem de serviço ligada a um orçamento aprovado** (relação 1 para 1), com datas de início, pronto e entrega para medir prazos.
- **Exclusão protegida**: clientes e veículos com agendamentos, orçamentos ou OS não podem ser excluídos, para não apagar histórico. Cliente sem histórico é excluído junto com seus veículos.
- **Placa aceita nos dois formatos** (Mercosul ABC1D23 e antigo ABC1234), sempre gravada sem hífen e em maiúsculas. Telefone aceita qualquer digitação e é gravado como (00) 00000-0000.
- **Busca única** em Clientes: nome, e-mail, final do telefone ou placa no mesmo campo. A lista mostra até 200 clientes, sem paginação, o que basta para a demonstração.
# ponto-neutro
