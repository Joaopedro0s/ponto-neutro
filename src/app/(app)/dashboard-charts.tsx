"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "@/lib/format";

// Série única na cor do acento; eixos discretos; tooltip legível no tema escuro.
// Gráficos ficam fora do foco e do leitor de tela: a página traz os mesmos dados em texto/tabela.
const ACCENT = "var(--primary)";
const MUTED = "var(--muted-foreground)";
const GRID = "var(--border)";

const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(v));

function TooltipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface-2 px-3 py-2 text-sm">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="font-display text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: { label: string; total: number; partial: boolean }[] }) {
  return (
    <div className="h-64 w-full" aria-hidden="true">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap={8} accessibilityLayer={false}>
          {/* Grade horizontal tracejada, como as marcações de um mostrador */}
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="2 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: MUTED, fontSize: 12 }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 12 }} tickFormatter={compact} width={48} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              return active && p ? <TooltipBox title={`Semana de ${p.label}${p.partial ? " (em andamento)" : ""}`} value={formatBRL(p.total)} /> : null;
            }}
          />
          <Bar dataKey="total" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Minigráfico do indicador: só a forma da tendência, sem eixos. */
export function Sparkline({ values, id }: { values: number[]; id: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-full" aria-hidden="true">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} accessibilityLayer={false}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2} fill={`url(#spark-${id})`} isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Número que "gira" até o valor em 250ms, saindo de 80% dele (o servidor já entrega o valor final).
 * Quem pede menos movimento vê o valor direto.
 */
export function CountUp({ value, format }: { value: number; format: "brl" | "int" | "pct" }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / 250, 1);
      setShown(value * (0.8 + 0.2 * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const text = format === "brl" ? formatBRL(shown) : format === "pct" ? `${Math.round(shown * 100)}%` : String(Math.round(shown));
  return <span className="tabular-nums">{text}</span>;
}
