"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, logout } from "@/lib/auth";

const navItems = [
  { href: "/bookings", label: "Bookings" },
  { href: "/bookings/new", label: "New Booking" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* BRAND */}
        <div className="app-brand">
          <div className="app-brand-mark">SA</div>

          <div className="app-brand-text">
            <span className="app-brand-title">SmartAccess</span>
            <span className="app-brand-subtitle">
              Guest access operations
            </span>
          </div>
        </div>

        {/* NAV SOLO SI LOGUEADO */}
        {isAuth && (
          <>
            <nav className="app-nav">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/bookings" &&
                    pathname.startsWith(item.href));

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

            {/* USER + LOGOUT */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Admin</span>

              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:opacity-80"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}