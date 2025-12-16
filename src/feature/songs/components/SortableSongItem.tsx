import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "assets/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import { Song, SongStatus } from "feature/songs/types/songs.type";
import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";

interface SortableSongItemProps {
  song: Song;
  config: any; // Using the config type from SongStatusCard
  isMobile: boolean;
  nextStatus?: SongStatus;
  getPrimaryActionText: (status: string) => string;
  onStatusChange: (id: string, status: SongStatus, title: string, artist: string) => void;
  onSongRemove: (id: string) => void;
  droppableId: string;
}

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
  const StatusIcon = config.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id, data: { song, index: 0, containerId: droppableId } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : "auto",
    position: "relative" as const,
    opacity: isDragging ? 1 : 1, // Ensure visibility
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border border-white/5 bg-zinc-800/80 p-3 shadow-md transition-colors duration-200 hover:border-white/10 hover:bg-zinc-800 touch-none", // touch-none for dnd
        isDragging && "shadow-2xl ring-2 ring-cyan-500/50 z-[9999] bg-zinc-900 opacity-100 placeholder-shown:opacity-100" // active state
      )}
    >
      <div className="flex items-start gap-3 pr-8"> {/* Added pr-8 for menu space */}
        <StatusIcon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", config.color)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{song.title}</p>
          <p className="truncate text-xs text-zinc-400">{song.artist}</p>
        </div>
        <TierBadge song={song} />
      </div>

      {/* Mobile Actions */}
      {isMobile && nextStatus && (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(song.id, nextStatus, song.title, song.artist);
          }}
          className={cn("mt-2 h-8 w-full text-xs", config.bgColor, config.color)}
          onPointerDown={(e) => e.stopPropagation()} // Stop drag initiation
        >
          {getPrimaryActionText(droppableId)}
        </Button>
      )}

      {/* Desktop Menu */}
      {!isMobile && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full hover:bg-white/10"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()} // Stop drag initiation
              >
                <MoreVertical className="h-3 w-3 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800">
              {(["wantToLearn", "learning", "learned"] as const).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(song.id, status, song.title, song.artist)}
                  className="text-xs cursor-pointer gap-2"
                >
                  <div className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[status].color.replace("text-", "bg-"))} />
                  {STATUS_CONFIG[status].color === config.color ? "Current" : t(`status.${status}` as any)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => onSongRemove(song.id)}
                className="text-xs text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
