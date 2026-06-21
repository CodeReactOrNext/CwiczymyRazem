import { cn } from "assets/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Lock,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ROADMAP_TIERS } from "../data/roadmap.data";
import { ServerCostMeter } from "./ServerCostMeter";

const BMC_URL = "https://buymeacoffee.com/riffquest";

/** Minimum width per tier segment — below this the bar scrolls sideways. */
const MIN_SEGMENT = 320;
const PAD_X = 48;
const BOX_GAP = 80;

const TRACK_TOP = 78;
const TRACK_H = 18;
const BOX_TOP = TRACK_TOP + TRACK_H + 22;
const CONTAINER_H = 400;

export const FundingProgressBar = ({
  totalRaised,
  supporters,
  raisedThisMonth,
}: {
  totalRaised: number;
  supporters: number;
  raisedThisMonth: number;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const goals = ROADMAP_TIERS.map((t) => t.goal);
  // Stops along the track: $0 start, then every tier.
  const stops = [0, ...goals];
  const gaps = stops.length - 1;
  const nextIndex = ROADMAP_TIERS.findIndex((t) => totalRaised < t.goal);

  // Stretch the segments to fill the full width, but never below MIN_SEGMENT
  // (in which case the bar scrolls).
  const [segment, setSegment] = useState(MIN_SEGMENT);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth - PAD_X * 2;
      setSegment(Math.max(MIN_SEGMENT, avail / gaps));
      updateScroll();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gaps, updateScroll]);

  // Re-check after the width changes (segment affects scrollWidth).
  useEffect(updateScroll, [segment, updateScroll]);

  const scrollBy = (dir: 1 | -1) =>
    scrollRef.current?.scrollBy({ left: dir * segment * 2, behavior: "smooth" });

  const trackWidth = gaps * segment;
  const boxWidth = segment - BOX_GAP;

  // Map a dollar amount to an x position using equal-width segments, so the
  // small early tiers stay readable instead of bunching up.
  const xForAmount = (amount: number) => {
    for (let i = 0; i < stops.length - 1; i++) {
      if (amount <= stops[i + 1]) {
        const span = stops[i + 1] - stops[i] || 1;
        const f = (amount - stops[i]) / span;
        return (i + f) * segment;
      }
    }
    return trackWidth;
  };

  const fillX = xForAmount(totalRaised);

  return (
    <div className='w-full space-y-4'>
      {/* Card 1 — where things stand right now */}
      <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        {/* Headline + primary CTA */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-xs font-medium tracking-wide text-zinc-500'>
            Raised so far
          </p>
          <p className='mt-1 text-5xl font-bold tracking-tight text-zinc-100'>
            ${totalRaised}
          </p>
          <p className='mt-1 text-sm text-zinc-500'>
            {supporters > 0
              ? `from ${supporters} supporter${supporters === 1 ? "" : "s"}`
              : "Be the first to chip in"}
          </p>
        </div>

        <a
          href={BMC_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-background hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50'>
          <Coffee size={18} />
          Support Riff Quest
        </a>
      </div>

      {/* Running cost coverage for the current month — a quiet status line */}
      <ServerCostMeter raisedThisMonth={raisedThisMonth} />
      </section>

      {/* Card 2 — the full roadmap of funding goals */}
      <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <header className='mb-2'>
          <h2 className='text-sm font-semibold text-zinc-200'>The roadmap</h2>
          <p className='mt-0.5 text-xs text-zinc-500'>
            Every goal the running total reaches gets built and unlocked for
            everyone.
          </p>
        </header>

      {/* The bar */}
      <div className='relative -mx-5 mt-4 sm:-mx-6'>
        {/* Left fade + chevron */}
        {canLeft && (
          <>
            <div className='pointer-events-none absolute inset-y-0 left-0 z-30 w-16 bg-gradient-to-r from-zinc-900 to-transparent' />
            <button
              type='button'
              aria-label='Scroll left'
              onClick={() => scrollBy(-1)}
              className='absolute left-2 top-[78px] z-30 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-background hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
              <ChevronLeft size={18} />
            </button>
          </>
        )}

        {/* Right fade + chevron — the "scroll right" hint */}
        {canRight && (
          <>
            <div className='pointer-events-none absolute inset-y-0 right-0 z-30 w-20 bg-gradient-to-l from-zinc-900 to-transparent' />
            <button
              type='button'
              aria-label='Scroll right'
              onClick={() => scrollBy(1)}
              className='absolute right-2 top-[78px] z-30 flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 transition-background hover:bg-cyan-500/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50'>
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScroll}
          className='overflow-x-auto px-5 pb-4 sm:px-6 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-800/50'>
        <div
          className='relative'
          style={{ width: trackWidth + PAD_X * 2, height: CONTAINER_H }}>
          {/* "You are here" bubble with a caret pointing down to the track */}
          <div
            className='absolute top-3 z-20 flex -translate-x-1/2 flex-col items-center'
            style={{ left: PAD_X + fillX }}>
            <span className='whitespace-nowrap rounded bg-cyan-500/15 px-2.5 py-1 text-base font-semibold text-cyan-300'>
              ${totalRaised}
            </span>
            <span className='h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-cyan-500/15' />
          </div>

          {/* Track */}
          <div
            className='absolute rounded-full bg-zinc-800'
            style={{
              left: PAD_X,
              width: trackWidth,
              top: TRACK_TOP,
              height: TRACK_H,
            }}>
            <div
              className='absolute left-0 top-0 h-full rounded-full bg-cyan-500'
              style={{ width: fillX }}
            />
          </div>

          {/* Tier markers + boxes */}
          {ROADMAP_TIERS.map((tier, i) => {
            const reached = totalRaised >= tier.goal;
            const done = tier.done === true;
            const isNext = nextIndex === i;
            const isFeature = tier.kind === "feature";
            const TierIcon = tier.icon;
            const left = PAD_X + (i + 1) * segment;
            return (
              <div key={tier.id}>
                {/* Dot sitting on the track */}
                <span
                  className={cn(
                    "absolute z-10 flex -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-zinc-900/50",
                    isFeature ? "h-9 w-9" : "h-8 w-8",
                    done
                      ? "bg-emerald-500 text-zinc-950"
                      : reached
                      ? "bg-cyan-500 text-zinc-950"
                      : isNext
                      ? "bg-zinc-900 ring-cyan-500/50"
                      : isFeature
                      ? "bg-amber-500/20 ring-amber-500/50"
                      : "bg-zinc-700"
                  )}
                  style={{
                    left,
                    top: TRACK_TOP + TRACK_H / 2 - (isFeature ? 18 : 16),
                  }}>
                  {reached ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isNext ? null : isFeature ? (
                    <Sparkles size={15} className='text-amber-400' />
                  ) : (
                    <Lock size={13} className='text-zinc-500' />
                  )}
                </span>

                {/* Tooltip-styled unlock box */}
                <div
                  className={cn(
                    "absolute -translate-x-1/2 rounded-lg p-3.5 text-left transition-background",
                    isFeature ? "bg-zinc-800 ring-1 ring-amber-500/30" : "bg-zinc-800/60",
                    done && "ring-1 ring-emerald-500/50",
                    isNext && "ring-1 ring-cyan-500/50",
                    !reached && !isNext && !isFeature && "opacity-70"
                  )}
                  style={{ left, top: BOX_TOP, width: boxWidth }}>
                  {/* caret pointing up to the dot */}
                  <span
                    className={cn(
                      "absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px]",
                      isFeature ? "bg-zinc-800" : "bg-zinc-800/60"
                    )}
                  />

                  {isFeature && (
                    <span className='mb-2 inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300'>
                      <Sparkles size={11} />
                      Feature
                    </span>
                  )}

                  <div className='flex items-baseline justify-between gap-2'>
                    <span
                      className={cn(
                        "text-base font-bold",
                        reached
                          ? "text-zinc-200"
                          : isNext
                          ? "text-cyan-300"
                          : "text-zinc-300"
                      )}>
                      ${tier.goal}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        done
                          ? "text-emerald-400"
                          : reached
                          ? "text-zinc-500"
                          : isNext
                          ? "text-cyan-400"
                          : "text-zinc-600"
                      )}>
                      {done
                        ? "Done"
                        : reached
                        ? "Funded"
                        : isNext
                        ? `+$${tier.goal - totalRaised}`
                        : "Locked"}
                    </span>
                  </div>

                  <div className='mt-2 flex items-start gap-2'>
                    <TierIcon
                      size={18}
                      className={cn(
                        "mt-0.5 shrink-0",
                        isFeature ? "text-amber-400" : "text-zinc-400"
                      )}
                    />
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        isFeature
                          ? "font-semibold text-zinc-100"
                          : "text-zinc-300"
                      )}>
                      {tier.label}
                    </p>
                  </div>
                  {tier.description && (
                    <p className='mt-2 text-xs leading-relaxed text-zinc-400'>
                      {tier.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
      </section>
    </div>
  );
};
