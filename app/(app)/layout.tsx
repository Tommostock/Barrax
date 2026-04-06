/* ============================================
   App Layout (Authenticated)
   Wraps all authenticated pages with the header,
   bottom navigation, and main content area.
   Uses a route group so this layout applies to
   all pages EXCEPT /auth/* and /onboarding.
   ============================================ */

import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/layout/InstallPrompt";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {/* Main content area — padded at bottom for the fixed nav bar */}
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <InstallPrompt />
    </>
  );
}
