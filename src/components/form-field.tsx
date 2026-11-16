import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Common = { label: string; name: string; error?: string; hint?: string; required?: boolean; className?: string };

function Wrapper({ label, name, error, hint, required, className, children }: Common & { children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={name}>
        {label}
        {!required && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${name}-dica`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-erro`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const a11y = ({ name, error, hint, required }: Common) => ({
  id: name,
  name,
  required,
  "aria-invalid": !!error || undefined,
  "aria-describedby": error ? `${name}-erro` : hint ? `${name}-dica` : undefined,
});

export function TextField({ label, name, error, hint, required, className, ...input }: Common & Omit<React.ComponentProps<"input">, "name">) {
  const common = { label, name, error, hint, required, className };
  return (
    <Wrapper {...common}>
      <Input {...input} {...a11y(common)} className="h-10" />
    </Wrapper>
  );
}

export function TextAreaField({ label, name, error, hint, required, className, ...textarea }: Common & Omit<React.ComponentProps<"textarea">, "name">) {
  const common = { label, name, error, hint, required, className };
  return (
    <Wrapper {...common}>
      <Textarea {...textarea} {...a11y(common)} />
    </Wrapper>
  );
}

// Select nativo: acessível e com o seletor do próprio celular.
export function SelectField({ label, name, error, hint, required, className, children, ...select }: Common & Omit<React.ComponentProps<"select">, "name">) {
  const common = { label, name, error, hint, required, className };
  return (
    <Wrapper {...common}>
      <select
        {...select}
        {...a11y(common)}
        className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
      >
        {children}
      </select>
    </Wrapper>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
