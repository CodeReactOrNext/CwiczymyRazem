import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { RippleButton } from "hooks/useRipple";
import { Info, SlidersHorizontal, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import { GiGuitar, GiMetronome } from "react-icons/gi";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import type { Exercise } from "../../../types/exercise.types";
import { ExerciseQuickActionsBar } from "./ExerciseQuickActionsBar";
import { MediaControlsToolbar, SpeedDropdown } from "./MediaControlsToolbar";
import { MobileInstructionsCard } from "./MobileInstructionsCard";

type ToolsTab = "tempo" | "sound" | "info";

interface MobileToolsIslandProps {
  exercise: Exercise;
  metronome: any;
  examMode?: boolean;
  hasMetronome: boolean;
  hasAudioTrack: boolean;
  hasMicControls: boolean;
  isRiddleMode: boolean;
  speedMultiplier: number;
  onSpeedMultiplierChange: (value: number) => void;
  isAudioMuted: boolean;
  onAudioToggle: () => void;
  isMicEnabled: boolean;
  onMicToggle: () => void;
  onRecalibrate: () => void;
  isMetronomeMuted?: boolean;
  setIsMetronomeMuted?: (v: boolean) => void;
  audioTracks?: AudioTrackConfig[];
  setTrackConfigs?: Dispatch<
    SetStateAction<Record<string, { volume: number; isMuted: boolean }>>
  >;
  masterVolume?: number;
  onMasterVolumeChange?: (v: number) => void;
  frequencyRef?: React.RefObject<number>;
  volumeRef?: React.RefObject<number>;
  disableTuner?: boolean;
}

const TAB_LABELS: Record<ToolsTab, string> = {
  tempo: "Tempo",
  sound: "Sound",
  info: "Guide",
};

/**
 * Phone-portrait control island: one row of icons docked above the transport
 * bar. The two toggles players flip mid-take (backing track, pitch detect) stay
 * one tap away; everything else — tempo, speed, tuning, volume, mic tools,
 * instructions — moves into a sheet that slides over the session only when
 * asked for. That keeps the exercise itself in charge of the screen.
 */
export const MobileToolsIsland = ({
  exercise,
  metronome,
  examMode = false,
  hasMetronome,
  hasAudioTrack,
  hasMicControls,
  isRiddleMode,
  speedMultiplier,
  onSpeedMultiplierChange,
  isAudioMuted,
  onAudioToggle,
  isMicEnabled,
  onMicToggle,
  onRecalibrate,
  isMetronomeMuted,
  setIsMetronomeMuted,
  audioTracks,
  setTrackConfigs,
  masterVolume,
  onMasterVolumeChange,
  frequencyRef,
  volumeRef,
  disableTuner,
}: MobileToolsIslandProps) => {
  const [openTab, setOpenTab] = useState<ToolsTab | null>(null);

  // Exam mode fixes the tempo and hides the backing track, exactly like the
  // toolbar does — the island must not smuggle those controls back in.
  const hasTempo = hasMetronome && !examMode;
  const hasBacking = hasAudioTrack && !examMode;
  // A metronome-only exam exercise has nothing left in the sound panel (no
  // backing, no tuning, no click volume) — don't offer an empty tab for it.
  const hasSound =
    hasAudioTrack || hasMicControls || (hasMetronome && !examMode);
  const hasInfo = !!(
    exercise.instructions?.length ||
    exercise.tips?.length ||
    exercise.whyItMatters
  );
  const isMicLocked = examMode && isMicEnabled;

  const tabs: ToolsTab[] = [
    ...(hasTempo ? (["tempo"] as const) : []),
    ...(hasSound ? (["sound"] as const) : []),
    ...(hasInfo ? (["info"] as const) : []),
  ];

  if (!tabs.length && !hasBacking && !hasMicControls) return null;

  const btn =
    "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg transition-colors click-behavior focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const idle =
    "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-white";

  return (
    <>
      <div className='relative z-10 shrink-0 px-3 pb-1 pt-2'>
        <div className='flex items-center gap-2 rounded-lg bg-zinc-900/60 p-2'>
          {hasTempo && (
            <RippleButton
              onClick={() => setOpenTab("tempo")}
              aria-label='Tempo settings'
              title='Tempo'
              className={cn(btn, idle)}>
              <GiMetronome className='h-4 w-4 shrink-0' />
              <span className='font-mono text-sm font-bold tabular-nums text-zinc-200'>
                {metronome.bpm}
              </span>
            </RippleButton>
          )}

          {hasBacking && (
            <RippleButton
              onClick={onAudioToggle}
              disabled={isRiddleMode}
              aria-label={
                isAudioMuted
                  ? "Turn backing track on"
                  : "Turn backing track off"
              }
              aria-pressed={!isAudioMuted}
              title={isAudioMuted ? "Backing track off" : "Backing track on"}
              className={cn(
                btn,
                isAudioMuted ? idle : "bg-cyan-500/10 text-cyan-400",
                isRiddleMode && "pointer-events-none opacity-50",
              )}>
              <GiGuitar className='h-4 w-4 shrink-0' />
            </RippleButton>
          )}

          {hasMicControls && (
            <RippleButton
              onClick={isMicLocked ? undefined : onMicToggle}
              disabled={isMicLocked}
              aria-label={
                isMicEnabled ? "Turn pitch detect off" : "Turn pitch detect on"
              }
              aria-pressed={isMicEnabled}
              title={
                isMicLocked
                  ? "Pitch Detect required during exam"
                  : isMicEnabled
                    ? "Pitch Detect on"
                    : "Pitch Detect off"
              }
              className={cn(
                btn,
                isMicEnabled ? "bg-emerald-500/10 text-emerald-400" : idle,
                isMicLocked && "cursor-not-allowed",
              )}>
              <FaMicrophone className='h-4 w-4 shrink-0' />
            </RippleButton>
          )}

          {hasSound && (
            <RippleButton
              onClick={() => setOpenTab("sound")}
              aria-label='Sound and input settings'
              title='Sound & input'
              className={cn(btn, idle)}>
              <SlidersHorizontal className='h-4 w-4 shrink-0' />
            </RippleButton>
          )}

          {hasInfo && (
            <RippleButton
              onClick={() => setOpenTab("info")}
              aria-label='Exercise guide'
              title='Guide'
              className={cn(btn, idle)}>
              <Info className='h-4 w-4 shrink-0' />
            </RippleButton>
          )}
        </div>
      </div>

      <AnimatePresence>
        {openTab && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenTab(null)}
              className='absolute inset-0 z-40 bg-black/60 backdrop-blur-sm'
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className='pb-safe absolute inset-x-0 bottom-0 z-50 flex max-h-[80%] flex-col rounded-lg bg-zinc-950'>
              <div className='mx-auto mt-2 h-1 w-10 rounded-full bg-zinc-800' />

              <Tabs
                value={openTab}
                onValueChange={(value) => setOpenTab(value as ToolsTab)}
                className='flex min-h-0 flex-1 flex-col'>
                <div className='flex items-center gap-2 p-3'>
                  <TabsList className='h-10 flex-1 bg-zinc-900/60 p-1'>
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className='flex-1 text-xs font-semibold text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white'>
                        {TAB_LABELS[tab]}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <RippleButton
                    onClick={() => setOpenTab(null)}
                    aria-label='Close settings'
                    className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white'>
                    <X className='h-4 w-4' />
                  </RippleButton>
                </div>

                <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6'>
                  {hasTempo && (
                    <TabsContent value='tempo' className='space-y-3'>
                      <ExerciseQuickActionsBar
                        exercise={exercise}
                        metronome={metronome}
                        examMode={examMode}
                      />
                      <SpeedDropdown
                        speedMultiplier={speedMultiplier}
                        onSpeedMultiplierChange={onSpeedMultiplierChange}
                        baseBpm={metronome.bpm}
                        isSlowed={speedMultiplier < 1}
                        h='h-12'
                        className='w-full justify-center'
                      />
                    </TabsContent>
                  )}

                  {hasSound && (
                    <TabsContent value='sound'>
                      <MediaControlsToolbar
                        hasMetronome={hasMetronome}
                        hasAudioTrack={hasAudioTrack}
                        hasMicControls={hasMicControls}
                        speedMultiplier={speedMultiplier}
                        onSpeedMultiplierChange={onSpeedMultiplierChange}
                        isAudioMuted={isAudioMuted}
                        isRiddleMode={isRiddleMode}
                        onAudioToggle={onAudioToggle}
                        isMicEnabled={isMicEnabled}
                        onMicToggle={onMicToggle}
                        onRecalibrate={onRecalibrate}
                        frequencyRef={frequencyRef}
                        volumeRef={volumeRef}
                        disableTuner={disableTuner}
                        metronome={metronome}
                        isMetronomeMuted={isMetronomeMuted}
                        setIsMetronomeMuted={setIsMetronomeMuted}
                        audioTracks={audioTracks}
                        setTrackConfigs={setTrackConfigs}
                        masterVolume={masterVolume}
                        onMasterVolumeChange={onMasterVolumeChange}
                        examMode={examMode}
                        mobile
                        hideSpeed
                      />
                    </TabsContent>
                  )}

                  {hasInfo && (
                    <TabsContent value='info'>
                      <MobileInstructionsCard exercise={exercise} plain />
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
