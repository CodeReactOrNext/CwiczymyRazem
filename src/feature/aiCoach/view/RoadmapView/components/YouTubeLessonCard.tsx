import { cn } from "assets/lib/utils";
import type { YouTubeLessonResult } from "feature/aiCoach/types/youtubeLesson.types";
import { Clock } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";

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
  beginner: "bg-cyan-500/10 text-cyan-400",
  intermediate: "bg-amber-500/10 text-amber-400",
  advanced: "bg-rose-500/10 text-rose-400",
  all: "bg-zinc-800/60 text-zinc-400",
};

interface YouTubeLessonCardProps {
  lesson: YouTubeLessonResult;
  className?: string;
  /** Override the default behaviour (open on YouTube) — e.g. open a practice window. */
  onClick?: () => void;
}

const YouTubeLessonCard = ({
  lesson,
  className,
  onClick,
}: YouTubeLessonCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    window.open(
      `https://www.youtube.com/watch?v=${lesson.videoId}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const levelKey = lesson.level?.toLowerCase() ?? "";
  const levelStyle = LEVEL_STYLES[levelKey] ?? "bg-zinc-700/60 text-zinc-300";

  return (
    <button
      type='button'
      onClick={handleClick}
      className={cn(
        "group flex w-full items-start gap-4 rounded-lg bg-zinc-900/40 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/60",
        className,
      )}>
      {/* Thumbnail */}
      <div className='relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg bg-zinc-800'>
        <img
          src={lesson.thumbnailUrl}
          alt={lesson.title}
          className='h-full w-full object-cover'
          loading='lazy'
        />
        <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-red-600/90'>
            <FaYoutube className='h-5 w-5 text-white' />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className='min-w-0 flex-1 py-0.5'>
        <p className='line-clamp-2 text-sm font-semibold leading-snug text-zinc-100'>
          {lesson.title}
        </p>
        <p className='mt-1 truncate text-xs text-zinc-400'>
          {lesson.channelName}
        </p>
        <div className='mt-2 flex flex-wrap items-center gap-2'>
          {lesson.level && (
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-semibold capitalize",
                levelStyle,
              )}>
              {lesson.level}
            </span>
          )}
          {!!lesson.duration && (
            <span className='flex items-center gap-1 text-[11px] text-zinc-400'>
              <Clock className='h-3 w-3' />
              {formatDuration(lesson.duration)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default YouTubeLessonCard;
