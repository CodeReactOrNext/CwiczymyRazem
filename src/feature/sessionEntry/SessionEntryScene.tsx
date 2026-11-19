import { cn } from "assets/lib/utils";
import { LINE_SETS, NOTE, PICK, STAR } from "components/AnimeMoment/AnimeMoment";
import { KostekStill } from "components/Mascot/Kostek";
import { SessionLoadingSteps } from "feature/exercisePlan/views/PracticeSession/components/SessionLoadingSteps";
import type { CSSProperties } from "react";
import { memo, useEffect } from "react";

import styles from "./SessionEntry.module.css";
import { markSessionEntryScene, useSessionEntryStore } from "./sessionEntryStore";

/** One strum, in seconds (`--p` in the stylesheet). */
const STRUM = 1.5;
/** The stroke down: where in the strum it runs, and how far the tip travels,
 *  in string gaps from the middle of the six (the `strum` keyframes). */
const STROKE = { from: 0.22, to: 0.32, top: -5.6, bottom: 3.6 };
/** Thickness in px, low E on top as a guitar faces you. */
const STRINGS = [3.2, 2.7, 2.2, 1.7, 1.4, 1.1];

/** When the tip reaches string `i`, in seconds from the start of the strum. */
const hitAt = (i: number) => {
  const y = i - (STRINGS.length - 1) / 2;
  const share = (y - STROKE.top) / (STROKE.bottom - STROKE.top);
  return (STROKE.from + (STROKE.to - STROKE.from) * share) * STRUM;
};

const CYAN = "#22d3ee";
const AMBER = "#f4b63e";
const WHITE = "#fafafa";
const INK = "#09090b";

/** Rings off the strike, outermost first. */
const SHOCKS = [
  { c: AMBER, b: 5, d: 0 },
  { c: CYAN, b: 3, d: 0.09 },
  { c: WHITE, b: 2, d: 0.18 },
];
/** Short ink streaks shooting out of it. */
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  a: (i / 14) * 360 + (i % 2 ? 7 : -5),
  len: 50 + ((i * 41) % 60),
  from: 96 + ((i * 29) % 50),
  d: (i % 4) * 0.02,
}));
/** Picks, notes and stars thrown out by it; distances in string gaps. */
const BITS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.14 : -0.1);
  const dist = 8 + ((i * 5) % 7);
  const kind = i % 3;
  return {
    x: (Math.cos(angle) * dist).toFixed(2),
    y: (Math.sin(angle) * dist * 0.75).toFixed(2),
    r: (i % 2 ? 1 : -1) * (120 + ((i * 37) % 200)),
    s: (1.1 + ((i * 7) % 10) / 12).toFixed(2),
    path: kind === 0 ? PICK : kind === 1 ? NOTE : STAR,
    fill: kind === 0 ? CYAN : kind === 1 ? AMBER : i % 2 ? WHITE : AMBER,
    d: (i % 5) * 0.025,
  };
});
/** The afterimages behind the stroke, and how far behind. */
const GHOSTS = [
  { c: AMBER, lag: 0.07 },
  { c: CYAN, lag: 0.035 },
];

/** The anime moment's focus lines as three pre-drawn cels. */
const FocusLines = () => (
  <div aria-hidden className={styles.focus}>
    {LINE_SETS.map((set, k) => (
      <svg
        key={k}
        viewBox='-500 -500 1000 1000'
        preserveAspectRatio='xMidYMid slice'
        className={cn(styles.focusFrame, k === 1 && styles.focusFrame1, k === 2 && styles.focusFrame2)}>
        {set.map((line, i) => (
          <path
            key={i}
            d={line.d}
            fill={line.accent === "a" ? CYAN : line.accent === "b" ? AMBER : "#3f3f46"}
            opacity={line.accent ? 0.35 : 0.55}
          />
        ))}
      </svg>
    ))}
    <div className={styles.focusClear} />
  </div>
);

/** A string bowed one way, with the lens it sweeps: one cel of the swing. */
const Wave = ({ up, className }: { up: boolean; className?: string }) => (
  <svg viewBox='0 0 100 20' preserveAspectRatio='none' className={cn(styles.wave, className)}>
    <path className={styles.waveLens} d='M0 10 Q50 -8 100 10 Q50 28 0 10 Z' />
    <path className={styles.waveLine} d={up ? "M0 10 Q50 -8 100 10" : "M0 10 Q50 28 100 10"} />
  </svg>
);

/**
 * What plays on the bands while a session loads: six strings across the
 * screen, and Kostek — a pick — flying in from the right and striking them.
 * Each string lights up and swings as the tip passes it, and the hit runs
 * along it to both edges. On a long load he keeps strumming, and the steps
 * still to go appear underneath.
 *
 * The first strike is staged like the end-of-session moment: focus lines snap
 * in around it, rings and streaks shoot out, picks and notes fly, and two
 * coloured afterimages trail the pick.
 */
export const SessionEntryScene = memo(function SessionEntryScene() {
  const steps = useSessionEntryStore((s) => s.steps);

  useEffect(() => {
    markSessionEntryScene();
  }, []);

  return (
    <div className={styles.scene}>
      <div className={styles.shake}>
        <FocusLines />
        {STRINGS.map((w, i) => (
          <div
            key={i}
            aria-hidden
            className={styles.string}
            style={{ "--i": i, "--w": `${w}px`, "--hit": `${hitAt(i).toFixed(3)}s` } as CSSProperties}>
            <span className={styles.core} />
            <span className={styles.lit} />
            <div className={styles.ring}>
              <Wave up />
              <Wave up={false} className={styles.waveB} />
            </div>
            <span className={styles.pulse} />
          </div>
        ))}
        <div aria-hidden>
          {SHOCKS.map((shock, i) => (
            <span
              key={i}
              className={styles.shock}
              style={{ "--c": shock.c, "--b": `${shock.b}px`, "--d": `${shock.d}s` } as CSSProperties}
            />
          ))}
          {SPARKS.map((spark, i) => (
            <span key={i} className={styles.spark} style={{ "--a": `${spark.a}deg` } as CSSProperties}>
              <span
                className={styles.sparkLine}
                style={{ "--len": `${spark.len}px`, "--from": `${spark.from}px`, "--d": `${spark.d}s` } as CSSProperties}
              />
            </span>
          ))}
        </div>
        <div className={styles.fly}>
          {GHOSTS.map((ghost) => (
            <div key={ghost.c} aria-hidden className={styles.ghost} style={{ "--lag": `${ghost.lag}s` } as CSSProperties}>
              <KostekStill mood='focus' hands={false} shadow={false} fg={ghost.c} shade={ghost.c} bg={INK} className='h-full w-full' />
            </div>
          ))}
          <div className={styles.striker}>
            <KostekStill mood='focus' hands={false} shadow={false} bg={INK} className='h-full w-full' />
          </div>
        </div>
        <div aria-hidden>
          {BITS.map((bit, i) => (
            <svg
              key={i}
              viewBox='-12 -12 24 24'
              className={styles.bit}
              style={
                {
                  "--x": `calc(var(--g) * ${bit.x})`,
                  "--y": `calc(var(--g) * ${bit.y})`,
                  "--r": `${bit.r}deg`,
                  "--s": bit.s,
                  "--d": `${bit.d}s`,
                } as CSSProperties
              }>
              <path d={bit.path} fill={bit.fill} />
            </svg>
          ))}
        </div>
      </div>
      {steps.length > 0 && (
        <div className={cn(styles.steps, "rounded-lg bg-zinc-900/80 px-6 py-5")}>
          <SessionLoadingSteps steps={steps} />
        </div>
      )}
    </div>
  );
});
