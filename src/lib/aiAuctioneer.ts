type AuctionContext = {
  lotName: string;
  collection: string;
  traits: Array<{ type: string; value: string; rarity?: string }>;
  currentBidEth: number;
  reserveEth: number;
  bidderCount: number;
};

export async function askAuctioneer(context: AuctionContext, userMessage: string) {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!key) throw new Error("Missing VITE_GROQ_API_KEY for live AI auctioneer responses.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are AuctionAir, a concise live NFT auctioneer. Use only the supplied lot context. Never invent sales, rarity ranks, or wallet history.",
        },
        {
          role: "user",
          content: JSON.stringify({ context, userMessage }),
        },
      ],
      temperature: 0.8,
      max_tokens: 120,
    }),
  });

  if (!response.ok) throw new Error(`AI auctioneer failed: ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content?.trim() ?? "I need more on-chain context before answering that.";
}
