import { PRESSABLE_KEY } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { TakeRecorderButton } from "feature/takes/components/TakeRecorderButton";
import { AmpSimButton } from "feature/toneStudio/components/AmpSimButton";
import { TunerDialog } from "feature/tuner/components/TunerDialog";
import { TuningForkIcon } from "feature/tuner/components/TuningForkIcon";
import { useTranslation } from "hooks/useTranslation";
import { Bug, ChevronDown, Lock, Mic, SlidersHorizontal } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { GiGuitar, GiGuitarHead } from "react-icons/gi";
import { isStandardTuning } from "utils/audio/tunings";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";
import {
  MicTroubleshooting,
  MicTroubleshootingDialog,
} from "./MicTroubleshooting";
import { SessionTooltip } from "./SessionTooltip";
import { SpeedDropdown } from "./SpeedDropdown";
import { StateDot } from "./StateDot";
import { VolumeButton } from "./VolumeButton";

interface MediaControlsToolbarProps {
  hasMetronome: boolean;
  hasAudioTrack: boolean;
  hasMicControls: boolean;
  speedMultiplier: number;
  onSpeedMultiplierChange: (value: number) => void;
  isAudioMuted: boolean;
  isRiddleMode: boolean;
  onAudioToggle: () => void;
  isMicEnabled: boolean;
  onMicToggle: () => void;
  onRecalibrate: () => void;
  /** Overall boost on top of every track's own volume (1 = normal, up to 2 = +100%).
   *  Omit (together with the setter) to hide the control — it only affects Guitar Pro playback. */
  masterVolume?: number;
  onMasterVolumeChange?: (v: number) => void;
  /** Metronome click volume — omit to hide that section of the volume popover. */
  metronome?: { volume?: number; setVolume?: (v: number) => void };
  isMetronomeMuted?: boolean;
  setIsMetronomeMuted?: (v: boolean) => void;
  /** Per-track mixer — shown in the volume popover only when there's more than one track. */
  audioTracks?: AudioTrackConfig[];
  setTrackConfigs?: Dispatch<
    SetStateAction<Record<string, { volume: number; isMuted: boolean }>>
  >;
  frequencyRef?: React.RefObject<number>;
  volumeRef?: React.RefObject<number>;
  compact?: boolean;
  /** Full-width stacked layout for narrow (portrait phone) screens. */
  mobile?: boolean;
  /** Mobile layout squeezed for a landscape phone: same 44px targets, but
   *  rows pair up and the mic help line goes, so the stack fits a short screen. */
  dense?: boolean;
  /** Drop the playback-speed button — used when the tempo controls live
   *  elsewhere (mobile tools island keeps BPM + speed in one place). */
  hideSpeed?: boolean;
  disableTuner?: boolean;
  /** The metronome's set BPM — lets the speed control show what each % works out to. */
  baseBpm?: number;
  trailing?: React.ReactNode;
  examMode?: boolean;
  /** Keep the backing-track (guitar) toggle available even in exam mode (e.g. scale exams). */
  showBackingInExam?: boolean;
  /** What is being played — names the files a recorded take is saved as (desktop). */
  takeTitle?: string;
}

export const MediaControlsToolbar = memo(function MediaControlsToolbar({
  hasMetronome,
  hasAudioTrack,
  hasMicControls,
  speedMultiplier,
  onSpeedMultiplierChange,
  isAudioMuted,
  isRiddleMode,
  onAudioToggle,
  isMicEnabled,
  onMicToggle,
  onRecalibrate,
  masterVolume,
  onMasterVolumeChange,
  metronome,
  isMetronomeMuted,
  setIsMetronomeMuted,
  audioTracks,
  setTrackConfigs,
  frequencyRef,
  volumeRef,
  compact = false,
  mobile = false,
  dense = false,
  hideSpeed = false,
  disableTuner = false,
  baseBpm,
  trailing,
  examMode = false,
  showBackingInExam = false,
  takeTitle,
}: MediaControlsToolbarProps) {
  const { t } = useTranslation("session");
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isTroubleshootOpen, setIsTroubleshootOpen] = useState(false);
  const {
    tuning,
    isLocked: isTuningLocked,
    openModal: openTuningSettings,
    instrument,
  } = useGuitarTuningContext();
  const tuningKey = instrument === "bass" ? "bass_tuning" : "guitar_tuning";

  // In exam mode the speed control is always hidden (tempo is fixed). The backing
  // track (guitar) toggle is hidden too, unless the exam explicitly keeps it
  // (e.g. scale exams, where hearing the reference scale is allowed).
  const showSpeed = !examMode;
  // The speed button can be lifted out (mobile island) while the metronome
  // volume slider below still needs to know the exercise isn't in exam mode.
  const showSpeedControl = showSpeed && !hideSpeed;
  const showBacking = !examMode || showBackingInExam;
  const showMasterVolume = masterVolume !== undefined && !!onMasterVolumeChange;
  const showVolumeButton =
    (hasMetronome && showSpeed && !!metronome && !!setIsMetronomeMuted) ||
    showMasterVolume ||
    (showBacking &&
      hasAudioTrack &&
      (audioTracks?.length ?? 0) > 0 &&
      !!setTrackConfigs);

  if (!hasMetronome && !hasAudioTrack && !hasMicControls) return null;

  const isNonStandardTuning = !isStandardTuning(tuning.id);

  const hasTuner =
    hasMicControls && !!frequencyRef && !!volumeRef && !disableTuner;

  if (mobile) {
    // min-w-0 + truncated labels: the toolbar renders both full-width in
    // portrait and inside the narrow (264px) landscape drawer, so no row may
    // ever depend on label width for its layout.
    const gridBtn =
      "flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-lg transition-colors";
    const showSpeedBtn = showSpeedControl && hasMetronome;
    const showBackingBtn = showBacking && hasAudioTrack;
    const showTuningBtn = hasAudioTrack || hasMicControls;

    return (
      <div className='flex flex-col gap-2'>
        {(showSpeedBtn || showBackingBtn) && (
          <div className='grid grid-cols-2 gap-2'>
            {showSpeedBtn && (
              <SpeedDropdown
                speedMultiplier={speedMultiplier}
                onSpeedMultiplierChange={onSpeedMultiplierChange}
                baseBpm={baseBpm}
                h='h-12'
                className={cn(
                  // The label matches the other keys of this grid (12px), not the desktop bar.
                  "w-full min-w-0 justify-center [&>span:first-of-type]:text-xs [&>span:first-of-type]:tracking-normal",
                  !showBackingBtn && "col-span-2",
                )}
              />
            )}

            {showBackingBtn && (
              <button
                type='button'
                onClick={onAudioToggle}
                disabled={isRiddleMode}
                title={isAudioMuted ? t("media.guitar_off") : t("media.guitar_on")}
                className={cn(
                  PRESSABLE_KEY,
                  gridBtn,
                  !showSpeedBtn && "col-span-2",
                  isAudioMuted
                    ? "bg-zinc-800 text-zinc-400"
                    : "bg-white/15 text-white",
                  isRiddleMode && "cursor-not-allowed opacity-50",
                )}>
                <GiGuitar className='shrink-0 text-lg' />
                <span className='truncate text-xs font-semibold'>
                  {t("media.guitar")}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Tuning and volume each get a full-width row — tuning names
            ("Half-step down", "DADGAD") are too long to share one. On a
            landscape phone the height matters more, so they pair up. */}
        <div
          className={cn(
            dense && showTuningBtn && showVolumeButton
              ? "grid grid-cols-2 gap-2"
              : "contents",
          )}>
          {showTuningBtn && (
            <button
              type='button'
              onClick={openTuningSettings}
              title={
                isTuningLocked
                  ? t("media.tuning_locked")
                  : t(`media.${tuningKey}`)
              }
              className={cn(
                PRESSABLE_KEY,
                gridBtn,
                isNonStandardTuning
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-zinc-800 text-zinc-400",
              )}>
              {isTuningLocked ? (
                <Lock className='h-3.5 w-3.5 shrink-0' />
              ) : (
                <GiGuitarHead className='h-4 w-4 shrink-0' />
              )}
              <span className='truncate text-xs font-semibold'>
                {t("tuning_modal.tunings")}
              </span>
            </button>
          )}

          {showVolumeButton && (
            <VolumeButton
              mobile
              metronome={hasMetronome && showSpeed ? metronome : undefined}
              isMetronomeMuted={isMetronomeMuted}
              setIsMetronomeMuted={
                hasMetronome && showSpeed ? setIsMetronomeMuted : undefined
              }
              masterVolume={masterVolume}
              onMasterVolumeChange={onMasterVolumeChange}
              audioTracks={
                showBacking && hasAudioTrack ? audioTracks : undefined
              }
              setTrackConfigs={setTrackConfigs}
            />
          )}
        </div>

        {hasMicControls && (
          <div className='grid grid-cols-2 gap-2'>
            <button
              type='button'
              onClick={examMode && isMicEnabled ? undefined : onMicToggle}
              disabled={examMode && isMicEnabled}
              title={
                examMode && isMicEnabled
                  ? t("media.pitch_required")
                  : isMicEnabled
                    ? t("media.pitch_on")
                    : t("media.pitch_off")
              }
              className={cn(
                PRESSABLE_KEY,
                gridBtn,
                isMicEnabled
                  ? "bg-emerald-950 text-emerald-400"
                  : "bg-zinc-800 text-zinc-400",
                examMode &&
                  isMicEnabled &&
                  "cursor-not-allowed",
              )}>
              <Mic className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate text-xs font-semibold'>
                {t("media.pitch_detect")}
              </span>
            </button>

            {hasTuner && (
              <button
                type='button'
                onClick={() => setIsTunerOpen(true)}
                title={t("media.tuner")}
                className={cn(
                  PRESSABLE_KEY,
                  gridBtn,
                  isTunerOpen
                    ? "bg-violet-950 text-violet-400"
                    : "bg-zinc-800 text-zinc-400",
                )}>
                <TuningForkIcon className='h-4 w-4 shrink-0' />
                <span className='truncate text-xs font-semibold'>
                  {t("media.tuner")}
                </span>
              </button>
            )}

            {isMicEnabled && (
              <button
                type='button'
                onClick={onRecalibrate}
                title={t("media.recalibrate")}
                className={cn(PRESSABLE_KEY, gridBtn, "bg-zinc-800 text-zinc-400")}>
                <SlidersHorizontal className='h-3.5 w-3.5 shrink-0' />
                <span className='truncate text-xs font-semibold'>
                  {t("media.recalibrate")}
                </span>
              </button>
            )}

            {/* Electron-only amp simulator (renders nothing on web) */}
            <AmpSimButton h='h-12' />
          </div>
        )}

        {hasMicControls && !dense && (
          <MicTroubleshooting className='self-center py-1' />
        )}

        {trailing}

        {isTunerOpen &&
          hasTuner &&
          createPortal(
            <TunerDialog
              frequencyRef={frequencyRef!}
              volumeRef={volumeRef!}
              isMicEnabled={isMicEnabled}
              tuning={tuning}
              isTuningLocked={isTuningLocked}
              onClose={() => setIsTunerOpen(false)}
            />,
            document.body,
          )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className='flex flex-col gap-1.5'>
        {showSpeed && hasMetronome && (
          <SpeedDropdown
            compact
            speedMultiplier={speedMultiplier}
            onSpeedMultiplierChange={onSpeedMultiplierChange}
            baseBpm={baseBpm}
            h='h-8'
          />
        )}

        <div className='flex flex-wrap gap-1.5'>
          {showBacking && hasAudioTrack && (
            <button
              type='button'
              onClick={onAudioToggle}
              disabled={isRiddleMode}
              title={isAudioMuted ? t("media.guitar_off") : t("media.guitar_on")}
              className={cn(
                PRESSABLE_KEY,
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isAudioMuted
                  ? "bg-zinc-800 text-zinc-400 hover:text-white"
                  : "bg-white/15 text-white hover:bg-white/25",
                isRiddleMode && "cursor-not-allowed opacity-50",
              )}>
              <GiGuitar className='text-sm' />
            </button>
          )}

          {showVolumeButton && (
            <VolumeButton
              compact
              metronome={hasMetronome && showSpeed ? metronome : undefined}
              isMetronomeMuted={isMetronomeMuted}
              setIsMetronomeMuted={
                hasMetronome && showSpeed ? setIsMetronomeMuted : undefined
              }
              masterVolume={masterVolume}
              onMasterVolumeChange={onMasterVolumeChange}
              audioTracks={
                showBacking && hasAudioTrack ? audioTracks : undefined
              }
              setTrackConfigs={setTrackConfigs}
            />
          )}

          {(hasAudioTrack || hasMicControls) && (
            <button
              type='button'
              onClick={openTuningSettings}
              title={
                isTuningLocked
                  ? t("media.tuning_locked")
                  : t(`media.${tuningKey}_named`, { name: tuning.name })
              }
              className={cn(
                PRESSABLE_KEY,
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isNonStandardTuning
                  ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                  : "bg-zinc-800 text-zinc-400 hover:text-white",
              )}>
              {isTuningLocked ? (
                <Lock className='h-3.5 w-3.5' />
              ) : (
                <GiGuitarHead className='h-4 w-4' />
              )}
            </button>
          )}

          {hasMicControls && (
            <div
              className='mx-0.5 h-8 w-px self-center bg-white/10'
              aria-hidden
            />
          )}

          {hasMicControls && (
            <>
              <button
                type='button'
                onClick={examMode && isMicEnabled ? undefined : onMicToggle}
                disabled={examMode && isMicEnabled}
                title={
                  examMode && isMicEnabled
                    ? t("media.pitch_required")
                    : isMicEnabled
                      ? t("media.pitch_on")
                      : t("media.pitch_off")
                }
                className={cn(
                  PRESSABLE_KEY,
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isMicEnabled
                    ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-white",
                  examMode &&
                    isMicEnabled &&
                    "cursor-not-allowed hover:bg-emerald-950",
                )}>
                <Mic className='h-3 w-3' />
              </button>

              {isMicEnabled && (
                <button
                  type='button'
                  onClick={onRecalibrate}
                  title={t("media.recalibrate")}
                  className={cn(PRESSABLE_KEY, "flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:text-white")}>
                  <SlidersHorizontal className='h-3 w-3' />
                </button>
              )}

              {/* Electron-only amp simulator (renders nothing on web) */}
              <AmpSimButton compact />

              {hasTuner && (
                <button
                  type='button'
                  onClick={() => setIsTunerOpen(true)}
                  title={t("media.tuner")}
                  className={cn(
                    PRESSABLE_KEY,
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    isTunerOpen
                      ? "bg-violet-950 text-violet-400"
                      : "bg-zinc-800 text-zinc-400 hover:text-white",
                  )}>
                  <TuningForkIcon className='h-3 w-3' />
                </button>
              )}

              <MicTroubleshooting compact />
            </>
          )}
          {trailing}
        </div>

        {isTunerOpen &&
          hasTuner &&
          createPortal(
            <TunerDialog
              frequencyRef={frequencyRef!}
              volumeRef={volumeRef!}
              isMicEnabled={isMicEnabled}
              tuning={tuning}
              isTuningLocked={isTuningLocked}
              onClose={() => setIsTunerOpen(false)}
            />,
            document.body,
          )}
      </div>
    );
  }

  // Desktop layout: the keys in groups (sound / input / view), set apart by
  // space alone — a plate under each group only boxed the keys in.
  // The speed dropdown is intentionally absent here: on desktop it sits inside
  // the metronome bar (ExerciseQuickActionsBar), so the whole tempo axis lives in one place.
  const island =
    "flex items-center gap-1.5 empty:hidden";

  // A key with nothing to be on or off, and a switch in its two positions.
  // A switch off reads as plainly as any key: its StateDot says it's off,
  // so the face doesn't have to look disabled.
  const plainKey = "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100";
  // On is green — a lighter grey alone was too close to off to tell at a glance.
  const onKey = "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25";
  const offKey = plainKey;
  const menuChevron = <ChevronDown aria-hidden className='h-3.5 w-3.5 shrink-0 text-zinc-500' />;
  const desktopH = "h-9";
  // The tuning by its name, and the standard one as a guitarist calls it.
  const tuningLabel = isNonStandardTuning ? tuning.name : t("toolbar.standard_tuning");

  return (
    <div className='mb-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3'>
      {/* ── SOUND island: backing track + volume + tuning ── */}
      {((showBacking && hasAudioTrack) ||
        hasAudioTrack ||
        hasMicControls ||
        showVolumeButton) && (
        <div className={island}>
          {showBacking && hasAudioTrack && (
            <SessionTooltip
              label={
                isAudioMuted
                  ? t("media.playback_off")
                  : t("media.playback_on")
              }>
              <button
                type='button'
                onClick={onAudioToggle}
                disabled={isRiddleMode}
                aria-label={t("media.playback")}
                aria-pressed={!isAudioMuted}
                className={cn(
                  PRESSABLE_KEY,
                  "flex items-center justify-center gap-2 rounded-lg px-2.5 font-medium transition-colors",
                  desktopH,
                  isAudioMuted ? offKey : onKey,
                  isRiddleMode && "cursor-not-allowed opacity-50",
                )}>
                <GiGuitar className='text-base' />
                <span className='text-[13px] font-medium'>{t("toolbar.play_tab")}</span>
                <StateDot on={!isAudioMuted} />
              </button>
            </SessionTooltip>
          )}

          {showVolumeButton && (
            <VolumeButton
              h={desktopH}
              labelled
              metronome={hasMetronome && showSpeed ? metronome : undefined}
              isMetronomeMuted={isMetronomeMuted}
              setIsMetronomeMuted={
                hasMetronome && showSpeed ? setIsMetronomeMuted : undefined
              }
              masterVolume={masterVolume}
              onMasterVolumeChange={onMasterVolumeChange}
              audioTracks={
                showBacking && hasAudioTrack ? audioTracks : undefined
              }
              setTrackConfigs={setTrackConfigs}
            />
          )}

          {(hasAudioTrack || hasMicControls) && (
            <SessionTooltip
              label={
                isTuningLocked
                  ? t("media.tuning_locked")
                  : t(`media.${tuningKey}_change`)
              }>
              <button
                type='button'
                onClick={openTuningSettings}
                className={cn(
                  PRESSABLE_KEY,
                  "flex items-center gap-2 rounded-lg px-2.5 font-medium transition-colors",
                  desktopH,
                  isNonStandardTuning
                    ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                    : plainKey,
                )}>
                {isTuningLocked ? (
                  <Lock className='h-3.5 w-3.5 shrink-0' />
                ) : (
                  <GiGuitarHead className='h-4 w-4 shrink-0' />
                )}
                <span className='text-[13px] font-medium'>{tuningLabel}</span>
                {menuChevron}
              </button>
            </SessionTooltip>
          )}
        </div>
      )}

      {/* ── INPUT island: pitch detect + mic-tools menu ── */}
      {hasMicControls && (
        <div className={island}>
          <SessionTooltip
            label={
              examMode && isMicEnabled
                ? t("media.pitch_required")
                : isMicEnabled
                  ? t("media.mic_active")
                  : t("media.mic_enable")
            }>
            <button
              type='button'
              onClick={examMode && isMicEnabled ? undefined : onMicToggle}
              disabled={examMode && isMicEnabled}
              className={cn(
                PRESSABLE_KEY,
                "flex items-center gap-2 rounded-lg px-2.5 font-medium transition-colors",
                desktopH,
                isMicEnabled ? onKey : offKey,
                examMode &&
                  isMicEnabled &&
                  "cursor-not-allowed hover:bg-emerald-500/15",
              )}>
              <Mic className={cn("h-4 w-4 shrink-0", isMicEnabled && "text-emerald-400")} />
              <span className='text-[13px] font-medium'>
                {t("toolbar.mic_scoring")}
              </span>
              <StateDot on={isMicEnabled} />
            </button>
          </SessionTooltip>

          {/* Rarely-used mic tools live behind one chevron, so toggling the mic
              never adds/removes buttons and the row keeps a constant width. */}
          <DropdownMenu>
            <SessionTooltip label={t("toolbar.mic_setup")}>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label={t("toolbar.mic_setup")}
                  className={cn(
                    PRESSABLE_KEY,
                    "flex w-8 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50",
                    desktopH,
                    plainKey,
                  )}>
                  <ChevronDown className='h-3.5 w-3.5' />
                </button>
              </DropdownMenuTrigger>
            </SessionTooltip>
            <DropdownMenuContent
              align='end'
              sideOffset={8}
              // Clear the session's full-screen layer (z-[999999] desktop / z-[9999999] mobile) —
              // otherwise the default z-50 paints underneath it.
              className='z-[99999999] w-56'>
              {/* Open with the mic off too: this is where a wrong device gets
                  fixed, which is often why the mic is off in the first place. */}
              <DropdownMenuItem
                onSelect={onRecalibrate}
                className='flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-xs font-semibold text-zinc-200 focus:bg-zinc-800 focus:text-white'>
                <SlidersHorizontal className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
                {t("media.recalibrate")}
              </DropdownMenuItem>
              {hasTuner && (
                <DropdownMenuItem
                  onSelect={() => setIsTunerOpen(true)}
                  className='flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-xs font-semibold text-zinc-200 focus:bg-zinc-800 focus:text-white'>
                  <TuningForkIcon className='h-4 w-4 shrink-0 text-zinc-400' />
                  {t("media.tuner")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => setIsTroubleshootOpen(true)}
                className='flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-xs font-semibold text-zinc-200 focus:bg-zinc-800 focus:text-white'>
                <Bug className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
                {t("media.mic_not_working")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Electron-only amp simulator (renders nothing on web) */}
          <AmpSimButton h={desktopH} />

          {/* Electron-only take recorder (renders nothing on web) */}
          <TakeRecorderButton h={desktopH} compact={compact} title={takeTitle} />
        </div>
      )}

      {/* ── VIEW island: tablature view menu + speeds mastered ── */}
      {trailing && <div className={island}>{trailing}</div>}

      <MicTroubleshootingDialog
        open={isTroubleshootOpen}
        onOpenChange={setIsTroubleshootOpen}
      />

      {isTunerOpen &&
        hasTuner &&
        createPortal(
          <TunerDialog
            frequencyRef={frequencyRef!}
            volumeRef={volumeRef!}
            isMicEnabled={isMicEnabled}
            tuning={tuning}
            isTuningLocked={isTuningLocked}
            onClose={() => setIsTunerOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
});
