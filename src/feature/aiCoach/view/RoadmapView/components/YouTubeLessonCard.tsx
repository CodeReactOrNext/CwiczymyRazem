import type { YouTubeLessonResult } from "feature/aiCoach/types/youtubeLesson.types";
import { Clock, Youtube } from "lucide-react";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return `${h}:${String(rem).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
  all: "bg-zinc-800/60 text-zinc-400 ring-1 ring-zinc-700/40",
};

interface YouTubeLessonCardProps {
  lesson: YouTubeLessonResult;
}

const YouTubeLessonCard = ({ lesson }: YouTubeLessonCardProps) => {
  const handleClick = () => {
    window.open(`https://www.youtube.com/watch?v=${lesson.videoId}`, "_blank", "noopener,noreferrer");
  };

  const levelKey = lesson.level?.toLowerCase() ?? "";
  const levelStyle = LEVEL_STYLES[levelKey] ?? "bg-zinc-700/60 text-zinc-300 ring-1 ring-zinc-600/40";

  return (
    <button
      onClick={handleClick}
      className="group flex w-full items-start gap-4 rounded-2xl border border-zinc-700/60 bg-zinc-900/80 p-3 text-left transition hover:border-red-500/40 hover:bg-red-950/10"
    >
      {/* Thumbnail */}
      <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-zinc-800">
        <img
          src={lesson.thumbnailUrl}
          alt={lesson.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/90">
            <Youtube className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">
          {lesson.title}
        </p>
        <p className="mt-1 truncate text-xs text-zinc-500">
          {lesson.channelName}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {lesson.level && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${levelStyle}`}>
              {lesson.level}
            </span>
          )}
          {lesson.duration && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Clock className="h-3 w-3" />
              {formatDuration(lesson.duration)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default YouTubeLessonCard;
