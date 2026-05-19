/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_API_KEY?: string;
  readonly VITE_ALCHEMY_NETWORK?: string;
  readonly VITE_RESERVOIR_API_KEY?: string;
  readonly VITE_RESERVOIR_BASE_URL?: string;
  readonly VITE_PINATA_JWT?: string;
  readonly VITE_AUCTION_ESCROW_ADDRESS?: string;
  readonly VITE_PUBLIC_RPC_URL?: string;
  readonly VITE_GROQ_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: import("ethers").Eip1193Provider;
}
