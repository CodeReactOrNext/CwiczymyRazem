import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { STRING_COLORS } from "feature/exercisePlan/views/PracticeSession/components/tablatureRenderData";
import {
  Check,
  ChevronDown,
  Mic,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  SkipForward,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { GiGuitar, GiMetronome } from "react-icons/gi";

/**
 * A still of the practice session, drawn with the session's own classes and
 * string colours, for the walk-through before the first riff. One control is
 * lit, the rest of the screen steps back, so the player sees where the thing
 * the slide talks about lives before the real session opens.
 *
 * `desktop` mirrors the session's bottom bar (mic row, tempo bar) and the
 * Look/zoom keys on the board; `phone` mirrors the phone session: the board,
 * the Look row and the bottom strip, with the slide-up panel open whenever the
 * lit control lives in it.
 */
export type PreviewFocus = "tempo" | "mic" | "tab" | null;

const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];
/** Beats of the riff shown on the board. */
const SHOWN_BEATS = 8;
/** Where the cursor stands, as a share of the board's width. */
const CURSOR_AT = 0.38;

const KEY =
  "flex shrink-0 items-center justify-center rounded-lg border-b-[3px] border-b-black/30 bg-clip-padding font-semibold";

/**
 * The lit control: a white outline with a see-through gap (a ring offset would
 * paint its own colour over the black board); everything else dims.
 */
const Lit = ({
  on,
  dimmed,
  className,
  children,
}: {
  on: boolean;
  dimmed: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "rounded-xl transition-opacity duration-base",
      // The style as an arbitrary property: tailwind-merge drops a bare
      // `outline` next to `outline-2`, which left the outline with no style.
      on &&
        "outline-2 outline-offset-2 outline-white [outline-style:solid] lg:outline-offset-4",
      dimmed && !on && "opacity-30",
      className,
    )}>
    {children}
  </div>
);

interface PlacedNote {
  string: number;
  fret: number;
  start: number;
  duration: number;
}

const placeNotes = (tablature: TablatureMeasure[]): PlacedNote[] => {
  const notes: PlacedNote[] = [];
  let t = 0;
  for (const measure of tablature) {
    for (const beat of measure.beats) {
      if (t >= SHOWN_BEATS) return notes;
      for (const note of beat.notes) {
        notes.push({
          string: note.string,
          fret: note.fret,
          start: t,
          duration: beat.duration,
        });
      }
      t += beat.duration;
    }
  }
  return notes;
};

const Board = ({
  tablature,
  dimmed,
  compact,
}: {
  tablature: TablatureMeasure[];
  dimmed: boolean;
  compact: boolean;
}) => {
  const notes = placeNotes(tablature);
  const used = new Set(notes.map((n) => n.string));
  return (
    <div
      className={cn(
        "relative flex bg-zinc-950 transition-opacity duration-base",
        compact ? "gap-2 px-2 py-3" : "gap-4 px-5 pb-16 pt-8",
        dimmed && "opacity-30",
      )}>
      <div
        className={cn(
          "flex flex-col justify-between",
          compact ? "gap-1.5" : "gap-4",
        )}>
        {STRING_NAMES.map((name, i) => (
          <span
            key={i}
            className={cn(
              "flex items-center justify-center rounded font-bold",
              compact ? "h-4 w-4 text-[9px]" : "h-6 w-6 text-xs",
              !used.has(i + 1) && "bg-zinc-800 text-zinc-500",
            )}
            style={
              used.has(i + 1)
                ? { backgroundColor: STRING_COLORS[i], color: "#09090b" }
                : undefined
            }>
            {name}
          </span>
        ))}
      </div>
      <div className='relative flex-1'>
        {STRING_NAMES.map((_, i) => (
          <span
            key={i}
            className='absolute inset-x-0 h-px bg-zinc-700/70'
            style={{ top: `${((i + 0.5) / 6) * 100}%` }}
          />
        ))}
        {notes.map((note, i) => {
          const left = note.start / SHOWN_BEATS;
          const passed = left < CURSOR_AT;
          return (
            <span
              key={i}
              className={cn(
                "absolute flex -translate-y-1/2 items-center rounded font-bold tabular-nums text-zinc-950",
                compact ? "h-3.5 pl-1 text-[8px]" : "h-5 pl-2 text-xs",
                passed && "opacity-40",
              )}
              style={{
                left: `${left * 100}%`,
                width: `calc(${(note.duration / SHOWN_BEATS) * 100}% - 4px)`,
                top: `${((note.string - 0.5) / 6) * 100}%`,
                backgroundColor: STRING_COLORS[note.string - 1],
              }}>
              {note.fret}
            </span>
          );
        })}
        <span
          className='absolute inset-y-[-8px] w-0.5 bg-red-500'
          style={{ left: `${CURSOR_AT * 100}%` }}
        />
      </div>
    </div>
  );
};

const TabKeys = ({ compact }: { compact: boolean }) => (
  <div className='flex items-center gap-1.5'>
    <span
      className={cn(
        KEY,
        "gap-1.5 bg-zinc-800 text-zinc-300",
        compact ? "h-8 px-2.5" : "h-9 px-2.5",
      )}>
      <Settings2 className='h-3.5 w-3.5' />
      <span className='text-[11px]'>Look</span>
    </span>
    <span
      className={cn(
        KEY,
        "gap-2.5 bg-zinc-800 px-2 text-zinc-400",
        compact ? "h-8" : "h-9",
      )}>
      <ZoomOut className='h-3.5 w-3.5' />
      <span className='text-[11px] tabular-nums text-zinc-300'>100%</span>
      <ZoomIn className='h-3.5 w-3.5' />
    </span>
  </div>
);

const MicKey = ({ on, tall }: { on: boolean; tall: boolean }) => (
  <span
    className={cn(
      KEY,
      "gap-2 px-4",
      tall ? "h-11 w-full" : "h-12",
      on ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-400",
    )}>
    <Mic className='h-4 w-4' />
    <span className='text-[10px] tracking-wide'>Pitch Detect</span>
  </span>
);

const TempoBar = ({ bpm, slider }: { bpm: number; slider: boolean }) => {
  const color =
    bpm < 80
      ? "text-emerald-400"
      : bpm < 120
        ? "text-amber-400"
        : "text-red-400";
  const range =
    bpm < 80 ? "bg-emerald-500" : bpm < 120 ? "bg-amber-500" : "bg-red-500";
  const step = cn(KEY, "h-8 w-8 bg-zinc-900/60 text-zinc-200");
  return (
    <div
      className={cn(
        "flex w-full items-center rounded-xl bg-zinc-800",
        slider ? "h-12 gap-3 px-4" : "h-10 justify-between gap-2 px-2.5",
      )}>
      {slider && <GiMetronome className='h-5 w-5 shrink-0 text-zinc-400' />}
      <span className={step}>
        <Minus className='h-4 w-4' strokeWidth={2.5} />
      </span>
      <span
        className={cn(
          "font-mono font-black tabular-nums tracking-tight",
          slider ? "text-2xl" : "text-lg",
          color,
        )}>
        {bpm}
      </span>
      {slider && (
        <span className='relative h-1.5 flex-1 rounded-full bg-zinc-700'>
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-[35%] rounded-full",
              range,
            )}
          />
          <span className='absolute left-[35%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-white' />
        </span>
      )}
      <span className={step}>
        <Plus className='h-4 w-4' strokeWidth={2.5} />
      </span>
    </div>
  );
};

const DesktopPreview = ({
  focus,
  micOn,
  bpm,
  tablature,
}: {
  focus: PreviewFocus;
  micOn: boolean;
  bpm: number;
  tablature: TablatureMeasure[];
}) => {
  const dimmed = focus !== null;
  return (
    <div className='overflow-hidden rounded-xl bg-zinc-900'>
      <div className='relative'>
        <Board
          tablature={tablature}
          dimmed={dimmed && focus !== "tab"}
          compact={false}
        />
        <div className='absolute bottom-3 right-3'>
          <Lit on={focus === "tab"} dimmed={dimmed}>
            <TabKeys compact={false} />
          </Lit>
        </div>
      </div>
      <div className='space-y-4 px-6 pb-6 pt-5'>
        <div className='flex items-center justify-center gap-2'>
          <div
            className={cn(
              "flex gap-2 transition-opacity duration-base",
              dimmed && "opacity-30",
            )}>
            <span className={cn(KEY, "h-12 w-12 bg-white/15 text-white")}>
              <GiGuitar className='text-lg' />
            </span>
            <span className={cn(KEY, "h-12 w-12 bg-zinc-800 text-zinc-400")}>
              <Volume2 className='h-4 w-4' />
            </span>
          </div>
          <Lit on={focus === "mic"} dimmed={dimmed} className='flex gap-2'>
            <MicKey on={micOn} tall={false} />
            <span className={cn(KEY, "h-12 w-8 bg-zinc-800 text-zinc-400")}>
              <ChevronDown className='h-3.5 w-3.5' />
            </span>
          </Lit>
        </div>
        <Lit
          on={focus === "tempo"}
          dimmed={dimmed}
          className='mx-auto max-w-md'>
          <TempoBar bpm={bpm} slider />
        </Lit>
      </div>
    </div>
  );
};

const PhonePreview = ({
  focus,
  micOn,
  bpm,
  tablature,
}: {
  focus: PreviewFocus;
  micOn: boolean;
  bpm: number;
  tablature: TablatureMeasure[];
}) => {
  const dimmed = focus !== null;
  // Tempo and mic live in the panel that slides up from the bottom strip.
  const panelOpen = focus === "tempo" || focus === "mic";
  return (
    <div className='relative flex h-full flex-col overflow-hidden bg-zinc-950'>
      <div className='min-h-0 flex-1' />
      <Board tablature={tablature} dimmed={dimmed && focus !== "tab"} compact />
      <div className='flex justify-end px-4 py-2'>
        <Lit on={focus === "tab"} dimmed={dimmed}>
          <TabKeys compact />
        </Lit>
      </div>
      <div className='min-h-0 flex-1' />

      {/* In the flow, not laid over the board: the spacers give way and
          nothing gets cut in half at the panel's edge. */}
      {panelOpen && (
        <div className='shrink-0 space-y-3 rounded-t-2xl bg-zinc-900 px-4 pb-3 pt-4'>
          <Lit on={focus === "tempo"} dimmed>
            <TempoBar bpm={bpm} slider={false} />
          </Lit>
          <Lit on={focus === "mic"} dimmed>
            <MicKey on={micOn} tall />
          </Lit>
        </div>
      )}

      <div className='relative flex h-16 shrink-0 items-center gap-1.5 bg-zinc-950 px-3'>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center text-zinc-500",
            dimmed && "opacity-30",
          )}>
          <X className='h-4 w-4' />
        </span>
        <Lit on={panelOpen} dimmed={dimmed}>
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center text-zinc-300",
              panelOpen ? "rotate-90" : "-rotate-90",
            )}>
            <SkipForward className='h-4 w-4' />
          </span>
        </Lit>
        <span className='flex-1' />
        <div
          className={cn("flex items-center gap-1.5", dimmed && "opacity-30")}>
          <span className={cn(KEY, "h-11 w-11 bg-white/10 text-amber-400")}>
            <RotateCcw className='h-4 w-4' />
          </span>
          <span
            className={cn(
              KEY,
              "h-12 w-12 border-b-black/25 bg-white text-zinc-950",
            )}>
            <Play className='h-4 w-4' />
          </span>
          <span className={cn(KEY, "h-11 w-11 bg-white/10 text-zinc-400")}>
            <Check className='h-4 w-4' />
          </span>
        </div>
      </div>
    </div>
  );
};

export const SessionPreview = ({
  device,
  ...props
}: {
  device: "desktop" | "phone";
  focus: PreviewFocus;
  micOn: boolean;
  bpm: number;
  tablature: TablatureMeasure[];
}) =>
  device === "desktop" ? (
    <DesktopPreview {...props} />
  ) : (
    <PhonePreview {...props} />
  );
