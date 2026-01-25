import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "assets/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight, GripVertical, MoreVertical, Play, Trash2 } from "lucide-react";
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

const PracticeButton = ({ songId, isMobile }: { songId: string; isMobile: boolean }) => (
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
        className="h-8 w-8 rounded-lg bg-cyan-600/10 text-cyan-500 hover:bg-cyan-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <Play className="h-4 w-4 fill-current" />
      </Button>
    )}
  </Link>
);

export const SortableSongItem = ({
  song,
  config,
  isMobile,
  nextStatus,
  getPrimaryActionText,
  onStatusChange,
  onSongRemove,
  droppableId,
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
    disabled: isMobile
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: sortableTransition,
    zIndex: isDragging ? 9999 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isMobile ? {} : attributes)}
      {...(isMobile ? {} : listeners)}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0c] p-3 shadow-sm click-behavior", 
        !isMobile ? "transition-all duration-300 touch-none hover:border-white/20 hover:bg-[#121211] hover:shadow-xl hover:shadow-black/40" : "select-none [WebkitTapHighlightColor:transparent]",
        isDragging && "shadow-2xl ring-2 ring-white/20 bg-[#161615] z-[9999] opacity-100 scale-105 rotate-1" 
      )}
    >
      {/* Dynamic Background Blur */}
      {song.coverUrl ? (
        <div 
          className="absolute inset-0 -z-10 opacity-[0.12] blur-3xl saturate-200"
          style={{ 
            backgroundImage: `url(${song.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      ) : (
        <div className={cn("absolute inset-0 -z-10 opacity-[0.05] blur-3xl saturate-200", config.bgColor)} />
      )}

      {/* Subtle Status Gradient Overlay */}
      <div className={cn("absolute inset-x-0 bottom-0 h-1/2 -z-10 bg-gradient-to-t opacity-[0.03]", config.color.replace("text-", "from-"))} />

      {/* Glassmorphism Depth Borders - subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      {/* Mobile Header & Action Row */}
      {isMobile ? (
        <div className="relative flex flex-col gap-4 py-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <SongCover song={song} config={config} size="md" />
              <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-white tracking-tight leading-none mb-1">{song.title}</p>
                  <p className="truncate text-xs font-medium text-zinc-400">{song.artist}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
               <TierBadge song={song} />
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900/95 border-white/10 backdrop-blur-xl p-1.5 shadow-2xl">
                  {droppableId !== "learned" && (
                    <DropdownMenuItem
                      onClick={() => router.push(`/timer/song/${song.id}`)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-cyan-400 focus:bg-cyan-500/10 focus:text-cyan-300 cursor-pointer rounded-lg mb-1"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Practice Song
                    </DropdownMenuItem>
                  )}
                  
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
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium cursor-pointer rounded-lg transition-colors",
                          isActive ? "bg-white/5 text-white" : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", statusConfig.color)} />
                        <span className="flex-1">
                          {isActive ? "Currently in " : "Move to "} {t(`status.${status}` as any)}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}

                  <div className="h-px bg-white/5 my-1" />

                  <DropdownMenuItem
                    onClick={() => onSongRemove(song.id)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove from list
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex gap-2">
            {droppableId !== "learned" && <PracticeButton songId={song.id} isMobile={true} />}
            
            {nextStatus && (
                <Button
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(song.id, nextStatus, song.title, song.artist);
                    }}
                    className="h-8 flex-1 bg-zinc-100 text-[11px] font-bold text-zinc-900 hover:bg-white active:scale-95 transition-all shadow-lg"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {getPrimaryActionText(droppableId)}
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4"> 
          <div className="hidden sm:flex text-zinc-600 opacity-60 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
               <GripVertical className="h-4 w-4" />
          </div>

          <SongCover song={song} config={config} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-zinc-100 leading-tight group-hover:text-white transition-colors">{song.title}</p>
            <p className="truncate text-xs font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">{song.artist}</p>
          </div>

          <div className="flex items-center gap-4">
            <TierBadge song={song} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900/95 border-white/10 backdrop-blur-xl p-1.5 shadow-2xl">
                {droppableId !== "learned" && (
                  <DropdownMenuItem
                    onClick={() => router.push(`/timer/song/${song.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-cyan-400 focus:bg-cyan-500/10 focus:text-cyan-300 cursor-pointer rounded-lg mb-1"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Practice Song
                  </DropdownMenuItem>
                )}
                
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
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium cursor-pointer rounded-lg transition-colors",
                        isActive ? "bg-white/5 text-white" : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", statusConfig.color)} />
                      <span className="flex-1">
                        {isActive ? "Currently in " : "Move to "} {t(`status.${status}` as any)}
                      </span>
                    </DropdownMenuItem>
                  );
                })}

                <div className="h-px bg-white/5 my-1" />

                <DropdownMenuItem
                  onClick={() => onSongRemove(song.id)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

    </div>
  );
};
