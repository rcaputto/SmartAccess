"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/bookings",
    label: "Reservas",
    icon: IconCalendar,
  },
  {
    href: "/bookings/new",
    label: "Nueva reserva",
    icon: IconPlus,
  },
  {
    href: "/operations",
    label: "Operaciones",
    icon: IconOperations,
  },
  {
    href: "/finance",
    label: "Finanzas",
    icon: IconFinance,
  },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/bookings") {
    return (
      pathname === "/bookings" ||
      (pathname.startsWith("/bookings/") && !pathname.startsWith("/bookings/new"))
    );
  }
  if (href === "/bookings/new") {
    return pathname.startsWith("/bookings/new");
  }
  if (href === "/operations") {
    return pathname.startsWith("/operations");
  }
  if (href === "/finance") {
    return pathname.startsWith("/finance");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Navegación principal">
      <div className="app-sidebar-brand">
        <div className="app-brand-mark app-sidebar-brand-mark">SA</div>
        <div className="app-brand-text">
          <span className="app-sidebar-brand-title">SmartAccess</span>
          <span className="app-sidebar-brand-sub">Operaciones de acceso</span>
        </div>
      </div>

      <nav className="app-sidebar-nav">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`app-sidebar-link ${active ? "is-active" : ""}`}
            >
              <span className="app-sidebar-link-icon" aria-hidden>
                <Icon />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function IconOperations() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconFinance() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
