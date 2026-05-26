import { network } from "hardhat";

async function main() {
  const NETWORK = "mantleSepolia";
  const { ethers } = await network.connect({ network: NETWORK });
  const contractAddress = "0xf460f828172dd80b30410cECC6Ec511cBB013388";
  const ownerAddress = "0x348B754103e12434AEe3Df42471aD939911939Dd";

  const ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function name() view returns (string)",
  ];

  try {
    const contract = await ethers.getContractAt(ABI, contractAddress);
    console.log("Fetching contract name...");
    const name = await contract.name();
    console.log("Contract Name:", name);

    console.log("Querying filter from block 0...");
    try {
      const filter = contract.filters.Transfer(null, ownerAddress);
      const events = await contract.queryFilter(filter, 0, "latest");
      console.log(`Successfully fetched ${events.length} Transfer events from block 0.`);
    } catch (e: any) {
      console.error("FAILED fetching from block 0:", e.message);
    }
  } catch (err: any) {
    console.error("General error:", err.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
