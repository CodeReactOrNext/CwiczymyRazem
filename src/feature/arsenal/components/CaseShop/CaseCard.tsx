import { cn } from "assets/lib/utils";
import { FaGem } from "react-icons/fa";
import { RARITY_STYLES } from "../RarityBadge";
import type { CaseDefinition, GuitarRarity } from "../../types/arsenal.types";

const CASE_ACCENT: Record<string, { cardBg: string; button: string; header: string; iconColor: string }> = {
  standard: {
    cardBg: "bg-zinc-900/40 border-zinc-800",
    button: "bg-zinc-200 hover:bg-white text-zinc-900",
    header: "text-zinc-100",
    iconColor: "text-zinc-400",
  },
  premium: {
    cardBg: "bg-slate-900/40 border-blue-900/30",
    button: "bg-blue-600 hover:bg-blue-500 text-white",
    header: "text-blue-100",
    iconColor: "text-blue-400",
  },
  elite: {
    cardBg: "bg-amber-950/20 border-amber-900/30",
    button: "bg-amber-500 hover:bg-amber-400 text-amber-950",
    header: "text-amber-100",
    iconColor: "text-amber-500",
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

  const probs = Object.entries(caseDef.probabilities) as [GuitarRarity, number][];

  return (
    <div className={cn("flex flex-col gap-6 rounded-xl border p-6", accent.cardBg)}>
      {/* Header */}
      <div className="flex flex-col gap-1 items-center text-center">
        <h3 className={cn("text-base font-bold tracking-widest uppercase", accent.header)}>
          {caseDef.name}
        </h3>
      </div>

      {/* Package image */}
      <div className="flex items-center justify-center py-4">
        <img
          src={`/static/images/package/${caseDef.id}.png`}
          alt={caseDef.name}
          className="h-32 object-contain opacity-90"
        />
      </div>

      {/* Probabilities */}
      <div className="space-y-2 mt-2">
        {probs.map(([rarity, prob]) => {
          const rs = RARITY_STYLES[rarity];
          return (
            <div key={rarity} className="flex items-center justify-between text-xs">
              <span
                className="font-semibold uppercase tracking-wider"
                style={{ color: rs.baseColor }}
              >
                {rarity}
              </span>
              <div className="flex items-center gap-3">
                <div className="h-1 w-24 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(prob * 100, 100)}%`,
                      backgroundColor: rs.baseColor,
                    }}
                  />
                </div>
                <span className="font-medium text-zinc-400 w-10 text-right">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost & Open */}
      <div className="flex flex-col gap-4 mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium text-zinc-400">Cost</span>
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <FaGem className={canAfford ? accent.iconColor : "text-red-400"} size={12} />
            <span className={canAfford ? "text-zinc-100" : "text-red-400"}>
              {caseDef.fameCost} Fame
            </span>
          </div>
        </div>
        <button
          onClick={() => onOpen(caseDef.id)}
          disabled={!canAfford || isOpening}
          className={cn(
            "w-full rounded-lg py-3 text-xs font-bold uppercase tracking-widest transition-colors",
            !canAfford ? "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500" : accent.button,
            isOpening && "opacity-70 cursor-wait"
          )}
        >
          {isOpening ? "Opening..." : "Open Case"}
        </button>
      </div>
    </div>
  );
};
