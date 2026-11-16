// Cor e iniciais fixas por profissional, iguais em agenda, listas e painel.
// A ordem é alfabética entre quem executa serviços, então não muda entre telas.
const PRO_COLORS = ["var(--pro-1)", "var(--pro-2)", "var(--pro-3)", "var(--pro-4)", "var(--pro-5)"];

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

export function withColors<T extends { id: string; name: string }>(professionals: T[]) {
  return [...professionals]
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((p, i) => ({ ...p, color: PRO_COLORS[i % PRO_COLORS.length], initials: initials(p.name) }));
}
