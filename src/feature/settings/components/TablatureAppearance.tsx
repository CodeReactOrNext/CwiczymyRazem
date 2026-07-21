import { cn } from "assets/lib/utils";
import { AlphaTabScoreViewer } from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer";
import {
  SAMPLE_TABLATURE,
  SAMPLE_TEMPO,
} from "feature/exercisePlan/views/PracticeSession/components/sampleTablature";
import { useTablatureStyle } from "feature/exercisePlan/views/PracticeSession/components/tablatureSettings";
import {
  Highway3DSettingsPanel,
  NotationSettingsPanel,
  TablatureSettingsPanel,
} from "feature/exercisePlan/views/PracticeSession/components/TablatureSettingsPanel";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import type { TuningGutterString } from "feature/exercisePlan/views/PracticeSession/components/useTablatureWorkerBridge";
import { AlignJustify, Box, Music } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

// three.js only loads if the player actually opens the 3D tab here.
const NoteHighway3D = dynamic(
  () =>
    import("feature/exercisePlan/views/PracticeSession/components/NoteHighway3D").then(
      (m) => m.NoteHighway3D,
    ),
  { ssr: false },
);

/** Standard tuning, low→high — the preview is not tied to a real exercise. */
const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"];

const PREVIEW_HEIGHT = 300;

type PreviewMode = "tab" | "highway" | "notation";

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
  beta,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof AlignJustify;
  label: string;
  beta?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50 sm:gap-2 sm:px-4",
        active
          ? "bg-cyan-500/10 text-cyan-300"
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}>
      <Icon className='h-4 w-4 shrink-0' />
      {/* Label text only from sm: up — three full labels don't fit next to each
          other on a phone-width screen, so mobile falls back to icon + title. */}
      <span className='hidden sm:inline'>{label}</span>
      {beta && (
        <span className='rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400'>
          Beta
        </span>
      )}
    </button>
  );
}

/**
 * Settings → Tablature. A demo riff sits above the controls and re-renders with
 * every change, so the effect of each setting is visible without starting a
 * practice session. The same store drives the real session.
 */
export const TablatureAppearance = () => {
  const [mode, setMode] = useState<PreviewMode>("tab");
  const { settings, palette, isLightBoard, style } = useTablatureStyle();

  const tuningStrings = useMemo<TuningGutterString[]>(() => {
    if (!settings.showTuningGutter) return [];
    return [1, 2, 3, 4, 5, 6].map((string) => ({
      string,
      label: STANDARD_TUNING[6 - string] ?? "",
      color: palette[string - 1] ?? "#ffffff",
    }));
  }, [palette, settings.showTuningGutter]);

  return (
    <div className='space-y-6'>
      <div className='px-1'>
        <h2 className='text-lg font-bold text-foreground'>Tablature</h2>
        <p className='text-sm text-muted-foreground'>
          Change how exercises are drawn. Everything is saved on this device and
          applies to your next practice session.
        </p>
      </div>

      {/* ── Live preview ──
          Pinned to the top of the scroll area on desktop: the controls below are
          taller than a screen, so without this you would be changing settings
          with the thing they affect scrolled out of sight. Left un-pinned below
          md — on a phone this panel alone is most of the viewport, so sticking it
          would permanently bury every settings section under it. md:top-16
          clears UserHeader (also md:+ only, see DesktopHeaderWrapper), which
          otherwise sits at the same top-0 and would fight this for the same
          spot. */}
      <div className='overflow-hidden rounded-lg bg-[#0f0f12] shadow-lg shadow-black/40 ring-1 ring-white/5 md:sticky md:top-16 md:z-20'>
        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3'>
          <span className='text-[11px] font-semibold tracking-wide text-zinc-500'>
            Live preview
          </span>
          <div className='flex flex-wrap items-center gap-1'>
            <ModeButton
              active={mode === "tab"}
              onClick={() => setMode("tab")}
              icon={AlignJustify}
              label='Tablature'
            />
            <ModeButton
              active={mode === "highway"}
              onClick={() => setMode("highway")}
              icon={Box}
              label='3D Highway'
              beta
            />
            <ModeButton
              active={mode === "notation"}
              onClick={() => setMode("notation")}
              icon={Music}
              label='Notation'
            />
          </div>
        </div>

        {mode === "tab" ? (
          <TablatureViewer
            measures={SAMPLE_TABLATURE}
            bpm={SAMPLE_TEMPO}
            isPlaying={false}
            startTime={null}
            heightPx={PREVIEW_HEIGHT}
            zoom={settings.noteSpacing}
            style={style}
            palette={palette}
            tuningStrings={tuningStrings}
            ambientGlow={false}
            isLightBoard={isLightBoard}
          />
        ) : mode === "highway" ? (
          <NoteHighway3D
            measures={SAMPLE_TABLATURE}
            heightPx={PREVIEW_HEIGHT}
          />
        ) : (
          <AlphaTabScoreViewer
            measures={SAMPLE_TABLATURE}
            baseTempo={SAMPLE_TEMPO}
            mode='score'
            isPlaying={false}
            countInRemaining={0}
            startTime={null}
            bpm={SAMPLE_TEMPO}
            heightPx={PREVIEW_HEIGHT}
          />
        )}

        <p className='px-4 pb-3 pt-2 text-[11px] text-zinc-600'>
          {mode === "tab"
            ? "Hit colour and hit animations only show while you are actually playing."
            : mode === "highway"
              ? "Drag any slider below and the board updates as you go. 3D Highway is in beta — it may be buggy."
              : "The same viewer used mid-session — toggle the board below to see it on paper or on black."}
        </p>
      </div>

      {/* ── Controls for whichever view is being previewed ── */}
      {mode === "tab" ? (
        <TablatureSettingsPanel />
      ) : mode === "highway" ? (
        <Highway3DSettingsPanel />
      ) : (
        <NotationSettingsPanel />
      )}
    </div>
  );
};

export default TablatureAppearance;
