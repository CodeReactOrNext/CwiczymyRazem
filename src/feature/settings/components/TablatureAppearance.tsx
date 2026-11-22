import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { AlphaTabScoreViewer } from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer";
import {
  SAMPLE_TABLATURE,
  SAMPLE_TEMPO,
} from "feature/exercisePlan/views/PracticeSession/components/sampleTablature";
import { useTablatureStyle } from "feature/exercisePlan/views/PracticeSession/components/tablatureSettings";
import {
  NotationSettingsPanel,
  TablatureSettingsPanel,
} from "feature/exercisePlan/views/PracticeSession/components/TablatureSettingsPanel";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import type { TuningGutterString } from "feature/exercisePlan/views/PracticeSession/components/useTablatureWorkerBridge";
import { useTranslation } from "hooks/useTranslation";
import { AlignJustify, Music } from "lucide-react";
import { useMemo, useState } from "react";

/** Standard tuning, low→high — the preview is not tied to a real exercise. */
const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"];

// The score scales with the viewer height (base 300px), so this is the size
// the notes are drawn at — a little above a session board, to read clearly.
const PREVIEW_HEIGHT = 340;

type PreviewMode = "tab" | "notation";

/**
 * Settings → Tablature. A demo riff sits above the controls and re-renders with
 * every change, so the effect of each setting is visible without starting a
 * practice session. The same store drives the real session.
 */
export const TablatureAppearance = () => {
  const { t } = useTranslation("settings");
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
        <h2 className='text-lg font-bold text-foreground'>{t("tablature.title")}</h2>
        <p className='text-sm text-muted-foreground'>
          {t("tablature.description")}
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
      <div className='force-dark overflow-hidden rounded-lg bg-zinc-950 md:sticky md:top-16 md:z-20'>
        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2'>
          <span className='text-xs font-medium text-zinc-400'>
            {t("tablature.live_preview")}
          </span>
          <SegmentedControl<PreviewMode>
            label={t("tablature.live_preview")}
            selected={[mode]}
            onSelect={setMode}
            options={[
              {
                value: "tab",
                label: t("tablature.mode_tab"),
                icon: <AlignJustify className='h-4 w-4 shrink-0' />,
              },
              {
                value: "notation",
                label: t("tablature.mode_notation"),
                icon: <Music className='h-4 w-4 shrink-0' />,
              },
            ]}
          />
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

        <p className='px-4 pb-3 pt-2 text-[11px] text-zinc-500 md:hidden'>
          {mode === "tab"
            ? t("tablature.hint_tab")
            : t("tablature.hint_notation")}
        </p>
      </div>

      {/* ── Controls for whichever view is being previewed ── */}
      {mode === "tab" ? <TablatureSettingsPanel /> : <NotationSettingsPanel />}
    </div>
  );
};

export default TablatureAppearance;
