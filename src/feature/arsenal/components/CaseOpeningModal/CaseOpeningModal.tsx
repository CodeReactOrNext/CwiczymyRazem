"use client";

import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID, EFFECTS_BY_RARITY } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID, GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CaseDefinition, EffectDefinition, GuitarDefinition, GuitarRarity,OpenCaseResult } from "../../types/arsenal.types";
import { RARITY_GLOW_CLASS,RARITY_STYLES, RarityBadge } from "../RarityBadge";

const ITEM_WIDTH = 180;
const VISIBLE_ITEMS = 60;
const WIN_INDEX = 45;

type StripItem =
  | { kind: "guitar"; def: GuitarDefinition }
  | { kind: "effect"; def: EffectDefinition };

function buildRouletteStrip(caseDef: CaseDefinition, winItem: StripItem): StripItem[] {
  const rarities = Object.entries(caseDef.probabilities) as [GuitarRarity, number][];
  const strip: StripItem[] = [];

  for (let i = 0; i < VISIBLE_ITEMS; i++) {
    if (i === WIN_INDEX) {
      strip.push(winItem);
      continue;
    }

    let roll = Math.random();
    let chosen: GuitarRarity = "Common";
    for (const [rarity, prob] of rarities) {
      roll -= prob;
      if (roll <= 0) { chosen = rarity; break; }
    }

    if (Math.random() < 0.6) {
      const pool = GUITARS_BY_RARITY[chosen];
      if (pool && pool.length > 0) {
        strip.push({ kind: "guitar", def: pool[Math.floor(Math.random() * pool.length)] });
      } else {
        strip.push(winItem);
      }
    } else {
      const pool = EFFECTS_BY_RARITY[chosen] || EFFECTS_BY_RARITY["Common"] || [];
      if (pool.length > 0) {
        strip.push({ kind: "effect", def: pool[Math.floor(Math.random() * pool.length)] });
      } else {
        strip.push(winItem);
      }
    }
  }

  return strip;
}

interface CaseOpeningModalProps {
  result: OpenCaseResult | null;
  caseDef?: CaseDefinition;
  onClose: () => void;
}

export const CaseOpeningModal = ({ result, caseDef, onClose }: CaseOpeningModalProps) => {
  const [phase, setPhase] = useState<"idle" | "spinning" | "reveal" | "done">("idle");
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const isOpen = result !== null;
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const guitar = result?.type === "guitar" && result.guitar ? GUITARS_BY_ID.get(result.guitar.id) ?? null : null;
  const effect = result?.type === "effect" && result.effect ? EFFECTS_BY_ID.get(result.effect.id) ?? null : null;

  const winDef: StripItem | null = guitar
    ? { kind: "guitar", def: guitar }
    : effect
    ? { kind: "effect", def: effect }
    : null;

  const revealRarity = guitar?.rarity ?? effect?.rarity ?? null;
  const rarityStyles = revealRarity ? RARITY_STYLES[revealRarity] : null;

  const strip = useMemo(() => {
    if (!result || !caseDef || !winDef) return [];
    return buildRouletteStrip(caseDef, winDef);
  }, [result, caseDef]);

  useEffect(() => {
    if (!isOpen || !winDef || !caseDef) {
      setPhase("idle");
      return;
    }
    setPhase("spinning");
    const t1 = setTimeout(() => setPhase("reveal"), 5500);
    const t2 = setTimeout(() => setPhase("done"), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen, result]);

  const containerWidth = containerRef.current?.offsetWidth ?? 600;
  const centerOffset = containerWidth / 2 - ITEM_WIDTH / 2;
  const targetOffset = WIN_INDEX * ITEM_WIDTH - centerOffset;

  return (
    <AnimatePresence>
      {isOpen && strip.length > 0 && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto py-6 font-openSans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-lg"
            onClick={phase === "done" ? onClose : undefined}
          />

          {(phase === "reveal" || phase === "done") && rarityStyles && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{ background: `radial-gradient(circle at center, ${rarityStyles.baseColor}15 0%, transparent 70%)` }}
            />
          )}

          <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-4xl px-4 my-auto">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black uppercase tracking-[0.3em] text-zinc-300 drop-shadow-lg"
            >
              {caseDef?.name ?? "Opening Case"}
            </motion.h2>

            {/* Roulette */}
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-xl border-2 border-zinc-700/80 bg-zinc-950/90 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]"
              style={{ height: 220 }}
            >
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-30 w-[4px] bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9)]" />
              <div className="absolute inset-y-0 left-0 w-40 z-20 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-40 z-20 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />

              <motion.div
                ref={stripRef}
                className="flex items-center h-full"
                initial={{ x: 0 }}
                animate={phase !== "idle" ? { x: -targetOffset + (Math.random() * 20 - 10) } : { x: 0 }}
                transition={phase !== "idle" ? { duration: 5, ease: [0.15, 0.0, 0.07, 1.0] } : undefined}
              >
                {strip.map((item, i) => {
                  const rs = RARITY_STYLES[item.def.rarity];
                  const isWinner = i === WIN_INDEX && (phase === "reveal" || phase === "done");
                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-1"
                      style={{ width: ITEM_WIDTH }}
                    >
                      <div
                        className={cn(
                          "relative flex items-center justify-center rounded-xl w-[160px] h-[120px] border-b-[5px] transition-all duration-500 overflow-hidden",
                          isWinner ? "bg-zinc-800 scale-110" : "bg-zinc-900/80"
                        )}
                        style={{
                          borderBottomColor: rs.baseColor,
                          boxShadow: isWinner
                            ? `0 0 50px ${rs.baseColor}60, inset 0 0 25px ${rs.baseColor}20`
                            : `inset 0 0 15px ${rs.baseColor}10`,
                        }}
                      >
                        <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(180deg, ${rs.baseColor}25 0%, transparent 60%)` }} />
                        {item.kind === "guitar" ? (
                          <img
                            src={`/static/images/rank/${item.def.imageId}.png`}
                            alt={item.def.name}
                            className="relative z-10 h-24 w-24 -rotate-45 object-contain drop-shadow-2xl"
                          />
                        ) : (
                          <img
                            src={`/static/images/effects/${item.def.imageId}.png`}
                            alt={item.def.name}
                            className="relative z-10 h-20 w-20 object-contain drop-shadow-2xl"
                          />
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5" style={{ color: rs.baseColor }}>
                          {item.kind === "guitar" ? item.def.brand : item.def.type}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-center leading-tight truncate w-full" style={{ color: rs.baseColor }}>
                          {item.def.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Reveal */}
            <AnimatePresence>
              {(phase === "reveal" || phase === "done") && winDef && rarityStyles && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 20 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      className="absolute w-52 h-52 sm:w-80 sm:h-80 rounded-full blur-[100px]"
                      style={{ backgroundColor: `${rarityStyles.baseColor}40` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5 }}
                      transition={{ duration: 1 }}
                    />
                    <motion.div
                      className={cn(
                        "relative flex h-52 w-52 sm:h-80 sm:w-80 items-center justify-center rounded-3xl bg-zinc-950/90 border-b-8",
                        RARITY_GLOW_CLASS[winDef.def.rarity]
                      )}
                      style={{ borderBottomColor: rarityStyles.baseColor }}
                      animate={{
                        boxShadow: [
                          `0 0 20px ${rarityStyles.baseColor}00`,
                          `0 0 80px ${rarityStyles.baseColor}60`,
                          `0 0 20px ${rarityStyles.baseColor}00`,
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="absolute inset-0 rounded-3xl opacity-30" style={{ background: `radial-gradient(circle at center, ${rarityStyles.baseColor}30 0%, transparent 70%)` }} />
                      {winDef.kind === "guitar" ? (
                        <img
                          src={`/static/images/rank/${winDef.def.imageId}.png`}
                          alt={winDef.def.name}
                          className="relative z-10 h-44 w-44 sm:h-64 sm:w-64 -rotate-[35deg] object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]"
                        />
                      ) : (
                        <img
                          src={`/static/images/effects/${winDef.def.imageId}.png`}
                          alt={winDef.def.name}
                          className="relative z-10 h-40 w-40 sm:h-60 sm:w-60 object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]"
                        />
                      )}
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <RarityBadge rarity={winDef.def.rarity} size="lg" />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em] leading-none">
                        {winDef.kind === "guitar" ? winDef.def.brand : winDef.def.type}
                      </span>
                      <h3 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-lg text-center leading-tight">
                        {winDef.def.name}
                      </h3>
                      {winDef.kind === "guitar" && result?.newItem?.year && result?.newItem?.country && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{result.newItem.year}</span>
                          <span className="text-zinc-600 text-xs">·</span>
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{result.newItem.country}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <AnimatePresence>
              {phase === "done" && winDef && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full gap-4"
                >
                  {winDef.kind === "guitar" && guitar && (
                    <Button
                      onClick={() => equip({ guitarId: guitar.id, year: result?.newItem?.year, country: result?.newItem?.country }, { onSuccess: onClose })}
                      disabled={isEquipping}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-black uppercase tracking-widest h-12 text-sm"
                    >
                      Equip Now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest h-12 text-sm"
                  >
                    {winDef.kind === "guitar" ? "Keep in Arsenal" : "Add to Collection"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
