import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BrowserProvider } from "ethers";
import { DEFAULT_CHAIN } from "@/config/chains";

interface WalletCtx {
  connected: boolean;
  address: string;
  chainId: number | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToDefaultChain: () => Promise<void>;
}

const Ctx = createContext<WalletCtx>({
  connected: false,
  address: "",
  chainId: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  switchToDefaultChain: async () => {},
});

const toHexChainId = (id: number) => `0x${id.toString(16)}`;

async function ensureChain(ethereum: NonNullable<typeof window.ethereum>) {
  const target = toHexChainId(DEFAULT_CHAIN.id);
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target }],
    });
  } catch (error: any) {
    if (error?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: target,
            chainName: `${DEFAULT_CHAIN.name} Sepolia Testnet`,
            nativeCurrency: DEFAULT_CHAIN.nativeCurrency,
            rpcUrls: [DEFAULT_CHAIN.rpcUrl],
            blockExplorerUrls: [DEFAULT_CHAIN.explorerUrl],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    const onAccountsChanged = (accounts: unknown) => {
      const next = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "";
      setAddress(next);
    };
    const onChainChanged = (next: unknown) => {
      if (typeof next === "string") setChainId(Number.parseInt(next, 16));
    };

    ethereum.request({ method: "eth_accounts" }).then(onAccountsChanged).catch(() => {});
    ethereum.request({ method: "eth_chainId" }).then(onChainChanged).catch(() => {});
    ethereum.on?.("accountsChanged", onAccountsChanged);
    ethereum.on?.("chainChanged", onChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const switchToDefaultChain = async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    await ensureChain(window.ethereum);
  };

  const connect = async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    setConnecting(true);
    try {
      await ensureChain(window.ethereum);
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
      chainId,
      connecting,
      connect,
      disconnect: () => setAddress(""),
      switchToDefaultChain,
    }}>{children}</Ctx.Provider>
  );
}
export const useWallet = () => useContext(Ctx);
