import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { WalletButton } from "./WalletButton";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-30 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/5 bg-black/60 py-3 backdrop-blur-xl"
          : "border-b border-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-12">
        <Link to="/" className="group flex items-center gap-2 text-white">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inset-0 rounded-md bg-gradient-to-br from-fuchsia-400 via-violet-400 to-cyan-400 opacity-80 blur-sm transition group-hover:opacity-100" />
            <span className="relative h-7 w-7 rounded-md bg-gradient-to-br from-white via-fuchsia-200 to-cyan-200" />
          </span>
          <span className="text-lg font-semibold tracking-tight">AuctionAir</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#live" className="transition hover:text-white">Live Auctions</a>
          <Link to="/agents" className="transition hover:text-white">Agents</Link>
          <Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
        </div>

        <WalletButton goDashboardOnConnect />
      </div>
    </nav>
  );
}
