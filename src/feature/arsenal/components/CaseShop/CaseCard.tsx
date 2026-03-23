import { cn } from "assets/lib/utils";
import { FaGem } from "react-icons/fa";
import { RARITY_STYLES } from "../RarityBadge";
import type { CaseDefinition, GuitarRarity } from "../../types/arsenal.types";

const CASE_ACCENT: Record<string, { border: string; glow: string; button: string; bg: string }> = {
  standard: {
    border: "border-zinc-700/60",
    glow: "hover:shadow-[0_0_30px_rgba(161,161,170,0.15)]",
    button: "bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500",
    bg: "bg-gradient-to-b from-zinc-800/80 to-zinc-950",
  },
  premium: {
    border: "border-blue-700/60",
    glow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]",
    button: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    bg: "bg-gradient-to-b from-blue-950/40 to-zinc-950",
  },
  elite: {
    border: "border-amber-600/60",
    glow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.3)]",
    button: "bg-amber-500 hover:bg-amber-400 text-amber-950 font-black border border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.4)]",
    bg: "bg-gradient-to-b from-amber-950/40 to-zinc-950",
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
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1",
        accent.bg,
        accent.border,
        accent.glow
      )}
    >
      <div className="flex flex-col gap-1 items-center text-center">
        <h3 className="text-lg font-black tracking-wide text-white uppercase drop-shadow-md">{caseDef.name}</h3>
      </div>

      {/* Package image */}
      <div className="flex items-center justify-center py-2">
        <img
          src={`/static/images/package/${caseDef.id}.png`}
          alt={caseDef.name}
          className="h-36 object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Probabilities */}
      <div className="space-y-1 bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/50">
        {probs.map(([rarity, prob]) => {
          const rs = RARITY_STYLES[rarity];
          return (
            <div key={rarity} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: rs.baseColor }}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: rs.baseColor }}
                >
                  {rarity}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-16 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(prob * 100, 100)}%`,
                      backgroundColor: rs.baseColor,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-[11px] font-black text-zinc-300 w-10 text-right">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost & Open */}
      <div className="flex flex-col gap-2 mt-auto pt-1">
        <div className="flex items-center justify-center gap-1.5 text-sm font-black tracking-wider bg-zinc-950/50 py-1.5 rounded-lg border border-zinc-800/50">
          <FaGem className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" size={14} />
          <span className={cn(canAfford ? "text-amber-400" : "text-red-400", "drop-shadow-md")}>
            {caseDef.fameCost} Fame
          </span>
        </div>
        <button
          onClick={() => onOpen(caseDef.id)}
          disabled={!canAfford || isOpening}
          className={cn(
            "w-full rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95",
            accent.button
          )}
        >
          {isOpening ? "Opening..." : "Open Case"}
        </button>
      </div>
    </div>
  );
};
