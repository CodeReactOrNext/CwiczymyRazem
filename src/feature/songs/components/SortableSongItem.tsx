import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Button } from "assets/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight, Clock, FileMusic, GripVertical, MoreVertical, Music, Play, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

interface SortableSongItemProps {
  song: Song;
  config: any;
  isMobile: boolean;
  nextStatus?: SongStatus;
  getPrimaryActionText: (status: string) => string;
  onStatusChange: (id: string, status: SongStatus, title: string, artist: string) => void;
  onSongRemove: (id: string) => void;
  droppableId: string;
  progress?: UserSongProgress | null;
  isPremium?: boolean;
  onPracticeWithGp?: (song: Song) => void;
  onOpenDetails?: (song: Song) => void;
  disableDnd?: boolean;
  isDragActive?: boolean;
}

function formatPracticeMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

const SongCover = ({ song, config, size = "sm" }: { song: Song; config: any; size?: "sm" | "md" }) => {
  const StatusIcon = config.icon;
  const dimensions = size === "md" ? "h-14 w-14" : "h-10 w-10";
  const iconSize = size === "md" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div className={cn(
      "relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/60 shadow-inner",
      dimensions
    )}>
      {song.coverUrl ? (
        <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-800/50">
          <StatusIcon className={cn(iconSize, "opacity-40", config.color)} />
        </div>
      )}
    </div>
  );
};

const GpPracticeButton = ({
  songId,
  song,
  isMobile,
  isPremium,
  onPracticeWithGp,
}: {
  songId: string;
  song: Song;
  isMobile: boolean;
  isPremium: boolean;
  onPracticeWithGp?: (song: Song) => void;
}) => {
  if (onPracticeWithGp) {
    return (
      <button
        className={isMobile ? "flex-1" : ""}
        onClick={(e) => { e.stopPropagation(); onPracticeWithGp(song); }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isMobile ? (
          <Button
            size="sm"
            className="h-8 w-full bg-cyan-600 text-[11px] font-bold text-white hover:bg-cyan-500 active:scale-95 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Play className="mr-1.5 h-3 w-3 fill-current" />
            Practice
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-7 w-7 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
          </Button>
        )}
      </button>
    );
  }

  return (
    <Link
      href={`/timer/song/${songId}`}
      className={isMobile ? "flex-1" : ""}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {isMobile ? (
        <Button
          size="sm"
          className="h-8 w-full bg-cyan-600 text-[11px] font-bold text-white hover:bg-cyan-500 active:scale-95 transition-all shadow-lg shadow-cyan-500/10"
        >
          <Play className="mr-1.5 h-3 w-3 fill-current" />
          Practice
        </Button>
      ) : (
        <Button
          size="icon"
          className="h-8 w-8 rounded-lg bg-cyan-600/10 text-cyan-500 hover:bg-cyan-600 hover:text-white transition-all"
        >
          <Play className="h-4 w-4 fill-current" />
        </Button>
      )}
    </Link>
  );
};

const PracticeTimeBadge = ({ progress }: { progress: UserSongProgress | null | undefined }) => {
  const timeMs = progress?.totalPracticeMs ?? 0;
  
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
        <Clock className="h-3 w-3" />
        <span>{formatPracticeMs(timeMs)} practiced</span>
      </div>
      
      {progress?.bestAccuracy !== null && progress?.bestAccuracy !== undefined && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500/80">
          <Target className="h-3 w-3" />
          <span>{progress.bestAccuracy}% accuracy</span>
        </div>
      )}
    </div>
  );
};

const SongMasteryProgress = ({ progress, totalSections }: { progress: number; totalSections?: number }) => {
  if (totalSections === undefined || totalSections === 0) return null;
  
  return (
    <div className="mt-2.5 space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-zinc-500">Mastery</span>
        <span className="text-cyan-400 font-black">{progress}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800/50">
        <div
          className="h-full bg-cyan-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          style={{ width: `${Math.max(2, progress)}%` }}
        />
      </div>
    </div>
  );
};

export const SortableSongItem = ({
  song,
  config,
  isMobile,
  nextStatus,
  getPrimaryActionText,
  onStatusChange,
  onSongRemove,
  droppableId,
  progress,
  isPremium = false,
  onPracticeWithGp,
  onOpenDetails,
  disableDnd = false,
  isDragActive = false,
}: SortableSongItemProps) => {
  const { t } = useTranslation("songs");
  const router = useRouter();
  const _StatusIcon = config.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortableTransition,
    isDragging,
  } = useSortable({
    id: song.id,
    data: { song, index: 0, containerId: droppableId },
    disabled: isMobile || disableDnd
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: sortableTransition,
    zIndex: isDragging ? 9999 : "auto",
    position: "relative" as const,
  };

  // framer-motion never touches `opacity` here: the drag-hidden state is driven by
  // the `opacity-0` class below, and dnd-kit's drop animation also pokes inline opacity.
  // If framer fought over it too, a just-dropped card could get stuck at opacity:0.
  // So framer only animates height (smooth collapse/expand). During an active drag we
  // disable it entirely (no exit) so the source list doesn't collapse and desync dnd-kit.
  const motionProps = isDragActive
    ? {}
    : {
        initial: { height: 0 },
        animate: { height: "auto" as const },
        exit: { height: 0 },
        transition: { duration: 0.2, ease: "easeOut" as const },
      };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...motionProps}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors select-none overflow-hidden",
        isMobile ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        (!disableDnd && !isMobile) && "touch-none",
        isDragging ? "opacity-0" : "hover:bg-zinc-800/60 active:bg-zinc-800",
      )}
    >
      {/* Cover */}
      <div
        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-zinc-800 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onOpenDetails?.(song); }}
      >
        {song.coverUrl ? (
          <img src={song.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900/50">
            <Music className={cn("h-4 w-4 opacity-40", config.color)} />
          </div>
        )}
      </div>

      {/* Song Title & Info */}
      <div 
        className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onOpenDetails?.(song); }}
      >
        <span 
          translate="no" 
          className={cn(
            "truncate text-sm font-medium transition-colors",
            isDragging ? "text-white" : "text-zinc-300 group-hover:text-white"
          )}
        >
          {song.title}
        </span>
      </div>

      {/* Tier & Actions (Subtle) */}
      <div className="flex items-center gap-2 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-950 backdrop-blur-xl p-2 shadow-2xl text-zinc-400 rounded-lg space-y-1">
             <DropdownMenuItem
                    onClick={() => onPracticeWithGp ? onPracticeWithGp(song) : router.push(`/timer/song/${song.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 hover:text-white cursor-pointer rounded-lg"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Practice
                  </DropdownMenuItem>
                  <div className="h-px bg-white/5 my-1" />
                  {(["wantToLearn", "learning", "learned"] as const).map((status) => {
                    const statusConfig = STATUS_CONFIG[status];
                    const Icon = statusConfig.icon;
                    const isActive = status === droppableId;
                    return (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => onStatusChange(song.id, status, song.title, song.artist)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-colors",
                          isActive ? "bg-zinc-800/50 text-white" : "hover:bg-zinc-800 hover:text-white"
                        )}
                      >
                        <Icon className="h-3 w-3 text-zinc-400" />
                        <span className="flex-1">
                          Move to {t(`status.${status}` as any)}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                  <div className="h-px bg-white/5 my-1" />
                  <DropdownMenuItem
                    onClick={() => onSongRemove(song.id)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer rounded-lg"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
