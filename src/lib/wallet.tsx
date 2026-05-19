import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BrowserProvider } from "ethers";

interface WalletCtx {
  connected: boolean;
  address: string;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
const Ctx = createContext<WalletCtx>({
  connected: false,
  address: "",
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;
    const onAccountsChanged = (accounts: unknown) => {
      const next = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "";
      setAddress(next);
    };
    ethereum.request({ method: "eth_accounts" }).then(onAccountsChanged).catch(() => {});
    ethereum.on?.("accountsChanged", onAccountsChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
    };
  }, []);

  const connect = async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const nextAddress = await signer.getAddress();
      await signer.signMessage(`AuctionAir wallet verification\n\nAddress: ${nextAddress}`);
      setAddress(nextAddress);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Ctx.Provider value={{
      connected: Boolean(address),
      address,
      connecting,
      connect,
      disconnect: () => setAddress(""),
    }}>{children}</Ctx.Provider>
  );
}
export const useWallet = () => useContext(Ctx);
