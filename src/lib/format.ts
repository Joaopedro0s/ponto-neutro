import { TIME_ZONE } from "@/lib/company";

type Money = number | string | { toString(): string };

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (value: Money) => brl.format(Number(value.toString()));

const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
export const formatDate = (d: Date) => dateFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d);
export const formatDateTime = (d: Date) => `${formatDate(d)} às ${formatTime(d)}`;

const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** Aceita qualquer digitação e devolve "(00) 00000-0000" (ou "(00) 0000-0000"); null se inválido. */
export function normalizePhone(input: string) {
  const d = onlyDigits(input);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return null;
}

/** Placa Mercosul (ABC1D23) ou antiga (ABC1234), sem hífen e em maiúsculas; null se inválida. */
export function normalizePlate(input: string) {
  const p = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p) ? p : null;
}

/** Link de WhatsApp a partir do telefone salvo; assume DDI 55. */
export const whatsappLink = (phone: string, text?: string) =>
  `https://wa.me/55${onlyDigits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, weekday: "short", day: "2-digit", month: "2-digit" });
const longDayFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });
/** "seg., 16/11" */
export const formatWeekday = (d: Date) => weekdayFmt.format(d);
/** "segunda-feira, 16 de novembro" */
export const formatLongDay = (d: Date) => longDayFmt.format(d);

/** 45 → "45 min"; 90 → "1h30"; 120 → "2h" */
export const formatDuration = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

/** Valor digitado em reais ("1.490,50", "54.90", "R$ 10") → centavos; null se inválido. */
export function parseMoney(input: string) {
  let s = input.replace(/R\$|\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (!/^\d+(\.\d{1,2})?$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** Centavos → texto para campo de valor: 5490 → "54,90". */
export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
