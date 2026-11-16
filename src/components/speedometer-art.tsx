// Arte do painel de login: um mostrador de velocímetro estilizado, com marcações de régua
// e o ponteiro em repouso. Puramente decorativo.
export function SpeedometerArt({ className }: { className?: string }) {
  const ticks = Array.from({ length: 41 }, (_, i) => -135 + i * 6.75);
  const labels = [0, 40, 80, 120, 160, 200, 240];
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={className}>
      <circle cx="200" cy="200" r="182" fill="none" stroke="var(--border)" strokeWidth="2" />
      <circle cx="200" cy="200" r="150" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 6" />
      {ticks.map((t, i) => (
        <line
          key={t}
          x1="200"
          y1="30"
          x2="200"
          y2={i % 5 === 0 ? 54 : 42}
          stroke={i >= 34 ? "var(--primary)" : "var(--muted-foreground)"}
          strokeOpacity={i % 5 === 0 ? 0.9 : 0.45}
          strokeWidth={i % 5 === 0 ? 3 : 1.5}
          transform={`rotate(${t} 200 200)`}
        />
      ))}
      {labels.map((v, i) => {
        const a = ((-135 + i * 45) * Math.PI) / 180;
        return (
          <text key={v} x={200 + Math.sin(a) * 118} y={206 - Math.cos(a) * 118} textAnchor="middle" fill="var(--muted-foreground)" fontSize="18" fontFamily="var(--font-barlow)">
            {v}
          </text>
        );
      })}
      <line x1="200" y1="200" x2="200" y2="72" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" transform="rotate(-128 200 200)" />
      <circle cx="200" cy="200" r="16" fill="var(--surface-2)" stroke="var(--primary)" strokeWidth="4" />
      <text x="200" y="268" textAnchor="middle" fill="var(--foreground)" fontSize="34" fontWeight="700" fontFamily="var(--font-barlow)" letterSpacing="4">
        N
      </text>
    </svg>
  );
}
