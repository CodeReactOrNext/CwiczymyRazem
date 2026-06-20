import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  BookOpen,
  CheckCircle2,
  ListMusic,
  Music,
  Star,
  Users,
} from "lucide-react";
import { type ReactNode } from "react";
import { useAppSelector } from "store/hooks";

const STATUS_META = {
  wantToLearn: { label: "Want to Learn", icon: ListMusic, color: "text-zinc-300", ring: "ring-zinc-400/40" },
  learning: { label: "Learning", icon: BookOpen, color: "text-amber-400", ring: "ring-amber-400/50" },
  learned: { label: "Learned", icon: CheckCircle2, color: "text-green-400", ring: "ring-green-400/50" },
} as const;

interface SongCardProps {
  song: Song;
  onOpenDetails: () => void;
  userStatus?: SongStatus;
  footerAction?: { label: string; icon: ReactNode };
  onStatusChange?: (status: SongStatus | undefined) => void;
  isPracticeMode?: boolean;
  onPlay?: () => void;
}

export const SongCard = ({
  song,
  onOpenDetails,
  userStatus,
}: SongCardProps) => {
  const userId = useAppSelector(selectUserAuth);
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty === 0 ? "?" : (song.tier || avgDifficulty));
  const isRated = song.difficulties?.some(d => d.userId === userId);

  return (
    <div
      onClick={onOpenDetails}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg bg-zinc-800/40 p-4 transition-all duration-500 click-behavior cursor-pointer",
        "hover:bg-zinc-800/60 hover:shadow-md hover:shadow-black/20"
      )}
    >
      <Ripple />

      {/* Glassmorphism Depth Border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      {/* Header: Cover + Metadata */}
      <div className="relative z-10 flex items-stretch gap-4">
        {/* Cover */}
        <div className="relative shrink-0">
          {song.coverUrl ? (
            <div className="h-24 w-24 overflow-hidden rounded-lg">
              <img
                src={song.coverUrl}
                alt={`${song.title} cover`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-zinc-900/60 text-zinc-700">
              <Music className="h-9 w-9 opacity-20" />
            </div>
          )}

          {userStatus && (() => {
            const meta = STATUS_META[userStatus];
            const StatusIcon = meta.icon;
            return (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "absolute -left-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-[4px] bg-zinc-900 shadow-md ring-1 backdrop-blur-md",
                        meta.ring,
                        meta.color
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-900 border-white/10 text-xs font-bold text-zinc-200">
                    {meta.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })()}
        </div>

        {/* Metadata */}
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 translate="no" className="line-clamp-1 text-base font-bold text-white">
              {song.title}
            </h3>
            <div
              className="flex shrink-0 items-center gap-2 rounded-[4px] px-2 py-1"
              style={{ backgroundColor: `${tier.color}14` }}
            >
              <span className="text-[11px] font-semibold leading-none" style={{ color: tier.color }}>
                {tier.tier}
              </span>
              <span className="h-3 w-px" style={{ backgroundColor: `${tier.color}33` }} />
              <span className="text-sm font-semibold leading-none tabular-nums" style={{ color: tier.color }}>
                {avgDifficulty.toFixed(1)}
              </span>
            </div>
          </div>
          <p translate="no" className="truncate text-sm font-medium text-zinc-300 mt-0.5">
            {song.artist}
          </p>

          <div className="mt-auto pt-2 flex flex-wrap items-center gap-2">
            {song.popularity !== undefined && song.popularity > 0 && (
              <div className="flex items-center gap-1 text-zinc-400">
                <Users className="h-3 w-3" />
                <span className="text-xs font-semibold">{song.popularity}</span>
              </div>
            )}
            {song.genres && song.genres.length > 0 && (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-600" />
                {song.genres.slice(0, 1).map(g => (
                  <span key={g} className="capitalize text-xs font-medium text-zinc-400">
                    {g}
                  </span>
                ))}
              </>
            )}
            {isRated && (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-600" />
                <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
                  <Star className="h-3 w-3 fill-current" />
                  Rated
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
