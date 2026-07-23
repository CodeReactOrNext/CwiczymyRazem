import { cn } from "assets/lib/utils";
import { PackageOpen } from "lucide-react";

interface OpenCaseButtonProps {
  canAfford: boolean;
  isOpening: boolean;
  onClick: () => void;
  className?: string;
}

/** The one Open Case button — identical across every case in the shop. */
export const OpenCaseButton = ({
  canAfford,
  isOpening,
  onClick,
  className,
}: OpenCaseButtonProps) => (
  <button
    onClick={onClick}
    disabled={!canAfford || isOpening}
    className={cn(
      "flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold capitalize tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      canAfford
        ? "bg-zinc-100 text-zinc-900 hover:bg-white"
        : "cursor-not-allowed bg-zinc-800 text-zinc-500 opacity-50",
      isOpening && "cursor-wait opacity-70",
      className
    )}>
    <PackageOpen size={14} strokeWidth={2.5} />
    {isOpening ? "Opening..." : "Open Case"}
  </button>
);
