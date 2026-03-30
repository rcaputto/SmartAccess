"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/bookings", label: "Bookings" },
  { href: "/bookings/new", label: "New Booking" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <div className="app-brand-mark">SA</div>

          <div className="app-brand-text">
            <span className="app-brand-title">SmartAccess</span>
            <span className="app-brand-subtitle">
              Guest access operations
            </span>
          </div>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/bookings" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-link ${isActive ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}