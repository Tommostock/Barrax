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
import WeighInReminder from "@/components/layout/WeighInReminder";
import WeeklySummary from "@/components/layout/WeeklySummary";
import WeeklyBriefing from "@/components/layout/WeeklyBriefing";
import PFTReminder from "@/components/layout/PFTReminder";
import SuppsReminder from "@/components/layout/SuppsReminder";
import AuthGuard from "@/components/layout/AuthGuard";
import RankUpOverlay from "@/components/ui/RankUpOverlay";
import ClassifiedOpBriefingOverlay from "@/components/mission/ClassifiedOpBriefingOverlay";
import HQDataProvider from "@/components/providers/HQDataProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* HQDataProvider lives at the layout level so the HQ cache
          survives tab switches -- children unmount/remount on route
          changes but the provider persists, so HQ re-renders
          instantly from the last snapshot instead of re-fetching. */}
      <HQDataProvider>
        <Header />
        <main className="flex-1 pb-28 animate-page-enter">{children}</main>
        <BottomNav />
        <InstallPrompt />
        <NotificationPermission />
        <WeighInReminder />
        <WeeklySummary />
        <WeeklyBriefing />
        <PFTReminder />
        <SuppsReminder />
        <RankUpOverlay />
        <ClassifiedOpBriefingOverlay />
      </HQDataProvider>
    </AuthGuard>
  );
}
