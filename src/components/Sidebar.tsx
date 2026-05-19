import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Radio, Calendar, Image, Gavel, History, Plus, LogOut,
} from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { truncateAddr, mockWallet } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/live", label: "Live Auctions", icon: Radio },
  { to: "/dashboard/scheduled", label: "Scheduled", icon: Calendar },
  { to: "/dashboard/my-nfts", label: "My NFTs", icon: Image },
  { to: "/dashboard/my-auctions", label: "My Auctions", icon: Gavel },
  { to: "/dashboard/bids", label: "Bid History", icon: History },
  { to: "/dashboard/raise", label: "Raise Auction", icon: Plus },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { disconnect, address } = useWallet();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-black/40 p-5 backdrop-blur-xl md:flex">
      <Link to="/" className="mb-8 flex items-center gap-2 text-white">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-white to-white/40" />
        <span className="text-lg font-semibold tracking-tight">AuctionAir</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to} to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-[10px] uppercase tracking-wider text-white/40">Wallet</div>
        <div className="mt-1 text-sm text-white">{truncateAddr(address || mockWallet.address)}</div>
        <button onClick={disconnect} className="mt-2 flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
          <LogOut className="h-3 w-3" /> Disconnect
        </button>
      </div>
    </aside>
  );
}
