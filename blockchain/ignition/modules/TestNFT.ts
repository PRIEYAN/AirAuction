import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestNFTModule = buildModule("TestNFTModule", (m) => {
  const nft = m.contract("TestNFT", []);
  return { nft };
});

export default TestNFTModule;
