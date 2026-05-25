import type { ReactNode } from "react";

export function Marquee({
  children,
  className = "",
  speed = "normal",
}: {
  children: ReactNode;
  className?: string;
  speed?: "slow" | "normal" | "fast";
}) {
  const durations = { slow: "40s", normal: "26s", fast: "16s" };
  return (
    <div
      className={`group/marquee relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] ${className}`}
    >
      <div
        className="flex w-max items-center gap-12 animate-marquee group-hover/marquee:[animation-play-state:paused]"
        style={{ animationDuration: durations[speed] }}
      >
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
