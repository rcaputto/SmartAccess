import "./globals.css";
import AppHeader from "@/app/components/layout/app-header";
import { ToastProvider } from "@/app/components/ui/toast";
import AuthGuard from "@/app/components/auth/auth-guard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="page-shell">
            <AppHeader />
              <AuthGuard>
                <main className="page-container page-content">{children}</main>
              </AuthGuard>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}