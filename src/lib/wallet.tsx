import { createContext, useContext, useState, type ReactNode } from "react";
import { mockWallet } from "./mockData";

interface WalletCtx {
  connected: boolean;
  address: string;
  connect: () => void;
  disconnect: () => void;
}
const Ctx = createContext<WalletCtx>({
  connected: false, address: "", connect: () => {}, disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  return (
    <Ctx.Provider value={{
      connected,
      address: mockWallet.address,
      connect: () => setConnected(true),
      disconnect: () => setConnected(false),
    }}>{children}</Ctx.Provider>
  );
}
export const useWallet = () => useContext(Ctx);
