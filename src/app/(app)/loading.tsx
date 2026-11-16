export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Carregando…</span>
      <div className="h-7 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="h-32 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
    </div>
  );
}
