"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function AppTopBar() {
  const router = useRouter();
  const { status } = useSession();

  function handleLogout() {
    signOut({ redirect: false }).finally(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="app-top-bar">
      <div className="app-top-bar-inner">
        <div className="app-top-bar-spacer" aria-hidden />
        <div className="app-top-bar-actions">
          {status === "loading" ? (
            <span className="app-top-bar-muted text-sm">Cargando…</span>
          ) : (
            <span className="app-top-bar-muted text-sm">Administrador</span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="app-top-bar-logout"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
