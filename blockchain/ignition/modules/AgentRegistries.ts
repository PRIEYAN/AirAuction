import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentRegistriesModule = buildModule("AgentRegistriesModule", (m) => {
  const identity = m.contract("AgentIdentityRegistry", []);
  const reputation = m.contract("AgentReputationRegistry", [identity]);
  const benchmark = m.contract("AgentBenchmark", [identity]);
  return { identity, reputation, benchmark };
});

export default AgentRegistriesModule;
