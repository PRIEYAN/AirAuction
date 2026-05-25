import { useEffect, useState } from "react";

const DEFAULT_PHRASES = [
  "narrating live NFT auctions.",
  "benchmarked on Mantle.",
  "verifiable AI, on-chain.",
  "an open agent economy.",
];

export function TypingTagline({
  phrases = DEFAULT_PHRASES,
  className = "",
}: {
  phrases?: string[];
  className?: string;
}) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");

  useEffect(() => {
    const current = phrases[phraseIndex];
    if (phase === "typing") {
      if (text.length < current.length) {
        const id = setTimeout(() => setText(current.slice(0, text.length + 1)), 55);
        return () => clearTimeout(id);
      }
      const id = setTimeout(() => setPhase("holding"), 1400);
      return () => clearTimeout(id);
    }
    if (phase === "holding") {
      const id = setTimeout(() => setPhase("deleting"), 600);
      return () => clearTimeout(id);
    }
    if (phase === "deleting") {
      if (text.length > 0) {
        const id = setTimeout(() => setText(current.slice(0, text.length - 1)), 25);
        return () => clearTimeout(id);
      }
      setPhraseIndex((idx) => (idx + 1) % phrases.length);
      setPhase("typing");
    }
  }, [text, phase, phraseIndex, phrases]);

  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[2px] bg-current animate-blink-caret align-middle" />
    </span>
  );
}
