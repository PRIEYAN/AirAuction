import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { NFT } from "@/lib/mockData";
import { NFTCard } from "@/components/NFTCard";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveNftForEscrow, createEscrowAuction } from "@/lib/auctionContract";
import { fetchCollectionFloorEth, fetchWalletNfts } from "@/lib/nftApi";
import { pinAuctionLogToIpfs } from "@/lib/ipfs";
import { useWallet } from "@/lib/wallet";
import { Check, ChevronLeft, ChevronRight, Loader2, PartyPopper } from "lucide-react";

export const Route = createFileRoute("/dashboard/raise")({ component: Raise });

function Raise() {
  const { connected, address, connect } = useWallet();
  const [step, setStep] = useState(0);
  const [nft, setNft] = useState<NFT | null>(null);
  const [walletNfts, setWalletNfts] = useState<NFT[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [reserve, setReserve] = useState("1.0");
  const [startingBid, setStartingBid] = useState("0.8");
  const [depositPct, setDepositPct] = useState("15");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [desc, setDesc] = useState("");
  const [done, setDone] = useState(false);
  const [floor, setFloor] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!connected || !address) return;
    setLoadingNfts(true);
    setError("");
    fetchWalletNfts(address)
      .then(setWalletNfts)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load wallet NFTs."))
      .finally(() => setLoadingNfts(false));
  }, [address, connected]);

  useEffect(() => {
    if (!nft) return;
    setFloor(null);
    fetchCollectionFloorEth(nft.contractAddress)
      .then(setFloor)
      .catch(() => setFloor(null));
  }, [nft]);

  const canNext = (step === 0 && nft) || (step === 1 && reserve && startingBid && start && end);

  const confirmListing = async () => {
    if (!nft) return;
    setError("");
    try {
      setStatus("Pinning auction datalog to IPFS...");
      const metadataURI = await pinAuctionLogToIpfs({
        kind: "auctionair.listing",
        seller: address,
        nft,
        reserveEth: reserve,
        startingBidEth: startingBid,
        floorEth: floor,
        startTime: start,
        endTime: end,
        description: desc,
        createdAt: new Date().toISOString(),
      });

      setStatus("Requesting NFT escrow approval in MetaMask...");
      await approveNftForEscrow(nft.contractAddress, nft.tokenId);

      setStatus("Creating on-chain auction and moving NFT into escrow...");
      await createEscrowAuction({
        nftContract: nft.contractAddress,
        tokenId: nft.tokenId,
        reserveEth: reserve,
        startingBidEth: startingBid,
        startTime: start,
        endTime: end,
        depositBps: Math.round(Number(depositPct) * 100),
        metadataURI,
      });

      setStatus("");
      setDone(true);
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Listing failed.");
    }
  };

  if (done) {
    return (
      <GlassCard className="mx-auto max-w-xl p-10 text-center">
        <PartyPopper className="mx-auto h-10 w-10 text-emerald-400" />
        <h2 className="mt-4 text-2xl font-semibold">Auction scheduled.</h2>
        <p className="mt-2 text-sm text-white/50">
          Your auction for <span className="text-white">{nft?.name}</span> is queued and will go live at the start time.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard/my-auctions"><Button className="rounded-full bg-white text-black hover:bg-white/90">View My Auctions</Button></Link>
          <Button variant="ghost" onClick={() => { setDone(false); setStep(0); setNft(null); }}>Create another</Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Raise an auction<span className="font-light italic text-white/40"> · step {step + 1} of 3</span>
        </h1>
      </header>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-white" : "bg-white/10"}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          {!connected ? (
            <GlassCard className="max-w-xl p-6">
              <h2 className="text-xl font-semibold">Connect your seller wallet</h2>
              <p className="mt-2 text-sm text-white/50">
                AuctionAir will request a signature, then fetch the NFTs owned by this wallet from Alchemy.
              </p>
              <Button onClick={connect} className="mt-5 rounded-full bg-white text-black hover:bg-white/90">
                Connect MetaMask
              </Button>
            </GlassCard>
          ) : loadingNfts ? (
            <GlassCard className="flex max-w-xl items-center gap-3 p-6 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Fetching wallet NFTs from Alchemy...
            </GlassCard>
          ) : walletNfts.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {walletNfts.map((n) => (
                <NFTCard key={n.id} nft={n} onClick={() => setNft(n)} selected={nft?.id === n.id} />
              ))}
            </div>
          ) : (
            <GlassCard className="max-w-xl p-6 text-sm text-white/60">
              No NFTs were returned for this wallet on the configured Alchemy network.
            </GlassCard>
          )}
        </>
      )}

      {step === 1 && nft && (
        <GlassCard className="max-w-2xl p-6">
          <div className="mb-6 flex items-center gap-4">
            <img src={nft.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <div>
              <div className="text-xs text-white/40">{nft.collection}</div>
              <div className="font-semibold">{nft.name}</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Collection floor">
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                {floor == null ? "No Reservoir floor found" : `${floor} ETH`}
              </div>
            </Field>
            <div />
            <Field label="Reserve price (ETH)">
              <Input value={reserve} onChange={(e) => setReserve(e.target.value)} className="border-white/10 bg-white/5" />
            </Field>
            <Field label="Starting bid (ETH)">
              <Input value={startingBid} onChange={(e) => setStartingBid(e.target.value)} className="border-white/10 bg-white/5" />
            </Field>
            <Field label="Bidder deposit (%)">
              <Input value={depositPct} onChange={(e) => setDepositPct(e.target.value)} className="border-white/10 bg-white/5" />
            </Field>
            <div />
            <Field label="Start date/time">
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="border-white/10 bg-white/5" />
            </Field>
            <Field label="End date/time">
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="border-white/10 bg-white/5" />
            </Field>
          </div>
          <Field label="Description" className="mt-4">
            <Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="What makes this piece special?" className="border-white/10 bg-white/5" />
          </Field>
        </GlassCard>
      )}

      {step === 2 && nft && (
        <GlassCard className="max-w-2xl p-6">
          <h3 className="text-xl font-semibold">Review</h3>
          <div className="mt-5 grid gap-3 text-sm">
            <Row k="NFT" v={nft.name} />
            <Row k="Collection" v={nft.collection} />
            <Row k="Chain" v={nft.chain} />
            <Row k="Reserve" v={`${reserve} ETH`} />
            <Row k="Starting bid" v={`${startingBid} ETH`} />
            <Row k="Bidder deposit" v={`${depositPct}%`} />
            <Row k="Floor" v={floor == null ? "No Reservoir floor found" : `${floor} ETH`} />
            <Row k="Starts" v={start || "—"} />
            <Row k="Ends" v={end || "—"} />
            <Row k="Description" v={desc || "—"} />
          </div>
          <p className="mt-5 text-xs text-white/40">
            MetaMask will open for approval if needed, then for the auction escrow transaction.
          </p>
        </GlassCard>
      )}

      {(error || status) && (
        <GlassCard className={`max-w-2xl p-4 text-sm ${error ? "text-red-200" : "text-white/70"}`}>
          {status || error}
        </GlassCard>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < 2 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}
            className="rounded-full bg-white text-black hover:bg-white/90">
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={Boolean(status)} onClick={confirmListing} className="rounded-full bg-white text-black hover:bg-white/90">
            {status ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Confirm
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: any) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-[10px] uppercase tracking-wider text-white/40">{label}</Label>
      {children}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-2">
      <span className="text-white/50">{k}</span>
      <span className="text-white">{v}</span>
    </div>
  );
}
