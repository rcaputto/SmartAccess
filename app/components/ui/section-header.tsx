import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`page-title-row items-start ${className}`.trim()}
    >
      <div className="page-title-block min-w-0">
        {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="toolbar-actions shrink-0">{actions}</div> : null}
    </div>
  );
}
