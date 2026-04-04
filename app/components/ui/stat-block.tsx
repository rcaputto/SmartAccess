import type { ReactNode } from "react";

type StatBlockProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Resalta valores críticos (p. ej. errores) */
  tone?: "default" | "danger" | "warning";
};

export default function StatBlock({ label, value, hint, tone = "default" }: StatBlockProps) {
  const valueClass =
    tone === "danger"
      ? "text-[var(--danger)]"
      : tone === "warning"
        ? "text-[var(--warning)]"
        : "text-[var(--foreground)]";

  return (
    <div className="card">
      <div className="card-content">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
          {label}
        </div>
        <div className={`mt-2 text-2xl font-extrabold tabular-nums tracking-tight ${valueClass}`}>
          {value}
        </div>
        {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
      </div>
    </div>
  );
}
