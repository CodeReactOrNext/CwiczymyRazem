import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import { Bug, Check, ChevronDown, Lock, Snail, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { FaMicrophone, FaSync } from "react-icons/fa";
import { GiGuitar, GiGuitarHead } from "react-icons/gi";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import { useGuitarTuningContext } from "../contexts/GuitarTuningContext";
import { useLiveTuner } from "../hooks/useLiveTuner";
import { AmpSimButton } from "./AmpSimButton";
import { ArcTuner } from "./CalibrationWizard/components/ArcTuner";
import {
  MicTroubleshooting,
  MicTroubleshootingDialog,
} from "./MicTroubleshooting";
import { VolumeButton } from "./VolumeButton";

const SPEED_MODES: { value: number; label: string }[] = [
  { value: 1, label: "100%" },
  { value: 0.75, label: "75%" },
  { value: 0.5, label: "50%" },
  { value: 0.25, label: "25%" },
];

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
  setTrackConfigs?: Dispatch<SetStateAction<Record<string, { volume: number; isMuted: boolean }>>>;
  frequencyRef?: React.RefObject<number>;
  volumeRef?: React.RefObject<number>;
  compact?: boolean;
  /** Full-width stacked layout for narrow (portrait phone) screens. */
  mobile?: boolean;
  disableTuner?: boolean;
  baseBpm?: number;
  trailing?: React.ReactNode;
  examMode?: boolean;
  /** Keep the backing-track (guitar) toggle available even in exam mode (e.g. scale exams). */
  showBackingInExam?: boolean;
}

export function SpeedDropdown({
  speedMultiplier,
  onSpeedMultiplierChange,
  baseBpm,
  isSlowed,
  h,
  compact = false,
  className,
}: {
  speedMultiplier: number;
  onSpeedMultiplierChange: (value: number) => void;
  baseBpm?: number;
  isSlowed: boolean;
  h: string;
  compact?: boolean;
  className?: string;
}) {
  const current =
    SPEED_MODES.find((m) => m.value === speedMultiplier) ?? SPEED_MODES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <RippleButton
          title='Playback speed — slow down to learn tricky passages'
          className={cn(
            "flex items-center rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50 active:scale-95",
            h,
            compact ? "gap-1.5 px-2" : "gap-2 px-3",
            isSlowed
              ? "bg-white/15 text-white hover:bg-white/25"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white",
            className,
          )}>
          <Snail className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
          <span
            className={cn(
              "font-mono font-bold",
              compact ? "text-[10px]" : "text-sm",
            )}>
            {current.label}
          </span>
          <ChevronDown
            className={cn(
              "shrink-0 opacity-60",
              compact ? "h-3 w-3" : "h-3.5 w-3.5",
            )}
          />
        </RippleButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='center'
        // Practice session is a full-screen layer at z-[999999] (desktop) / z-[9999999]
        // (mobile modal) — the dropdown's default z-50 would paint underneath it.
        className='z-[99999999] min-w-[9rem] border border-white/10 bg-zinc-900 text-white'>
        {SPEED_MODES.map(({ value, label }) => {
          const active = speedMultiplier === value;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => onSpeedMultiplierChange(value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 text-xs font-semibold focus:bg-zinc-800 focus:text-white",
                active ? "text-cyan-300" : "text-zinc-300",
              )}>
              <span className='font-mono w-9'>{label}</span>
              {baseBpm ? (
                <span className='font-mono text-[10px] text-zinc-500'>
                  {Math.round(baseBpm * value)} BPM
                </span>
              ) : null}
              {active && (
                <Check className='ml-auto h-3.5 w-3.5 text-cyan-300' />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TuningForkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 16 16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden>
      {/* two prongs */}
      <path d='M5 2 C5 2 5 7 5 8 C5 9.5 6.5 10.5 8 10.5 C9.5 10.5 11 9.5 11 8 C11 7 11 2 11 2' />
      {/* stem */}
      <line x1='8' y1='10.5' x2='8' y2='15' />
    </svg>
  );
}

function TunerDialog({
  frequencyRef,
  volumeRef,
  isMicEnabled,
  onClose,
}: {
  frequencyRef: React.RefObject<number>;
  volumeRef: React.RefObject<number>;
  isMicEnabled: boolean;
  onClose: () => void;
}) {
  const { cents, hasNote, noteName, octave } = useLiveTuner(
    frequencyRef,
    volumeRef,
  );
  const abs = Math.abs(cents);
  const isInTune = hasNote && abs < 10;
  const isClose = hasNote && abs < 25;
  const noteColor = !hasNote
    ? "text-zinc-600"
    : isInTune
      ? "text-emerald-400"
      : isClose
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div
      className='fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm'
      onClick={onClose}>
      <div
        className='relative w-72 rounded-lg bg-zinc-900 p-8 shadow-2xl'
        onClick={(e) => e.stopPropagation()}>
        <RippleButton
          onClick={onClose}
          className='absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white'>
          <X size={16} />
        </RippleButton>

        <p className='mb-4 text-center text-[10px] font-semibold tracking-wide text-zinc-500'>
          Tuner
        </p>

        {!isMicEnabled && (
          <p className='mb-4 text-center text-xs text-zinc-500'>
            Enable Pitch Detect to use the tuner
          </p>
        )}

        <ArcTuner cents={cents} hasNote={hasNote} />

        <div className='mt-2 flex flex-col items-center gap-0.5'>
          <span
            className={cn(
              "font-mono text-5xl font-bold tracking-tight transition-colors duration-200",
              noteColor,
            )}>
            {noteName}
          </span>
          <span className='font-mono text-sm text-zinc-600'>{octave}</span>
          <span
            className={cn(
              "font-mono mt-1 text-sm transition-colors duration-200",
              noteColor,
            )}>
            {hasNote
              ? cents > 0
                ? `+${Math.round(cents)}¢`
                : `${Math.round(cents)}¢`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
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
  disableTuner = false,
  baseBpm,
  trailing,
  examMode = false,
  showBackingInExam = false,
}: MediaControlsToolbarProps) {
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isTroubleshootOpen, setIsTroubleshootOpen] = useState(false);
  const {
    tuningId,
    preferredTuning,
    isLocked: isTuningLocked,
    openModal: openTuningSettings,
  } = useGuitarTuningContext();

  // In exam mode the speed control is always hidden (tempo is fixed). The backing
  // track (guitar) toggle is hidden too, unless the exam explicitly keeps it
  // (e.g. scale exams, where hearing the reference scale is allowed).
  const showSpeed = !examMode;
  const showBacking = !examMode || showBackingInExam;
  const showMasterVolume = masterVolume !== undefined && !!onMasterVolumeChange;
  const showVolumeButton =
    (hasMetronome && showSpeed && !!metronome && !!setIsMetronomeMuted) ||
    showMasterVolume ||
    (showBacking && hasAudioTrack && (audioTracks?.length ?? 0) > 0 && !!setTrackConfigs);

  if (!hasMetronome && !hasAudioTrack && !hasMicControls) return null;

  const isNonStandardTuning = tuningId !== "standard";

  const isSlowed = speedMultiplier < 1;
  const hasTuner =
    hasMicControls && !!frequencyRef && !!volumeRef && !disableTuner;
  const h = compact ? "h-8" : "h-12";

  if (mobile) {
    // min-w-0 + truncated labels: the toolbar renders both full-width in
    // portrait and inside the narrow (264px) landscape drawer, so no row may
    // ever depend on label width for its layout.
    const gridBtn =
      "flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-lg transition-all active:scale-95";
    const showSpeedBtn = showSpeed && hasMetronome;
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
                isSlowed={isSlowed}
                h='h-11'
                className={cn(
                  "w-full min-w-0 justify-center",
                  !showBackingBtn && "col-span-2",
                )}
              />
            )}

            {showBackingBtn && (
              <RippleButton
                onClick={onAudioToggle}
                disabled={isRiddleMode}
                title={isAudioMuted ? "Backing track off" : "Backing track on"}
                className={cn(
                  gridBtn,
                  !showSpeedBtn && "col-span-2",
                  isAudioMuted
                    ? "bg-zinc-800 text-zinc-400"
                    : "bg-white/15 text-white",
                  isRiddleMode && "cursor-not-allowed opacity-50",
                )}>
                <GiGuitar className='shrink-0 text-lg' />
                <span className='truncate text-[10px] font-semibold tracking-wide'>
                  Backing
                </span>
              </RippleButton>
            )}
          </div>
        )}

        {/* Tuning gets its own full-width row — tuning names ("Half-step
            down", "DADGAD") are too long to share a row in the drawer. */}
        {showTuningBtn && (
          <RippleButton
            onClick={openTuningSettings}
            title={
              isTuningLocked
                ? "Tuning is locked for this exercise"
                : "Guitar tuning"
            }
            className={cn(
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
            <span className='truncate text-[10px] font-semibold tracking-wide'>
              {preferredTuning.name}
            </span>
          </RippleButton>
        )}

        {/* Volume also gets its own full-width row — it's a popover trigger,
            not a plain click button, so it shares the Tuning row's layout logic. */}
        {showVolumeButton && (
          <VolumeButton
            mobile
            metronome={hasMetronome && showSpeed ? metronome : undefined}
            isMetronomeMuted={isMetronomeMuted}
            setIsMetronomeMuted={hasMetronome && showSpeed ? setIsMetronomeMuted : undefined}
            masterVolume={masterVolume}
            onMasterVolumeChange={onMasterVolumeChange}
            audioTracks={showBacking && hasAudioTrack ? audioTracks : undefined}
            setTrackConfigs={setTrackConfigs}
          />
        )}

        {hasMicControls && (
          <div className='grid grid-cols-2 gap-2'>
            <RippleButton
              onClick={examMode && isMicEnabled ? undefined : onMicToggle}
              disabled={examMode && isMicEnabled}
              title={
                examMode && isMicEnabled
                  ? "Pitch Detect required during exam"
                  : isMicEnabled
                    ? "Pitch Detect on"
                    : "Pitch Detect off"
              }
              className={cn(
                gridBtn,
                isMicEnabled
                  ? "bg-emerald-950 text-emerald-400"
                  : "bg-zinc-800 text-zinc-400",
                examMode &&
                  isMicEnabled &&
                  "cursor-not-allowed active:scale-100",
              )}>
              <FaMicrophone className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate text-[10px] font-semibold tracking-wide'>
                Pitch Detect
              </span>
            </RippleButton>

            {hasTuner && (
              <RippleButton
                onClick={() => setIsTunerOpen(true)}
                title='Tuner'
                className={cn(
                  gridBtn,
                  isTunerOpen
                    ? "bg-violet-950 text-violet-400"
                    : "bg-zinc-800 text-zinc-400",
                )}>
                <TuningForkIcon className='h-4 w-4 shrink-0' />
                <span className='truncate text-[10px] font-semibold tracking-wide'>
                  Tuner
                </span>
              </RippleButton>
            )}

            {isMicEnabled && (
              <RippleButton
                onClick={onRecalibrate}
                title='Recalibrate'
                className={cn(gridBtn, "bg-zinc-800 text-zinc-400")}>
                <FaSync className='h-3.5 w-3.5 shrink-0' />
                <span className='truncate text-[10px] font-semibold tracking-wide'>
                  Recalibrate
                </span>
              </RippleButton>
            )}

            {/* Electron-only amp simulator (renders nothing on web) */}
            <AmpSimButton h='h-11' />
          </div>
        )}

        {hasMicControls && <MicTroubleshooting className='self-center py-1' />}

        {trailing}

        {isTunerOpen &&
          hasTuner &&
          createPortal(
            <TunerDialog
              frequencyRef={frequencyRef!}
              volumeRef={volumeRef!}
              isMicEnabled={isMicEnabled}
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
            isSlowed={isSlowed}
            h='h-8'
          />
        )}

        <div className='flex flex-wrap gap-1.5'>
          {showBacking && hasAudioTrack && (
            <RippleButton
              onClick={onAudioToggle}
              disabled={isRiddleMode}
              title={isAudioMuted ? "Backing track off" : "Backing track on"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90",
                isAudioMuted
                  ? "bg-zinc-800 text-zinc-400 hover:text-white"
                  : "bg-white/15 text-white hover:bg-white/25",
                isRiddleMode && "cursor-not-allowed opacity-50",
              )}>
              <GiGuitar className='text-sm' />
            </RippleButton>
          )}

          {showVolumeButton && (
            <VolumeButton
              compact
              metronome={hasMetronome && showSpeed ? metronome : undefined}
              isMetronomeMuted={isMetronomeMuted}
              setIsMetronomeMuted={hasMetronome && showSpeed ? setIsMetronomeMuted : undefined}
              masterVolume={masterVolume}
              onMasterVolumeChange={onMasterVolumeChange}
              audioTracks={showBacking && hasAudioTrack ? audioTracks : undefined}
              setTrackConfigs={setTrackConfigs}
            />
          )}

          {(hasAudioTrack || hasMicControls) && (
            <RippleButton
              onClick={openTuningSettings}
              title={
                isTuningLocked
                  ? "Tuning is locked for this exercise"
                  : `Guitar tuning: ${preferredTuning.name}`
              }
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90",
                isNonStandardTuning
                  ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                  : "bg-zinc-800 text-zinc-400 hover:text-white",
              )}>
              {isTuningLocked ? (
                <Lock className='h-3.5 w-3.5' />
              ) : (
                <GiGuitarHead className='h-4 w-4' />
              )}
            </RippleButton>
          )}

          {hasMicControls && (
            <div
              className='mx-0.5 h-8 w-px self-center bg-white/10'
              aria-hidden
            />
          )}

          {hasMicControls && (
            <>
              <RippleButton
                onClick={examMode && isMicEnabled ? undefined : onMicToggle}
                disabled={examMode && isMicEnabled}
                title={
                  examMode && isMicEnabled
                    ? "Pitch Detect required during exam"
                    : isMicEnabled
                      ? "Pitch Detect on"
                      : "Pitch Detect off"
                }
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90",
                  isMicEnabled
                    ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-white",
                  examMode &&
                    isMicEnabled &&
                    "cursor-not-allowed hover:bg-emerald-950 active:scale-100",
                )}>
                <FaMicrophone className='h-3 w-3' />
              </RippleButton>

              {isMicEnabled && (
                <RippleButton
                  onClick={onRecalibrate}
                  title='Recalibrate'
                  className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-all hover:text-white active:scale-90'>
                  <FaSync className='h-3 w-3' />
                </RippleButton>
              )}

              {/* Electron-only amp simulator (renders nothing on web) */}
              <AmpSimButton compact />

              {hasTuner && (
                <RippleButton
                  onClick={() => setIsTunerOpen(true)}
                  title='Tuner'
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90",
                    isTunerOpen
                      ? "bg-violet-950 text-violet-400"
                      : "bg-zinc-800 text-zinc-400 hover:text-white",
                  )}>
                  <TuningForkIcon className='h-3 w-3' />
                </RippleButton>
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
              onClose={() => setIsTunerOpen(false)}
            />,
            document.body,
          )}
      </div>
    );
  }

  // Desktop layout: controls grouped into "islands" — shared quiet backgrounds
  // build the hierarchy (sound / input / view), spacing separates the groups.
  // The speed dropdown is intentionally absent here: DesktopSessionView renders
  // it next to the BPM slider so the whole tempo axis lives in one place.
  const island =
    "flex items-center gap-1.5 rounded-lg bg-zinc-900/40 p-1.5 empty:hidden";

  return (
    <div className='mb-4 flex flex-wrap items-center justify-center gap-4'>
      {/* ── SOUND island: backing track + volume + tuning ── */}
      {((showBacking && hasAudioTrack) ||
        hasAudioTrack ||
        hasMicControls ||
        showVolumeButton) && (
        <div className={island}>
          {showBacking && hasAudioTrack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <RippleButton
                  onClick={onAudioToggle}
                  disabled={isRiddleMode}
                  className={cn(
                    "flex w-12 items-center justify-center rounded-lg transition-all active:scale-95",
                    h,
                    isAudioMuted
                      ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      : "bg-white/15 text-white hover:bg-white/25",
                    isRiddleMode && "cursor-not-allowed opacity-50",
                  )}>
                  <GiGuitar className='text-lg' />
                </RippleButton>
              </TooltipTrigger>
              <TooltipContent side='bottom'>
                {isAudioMuted ? "Backing track off" : "Backing track on"}
              </TooltipContent>
            </Tooltip>
          )}

          {showVolumeButton && (
            <VolumeButton
              h={h}
              metronome={hasMetronome && showSpeed ? metronome : undefined}
              isMetronomeMuted={isMetronomeMuted}
              setIsMetronomeMuted={hasMetronome && showSpeed ? setIsMetronomeMuted : undefined}
              masterVolume={masterVolume}
              onMasterVolumeChange={onMasterVolumeChange}
              audioTracks={showBacking && hasAudioTrack ? audioTracks : undefined}
              setTrackConfigs={setTrackConfigs}
            />
          )}

          {(hasAudioTrack || hasMicControls) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <RippleButton
                  onClick={openTuningSettings}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 transition-all active:scale-95",
                    h,
                    isNonStandardTuning
                      ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white",
                  )}>
                  {isTuningLocked ? (
                    <Lock className='h-3.5 w-3.5 shrink-0' />
                  ) : (
                    <GiGuitarHead className='h-4 w-4 shrink-0' />
                  )}
                  <span className='text-[10px] font-semibold tracking-wide'>
                    {preferredTuning.name}
                  </span>
                </RippleButton>
              </TooltipTrigger>
              <TooltipContent side='bottom'>
                {isTuningLocked
                  ? "Tuning is locked for this exercise"
                  : "Guitar tuning"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* ── INPUT island: pitch detect + mic-tools menu ── */}
      {hasMicControls && (
        <div className={island}>
          <Tooltip>
            <TooltipTrigger asChild>
              <RippleButton
                onClick={examMode && isMicEnabled ? undefined : onMicToggle}
                disabled={examMode && isMicEnabled}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 font-semibold transition-all active:scale-95",
                  h,
                  isMicEnabled
                    ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white",
                  examMode &&
                    isMicEnabled &&
                    "cursor-not-allowed hover:bg-emerald-950 active:scale-100",
                )}>
                <FaMicrophone className='h-4 w-4 shrink-0' />
                <span className='text-[10px] font-semibold tracking-wide'>
                  Pitch Detect
                </span>
              </RippleButton>
            </TooltipTrigger>
            <TooltipContent side='bottom'>
              {examMode && isMicEnabled
                ? "Pitch Detect required during the exam"
                : isMicEnabled
                  ? "Microphone active — app is listening to your guitar"
                  : "Enable microphone to detect what you're playing"}
            </TooltipContent>
          </Tooltip>

          {/* Rarely-used mic tools live behind one chevron, so toggling the mic
              never adds/removes buttons and the row keeps a constant width. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RippleButton
                title='Mic tools'
                className={cn(
                  "flex w-8 items-center justify-center rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50 active:scale-95",
                  h,
                  "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white",
                )}>
                <ChevronDown className='h-3.5 w-3.5' />
              </RippleButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              sideOffset={8}
              // Clear the session's full-screen layer (z-[999999] desktop / z-[9999999] mobile) —
              // otherwise the default z-50 paints underneath it.
              className='z-[99999999] w-56 rounded-lg border-white/10 bg-zinc-900/95 p-1.5 text-white backdrop-blur-md'>
              <DropdownMenuItem
                disabled={!isMicEnabled}
                onSelect={onRecalibrate}
                className='flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-xs font-semibold text-zinc-200 focus:bg-zinc-800 focus:text-white'>
                <FaSync className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
                Recalibrate
              </DropdownMenuItem>
              {hasTuner && (
                <DropdownMenuItem
                  onSelect={() => setIsTunerOpen(true)}
                  className='flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-xs font-semibold text-zinc-200 focus:bg-zinc-800 focus:text-white'>
                  <TuningForkIcon className='h-4 w-4 shrink-0 text-zinc-400' />
                  Tuner
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => setIsTroubleshootOpen(true)}
                className='flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-xs font-semibold text-zinc-200 focus:bg-zinc-800 focus:text-white'>
                <Bug className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
                Mic not working?
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Electron-only amp simulator (renders nothing on web) */}
          <AmpSimButton h={h} />
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
            onClose={() => setIsTunerOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
});
