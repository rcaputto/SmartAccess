import "./globals.css";
import AuthGuard from "@/app/components/auth/auth-guard";
import AppShell from "@/app/components/layout/app-shell";
import Providers from "@/app/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <div className="page-shell">
            <AuthGuard>
              <AppShell>{children}</AppShell>
            </AuthGuard>
          </div>
        </Providers>
      </body>
    </html>
  );
}