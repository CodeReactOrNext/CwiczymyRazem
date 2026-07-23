import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { motion } from "framer-motion";

import type { CaseDefinition } from "../../types/arsenal.types";
import { DropRates } from "./DropRates";
import { OpenCaseButton } from "./OpenCaseButton";

/** Per-tier identity lives in the background + glow only — structure,
    typography and the button are identical across every case. */
const CASE_ACCENT: Record<string, { color: string; gradient: string; image: string }> = {
  standard: {
    color: "#a1a1aa",
    gradient: "linear-gradient(160deg, #1a1a1f 0%, #101013 45%, #0b0b0d 100%)",
    image: "/images/case-2.webp",
  },
  premium: {
    color: "#818cf8",
    gradient: "linear-gradient(160deg, #161425 0%, #0e0d1a 45%, #08070d 100%)",
    image: "/images/case-3.webp",
  },
  elite: {
    color: "#fbbf24",
    gradient: "linear-gradient(160deg, #1c1200 0%, #0d0900 45%, #080600 100%)",
    image: "/images/case-1.webp",
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

  return (
    // 1px shell showing the animated border underneath the card face.
    <div
      className='relative overflow-hidden rounded-lg p-px'
      style={{ background: `${accent.color}24` }}>
      {/* Light beam travelling around the border — oversized rotating conic
          gradient; only the 1px ring around the opaque card face is visible. */}
      <motion.div
        className='pointer-events-none absolute -inset-full'
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 290deg, ${accent.color}d9 340deg, transparent 360deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />

      <div
        className='relative flex h-full flex-col gap-4 overflow-hidden rounded-[7px] p-6'
        style={{ background: accent.gradient }}>
        {/* Guitar icon watermark — same texture as /login */}
        <GuitarPatternBackground opacity={0.05} />

        {/* Soft tier-colored glows drifting in the background */}
        <div
          className='pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full blur-[50px] animate-glow-float-1'
          style={{
            background: `radial-gradient(circle at center, ${accent.color}50 0%, transparent 70%)`,
          }}
        />
        <div
          className='pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full blur-[50px] animate-glow-float-2'
          style={{
            background: `radial-gradient(circle at center, ${accent.color}45 0%, transparent 70%)`,
          }}
        />

        {/* Case image with tier-colored glow backdrop */}
        <div className='relative flex items-center justify-center py-2'>
          <div
            className='pointer-events-none absolute h-28 w-48 rounded-full blur-[44px]'
            style={{
              background: `radial-gradient(ellipse at center, ${accent.color}40 0%, ${accent.color}12 55%, transparent 80%)`,
            }}
          />
          <img
            src={accent.image}
            alt={caseDef.name}
            className='relative z-10 h-44 object-contain'
            style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.55))" }}
            draggable={false}
          />
        </div>

        {/* Name + description */}
        <div className='relative text-center'>
          <h3
            className='bg-clip-text font-display text-2xl font-black tracking-wide text-transparent'
            style={{
              backgroundImage: `linear-gradient(180deg, #ffffff 20%, ${accent.color} 135%)`,
            }}>
            {caseDef.name}
          </h3>
          <p className='mt-1.5 text-sm text-zinc-400'>{caseDef.description}</p>
        </div>

        {/* Footer — drop rates, cost, uniform button */}
        <div className='relative mt-auto flex flex-col gap-4 pt-2'>
          <div className='flex items-center justify-between'>
            <DropRates probabilities={caseDef.probabilities} />
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
          </div>
          <OpenCaseButton
            canAfford={canAfford}
            isOpening={isOpening}
            onClick={() => onOpen(caseDef.id)}
            className='w-full'
          />
        </div>
      </div>
    </div>
  );
};
