import { cn } from "assets/lib/utils";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { useEffect, useRef, useState } from "react";

/** Real milliseconds are too short to watch, so the race runs this many times slower. */
const SLOW_MOTION = 25;
/** The pluck, before the sound sets off (s). */
const PLUCK_S = 0.5;
/** One race, start to start (ms): the slow lane's trip plus time to read the result. */
const LOOP_MS = 6200;

interface Lane {
  id: "desktop" | "browser";
  label: string;
  ms: number;
  stops: readonly string[];
}

const LaneTrack = ({
  lane,
  run,
  still,
}: {
  lane: Lane;
  run: number;
  still: boolean;
}) => {
  const trip = (lane.ms * SLOW_MOTION) / 1000;
  const isDesktop = lane.id === "desktop";
  const at = (fraction: number) => PLUCK_S + trip * fraction;
  const lastStop = lane.stops.length - 1;

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-baseline justify-between gap-4'>
        <span
          className={cn(
            "text-sm font-semibold",
            isDesktop ? "text-white" : "text-zinc-400",
          )}>
          {lane.label}
        </span>
        <motion.span
          key={`time-${run}`}
          className={cn(
            "font-teko text-3xl tabular-nums leading-none",
            isDesktop ? "text-white" : "text-zinc-400",
          )}
          initial={still ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.base, delay: at(1) }}>
          ≈{lane.ms} ms
        </motion.span>
      </div>

      <div className='relative h-3'>
        <span className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-800' />
        <motion.span
          key={`fill-${run}`}
          className={cn(
            "absolute inset-x-0 top-1/2 h-px origin-left -translate-y-1/2",
            isDesktop ? "bg-cyan-400" : "bg-zinc-400",
          )}
          initial={still ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: trip, delay: PLUCK_S, ease: "linear" }}
        />
        {!still && (
          <motion.span
            key={`head-${run}`}
            aria-hidden
            className={cn(
              "absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              isDesktop ? "bg-cyan-300" : "bg-zinc-200",
            )}
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
            transition={{
              left: { duration: trip, delay: PLUCK_S, ease: "linear" },
              opacity: {
                duration: trip + 0.3,
                delay: PLUCK_S,
                times: [0, 0.02, 0.9, 1],
              },
            }}
          />
        )}
        {lane.stops.map((stop, idx) => (
          <motion.span
            key={`${stop}-${run}`}
            className={cn(
              "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              isDesktop ? "bg-cyan-400" : "bg-zinc-300",
            )}
            style={{ left: `${(idx / lastStop) * 100}%` }}
            initial={still ? false : { opacity: 0.25 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: at(idx / lastStop) }}
          />
        ))}
      </div>

      {/* A phone has no room to hang five labels under their stops. */}
      <p className='text-[11px] leading-snug text-zinc-500 sm:hidden'>
        {lane.stops.join(" → ")}
      </p>
      <ol className='relative hidden h-8 text-[11px] leading-tight text-zinc-500 sm:flex'>
        {lane.stops.map((stop, idx) => (
          <li
            key={stop}
            className={cn(
              "absolute w-20",
              idx === 0
                ? "left-0 text-left"
                : idx === lastStop
                  ? "right-0 text-right"
                  : "-translate-x-1/2 text-center",
            )}
            style={
              idx === 0 || idx === lastStop
                ? undefined
                : { left: `${(idx / lastStop) * 100}%` }
            }>
            {stop}
          </li>
        ))}
      </ol>
    </div>
  );
};

/**
 * The hero's moving picture: one note, two routes. In the browser the sound
 * goes through the system mixer and the browser's microphone plumbing before
 * the app hears it; in the desktop app it comes straight off the driver. Both
 * leave at the same moment, slowed down {SLOW_MOTION}×, and each lane shows the
 * measured time when it arrives. Then it plays again.
 *
 * Cyan is the desktop route, the thing on offer; the browser stays grey. With
 * reduced motion both lanes sit finished.
 */
export const LatencyRace = ({
  desktop,
  browser,
}: {
  desktop: Omit<Lane, "id">;
  browser: Omit<Lane, "id">;
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (still || !inView) return undefined;
    const id = window.setTimeout(() => setRun((value) => value + 1), LOOP_MS);
    return () => window.clearTimeout(id);
  }, [run, inView, still]);

  return (
    <div
      ref={ref}
      aria-label={`One note, two routes: about ${desktop.ms} ms through the desktop app, about ${browser.ms} ms through the browser`}
      role='img'
      className='flex flex-col gap-8 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='flex items-center gap-4'>
        <svg
          viewBox='0 0 120 24'
          className='h-6 w-16 shrink-0 text-zinc-300 sm:w-28'
          aria-hidden>
          <motion.path
            key={`pluck-${run}`}
            d='M0 12 C 6 2, 12 2, 18 12 S 30 22, 36 12 S 48 4, 54 12 S 66 19, 72 12 S 84 7, 90 12 S 102 15, 108 12 L 120 12'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            initial={still ? false : { pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: 0.35 }}
            transition={{
              pathLength: { duration: PLUCK_S, ease: "easeOut" },
              opacity: { duration: 1.6, delay: PLUCK_S },
            }}
          />
        </svg>
        <span className='text-sm text-zinc-400'>You play one note</span>
        <span className='ml-auto text-xs text-zinc-500'>
          {SLOW_MOTION}× slower
        </span>
      </div>

      <LaneTrack lane={{ id: "desktop", ...desktop }} run={run} still={still} />
      <LaneTrack lane={{ id: "browser", ...browser }} run={run} still={still} />
    </div>
  );
};
