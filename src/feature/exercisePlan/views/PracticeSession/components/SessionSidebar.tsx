import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { memo } from "react";
import {
  FaExternalLinkAlt, FaFacebook, FaHeart, FaInstagram, FaTwitter, FaVolumeMute, FaVolumeUp,
} from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

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
  examMode?: boolean;
}

export const SessionSidebar = memo(function SessionSidebar({
  currentExercise,
  activeExercise,
  audioTracks,
  setTrackConfigs,
}: SessionSidebarProps) {
  const hasAudioMixer = activeExercise.backingTracks && activeExercise.backingTracks.length > 0;
  const hasLinks = currentExercise.links && currentExercise.links.length > 0;

  if (!hasAudioMixer && !hasLinks) return null;

  return (
    <div className="space-y-6 flex flex-col w-full max-w-xs">
      {hasAudioMixer && (
        <div className="rounded-lg bg-zinc-900/40 p-6 backdrop-blur-sm space-y-4">
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

      {hasLinks && (
        <div className="rounded-lg bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs tracking-wide">
            <FaHeart className="animate-pulse" />
            <span>Support Author</span>
          </div>
          <div className="flex flex-col gap-2">
            {currentExercise.links!.map((link, idx) => {
              let Icon = FaExternalLinkAlt;
              if (link.url.includes("facebook"))                              Icon = FaFacebook;
              if (link.url.includes("instagram"))                             Icon = FaInstagram;
              if (link.url.includes("twitter") || link.url.includes("x.com")) Icon = FaTwitter;
              if (link.url.includes("patreon"))                               Icon = FaHeart;
              return (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group px-4 py-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-sm"
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
});
