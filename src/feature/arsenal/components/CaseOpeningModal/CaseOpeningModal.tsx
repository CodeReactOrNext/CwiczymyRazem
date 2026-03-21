"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { RarityBadge, RARITY_STYLES, RARITY_GLOW_CLASS } from "../RarityBadge";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import type { OpenCaseResult, CaseDefinition, GuitarDefinition, GuitarRarity } from "../../types/arsenal.types";

const ITEM_WIDTH = 180;
const VISIBLE_ITEMS = 60;
const WIN_INDEX = 45;

function buildRouletteStrip(caseDef: CaseDefinition, winGuitar: GuitarDefinition): GuitarDefinition[] {
  const rarities = Object.entries(caseDef.probabilities) as [GuitarRarity, number][];
  const strip: GuitarDefinition[] = [];

  for (let i = 0; i < VISIBLE_ITEMS; i++) {
    if (i === WIN_INDEX) {
      strip.push(winGuitar);
      continue;
    }

    let roll = Math.random();
    let chosen: GuitarRarity = "Common";
    for (const [rarity, prob] of rarities) {
      roll -= prob;
      if (roll <= 0) {
        chosen = rarity;
        break;
      }
    }

    const pool = GUITARS_BY_RARITY[chosen];
    if (pool && pool.length > 0) {
      strip.push(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      strip.push(winGuitar);
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
  const stripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const guitar = result ? GUITARS_BY_ID.get(result.guitar.id) : null;
  const rarityStyles = guitar ? RARITY_STYLES[guitar.rarity] : null;

  const strip = useMemo(() => {
    if (!result || !caseDef || !guitar) return [];
    return buildRouletteStrip(caseDef, guitar);
  }, [result, caseDef, guitar]);

  useEffect(() => {
    if (!isOpen || !guitar || !caseDef) {
      setPhase("idle");
      return;
    }

    setPhase("spinning");

    const spinTimer = setTimeout(() => {
      setPhase("reveal");
    }, 5500);

    const doneTimer = setTimeout(() => {
      setPhase("done");
    }, 7000);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(doneTimer);
    };
  }, [isOpen, result]);

  const handleEquip = () => {
    if (!guitar) return;
    equip(guitar.id, { onSuccess: onClose });
  };

  const containerWidth = containerRef.current?.offsetWidth ?? 600;
  const centerOffset = containerWidth / 2 - ITEM_WIDTH / 2;
  const targetOffset = WIN_INDEX * ITEM_WIDTH - centerOffset;

  return (
    <AnimatePresence>
      {isOpen && strip.length > 0 && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center font-openSans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-lg"
            onClick={phase === "done" ? onClose : undefined}
          />

          {phase === "reveal" || phase === "done" ? (
            rarityStyles && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{
                  background: `radial-gradient(circle at center, ${rarityStyles.baseColor}15 0%, transparent 70%)`,
                }}
              />
            )
          ) : null}

          <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-4xl px-4">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black uppercase tracking-[0.3em] text-zinc-300 drop-shadow-lg"
            >
              {caseDef?.name ?? "Opening Case"}
            </motion.h2>

            {/* Roulette Container */}
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-xl border-2 border-zinc-700/80 bg-zinc-950/90 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]"
              style={{ height: 220 }}
            >
              {/* Center indicator line */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-30 w-[4px] bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9)]" />

              {/* Left/Right fade */}
              <div className="absolute inset-y-0 left-0 w-40 z-20 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-40 z-20 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />

              {/* Scrolling strip */}
              <motion.div
                ref={stripRef}
                className="flex items-center h-full"
                initial={{ x: 0 }}
                animate={
                  phase !== "idle"
                    ? { x: -targetOffset + (Math.random() * 20 - 10) }
                    : { x: 0 }
                }
                transition={
                  phase !== "idle"
                    ? {
                        duration: 5,
                        ease: [0.15, 0.0, 0.07, 1.0],
                      }
                    : undefined
                }
              >
                {strip.map((g, i) => {
                  const rs = RARITY_STYLES[g.rarity];
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
                          isWinner
                            ? "bg-zinc-800 scale-110"
                            : "bg-zinc-900/80"
                        )}
                        style={{
                          borderBottomColor: rs.baseColor,
                          boxShadow: isWinner
                            ? `0 0 50px ${rs.baseColor}60, inset 0 0 25px ${rs.baseColor}20`
                            : `inset 0 0 15px ${rs.baseColor}10`,
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: `linear-gradient(180deg, ${rs.baseColor}25 0%, transparent 60%)`,
                          }}
                        />
                        <img
                          src={`/static/images/rank/${g.imageId}.png`}
                          alt={g.name}
                          className="relative z-10 h-24 w-24 -rotate-45 object-contain drop-shadow-2xl"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span
                          className="text-[8px] font-black uppercase tracking-[0.2em] text-center leading-none truncate w-full opacity-60 mb-0.5"
                          style={{ color: rs.baseColor }}
                        >
                          {g.brand}
                        </span>
                        <span
                          className="text-[11px] font-black uppercase tracking-wider text-center leading-tight truncate w-full"
                          style={{ color: rs.baseColor }}
                        >
                          {g.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Reveal section */}
            <AnimatePresence>
              {(phase === "reveal" || phase === "done") && guitar && rarityStyles && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 20 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      className="absolute w-80 h-80 rounded-full blur-[100px]"
                      style={{ backgroundColor: `${rarityStyles.baseColor}40` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5 }}
                      transition={{ duration: 1 }}
                    />
                    <motion.div
                      className={cn(
                        "relative flex h-80 w-80 items-center justify-center rounded-3xl bg-zinc-950/90 border-b-8",
                        RARITY_GLOW_CLASS[guitar.rarity]
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
                      <div
                        className="absolute inset-0 rounded-3xl opacity-30"
                        style={{
                          background: `radial-gradient(circle at center, ${rarityStyles.baseColor}30 0%, transparent 70%)`,
                        }}
                      />
                      <img
                        src={`/static/images/rank/${guitar.imageId}.png`}
                        alt={guitar.name}
                        className="relative z-10 h-64 w-64 -rotate-[35deg] object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]"
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <RarityBadge rarity={guitar.rarity} size="lg" />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em] leading-none">
                        {guitar.brand}
                      </span>
                      <h3 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-lg text-center leading-tight">
                        {guitar.name}
                      </h3>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <AnimatePresence>
              {phase === "done" && guitar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full gap-4"
                >
                  <Button
                    onClick={handleEquip}
                    disabled={isEquipping}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-black uppercase tracking-widest h-12 text-sm"
                  >
                    Equip Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest h-12 text-sm"
                  >
                    Keep in Arsenal
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
