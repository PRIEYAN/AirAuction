import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { WalletButton } from "@/components/WalletButton";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        <Sidebar />
        <main className="min-h-screen flex-1">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 md:px-10">
            <div className="text-sm text-white/50">
              AuctionAir <span className="text-white">/ Dashboard</span>
            </div>
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
