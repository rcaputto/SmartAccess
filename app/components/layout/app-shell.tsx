"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "./app-sidebar";
import AppTopBar from "./app-top-bar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <AppSidebar />
      <div className="app-layout-main">
        <AppTopBar />
        <main className="app-layout-content page-container page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
