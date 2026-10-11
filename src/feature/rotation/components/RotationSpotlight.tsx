import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Layers, Play } from "lucide-react";

import { useRotationDisplay } from "../hooks/useRotationDisplay";
import type { RotationEntry } from "../types/rotation.types";
import { rotationKey } from "../utils/rotation.utils";
import { RotationThumb } from "./RotationThumb";

/**
 * A hand of up to three cards fanned from the bottom centre: the stalest item
 * upright on top, the next two tilted out behind it and dimmed, so the cards
 * read apart without an outline.
 */
const FAN = [
  { rotate: 0, x: 0, y: 0, z: 30, dim: false },
  { rotate: 11, x: 40, y: 8, z: 20, dim: true },
  { rotate: -11, x: -40, y: 8, z: 10, dim: true },
];

interface RotationSpotlightProps {
  nextUp: RotationEntry[];
  rustyCount: number;
  minutes: number;
  onPlayStalest: () => void;
  onDraw: () => void;
  isStarting: boolean;
}

/**
 * The top of the panel: the next few items as a fanned hand of cards, how many
 * are going rusty, and the two ways in — play the stalest, or draw one at random.
 */
export const RotationSpotlight = ({
  nextUp,
  rustyCount,
  minutes,
  onPlayStalest,
  onDraw,
  isStarting,
}: RotationSpotlightProps) => {
  const { describe, t } = useRotationDisplay();
  const hand = nextUp.slice(0, FAN.length);

  return (
    <section className='rounded-lg bg-zinc-900/40 px-5 py-8 sm:px-10 sm:py-10'>
      <div className='flex flex-col gap-10 xl:flex-row xl:items-center xl:justify-between'>
        <div className='flex flex-col items-center gap-8 text-center sm:flex-row sm:gap-12 sm:text-left'>
          <div className='relative h-32 w-56 shrink-0 sm:h-36' aria-hidden>
            {hand
              .map((entry, index) => ({ entry, fan: FAN[index] }))
              .reverse()
              .map(({ entry, fan }) => (
                <motion.div
                  key={rotationKey(entry.item)}
                  initial={{ opacity: 0, rotate: 0, x: 0, y: 14 }}
                  animate={{
                    opacity: 1,
                    rotate: fan.rotate,
                    x: fan.x,
                    y: fan.y,
                  }}
                  transition={{ type: "spring", stiffness: 240, damping: 24 }}
                  style={{ zIndex: fan.z, transformOrigin: "50% 100%" }}
                  className='absolute inset-x-0 top-0 mx-auto w-24 sm:w-28'>
                  <RotationThumb
                    display={describe(entry.item)}
                    className={cn(
                      "h-24 w-24 bg-zinc-800 sm:h-28 sm:w-28",
                      fan.dim && "brightness-[.55]",
                    )}
                    iconClassName='h-10 w-10'
                  />
                </motion.div>
              ))}
          </div>

          <div className='min-w-0'>
            <p className='text-sm text-zinc-400'>{t("spotlight.label")}</p>
            {rustyCount > 0 ? (
              <p className='mt-3 flex items-baseline justify-center gap-3 sm:justify-start'>
                <span className='font-teko text-7xl tabular-nums leading-[0.8] text-orange-400'>
                  {rustyCount}
                </span>
                <span className='text-xl font-semibold text-zinc-100'>
                  {t("spotlight.rusty")}
                </span>
              </p>
            ) : (
              <p className='mt-3 text-2xl font-bold text-zinc-100'>
                {t("spotlight.all_fresh_title")}
              </p>
            )}
            <p className='mt-5 line-clamp-2 max-w-md text-sm leading-relaxed text-zinc-300'>
              {rustyCount > 0
                ? hand.map((entry) => describe(entry.item).title).join(" · ")
                : t("spotlight.all_fresh_body")}
            </p>
          </div>
        </div>

        {/* Button wraps its children in a gapless flex span, so each label
            brings its own inner span with the spacing. */}
        <div className='flex flex-col gap-3 sm:flex-row xl:shrink-0'>
          <Button
            onClick={onPlayStalest}
            disabled={isStarting || hand.length === 0}
            className='h-14 rounded-lg bg-white px-7 font-bold text-black focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
            <span className='flex items-center gap-3'>
              <Play className='h-4 w-4 fill-current' />
              {t("spotlight.play_stalest", { count: hand.length })}
              <span className='font-medium text-zinc-500'>
                {t("spotlight.minutes", { count: minutes })}
              </span>
            </span>
          </Button>
          <Button
            onClick={onDraw}
            disabled={isStarting}
            className='h-14 rounded-lg bg-zinc-800 px-7 font-semibold text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
            <span className='flex items-center gap-3'>
              <Layers className='h-4 w-4 text-zinc-400' />
              {t("spotlight.draw")}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
};
