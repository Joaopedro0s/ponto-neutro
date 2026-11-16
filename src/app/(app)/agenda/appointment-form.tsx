"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError, SelectField, TextAreaField, TextField } from "@/components/form-field";
import { formatDuration } from "@/lib/format";
import type { FormState } from "@/lib/form";
import { appointmentStatus } from "@/lib/labels";

export type FormOptions = {
  customers: { id: string; name: string; vehicles: { id: string; plate: string; model: string }[] }[];
  services: { id: string; name: string; durationMinutes: number }[];
  professionals: { id: string; label: string }[];
};

type Defaults = {
  customerId: string;
  vehicleId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  notes: string;
  status?: string;
};

function endTime(time: string, minutes: number) {
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function AppointmentForm({
  action,
  options,
  defaults,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  options: FormOptions;
  defaults: Defaults;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // Campos que mudam outros campos ficam controlados; o resto usa defaultValue.
  const [customerId, setCustomerId] = useState(defaults.customerId);
  const [vehicleId, setVehicleId] = useState(defaults.vehicleId);
  const [serviceId, setServiceId] = useState(defaults.serviceId);
  const [time, setTime] = useState(defaults.time);
  const v = (k: keyof Defaults) => state.values?.[k] ?? defaults[k] ?? "";
  const e = state.fieldErrors ?? {};

  const vehicles = options.customers.find((c) => c.id === customerId)?.vehicles ?? [];
  const service = options.services.find((s) => s.id === serviceId);
  const end = service && endTime(time, service.durationMinutes);

  return (
    <form
      noValidate
      className="flex max-w-2xl flex-col gap-4"
      // onSubmit em vez de action: evita que o React limpe o formulário (e os selects controlados) após um erro.
      onSubmit={(ev) => {
        ev.preventDefault();
        const formData = new FormData(ev.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Cliente"
          name="customerId"
          required
          value={customerId}
          onChange={(ev) => {
            setCustomerId(ev.target.value);
            const first = options.customers.find((c) => c.id === ev.target.value)?.vehicles;
            setVehicleId(first?.length === 1 ? first[0].id : "");
          }}
          error={e.customerId}
        >
          <option value="">Selecione…</option>
          {options.customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Veículo"
          name="vehicleId"
          required
          value={vehicleId}
          onChange={(ev) => setVehicleId(ev.target.value)}
          disabled={!customerId}
          hint={customerId && vehicles.length === 0 ? "Este cliente não tem veículos. Cadastre um na ficha do cliente." : undefined}
          error={e.vehicleId}
        >
          <option value="">{customerId ? "Selecione…" : "Escolha o cliente primeiro"}</option>
          {vehicles.map((vh) => (
            <option key={vh.id} value={vh.id}>
              {vh.plate} · {vh.model}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Serviço"
          name="serviceId"
          required
          value={serviceId}
          onChange={(ev) => setServiceId(ev.target.value)}
          error={e.serviceId}
        >
          <option value="">Selecione…</option>
          {options.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({formatDuration(s.durationMinutes)})
            </option>
          ))}
        </SelectField>
        <SelectField label="Profissional" name="professionalId" required defaultValue={v("professionalId")} error={e.professionalId}>
          <option value="">Selecione…</option>
          {options.professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </SelectField>

        <TextField label="Data" name="date" type="date" required defaultValue={v("date")} error={e.date} />
        <TextField
          label="Horário de início"
          name="time"
          type="time"
          step={900}
          required
          value={time}
          onChange={(ev) => setTime(ev.target.value)}
          hint={end ? `Término previsto às ${end} (${formatDuration(service!.durationMinutes)}).` : "Seg. a sex., 8h às 18h · Sáb., 8h às 13h."}
          error={e.time}
        />

        {defaults.status && (
          <SelectField label="Situação" name="status" required defaultValue={v("status")} error={e.status}>
            {Object.entries(appointmentStatus).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      <TextAreaField label="Observações" name="notes" rows={2} defaultValue={v("notes")} error={e.notes} />
      <FormError message={state.error} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando…" : "Salvar agendamento"}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Voltar
        </Link>
      </div>
    </form>
  );
}
