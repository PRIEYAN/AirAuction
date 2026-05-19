import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuctionAirEscrowModule = buildModule("AuctionAirEscrowModule", (m) => {
  const feeRecipient = m.getParameter("feeRecipient", m.getAccount(0));
  const platformFeeBps = m.getParameter("platformFeeBps", 250);

  const escrow = m.contract("AuctionAirEscrow", [feeRecipient, platformFeeBps]);

  return { escrow };
});

export default AuctionAirEscrowModule;
