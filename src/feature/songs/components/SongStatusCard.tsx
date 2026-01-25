import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "assets/lib/utils";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { Button } from "assets/components/ui/button";

import { SortableSongItem } from "./SortableSongItem";

interface SongStatusCardProps {
  title: string;
  songs: Song[];
  droppableId: string;
  onStatusChange: (id: string, status: SongStatus, title: string, artist: string) => void;
  onSongRemove: (id: string) => void;
  isMobile: boolean;
  isDropTarget?: boolean;
  hideHeaderOnMobile?: boolean;
}

export const SongStatusCard = ({
  title,
  songs,
  droppableId,
  onStatusChange,
  onSongRemove,
  isMobile,
  isDropTarget,
  hideHeaderOnMobile,
}: SongStatusCardProps) => {
  const { t } = useTranslation("songs");
  const config = STATUS_CONFIG[droppableId as keyof typeof STATUS_CONFIG];
  const StatusIcon = config.icon;

  const { setNodeRef } = useDroppable({
    id: droppableId,
  });

  const getNextStatus = (current: string): SongStatus | undefined => {
    if (current === "wantToLearn") return "learning";
    if (current === "learning") return "learned";
    return undefined;
  };

  const getPrimaryActionText = (current: string) => {
    if (current === "wantToLearn") return t("start_learning");
    if (current === "learning") return t("mark_as_learned");
    return "";
  };

  const nextStatus = getNextStatus(droppableId);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-md">
      {/* Header */}
      {(!isMobile || !hideHeaderOnMobile) && (
        <div className={cn("flex items-center gap-3 border-b border-white/5 px-4 py-3", config.bgColor)}>
            <div className={cn("rounded-lg p-2 bg-black/20", config.color)}>
            <StatusIcon className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-2">
                <h3 className={cn("font-bold tracking-tight text-white")}>{title}</h3>
                <span className="text-xs font-medium text-zinc-500">
                {songs?.length || 0}
                </span>
            </div>
        </div>
      )}
      
      {/* Content Area - Droppable */}
      <div 
        ref={setNodeRef}
        className={cn(
          "flex min-h-[150px] flex-1 flex-col gap-3 p-2 transition-all duration-300",
          isDropTarget 
            ? cn("bg-white/5 ring-2 ring-inset transition-all duration-300", config.color.replace("text-", "ring-").replace("500", "500/50")) 
            : "bg-transparent ring-0"
        )}
      >
        <SortableContext 
          items={songs.map(s => s.id)} 
          strategy={verticalListSortingStrategy}
        >
          {songs?.length === 0 ? (
             <div className="flex flex-1 flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className={cn("mb-4 rounded-full p-4 text-zinc-500/50 bg-zinc-800/30", droppableId === "wantToLearn" && "text-zinc-600")}>
                   <StatusIcon className="h-8 w-8" />
                </div>
                
                {droppableId === "wantToLearn" && (
                  <>
                    <h4 className="text-sm font-bold text-zinc-200">You don’t have any songs here yet</h4>
                    <p className="mt-1 text-xs text-zinc-500">Add songs you want to learn next</p>
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <ArrowDown className="h-4 w-4 text-cyan-500 animate-bounce" />
                      <Link href="/songs?view=library">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 border-cyan-500/20 bg-cyan-500/5 px-4 font-bold text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40"
                        >
                          Browse song library
                        </Button>
                      </Link>
                    </div>
                  </>
                )}

                {droppableId === "learning" && (
                  <>
                    <h4 className="text-sm font-bold text-zinc-400">Time to practice!</h4>
                    <p className="mt-1 text-sm text-zinc-500 leading-relaxed max-w-[150px]">Drag songs from your want-to-learn list here to start tracking your progress.</p>
                  </>
                )}

                {droppableId === "learned" && (
                  <>
                    <h4 className="text-sm font-bold text-zinc-400">The hall of fame awaits</h4>
                    <p className="mt-1 text-sm text-zinc-500 leading-relaxed max-w-[150px]">Master your songs and move them here to celebrate your success.</p>
                  </>
                )}
             </div>
          ) : (
            songs?.map((song) => (
              <SortableSongItem
                key={song.id}
                song={song}
                config={config}
                isMobile={isMobile}
                droppableId={droppableId}
                nextStatus={nextStatus}
                getPrimaryActionText={getPrimaryActionText}
                onStatusChange={onStatusChange}
                onSongRemove={onSongRemove}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
