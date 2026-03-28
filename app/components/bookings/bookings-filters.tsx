"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type UnitOption = {
  id: string;
  name: string;
  property: {
    name: string;
  };
};

type BookingsFiltersProps = {
  units: UnitOption[];
};

export default function BookingsFilters({ units }: BookingsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [unitId, setUnitId] = useState(searchParams.get("unitId") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const params = new URLSearchParams();

    if (status) params.set("status", status);
    if (unitId) params.set("unitId", unitId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const queryString = params.toString();
    router.push(queryString ? `/bookings?${queryString}` : "/bookings");
  }

  function handleReset() {
    setStatus("");
    setUnitId("");
    setFrom("");
    setTo("");
    router.push("/bookings");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CHECKED_OUT">CHECKED_OUT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Unidad
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} · {unit.property.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Desde
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Hasta
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Limpiar
        </button>

        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}