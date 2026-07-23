"use client";

import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { getDailyPool } from "feature/arsenal/data/dailyCase";
import { EFFECTS_BY_ID, EFFECTS_BY_RARITY } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID, GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { useSellGuitar } from "feature/arsenal/hooks/useSellGuitar";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { CaseDefinition, EffectDefinition, GuitarDefinition, GuitarRarity,OpenCaseResult } from "../../types/arsenal.types";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { RARITY_STYLES } from "../RarityBadge";

const ITEM_WIDTH = 250;
const VISIBLE_ITEMS = 60;
const WIN_INDEX = 45;

// Keep in sync with /api/arsenal/sell-guitar.ts and /api/arsenal/sell-effect.ts
const GUITAR_SELL_VALUES: Record<GuitarRarity, number> = {
  Common: 15, Uncommon: 30, Rare: 75, Epic: 150, Legendary: 300, Mythic: 750,
};
const EFFECT_SELL_VALUES: Record<GuitarRarity, number> = {
  Common: 8, Uncommon: 15, Rare: 40, Epic: 75, Legendary: 150, Mythic: 375,
};

type StripItem =
  | { kind: "guitar"; def: GuitarDefinition }
  | { kind: "effect"; def: EffectDefinition };

function buildRouletteStrip(caseDef: CaseDefinition, winItem: StripItem): StripItem[] {
  const rarities = Object.entries(caseDef.probabilities) as [GuitarRarity, number][];
  const strip: StripItem[] = [];

  // Daily case can only drop today's featured pool, so the roulette fillers
  // come from that pool too — the animation never teases an impossible item.
  const dailyPool = caseDef.id === "daily" ? getDailyPool() : null;

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

    if (dailyPool) {
      const candidates = dailyPool.filter((e) => e.def.rarity === chosen);
      const pickFrom = candidates.length > 0 ? candidates : dailyPool;
      strip.push(pickFrom[Math.floor(Math.random() * pickFrom.length)]);
      continue;
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
  const [mounted, setMounted] = useState(false);
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const { mutate: sellGuitar, isPending: isSellingGuitar } = useSellGuitar();
  const { mutate: sellEffect, isPending: isSellingEffect } = useSellEffect();
  const isSelling = isSellingGuitar || isSellingEffect;
  const isBusy = isEquipping || isSelling;
  const isOpen = result !== null;
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const guitar = result?.type === "guitar" && result.guitar ? GUITARS_BY_ID.get(result.guitar.id) ?? null : null;
  const effect = result?.type === "effect" && result.effect ? EFFECTS_BY_ID.get(result.effect.id) ?? null : null;

  const winDef: StripItem | null = guitar
    ? { kind: "guitar", def: guitar }
    : effect
    ? { kind: "effect", def: effect }
    : null;

  const revealRarity = guitar?.rarity ?? effect?.rarity ?? null;
  const rarityStyles = revealRarity ? RARITY_STYLES[revealRarity] : null;

  const sellValue = winDef
    ? winDef.kind === "guitar"
      ? GUITAR_SELL_VALUES[winDef.def.rarity]
      : EFFECT_SELL_VALUES[winDef.def.rarity]
    : 0;

  const handleSell = () => {
    if (!winDef || isBusy) return;
    if (winDef.kind === "guitar" && result?.newItem?.id) {
      sellGuitar(result.newItem.id, { onSuccess: onClose });
    } else if (winDef.kind === "effect" && result?.effectItem?.id) {
      sellEffect(result.effectItem.id, { onSuccess: onClose });
    }
  };

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && strip.length > 0 && (
        <motion.div
          className="fixed inset-0 z-[1000] flex flex-col items-center overflow-y-auto py-4 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed inset-0 bg-black/95"
            onClick={phase === "done" ? onClose : undefined}
          />

          {(phase === "reveal" || phase === "done") && rarityStyles && (
            <motion.div
              className="fixed inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{ background: `radial-gradient(circle at center, ${rarityStyles.baseColor}15 0%, transparent 70%)` }}
            />
          )}

          {/* One-shot screen flash the instant the roulette lands */}
          {phase === "reveal" && rarityStyles && (
            <motion.div
              className="fixed inset-0 z-20 pointer-events-none"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{
                background: `radial-gradient(circle at center, ${rarityStyles.baseColor}66 0%, transparent 60%)`,
              }}
            />
          )}

          <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-4xl px-4 my-auto">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black capitalize tracking-[0.3em] text-zinc-300 drop-shadow-lg"
            >
              {caseDef?.name ?? "Opening Case"}
            </motion.h2>

            {/* Roulette */}
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-lg bg-zinc-950/90"
              style={{ height: 220 }}
            >
              <GuitarPatternBackground opacity={0.03} />

              {/* Center pointer: glowing line + carets top and bottom */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-30 w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent shadow-[0_0_16px_rgba(251,191,36,0.8)]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-amber-400" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-amber-400" />

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
                        className="relative flex items-center justify-center rounded-md w-[230px] h-[150px] overflow-hidden bg-zinc-900/60 transition-all duration-500"
                        style={{
                          border: `1px solid ${rs.baseColor}55`,
                          background: `radial-gradient(circle at center, ${rs.baseColor}26 0%, ${rs.baseColor}0d 45%, rgba(24,24,27,0.85) 85%)`,
                          boxShadow: isWinner
                            ? `0 0 34px ${rs.baseColor}99, inset 0 0 24px ${rs.baseColor}2e`
                            : undefined,
                        }}
                      >
                        {item.kind === "guitar" ? (
                          <img
                            src={getRankBadgeSrc(item.def.imageId, "small")}
                            alt={item.def.name}
                            className="relative z-10 h-[440px] w-[440px] -rotate-45 object-contain"
                          />
                        ) : (
                          <img
                            src={`/static/images/effects/${item.def.imageId}.png`}
                            alt={item.def.name}
                            className="relative z-10 h-32 w-32 object-contain"
                          />
                        )}
                        {/* Rarity bar at the tile bottom, CS-case style */}
                        <div
                          className="absolute bottom-0 left-0 right-0 z-20 h-1"
                          style={{ background: rs.baseColor, opacity: isWinner ? 1 : 0.75 }}
                        />
                      </div>
                      <div className={cn("flex flex-col items-center transition-opacity duration-500", isWinner ? "opacity-100" : "opacity-70")}>
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-0.5">
                          {item.kind === "guitar" ? item.def.brand : item.def.type}
                        </span>
                        <span className="text-[11px] font-bold capitalize tracking-wide text-center leading-tight truncate w-full" style={{ color: rs.baseColor }}>
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
                  className="flex flex-col items-center gap-3 w-full"
                >
                  {/* Rarity splash headline */}
                  <motion.p
                    initial={{ opacity: 0, y: 14, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
                    className="font-display text-3xl sm:text-4xl font-black capitalize tracking-wide"
                    style={{
                      color: rarityStyles.baseColor,
                      textShadow: `0 0 32px ${rarityStyles.baseColor}88`,
                    }}
                  >
                    {revealRarity}
                  </motion.p>

                  <div className="relative flex items-center justify-center">
                    {/* Slow-rotating light rays behind the card */}
                    <motion.div
                      className="pointer-events-none absolute h-[520px] w-[520px] rounded-full"
                      style={{
                        background: `repeating-conic-gradient(from 0deg, ${rarityStyles.baseColor}1f 0deg 10deg, transparent 10deg 22deg)`,
                        WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 68%)",
                        maskImage: "radial-gradient(circle, black 30%, transparent 68%)",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      transition={{
                        opacity: { duration: 0.6 },
                        rotate: { duration: 46, repeat: Infinity, ease: "linear" },
                      }}
                    />

                    {/* One-shot particle burst */}
                    {Array.from({ length: 14 }).map((_, i) => {
                      const angle = (i / 14) * Math.PI * 2;
                      const dist = 150 + (i % 3) * 45;
                      return (
                        <motion.span
                          key={i}
                          className="pointer-events-none absolute z-20 h-1.5 w-1.5 rounded-full"
                          style={{
                            background: rarityStyles.baseColor,
                            boxShadow: `0 0 10px ${rarityStyles.baseColor}`,
                          }}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(angle) * dist,
                            y: Math.sin(angle) * dist,
                            opacity: 0,
                            scale: 0.3,
                          }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 + (i % 5) * 0.04 }}
                        />
                      );
                    })}

                    <motion.div
                      className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full blur-[40px] will-change-[opacity,transform]"
                      style={{ backgroundColor: `${rarityStyles.baseColor}33` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: [0.3, 0.5, 0.3] }}
                      transition={{ scale: { duration: 0.8 }, opacity: { duration: 2.4, repeat: Infinity } }}
                    />
                    <div className="relative z-10" style={{ width: 280 }}>
                      {winDef.kind === "guitar" && result?.newItem ? (
                        <GuitarCard item={result.newItem} readOnly />
                      ) : winDef.kind === "effect" && result?.effectItem ? (
                        <EffectCard item={result.effectItem} readOnly />
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <AnimatePresence>
              {phase === "done" && winDef && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full flex-col gap-2 sm:flex-row sm:gap-3"
                >
                  {winDef.kind === "guitar" && guitar && (
                    <Button
                      onClick={() => equip({ guitarId: guitar.id, year: result?.newItem?.year, country: result?.newItem?.country }, { onSuccess: onClose })}
                      disabled={isBusy}
                      className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-medium capitalize tracking-widest h-12 text-sm disabled:opacity-50"
                    >
                      Equip Now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isBusy}
                    className="w-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-medium capitalize tracking-widest h-12 text-sm disabled:opacity-50"
                  >
                    {winDef.kind === "guitar" ? "Keep in Arsenal" : "Add to Collection"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSell}
                    disabled={isBusy}
                    className="w-full border-amber-600/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 font-medium capitalize tracking-widest h-12 text-sm disabled:opacity-50"
                  >
                    {isSelling ? (
                      "Selling…"
                    ) : (
                      <span className="flex items-center gap-3">
                        <span>Sell</span>
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <img src="/images/coin.png" alt="" className="h-5 w-5 object-contain" />
                          {sellValue}
                        </span>
                      </span>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
