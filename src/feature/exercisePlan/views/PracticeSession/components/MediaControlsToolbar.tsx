import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Gauge } from "lucide-react";
import { memo } from "react";
import { FaMicrophone, FaSync } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

interface MediaControlsToolbarProps {
  hasMetronome: boolean;
  hasAudioTrack: boolean;
  hasMicControls: boolean;
  isHalfSpeed: boolean;
  onHalfSpeedToggle: (value: boolean) => void;
  isAudioMuted: boolean;
  isRiddleMode: boolean;
  onAudioToggle: () => void;
  isMicEnabled: boolean;
  onMicToggle: () => void;
  onRecalibrate: () => void;
}

export const MediaControlsToolbar = memo(function MediaControlsToolbar({
  hasMetronome,
  hasAudioTrack,
  hasMicControls,
  isHalfSpeed,
  onHalfSpeedToggle,
  isAudioMuted,
  isRiddleMode,
  onAudioToggle,
  isMicEnabled,
  onMicToggle,
  onRecalibrate,
}: MediaControlsToolbarProps) {
  if (!hasMetronome && !hasAudioTrack && !hasMicControls) return null;

  return (
    <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
      {hasMetronome && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onHalfSpeedToggle(!isHalfSpeed)}
              className={cn(
                "flex items-center gap-2 h-12 px-4 rounded-lg transition-all border text-sm font-bold tracking-wide",
                isHalfSpeed
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                  : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Gauge className="h-4 w-4 shrink-0" />
              0.5x
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isHalfSpeed ? "Half speed ON" : "Half speed OFF"}
          </TooltipContent>
        </Tooltip>
      )}
      {hasAudioTrack && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onAudioToggle}
              disabled={isRiddleMode}
              className={cn(
                "flex items-center justify-center h-12 w-12 rounded-lg transition-all border",
                isAudioMuted
                  ? "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20",
                isRiddleMode && "opacity-50 cursor-not-allowed"
              )}
            >
              <GiGuitar className="text-lg" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isAudioMuted ? "Track Off" : "Track On"}
          </TooltipContent>
        </Tooltip>
      )}
      {hasMicControls && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onMicToggle}
                className={cn(
                  "flex items-center justify-center h-12 w-12 rounded-lg transition-all border",
                  isMicEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <FaMicrophone className="text-base" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isMicEnabled ? "Mic On" : "Mic Off"}
            </TooltipContent>
          </Tooltip>
          {isMicEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onRecalibrate}
                  className="flex items-center justify-center h-12 w-12 rounded-lg transition-all border bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  <FaSync className="text-base" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Recalibrate mic
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}
    </div>
  );
});
