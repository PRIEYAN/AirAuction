import { Link } from "@tanstack/react-router";
import { WalletButton } from "./WalletButton";

export function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5 md:px-12">
      <Link to="/" className="flex items-center gap-2 text-white">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-white to-white/40" />
        <span className="text-lg font-semibold tracking-tight">AuctionAir</span>
      </Link>
      <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
        <a href="#features" className="hover:text-white">Features</a>
        <a href="#live" className="hover:text-white">Live Auctions</a>
        <a href="#about" className="hover:text-white">About</a>
        <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
      </div>
      <WalletButton goDashboardOnConnect />
    </nav>
  );
}
