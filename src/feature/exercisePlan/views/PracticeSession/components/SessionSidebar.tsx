import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import {
  FaExternalLinkAlt, FaFacebook, FaHeart, FaInstagram, FaMicrophone,
  FaSync, FaTwitter, FaVolumeMute, FaVolumeUp,
} from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";
import { BpmProgressGrid } from "../../../components/BpmProgressGrid";
import { Metronome } from "../../../components/Metronome/Metronome";
import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import type { Exercise } from "../../../types/exercise.types";
import { useState } from "react";

interface SessionSidebarProps {
  currentExercise: Exercise;
  activeExercise: Exercise;
  // Metronome
  metronome: any;
  effectiveBpm: number;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (v: boolean) => void;
  isHalfSpeed: boolean;
  setIsHalfSpeed: (v: boolean | ((p: boolean) => boolean)) => void;
  // Audio toggle
  isAudioMuted: boolean;
  setIsAudioMuted: (v: boolean) => void;
  saveGuitarPlaybackPreference: (enabled: boolean) => void;
  soundfontsReady: boolean;
  // Mic controls
  isMicEnabled: boolean;
  showMicControls: boolean;
  toggleMic: () => Promise<void>;
  setSessionPhase: (phase: any) => void;
  // Audio mixer
  audioTracks: AudioTrackConfig[];
  trackConfigs: Record<string, { volume: number; isMuted: boolean }>;
  setTrackConfigs: React.Dispatch<React.SetStateAction<Record<string, { volume: number; isMuted: boolean }>>>;
  // BPM progress
  bpmStages: any[];
  completedBpms: any[];
  isBpmLoading: boolean;
  onBpmToggle: (bpm: number) => void;
  /** Exam mode — metronome BPM is locked */
  examMode?: boolean;
  /** Playback repeat count (0 = infinite) */
  tabRepeatCount: number;
  setTabRepeatCount: (n: number) => void;
  onRepeatCountChange?: () => void;
}

/**
 * Right sidebar panel: Metronome, audio controls, mixer, BPM progress, links.
 */
export const SessionSidebar = ({
  currentExercise,
  activeExercise,
  metronome,
  effectiveBpm,
  isMetronomeMuted,
  setIsMetronomeMuted,
  isHalfSpeed,
  setIsHalfSpeed,
  isAudioMuted,
  setIsAudioMuted,
  saveGuitarPlaybackPreference,
  soundfontsReady,
  isMicEnabled,
  showMicControls,
  toggleMic,
  setSessionPhase,
  audioTracks,
  trackConfigs,
  setTrackConfigs,
  bpmStages,
  completedBpms,
  isBpmLoading,
  onBpmToggle,
  examMode = false,
  tabRepeatCount,
  setTabRepeatCount,
  onRepeatCountChange,
}: SessionSidebarProps) => {
  return (
    <>
        {currentExercise.metronomeSpeed && (
          <div className="space-y-6 flex flex-col w-full lg:col-span-5">
            {!examMode && <div className="rounded-2xl bg-zinc-900/40 p-6 backdrop-blur-sm">
              <Metronome
                metronome={metronome}
                isMuted={isMetronomeMuted}
                onMuteToggle={setIsMetronomeMuted}
                isHalfSpeed={isHalfSpeed}
                onHalfSpeedToggle={setIsHalfSpeed}
                locked={examMode}
              />

              {((currentExercise.tablature && currentExercise.tablature.length > 0) || showMicControls) && (
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/5 pt-5">
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-11 gap-2 text-xs font-bold tracking-wide transition-all",
                      isAudioMuted
                        ? "bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 border border-white/5"
                        : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20",
                      currentExercise.riddleConfig?.mode === "sequenceRepeat" && "cursor-not-allowed opacity-50"
                    )}
                    disabled={currentExercise.riddleConfig?.mode === "sequenceRepeat"}
                    onClick={() => {
                      const newMuted = !isAudioMuted;
                      setIsAudioMuted(newMuted);
                      saveGuitarPlaybackPreference(!newMuted);
                    }}
                  >
                    <GiGuitar className="text-lg shrink-0" />
                    <span className="truncate">
                      {isAudioMuted
                        ? "Track Off"
                        : soundfontsReady ? "Track On" : "Loading..."}
                    </span>
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex-1 h-11 gap-2 text-xs font-bold tracking-wide transition-all",
                        isMicEnabled
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          : "bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 border border-white/5"
                      )}
                      onClick={toggleMic}
                    >
                      <FaMicrophone className="shrink-0" />
                      <span className="truncate">{isMicEnabled ? "Mic On" : "Mic Off"}</span>
                    </Button>
                    {isMicEnabled && (
                      <Button
                        variant="ghost"
                        className="h-11 w-11 shrink-0 p-0 bg-zinc-900/50 text-zinc-400 hover:text-white border border-white/5 transition-all"
                        onClick={() => setSessionPhase("calibrating")}
                        title="Recalibrate"
                      >
                        <FaSync />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>}

            {activeExercise.backingTracks && activeExercise.backingTracks.length > 0 && (
              <div className="rounded-2xl bg-zinc-900/40 p-6 backdrop-blur-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <GiGuitar className="text-cyan-400" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Audio Mixer</h4>
                </div>
                <div className="space-y-6">
                  {audioTracks.map((track) => (
                    <div key={track.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[150px]">
                          {track.id === "main" ? "Main Instrument" : track.name}
                        </span>
                        <button
                          onClick={() => setTrackConfigs(prev => ({
                            ...prev,
                            [track.id]: { ...prev[track.id], isMuted: !prev[track.id]?.isMuted },
                          }))}
                          className={cn(
                            "p-1.5 rounded transition-colors",
                            track.isMuted ? "text-red-500 bg-red-500/10" : "text-zinc-500 hover:text-white"
                          )}
                        >
                          {track.isMuted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[track.isMuted ? 0 : track.volume * 100]}
                          max={100}
                          step={1}
                          className="flex-1"
                          onValueChange={([val]) => setTrackConfigs(prev => ({
                            ...prev,
                            [track.id]: { ...prev[track.id], volume: val / 100, isMuted: val === 0 },
                          }))}
                        />
                        <span className="text-[9px] font-mono text-zinc-600 w-6 text-right">
                          {Math.round(track.volume * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6 flex flex-col w-full lg:col-span-3">
          {currentExercise.metronomeSpeed && bpmStages.length > 0 && !currentExercise.gpFileUrl && !examMode && (
            <div className="rounded-2xl bg-zinc-900/40 p-6 backdrop-blur-sm">
              <BpmProgressGrid
                bpmStages={bpmStages}
                completedBpms={completedBpms}
                recommendedBpm={currentExercise.metronomeSpeed.recommended}
                onToggle={onBpmToggle}
                isLoading={isBpmLoading}
              />
            </div>
          )}

          {currentExercise.links && currentExercise.links.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs tracking-wide">
                <FaHeart className="animate-pulse" />
                <span>Support Author</span>
              </div>
              <div className="flex flex-col gap-2">
                {currentExercise.links.map((link, idx) => {
                  let Icon = FaExternalLinkAlt;
                  if (link.url.includes("facebook"))                            Icon = FaFacebook;
                  if (link.url.includes("instagram"))                           Icon = FaInstagram;
                  if (link.url.includes("twitter") || link.url.includes("x.com")) Icon = FaTwitter;
                  if (link.url.includes("patreon"))                             Icon = FaHeart;
                  return (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn(
                          "h-4 w-4",
                          link.url.includes("patreon") ? "text-red-500" : "text-zinc-400 group-hover:text-white"
                        )} />
                        <span className="text-zinc-300 group-hover:text-white font-medium">{link.label}</span>
                      </div>
                      <FaExternalLinkAlt className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
    </>
  );
};
;
