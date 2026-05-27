<div align="center">

<img src="src/assets/banner.png" alt="AirAuction Cover Banner" width="100%" />

<br />

<a href="#overview">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=20&duration=3500&pause=900&color=2A6DF4&center=true&vCenter=true&width=900&lines=A+fully+on-chain+NFT+auction+protocol;AI+Auctioneer+with+verifiable+on-chain+receipts;IPFS-anchored+audit+trails+for+every+decision;Built+on+Mantle+Sepolia+%E2%80%A2+React+19+%E2%80%A2+TanStack+Start" alt="AirAuction tagline" />
</a>

<br /><br />

<p>
  <img src="https://img.shields.io/badge/Solidity-0.8.28-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Mantle_Sepolia-5003-2A6DF4?style=for-the-badge&logo=ethereum&logoColor=white" alt="Mantle Sepolia" />
  <img src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TanStack_Start-Latest-FF4154?style=for-the-badge&logo=react&logoColor=white" alt="TanStack Start" />
</p>
<p>
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Ethers.js-6-2535A0?style=for-the-badge&logo=ethereum&logoColor=white" alt="Ethers" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p>
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-Welcome-8b5cf6?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/Build-Passing-22c55e?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/Status-Active-2A6DF4?style=flat-square" alt="Status" />
</p>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

</div>

<br />

<div align="center">
  <h3>
    <a href="#overview">Overview</a>
    <span>&nbsp;&middot;&nbsp;</span>
    <a href="#screenshots">Screenshots</a>
    <span>&nbsp;&middot;&nbsp;</span>
    <a href="#architecture">Architecture</a>
    <span>&nbsp;&middot;&nbsp;</span>
    <a href="#tech-stack">Stack</a>
    <span>&nbsp;&middot;&nbsp;</span>
    <a href="#setup">Setup</a>
    <span>&nbsp;&middot;&nbsp;</span>
    <a href="#deployment">Deploy</a>
  </h3>
</div>

<br />

## Table of Contents

<table>
<tr><td>

1. [Overview](#overview)
2. [Screenshots](#screenshots)
3. [Architecture](#architecture)
4. [What Each Layer Does](#what-each-layer-does)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Smart Contract](#smart-contract)

</td><td>

8. [AI Auctioneer](#ai-auctioneer)
9. [Setup](#setup)
10. [Environment Variables](#environment-variables)
11. [Scripts](#scripts)
12. [Deployment](#deployment)
13. [Team](#team)
14. [License](#license)

</td></tr>
</table>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Overview

> **AirAuction** is an end-to-end English-auction marketplace for ERC-721 NFTs. Sellers escrow their NFT into a Solidity contract; bidders register with a refundable deposit and place bids on-chain; an AI Auctioneer narrates the lot, answers bidder questions, and writes a signed log of its reasoning to IPFS and an on-chain agent registry so every recommendation is auditable.

<table>
<thead>
<tr>
<th width="30%">Capability</th>
<th>How it works</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Trust-minimised escrow</strong></td>
<td>NFT custody and ETH deposits live inside <a href="blockchain/contracts/AuctionAirEscrow.sol"><code>AuctionAirEscrow.sol</code></a> — no custodial backend.</td>
</tr>
<tr>
<td><strong>Reserve + deposit model</strong></td>
<td>Sellers set a reserve price; bidders post a <code>depositBps</code> fraction of the starting bid to register, preventing wash bids.</td>
</tr>
<tr>
<td><strong>Atomic settlement</strong></td>
<td>A single <code>settle()</code> call transfers the NFT, pays the seller, deducts platform fees, and refunds losing deposits.</td>
</tr>
<tr>
<td><strong>AI-narrated lots</strong></td>
<td>The auctioneer agent generates lot copy and Q&amp;A; a hash of its input and output is stored on-chain via the agent benchmark contract.</td>
</tr>
<tr>
<td><strong>IPFS audit trail</strong></td>
<td>Each auction's metadata and agent transcript is pinned to IPFS through Pinata, returning an <code>ipfs://</code> CID referenced by both the contract and the UI.</td>
</tr>
<tr>
<td><strong>SSR-rendered frontend</strong></td>
<td>TanStack Start + Nitro deploys to Vercel as a hybrid SSR/edge app.</td>
</tr>
</tbody>
</table>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Screenshots

<div align="center">

| Landing | Dashboard | Live Auctions |
| :---: | :---: | :---: |
| <a href="src/routes/index.tsx"><img src="src/assets/img1.png" width="280" alt="Landing" /></a> | <a href="src/routes/dashboard/index.tsx"><img src="src/assets/img2.png" width="280" alt="Dashboard" /></a> | <a href="src/routes/dashboard/live.tsx"><img src="src/assets/img3.png" width="280" alt="Live" /></a> |
| Hero, live auction strip, volume + bidder stats | Personalised home — your auctions, watchlist, bid activity | Countdown, highest bid, one-click bidding |

| Scheduled | My NFTs | Raise Auction |
| :---: | :---: | :---: |
| <a href="src/routes/dashboard/scheduled.tsx"><img src="src/assets/img4.png" width="280" alt="Scheduled" /></a> | <a href="src/routes/dashboard/my-nfts.tsx"><img src="src/assets/img5.png" width="280" alt="My NFTs" /></a> | <a href="src/routes/dashboard/raise.tsx"><img src="src/assets/img6.png" width="280" alt="Raise" /></a> |
| Upcoming lots, register-ahead deposit flow | NFTs in your wallet via Reservoir — pick one to auction | Multi-step lot creation, approve + escrow in two tx |

<table>
<tr>
<td align="center" colspan="3">
<a href="src/routes/agents.tsx"><img src="src/assets/img7.png" width="600" alt="AI Auctioneer" /></a>
<br /><br />
<strong>AI Auctioneer</strong> — chat with on-chain receipt of the model call (input hash, output hash, tx hash on the benchmark contract).
</td>
</tr>
</table>

</div>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Architecture

```mermaid
flowchart LR
    subgraph Client["Browser"]
        UI["TanStack Router UI<br/>React 19 + Tailwind 4"]
        Wallet["MetaMask /<br/>EIP-1193 Provider"]
    end

    subgraph Edge["Vercel Edge / Nitro SSR"]
        SSR["TanStack Start<br/>server entry"]
        MW["errorMiddleware<br/>(src/start.ts)"]
    end

    subgraph Services["External Services"]
        Reservoir["Reservoir API<br/>(wallet NFT inventory)"]
        Pinata["Pinata<br/>(IPFS pinning)"]
        Agent["AI Auctioneer Backend<br/>(/api/auctioneer)"]
    end

    subgraph Chain["Mantle Sepolia"]
        Escrow["AuctionAirEscrow.sol<br/>(NFT + ETH escrow)"]
        NFT["ERC-721 collections"]
        Registry["Agent Identity +<br/>Reputation + Benchmark"]
    end

    UI -- "JSON-RPC / eth_*" --> Wallet
    UI -- "fetch /api/auctioneer" --> Agent
    UI -- "fetch /v7/users/.../tokens" --> Reservoir
    UI -- "pinJSONToIPFS" --> Pinata

    Wallet -- "createAuction / placeBid / settle" --> Escrow
    Escrow -- "safeTransferFrom" --> NFT
    Escrow -- "AuctionCreated / BidPlaced events" --> UI

    Agent -- "writes benchmark tx" --> Registry
    Agent -- "fetches model output" --> Pinata

    SSR --> UI
    MW --> SSR
```

<details>
<summary><strong>Bid lifecycle sequence</strong> — click to expand</summary>

<br />

```mermaid
sequenceDiagram
    actor Seller
    actor Bidder
    participant UI as Frontend (TanStack)
    participant NFT as ERC-721
    participant Escrow as AuctionAirEscrow
    participant Agent as AI Auctioneer
    participant IPFS as Pinata / IPFS

    Seller->>NFT: approve(escrow, tokenId)
    Seller->>UI: fill Raise Auction form
    UI->>IPFS: pinJSONToIPFS(metadata)
    IPFS-->>UI: ipfs://CID
    UI->>Escrow: createAuction(..., metadataURI)
    Escrow->>NFT: safeTransferFrom(seller, escrow, tokenId)
    Escrow-->>UI: emit AuctionCreated(auctionId)

    Bidder->>Escrow: registerForAuction(id) {deposit}
    Escrow-->>UI: emit BidderRegistered

    Bidder->>UI: ask auctioneer "is the reserve fair?"
    UI->>Agent: POST /api/auctioneer {context}
    Agent->>IPFS: pin reasoning log
    Agent-->>UI: reply + onchain receipt (txHash)

    Bidder->>Escrow: placeBid(id, amount)
    Escrow-->>UI: emit BidPlaced

    Note over Escrow: endTime reached
    Bidder->>Escrow: settle(id)
    Escrow->>NFT: transfer to winner
    Escrow->>Seller: pay (bid - fee)
    Escrow->>Bidder: refund losing deposits
```

</details>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## What Each Layer Does

| Layer | Folder / File | Responsibility |
| --- | --- | --- |
| **UI shell** | [`src/components/`](src/components/) | Reusable shadcn-style primitives: [`Navbar.tsx`](src/components/Navbar.tsx), [`AuctionCard.tsx`](src/components/AuctionCard.tsx), [`WalletButton.tsx`](src/components/WalletButton.tsx), [`ChatBubble.tsx`](src/components/ChatBubble.tsx). |
| **Routing** | [`src/routes/`](src/routes/) | File-based routes for landing, dashboard, single-auction view, and AI agent page. Tree generated into [`src/routeTree.gen.ts`](src/routeTree.gen.ts). |
| **State / hooks** | [`src/hooks/`](src/hooks/) | [`useAuctions.ts`](src/hooks/useAuctions.ts) loads escrow state, [`useCountdown.ts`](src/hooks/useCountdown.ts) ticks lot timers. |
| **Chain access** | [`src/services/auctionContract.ts`](src/services/auctionContract.ts) | Ethers v6 wrappers around the escrow contract: read auctions, place bids, settle, approve. |
| **NFT inventory** | [`src/services/nftApi.ts`](src/services/nftApi.ts) | Reservoir API client — fetches the connected wallet's NFTs for the *Raise Auction* picker. |
| **IPFS** | [`src/services/ipfs.ts`](src/services/ipfs.ts) | Pins auction + agent JSON via Pinata, returns `ipfs://CID`. |
| **AI** | [`src/services/aiAuctioneer.ts`](src/services/aiAuctioneer.ts) + [`src/services/agentRegistry.ts`](src/services/agentRegistry.ts) | Talks to the auctioneer backend, fetches on-chain agent identity / reputation. |
| **Config** | [`src/config/`](src/config/) | Env var schema ([`env.ts`](src/config/env.ts)) and supported chains. |
| **SSR entry** | [`src/start.ts`](src/start.ts) | TanStack Start instance with an `errorMiddleware` that catches non-HTTP throws and renders a branded error page. |
| **Router entry** | [`src/router.tsx`](src/router.tsx) | Builds the `Router` with a shared `QueryClient`. |
| **Smart contract** | [`blockchain/contracts/AuctionAirEscrow.sol`](blockchain/contracts/AuctionAirEscrow.sol) | The escrow, bid book, settlement, and refund logic. |
| **Deploy scripts** | [`blockchain/ignition/`](blockchain/ignition/), [`blockchain/scripts/`](blockchain/scripts/) | Hardhat Ignition module + helper scripts for Mantle Sepolia. |

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

#### Frontend

<p>
<img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/TanStack_Start-FF4154?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" />
<img src="https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radixui&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

</td>
<td valign="top" width="50%">

#### Web3 & Chain

<p>
<img src="https://img.shields.io/badge/Solidity_0.8.28-363636?style=for-the-badge&logo=solidity&logoColor=white" />
<img src="https://img.shields.io/badge/Ethers_v6-2535A0?style=for-the-badge&logo=ethereum&logoColor=white" />
<img src="https://img.shields.io/badge/Hardhat_3-FFF100?style=for-the-badge&logo=ethereum&logoColor=black" />
<img src="https://img.shields.io/badge/Mantle_Sepolia-2A6DF4?style=for-the-badge&logo=ethereum&logoColor=white" />
<img src="https://img.shields.io/badge/MetaMask-F6851B?style=for-the-badge&logo=metamask&logoColor=white" />
</p>

</td>
</tr>
<tr>
<td valign="top" width="50%">

#### AI & Storage

<p>
<img src="https://img.shields.io/badge/AI_Auctioneer-000000?style=for-the-badge&logo=openai&logoColor=white" />
<img src="https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white" />
<img src="https://img.shields.io/badge/Pinata-E4405F?style=for-the-badge&logo=pinata&logoColor=white" />
<img src="https://img.shields.io/badge/Reservoir-7C3AED?style=for-the-badge&logo=ethereum&logoColor=white" />
</p>

</td>
<td valign="top" width="50%">

#### Tooling & Hosting

<p>
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
<img src="https://img.shields.io/badge/Nitro-FFFC02?style=for-the-badge&logo=nuxtdotjs&logoColor=black" />
<img src="https://img.shields.io/badge/ESLint_9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" />
<img src="https://img.shields.io/badge/Prettier_3-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" />
<img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" />
</p>

</td>
</tr>
</table>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Project Structure

```text
AirAuction/
├── assets/                          # README screenshots (img1.png … img7.png)
├── blockchain/
│   ├── contracts/
│   │   └── AuctionAirEscrow.sol     # Core auction escrow
│   ├── ignition/modules/
│   │   └── AuctionAirEscrow.ts      # Hardhat Ignition deploy module
│   └── scripts/                     # Deploy / mint / agent registration helpers
├── Agent/                           # AI auctioneer backend (separate service)
├── src/
│   ├── components/                  # UI primitives + feature components
│   ├── config/
│   │   ├── env.ts                   # VITE_* env loader
│   │   └── chains.ts                # Supported chains + RPC config
│   ├── hooks/                       # useAuctions, useCountdown, use-mobile
│   ├── lib/                         # utils, format, error-page, error-capture
│   ├── routes/
│   │   ├── index.tsx                # Landing
│   │   ├── dashboard.tsx            # Dashboard shell + sidebar
│   │   ├── dashboard/
│   │   │   ├── index.tsx            # Dashboard home
│   │   │   ├── live.tsx             # Live auctions
│   │   │   ├── scheduled.tsx        # Scheduled auctions
│   │   │   ├── my-auctions.tsx      # Auctions I created
│   │   │   ├── my-nfts.tsx          # NFTs in my wallet
│   │   │   ├── bids.tsx             # My bid history
│   │   │   └── raise.tsx            # Create new auction
│   │   ├── agents.tsx               # AI Auctioneer chat
│   │   └── auction/$id.tsx          # Single auction detail
│   ├── services/                    # Contract / IPFS / NFT / AI clients
│   ├── types/                       # Shared TypeScript types
│   ├── router.tsx                   # TanStack Router setup
│   └── start.ts                     # TanStack Start instance + middleware
├── package.json
├── tsconfig.json
└── vite.config.ts                   # tanstackStart + nitro + tailwind + viteReact
```

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Smart Contract

[`AuctionAirEscrow.sol`](blockchain/contracts/AuctionAirEscrow.sol) is a single-file, non-upgradeable escrow contract.

<table>
<thead>
<tr><th>Function</th><th>Caller</th><th>Effect</th></tr>
</thead>
<tbody>
<tr><td><code>createAuction(...)</code></td><td>Seller</td><td>Transfers NFT into escrow, records reserve / starting / deposit / window, emits <code>AuctionCreated</code>.</td></tr>
<tr><td><code>registerForAuction(id)</code></td><td>Bidder</td><td>Posts a refundable ETH deposit (<code>startingBid * depositBps / 10_000</code>). Required before bidding.</td></tr>
<tr><td><code>placeBid(id, amount)</code></td><td>Registered bidder</td><td>Updates <code>highestBid</code> / <code>highestBidder</code>. Previous high bid is credited back to that bidder's withdrawable balance.</td></tr>
<tr><td><code>settle(id)</code></td><td>Anyone, after <code>endTime</code></td><td>If reserve met: transfers NFT to winner, pays seller (minus <code>platformFeeBps</code>), refunds losing deposits. Otherwise: returns NFT to seller.</td></tr>
<tr><td><code>withdrawRefund(id)</code></td><td>Outbid / unregistered bidder</td><td>Pulls back any owed ETH (pull-payments).</td></tr>
<tr><td><code>cancelUnstartedAuction(id)</code></td><td>Seller, before <code>startTime</code></td><td>Returns NFT, refunds any early deposits.</td></tr>
<tr><td><code>setFee(recipient, bps)</code></td><td>Owner</td><td>Updates platform fee (capped at 10%).</td></tr>
</tbody>
</table>

<details>
<summary><strong>Safety properties</strong> — click to expand</summary>

<br />

| Property | Implementation |
| --- | --- |
| **Re-entrancy** | Custom `nonReentrant` modifier on all state-changing entry points. |
| **NFT custody** | Implements `IERC721Receiver.onERC721Received` so it can receive via `safeTransferFrom`. |
| **Pull payments** | Losing bidders withdraw via `withdrawRefund` instead of being pushed ETH on every bid update — prevents griefing. |
| **Fee cap** | `MAX_PLATFORM_FEE_BPS = 1_000` (10%) and `MAX_DEPOSIT_BPS = 5_000` (50%) hard-coded. |
| **Self-bid block** | `placeBid` rejects the seller's address. |

</details>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## AI Auctioneer

The auctioneer is a separate Node service (under [`Agent/`](Agent/)) consumed by the frontend through `VITE_AGENT_API_URL`. Each call is **on-chain verifiable**:

```ts
askAuctioneer(context, userMessage)
   → POST {agentApiUrl}/api/auctioneer
   → returns { reply, model, latencyMs, agentId, onchain: { txHash, inputHash, outputHash, ... } }
```

| Concept | Where | Why |
| --- | --- | --- |
| **Agent identity** | `VITE_AGENT_IDENTITY_ADDRESS` | NFT-style identity contract — each agent has an `agentId` minted on-chain. |
| **Agent reputation** | `VITE_AGENT_REPUTATION_ADDRESS` | Scoring contract that aggregates user feedback on past calls. |
| **Agent benchmark** | `VITE_AGENT_BENCHMARK_ADDRESS` | Each model call writes `keccak256(input)` and `keccak256(output)` — anyone can replay the prompt and verify the hash. |

The frontend renders the `onchain` receipt in [`src/routes/agents.tsx`](src/routes/agents.tsx) as a small *View on explorer* link next to the reply.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Setup

### Prerequisites

- **Node.js 20+**
- **Package manager** — npm / bun / pnpm (this repo includes both `package-lock.json` and `bun.lock`)
- **MetaMask wallet** funded with Mantle Sepolia ETH ([faucet](https://faucet.sepolia.mantle.xyz))
- **API keys** — Pinata (IPFS), Reservoir (NFT inventory)

### 1. Install

```bash
npm install
```

### 2. Configure env

Copy the template and fill in your values:

```bash
cp .env.example .env.local   # if .env.example exists; otherwise create .env.local
```

See [Environment Variables](#environment-variables) below.

### 3. Compile + deploy contracts (optional — only if you want your own deployment)

```bash
cd blockchain
npm install
npm run compile
npm run deploy:mantle-sepolia:ignition
npm run deploy:agents:mantle-sepolia   # identity + reputation + benchmark
```

Copy the deployed addresses back into `.env.local` as `VITE_AUCTION_ESCROW_ADDRESS` and the three `VITE_AGENT_*_ADDRESS` vars.

### 4. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build → .vercel/output/
npm run preview  # preview the production build locally
```

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Environment Variables

All public env vars are prefixed `VITE_` so they're inlined by Vite at build time. The schema lives in [`src/config/env.ts`](src/config/env.ts).

<details open>
<summary><strong>Required & optional variables</strong></summary>

<br />

| Variable | Required | Purpose |
| --- | :---: | --- |
| `VITE_AUCTION_ESCROW_ADDRESS` | **yes** | Deployed `AuctionAirEscrow` address on Mantle Sepolia. |
| `VITE_PUBLIC_RPC_URL` | optional | Fallback RPC when wallet isn't connected. Defaults to the chain config. |
| `VITE_PINATA_JWT` | **yes** *(raising)* | Pinata API JWT for IPFS pinning. |
| `VITE_RESERVOIR_API_KEY` | **yes** *(My NFTs)* | Reservoir API key. |
| `VITE_RESERVOIR_BASE_URL` | optional | Override default Reservoir endpoint. |
| `VITE_NFT_CONTRACTS` | optional | Comma-separated allow-list of NFT contract addresses. |
| `VITE_AGENT_API_URL` | **yes** *(AI tab)* | URL of the Auctioneer backend. Defaults to `http://localhost:5050`. |
| `VITE_AGENT_IDENTITY_ADDRESS` | optional | Agent identity contract address. |
| `VITE_AGENT_REPUTATION_ADDRESS` | optional | Agent reputation contract address. |
| `VITE_AGENT_BENCHMARK_ADDRESS` | optional | Agent benchmark contract address. |
| `VITE_AGENT_ID` | optional | Numeric ID of the auctioneer agent to display. |

</details>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Scripts

<table>
<tr>
<td valign="top" width="50%">

#### Frontend ([`package.json`](package.json))

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR. |
| `npm run build` | Production build through Nitro. |
| `npm run build:dev` | Build with source maps, no minification. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | ESLint over the repo. |
| `npm run format` | Prettier write-mode. |

</td>
<td valign="top" width="50%">

#### Blockchain ([`blockchain/package.json`](blockchain/package.json))

| Script | What it does |
| --- | --- |
| `npm run compile` | `hardhat compile` — builds all contracts. |
| `npm run deploy:mantle-sepolia` | Runs the legacy deploy script. |
| `npm run deploy:mantle-sepolia:ignition` | Deploys via Hardhat Ignition (recommended). |
| `npm run mint:mantle-sepolia` | Mints a test NFT for trying the auction flow. |
| `npm run deploy:agents:mantle-sepolia` | Deploys identity + reputation + benchmark. |

</td>
</tr>
</table>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Deployment

This repo is configured for **Vercel** via the Nitro Vite plugin.

```mermaid
flowchart LR
    Push["git push"] --> Vercel["Vercel build"]
    Vercel --> Vite["vite build"]
    Vite --> Nitro["nitro emits<br/>.vercel/output/"]
    Nitro --> Functions["Vercel Functions<br/>(SSR + server fns)"]
    Nitro --> Static["Static assets<br/>(/assets)"]
    Functions --> Edge["Fluid Compute"]
    Static --> CDN["Vercel CDN"]
```

> **Vercel project settings** — leave Framework Preset on auto-detect, leave Output Directory blank. Nitro writes the `.vercel/output/` build manifest Vercel reads natively.
>
> **Do not** add a `vercel.json` with `rewrites` to `/index.html` — there is no `index.html` in an SSR build, and that rewrite returns 404 for every URL.

Required env vars in the Vercel dashboard: copy the same `VITE_*` variables from your `.env.local` into **Project Settings → Environment Variables**.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## Team

<div align="center">

<table>
<tr>
<td align="center" width="25%">
<strong>Prieyan MN</strong>
<br /><sub>Engineering</sub>
</td>
<td align="center" width="25%">
<strong>Sanjay E</strong>
<br /><sub>Engineering</sub>
</td>
<td align="center" width="25%">
<strong>MadhanRaj M</strong>
<br /><sub>Engineering</sub>
</td>
<td align="center" width="25%">
<strong>Lakshanika RSM</strong>
<br /><sub>Engineering</sub>
</td>
</tr>
</table>

</div>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" alt="" />

## License

Released under the **MIT License**. See [`LICENSE`](LICENSE) for details.

<br />

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,2,6,30,20&height=120&section=footer&fontSize=0&animation=fadeIn" width="100%" alt="" />

<sub>Crafted with care for the Mantle ecosystem &nbsp;&middot;&nbsp; <a href="#">Back to top</a></sub>

</div>