import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { getDailyPool, getNextDailyReset } from "feature/arsenal/data/dailyCase";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { RARITY_STYLES } from "../RarityBadge";
import { DropRates } from "./DropRates";
import { OpenCaseButton } from "./OpenCaseButton";

interface DailyCaseCardProps {
  currentFame: number;
  onOpen: (caseType: string) => void;
  isOpening: boolean;
}

const formatCountdown = (msLeft: number) => {
  const clamped = Math.max(0, msLeft);
  const d = Math.floor(clamped / 86_400_000);
  const h = Math.floor(clamped / 3_600_000) % 24;
  const m = Math.floor(clamped / 60_000) % 60;
  const s = Math.floor(clamped / 1000) % 60;
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, "0")}m`;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
};

export const DailyCaseCard = ({ currentFame, onOpen, isOpening }: DailyCaseCardProps) => {
  const caseDef = CASE_DEFINITIONS.daily;
  const canAfford = currentFame >= caseDef.fameCost;

  // Ticking clock drives both the countdown and the automatic pool rollover
  // at the rotation boundary (every 3 UTC days). Deriving the pool each tick
  // is trivial (seeded shuffle over the static catalog) and keeps it in sync.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pool = getDailyPool(now);
  const msLeft = getNextDailyReset(now).getTime() - now.getTime();

  return (
    // 1px shell showing the animated border underneath the card face.
    <div
      className='relative overflow-hidden rounded-lg p-px'
      style={{ background: "rgba(34,211,238,0.16)" }}>
      {/* Light beam travelling around the border — oversized rotating conic
          gradient; only the 1px ring around the opaque card face is visible. */}
      <motion.div
        className='pointer-events-none absolute -inset-full'
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 290deg, rgba(34,211,238,0.85) 340deg, transparent 360deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />

      <div
        className='relative flex h-full flex-col gap-5 overflow-hidden rounded-[7px] p-6'
        style={{
          background: "linear-gradient(160deg, #04202a 0%, #0a1318 45%, #07090c 100%)",
        }}>
      {/* Guitar icon watermark — same texture as /login */}
      <GuitarPatternBackground opacity={0.05} />

      {/* Soft cyan glows drifting in the background */}
      <div
        className='pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full blur-[60px] animate-glow-float-1'
        style={{
          background: "radial-gradient(circle at center, rgba(34,211,238,0.3) 0%, transparent 70%)",
        }}
      />
      <div
        className='pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full blur-[60px] animate-glow-float-2'
        style={{
          background: "radial-gradient(circle at center, rgba(34,211,238,0.28) 0%, transparent 70%)",
        }}
      />

      {/* Header + rotation countdown */}
      <div className='relative flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3
            className='bg-clip-text font-display text-2xl font-black tracking-wide text-transparent'
            style={{
              backgroundImage: "linear-gradient(180deg, #ffffff 20%, #22d3ee 135%)",
            }}>
            {caseDef.name}
          </h3>
          <p className='mt-1.5 text-sm text-zinc-400'>{caseDef.description}</p>
        </div>
        <div className='flex items-center gap-1.5 rounded bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold tabular-nums text-cyan-300'>
          <Clock3 size={13} />
          New pool in {formatCountdown(msLeft)}
        </div>
      </div>

      {/* Today's pool — the exact 10 items this case can drop */}
      <div className='relative grid grid-cols-2 gap-3 xsm:grid-cols-3 md:grid-cols-5'>
        {pool.map((entry) => {
          const rs = RARITY_STYLES[entry.def.rarity];
          const imageSrc =
            entry.kind === "guitar"
              ? getRankBadgeSrc(entry.def.imageId, "medium")
              : `/static/images/effects/${entry.def.imageId}.png`;
          return (
            <div
              key={`${entry.kind}-${entry.def.id}`}
              className='group relative flex flex-col overflow-hidden rounded-lg'
              style={{
                background: `linear-gradient(160deg, ${rs.baseColor}30 0%, rgba(13,15,18,0.95) 55%)`,
              }}
              title={`${entry.def.brand} ${entry.def.name} — ${entry.def.rarity}`}>
              {/* Rarity top stripe */}
              <div
                className='h-[2px] w-full flex-shrink-0'
                style={{
                  background: `linear-gradient(90deg, transparent, ${rs.baseColor}, transparent)`,
                }}
              />

              {/* Art with spotlight + rarity glow backdrop */}
              <div className='relative flex h-36 items-center justify-center overflow-hidden'>
                <div
                  className='pointer-events-none absolute inset-0'
                  style={{
                    background:
                      "radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 40%, transparent 72%)",
                  }}
                />
                <div
                  className='pointer-events-none absolute h-28 w-28 rounded-full blur-[28px] opacity-70 transition-opacity group-hover:opacity-100'
                  style={{
                    background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 50%, transparent 75%)`,
                  }}
                />
                <img
                  src={imageSrc}
                  alt={`${entry.def.brand} ${entry.def.name}`}
                  className={cn(
                    "relative z-10 h-32 w-32 object-contain",
                    entry.kind === "guitar" && "-rotate-90"
                  )}
                  style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))" }}
                  draggable={false}
                  loading='lazy'
                />
              </div>

              {/* Label */}
              <div className='px-2 pb-3 pt-1 text-center'>
                <p className='w-full truncate text-xs font-bold text-zinc-100'>
                  {entry.def.name}
                </p>
                <p
                  className='mt-0.5 w-full truncate text-[10px] font-semibold'
                  style={{ color: rs.baseColor }}>
                  {entry.def.brand} · {entry.def.rarity}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drop rates + cost + open */}
      <div className='relative flex flex-wrap items-center justify-between gap-4'>
        <DropRates probabilities={caseDef.probabilities} />

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1.5 text-sm font-bold'>
            <img
              src='/images/coin.png'
              alt='coin'
              className={cn("h-5 w-5 object-contain", !canAfford && "opacity-50 grayscale")}
            />
            <span className={canAfford ? "text-zinc-100" : "text-red-400"}>
              {caseDef.fameCost} Fame
            </span>
          </div>
          <OpenCaseButton
            canAfford={canAfford}
            isOpening={isOpening}
            onClick={() => onOpen(caseDef.id)}
            className='px-8'
          />
        </div>
      </div>
      </div>
    </div>
  );
};
