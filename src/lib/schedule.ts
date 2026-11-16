import { businessHours } from "@/lib/company";

// Datas da agenda no fuso de São Paulo (UTC-3, sem horário de verão desde 2019).
// Um "dia" é a string YYYY-MM-DD; um "horário" é HH:MM.
const OFFSET_MS = 3 * 3600_000;

export const spDay = (d: Date) => new Date(d.getTime() - OFFSET_MS).toISOString().slice(0, 10);
export const spTime = (d: Date) => new Date(d.getTime() - OFFSET_MS).toISOString().slice(11, 16);
export const atSp = (day: string, time: string) => new Date(`${day}T${time}:00-03:00`);

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();

/** Confere formato e data real (recusa 2026-02-30). */
export const isValidDay = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`)) && addDays(s, 0) === s;

export const isValidTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** Dias de expediente da semana (segunda a domingo) que contém `day`. */
export function openDaysOfWeek(day: string) {
  const monday = addDays(day, -((weekday(day) + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => businessHours[weekday(d)]);
}

export const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && aEnd > bStart;

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

/** Mensagem de erro se o intervalo sai do expediente; null se está dentro. */
export function businessHoursError(start: Date, end: Date) {
  const day = spDay(start);
  const hours = businessHours[weekday(day)];
  if (!hours) return "A oficina não abre neste dia. Escolha de segunda a sábado.";
  const endMinutes = spDay(end) === day ? minutes(spTime(end)) : Infinity;
  if (minutes(spTime(start)) < hours.open * 60 || endMinutes > hours.close * 60) {
    return `Fora do expediente deste dia (${hours.open}h às ${hours.close}h). Com esta duração, o serviço terminaria às ${spTime(end)}.`;
  }
  return null;
}
