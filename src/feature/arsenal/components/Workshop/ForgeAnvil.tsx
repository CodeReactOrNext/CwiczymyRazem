"use client";

import { Button, buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import {
  countHeldParts,
  getFusionQuote,
  getMaxFusionCrafts,
} from "feature/arsenal/data/fusion";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useFuseParts } from "feature/arsenal/hooks/useFuseParts";
import type {
  PartId,
  PartTier,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { readableText } from "lib/colorTheme/colorTheme";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { ChevronsRight, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CountUp } from "../CaseOpeningModal/CountUp";
import { PartIcon } from "../Parts/PartIcon";
import {
  ImpactFlash,
  ImpactRings,
  SparkBurst,
  SparkConverge,
  StageLight,
} from "../Scene/sceneFx";
import { TierPlate } from "../TierPlate";
import { FameCoin } from "./FameCoin";
import { GO_KEY } from "./goKey";

/** The two plates and the arrow between them, in px — the pieces fly this far. */
const PLATE = 88;
const GAP = 20;
const ARROW = 24;
const TRAVEL = PLATE + GAP * 2 + ARROW;

/** A fast answer still waits for every piece to reach the ring. */
const MIN_WINDUP_MS = 900;
/** When the flying pieces reach the output and it comes out. */
const IMPACT = 0.3;
/** How long the result stays lit before the anvil takes the next job. */
const SETTLE_MS = 1600;

/** The pieces circling the output while the job is out. */
const ORBIT_R = 58;
const PIECE = 34;
const MAX_PIECES = 6;
/** The ring holds still until the pieces have landed on it, then winds up. */
const SPIN_AFTER_MS = 450;
const SPIN_RAMP_MS = 500;
const SPIN_SPEED = 0.12;

/**
 * The stack going in, as pieces: they leave the input plate one after another,
 * settle into a ring round the output and start to circle it, faster and
 * faster, until the answer is in — then all of them are pulled into the middle
 * at once.
 *
 * The spin is a motion value advanced by hand, as in the rework scene, so it can
 * stop where it is instead of swinging back to zero. It stands still while the
 * pieces fly in, or the later ones would set off from a turned frame and arc
 * in from the side instead of coming from the input.
 */
const ForgeOrbit = ({
  count,
  color,
  partId,
  collapse,
}: {
  count: number;
  color: string;
  partId: PartId;
  collapse: boolean;
}) => {
  const spin = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  useAnimationFrame((time, delta) => {
    if (collapse || reduceMotion || time < SPIN_AFTER_MS) return;
    const ramp = Math.min(1, (time - SPIN_AFTER_MS) / SPIN_RAMP_MS);
    spin.set(spin.get() + delta * SPIN_SPEED * ramp);
  });

  const angles = Array.from(
    { length: count },
    (_, i) => (i / count) * Math.PI * 2 + Math.PI,
  );

  return (
    <motion.div
      aria-hidden
      className='pointer-events-none absolute left-1/2 top-1/2 h-0 w-0 will-change-transform'
      style={{ rotate: spin }}>
      {angles.map((angle, i) => (
        <motion.div
          key={i}
          className='absolute will-change-transform'
          style={{ left: -PIECE / 2, top: -PIECE / 2 }}
          initial={{ x: -TRAVEL, y: 0, scale: 0.6, opacity: 0 }}
          animate={
            collapse
              ? { x: 0, y: 0, scale: 0.2, opacity: [1, 1, 0] }
              : {
                  x: Math.cos(angle) * ORBIT_R,
                  y: Math.sin(angle) * ORBIT_R,
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={
            collapse
              ? { duration: IMPACT, ease: "easeIn" }
              : {
                  delay: i * 0.06,
                  type: "spring",
                  stiffness: 170,
                  damping: 17,
                  opacity: { duration: 0.12, delay: i * 0.06 },
                }
          }>
          <TierPlate color={color} size={PIECE}>
            <PartIcon partId={partId} size={20} />
          </TierPlate>
        </motion.div>
      ))}
    </motion.div>
  );
};

type Phase = "idle" | "working" | "impact";

/** One job as it was started — drawn from this, not from the refetching wallet. */
interface Shot {
  run: number;
  inTier: PartTier;
  outTier: PartTier;
  inQty: number;
  produced: number;
  /** Pieces one job takes — kept for the bar while a used-up stack settles. */
  ratio: number;
}

export interface ForgeMade {
  partId: PartId;
  /** The tier that came out. */
  tier: PartTier;
  /** Pieces of the input tier left after the job. */
  left: number;
  /** Pieces one more job of the same kind would take. */
  ratio: number;
}

interface ForgeAnvilProps {
  partId: PartId;
  tier: PartTier;
  wallet: ScrapPart[];
  fame: number;
  /** A job has started: the forge keeps this stack on the anvil until it is done. */
  onStart: () => void;
  /** After the result has had its moment — the forge may move the anvil on. */
  onMade: (made: ForgeMade) => void;
}

/** The workshop's lamp, the same warm pool the bench stands under. */
const LAMP = [
  "radial-gradient(60% 50% at 50% 0%, rgba(255,190,110,0.16) 0%, rgba(255,190,110,0.04) 45%, transparent 72%)",
  "linear-gradient(180deg, #17181c 0%, #101114 55%, #0a0b0d 100%)",
].join(", ");

/**
 * The anvil: one stack of parts on it, what it becomes one tier up, and one key
 * that does it.
 *
 * The job is a fusion. While the request is out the stack's pieces leave it and
 * circle the empty output, winding up; when the answer lands they are pulled
 * into the middle and the output comes out of a flash in its own tier's colour
 * — the light on the anvil turns with it, so the colour change *is* the upgrade.
 * (A hammer working the stack was tried first and read as clip-art.)
 * It plays in place, not as the full-screen scene Collection uses: the anvil is
 * where the player keeps working, often several jobs in a row.
 */
export const ForgeAnvil = ({
  partId,
  tier,
  wallet,
  fame,
  onStart,
  onMade,
}: ForgeAnvilProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const fuse = useFuseParts({ scene: false });

  const [phase, setPhase] = useState<Phase>("idle");
  const [shot, setShot] = useState<Shot | null>(null);
  const [wanted, setWanted] = useState(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const qty = countHeldParts(wallet, partId, tier);
  const one = getFusionQuote(partId, tier, 1);
  // The stepper runs over what the stack can make; Fame only decides whether
  // the key can be pressed, so a player short of Fame still sees the whole
  // stack's worth and what it would cost.
  const byParts = one ? Math.floor(qty / one.ratio) : 0;
  const affordable = getMaxFusionCrafts(wallet, partId, tier, fame);
  const crafts = Math.max(1, Math.min(wanted, Math.max(1, byParts)));
  const quote = getFusionQuote(partId, tier, crafts);
  const busy = phase !== "idle";

  const inTier = shot && busy ? shot.inTier : tier;
  const outTier = shot && busy ? shot.outTier : (quote?.outputTier ?? tier);
  const inColor = PART_TIER_COLORS[inTier];
  const outColor = PART_TIER_COLORS[outTier];

  const header = (
    <div className='relative flex flex-col items-center gap-1 text-center'>
      <span className='text-2xl font-black text-zinc-100'>
        {labels.part(partId)}
      </span>
      <span
        className='text-sm font-semibold'
        style={{ color: readableText(PART_TIER_COLORS[tier]) }}>
        {labels.partTier(tier)} · ×{qty}
      </span>
    </div>
  );

  // Screws, a pot at Epic, a neck at Legendary: nothing to make, and nothing
  // drawn as if there were.
  if (!quote && !busy) {
    return (
      <div
        className='relative flex flex-col items-center gap-6 overflow-hidden rounded-lg px-6 py-10'
        style={{ backgroundImage: LAMP }}>
        {header}
        <TierPlate color={PART_TIER_COLORS[tier]} size={PLATE}>
          <PartIcon partId={partId} size={56} />
        </TierPlate>
        <p className='relative max-w-[30ch] text-center text-sm text-zinc-400'>
          {t("workshop.forge.top_tier")}
        </p>
      </div>
    );
  }

  const ratio = quote?.ratio ?? shot?.ratio ?? 1;
  const hasParts = byParts > 0;
  const fameShort = quote ? Math.max(0, quote.fame - fame) : 0;
  const ready = hasParts && fameShort === 0;
  const fill = Math.min(1, qty / ratio);

  const settle = (made: ForgeMade) => {
    timers.current.push(
      setTimeout(() => {
        setPhase("idle");
        setWanted(1);
        onMade(made);
      }, SETTLE_MS),
    );
  };

  const make = () => {
    if (!quote || busy || !ready) return;
    // A fast answer waits for this, so every piece reaches the ring first.
    const windUp = new Promise<void>((resolve) => {
      timers.current.push(setTimeout(resolve, MIN_WINDUP_MS));
    });
    const run = (shot?.run ?? 0) + 1;
    setShot({
      run,
      inTier: tier,
      outTier: quote.outputTier,
      inQty: quote.inputQty,
      produced: quote.crafts,
      ratio,
    });
    setPhase("working");
    onStart();

    fuse.mutate(
      { partId, tier, crafts: quote.crafts },
      {
        onSuccess: (data) => {
          void windUp.then(() => {
            setShot({
              run,
              inTier: tier,
              outTier: data.produced.tier,
              inQty: data.spent.qty,
              produced: data.produced.qty,
              ratio,
            });
            setPhase("impact");
            timers.current.push(
              setTimeout(() => playUiSound("reward"), IMPACT * 1000),
            );
            settle({
              partId,
              tier: data.produced.tier,
              left: qty - data.spent.qty,
              ratio,
            });
          });
        },
        // The hook says what went wrong; the pieces just go back.
        onError: () => setPhase("idle"),
      },
    );
  };

  const shown = shot && busy ? shot : null;
  const inQty = shown?.inQty ?? quote?.inputQty ?? ratio;
  const outQty = shown?.produced ?? crafts;

  let keyLabel = t("workshop.forge.make");
  if (busy) keyLabel = t("workshop.forge.forging");
  else if (!hasParts)
    keyLabel = t("workshop.forge.more_needed", { count: ratio - qty });

  return (
    <div
      className='relative flex flex-col items-center gap-7 overflow-hidden rounded-lg px-6 pb-8 pt-8 sm:px-8'
      style={{ backgroundImage: LAMP }}>
      <StageLight
        color={phase === "impact" ? outColor : inColor}
        strength={phase === "impact" ? "3a" : phase === "working" ? "26" : "12"}
      />

      {header}

      {/* The recipe: what goes in, what comes out. */}
      <motion.div
        className='relative flex items-center'
        style={{ gap: GAP }}
        animate={phase === "impact" ? { y: [0, 3, 0] } : { y: 0 }}
        transition={{ delay: IMPACT, duration: 0.22, ease: "easeOut" }}>
        {/* The source: drained while its pieces are out on the ring, filled
            back up with a spring once the job is done. */}
        <motion.div
          className='will-change-transform'
          animate={
            busy ? { scale: 0.88, opacity: 0.35 } : { scale: 1, opacity: 1 }
          }
          transition={
            busy
              ? { duration: 0.35, ease: "easeOut" }
              : { type: "spring", stiffness: 260, damping: 18 }
          }>
          <TierPlate color={inColor} size={PLATE} count={inQty}>
            <PartIcon partId={partId} size={56} />
          </TierPlate>
        </motion.div>

        <motion.span
          aria-hidden
          className='flex justify-center text-zinc-500'
          style={{ width: ARROW }}
          animate={{ opacity: phase === "impact" ? 0 : 1 }}>
          <ChevronsRight size={ARROW} />
        </motion.span>

        <div className='relative flex items-center justify-center'>
          {busy && shown && (
            <ForgeOrbit
              key={shown.run}
              count={Math.min(shown.inQty, MAX_PIECES)}
              color={inColor}
              partId={partId}
              collapse={phase === "impact"}
            />
          )}
          {phase === "working" && (
            <span className='pointer-events-none absolute left-1/2 top-1/2 flex h-0 w-0 items-center justify-center'>
              <SparkConverge color={inColor} count={8} radius={96} loop />
            </span>
          )}
          {phase === "impact" && shown ? (
            <>
              <span className='pointer-events-none absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center'>
                <ImpactFlash delay={IMPACT - 0.04} />
                <ImpactRings color={outColor} delay={IMPACT} size={84} />
                <SparkBurst
                  color={outColor}
                  delay={IMPACT}
                  count={14}
                  distance={64}
                  spread={20}
                />
              </span>
              <motion.div
                key={shown.run}
                className='relative will-change-transform'
                initial={{ opacity: 0, scale: 0.3, rotate: -14 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 14,
                  delay: IMPACT,
                  opacity: { duration: 0.1, delay: IMPACT },
                }}>
                <TierPlate color={outColor} size={PLATE}>
                  <PartIcon partId={partId} size={56} />
                </TierPlate>
              </motion.div>
              <motion.span
                className='absolute -bottom-9 text-xl font-black tabular-nums'
                style={{ color: readableText(outColor) }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: IMPACT + 0.15, duration: 0.25 }}>
                +
                <CountUp
                  to={shown.produced}
                  delay={IMPACT + 0.15}
                  duration={0.5}
                />
              </motion.span>
            </>
          ) : (
            // What the job would make, drawn faint until it is made.
            <TierPlate
              color={outColor}
              size={PLATE}
              count={outQty}
              className={cn(
                "transition-opacity duration-base",
                phase === "working"
                  ? "opacity-20"
                  : ready
                    ? "opacity-80"
                    : "opacity-40",
              )}>
              <PartIcon partId={partId} size={56} />
            </TierPlate>
          )}
        </div>
      </motion.div>

      <span
        className='relative text-lg font-black'
        style={{ color: readableText(outColor) }}>
        {labels.partName(outTier, partId)}
      </span>

      {/* How close the stack is to one job — the app's thick bar, emerald once the parts are there. */}
      <div className='relative -mt-2 flex w-full max-w-xs flex-col items-center gap-1.5'>
        <div
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={ratio}
          aria-valuenow={Math.min(qty, ratio)}
          className='relative h-4 w-full overflow-hidden rounded-full bg-zinc-800'>
          <div
            className='absolute inset-y-0 left-0 rounded-full transition-[width] duration-slow ease-out'
            style={{
              width: `${fill * 100}%`,
              backgroundColor: hasParts ? "#10b981" : outColor,
            }}
          />
          {fill > 0 && (
            <div
              aria-hidden
              className='light-hide absolute left-2 top-[4px] h-[4px] rounded-full bg-white/30'
              style={{ width: `calc(${fill * 100}% - 16px)` }}
            />
          )}
        </div>
        <span className='text-xs font-bold tabular-nums text-zinc-500'>
          {Math.min(qty, ratio)}/{ratio}
        </span>
      </div>

      {/* How many to make: the whole stack's worth, one step or all at once. */}
      {byParts > 1 && (
        <div className='relative flex flex-col items-center gap-2'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon-touch'
              disabled={busy || crafts <= 1}
              onClick={() => setWanted(crafts - 1)}
              aria-label={t("workshop.forge.fewer")}>
              <Minus />
            </Button>
            <span className='min-w-16 text-center text-2xl font-black tabular-nums text-zinc-100'>
              ×{crafts}
            </span>
            <Button
              variant='ghost'
              size='icon-touch'
              disabled={busy || crafts >= byParts}
              onClick={() => setWanted(crafts + 1)}
              aria-label={t("workshop.forge.more")}>
              <Plus />
            </Button>
            <Button
              variant='ghost'
              size='touch'
              disabled={busy || crafts === byParts}
              onClick={() => setWanted(byParts)}>
              {t("workshop.forge.max")}
            </Button>
          </div>
          <span className='text-xs font-semibold tabular-nums text-zinc-500'>
            {t("workshop.forge.can_make", { count: byParts })}
            {affordable > 0 && affordable < byParts && (
              <>
                {" · "}
                {t("workshop.forge.can_afford", { count: affordable })}
              </>
            )}
          </span>
        </div>
      )}

      <button
        type='button'
        onClick={make}
        disabled={!ready || busy}
        className={cn(
          buttonVariants({ size: "xl" }),
          ready && GO_KEY,
          "relative h-14 w-full max-w-xs justify-between gap-4 px-6 text-lg",
        )}>
        <span className='min-w-0 truncate'>{keyLabel}</span>
        {quote && hasParts && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 tabular-nums",
              ready ? "text-emerald-950" : "text-amber-400",
            )}>
            <FameCoin size={18} />
            {quote.fame.toLocaleString()}
          </span>
        )}
      </button>

      {/* Short of Fame is said once, under the key, not squeezed onto it. */}
      {!busy && hasParts && fameShort > 0 && (
        <span className='relative -mt-4 text-sm font-semibold text-red-300'>
          {t("workshop.forge.fame_short", {
            fame: fameShort.toLocaleString(),
          })}
        </span>
      )}

      <p className='sr-only' aria-live='polite'>
        {phase === "impact" && shown
          ? t("toasts.reworked", {
              qty: shown.produced,
              part: labels.partName(shown.outTier, partId),
            })
          : ""}
      </p>
    </div>
  );
};
