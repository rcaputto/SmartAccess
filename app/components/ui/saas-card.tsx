import type { ReactNode } from "react";

type SaasCardProps = {
  children: ReactNode;
  className?: string;
  /** Si no hay título, solo se aplica padding al contenedor */
  title?: string;
  description?: string;
  /** Contenido extra en la cabecera (p. ej. botones) */
  headerRight?: ReactNode;
};

export default function SaasCard({
  children,
  className = "",
  title,
  description,
  headerRight,
}: SaasCardProps) {
  const hasHeader = Boolean(title || description || headerRight);

  return (
    <section className={`card ${className}`.trim()}>
      {hasHeader ? (
        <div className="card-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="card-title">{title}</h2> : null}
            {description ? <p className="card-description">{description}</p> : null}
          </div>
          {headerRight ? <div className="flex shrink-0 flex-wrap gap-2">{headerRight}</div> : null}
        </div>
      ) : null}
      <div className="card-content">{children}</div>
    </section>
  );
}
