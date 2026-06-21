import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Info } from "lucide-react";

import type { CaseDefinition, GuitarRarity } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

const CASE_ACCENT: Record<
  string,
  { color: string; gradient: string; button: string; header: string; image: string }
> = {
  standard: {
    color: "#a1a1aa",
    gradient: "linear-gradient(160deg, #1a1a1f 0%, #101013 45%, #0b0b0d 100%)",
    button: "bg-zinc-200 hover:bg-white text-zinc-900",
    header: "text-zinc-100",
    image: "/images/case-2.png",
  },
  premium: {
    color: "#818cf8",
    gradient: "linear-gradient(160deg, #161425 0%, #0e0d1a 45%, #08070d 100%)",
    button: "bg-indigo-600 hover:bg-indigo-500 text-white",
    header: "text-indigo-100",
    image: "/images/case-3.png",
  },
  elite: {
    color: "#fbbf24",
    gradient: "linear-gradient(160deg, #1c1200 0%, #0d0900 45%, #080600 100%)",
    button: "",
    header: "text-amber-100",
    image: "/images/case-1.png",
  },
};

interface CaseCardProps {
  caseDef: CaseDefinition;
  currentFame: number;
  onOpen: (caseType: string) => void;
  isOpening: boolean;
}

export const CaseCard = ({ caseDef, currentFame, onOpen, isOpening }: CaseCardProps) => {
  const accent = CASE_ACCENT[caseDef.id] || CASE_ACCENT.standard;
  const canAfford = currentFame >= caseDef.fameCost;
  const isElite = caseDef.id === "elite";

  const probs = Object.entries(caseDef.probabilities) as [GuitarRarity, number][];

  return (
      <div
        className="relative flex flex-col gap-6 rounded-xl p-6 overflow-hidden"
        style={{ background: accent.gradient }}
      >
        {/* Package image */}
        <div className="relative flex items-center justify-center py-4 z-10">
          <img
            src={accent.image}
            alt={caseDef.name}
            className="h-52 object-contain relative z-10"
          />
        </div>

        {/* Case name */}
        <div className="relative z-10 -mt-2 text-center">
          <h3 className={cn("text-lg font-bold tracking-wide capitalize", accent.header)}>
            {caseDef.name}
          </h3>
        </div>

        {/* Drop rates — hidden behind a tooltip */}
        <div className="relative z-10 flex justify-center">
          <TooltipProvider>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Info size={12} />
                  Drop Rates
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="w-60 p-3 border border-zinc-700 bg-zinc-950">
                <div className="space-y-1.5">
                  {probs.map(([rarity, prob]) => {
                    const rs = RARITY_STYLES[rarity];
                    const logWidth = (Math.log10(prob * 100 + 1) / Math.log10(101)) * 100;
                    return (
                      <div key={rarity} className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-semibold capitalize tracking-wider w-16 flex-shrink-0"
                          style={{ color: rs.baseColor }}
                        >
                          {rarity}
                        </span>
                        <div className="h-1 flex-1 rounded bg-black/40 overflow-hidden">
                          <div
                            className="h-full rounded"
                            style={{ width: `${logWidth}%`, backgroundColor: rs.baseColor, opacity: 0.85 }}
                          />
                        </div>
                        <span
                          className="text-[11px] font-bold w-12 text-right flex-shrink-0"
                          style={{ color: rs.baseColor }}
                        >
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Cost & Open */}
        <div className="relative flex flex-col gap-4 mt-auto pt-6 z-10">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium text-zinc-400">Cost</span>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <img
                src="/images/coin.png"
                alt="coin"
                className={cn("h-5 w-5 object-contain", !canAfford && "grayscale opacity-50")}
              />
              <span className={canAfford ? "text-zinc-100" : "text-red-400"}>
                {caseDef.fameCost} Fame
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpen(caseDef.id)}
            disabled={!canAfford || isOpening}
            className={cn(
              "w-full rounded-lg py-3 text-xs font-bold capitalize tracking-widest transition-all",
              !canAfford
                ? "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500"
                : !isElite
                ? accent.button
                : "",
              isOpening && "opacity-70 cursor-wait"
            )}
            style={
              isElite && canAfford
                ? {
                    background: "linear-gradient(135deg, #b45309, #f59e0b, #b45309)",
                    color: "#0a0600",
                  }
                : undefined
            }
          >
            {isOpening ? "Opening..." : "Open Case"}
          </button>
        </div>
      </div>
  );
};
