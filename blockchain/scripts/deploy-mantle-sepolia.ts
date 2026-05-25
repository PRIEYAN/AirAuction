import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 250);
const FEE_RECIPIENT_OVERRIDE = process.env.FEE_RECIPIENT;
const EXPLORER = "https://explorer.sepolia.mantle.xyz";

const { ethers } = await network.connect({ network: "mantleSepolia" });

const chainId = Number((await ethers.provider.getNetwork()).chainId);
if (chainId !== 5003) {
  throw new Error(`Connected to chainId ${chainId}, expected 5003 (Mantle Sepolia).`);
}

const [deployer] = await ethers.getSigners();
const deployerAddress = await deployer.getAddress();
const balance = await ethers.provider.getBalance(deployerAddress);
console.log(`Deployer: ${deployerAddress}`);
console.log(`Balance:  ${ethers.formatEther(balance)} MNT`);

if (balance === 0n) {
  throw new Error(
    "Deployer has 0 MNT. Fund via https://faucet.sepolia.mantle.xyz before retrying.",
  );
}

const feeRecipient = FEE_RECIPIENT_OVERRIDE ?? deployerAddress;
console.log(`Fee recipient:    ${feeRecipient}`);
console.log(`Platform fee bps: ${PLATFORM_FEE_BPS}`);

const factory = await ethers.getContractFactory("AuctionAirEscrow");
const contract = await factory.deploy(feeRecipient, PLATFORM_FEE_BPS);
const deployTx = contract.deploymentTransaction();
console.log(`Submitted deploy tx: ${deployTx?.hash}`);

await contract.waitForDeployment();
const address = await contract.getAddress();
console.log(`\nAuctionAirEscrow deployed at: ${address}`);
console.log(`Explorer: ${EXPLORER}/address/${address}`);

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "deployments");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "mantle-sepolia.json");
writeFileSync(
  outFile,
  JSON.stringify(
    {
      network: "mantleSepolia",
      chainId,
      explorer: EXPLORER,
      contracts: {
        AuctionAirEscrow: {
          address,
          feeRecipient,
          platformFeeBps: PLATFORM_FEE_BPS,
          deployer: deployerAddress,
          txHash: deployTx?.hash ?? null,
          deployedAt: new Date().toISOString(),
        },
      },
    },
    null,
    2,
  ),
);
console.log(`\nSaved deployment manifest to ${outFile}`);
console.log(`\nNext: set VITE_AUCTION_ESCROW_ADDRESS=${address} in the frontend .env`);
console.log(`      set VITE_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz`);
