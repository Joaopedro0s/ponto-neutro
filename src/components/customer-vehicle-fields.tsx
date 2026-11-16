"use client";

import { useState } from "react";
import { SelectField } from "@/components/form-field";

export type CustomerOption = { id: string; name: string; vehicles: { id: string; plate: string; model: string }[] };

// Par de selects cliente → veículo: a lista de veículos mostra só os do cliente escolhido.
export function CustomerVehicleFields({
  customers,
  defaultCustomerId,
  defaultVehicleId,
  errors,
}: {
  customers: CustomerOption[];
  defaultCustomerId: string;
  defaultVehicleId: string;
  errors: { customerId?: string; vehicleId?: string };
}) {
  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [vehicleId, setVehicleId] = useState(defaultVehicleId);
  const vehicles = customers.find((c) => c.id === customerId)?.vehicles ?? [];

  return (
    <>
      <SelectField
        label="Cliente"
        name="customerId"
        required
        value={customerId}
        onChange={(ev) => {
          setCustomerId(ev.target.value);
          const list = customers.find((c) => c.id === ev.target.value)?.vehicles;
          setVehicleId(list?.length === 1 ? list[0].id : "");
        }}
        error={errors.customerId}
      >
        <option value="">Selecione…</option>
        {customers.map((c) => (
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
        error={errors.vehicleId}
      >
        <option value="">{customerId ? "Selecione…" : "Escolha o cliente primeiro"}</option>
        {vehicles.map((vh) => (
          <option key={vh.id} value={vh.id}>
            {vh.plate} · {vh.model}
          </option>
        ))}
      </SelectField>
    </>
  );
}
