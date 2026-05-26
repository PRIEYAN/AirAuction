import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/providers/WalletProvider";
import { truncateAddr } from "@/lib/format";
import { DEFAULT_CHAIN } from "@/config/chains";

export function WalletButton({
  goDashboardOnConnect = false,
}: {
  goDashboardOnConnect?: boolean;
}) {
  const { connected, address, chainId, connecting, connect, disconnect, switchToDefaultChain } = useWallet();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const onConnect = async () => {
    try {
      await connect();
      if (goDashboardOnConnect) navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (!connected) {
    return (
      <Button
        disabled={connecting}
        onClick={onConnect}
        className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-70"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  const onWrongChain = chainId !== null && chainId !== DEFAULT_CHAIN.id;

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        onClick={() => setOpen((next) => !next)}
        className={`flex items-center gap-2 rounded-full border bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10 ${
          onWrongChain ? "border-amber-400/40" : "border-white/15"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
          <Wallet className="h-3 w-3" />
        </span>
        <span className="font-mono">{truncateAddr(address)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/50 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Connected</div>
              <div className="truncate font-mono text-sm text-white">{truncateAddr(address)}</div>
            </div>
            <button
              onClick={copyAddress}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              title="Copy address"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs">
              <span className="text-white/40">Network</span>
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${onWrongChain ? "bg-amber-300" : "bg-emerald-300"}`} />
                <span className="text-white">
                  {onWrongChain
                    ? `Chain ${chainId} (wrong)`
                    : `${DEFAULT_CHAIN.name} Sepolia`}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs">
              <span className="text-white/40">Chain ID</span>
              <span className="font-mono text-white/70">{chainId ?? "—"}</span>
            </div>
          </div>

          {onWrongChain && (
            <button
              onClick={() => switchToDefaultChain().catch((err) => console.error(err))}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/15"
            >
              <Zap className="h-3.5 w-3.5" /> Switch to {DEFAULT_CHAIN.name} Sepolia
            </button>
          )}

          <a
            href={`${DEFAULT_CHAIN.explorerUrl}/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> View on Mantle Explorer
            </span>
            <span className="text-white/40">↗</span>
          </a>

          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/15"
          >
            <LogOut className="h-3.5 w-3.5" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
