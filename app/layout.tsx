import "./globals.css";
import AppHeader from "@/app/components/layout/app-header";
import AuthGuard from "@/app/components/auth/auth-guard";
import Providers from "@/app/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="page-shell">
            <AppHeader />
            <AuthGuard>
              <main className="page-container page-content">{children}</main>
            </AuthGuard>
          </div>
        </Providers>
      </body>
    </html>
  );
}