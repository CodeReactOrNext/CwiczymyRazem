import { useState } from "react";
import { FaYoutube, FaPlay, FaSearch, FaMusic } from "react-icons/fa";
import { useSessionUI } from "../contexts/SessionUIContext";

type PickerState = "idle" | "loading" | "results";

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

interface BackingTrackPickerProps {
  exerciseTitle: string;
}

export function BackingTrackPicker({ exerciseTitle }: BackingTrackPickerProps) {
  const { setBackingVideoId } = useSessionUI();
  const [state, setState] = useState<PickerState>("idle");
  const [videos, setVideos] = useState<VideoResult[]>([]);

  async function search() {
    setState("loading");
    try {
      const q = encodeURIComponent("Guitar Backing Track");
      const res = await fetch(`/api/songs/search-youtube?q=${q}`);
      const data = await res.json();
      setVideos(data.videos ?? []);
      setState("results");
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 min-h-[260px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <FaMusic size={28} className="text-amber-500/70" />
        <p className="text-zinc-300 font-semibold text-base">This exercise requires a backing track</p>
        <p className="text-zinc-500 text-sm">Find one on YouTube to play along</p>
      </div>

      {state === "idle" && (
        <button
          onClick={search}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-semibold text-sm transition-all"
        >
          <FaYoutube size={18} className="text-amber-500" />
          Find Backing Track on YouTube
        </button>
      )}

      {state === "loading" && (
        <div className="flex items-center gap-2.5 text-zinc-500 text-sm font-medium animate-pulse">
          <FaSearch size={14} />
          Searching YouTube...
        </div>
      )}

      {state === "results" && (
        <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setBackingVideoId(video.id)}
              className="flex-1 group flex flex-col rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-left"
            >
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt=""
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-amber-500 rounded-full p-3 shadow-lg">
                    <FaPlay size={14} className="text-white translate-x-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-snug">{video.title}</p>
                <p className="text-[10px] text-zinc-500 mt-1 truncate">{video.channel}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {state === "results" && (
        <button onClick={search} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2">
          Search again
        </button>
      )}
    </div>
  );
}

interface BackingVideoPlayerProps {
  videoId: string;
  onChangeClick: () => void;
}

export function BackingVideoPlayer({ videoId, onChangeClick }: BackingVideoPlayerProps) {
  return (
    <div className="w-full relative group p-4 flex flex-col items-center">
      <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-zinc-900 shadow-2xl border-2 border-amber-500/30 relative ring-2 ring-amber-500/10 transition-all duration-300 hover:border-amber-500/50 hover:ring-amber-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none z-10" />
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          className="h-full w-full relative z-0"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      </div>
      <button
        onClick={onChangeClick}
        className="absolute top-6 right-6 z-20 px-2.5 py-1 rounded bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white text-[11px] font-bold transition-all opacity-0 group-hover:opacity-100"
      >
        Change
      </button>
    </div>
  );
}
