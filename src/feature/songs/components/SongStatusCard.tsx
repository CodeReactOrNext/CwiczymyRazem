import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SortableSongItem } from "./SortableSongItem";

interface SongStatusCardProps {
  title: string;
  songs: Song[];
  onOpenDetails?: (song: Song) => void;
  id: string;
  activeOverContainer?: string | null;
  onStatusChange?: (songId: string, newStatus: SongStatus, title: string, artist: string) => void;
  onSongRemove?: (songId: string) => void;
  isMobile?: boolean;
  isDropTarget?: boolean;
  hideHeaderOnMobile?: boolean;
  progressMap?: Record<string, UserSongProgress>;
  isPremium?: boolean;
  onPracticeWithGp?: (song: Song) => void;
  isCollapsedInitially?: boolean;
  disableDnd?: boolean;
}

export const SongStatusCard = ({
  title,
  songs,
  id,
  onStatusChange,
  onSongRemove,
  isMobile,
  isDropTarget,
  hideHeaderOnMobile,
  progressMap = {},
  isPremium = false,
  onPracticeWithGp,
  onOpenDetails,
  activeOverContainer,
  disableDnd = false,
}: SongStatusCardProps) => {
  const { t } = useTranslation("songs");
  const config = STATUS_CONFIG[id as keyof typeof STATUS_CONFIG];
  const StatusIcon = config.icon;

  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const isLibraryDropTarget = isOver || activeOverContainer === id;

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

  const nextStatus = getNextStatus(id);

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col overflow-hidden bg-transparent">
      {/* Header (Steam Style) */}
      {(!isMobile || !hideHeaderOnMobile) && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 px-3 py-1.5 text-zinc-500 group/header cursor-pointer select-none w-full bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors rounded-md mb-1"
        >
            <ChevronDown 
              size={10} 
              className={cn(
                "transition-transform duration-300 opacity-40",
                isCollapsed ? "-rotate-90" : "rotate-0"
              )} 
            />
            <h3 className="text-xs font-bold uppercase tracking-wider transition-colors group-hover/header:text-zinc-300">{title}</h3>
            <span className="text-xs font-medium opacity-60">
              ({songs?.length || 0})
            </span>
        </button>
      )}
      
      {/* Content Area - Droppable */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div 
              ref={setNodeRef}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900/10 transition-all duration-300",
                isLibraryDropTarget && "ring-2 ring-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
                isDropTarget && "scale-[1.02] border-cyan-500/30 bg-cyan-500/5"
              )}
            >
              {/* Premium Gradient Background for Drop Highlight */}
              <AnimatePresence>
                {isLibraryDropTarget && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none"
                  />
                )}
              </AnimatePresence>
              <SortableContext
                items={songs.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {songs?.length === 0 ? (
                  <div className="py-2 px-6 text-[10px] text-zinc-600 font-medium italic opacity-60">
                      {id === "wantToLearn" && "No songs to learn"}
                      {id === "learning" && "No active tracks"}
                      {id === "learned" && "Nothing mastered yet"}
                  </div>
                ) : (
                  songs?.map((song) => (
                    <SortableSongItem
                      key={song.id}
                      song={song}
                      config={config}
                      isMobile={isMobile ?? false}
                      droppableId={id}
                      nextStatus={nextStatus}
                      getPrimaryActionText={getPrimaryActionText}
                      onStatusChange={onStatusChange || (() => {})}
                      onSongRemove={onSongRemove || (() => {})}
                      progress={progressMap?.[song.id] ?? null}
                      isPremium={isPremium}
                      onPracticeWithGp={onPracticeWithGp}
                      onOpenDetails={onOpenDetails}
                      disableDnd={disableDnd}
                    />
                  ))
                )}
              </SortableContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* If collapsed, still need a drop target? */}
      {isCollapsed && (
        <div ref={setNodeRef} className="h-2" />
      )}
    </div>
  );
};
