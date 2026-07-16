import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { memo } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";
import { HiOutlineSpeakerWave } from "react-icons/hi2";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import type { Exercise } from "../../../types/exercise.types";

interface SessionSidebarProps {
  currentExercise: Exercise;
  activeExercise: Exercise;
  metronome: any;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (v: boolean) => void;
  audioTracks: AudioTrackConfig[];
  trackConfigs: Record<string, { volume: number; isMuted: boolean }>;
  setTrackConfigs: React.Dispatch<React.SetStateAction<Record<string, { volume: number; isMuted: boolean }>>>;
  /** Overall boost on top of every track's own volume (1 = normal, up to 2 = +100%). */
  masterVolume: number;
  setMasterVolume: (v: number) => void;
  /** Whether the current exercise plays back a Guitar Pro (MIDI) file. */
  hasGpFile?: boolean;
  examMode?: boolean;
}

export const SessionSidebar = memo(function SessionSidebar({
  activeExercise,
  audioTracks,
  setTrackConfigs,
  masterVolume,
  setMasterVolume,
  hasGpFile,
}: SessionSidebarProps) {
  const hasAudioMixer = activeExercise.backingTracks && activeExercise.backingTracks.length > 0;

  // Support Author links are now rendered inside the Exercise Instructions panel
  // (see ExerciseInstructionsInline) to keep them grouped with the exercise info.
  if (!hasAudioMixer && !hasGpFile) return null;

  return (
    <div className="space-y-6 flex flex-col w-full max-w-xs">
      {hasGpFile && (
        <div className="rounded-lg bg-zinc-900/40 p-6 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineSpeakerWave className="text-cyan-400" />
              <h4 className="text-[10px] font-bold tracking-widest text-zinc-500">Master Volume</h4>
            </div>
            <span className={cn(
              "text-[9px] font-mono w-9 text-right",
              masterVolume > 1 ? "text-cyan-400" : "text-zinc-600"
            )}>
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[masterVolume * 100]}
            max={200}
            step={5}
            onValueChange={([val]) => setMasterVolume(val / 100)}
          />
          <p className="text-[9px] text-zinc-600">
            Boost the Guitar Pro playback above 100% if it sounds too quiet.
          </p>
        </div>
      )}
      {hasAudioMixer && (
        <div className="rounded-lg bg-zinc-900/40 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <GiGuitar className="text-cyan-400" />
            <h4 className="text-[10px] font-bold tracking-widest text-zinc-500">Audio Mixer</h4>
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
  );
});
