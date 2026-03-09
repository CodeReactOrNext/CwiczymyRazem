import type { YouTubeLessonResult } from "feature/aiCoach/types/youtubeLesson.types";
import { Youtube } from "lucide-react";

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

interface YouTubeLessonCardProps {
  lesson: YouTubeLessonResult;
}

const YouTubeLessonCard = ({ lesson }: YouTubeLessonCardProps) => {
  const handleClick = () => {
    window.open(`https://www.youtube.com/watch?v=${lesson.videoId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900 px-3 py-2.5 text-left transition hover:border-red-500/40 hover:bg-red-950/10"
    >
      {/* Thumbnail */}
      <div className="relative h-[45px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-zinc-800">
        <img
          src={lesson.thumbnailUrl}
          alt={lesson.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <Youtube className="h-5 w-5 text-red-500" />
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-semibold leading-tight text-zinc-100">
          {lesson.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-zinc-500">
          {lesson.channelName}
          {lesson.level ? ` · ${lesson.level}` : ""}
          {lesson.duration ? ` · ${formatDuration(lesson.duration)}` : ""}
        </p>
      </div>
    </button>
  );
};

export default YouTubeLessonCard;
