import { Button, PRESSABLE, PRESSABLE_IN_GROUP } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { fadeUp, popIn, transitions } from "lib/motion/motion";
import { Minus, Mouse, Plus, Pointer, Volume2, VolumeX } from "lucide-react";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";

import {
  gapTestEngine,
  type GapVerdict,
  LEAD_BARS,
  RULER_RANGE,
  T_GOOD,
  T_SUPER,
  TEMPO_MAX,
  TEMPO_MIN,
} from "./metronomeGapTestEngine";

/**
 * Interactive player-slot panel for the "Metronome Gap Test" exercise. It's a
 * thin view over the shared {@link gapTestEngine}; both the desktop and mobile
 * session trees can render it at once and stay in sync. The exercise disables
 * the app metronome (metronomeSpeed: null) and brings its own click track and
 * tempo control, so there's a single metronome.
 *
 * The round is drawn as three fixed fields — Listen, Silence, Tap — whatever
 * the level, so a silence of 16 bars looks like one of 2 with a bigger number.
 * One pad under them starts the round and takes the tap, so the place to press
 * never moves.
 */

const VERDICT: Record<GapVerdict, { text: string; bg: string; chip: string }> = {
  super: { text: "text-emerald-400", bg: "bg-emerald-400", chip: "bg-emerald-400/10 text-emerald-300" },
  good: { text: "text-amber-400", bg: "bg-amber-400", chip: "bg-amber-400/10 text-amber-300" },
  bad: { text: "text-red-400", bg: "bg-red-400", chip: "bg-red-400/10 text-red-300" },
  miss: { text: "text-red-400", bg: "bg-red-400", chip: "bg-red-400/10 text-red-300" },
};

const BEATS = [1, 2, 3, 4];

/** One of the three fields of the round; `active` is the stage being played. */
function Field({
  icon,
  title,
  sub,
  active,
  done,
  className,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  active: boolean;
  done: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between gap-3 rounded-lg p-3 transition-[background-color,opacity] duration-base md:p-4",
        active ? "bg-zinc-800/80" : "bg-zinc-800/40",
        done && "opacity-50",
        className,
      )}>
      <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5'>
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm font-semibold transition-colors duration-base",
            active ? "text-cyan-300" : "text-zinc-100",
          )}>
          {icon}
          {title}
        </span>
        {sub && <span className='text-xs text-zinc-400'>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

/**
 * The silence as "N × 1 2 3 4": what to count, not how far along it is — any
 * progress here would be counting for the player. While the click is silent
 * the four beats only drift in brightness, each on its own slow period (4–8 s,
 * none shared), so the field is alive without a beat, a bar or the length of
 * the silence being readable from it.
 */
function SilentCount({ bars, drifting, compact }: { bars: number; drifting: boolean; compact?: boolean }) {
  return (
    <div className='flex items-center gap-2.5'>
      <motion.span
        key={bars}
        variants={popIn}
        initial='hidden'
        animate='visible'
        transition={transitions.spring}
        className={cn(
          "font-mono text-2xl font-black leading-none tabular-nums transition-colors duration-base",
          drifting ? "text-cyan-300" : "text-zinc-100",
        )}>
        {bars}
      </motion.span>
      <span className='text-sm text-zinc-400' aria-hidden>
        ×
      </span>
      <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")} aria-hidden>
        {BEATS.map((n, i) => (
          <motion.span
            key={n}
            className={cn(
              "grid place-items-center rounded-full font-mono font-bold text-zinc-300 ring-1 ring-inset ring-zinc-500",
              compact ? "h-3.5 w-3.5 text-[0px]" : "h-6 w-6 text-[11px]",
            )}
            initial={false}
            animate={drifting ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.7 }}
            transition={
              drifting
                ? {
                    duration: 4.3 + ((i * 2.7) % 3.9),
                    delay: -((i * 1.9) % 4.3),
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : transitions.base
            }>
            {n}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

interface MetronomeGapTestProps {
  /** Tighter spacing for the mobile content column. */
  compact?: boolean;
  /** Whether the session's practice clock is running. */
  isSessionRunning?: boolean;
  /** Starts that clock — a round is practice time and has to be counted as such. */
  onStartSession?: () => void;
}

export function MetronomeGapTest({ compact, isSessionRunning, onStartSession }: MetronomeGapTestProps) {
  const { t } = useTranslation("session");
  const { t: tMetronome } = useTranslation("metronome");
  const reduceMotion = useReducedMotion();
  const s = useSyncExternalStore(gapTestEngine.subscribe, gapTestEngine.getSnapshot, gapTestEngine.getSnapshot);
  // A tap is taken on pointerdown (for timing) and ends the round — the click
  // that follows on the same pad must not start the next one.
  const swallowClick = useRef(false);

  useEffect(() => {
    gapTestEngine.retain();
    return () => gapTestEngine.release();
  }, []);

  const { running, result: res } = s;

  // Starting a round starts the practice clock, so the test can never be taken
  // against a stopped timer. startTimer no-ops when it is already running, which
  // is what makes the double-mounted desktop + mobile panels harmless here.
  useEffect(() => {
    if (running) onStartSession?.();
  }, [running, onStartSession]);

  // The mirror of that: pausing the session drops the live round instead of
  // letting it time out into the history as a miss nobody was there to answer.
  useEffect(() => {
    if (isSessionRunning === false) gapTestEngine.stop();
  }, [isSessionRunning]);

  const listening = running && s.phase === "lead";
  const silent = running && s.phase === "gap";
  const shown = !running && res ? res : null;
  // A PERFECT has already raised the level; the fields still show the round played.
  const bars = shown && s.history[0] ? s.history[0].gap : s.gapBars;

  // The classic misreading: tapping the "1" where the click stops, not the one
  // after the silence. That lands whole bars early — say so, in bars, instead
  // of reporting thousands of milliseconds "off the beat".
  const barMs = (4 * 60000) / s.bpm;
  const barsEarly =
    shown && shown.dev !== null && shown.dev < -barMs / 2 ? Math.max(1, Math.round(-shown.dev / barMs)) : 0;

  const [headline, sub] = listening
    ? [t("gap.head_listen"), t("gap.sub_listen")]
    : silent
      ? [t("gap.head_gap"), t("gap.sub_gap", { bars })]
      : shown
        ? barsEarly
          ? [t("gap.head_soon"), t("gap.sub_soon", { early: barsEarly, bars })]
          : shown.verdict === "super"
            ? [t("gap.head_super"), t("gap.sub_super", { ms: T_SUPER, bars: s.gapBars })]
            : shown.verdict === "good"
              ? [t("gap.head_good"), t("gap.sub_good", { ms: T_SUPER })]
              : shown.verdict === "miss"
                ? [t("gap.head_miss"), t("gap.sub_miss")]
                : [
                    (shown.dev ?? 0) > 0 ? t("gap.head_late") : t("gap.head_early"),
                    t("gap.sub_bad", { ms: T_GOOD }),
                  ]
        : [t("gap.head_idle"), t("gap.sub_idle", { lead: LEAD_BARS, bars })];

  const padTitle = listening
    ? t("gap.pad_wait")
    : silent
      ? t("gap.pad_tap")
      : shown
        ? shown.verdict === "super"
          ? t("gap.level_up", { bars: s.gapBars })
          : t("timing.try_again")
        : t("start");

  const showRuler = !!shown && shown.dev !== null && !barsEarly;
  const markerPct =
    shown && shown.dev !== null ? Math.max(0, Math.min(100, 50 + (shown.dev / RULER_RANGE) * 50)) : 50;
  const zonePct = (T_SUPER / RULER_RANGE) * 50;
  const iconSize = "h-4 w-4 shrink-0";

  return (
    <div className={cn("flex w-full flex-col rounded-xl bg-zinc-900/40 text-left", compact ? "gap-4 p-4" : "gap-4 p-5")}>
      {/* What to do right now — and, after a round, how it went */}
      <div className='flex min-h-[64px] flex-wrap items-start justify-between gap-x-8 gap-y-3'>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={`${s.phase}-${shown?.verdict ?? ""}-${running}`}
            variants={fadeUp}
            initial='hidden'
            animate='visible'
            exit='hidden'
            className='flex min-w-0 flex-1 basis-72 flex-col gap-1'>
            <h3
              className={cn(
                "text-balance text-lg font-bold leading-tight tracking-tight md:text-xl",
                shown ? VERDICT[shown.verdict].text : "text-zinc-100",
              )}>
              {headline}
            </h3>
            <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>{sub}</p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {showRuler && shown && shown.dev !== null && (
            <motion.div
              key={s.history.length}
              variants={fadeUp}
              initial='hidden'
              animate='visible'
              exit='hidden'
              className='flex items-center gap-5'>
              <span
                className={cn(
                  "font-mono text-3xl font-black leading-none tabular-nums",
                  VERDICT[shown.verdict].text,
                )}>
                {`${shown.dev > 0 ? "+" : ""}${shown.dev}`}
                <span className='ml-1 text-sm font-bold text-zinc-400'>ms</span>
              </span>
              <div className='flex w-48 flex-col gap-1.5 md:w-60'>
                <div className='relative h-3.5'>
                  <div className='absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-800' />
                  {/* the PERFECT window */}
                  <div
                    className='absolute top-1/2 h-1 -translate-y-1/2 bg-emerald-500/40'
                    style={{ left: `${50 - zonePct}%`, width: `${zonePct * 2}%` }}
                  />
                  <div className='absolute left-1/2 top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-400' />
                  <motion.div
                    className={cn(
                      "absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      VERDICT[shown.verdict].bg,
                    )}
                    initial={{ left: "50%" }}
                    animate={{ left: `${markerPct}%` }}
                    transition={transitions.spring}
                  />
                </div>
                <div className='flex justify-between text-[11px] text-zinc-400'>
                  <span>{t("gap.ruler_early")}</span>
                  <span>{t("gap.ruler_late")}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The round: Listen → Silence → Tap */}
      <div className='flex items-stretch gap-1.5 md:gap-2'>
        <Field
          className='flex-1'
          icon={<Volume2 className={iconSize} strokeWidth={2.25} aria-hidden />}
          title={t("gap.step_listen")}
          sub={
            listening
              ? t("gap.listen_bar", { bar: s.leadBar + 1, total: LEAD_BARS })
              : t("gap.step_listen_sub", { bars: LEAD_BARS })
          }
          active={listening}
          done={silent || !!shown}>
          <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")} aria-hidden>
            {BEATS.map((n, i) => {
              const on = listening && s.ledIndex === i;
              return (
                <span
                  key={n}
                  className={cn(
                    "grid place-items-center rounded-full font-mono font-bold transition-[background-color,color,scale] duration-fast",
                    compact ? "h-3.5 w-3.5 text-[0px]" : "h-6 w-6 text-[11px]",
                    on ? "bg-cyan-400 text-cyan-950" : "bg-zinc-700/70 text-zinc-300",
                    on && (s.ledAccent ? "scale-125" : "scale-110"),
                  )}>
                  {n}
                </span>
              );
            })}
          </div>
        </Field>

        <Field
          className='flex-1'
          icon={<VolumeX className={iconSize} strokeWidth={2.25} aria-hidden />}
          title={t("gap.step_silence")}
          sub={t("gap.silence_sub")}
          active={silent}
          done={!!shown}>
          <SilentCount bars={bars} drifting={silent && !reduceMotion} compact={compact} />
        </Field>

        <Field
          className={compact ? "shrink-0" : "flex-1"}
          icon={<Pointer className={iconSize} strokeWidth={2.25} aria-hidden />}
          title={t("gap.step_tap")}
          sub={compact ? undefined : t("gap.tap_sub")}
          active={silent}
          done={false}>
          <motion.span
            key={shown ? `hit-${s.history.length}` : "target"}
            variants={popIn}
            initial={shown ? "hidden" : false}
            animate='visible'
            transition={transitions.spring}
            className={cn(
              "grid place-items-center rounded-full font-mono font-black",
              compact ? "h-3.5 w-3.5 text-[0px]" : "h-6 w-6 text-[11px]",
              shown
                ? cn(VERDICT[shown.verdict].bg, "text-zinc-950")
                : "text-cyan-300 ring-2 ring-inset ring-cyan-400/80",
            )}>
            1
          </motion.span>
        </Field>
      </div>

      {/* One pad: starts the round, takes the tap */}
      <button
        type='button'
        onPointerDown={(e) => {
          swallowClick.current = running;
          if (running) gapTestEngine.tap(e.timeStamp);
        }}
        onClick={() => {
          if (swallowClick.current) {
            swallowClick.current = false;
            return;
          }
          if (!running) gapTestEngine.start();
        }}
        className={cn(
          PRESSABLE,
          "group flex min-h-[64px] w-full touch-manipulation flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border-b-black/25 px-4 py-4 transition-colors duration-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          listening
            ? "bg-zinc-800/60 text-zinc-500"
            : silent
              ? // Live, but not lit: a bright pad the moment the click stops reads as "press now".
                "bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}>
        <span className='text-balance text-center text-base font-bold'>{padTitle}</span>
        {!listening &&
          (compact ? (
            <Pointer className='h-5 w-5' strokeWidth={2} aria-hidden />
          ) : (
            <span className='flex items-center gap-2.5' aria-hidden>
              <span
                className={cn(
                  PRESSABLE_IN_GROUP,
                  "rounded-md border-b-black/30 px-7 py-1 text-xs font-bold",
                  silent ? "bg-white/10" : "bg-black/10",
                )}>
                {t("gap.key_space")}
              </span>
              <span className='text-xs opacity-70'>{t("gap.or")}</span>
              <Mouse className='h-5 w-5' strokeWidth={2} />
            </span>
          ))}
      </button>

      {/* Tempo, recent attempts, level reset — one quiet row */}
      <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 shrink-0'
            onClick={() => gapTestEngine.setBpm(s.bpm - 1)}
            disabled={s.bpm <= TEMPO_MIN}
            aria-label={tMetronome("decrease")}>
            <Minus className='h-4 w-4' strokeWidth={2.5} />
          </Button>
          <span className='w-[70px] text-center'>
            <span translate='no' className='font-mono text-lg font-black tabular-nums text-zinc-100'>
              {s.bpm}
            </span>
            <span translate='no' className='ml-1 text-[11px] font-bold text-zinc-400'>
              BPM
            </span>
          </span>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 shrink-0'
            onClick={() => gapTestEngine.setBpm(s.bpm + 1)}
            disabled={s.bpm >= TEMPO_MAX}
            aria-label={tMetronome("increase")}>
            <Plus className='h-4 w-4' strokeWidth={2.5} />
          </Button>
          <Slider
            value={[s.bpm]}
            min={TEMPO_MIN}
            max={TEMPO_MAX}
            step={1}
            onValueChange={(value) => gapTestEngine.setBpm(value[0])}
            className='ml-2 w-32 cursor-pointer py-2 md:w-44'
          />
        </div>

        <div className='flex min-w-0 flex-1 basis-56 flex-wrap items-center gap-1.5'>
          <span className='mr-1 text-xs font-bold text-zinc-400'>{t("gap.recent")}</span>
          {s.history.length > 0 ? (
            <AnimatePresence initial={false}>
              {s.history.slice(0, 8).map((a, i) => (
                <motion.span
                  key={s.history.length - i}
                  layout
                  variants={popIn}
                  initial='hidden'
                  animate='visible'
                  transition={transitions.spring}
                  title={t("gap.silent_bars", { bars: a.gap })}
                  className={cn(
                    "rounded-md px-2 py-1 font-mono text-[11px] font-bold tabular-nums",
                    VERDICT[a.cls].chip,
                  )}>
                  {a.dev === null ? t("gap.miss") : `${a.dev > 0 ? "+" : ""}${a.dev}`}
                </motion.span>
              ))}
            </AnimatePresence>
          ) : (
            <span className='text-xs text-zinc-500'>{t("gap.no_attempts")}</span>
          )}
        </div>

        <Button variant='ghost' size='sm' onClick={() => gapTestEngine.reset()} disabled={running}>
          {t("gap.reset")}
        </Button>
      </div>
    </div>
  );
}
