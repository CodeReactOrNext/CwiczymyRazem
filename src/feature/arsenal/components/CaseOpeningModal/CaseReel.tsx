"use client";

import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { caseSounds } from "feature/arsenal/utils/caseSounds";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { isAtLeast } from "feature/arsenal/utils/pity";
import { ComponentThumb } from "feature/guitarBuilder/components/ComponentThumb";
import { AnimatePresence, motion } from "framer-motion";
import { readableText } from "lib/colorTheme/colorTheme";
import { EASE } from "lib/motion/motion";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { RARITY_STYLES } from "../RarityBadge";
import {
  BRAKE_MS,
  easeInOutQuad,
  easeOutQuart,
  INTRO_MIN_MS,
  OVERSHOOT,
  PRELOAD_CAP_MS,
  reelHoldMs,
  reelIndexAt,
  reelTarget,
  reelTileLook,
  reelTileWidth,
  SETTLE_MS,
  SPIN_MS,
  type StripItem,
} from "./reelMath";

/** The art a reel tile shows, when it is an image the reel can fetch ahead. */
export const reelImageSrc = (item: StripItem): string | null =>
  item.kind === "guitar"
    ? getRankBadgeSrc(item.def.imageId, "small")
    : item.kind === "effect"
      ? getEffectImageSrc(item.def.imageId, "medium")
      : null;

/** Fetches and decodes every image, or gives up after `cap` ms. */
const preloadImages = (urls: string[], cap: number) =>
  Promise.race([
    Promise.all(
      urls.map((src) => {
        const img = new Image();
        img.src = src;
        return img.decode().catch(() => undefined);
      }),
    ),
    new Promise((resolve) => setTimeout(resolve, cap)),
  ]);

const ReelArt = ({ item }: { item: StripItem }) => {
  if (item.kind === "component") {
    return <ComponentThumb def={item.def} className='h-20 w-[90%]' />;
  }
  return (
    <img
      src={reelImageSrc(item) ?? ""}
      alt=''
      draggable={false}
      className={
        item.kind === "guitar"
          ? "max-h-[120px] max-w-[94%] object-contain"
          : "max-h-[84px] max-w-[80%] object-contain"
      }
    />
  );
};

interface CaseReelProps {
  strip: StripItem[];
  winIndex: number;
  /** The case's art, rattled while the reel's images load. */
  caseImage?: string;
  /** The image the reward screen opens on, fetched during the rattle as well. */
  rewardImage?: string | null;
  /** The drum has stopped and held the pull long enough: show the reward. */
  onFinished: () => void;
}

/**
 * The opening itself: the case rattles while every image on the reel is fetched
 * and decoded, then bursts and lets a drum of items spin past a pointer onto
 * the pull.
 *
 * The spin runs outside React. One animation frame loop writes the strip's
 * offset and each visible tile's turn straight onto the DOM, and the target is
 * fixed when the spin starts, so nothing the page re-renders meanwhile can
 * restart or jolt it. Images are decoded before the first frame, so none of
 * them decodes mid-spin.
 *
 * What it shows means something: the light behind the pointer takes the colour
 * of the rarity passing under it, the flapper ticks for every item, the name
 * under the drum becomes readable as it slows down, and an Epic or better pull
 * lands with a flash, a ring and (Legendary up) a jolt. A tap brakes the spin.
 */
export const CaseReel = ({
  strip,
  winIndex,
  caseImage,
  rewardImage,
  onFinished,
}: CaseReelProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const [spinning, setSpinning] = useState(false);
  const [tileWidth] = useState(() =>
    reelTileWidth(typeof window === "undefined" ? 1024 : window.innerWidth),
  );

  const reelRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const rarityRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const brakeRef = useRef<(() => void) | null>(null);
  const finishedRef = useRef(onFinished);
  const labelsRef = useRef(labels);

  useEffect(() => {
    finishedRef.current = onFinished;
    labelsRef.current = labels;
  });

  const winRarity = strip[winIndex].def.rarity;
  const winColor = RARITY_STYLES[winRarity].baseColor;

  // 1. The rattle, for as long as the art takes to load (within limits).
  useEffect(() => {
    let cancelled = false;
    const urls = [
      ...new Set(
        [...strip.map(reelImageSrc), rewardImage].filter(
          (src): src is string => Boolean(src),
        ),
      ),
    ];
    const started = performance.now();
    caseSounds.knock(0);
    void preloadImages(urls, PRELOAD_CAP_MS).then(() => {
      const left = INTRO_MIN_MS - (performance.now() - started);
      setTimeout(
        () => {
          if (cancelled) return;
          caseSounds.knock(1);
          setSpinning(true);
        },
        Math.max(0, left),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [strip, rewardImage]);

  // 2. The spin, the ratchet back onto the pull, and the landing.
  useEffect(() => {
    if (!spinning) return undefined;
    const reel = reelRef.current;
    const stripEl = stripRef.current;
    const column = columnRef.current;
    const readout = readoutRef.current;
    if (!reel || !stripEl || !column || !readout) return undefined;

    const tiles = Array.from(stripEl.children) as HTMLElement[];
    const viewport = reel.offsetWidth;
    const w = tileWidth;
    const target = reelTarget(winIndex, viewport, w, Math.random() * 2 - 1);
    const over = w * OVERSHOOT;
    const looks: string[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    let x = 0;
    let prevX = 0;
    let lastIndex = -1;
    let from = 0;
    let total = SPIN_MS;
    let start = performance.now();
    let settling = false;
    let frameId = 0;

    const layout = () => {
      const first = Math.max(0, Math.floor(x / w) - 1);
      const last = Math.min(tiles.length - 1, Math.ceil((x + viewport) / w));
      for (let i = first; i <= last; i++) {
        const look = reelTileLook((i * w + w / 2 - (x + viewport / 2)) / w);
        const transform = `translateY(${look.y}px) perspective(700px) rotateY(${look.rotateY}deg) scale(${look.scale})`;
        looks[i] = transform;
        tiles[i].style.transform = transform;
        tiles[i].style.opacity = String(look.opacity);
      }
      stripEl.style.transform = `translate3d(${-x}px, 0, 0)`;

      const index = reelIndexAt(x, viewport, w);
      if (index !== lastIndex) {
        if (lastIndex !== -1) {
          caseSounds.tick();
          flapRef.current?.animate?.(
            [{ transform: "rotate(-26deg)" }, { transform: "rotate(0deg)" }],
            { duration: 140, easing: "ease-out" },
          );
        }
        lastIndex = index;
        const item = strip[index];
        if (item) {
          const color = RARITY_STYLES[item.def.rarity].baseColor;
          column.style.setProperty("--reel-c", color);
          if (rarityRef.current) {
            rarityRef.current.textContent = labelsRef.current.rarity(item.def.rarity);
            rarityRef.current.style.color = readableText(color) ?? color;
          }
          if (nameRef.current) nameRef.current.textContent = item.def.name;
        }
      }

      // The name only becomes readable as the drum slows down.
      const speed = Math.abs(x - prevX);
      prevX = x;
      readout.style.opacity = String(Math.max(0.25, Math.min(1, 1.2 - speed / 30)));
    };

    const land = () => {
      brakeRef.current = null;
      if (hintRef.current) hintRef.current.style.visibility = "hidden";
      readout.style.opacity = "1";
      column.style.setProperty("--reel-a", "34%");
      caseSounds.reveal(winRarity);

      tiles.forEach((tile, i) => {
        if (!looks[i] || i === winIndex) return;
        const away = i < winIndex ? -34 : 34;
        tile.animate?.(
          [
            { opacity: tile.style.opacity, transform: looks[i] },
            { opacity: 0.1, transform: `translateX(${away}px) ${looks[i]}` },
          ],
          { duration: 420, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" },
        );
      });
      tiles[winIndex]?.animate?.(
        [
          { transform: looks[winIndex] },
          { transform: `${looks[winIndex]} scale(1.22)` },
          { transform: `${looks[winIndex]} scale(1.14)` },
        ],
        { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "forwards" },
      );
      readout.animate?.(
        [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
        { duration: 360, easing: "ease-out" },
      );

      if (isAtLeast(winRarity, "Epic")) {
        const legendary = isAtLeast(winRarity, "Legendary");
        flashRef.current?.animate?.(
          [{ opacity: legendary ? 0.4 : 0.25 }, { opacity: 0 }],
          { duration: 650, easing: "ease-out" },
        );
        ringRef.current?.animate?.(
          [
            { opacity: 0.9, transform: "translate(-50%, -50%) scale(0.5)" },
            { opacity: 0, transform: "translate(-50%, -50%) scale(1.7)" },
          ],
          { duration: 750, easing: "ease-out", fill: "forwards" },
        );
        if (legendary) {
          reel.animate?.(
            [
              { transform: "none" },
              { transform: "translate(-7px, 3px)" },
              { transform: "translate(6px, -3px)" },
              { transform: "translate(-4px, 2px)" },
              { transform: "none" },
            ],
            { duration: 320 },
          );
        }
      }

      timers.push(setTimeout(() => finishedRef.current(), reelHoldMs(winRarity)));
    };

    const frame = (now: number) => {
      if (!settling) {
        const p = Math.min(1, (now - start) / total);
        x = from + (target + over - from) * easeOutQuart(p);
        layout();
        if (p >= 1) {
          settling = true;
          start = now;
          caseSounds.land();
        }
        frameId = requestAnimationFrame(frame);
        return;
      }
      const p = Math.min(1, (now - start) / SETTLE_MS);
      x = target + over * (1 - easeInOutQuad(p));
      layout();
      if (p < 1) frameId = requestAnimationFrame(frame);
      else land();
    };

    // A tap cuts what is left of the spin down to a short stop — never longer.
    brakeRef.current = () => {
      const elapsed = performance.now() - start;
      if (settling || total - elapsed <= BRAKE_MS) return;
      from = x;
      start = performance.now();
      total = BRAKE_MS;
      brakeRef.current = null;
    };

    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      timers.forEach(clearTimeout);
      brakeRef.current = null;
    };
  }, [spinning, strip, winIndex, tileWidth, winRarity]);

  return (
    <div
      className='relative flex h-full w-full select-none flex-col items-center justify-center gap-6 overflow-hidden'
      onPointerDown={() => brakeRef.current?.()}>
      <div
        ref={flashRef}
        className='pointer-events-none absolute inset-0 z-20 opacity-0'
        style={{ background: winColor }}
      />

      <AnimatePresence>
        {!spinning && caseImage && (
          <motion.div
            key='case'
            className='absolute inset-0 flex items-center justify-center'
            exit={{ opacity: 0, scale: 0.6, y: 40, transition: { duration: 0.3, ease: "easeIn" } }}>
            <motion.img
              src={caseImage}
              alt=''
              draggable={false}
              className='w-[min(340px,74%)] object-contain'
              animate={{
                x: [0, -7, 7, -4, 0],
                y: [0, -2, -5, 0, 0],
                rotate: [0, -3, 3, -1.5, 0],
              }}
              transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {spinning && (
        <>
          <motion.div
            ref={reelRef}
            className='relative h-[220px] w-full shrink-0 [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)] sm:h-[250px]'
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.26, ease: EASE.out }}>
            {/* The light behind the pointer, in the colour of what passes under it. */}
            <div
              ref={columnRef}
              className='absolute inset-y-0 left-1/2 w-40 -translate-x-1/2 sm:w-52'
              style={
                {
                  "--reel-c": "#a1a1aa",
                  "--reel-a": "16%",
                  background:
                    "linear-gradient(180deg, transparent, color-mix(in srgb, var(--reel-c) var(--reel-a), transparent) 22%, color-mix(in srgb, var(--reel-c) var(--reel-a), transparent) 78%, transparent)",
                } as CSSProperties
              }
            />
            <div
              ref={ringRef}
              className='pointer-events-none absolute left-1/2 top-1/2 z-10 h-56 w-56 rounded-full border-[3px] opacity-0'
              style={{ borderColor: winColor, transform: "translate(-50%, -50%)" }}
            />
            <div ref={stripRef} className='absolute inset-y-0 left-0 z-[5] flex will-change-transform'>
              {strip.map((item, i) => (
                <div
                  key={i}
                  className='flex h-full shrink-0 items-center justify-center will-change-transform'
                  style={{ width: tileWidth }}>
                  <ReelArt item={item} />
                </div>
              ))}
            </div>
            <div
              ref={flapRef}
              className='absolute left-1/2 top-0 z-30 -ml-[11px] h-[26px] w-[22px] origin-top bg-white [clip-path:polygon(0_0,100%_0,50%_100%)]'
            />
          </motion.div>

          <div
            ref={readoutRef}
            className='flex min-h-[52px] flex-col items-center gap-0.5 px-4 text-center'>
            <span ref={rarityRef} className='text-sm font-bold' />
            <span ref={nameRef} className='font-display text-2xl font-extrabold text-zinc-50' />
          </div>

          <span ref={hintRef} className='absolute bottom-8 text-xs text-zinc-500'>
            {t("opening.tap_to_stop")}
          </span>
        </>
      )}
    </div>
  );
};
