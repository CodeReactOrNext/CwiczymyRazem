import { Button } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Link, Lock, LockKeyholeOpen, Pencil, Search } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";

interface YouTubeSuggestion {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

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
  songTitle?: string;
  songArtist?: string;
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

export const YouTubeSongPlayer = forwardRef<
  YouTubeSongPlayerRef,
  YouTubeSongPlayerProps
>(
  (
    {
      youtubeUrl,
      onUrlSave,
      onTimeUpdate,
      onDurationReady,
      onPlay,
      isLocked,
      onLockToggle,
      songTitle,
      songArtist,
    },
    ref,
  ) => {
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [inputError, setInputError] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [suggestions, setSuggestions] = useState<YouTubeSuggestion[]>([]);

    useEffect(() => {
      if (youtubeUrl || isEditing || !songTitle) return;
      const query = [songArtist, songTitle].filter(Boolean).join(" ");
      fetch(`/api/songs/search-youtube?q=${encodeURIComponent(query)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => setSuggestions(data.videos ?? []))
        .catch(() => setSuggestions([]));
    }, [youtubeUrl, isEditing, songTitle, songArtist]);

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
        <div className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5'>
          {/* Step 1 — paste link */}
          <div className='flex flex-col gap-2.5'>
            <div className='flex items-center gap-2'>
              <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-[10px] font-bold text-zinc-400'>
                1
              </span>
              <div className='flex items-center gap-1.5'>
                <Link className='h-3.5 w-3.5 text-zinc-500' />
                <span className='text-xs font-semibold text-zinc-400'>
                  {isEditing
                    ? "Paste a new YouTube link"
                    : "Paste a YouTube link"}
                </span>
              </div>
            </div>
            <div className='flex gap-2'>
              <input
                className={cn(
                  "h-10 flex-1 rounded-lg bg-zinc-800/40 px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:bg-zinc-800/60",
                  inputError && "bg-red-500/10",
                )}
                placeholder='e.g. youtube.com/watch?v=…'
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setInputError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSaveUrl()}
              />
              <Button
                onClick={handleSaveUrl}
                className='h-10 rounded-lg border-none bg-cyan-500/10 px-5 text-sm font-bold text-cyan-400 transition-colors hover:bg-cyan-500/20'>
                Save
              </Button>
              {isEditing && (
                <Button
                  variant='ghost'
                  onClick={() => {
                    setIsEditing(false);
                    setUrlInput("");
                    setInputError(false);
                  }}
                  className='h-10 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white'>
                  Cancel
                </Button>
              )}
            </div>
            {inputError && (
              <p className='text-xs text-red-400'>
                Invalid YouTube URL — try youtube.com/watch?v=… or youtu.be/…
              </p>
            )}
          </div>

          {suggestions.length > 0 && (
            <>
              <span className='text-center text-xs font-medium text-zinc-500'>
                or
              </span>

              {/* Step 2 — pick suggestion */}
              <div className='flex flex-col gap-2.5'>
                <div className='flex items-center gap-2'>
                  <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-[10px] font-bold text-zinc-400'>
                    2
                  </span>
                  <div className='flex items-center gap-1.5'>
                    <Search className='h-3.5 w-3.5 text-zinc-500' />
                    <span className='text-xs font-semibold text-zinc-400'>
                      Pick from suggestions
                    </span>
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                  {suggestions.map((video) => (
                    <button
                      key={video.id}
                      type='button'
                      onClick={() => {
                        onUrlSave(
                          `https://www.youtube.com/watch?v=${video.id}`,
                        );
                        setSuggestions([]);
                      }}
                      className='group flex flex-col gap-1.5 rounded-lg bg-zinc-800/40 p-2 text-left transition-colors hover:bg-zinc-800/70'>
                      <div className='relative aspect-video w-full overflow-hidden rounded bg-black'>
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className='h-full w-full object-cover transition-opacity group-hover:opacity-80'
                        />
                        <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
                          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-black/60'>
                            <svg
                              className='ml-0.5 h-3.5 w-3.5 fill-current text-white'
                              viewBox='0 0 24 24'>
                              <path d='M8 5v14l11-7z' />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className='line-clamp-2 text-xs font-medium leading-tight text-zinc-300'>
                        {video.title}
                      </p>
                      <p className='truncate text-[10px] text-zinc-500'>
                        {video.channel}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className='space-y-2'>
        <div className='flex justify-end'>
          <button
            onClick={() => {
              setUrlInput(youtubeUrl ?? "");
              setIsEditing(true);
            }}
            className='flex items-center gap-1.5 rounded-lg bg-zinc-800/40 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
            <Pencil className='h-3.5 w-3.5' />
            Change video
          </button>
        </div>

        <div className='aspect-video w-full overflow-hidden rounded-lg bg-zinc-900/40'>
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={handleReady}
            onStateChange={handleStateChange}
            className='h-full w-full'
            iframeClassName='h-full w-full'
          />
        </div>

        <div className='flex items-center gap-1.5 pt-0.5'>
          <span className='mr-1 text-xs font-medium text-zinc-500'>Speed</span>
          {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type='button'
              onClick={() => handleSpeedChange(rate)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                speed === rate
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
              )}>
              {rate === 1 ? "1×" : `${rate}×`}
            </button>
          ))}

          <div className='ml-auto flex items-center gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={onLockToggle}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded-lg px-3 transition-all",
                      isLocked
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                    )}>
                    {isLocked ? (
                      <Lock className='h-3.5 w-3.5' />
                    ) : (
                      <LockKeyholeOpen className='h-3.5 w-3.5' />
                    )}
                    <span className='text-[10px] font-bold'>
                      {isLocked ? "Locked" : "Lock"}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side='top'>
                  <p>{isLocked ? "Unlock editing" : "Lock editing"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  },
);

YouTubeSongPlayer.displayName = "YouTubeSongPlayer";
