/**
 * Popula (ou reseta) o banco com a demonstração fictícia da "Ponto Neutro".
 * Rode com `npm run db:seed`. As datas são relativas ao dia em que o seed roda,
 * então o painel sempre mostra os últimos 3 meses e os próximos dias.
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { businessHours } from "../src/lib/company";
import { addDays, atSp, spDay, weekday } from "../src/lib/schedule";
import { DEMO_ACCOUNT } from "../src/lib/demo";
import { specialtyFor } from "../src/lib/labels";
import { hashPassword } from "../src/lib/password";
import { centsToDecimalString, quoteTotals } from "../src/lib/quote-math";
import type {
  AppointmentStatus,
  QuoteItemKind,
  QuoteStatus,
  ServiceCategory,
  Specialty,
  WorkOrderStatus,
} from "../src/generated/prisma/enums";

// ---------- Aleatoriedade reproduzível ----------

let state = 20261115;
function rng() {
  // mulberry32: mesmo resultado a cada execução no mesmo dia
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const chance = (p: number) => rng() < p;
const pick = <T>(items: readonly T[]) => items[Math.floor(rng() * items.length)];
function weighted<T>(items: readonly (readonly [T, number])[]) {
  let r = rng() * items.reduce((s, [, w]) => s + w, 0);
  for (const [item, w] of items) if ((r -= w) < 0) return item;
  return items[items.length - 1][0];
}

// ---------- Datas no fuso de São Paulo (UTC-3, sem horário de verão desde 2019) ----------

const pad = (n: number) => String(n).padStart(2, "0");
const now = new Date();
const at = (day: string, minutes: number) => atSp(day, `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
const nextOpenDay = (day: string) => {
  while (!businessHours[weekday(day)]) day = addDays(day, 1);
  return day;
};
const today = spDay(now);
const minDate = (a: Date, b: Date) => (a < b ? a : b);

// ---------- Conteúdo fictício ----------

const PROFESSIONALS: { name: string; specialty: Specialty }[] = [
  { name: "Rogério Antunes", specialty: "MECHANIC" },
  { name: "Jéssica Moura", specialty: "DETAILING" },
  { name: "Caíque Fernandes", specialty: "DETAILING" },
  { name: "Edvaldo Lins", specialty: "BODYWORK" },
  { name: "Patrícia Okumura", specialty: "RECEPTION" },
];


type Part = { description: string; priceCents: number; quantity: number; optional?: boolean };
type ServiceSeed = {
  name: string;
  category: ServiceCategory;
  priceCents: number;
  durationMinutes: number;
  description: string;
  weight: number; // frequência relativa na agenda
  parts?: Part[];
};

const SERVICES: ServiceSeed[] = [
  {
    name: "Lavagem técnica",
    category: "DETAILING",
    priceCents: 12000,
    durationMinutes: 90,
    weight: 24,
    description: "Lavagem detalhada com descontaminação de rodas, caixas de roda e acabamento de pneus.",
  },
  {
    name: "Higienização interna",
    category: "DETAILING",
    priceCents: 38000,
    durationMinutes: 240,
    weight: 10,
    description: "Limpeza profunda de bancos, carpetes, teto e painel, com extração e secagem.",
  },
  {
    name: "Polimento técnico",
    category: "DETAILING",
    priceCents: 52000,
    durationMinutes: 360,
    weight: 6,
    description: "Correção de riscos superficiais e recuperação do brilho da pintura em etapas.",
  },
  {
    name: "Cristalização de pintura",
    category: "DETAILING",
    priceCents: 69000,
    durationMinutes: 300,
    weight: 4,
    description: "Polimento de refino com selante de longa duração. Proteção estimada de 6 meses.",
  },
  {
    name: "Vitrificação de pintura",
    category: "DETAILING",
    priceCents: 149000,
    durationMinutes: 480,
    weight: 3,
    description: "Polimento completo e aplicação de revestimento cerâmico. Proteção estimada de 2 anos.",
  },
  {
    name: "Revisão preventiva",
    category: "MECHANICS",
    priceCents: 39000,
    durationMinutes: 180,
    weight: 8,
    description: "Checagem de 40 itens, troca de óleo e filtros. Mão de obra; peças cobradas à parte.",
    parts: [
      { description: "Óleo sintético 5W-30 (litro)", priceCents: 5490, quantity: 4 },
      { description: "Filtro de óleo", priceCents: 4800, quantity: 1 },
      { description: "Filtro de ar do motor", priceCents: 7200, quantity: 1 },
      { description: "Filtro de cabine", priceCents: 6500, quantity: 1, optional: true },
    ],
  },
  {
    name: "Troca de óleo e filtro",
    category: "MECHANICS",
    priceCents: 8000,
    durationMinutes: 45,
    weight: 14,
    description: "Mão de obra da troca de óleo do motor e do filtro. Óleo e filtro cobrados à parte.",
    parts: [
      { description: "Óleo sintético 5W-30 (litro)", priceCents: 5490, quantity: 4 },
      { description: "Filtro de óleo", priceCents: 4800, quantity: 1 },
    ],
  },
  {
    name: "Alinhamento e balanceamento",
    category: "MECHANICS",
    priceCents: 16000,
    durationMinutes: 60,
    weight: 10,
    description: "Alinhamento computadorizado e balanceamento das quatro rodas.",
    parts: [{ description: "Válvula de pneu", priceCents: 1200, quantity: 4, optional: true }],
  },
  {
    name: "Revisão de freios",
    category: "MECHANICS",
    priceCents: 22000,
    durationMinutes: 120,
    weight: 7,
    description: "Inspeção e troca de pastilhas, discos e fluido conforme necessidade.",
    parts: [
      { description: "Jogo de pastilhas dianteiras", priceCents: 18900, quantity: 1 },
      { description: "Disco de freio ventilado", priceCents: 23800, quantity: 2, optional: true },
      { description: "Fluido de freio DOT 4 (500 ml)", priceCents: 3990, quantity: 1 },
    ],
  },
  {
    name: "Revisão de suspensão",
    category: "MECHANICS",
    priceCents: 28000,
    durationMinutes: 180,
    weight: 4,
    description: "Diagnóstico de ruídos e troca de amortecedores, batentes e bieletas.",
    parts: [
      { description: "Amortecedor dianteiro", priceCents: 43500, quantity: 2 },
      { description: "Kit batente e coifa", priceCents: 8990, quantity: 2 },
      { description: "Bieleta", priceCents: 7800, quantity: 2, optional: true },
    ],
  },
  {
    name: "Diagnóstico eletrônico",
    category: "MECHANICS",
    priceCents: 18000,
    durationMinutes: 60,
    weight: 6,
    description: "Leitura de falhas por scanner, testes de sensores e relatório para o cliente.",
    parts: [{ description: "Sensor de oxigênio", priceCents: 38900, quantity: 1, optional: true }],
  },
  {
    name: "Reparo de pequenos amassados",
    category: "BODYWORK",
    priceCents: 35000,
    durationMinutes: 180,
    weight: 3,
    description: "Remoção de amassados sem repintura (martelinho), por painel.",
  },
];

const CUSTOMER_NAMES = [
  "Ana Beatriz Lacerda", "Bruno Henrique Salgado", "Camila Duarte Rezende", "Carlos Eduardo Pimentel",
  "Daniela Yamamoto", "Diego Albuquerque", "Eduarda Nogueira", "Fábio Cardoso Leme",
  "Fernanda Bittencourt", "Gabriel Assunção", "Giovana Pacheco", "Gustavo Brandão",
  "Helena Castilho", "Igor Valadares", "Isabela Fontes", "João Pedro Carvalhal",
  "Juliana Esteves", "Kauã Ribeiro Lopes", "Larissa Monteiro", "Leonardo Quintela",
  "Letícia Barros Vianna", "Lucas Tenório", "Luana Sampaio", "Marcelo Aguiar Prates",
  "Mariana Coutinho", "Mateus Figueiredo", "Natália Okada", "Otávio Rangel",
  "Paula Cristina Dornelles", "Rafael Siqueira", "Renata Guimarães Paiva", "Rodrigo Nakamura",
  "Sabrina Teles", "Thiago Batista Moreira", "Vanessa Loureiro", "Yasmin Abdala",
];

// Descrições genéricas de porte e motorização, sem marcas reais. Multiplicador ajusta preço de estética.
const MODELS: [string, number][] = [
  ["Hatch compacto 1.0", 1],
  ["Hatch compacto 1.0 turbo", 1],
  ["Hatch médio 1.6", 1],
  ["Sedã compacto 1.6", 1],
  ["Sedã médio 2.0", 1.1],
  ["Sedã executivo 2.0 turbo", 1.1],
  ["SUV compacto 1.3 turbo", 1.2],
  ["SUV médio 2.0", 1.25],
  ["SUV médio híbrido", 1.25],
  ["Picape compacta 1.4", 1.1],
  ["Picape média 2.8 diesel", 1.35],
  ["Minivan 7 lugares", 1.3],
  ["Utilitário de carga 1.6", 1.2],
  ["Cupê 2.0 turbo", 1.1],
];
const COLORS = ["Prata", "Branco", "Preto", "Cinza grafite", "Vermelho", "Azul-marinho", "Verde musgo", "Bege"];
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

const NOTES = [
  "Prefere contato por WhatsApp.",
  "Cliente desde a inauguração.",
  "Deixa o carro cedo e busca no fim do dia.",
  "Pede foto do serviço concluído.",
  null, null, null, null,
];

// Observações voltadas ao cliente: aparecem no PDF do orçamento.
const QUOTE_NOTES = [
  "Garantia de 90 dias para a mão de obra.",
  "Entrega prevista para o mesmo dia, se aprovado até as 10h.",
  "Peças originais ou de primeira linha, com nota fiscal.",
  "Valor da estética considera o porte do veículo.",
];

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, ".");
const phone = () => `(00) 9${int(1000, 9999)}-${int(1000, 9999)}`;

async function main() {
  console.log(`Seed da demonstração (hoje: ${today.split("-").reverse().join("/")})`);

  await db.$executeRawUnsafe(
    `TRUNCATE "WorkOrder", "QuoteItem", "Quote", "Appointment", "Vehicle", "Customer", "Service", "Professional", "Session", "User" RESTART IDENTITY CASCADE`,
  );

  await db.user.create({
    data: {
      name: DEMO_ACCOUNT.name,
      email: DEMO_ACCOUNT.email,
      passwordHash: await hashPassword(DEMO_ACCOUNT.password),
    },
  });

  const professionals = await db.professional.createManyAndReturn({
    data: PROFESSIONALS.map((p) => ({ ...p, phone: phone() })),
  });

  const services = await db.service.createManyAndReturn({
    data: SERVICES.map((s) => ({
      name: s.name,
      category: s.category,
      price: centsToDecimalString(s.priceCents),
      durationMinutes: s.durationMinutes,
      description: s.description,
    })),
  });
  const serviceSeed = new Map(services.map((s, i) => [s.id, SERVICES[i]]));

  // Clientes cadastrados ao longo do último ano.
  const customers = await db.customer.createManyAndReturn({
    data: CUSTOMER_NAMES.map((name) => {
      const parts = name.split(" ");
      return {
        name,
        phone: phone(),
        email: chance(0.85) ? `${slug(parts[0])}.${slug(parts[parts.length - 1])}@example.com` : null,
        notes: pick(NOTES),
        createdAt: at(addDays(today, -int(95, 365)), int(8 * 60, 17 * 60)),
      };
    }),
  });

  // Um veículo por cliente e um segundo para cerca de um terço deles.
  const plates = new Set<string>();
  const plate = () => {
    let p: string;
    do {
      p = `${pick([...LETTERS])}${pick([...LETTERS])}${pick([...LETTERS])}${int(0, 9)}${pick([...LETTERS])}${int(0, 9)}${int(0, 9)}`;
    } while (plates.has(p));
    plates.add(p);
    return p;
  };
  const owners = [...customers, ...customers.filter(() => chance(0.3))];
  const vehicles = await db.vehicle.createManyAndReturn({
    data: owners.map((c) => ({
      plate: plate(),
      model: pick(MODELS)[0],
      color: pick(COLORS),
      year: int(2012, 2026),
      customerId: c.id,
      createdAt: c.createdAt,
    })),
  });
  const sizeFactor = new Map(vehicles.map((v) => [v.id, MODELS.find(([m]) => m === v.model)![1]]));

  // ---------- Agenda: últimos 90 dias e próximos 10, sem conflito por profissional ----------

  type Slot = { start: Date; end: Date };
  const busy = new Map<string, Slot[]>(professionals.map((p) => [p.id, []]));
  const appointments: {
    customerId: string;
    vehicleId: string;
    serviceId: string;
    professionalId: string;
    startsAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
    notes: string | null;
  }[] = [];

  for (let offset = -90; offset <= 10; offset++) {
    const day = addDays(today, offset);
    const hours = businessHours[weekday(day)];
    if (!hours) continue;

    // Sazonalidade: movimento cresce rumo ao fim do ano, sextas e sábados são mais cheios
    // e a agenda futura ainda está sendo preenchida.
    const trend = 0.85 + 0.3 * ((offset + 90) / 90);
    const dayFactor = [0, 0.8, 1, 1, 1.1, 1.35, 1.2][weekday(day)];
    const fill = offset > 0 ? Math.max(0.25, 1 - offset / 12) : 1;
    const count = Math.floor(3.4 * trend * dayFactor * fill + rng());

    for (let i = 0; i < count; i++) {
      const service = weighted(services.map((s) => [s, serviceSeed.get(s.id)!.weight] as const));
      const eligible = professionals.filter((p) => p.specialty === specialtyFor[service.category]);
      // Clientes recorrentes aparecem mais: alguns veículos concentram o histórico.
      const vehicle = vehicles[Math.floor(vehicles.length * rng() ** 1.15)];

      const candidates: { professionalId: string; start: Date; end: Date }[] = [];
      for (const pro of eligible) {
        for (let m = hours.open * 60; m + service.durationMinutes <= hours.close * 60; m += 30) {
          const start = at(day, m);
          const end = new Date(start.getTime() + service.durationMinutes * 60_000);
          if (!busy.get(pro.id)!.some((b) => start < b.end && end > b.start)) {
            candidates.push({ professionalId: pro.id, start, end });
          }
        }
      }
      if (!candidates.length) continue;
      const slot = pick(candidates);
      busy.get(slot.professionalId)!.push(slot);

      let status: AppointmentStatus;
      if (slot.end <= now) status = chance(0.09) ? "CANCELED" : "COMPLETED";
      else if (offset > 0) status = chance(0.06) ? "CANCELED" : chance(0.45) ? "CONFIRMED" : "SCHEDULED";
      else status = "CONFIRMED";

      appointments.push({
        customerId: vehicle.customerId,
        vehicleId: vehicle.id,
        serviceId: service.id,
        professionalId: slot.professionalId,
        startsAt: slot.start,
        endsAt: slot.end,
        status,
        notes: chance(0.15) ? "Cliente pediu para avisar quando estiver pronto." : null,
      });
    }
  }
  appointments.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  await db.appointment.createMany({ data: appointments });

  // ---------- Orçamentos: nascem de parte dos atendimentos já realizados ----------

  type ItemSeed = {
    kind: QuoteItemKind;
    description: string;
    quantity: number;
    unitPriceCents: number;
    serviceId: string | null;
  };
  const quotes: {
    customerId: string;
    vehicleId: string;
    status: QuoteStatus;
    createdAt: Date;
    sentAt: Date | null;
    decidedAt: Date | null;
    validUntil: Date;
    notes: string | null;
    items: ItemSeed[];
    discountCents: number;
  }[] = [];

  for (const appt of appointments) {
    if (appt.status === "CANCELED" || appt.startsAt > now || !chance(0.62)) continue;
    const main = services.find((s) => s.id === appt.serviceId)!;
    const seed = serviceSeed.get(main.id)!;
    const factor = main.category === "DETAILING" ? sizeFactor.get(appt.vehicleId)! : 1;

    const items: ItemSeed[] = [
      {
        kind: "LABOR",
        description: main.name,
        quantity: 1,
        unitPriceCents: Math.round((seed.priceCents * factor) / 500) * 500,
        serviceId: main.id,
      },
    ];
    for (const part of seed.parts ?? []) {
      if (part.optional && !chance(0.45)) continue;
      items.push({ kind: "PART", description: part.description, quantity: part.quantity, unitPriceCents: part.priceCents, serviceId: null });
    }
    // Venda casada comum: lavagem junto de outro serviço de estética, alinhamento junto de mecânica.
    const extra = main.category === "DETAILING" && main.name !== "Lavagem técnica" && chance(0.3)
      ? services.find((s) => s.name === "Lavagem técnica")
      : main.category === "MECHANICS" && main.name !== "Alinhamento e balanceamento" && chance(0.25)
        ? services.find((s) => s.name === "Alinhamento e balanceamento")
        : undefined;
    if (extra) {
      items.push({ kind: "LABOR", description: extra.name, quantity: 1, unitPriceCents: serviceSeed.get(extra.id)!.priceCents, serviceId: extra.id });
    }

    const createdAt = new Date(appt.startsAt.getTime() + 30 * 60_000);
    const ageDays = (now.getTime() - createdAt.getTime()) / 86_400_000;
    const status: QuoteStatus =
      ageDays > 10
        ? weighted([["APPROVED", 68], ["REJECTED", 27], ["SENT", 5]] as const)
        : ageDays > 3
          ? weighted([["APPROVED", 55], ["REJECTED", 15], ["SENT", 30]] as const)
          : weighted([["DRAFT", 30], ["SENT", 45], ["APPROVED", 25]] as const);

    const sentAt = status === "DRAFT" ? null : minDate(new Date(createdAt.getTime() + int(20, 180) * 60_000), now);
    const decidedAt =
      status === "APPROVED" || status === "REJECTED"
        ? minDate(new Date(sentAt!.getTime() + int(1, 40) * 3600_000), now)
        : null;
    const subtotal = quoteTotals(items, 0).subtotalCents;

    quotes.push({
      customerId: appt.customerId,
      vehicleId: appt.vehicleId,
      status,
      createdAt,
      sentAt,
      decidedAt,
      validUntil: new Date(createdAt.getTime() + 15 * 86_400_000),
      notes: chance(0.35) ? pick(QUOTE_NOTES) : null,
      items,
      discountCents: chance(0.3) ? Math.floor((subtotal * pick([0.05, 0.1])) / 100) * 100 : 0,
    });
  }

  const createdQuotes = await db.quote.createManyAndReturn({
    data: quotes.map(({ items, discountCents, ...q }) => {
      const t = quoteTotals(items, discountCents);
      return {
        ...q,
        discount: centsToDecimalString(t.discountCents),
        subtotal: centsToDecimalString(t.subtotalCents),
        total: centsToDecimalString(t.totalCents),
      };
    }),
    select: { id: true },
  });
  await db.quoteItem.createMany({
    data: createdQuotes.flatMap(({ id }, qi) =>
      quotes[qi].items.map(({ unitPriceCents, ...item }, position) => ({
        ...item,
        quoteId: id,
        position,
        quantity: item.quantity.toFixed(2),
        unitPrice: centsToDecimalString(unitPriceCents),
      })),
    ),
  });

  // ---------- Ordens de serviço: uma por orçamento aprovado ----------

  const approved = createdQuotes
    .map(({ id }, i) => ({ id, ...quotes[i] }))
    .filter((q) => q.status === "APPROVED")
    .sort((a, b) => a.decidedAt!.getTime() - b.decidedAt!.getTime());

  // Os aprovados mais recentes ainda estão na oficina, distribuídos pelas etapas.
  const inShop: WorkOrderStatus[] = ["WAITING", "IN_PROGRESS", "IN_PROGRESS", "IN_PROGRESS", "READY", "READY"];
  const workOrders = approved.map((q, i) => {
    const fromEnd = approved.length - 1 - i;
    const status: WorkOrderStatus = fromEnd < inShop.length ? inShop[fromEnd] : "DELIVERED";
    const mainService = services.find((s) => s.id === q.items[0].serviceId)!;
    const pro = professionals.find((p) => p.specialty === specialtyFor[mainService.category])!;

    const startDay = nextOpenDay(addDays(spDay(q.decidedAt!), chance(0.6) ? 0 : 1));
    const startedAt = minDate(at(startDay, 8 * 60 + int(0, 4) * 30), now);
    const readyDay = nextOpenDay(addDays(startDay, mainService.durationMinutes > 240 ? 1 : 0));
    const readyAt = minDate(at(readyDay, 16 * 60 + int(0, 3) * 30), now);
    const deliveredAt = minDate(at(nextOpenDay(addDays(readyDay, chance(0.7) ? 0 : 1)), 17 * 60 + int(0, 2) * 30), now);

    return {
      quoteId: q.id,
      vehicleId: q.vehicleId,
      professionalId: pro.id,
      status,
      createdAt: q.decidedAt!,
      startedAt: status === "WAITING" ? null : startedAt,
      readyAt: status === "READY" || status === "DELIVERED" ? readyAt : null,
      deliveredAt: status === "DELIVERED" ? deliveredAt : null,
    };
  });
  await db.workOrder.createMany({ data: workOrders });

  // ---------- Conferência mínima pedida no escopo ----------
  const counts = {
    clientes: customers.length,
    veículos: vehicles.length,
    agendamentos: appointments.length,
    orçamentos: quotes.length,
    aprovados: quotes.filter((q) => q.status === "APPROVED").length,
    recusados: quotes.filter((q) => q.status === "REJECTED").length,
    pendentes: quotes.filter((q) => q.status === "SENT" || q.status === "DRAFT").length,
    "na oficina": workOrders.filter((w) => w.status !== "DELIVERED").length,
  };
  console.table(counts);
  const min = { clientes: 30, veículos: 40, agendamentos: 60, orçamentos: 40 } as const;
  for (const [k, v] of Object.entries(min)) {
    if (counts[k as keyof typeof min] < v) throw new Error(`Seed gerou poucos ${k}: ${counts[k as keyof typeof min]} (mínimo ${v}).`);
  }
  console.log(`Pronto. Entre com ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password} ou pelo botão de demonstração.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
