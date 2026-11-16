"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "@/lib/format";

// Série única: uma cor (a da marca), sem legenda; o título do cartão nomeia a série.
// Gráficos ficam fora do foco e do leitor de tela; a página traz os mesmos dados em tabela acessível.
const FILL = "var(--primary)";
const INK_MUTED = "var(--muted-foreground)";
const GRID = "var(--border)";

// Eixo enxuto ("5 mil"); o valor exato em R$ aparece no tooltip.
const compactBRL = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(v));

function TooltipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="text-muted-foreground">{title}</p>
      <p className="font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function WeeklyRevenueChart({ data }: { data: { label: string; total: number; partial: boolean }[] }) {
  return (
    <div className="h-56 w-full" aria-hidden="true">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap={6} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 11 }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 11 }} tickFormatter={compactBRL} width={48} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              return active && p ? <TooltipBox title={`Semana de ${p.label}${p.partial ? " (em andamento)" : ""}`} value={formatBRL(p.total)} /> : null;
            }}
          />
          <Bar dataKey="total" fill={FILL} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopServicesChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="w-full" style={{ height: data.length * 40 + 8 }} aria-hidden="true">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap={8} accessibilityLayer={false}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={150} tick={{ fill: "var(--foreground)", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              return active && p ? <TooltipBox title={p.name} value={`${p.count} vendas`} /> : null;
            }}
          />
          <Bar
            dataKey="count"
            fill={FILL}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            label={{ position: "right", fill: INK_MUTED, fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
