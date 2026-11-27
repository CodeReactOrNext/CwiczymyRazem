import { Button } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useHandednessStore, useIsLeftHanded } from "hooks/useHandedness";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { HuntSuccessBurst } from "./HuntSuccessBurst";
import { StartGate } from "./StartGate";

interface HuntStageProps {
  /** The session clock is stopped: the stage sits under the same Start gate as
   *  the tab exercises, and nothing on the board can be clicked or scored. */
  awaitingStart?: boolean;
  /** Starts the session clock — the gate's Start button. */
  onStart?: () => void;
  /** The countdown bar + score row (HuntStats). Spans the whole stage above the
   *  prompt and the board, so the time left reads as the state of the round
   *  rather than as one more number beside the score. */
  stats?: ReactNode;
  /** Target card(s) plus the one-line instruction — the "what am I doing" block. */
  prompt: ReactNode;
  /** Audio and view toggles: everything that changes how the drill is presented. */
  controls?: ReactNode;
  /** The neck diagram. */
  board?: ReactNode;
  /** Progress, Next, dev shortcuts — reads under the board. */
  footer?: ReactNode;
  className?: string;
  /** "column" keeps the prompt over the board at every width, so the neck gets
   *  all of it. */
  layout?: "rail" | "column";
  /** Widens the side rail for prompts that need more than one tile. */
  railClassName?: string;
}

/**
 * Shared frame for every "target + fretboard" drill (click hunts, interval
 * clicks, mic hunts).
 *
 * The countdown and score run across the top of the whole stage. Under them, the
 * neck is a very wide, short shape and the prompt a narrow, tall one. Stacked
 * they waste a screenful of height and push the board off short viewports, so on
 * wide screens the prompt moves into a side rail and the board keeps the rest of
 * the width. Below `xl` everything falls back into one centered column — the neck
 * renders identically either way, it just gets the width it gets.
 *
 * A phone held sideways is the other place the stack doesn't fit: about 390px tall,
 * and the column alone runs past that. There the rail turns into a single row
 * above the board instead (a small tile and the instruction side by side), so the
 * neck keeps the full width and every cell stays big enough to tap.
 */
export function HuntStage({
  awaitingStart,
  onStart,
  stats,
  prompt,
  controls,
  board,
  footer,
  className,
  layout = "rail",
  railClassName,
}: HuntStageProps) {
  return (
    <div className={cn("relative flex w-full max-w-7xl flex-col gap-6 shortwide:gap-2", className)}>
      {awaitingStart && onStart && <StartGate onStart={onStart} countsIn={false} className="rounded-lg" />}

      {stats}

      <div
        className={cn(
          "flex w-full flex-col items-center gap-5",
          layout === "rail" && "xl:flex-row xl:items-center xl:justify-center xl:gap-10",
          "shortwide:gap-2",
        )}>
        <div
          className={cn(
            "flex w-full flex-col items-center gap-3",
            layout === "rail" && "xl:w-48 xl:shrink-0 xl:gap-4",
            "shortwide:flex-row shortwide:flex-wrap shortwide:justify-center shortwide:gap-4",
            railClassName,
          )}>
          {prompt}
          {controls}
        </div>

        {(board || footer) && (
          <div className={cn("flex w-full min-w-0 flex-col items-center gap-4 shortwide:gap-2", layout === "rail" && "xl:flex-1")}>
            {board}
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type TimerTone = "ok" | "warn" | "crit" | "done";

const TIMER_FILL: Record<TimerTone, string> = {
  ok: "bg-cyan-400",
  warn: "bg-amber-400",
  crit: "bg-red-400",
  done: "bg-emerald-400",
};

const TIMER_LABEL: Record<TimerTone, string> = {
  ok: "text-zinc-300",
  warn: "text-amber-400",
  crit: "animate-pulse text-red-400 motion-reduce:animate-none",
  done: "text-emerald-400",
};

interface HuntStatsProps {
  score?: number;
  mistakes?: { count: number; limit: number };
  /** `null` when the drill isn't on a rotation timer. */
  secondsLeft?: number | null;
  /** The round length `secondsLeft` counts down from — sets how full the bar is.
   *  Without it the bar stays full and only the words count down. */
  secondsTotal?: number | null;
  complete?: boolean;
  /** Drill-specific pills (e.g. the chromatic hunt's note counter). */
  children?: ReactNode;
  /** Closes the row — the hunt's Skip. */
  trailing?: ReactNode;
}

/**
 * The row every hunt panel opens with: the round's countdown as a bar that
 * drains across the stage, then the score.
 *
 * The countdown used to be a "5s" pill beside the score and read as one more
 * stat. A bar emptying says "time is running out" before anything is read, and
 * the words next to it ("8 s left") say how much. Amber from 5 s, red from 3 s;
 * a solved round fills it green.
 */
export function HuntStats({ score, mistakes, secondsLeft, secondsTotal, complete, children, trailing }: HuntStatsProps) {
  const { t } = useTranslation("session");
  const counting = secondsLeft !== null && secondsLeft !== undefined;
  const tone: TimerTone = complete ? "done" : !counting ? "ok" : secondsLeft <= 3 ? "crit" : secondsLeft <= 5 ? "warn" : "ok";
  // The number only changes on the second, so the fill slides over that second
  // (duration-1000, linear) and the bar drains smoothly instead of in steps.
  const fraction = complete || !counting || !secondsTotal ? 1 : Math.max(0, Math.min(1, secondsLeft / secondsTotal));

  return (
    <div className={cn("flex w-full flex-wrap items-center gap-x-3 gap-y-2", !counting && "justify-center")}>
      {children}
      {counting && (
        <>
          <div
            role='progressbar'
            aria-label={t("hunt.time_left")}
            aria-valuemin={0}
            aria-valuemax={secondsTotal ?? undefined}
            aria-valuenow={secondsLeft}
            className='h-2.5 min-w-[8rem] flex-1 overflow-hidden rounded-full bg-zinc-800/80'>
            <div
              className={cn(
                "h-full w-full origin-left rounded-full transition-[transform,background-color] duration-1000 ease-linear motion-reduce:transition-none",
                TIMER_FILL[tone],
              )}
              style={{ transform: `scaleX(${fraction})` }}
            />
          </div>
          <span className={cn("shrink-0 text-sm font-bold tabular-nums transition-colors", TIMER_LABEL[tone])}>
            {complete ? t("hunt.solved") : t("hunt.seconds_left", { count: secondsLeft })}
          </span>
        </>
      )}
      {score !== undefined && (
        <span className="shrink-0 rounded bg-amber-500/10 px-2.5 py-0.5 text-sm font-extrabold tabular-nums text-amber-400">
          ★ {score}
        </span>
      )}
      {mistakes && (
        <span className="shrink-0 rounded bg-zinc-800/40 px-2.5 py-0.5 text-sm font-extrabold tabular-nums text-zinc-400">
          ✕ {mistakes.count}/{mistakes.limit}
        </span>
      )}
      {trailing}
    </div>
  );
}

interface HuntAskProps {
  /** Where in the round the player is — "Step 1 of 2", "Solved". */
  step?: string;
  /** The instruction itself. The biggest text in the rail: it is what to do. */
  title: string;
  /** One short line on where to look. */
  hint?: string;
  /** The hint says what went wrong. */
  isAlert?: boolean;
  solved?: boolean;
  className?: string;
}

/**
 * The "what do I do now" block: step, instruction, where to look.
 *
 * The instruction used to sit under the tiles as the smallest text in the rail,
 * read last. It leads now and the tiles illustrate it.
 */
export function HuntAsk({ step, title, hint, isAlert, solved, className }: HuntAskProps) {
  return (
    <div
      aria-live='polite'
      className={cn(
        "flex flex-col items-center gap-1 text-center xl:items-start xl:text-left shortwide:max-w-[14rem] shortwide:items-start shortwide:text-left",
        className,
      )}>
      {step && <p className={cn("text-sm font-semibold", solved ? "text-emerald-400" : "text-zinc-500")}>{step}</p>}
      <p
        className={cn(
          "font-display text-2xl font-extrabold leading-tight tracking-tight [text-wrap:balance] shortwide:text-lg",
          solved ? "text-emerald-400" : "text-zinc-50",
        )}>
        {title}
      </p>
      {hint && <p className={cn("text-sm shortwide:text-xs", isAlert ? "font-semibold text-red-400" : "text-zinc-400")}>{hint}</p>}
    </div>
  );
}

/**
 * The row under the neck: Next on its own, the drill's helpers beside it. The
 * view settings live in HuntViewMenu among the helpers, so the row holds what is
 * used every round and not what is set once.
 */
export function HuntFooter({ onNext, children }: { onNext?: () => void; children?: ReactNode }) {
  const { t } = useTranslation("session");
  return (
    <div className='flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-between'>
      {onNext ? (
        <Button type='button' variant='ghost' onClick={onNext}>
          {t("hunt.next")} <ArrowRight aria-hidden />
        </Button>
      ) : (
        <span className='hidden sm:block' />
      )}
      {children && <div className='flex flex-wrap items-center justify-center gap-2'>{children}</div>}
    </div>
  );
}

interface HuntViewMenuProps {
  showFullNeck: boolean;
  onShowFullNeckChange: (next: boolean) => void;
  /** The "play notes for me" preference, for the drills that have one. */
  noteSound?: boolean;
  onNoteSoundChange?: (next: boolean) => void;
}

/**
 * Whole neck, left-handed and note sound — set once, not every round, so they
 * share one menu instead of three chips in the footer.
 */
export function HuntViewMenu({ showFullNeck, onShowFullNeckChange, noteSound, onNoteSoundChange }: HuntViewMenuProps) {
  const { t } = useTranslation("session");
  const leftHanded = useIsLeftHanded();
  const setLeftHanded = useHandednessStore((state) => state.setLeftHanded);
  const itemClass = "cursor-pointer rounded-md py-2 text-sm font-semibold text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50";
  // Keeps the menu open, so several settings can be flipped in one visit.
  const keepOpen = (event: Event) => event.preventDefault();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='ghost' size='sm'>
          <SlidersHorizontal aria-hidden className='text-zinc-400' /> {t("hunt.view")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        sideOffset={8}
        collisionPadding={16}
        // Clear the session's full-screen layer (z-[999999] desktop / z-[9999999]
        // mobile); the default z-50 would paint underneath it.
        className='z-[99999999] w-56'>
        <DropdownMenuCheckboxItem
          checked={showFullNeck}
          onCheckedChange={(checked) => onShowFullNeckChange(checked === true)}
          onSelect={keepOpen}
          className={itemClass}>
          {t("fretboard.whole_neck")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={leftHanded}
          onCheckedChange={(checked) => setLeftHanded(checked === true)}
          onSelect={keepOpen}
          className={itemClass}>
          {t("fretboard.lefty")}
        </DropdownMenuCheckboxItem>
        {noteSound !== undefined && onNoteSoundChange && (
          <DropdownMenuCheckboxItem
            checked={noteSound}
            onCheckedChange={(checked) => onNoteSoundChange(checked === true)}
            onSelect={keepOpen}
            className={itemClass}>
            {t("hunt.play_notes")}
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Type scale for the tile's value. The square is sized for a note name, but the
 * chord drills put a whole symbol in it ("Cmaj7", "Bm7b5") — three times as wide,
 * and at the note size it ran straight off the edge. Stepping the type down with
 * the length keeps every hunt on the same square instead of giving the chord
 * prompts a tile of their own; one- and two-character values are untouched.
 */
function valueTypeScale(value: ReactNode): string {
  const length = typeof value === "string" ? value.length : 1;
  if (length <= 2) return "text-4xl sm:text-5xl shortwide:text-3xl";
  if (length <= 4) return "text-2xl sm:text-3xl shortwide:text-xl";
  return "text-xl sm:text-2xl shortwide:text-lg";
}

const PROMPT_TILE_TONES = {
  /** What the question is about: the chord symbol or the root note. */
  subject: "bg-zinc-900/90 text-white",
  /** What the question asks for — the degree or interval. */
  ask: "bg-cyan-500/15 text-cyan-200",
  /** The answer, once it has been played. */
  solved: "bg-emerald-900/80 text-emerald-100",
} as const;

interface PromptTileProps {
  value: ReactNode;
  /** The word under the tile that says what the tile is. */
  caption: string;
  tone: keyof typeof PROMPT_TILE_TONES;
  /** Type size + wrapping for the value — the two tiles size their text by
   *  different rules, so each passes its own. */
  valueClassName: string;
  /** Re-runs the swap animation; pass the value the round rolled. */
  animationKey: string;
  /** Lets the tile grow past the square for long labels instead of clipping. */
  grow?: boolean;
  bump?: boolean;
  burst?: { foundCount: number; complete: boolean };
}

function PromptTile({ value, caption, tone, valueClassName, animationKey, grow, bump, burst }: PromptTileProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {burst && <HuntSuccessBurst foundCount={burst.foundCount} complete={burst.complete} />}
        <motion.div
          animate={bump ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "relative flex h-20 items-center justify-center rounded-lg text-center transition-colors duration-slow sm:h-24 shortwide:h-14",
            grow
              ? "min-w-[5rem] px-4 sm:min-w-[6rem] shortwide:min-w-[3.5rem] shortwide:px-2"
              : "w-20 overflow-hidden px-1.5 sm:w-24 shortwide:w-14",
            PROMPT_TILE_TONES[tone],
          )}>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={animationKey}
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.85 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn("relative font-display font-black tracking-tighter", valueClassName)}>
              {value}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>
      <span className="max-w-[7rem] text-center text-xs font-semibold leading-tight text-zinc-400">{caption}</span>
    </div>
  );
}

const MULTI_WORD = /\s/;
const NOTE_NAME = /^[A-G][#b♯♭]?$/;
const ORDINAL = /^(\d+)(st|nd|rd|th)$/;

/**
 * Type scale for the asked-for degree or interval. It is the question itself, so
 * a short label ("5th", "♭3") is set at the note size — the same weight as the
 * chord beside it, instead of the footnote chip it used to be. Spelled-out
 * interval names ("Perfect 5th ↑") are far too wide for that, so they step down
 * and wrap onto a second line rather than run off the tile.
 */
export function promptLabelClass(label: string): string {
  if (MULTI_WORD.test(label)) return "block max-w-[7rem] whitespace-normal text-2xl leading-none sm:text-3xl shortwide:text-lg";
  if (label.length <= 3) return "whitespace-nowrap text-4xl sm:text-5xl shortwide:text-3xl";
  return "whitespace-nowrap text-3xl sm:text-4xl shortwide:text-2xl";
}

/** "5th" reads as a degree rather than a count when the suffix is set small —
 *  and it buys the digit the width to stand as tall as the chord next to it. */
function promptLabelValue(label: string): ReactNode {
  const ordinal = ORDINAL.exec(label);
  if (!ordinal) return label;
  return (
    <>
      {ordinal[1]}
      <span className="align-top text-[0.42em] tracking-normal">{ordinal[2]}</span>
    </>
  );
}

interface HuntPromptCardProps {
  /** What the question is about — a chord symbol ("G7") or a root note ("A"). */
  title: string;
  /** The word under the title tile. Falls back to guessing from the title, which
   *  only the drills that don't say get — "D" is a chord in a chord drill and a
   *  root in an interval one, and the title alone can't tell the two apart. */
  subjectCaption?: string;
  /** What to find inside it — "5th", "♭3", "Perfect 5th ↑". */
  label?: string;
  /** The word under the answer tile once it's revealed; defaults to `label`. */
  answerCaption?: string;
  /** The note it lands on, once the player has played it; `null` keeps it hidden. */
  answer?: string | null;
  complete: boolean;
  foundCount: number;
}

/**
 * The prompt for the drills whose target is hidden behind a question: "the 5th of
 * G7", "a Perfect 5th up from A".
 *
 * Both halves of that question are set on equal tiles. The degree used to be a
 * chip a fifth the size of the chord, which read as a footnote to the chord —
 * but the chord is the easy half. The degree is what actually has to be worked
 * out, so it carries the same weight and takes the accent colour, and the answer
 * lands in its place once it has been played.
 */
export function HuntPromptCard({ title, subjectCaption, label, answerCaption, answer, complete, foundCount }: HuntPromptCardProps) {
  const solved = !!answer;
  return (
    <div className="relative flex items-start justify-center gap-2 sm:gap-3">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-2 top-0 h-20 rounded-lg blur-[18px] transition-opacity duration-slow sm:h-24 shortwide:h-14",
          complete ? "bg-emerald-500/40 opacity-100" : "bg-cyan-500/10 opacity-60",
        )}
      />
      <PromptTile
        value={title}
        caption={subjectCaption ?? (NOTE_NAME.test(title) ? "root" : "chord")}
        tone="subject"
        animationKey={title}
        valueClassName={cn("whitespace-nowrap", valueTypeScale(title))}
      />
      {label && (
        <PromptTile
          // Solved: the tile the question stood in is where the answer belongs,
          // and the degree drops to the caption so the pair still reads as
          // "the 5th of G7 is D" rather than losing the question.
          value={solved ? answer : promptLabelValue(label)}
          caption={solved ? (answerCaption ?? label) : MULTI_WORD.test(label) ? "interval" : "degree"}
          tone={solved ? "solved" : "ask"}
          animationKey={solved ? `answer-${answer}` : label}
          valueClassName={solved ? cn("whitespace-nowrap", valueTypeScale(answer!)) : promptLabelClass(label)}
          grow={!solved && !ORDINAL.test(label) && label.length > 3}
          bump={complete}
          burst={{ foundCount, complete }}
        />
      )}
    </div>
  );
}

/**
 * The loop a sequence drill walks — the chord changes, with the one being played
 * lit and the one after it half-lit. Seeing the next change coming is most of the
 * skill the changes drills are after, so it gets its own affordance rather than
 * leaving the player to remember the progression.
 */
export function HuntSteps({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
  const nextIndex = labels.length > 1 ? (activeIndex + 1) % labels.length : -1;
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {labels.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-bold transition-colors duration-base",
            index === activeIndex
              ? "bg-cyan-500/15 text-cyan-300"
              : index === nextIndex
                ? "bg-zinc-800/40 text-zinc-300"
                : "bg-zinc-800/40 text-zinc-500",
          )}>
          {label}
        </span>
      ))}
    </div>
  );
}

interface HuntTargetCardProps {
  /** The note (or prompt title) the drill is asking for. */
  value: ReactNode;
  complete: boolean;
  /** Drives the found/complete flourish. */
  foundCount: number;
  /** Re-runs the swap animation — pass the target note so a new one animates in. */
  animationKey?: string;
  /** How many positions the note has. Above one, a dot per position sits under
   *  the tile and lights as each is found — a "1 / 2 found" in the footer was
   *  too far from the tile for players to notice a second one was wanted. */
  total?: number;
}

/** The tile on its own — HuntTargetCard adds the found dots under it. */
function HuntTargetTile({ value, complete, foundCount, animationKey }: Omit<HuntTargetCardProps, "total">) {
  return (
    <div className="relative">
      <div
        className={cn(
          "absolute -inset-2 rounded-lg blur-[16px] transition-opacity duration-slow",
          complete ? "bg-emerald-500/40 opacity-100" : "bg-cyan-500/10 opacity-60",
        )}
      />
      <HuntSuccessBurst foundCount={foundCount} complete={complete} />
      <motion.div
        animate={complete ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg px-1.5 transition-colors duration-slow sm:h-24 sm:w-24 shortwide:h-14 shortwide:w-14",
          complete ? "bg-emerald-900/80" : "bg-zinc-900/90",
        )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={animationKey ?? String(value)}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.85 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "whitespace-nowrap font-display font-black tracking-tighter text-white",
              valueTypeScale(value),
            )}>
            {value}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** The big note tile every hunt leads with. */
export function HuntTargetCard({ value, complete, foundCount, animationKey, total = 0 }: HuntTargetCardProps) {
  const tile = <HuntTargetTile value={value} complete={complete} foundCount={foundCount} animationKey={animationKey} />;
  if (total < 2) return tile;
  return (
    <div className="flex flex-col items-center gap-3 shortwide:gap-2">
      {tile}
      <div className="flex gap-2" role="img" aria-label={`${Math.min(foundCount, total)} / ${total}`}>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-3.5 w-3.5 rounded-full transition-[background-color,transform] duration-base motion-reduce:transition-none shortwide:h-2.5 shortwide:w-2.5",
              index < foundCount ? "scale-110 bg-emerald-500" : "bg-zinc-800",
            )}
          />
        ))}
      </div>
    </div>
  );
}
