import "./globals.css";
import AppHeader from "@/app/components/layout/app-header";
import { ToastProvider } from "@/app/components/ui/toast";

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
            <main className="page-container page-content">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}