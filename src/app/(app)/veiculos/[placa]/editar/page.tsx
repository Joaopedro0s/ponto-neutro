import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/action-button";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePlate } from "@/lib/format";
import { deleteVehicle, updateVehicle } from "../../../clientes/actions";
import { VehicleForm } from "../../../clientes/vehicle-form";

export const metadata: Metadata = { title: "Editar veículo" };

export default async function EditVehiclePage({ params }: PageProps<"/veiculos/[placa]/editar">) {
  await requireUser();
  const plate = normalizePlate((await params).placa);
  const vehicle = plate && (await db.vehicle.findUnique({ where: { plate } }));
  if (!vehicle) notFound();

  return (
    <>
      <PageHeader title="Editar veículo" back={{ href: `/veiculos/${vehicle.plate}`, label: vehicle.plate }} />
      <div className="max-w-xl">
        <VehicleForm action={updateVehicle.bind(null, vehicle.id)} vehicle={vehicle} cancelHref={`/veiculos/${vehicle.plate}`} />
      </div>

      <section aria-labelledby="excluir" className="mt-10 max-w-xl border-t pt-6">
        <h2 id="excluir" className="font-medium">
          Excluir veículo
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Só é possível excluir veículos sem agendamentos, orçamentos ou ordens de serviço.
        </p>
        <ActionButton
          action={deleteVehicle.bind(null, vehicle.id)}
          label="Excluir veículo"
          confirmMessage={`Excluir o veículo ${vehicle.plate}? Esta ação não pode ser desfeita.`}
        />
      </section>
    </>
  );
}
