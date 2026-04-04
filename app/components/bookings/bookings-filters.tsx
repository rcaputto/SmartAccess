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
    <form onSubmit={handleSubmit} className="card mb-8">
      <div className="card-header">
        <h2 className="card-title">Filtros</h2>
        <p className="card-description">Refina la lista por estado, unidad o fechas.</p>
      </div>
      <div className="card-content">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="field-group">
          <label className="field-label">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select"
          >
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CHECKED_OUT">CHECKED_OUT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">
            Unidad
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="select"
          >
            <option value="">Todas</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} · {unit.property.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>

        <div className="field-group">
          <label className="field-label">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="toolbar-actions mt-6 justify-end border-t border-[var(--border)] pt-4">
        <button type="button" onClick={handleReset} className="btn btn-secondary btn-sm">
          Limpiar
        </button>

        <button type="submit" className="btn btn-primary btn-sm">
          Aplicar filtros
        </button>
      </div>
      </div>
    </form>
  );
}