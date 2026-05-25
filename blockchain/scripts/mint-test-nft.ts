import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";
import { network } from "hardhat";

const RECIPIENT_OVERRIDE = process.env.RECIPIENT;
const EXISTING_ADDRESS = process.env.TEST_NFT_ADDRESS;
const MINT_COUNT = Math.max(1, Number(process.env.MINT_COUNT ?? 3));
const NETWORK = process.env.NETWORK ?? "mantleSepolia";
const EXPLORER = "https://explorer.sepolia.mantle.xyz";

const ART_TRAITS: Array<[string, string[]]> = [
  ["Background", ["Cosmic", "Void", "Neon", "Mist", "Ember"]],
  ["Body", ["Chrome", "Obsidian", "Ivory", "Solar", "Quartz"]],
  ["Eyes", ["Laser", "Hypnotic", "Glitch", "Solar", "Eclipse"]],
  ["Aura", ["Mythic", "Rare", "Epic", "Legendary", "Phantom"]],
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function buildMetadata(tokenIndex: number, recipient: string) {
  const seed = `aatest-${recipient.slice(2, 10).toLowerCase()}-${Date.now()}-${tokenIndex}`;
  return {
    name: `AuctionAir Test #${tokenIndex}`,
    description:
      "Testnet collectible minted by the AuctionAir mint script. Use it to exercise the auction escrow on Mantle Sepolia.",
    image: `https://picsum.photos/seed/${seed}/800/800`,
    external_url: "https://github.com/",
    attributes: ART_TRAITS.map(([type, values]) => ({
      trait_type: type,
      value: pick(values, tokenIndex),
    })),
  };
}

function encodeMetadataUri(metadata: object): string {
  const json = JSON.stringify(metadata);
  const base64 = Buffer.from(json, "utf8").toString("base64");
  return `data:application/json;base64,${base64}`;
}

const { ethers } = await network.connect({ network: NETWORK });
const [signer] = await ethers.getSigners();
const signerAddress = await signer.getAddress();
const chainId = Number((await ethers.provider.getNetwork()).chainId);
const recipient = RECIPIENT_OVERRIDE ?? signerAddress;

console.log(`Network:   ${NETWORK} (chainId ${chainId})`);
console.log(`Signer:    ${signerAddress}`);
console.log(`Recipient: ${recipient}`);

const balance = await ethers.provider.getBalance(signerAddress);
console.log(`Signer balance: ${ethers.formatEther(balance)} ${chainId === 5003 ? "MNT" : "ETH"}`);
if (balance === 0n) {
  throw new Error(
    "Signer has 0 native balance. Fund the deployer (e.g. https://faucet.sepolia.mantle.xyz) and retry.",
  );
}

let nftAddress = EXISTING_ADDRESS;
let nft;

if (!nftAddress) {
  console.log("\nDeploying TestNFT...");
  const factory = await ethers.getContractFactory("TestNFT");
  nft = await factory.deploy();
  const deployTx = nft.deploymentTransaction();
  console.log(`  tx: ${deployTx?.hash}`);
  await nft.waitForDeployment();
  nftAddress = await nft.getAddress();
  console.log(`  TestNFT deployed at ${nftAddress}`);
  if (chainId === 5003) console.log(`  Explorer: ${EXPLORER}/address/${nftAddress}`);
} else {
  console.log(`\nReusing TestNFT at ${nftAddress}`);
  nft = await ethers.getContractAt("TestNFT", nftAddress);
}

const minted: Array<{ tokenId: string; txHash: string; metadata: object }> = [];
console.log(`\nMinting ${MINT_COUNT} token(s) to ${recipient}...`);

for (let i = 0; i < MINT_COUNT; i++) {
  const tokenIndex = Number(await nft.nextTokenId());
  const metadata = buildMetadata(tokenIndex, recipient);
  const uri = encodeMetadataUri(metadata);

  const tx = await nft.mint(recipient, uri);
  const receipt = await tx.wait();
  const log = receipt?.logs.find((entry: any) => {
    try {
      const parsed = nft.interface.parseLog(entry);
      return parsed?.name === "Minted";
    } catch {
      return false;
    }
  });
  const tokenId = log ? nft.interface.parseLog(log)?.args.tokenId.toString() : String(tokenIndex);

  console.log(`  #${tokenId}  tx: ${tx.hash}`);
  minted.push({ tokenId, txHash: tx.hash, metadata });
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "deployments");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `test-nft.${NETWORK}.json`);

let existing: any = {};
if (existsSync(outFile)) {
  try {
    existing = JSON.parse(readFileSync(outFile, "utf8"));
  } catch {
    existing = {};
  }
}

writeFileSync(
  outFile,
  JSON.stringify(
    {
      network: NETWORK,
      chainId,
      address: nftAddress,
      explorer: chainId === 5003 ? `${EXPLORER}/address/${nftAddress}` : undefined,
      mints: [...(Array.isArray(existing.mints) ? existing.mints : []), ...minted.map((m) => ({
        ...m,
        recipient,
        mintedAt: new Date().toISOString(),
      }))],
    },
    null,
    2,
  ),
);

console.log(`\nSaved mint manifest to ${outFile}`);
console.log(`\nNext steps:`);
console.log(`  1. Add the contract to your frontend .env:`);
console.log(`       VITE_NFT_CONTRACTS=${nftAddress}`);
console.log(`  2. Reload the dashboard — the minted tokens will appear under "My NFTs".`);
console.log(`  3. List one for auction from /dashboard/raise to test the escrow.`);
