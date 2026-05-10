import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Lock, LockKeyholeOpen, Pencil, Video } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";

export interface YouTubeSongPlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  getCurrentTime: () => number;
}

interface YouTubeSongPlayerProps {
  youtubeUrl: string | null;
  onUrlSave: (url: string) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onDurationReady: (duration: number) => void;
  onPlay?: () => void;
  isLocked?: boolean;
  onLockToggle?: () => void;
}

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

export const YouTubeSongPlayer = forwardRef<YouTubeSongPlayerRef, YouTubeSongPlayerProps>(
  ({ youtubeUrl, onUrlSave, onTimeUpdate, onDurationReady, onPlay, isLocked, onLockToggle }, ref) => {
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [inputError, setInputError] = useState(false);
    const [speed, setSpeed] = useState(1);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, true);
      },
      play: () => {
        playerRef.current?.playVideo();
      },
      pause: () => {
        playerRef.current?.pauseVideo();
      },
      togglePlay: () => {
        const state = playerRef.current?.getPlayerState();
        if (state === 1) playerRef.current?.pauseVideo();
        else playerRef.current?.playVideo();
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() ?? 0;
      },
    }));

    const startTracking = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!playerRef.current) return;
        const current = playerRef.current.getCurrentTime?.() ?? 0;
        const total = playerRef.current.getDuration?.() ?? 0;
        onTimeUpdate(current, total);
      }, 200);
    };

    const stopTracking = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleReady = (event: any) => {
      playerRef.current = event.target;
      const dur = event.target.getDuration?.() ?? 0;
      onDurationReady(dur);
      event.target.setPlaybackRate?.(speed);
    };

    const handleSpeedChange = (rate: number) => {
      setSpeed(rate);
      playerRef.current?.setPlaybackRate?.(rate);
    };

    const handleStateChange = (event: any) => {
      if (event.data === 1) {
        startTracking();
        onPlay?.();
      } else {
        stopTracking();
      }
    };

    const handleSaveUrl = () => {
      const trimmed = urlInput.trim();
      const id = extractVideoId(trimmed);
      if (!id) {
        setInputError(true);
        return;
      }
      onUrlSave(trimmed);
      setIsEditing(false);
      setUrlInput("");
      setInputError(false);
    };

    const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;

    const opts: YouTubeProps["opts"] = {
      height: "100%",
      width: "100%",
      playerVars: {
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
      },
    };

    if (!videoId || isEditing) {
      return (
        <div className="rounded-xl bg-white/[0.02] border border-white/10 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-500">
              {isEditing ? "Change video" : "No video linked yet"}
            </span>
          </div>
          {!isEditing && (
            <p className="text-xs text-zinc-500 leading-relaxed mb-2">
              Link a YouTube video to start mapping sections. Once mapped, you can loop parts, track mastery, and sync your practice session.
            </p>
          )}
          <div className="flex gap-2">
            <input
              className={cn(
                "flex-1 h-10 bg-white/5 border rounded-xl px-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-colors",
                inputError ? "border-red-500/60" : "border-white/10"
              )}
              placeholder="Paste YouTube link…"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setInputError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSaveUrl()}
            />
            <Button
              onClick={handleSaveUrl}
              className="h-10 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl px-5 font-bold text-sm transition-colors"
            >
              Save
            </Button>
            {isEditing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setUrlInput("");
                  setInputError(false);
                }}
                className="h-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 border border-white/5"
              >
                Cancel
              </Button>
            )}
          </div>
          {inputError && (
            <p className="text-xs text-red-400">
              Invalid YouTube URL — try youtube.com/watch?v=… or youtu.be/…
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setUrlInput(youtubeUrl ?? "");
              setIsEditing(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-medium text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
            Change video
          </button>
        </div>

        <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/5 border border-white/5">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={handleReady}
            onStateChange={handleStateChange}
            className="h-full w-full"
            iframeClassName="h-full w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-xs text-zinc-600 mr-1 font-medium">
            Speed
          </span>
          {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleSpeedChange(rate)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors",
                speed === rate
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-white/[0.03] border-white/10 text-zinc-500 hover:bg-white/5 hover:text-white hover:border-white/20"
              )}
            >
              {rate === 1 ? "1×" : `${rate}×`}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onLockToggle}
                    className={cn(
                      "h-8 px-3 rounded-lg flex items-center gap-2 border transition-all",
                      isLocked
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-white/[0.03] border-white/10 text-zinc-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {isLocked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <LockKeyholeOpen className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {isLocked ? "Locked" : "Lock"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isLocked ? "Unlock editing" : "Lock editing"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  }
);

YouTubeSongPlayer.displayName = "YouTubeSongPlayer";
