import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { WalletButton } from "@/components/WalletButton";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

function DashboardLayout() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,80,255,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(255,80,180,0.1),transparent_50%)]" />
      <div className="relative flex">
        <Sidebar />
        <main className="min-h-screen flex-1">
          <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur md:px-10">
            <div className="text-sm text-white/50">AuctionAir <span className="text-white">/ Dashboard</span></div>
            <WalletButton />
          </div>
          <div className="px-6 py-8 md:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
