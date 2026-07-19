import { cn } from "assets/lib/utils";
import {
  SAMPLE_TABLATURE,
  SAMPLE_TEMPO,
} from "feature/exercisePlan/views/PracticeSession/components/sampleTablature";
import { useTablatureStyle } from "feature/exercisePlan/views/PracticeSession/components/tablatureSettings";
import {
  Highway3DSettingsPanel,
  TablatureSettingsPanel,
} from "feature/exercisePlan/views/PracticeSession/components/TablatureSettingsPanel";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import type { TuningGutterString } from "feature/exercisePlan/views/PracticeSession/components/useTablatureWorkerBridge";
import { AlignJustify, Box } from "lucide-react";
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

type PreviewMode = "tab" | "highway";

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof AlignJustify;
  label: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50",
        active
          ? "bg-cyan-500/10 text-cyan-300"
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}>
      <Icon className='h-4 w-4' />
      {label}
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
          Pinned to the top of the scroll area: the controls below are taller
          than a screen, so without this you would be changing settings with the
          thing they affect scrolled out of sight. */}
      <div className='sticky top-0 z-20 overflow-hidden rounded-lg bg-[#0f0f12] shadow-lg shadow-black/40 ring-1 ring-white/5'>
        <div className='flex items-center justify-between gap-4 px-4 py-3'>
          <span className='text-[11px] font-semibold tracking-wide text-zinc-500'>
            Live preview
          </span>
          <div className='flex items-center gap-1'>
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
        ) : (
          <NoteHighway3D
            measures={SAMPLE_TABLATURE}
            heightPx={PREVIEW_HEIGHT}
          />
        )}

        <p className='px-4 pb-3 pt-2 text-[11px] text-zinc-600'>
          {mode === "tab"
            ? "Hit colour and hit animations only show while you are actually playing."
            : "Drag any slider below and the board updates as you go."}
        </p>
      </div>

      {/* ── Controls for whichever view is being previewed ── */}
      {mode === "tab" ? <TablatureSettingsPanel /> : <Highway3DSettingsPanel />}
    </div>
  );
};

export default TablatureAppearance;
