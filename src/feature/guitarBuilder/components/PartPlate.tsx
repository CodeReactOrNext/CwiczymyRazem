import { cn } from "assets/lib/utils";
import { dotWash } from "feature/arsenal/components/Workshop/blueprintPlate";
import type { ReactNode } from "react";

/**
 * The luthier's bench a Builder part lies on: warm dark wood, barely lit,
 * under a faint plotted dot grid. Its own material on purpose — mods
 * lie on blueprint navy, and a part must never pass for a mod at a glance.
 */
const BENCH_WASH =
  "radial-gradient(circle at 50% 45%, #241912 0%, #1d140e 60%, #160f0a 100%)";
const BENCH_DOT = "rgba(255,214,170,0.07)";

interface PartPlateProps {
  children: ReactNode;
  /** Fill the parent (a stash socket) instead of being its own rounded box. */
  fills?: boolean;
  className?: string;
}

export const PartPlate = ({ children, fills, className }: PartPlateProps) => (
  <span
    className={cn(
      "relative flex shrink-0 items-center justify-center overflow-hidden",
      fills ? "h-full w-full" : "rounded-lg",
      className,
    )}
    style={{
      backgroundImage: `${dotWash(BENCH_DOT)}, ${BENCH_WASH}`,
      backgroundSize: fills ? "12% 12%, cover" : "14px 14px, cover",
    }}>
    {children}
  </span>
);
