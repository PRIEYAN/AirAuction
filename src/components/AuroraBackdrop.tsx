export function AuroraBackdrop({
  className = "",
  intensity = "full",
}: {
  className?: string;
  intensity?: "full" | "soft";
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-grid-soft opacity-60" />

      <div className="absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full bg-fuchsia-500/30 blur-3xl animate-aurora-shift" />
      <div className="absolute top-1/4 right-[-12%] h-[36rem] w-[36rem] rounded-full bg-indigo-500/30 blur-3xl animate-aurora-shift [animation-delay:-8s]" />
      <div className="absolute bottom-[-18%] left-1/3 h-[40rem] w-[40rem] rounded-full bg-cyan-400/25 blur-3xl animate-aurora-shift [animation-delay:-14s]" />

      {intensity === "full" && (
        <>
          <div className="absolute top-1/3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_24px_8px_rgba(255,255,255,0.45)] animate-float-fast" />
          <div className="absolute top-2/3 left-1/4 h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_18px_4px_rgba(232,121,249,0.45)] animate-float-slow [animation-delay:-2s]" />
          <div className="absolute top-1/4 left-3/4 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_4px_rgba(103,232,249,0.45)] animate-float-slow [animation-delay:-4s]" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-scan-line" />
        </>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black" />
    </div>
  );
}
