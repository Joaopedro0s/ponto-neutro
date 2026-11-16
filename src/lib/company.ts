// Identidade fictícia usada em toda a demonstração. Nenhum dado aqui pertence a empresa real.
export const company = {
  name: "Ponto Neutro",
  fullName: "Ponto Neutro Estética & Mecânica Automotiva",
  slogan: "Do motor ao brilho, com hora marcada.",
  address: "Rua dos Torneiros, 418 – Vila Esmeril, Vale Sereno/SP",
  phone: "(00) 93456-7890",
  whatsapp: "(00) 98765-4321",
  email: "contato@example.com",
  hoursLabel: "Seg. a sex., 8h às 18h · Sáb., 8h às 13h",
} as const;

// Expediente usado pela agenda e pelo seed. Índice = dia da semana (0 = domingo); null = fechado.
export const businessHours: ({ open: number; close: number } | null)[] = [
  null,
  { open: 8, close: 18 },
  { open: 8, close: 18 },
  { open: 8, close: 18 },
  { open: 8, close: 18 },
  { open: 8, close: 18 },
  { open: 8, close: 13 },
];

// Fuso fixo: o servidor da Vercel roda em UTC, a oficina fica em São Paulo.
export const TIME_ZONE = "America/Sao_Paulo";
