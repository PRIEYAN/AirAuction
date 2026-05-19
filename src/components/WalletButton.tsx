import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { truncateAddr } from "@/lib/mockData";
import { Wallet } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function WalletButton({ goDashboardOnConnect = false }: { goDashboardOnConnect?: boolean }) {
  const { connected, address, connect, disconnect } = useWallet();
  const navigate = useNavigate();
  if (!connected) {
    return (
      <Button
        onClick={() => {
          connect();
          if (goDashboardOnConnect) navigate({ to: "/dashboard" });
        }}
        className="rounded-full bg-white px-5 text-black hover:bg-white/90"
      >
        Connect Wallet
      </Button>
    );
  }
  return (
    <button
      onClick={disconnect}
      className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-white/10"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 text-[10px] font-bold text-black">
        <Wallet className="h-3 w-3" />
      </span>
      {truncateAddr(address)}
    </button>
  );
}
