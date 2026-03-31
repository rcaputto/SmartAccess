"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuth = isAuthenticated();

    if (!isAuth && pathname !== "/login") {
      router.push("/login");
    }

    if (isAuth && pathname === "/login") {
      router.push("/bookings");
    }
  }, [pathname, router]);

  return <>{children}</>;
}