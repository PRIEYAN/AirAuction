import { Link } from "@tanstack/react-router";
import { WalletButton } from "./WalletButton";
import logo from "../assets/logo.png";

export function Navbar() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 text-white">
          <img src={logo} alt="AuctionAir Logo" className="h-8 w-8 rounded-full object-contain" />
          <span className="text-base font-semibold tracking-tight">AuctionAir</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#live" className="hover:text-white">Live Auctions</a>
          <a href="#about" className="hover:text-white">About</a>
          <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
        </div>

        <WalletButton goDashboardOnConnect />
      </div>
    </nav>
  );
}
