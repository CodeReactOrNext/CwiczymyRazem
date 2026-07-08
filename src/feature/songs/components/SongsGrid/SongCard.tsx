import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import { AddToPlaylistSub } from "feature/songs/components/Playlists/AddToPlaylistSub";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoriteSong } from "feature/user/store/userSlice.favoriteActions";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  ListMusic,
  MoreVertical,
  Music,
  Play,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

const STATUS_META = {
  wantToLearn: { label: "Want to Learn", icon: ListMusic, color: "text-zinc-300", ring: "ring-zinc-400/40" },
  learning: { label: "Learning", icon: BookOpen, color: "text-amber-400", ring: "ring-amber-400/50" },
  learned: { label: "Learned", icon: CheckCircle2, color: "text-green-400", ring: "ring-green-400/50" },
} as const;

function formatPracticeMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

interface SongCardProps {
  song: Song;
  onOpenDetails: () => void;
  userStatus?: SongStatus;
  footerAction?: { label: string; icon: ReactNode };
  onStatusChange?: (status: SongStatus | undefined) => void;
  isPracticeMode?: boolean;
  onPlay?: () => void;
  /** Board view: show practice time / "Not practiced" instead of genre & popularity. */
  showPracticeStatus?: boolean;
  practiceMs?: number;
}

export const SongCard = ({
  song,
  onOpenDetails,
  userStatus,
  onStatusChange,
  onPlay,
  showPracticeStatus,
  practiceMs,
}: SongCardProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const isFavorite = (userInfo?.favoriteSongIds ?? []).includes(song.id);
  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(avgDifficulty === 0 ? "?" : (song.tier || avgDifficulty));
  const isRated = song.difficulties?.some(d => d.userId === userId);

  // Only enable the title tooltip when the text is actually truncated.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  // Right-click anywhere on the card opens the same actions menu.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const check = () => setIsTitleTruncated(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [song.title]);

  return (
    <div
      onClick={onOpenDetails}
      onContextMenu={(e) => {
        e.preventDefault();
        setIsMenuOpen(true);
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md p-3 transition-all duration-300 ease-out click-behavior cursor-pointer",
        "hover:bg-zinc-800/40"
      )}
    >
      <Ripple />

      {/* Cover */}
      <div className="relative z-10 aspect-square w-full overflow-hidden rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={`${song.title} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-white/30"
            style={{ background: `linear-gradient(135deg, ${tier.color}26, ${tier.color}0d)` }}
          >
            <Music className="h-10 w-10" />
          </div>
        )}

        {/* Top scrim for badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Status badge (top-left) */}
        {userStatus && (() => {
          const meta = STATUS_META[userStatus];
          const StatusIcon = meta.icon;
          return (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-[4px] bg-zinc-900/80 shadow-md ring-1 backdrop-blur-md",
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

        {/* Actions (bottom-right of cover) — shown on hover (always visible on touch) */}
        <div
          className={cn(
            "absolute bottom-2 right-2 z-20 flex translate-y-1 items-center gap-1.5 opacity-0 transition-all duration-200 ease-out focus-within:translate-y-0 focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100",
            isMenuOpen && "translate-y-0 opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {onPlay && (
            <button
              aria-label="Practice"
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
              className="flex h-8 w-8 items-center justify-center gap-1.5 rounded-md bg-black text-white shadow-lg transition-colors hover:bg-zinc-900 active:scale-95 lg:w-auto lg:px-2.5"
            >
              <Play className="h-4 w-4 fill-current" />
              <span className="hidden text-xs font-bold lg:inline">Practice</span>
            </button>
          )}

          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Song actions"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-white shadow-lg transition-colors hover:bg-zinc-900 active:scale-95 data-[state=open]:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 space-y-1 rounded-lg bg-zinc-950 p-2 text-zinc-400 shadow-2xl backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={() => router.push(`/songs?view=board&songId=${song.id}`)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white"
              >
                <Eye className="h-3.5 w-3.5" />
                Open in board
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => (onPlay ? onPlay() : router.push(`/timer/song/${song.id}`))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white"
              >
                <Play className="h-3 w-3 fill-current" />
                Practice
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  dispatch(toggleFavoriteSong({ songId: song.id, isFavorite: !isFavorite }))
                }
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isFavorite ? "text-rose-400 hover:bg-zinc-800" : "hover:bg-zinc-800 hover:text-white"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </DropdownMenuItem>
              <AddToPlaylistSub song={song} />

              <div className="my-1 h-px bg-white/5" />

              {(["wantToLearn", "learning", "learned"] as const).map((status) => {
                const meta = STATUS_META[status];
                const Icon = meta.icon;
                const isActive = status === userStatus;
                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onStatusChange?.(status)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-zinc-800/50 text-white" : "hover:bg-zinc-800 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                    <span className="flex-1">
                      {isActive ? meta.label : `Move to ${meta.label}`}
                    </span>
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                  </DropdownMenuItem>
                );
              })}

              {userStatus && (
                <>
                  <div className="my-1 h-px bg-white/5" />
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(undefined)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove from collection
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="relative z-10 flex flex-col pt-3">
        <TooltipProvider delayDuration={300}>
          <Tooltip open={isTitleTruncated && isTitleHovered} onOpenChange={setIsTitleHovered}>
            <TooltipTrigger asChild>
              <h3
                ref={titleRef}
                translate="no"
                className="w-full truncate text-base font-bold text-white"
              >
                {song.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] border-white/10 bg-zinc-900 text-xs font-bold text-zinc-200">
              {song.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <p translate="no" className="truncate text-sm font-medium tracking-wide text-zinc-300 mt-1">
          {song.artist}
        </p>

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {showPracticeStatus ? (
              practiceMs && practiceMs > 0 ? (
                <div className="flex items-center gap-1 text-zinc-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-semibold">{formatPracticeMs(practiceMs)}</span>
                </div>
              ) : (
                <span className="text-xs font-medium text-zinc-500">Not practiced</span>
              )
            ) : (
              <>
                {song.popularity !== undefined && song.popularity > 0 && (
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Users className="h-3 w-3" />
                    <span className="text-xs font-semibold">{song.popularity}</span>
                  </div>
                )}
                {song.genres && song.genres.length > 0 && (
                  <>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                    {song.genres.slice(0, 1).map(g => (
                      <span key={g} className="truncate capitalize text-xs font-medium text-zinc-400">
                        {g}
                      </span>
                    ))}
                  </>
                )}
              </>
            )}
            {/* Rated indicator (subtle, only when rated) */}
            {isRated && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="border-white/10 bg-zinc-900 text-xs font-bold text-zinc-200">
                    Rated by you
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Tier / difficulty badge */}
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
      </div>
    </div>
  );
};
