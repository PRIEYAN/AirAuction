import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const NETWORK = process.env.NETWORK ?? "mantleSepolia";
const EXPLORER = "https://explorer.sepolia.mantle.xyz";

const AGENT_OPERATOR_OVERRIDE = process.env.AGENT_OPERATOR;
const AGENT_LABEL = process.env.AGENT_LABEL ?? "AuctionAir Auctioneer";
const AGENT_DOMAIN = process.env.AGENT_DOMAIN ?? "https://auctionair.local";
const AGENT_DESCRIPTION =
  process.env.AGENT_DESCRIPTION ??
  "AI auctioneer narrating live NFT auctions on Mantle. Records every decision on-chain via ERC-8004-aligned registries.";
const AGENT_METADATA_URI =
  process.env.AGENT_METADATA_URI ?? buildDefaultMetadata(AGENT_LABEL, AGENT_DOMAIN, AGENT_DESCRIPTION);

function buildDefaultMetadata(label: string, domain: string, description: string): string {
  const metadata = {
    name: label,
    domain,
    description,
    capabilities: ["narration", "auction-commentary", "qa"],
    model: "llama-3.3-70b-versatile",
    standards: ["ERC-8004"],
    createdAt: new Date().toISOString(),
  };
  const json = JSON.stringify(metadata);
  const base64 = Buffer.from(json, "utf8").toString("base64");
  return `data:application/json;base64,${base64}`;
}

const { ethers } = await network.connect({ network: NETWORK });
const [signer] = await ethers.getSigners();
const signerAddress = await signer.getAddress();
const chainId = Number((await ethers.provider.getNetwork()).chainId);
const operator = AGENT_OPERATOR_OVERRIDE ?? signerAddress;

console.log(`Network:  ${NETWORK} (chainId ${chainId})`);
console.log(`Deployer: ${signerAddress}`);
console.log(`Agent operator (will own agentId): ${operator}`);

const balance = await ethers.provider.getBalance(signerAddress);
console.log(`Balance:  ${ethers.formatEther(balance)} ${chainId === 5003 ? "MNT" : "ETH"}`);
if (balance === 0n) {
  throw new Error(
    "Deployer has 0 native balance. Fund the address via https://faucet.sepolia.mantle.xyz and retry.",
  );
}

console.log("\n[1/4] Deploying AgentIdentityRegistry...");
const identityFactory = await ethers.getContractFactory("AgentIdentityRegistry");
const identity = await identityFactory.deploy();
await identity.waitForDeployment();
const identityAddress = await identity.getAddress();
console.log(`  → ${identityAddress}`);

console.log("\n[2/4] Deploying AgentReputationRegistry...");
const reputationFactory = await ethers.getContractFactory("AgentReputationRegistry");
const reputation = await reputationFactory.deploy(identityAddress);
await reputation.waitForDeployment();
const reputationAddress = await reputation.getAddress();
console.log(`  → ${reputationAddress}`);

console.log("\n[3/4] Deploying AgentBenchmark...");
const benchmarkFactory = await ethers.getContractFactory("AgentBenchmark");
const benchmark = await benchmarkFactory.deploy(identityAddress);
await benchmark.waitForDeployment();
const benchmarkAddress = await benchmark.getAddress();
console.log(`  → ${benchmarkAddress}`);

console.log(`\n[4/4] Registering "${AGENT_LABEL}" identity to ${operator}...`);
const tx = await identity.registerAgent(
  operator,
  AGENT_LABEL,
  AGENT_DOMAIN,
  AGENT_DESCRIPTION,
  AGENT_METADATA_URI,
);
const receipt = await tx.wait();
let agentId: string | undefined;
for (const log of receipt?.logs ?? []) {
  try {
    const parsed = identity.interface.parseLog(log);
    if (parsed?.name === "AgentRegistered") {
      agentId = parsed.args.agentId.toString();
      break;
    }
  } catch {
    /* not from identity */
  }
}
if (!agentId) throw new Error("Failed to read AgentRegistered event; aborting manifest write.");
console.log(`  → agentId ${agentId}`);

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "deployments");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "agents.mantle-sepolia.json");

let merged: any = {};
if (existsSync(outFile)) {
  try {
    merged = JSON.parse(readFileSync(outFile, "utf8"));
  } catch {
    merged = {};
  }
}

const payload = {
  network: NETWORK,
  chainId,
  explorer: chainId === 5003 ? EXPLORER : undefined,
  contracts: {
    AgentIdentityRegistry: identityAddress,
    AgentReputationRegistry: reputationAddress,
    AgentBenchmark: benchmarkAddress,
  },
  primaryAgent: {
    agentId,
    operator,
    label: AGENT_LABEL,
    domain: AGENT_DOMAIN,
    description: AGENT_DESCRIPTION,
    metadataURI: AGENT_METADATA_URI,
    registeredAt: new Date().toISOString(),
  },
  agents: [...(Array.isArray(merged.agents) ? merged.agents : []), { agentId, operator, label: AGENT_LABEL }],
};

writeFileSync(outFile, JSON.stringify(payload, null, 2));
console.log(`\nSaved manifest to ${outFile}`);

console.log(`\n=== Add to your environment ===`);
console.log(`Frontend .env:`);
console.log(`  VITE_AGENT_IDENTITY_ADDRESS=${identityAddress}`);
console.log(`  VITE_AGENT_REPUTATION_ADDRESS=${reputationAddress}`);
console.log(`  VITE_AGENT_BENCHMARK_ADDRESS=${benchmarkAddress}`);
console.log(`  VITE_AGENT_ID=${agentId}`);
console.log(`\nAgent/.env (backend):`);
console.log(`  AGENT_IDENTITY_ADDRESS=${identityAddress}`);
console.log(`  AGENT_BENCHMARK_ADDRESS=${benchmarkAddress}`);
console.log(`  AGENT_ID=${agentId}`);
console.log(`  AGENT_OPERATOR_ADDRESS=${operator}`);
console.log(`  # AGENT_PRIVATE_KEY must control ${operator}`);
