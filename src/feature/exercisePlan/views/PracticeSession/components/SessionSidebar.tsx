import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { motion } from "framer-motion";
import {
  FaExternalLinkAlt, FaFacebook, FaHeart, FaInstagram, FaMicrophone,
  FaSync, FaTwitter, FaVolumeMute, FaVolumeUp,
} from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";
import { BpmProgressGrid } from "../../../components/BpmProgressGrid";
import { Metronome } from "../../../components/Metronome/Metronome";
import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import type { Exercise } from "../../../types/exercise.types";
import { CENTS_TOLERANCE } from "../hooks/useNoteMatching";

interface NoteData { note: string; octave: number; cents: number; }

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
  updateMicPersistence: (v: boolean) => void;
  isListening: boolean;
  volume: number;
  sessionAccuracy: number;
  detectedNoteData: NoteData | null;
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
}

/**
 * Right sidebar panel: Metronome, audio controls, mixer, BPM progress, links.
 */
export const SessionSidebar = ({
  currentExercise,
  activeExercise,
  metronome,
  isMetronomeMuted,
  setIsMetronomeMuted,
  isHalfSpeed,
  setIsHalfSpeed,
  isAudioMuted,
  setIsAudioMuted,
  saveGuitarPlaybackPreference,
  soundfontsReady,
  isMicEnabled,
  updateMicPersistence,
  isListening,
  volume,
  sessionAccuracy,
  detectedNoteData,
  setSessionPhase,
  audioTracks,
  trackConfigs,
  setTrackConfigs,
  bpmStages,
  completedBpms,
  isBpmLoading,
  onBpmToggle,
}: SessionSidebarProps) => (
    <div className="lg:col-span-4 space-y-6">

      {/* Metronome + Audio Controls */}
      {currentExercise.metronomeSpeed && (
        <div className="rounded-2xl bg-zinc-900/40 p-6 backdrop-blur-sm">
          <Metronome
            metronome={metronome}
            showStartStop={!currentExercise.tablature || currentExercise.tablature.length === 0}
            isMuted={isMetronomeMuted}
            onMuteToggle={setIsMetronomeMuted}
            recommendedBpm={currentExercise.metronomeSpeed.recommended}
            isHalfSpeed={isHalfSpeed}
            onHalfSpeedToggle={setIsHalfSpeed}
          />

          {currentExercise.tablature && currentExercise.tablature.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full gap-2 text-xs font-bold tracking-wide transition-all",
                  isAudioMuted
                    ? "text-zinc-500 hover:text-zinc-400"
                    : "text-cyan-400 hover:text-cyan-300 bg-cyan-500/10",
                  currentExercise.riddleConfig?.mode === "sequenceRepeat" && "opacity-50 cursor-not-allowed"
                )}
                disabled={currentExercise.riddleConfig?.mode === "sequenceRepeat"}
                onClick={() => {
                  const newMuted = !isAudioMuted;
                  setIsAudioMuted(newMuted);
                  saveGuitarPlaybackPreference(!newMuted);
                }}
              >
                <GiGuitar className="text-base" />
                {isAudioMuted ? <FaVolumeMute className="h-4 w-4" /> : <FaVolumeUp className="h-4 w-4" />}
                {isAudioMuted
                  ? "Guitar Backing Track off"
                  : soundfontsReady ? "Guitar Backing Track on" : "Loading samples..."}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 gap-2 text-[10px] font-bold tracking-wide transition-all",
                    isMicEnabled
                      ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                      : "text-zinc-500 hover:text-zinc-400"
                  )}
                  onClick={() => updateMicPersistence(!isMicEnabled)}
                >
                  <FaMicrophone className="text-xs" />
                  {isMicEnabled ? "Mic On" : "Mic Off"}
                </Button>
                {isMicEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-[10px] font-bold tracking-wide text-zinc-500 hover:text-zinc-300"
                    onClick={() => setSessionPhase("calibrating")}
                  >
                    <FaSync className="text-xs" />
                    Recalibrate
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Mic live feedback */}
          {isMicEnabled && isListening && (
            <div className="mt-4 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className={cn(
                      "h-full transition-all duration-150",
                      volume > 0.1 ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-zinc-600"
                    )}
                    animate={{ width: `${Math.min(100, volume * 300)}%` }}
                  />
                </div>
                <span className="text-[8px] font-bold text-zinc-500 tracking-tight">Level</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 leading-none">
                {sessionAccuracy}% Accuracy
              </span>
              {detectedNoteData && volume > 0.05 && (
                <span className={cn(
                  "text-[8px] font-mono px-1 py-0 mt-1 rounded border",
                  Math.abs(detectedNoteData.cents) <= CENTS_TOLERANCE
                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                    : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                )}>
                  {detectedNoteData.note}{detectedNoteData.octave}{" "}
                  {detectedNoteData.cents > 0 ? "+" : ""}{detectedNoteData.cents}c
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Audio Mixer */}
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

      {/* BPM Progress Grid */}
      {currentExercise.metronomeSpeed && bpmStages.length > 0 && (
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

      {/* Support Author Links */}
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
);
