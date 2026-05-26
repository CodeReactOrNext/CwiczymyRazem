import { cn } from "assets/lib/utils";
import { Crown } from "lucide-react";

import type { CaseDefinition, GuitarRarity } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

const CASE_ACCENT: Record<string, { cardBg: string; button: string; header: string }> = {
  standard: {
    cardBg: "bg-zinc-900/40 border-zinc-800",
    button: "bg-zinc-200 hover:bg-white text-zinc-900",
    header: "text-zinc-100",
  },
  premium: {
    cardBg: "bg-slate-900/40 border-blue-900/30",
    button: "bg-blue-600 hover:bg-blue-500 text-white",
    header: "text-blue-100",
  },
  elite: {
    cardBg: "",
    button: "",
    header: "text-amber-100",
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
    <>
      {isElite && (
        <style>{`
          @keyframes elite-shimmer {
            0% { transform: translateX(-150%) skewX(-20deg); }
            100% { transform: translateX(400%) skewX(-20deg); }
          }
          @keyframes elite-pulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
        `}</style>
      )}

      <div
        className={cn(
          "relative flex flex-col gap-6 rounded-lg border p-6 overflow-hidden",
          !isElite && accent.cardBg
        )}
        style={
          isElite
            ? {
                background: "linear-gradient(160deg, #1c1200 0%, #0d0900 45%, #080600 100%)",
                border: "1px solid rgba(251,191,36,0.35)",
                boxShadow:
                  "0 0 40px rgba(251,191,36,0.07), 0 0 80px rgba(251,191,36,0.03), inset 0 1px 0 rgba(251,191,36,0.12)",
              }
            : undefined
        }
      >
        {/* Elite shimmer sweep */}
        {isElite && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg" style={{ zIndex: 0 }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "45%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.07), transparent)",
                animation: "elite-shimmer 4.5s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {/* Elite corner glows */}
        {isElite && (
          <>
            <div
              className="absolute top-0 left-0 w-28 h-28 pointer-events-none"
              style={{ background: "radial-gradient(circle at 0% 0%, rgba(251,191,36,0.14) 0%, transparent 70%)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-28 h-28 pointer-events-none"
              style={{ background: "radial-gradient(circle at 100% 100%, rgba(251,191,36,0.09) 0%, transparent 70%)" }}
            />
          </>
        )}

        {/* Header */}
        <div className="relative flex flex-col gap-1 items-center text-center z-10">
          {isElite && (
            <div
              className="flex items-center gap-1.5 mb-1"
              style={{ animation: "elite-pulse 2.8s ease-in-out infinite" }}
            >
              <Crown size={11} strokeWidth={2} style={{ color: "#fbbf24" }} />
              <span className="text-[8px] font-black tracking-[0.35em] uppercase" style={{ color: "#fbbf24" }}>
                Premium
              </span>
              <Crown size={11} strokeWidth={2} style={{ color: "#fbbf24" }} />
            </div>
          )}
          <h3 className={cn("text-base font-bold tracking-widest capitalize", accent.header)}>
            {caseDef.name}
          </h3>
        </div>

        {/* Package image */}
        <div className="relative flex items-center justify-center py-4 z-10">
          {isElite && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 85% 85% at 50% 50%, rgba(251,191,36,0.1) 0%, transparent 70%)",
              }}
            />
          )}
          <img
            src={`/static/images/package/${caseDef.id}.png`}
            alt={caseDef.name}
            className="h-32 object-contain opacity-90 relative z-10"
            style={isElite ? { filter: "drop-shadow(0 0 18px rgba(251,191,36,0.35))" } : undefined}
          />
        </div>

        {/* Probabilities — log scale so every rarity is visible */}
        <div className="relative space-y-1.5 mt-2 z-10">
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

        {/* Cost & Open */}
        <div
          className="relative flex flex-col gap-4 mt-auto pt-4 z-10"
          style={{
            borderTop: isElite
              ? "1px solid rgba(251,191,36,0.15)"
              : "1px solid rgba(255,255,255,0.05)",
          }}
        >
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
                    boxShadow: "0 0 22px rgba(251,191,36,0.28), 0 4px 14px rgba(0,0,0,0.5)",
                  }
                : undefined
            }
          >
            {isOpening ? "Opening..." : "Open Case"}
          </button>
        </div>
      </div>
    </>
  );
};
