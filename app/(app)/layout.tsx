/* ============================================
   App Layout (Authenticated)
   Wraps all authenticated pages with the header,
   bottom navigation, and auth guard.
   No middleware needed — auth is checked client-side.
   ============================================ */

import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/layout/InstallPrompt";
import NotificationPermission from "@/components/layout/NotificationPermission";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Header />
      <main className="flex-1 pb-20 animate-page-enter">{children}</main>
      <BottomNav />
      <InstallPrompt />
      <NotificationPermission />
    </AuthGuard>
  );
}
