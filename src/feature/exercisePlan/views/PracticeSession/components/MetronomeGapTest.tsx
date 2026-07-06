import { cn } from "assets/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Volume2, VolumeX } from "lucide-react";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";

import { Metronome } from "../../../components/Metronome/Metronome";
import { gapTestEngine, type GapVerdict, RULER_RANGE, TEMPO_MAX, TEMPO_MIN } from "./metronomeGapTestEngine";

/**
 * Interactive player-slot panel for the "Metronome Gap Test" exercise. It's a
 * thin view over the shared {@link gapTestEngine}; both the desktop and mobile
 * session trees can render it at once and stay in sync. The exercise disables
 * the app metronome (metronomeSpeed: null) and provides its own click track,
 * reusing the app's <Metronome> control for tempo so there's a single metronome.
 */

const LEAD_BARS = 2;

const VERDICT: Record<GapVerdict, { num: string; dot: string; fill: string; chip: string }> = {
  super: { num: "text-emerald-400", dot: "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]", fill: "bg-emerald-500/70", chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  good: { num: "text-amber-400", dot: "bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.9)]", fill: "bg-amber-500/70", chip: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  bad: { num: "text-red-400", dot: "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.9)]", fill: "bg-red-500/70", chip: "border-red-400/30 bg-red-400/10 text-red-300" },
  miss: { num: "text-red-400", dot: "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.9)]", fill: "bg-red-500/70", chip: "border-red-400/30 bg-red-400/10 text-red-300" },
};

/** A mouse cursor with click ripples — the "click" half of the tap affordance. */
function CursorClick({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const loop = active && !reduce;
  return (
    <div className="relative grid h-10 w-10 place-items-center">
      {loop &&
        [0, 0.55].map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className="absolute h-7 w-7 rounded-full border border-cyan-400/60"
            initial={{ scale: 0.5, opacity: 0.7 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
      <motion.svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        animate={loop ? { scale: [1, 0.86, 1] } : { scale: 1 }}
        transition={loop ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        className="relative">
        <path
          d="M5 2.5 L5 18.5 L9 14.8 L11.8 20.6 L14 19.6 L11.2 13.9 L16 13.9 Z"
          className={active ? "fill-cyan-400 stroke-cyan-200" : "fill-zinc-600 stroke-zinc-500"}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </motion.svg>
    </div>
  );
}

/** Touch "tap here" indicator for mobile — ripples around a fingertip dot. */
function TouchTap({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const loop = active && !reduce;
  return (
    <div className="relative grid h-12 w-12 place-items-center">
      {loop &&
        [0, 0.55].map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className="absolute h-9 w-9 rounded-full border-2 border-cyan-400/60"
            initial={{ scale: 0.5, opacity: 0.7 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
      <motion.span
        aria-hidden
        className={cn(
          "h-6 w-6 rounded-full",
          active ? "bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" : "bg-zinc-600",
        )}
        animate={loop ? { scale: [1, 0.8, 1] } : { scale: 1 }}
        transition={loop ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      />
    </div>
  );
}

/**
 * Illustrative "press now" affordance. On desktop: a spacebar keycap that
 * depresses on a loop next to a mouse cursor with click ripples. On mobile
 * (compact) there's no keyboard, so it collapses to a single touch-tap ripple.
 * Everything comes alive only when `active` (the silent phase) so the cue
 * doesn't say "tap yet" during the audible lead-in.
 */
function TapAffordance({ active, compact }: { active: boolean; compact?: boolean }) {
  const reduce = useReducedMotion();
  const loop = active && !reduce;
  if (compact) return <TouchTap active={active} />;
  return (
    <div className="flex items-center gap-4">
      {/* Spacebar keycap */}
      <motion.div
        aria-hidden
        animate={
          loop
            ? {
                y: [0, 3, 0],
                boxShadow: [
                  "0 4px 0 0 rgba(34,211,238,0.40)",
                  "0 1px 0 0 rgba(34,211,238,0.40)",
                  "0 4px 0 0 rgba(34,211,238,0.40)",
                ],
              }
            : { y: 0, boxShadow: `0 4px 0 0 rgba(34,211,238,${active ? 0.4 : 0.18})` }
        }
        transition={loop ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        className={cn(
          "select-none rounded-md border px-9 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em]",
          active ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100" : "border-white/15 bg-white/5 text-zinc-500",
        )}>
        space
      </motion.div>

      <span
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wider",
          active ? "text-cyan-300/70" : "text-zinc-600",
        )}>
        or
      </span>

      <CursorClick active={active} />
    </div>
  );
}

/** One labelled step in the "how it works" strip; `active` marks the current stage. */
function Step({ icon, title, sub, active }: { icon: ReactNode; title: string; sub: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-[104px] flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-center transition-all duration-200",
        active
          ? "border-cyan-400/60 bg-cyan-400/[0.10] shadow-[0_0_18px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-white/[0.03]",
      )}>
      <span className={cn("flex h-5 items-center justify-center", active ? "text-cyan-300" : "text-zinc-400")}>{icon}</span>
      <span className={cn("text-sm font-bold", active ? "text-cyan-100" : "text-zinc-300")}>{title}</span>
      <span className={cn("text-[11px] leading-tight", active ? "text-cyan-300/70" : "text-zinc-500")}>{sub}</span>
    </div>
  );
}

interface MetronomeGapTestProps {
  /** Tighter spacing for the mobile content column. */
  compact?: boolean;
}

export function MetronomeGapTest({ compact }: MetronomeGapTestProps) {
  const s = useSyncExternalStore(gapTestEngine.subscribe, gapTestEngine.getSnapshot, gapTestEngine.getSnapshot);

  useEffect(() => {
    gapTestEngine.retain();
    return () => gapTestEngine.release();
  }, []);

  const { running, result: res } = s;
  // The "Tap" stage begins in the final silent bar (get-ready) and stays through the result.
  const tapActive = (s.phase === "gap" && s.getReady) || s.phase === "result";

  const phaseText = running
    ? s.phase === "lead"
      ? `Listen — ${LEAD_BARS} bars, feel the pulse`
      : s.getReady
        ? "Get ready — tap the returning “1”"
        : `Counting the silence — bar ${s.silentBar + 1} of ${s.gapBars}`
    : res
      ? res.verdict === "super"
        ? "Nailed it — level up!"
        : res.verdict === "good"
          ? "Close — repeat it to lock a PERFECT"
          : res.verdict === "miss"
            ? "No hit in time — try again"
            : "Off the grid — try again"
      : `Press Start. Keep the pulse through the silence and tap once, on the very next “1”.`;

  const markerPct =
    res && res.dev !== null ? Math.max(0, Math.min(100, 50 + (res.dev / RULER_RANGE) * 50)) : 50;
  const fillLeftPct = Math.min(50, markerPct);
  const fillWidthPct = Math.abs(markerPct - 50);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-white/5",
        "bg-gradient-to-b from-white/[0.03] to-transparent",
        compact ? "p-4" : "p-5 md:p-6",
      )}>
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-cyan-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Gap Test
          </span>
        </div>

        {/* How it works — the active card follows the current stage */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Step
            icon={<Volume2 className="h-4 w-4" strokeWidth={2.25} />}
            title="Listen"
            sub={`${LEAD_BARS} bars of clicks`}
            active={s.phase === "lead"}
          />
          <ChevronRight className={cn("h-4 w-4 shrink-0", s.phase === "gap" && !s.getReady ? "text-cyan-400/70" : "text-zinc-600")} aria-hidden />
          <Step
            icon={<VolumeX className="h-4 w-4" strokeWidth={2.25} />}
            title="Silence"
            sub={s.phase === "gap" ? `bar ${s.silentBar + 1} of ${s.gapBars}` : `${s.gapBars} bars · keep the pulse`}
            active={s.phase === "gap" && !s.getReady}
          />
          <ChevronRight className={cn("h-4 w-4 shrink-0", tapActive ? "text-cyan-400/70" : "text-zinc-600")} aria-hidden />
          <Step
            active={tapActive}
            icon={
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full border font-mono text-[10px] font-bold",
                  tapActive ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100" : "border-white/15 bg-white/5 text-zinc-400",
                )}>
                1
              </span>
            }
            title="Tap"
            sub="on the returning “1”"
          />
        </div>

        {/* Stage: LEDs + phase + action */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => {
              const on = s.ledIndex === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "relative grid place-items-center rounded-full border transition-all duration-75",
                    compact ? "h-7 w-7" : "h-9 w-9",
                    on
                      ? "border-cyan-400 bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.7)]"
                      : "border-white/10 bg-white/5",
                    on && s.ledAccent ? "scale-125" : on ? "scale-110" : "scale-100",
                  )}>
                  <span className={cn("font-mono text-[11px] font-bold", on ? "text-cyan-950" : "text-zinc-500")}>
                    {i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="min-h-[20px] text-balance text-center text-sm font-semibold text-zinc-300">
            {phaseText}
          </div>

          {running ? (
            <button
              type="button"
              onPointerDown={(e) => gapTestEngine.tap(e.timeStamp)}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 py-5 transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400",
                s.getReady
                  ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                  : s.phase === "gap"
                    ? "border-cyan-400/40 bg-cyan-400/[0.04]"
                    : "border-white/10 bg-white/[0.03]",
              )}>
              <TapAffordance active={s.getReady} compact={compact} />
              <span
                className={cn(
                  "text-xs font-semibold",
                  s.getReady ? "text-cyan-200" : "text-zinc-500",
                )}>
                {s.getReady
                  ? compact
                    ? "tap the “1”"
                    : "tap the “1” — Space or click"
                  : s.phase === "gap"
                    ? "keep counting…"
                    : "listen…"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => gapTestEngine.start()}
              className="rounded-xl bg-cyan-500 px-8 py-3 text-base font-bold text-zinc-950 transition hover:bg-cyan-400 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
              {res ? (res.verdict === "super" ? `Level up → ${s.gapBars} silent bars` : "Try again") : "Start"}
            </button>
          )}
        </div>

        {/* Result: just how far off + where you landed */}
        {res && (
          <motion.div
            key={s.history.length}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-xl border border-white/5 bg-black/20 px-4 py-4">
            <div className="text-center leading-none">
              <span className={cn("font-mono text-4xl font-black tabular-nums", VERDICT[res.verdict].num)}>
                {res.dev === null ? "—" : `${res.dev > 0 ? "+" : ""}${res.dev}`}
                {res.dev !== null && <span className="ml-1.5 text-base font-bold text-zinc-500">ms</span>}
              </span>
            </div>

            <div className="relative mx-auto mt-3.5 h-3 max-w-[280px]">
              {/* track */}
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/[0.07]" />
              {/* target (0) notch */}
              <div className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
              {res.dev !== null && (
                <>
                  {/* fill from center to where you landed */}
                  <div
                    className={cn("absolute top-1/2 h-1 -translate-y-1/2 rounded-full transition-all duration-500", VERDICT[res.verdict].fill)}
                    style={{ left: `${fillLeftPct}%`, width: `${fillWidthPct}%` }}
                  />
                  {/* the tap marker */}
                  <div
                    className={cn("absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black/40 transition-all duration-500", VERDICT[res.verdict].dot)}
                    style={{ left: `${markerPct}%` }}
                  />
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Tempo + progress: metronome and Recent side by side on desktop, stacked on mobile */}
        <div className={cn("flex gap-4", compact ? "flex-col" : "flex-row items-stretch")}>
          {/* Tempo — the app's own metronome control (single metronome) */}
          <div className={cn(compact ? "" : "flex-1")}>
            <Metronome
              metronome={{
                bpm: s.bpm,
                setBpm: (v: number) => gapTestEngine.setBpm(v),
                minBpm: TEMPO_MIN,
                maxBpm: TEMPO_MAX,
              }}
            />
          </div>

          {/* Progress: level + recent attempts */}
          <div className={cn("flex flex-col gap-3", compact ? "" : "flex-1")}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-zinc-300">
                Silence: <span className="font-mono text-cyan-300">{s.gapBars}</span> bars
              </span>
              <button
                type="button"
                onClick={() => gapTestEngine.reset()}
                disabled={running}
                className="rounded-md border border-white/10 px-2.5 py-1 text-zinc-400 transition hover:border-cyan-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                Reset level
              </button>
            </div>

            <div className="flex flex-1 flex-col rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recent</div>
              {s.history.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {s.history.slice(0, 12).map((a, i) => (
                    <span
                      key={i}
                      title={`silent bars: ${a.gap}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] font-bold tabular-nums",
                        VERDICT[a.cls].chip,
                      )}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {a.dev === null ? "miss" : `${a.dev > 0 ? "+" : ""}${a.dev}`}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center py-3 text-[11px] text-zinc-600">
                  No attempts yet — press Start.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
