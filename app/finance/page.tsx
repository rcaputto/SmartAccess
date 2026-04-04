import Link from "next/link";
import SectionHeader from "@/app/components/ui/section-header";
import { serverFetchJson } from "@/lib/server/server-fetch";

type PropertyRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
};

export default async function FinanceIndexPage() {
  const properties = await serverFetchJson<PropertyRow[]>("/api/properties");

  return (
    <div className="page-section mx-auto w-full max-w-7xl">
      <SectionHeader
        eyebrow="Panel"
        title="Finanzas"
        subtitle="Elige una propiedad para ver y editar su perfil financiero."
      />

      {properties.length === 0 ? (
        <div className="card card-content text-[var(--muted)]">
          No hay propiedades en tu organización. Crea una propiedad para
          empezar.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="card-title m-0 text-base">Propiedades</h2>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {properties.map((p) => {
              const meta = [p.city, p.country].filter(Boolean).join(" · ");
              return (
                <li key={p.id}>
                  <Link
                    href={`/finance/${p.id}`}
                    className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="m-0 font-semibold text-[var(--foreground)]">
                        {p.name}
                      </p>
                      {(p.address || meta) && (
                        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
                          {[p.address, meta].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-[var(--primary)]">
                      Abrir finanzas →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
