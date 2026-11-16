import type {
  AppointmentStatus,
  QuoteStatus,
  ServiceCategory,
  Specialty,
  WorkOrderStatus,
} from "@/generated/prisma/enums";

// Tom visual de cada status; o componente StatusBadge traduz em cores.
export type Tone = "neutral" | "info" | "progress" | "success" | "danger";
type Label = { label: string; tone: Tone };

export const appointmentStatus: Record<AppointmentStatus, Label> = {
  SCHEDULED: { label: "Agendado", tone: "neutral" },
  CONFIRMED: { label: "Confirmado", tone: "info" },
  COMPLETED: { label: "Concluído", tone: "success" },
  CANCELED: { label: "Cancelado", tone: "danger" },
};

export const quoteStatus: Record<QuoteStatus, Label> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  SENT: { label: "Enviado", tone: "info" },
  APPROVED: { label: "Aprovado", tone: "success" },
  REJECTED: { label: "Recusado", tone: "danger" },
};

export const workOrderStatus: Record<WorkOrderStatus, Label> = {
  WAITING: { label: "Aguardando", tone: "neutral" },
  IN_PROGRESS: { label: "Em serviço", tone: "progress" },
  READY: { label: "Pronto para retirada", tone: "info" },
  DELIVERED: { label: "Entregue", tone: "success" },
};

export const specialtyLabel: Record<Specialty, string> = {
  MECHANIC: "Mecânico",
  BODYWORK: "Funileiro",
  DETAILING: "Esteticista",
  RECEPTION: "Recepcionista",
};

export const serviceCategoryLabel: Record<ServiceCategory, string> = {
  DETAILING: "Estética",
  MECHANICS: "Mecânica",
  BODYWORK: "Funilaria",
};

export const formatQuoteNumber = (n: number) => `ORC-${String(n).padStart(4, "0")}`;
export const formatWorkOrderNumber = (n: number) => `OS-${String(n).padStart(4, "0")}`;

// Quem executa cada categoria do catálogo (usado no seed e ao gerar a OS).
export const specialtyFor: Record<ServiceCategory, Specialty> = {
  DETAILING: "DETAILING",
  MECHANICS: "MECHANIC",
  BODYWORK: "BODYWORK",
};

export const quoteItemKindLabel = { PART: "Peça", LABOR: "Mão de obra" } as const;

// Texto do botão que leva a OS para a próxima etapa.
export const workOrderNextAction: Partial<Record<WorkOrderStatus, string>> = {
  WAITING: "Iniciar serviço",
  IN_PROGRESS: "Marcar como pronto",
  READY: "Registrar entrega",
};
