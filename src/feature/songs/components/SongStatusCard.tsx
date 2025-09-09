import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { ScrollArea } from "assets/components/ui/scroll-area";
import { cn } from "assets/lib/utils";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  MoreVertical,
  Music,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STATUS_CONFIG = {
  wantToLearn: {
    icon: Music,
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    lightBgColor: "bg-blue-500/10",
  },
  learning: {
    icon: BookOpen,
    color: "text-amber-400",
    bgColor: "bg-amber-900/20",
    lightBgColor: "bg-amber-500/10",
  },
  learned: {
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-900/20",
    lightBgColor: "bg-green-500/10",
  },
};

interface SongStatusCardProps {
  title: string;
  isLanding: boolean;
  songs: Song[];
  droppableId: SongStatus;
  onStatusChange: (
    songId: string,
    newStatus: SongStatus,
    title: string,
    artist: string
  ) => Promise<void>;
  onSongRemove: (songId: string) => Promise<void>;
}

export const SongStatusCard = ({
  title,
  songs,
  droppableId,
  isLanding,
  onStatusChange,
  onSongRemove,
}: SongStatusCardProps) => {
  const { t } = useTranslation(["songs", "common"]);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  const config = STATUS_CONFIG[droppableId as keyof typeof STATUS_CONFIG];
  const StatusIcon = config?.icon || Music;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Card className='flex-1 overflow-hidden border-zinc-700/30 bg-zinc-900/5 backdrop-blur-sm transition-all duration-300 hover:border-zinc-600/50 hover:shadow-lg'>
      <CardHeader className='border-b border-zinc-700/30 bg-zinc-800/10 p-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className={cn("rounded-lg p-3 shadow-lg transition-transform duration-300 hover:scale-110", config.bgColor)}>
              <StatusIcon className={cn("h-6 w-6", config.color)} />
            </div>
            <div>
              <CardTitle className='text-lg font-bold text-white'>
                {title}
              </CardTitle>
              <p className='text-sm text-zinc-400'>
                {songs?.length === 0
                  ? "Brak utworów"
                  : `${songs?.length} ${
                      songs?.length === 1 ? "utwór" : "utworów"
                    }`}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-bold shadow-lg transition-all duration-300 hover:scale-110",
              config.color,
              config.lightBgColor
            )}
            style={{ borderColor: config.color.replace("text-", "") }}>
            <span>{songs?.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-5'>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <ScrollArea
              className={cn(
                "h-64 rounded-lg border border-zinc-700/20 bg-zinc-800/5 p-4 transition-all duration-300",
                snapshot.isDraggingOver &&
                  "border-2 border-dashed border-cyan-400/50 bg-cyan-500/5 shadow-lg shadow-cyan-500/10"
              )}
              {...provided.droppableProps}
              ref={provided.innerRef}>
              {songs?.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center space-y-4 p-6 text-center'>
                  <div className={cn("rounded-full p-4 shadow-lg", config.lightBgColor)}>
                    <StatusIcon className={cn("h-8 w-8", config.color)} />
                  </div>
                  <div>
                    <p className='text-base font-medium text-zinc-300'>
                      Brak utworów
                    </p>
                    {!isLanding && (
                      <p className='mt-2 max-w-[200px] text-sm text-zinc-500'>
                        Przeciągnij utwory tutaj aby zmienić ich status
                      </p>
                    )}
                  </div>
                  {snapshot.isDraggingOver && (
                    <div className='absolute inset-0 rounded-lg bg-cyan-500/10 backdrop-blur-sm'>
                      <div className='flex h-full items-center justify-center'>
                        <p className='text-lg font-semibold text-cyan-300'>
                          Upuść tutaj
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='space-y-3'>
                  {songs?.map((song, index) => (
                    <Draggable
                      key={song.id}
                      draggableId={song.id}
                      isDragDisabled={isMobile}
                      index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "group flex items-center justify-between",
                            "rounded-lg border border-zinc-700/30 bg-zinc-800/20 p-3 transition-all duration-200",
                            "hover:border-zinc-600/50 hover:bg-zinc-700/30 hover:shadow-md",
                            snapshot.isDragging &&
                              "scale-105 border-cyan-400/50 bg-cyan-500/10 shadow-xl shadow-cyan-500/20 rotate-2"
                          )}>
                          <div className='flex flex-1 items-center gap-3 overflow-hidden'>
                            <div
                              className={cn(
                                "h-3 w-1.5 flex-shrink-0 rounded-full shadow-sm",
                                config.bgColor
                              )}
                              style={{
                                backgroundColor: config.color.replace(
                                  "text-",
                                  ""
                                ),
                              }}
                            />
                            <div className='overflow-hidden'>
                              <p className='truncate text-sm font-medium text-white'>
                                {song.title}
                              </p>
                              <p className='truncate text-xs text-zinc-400'>
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className='ml-2 opacity-0 transition-all duration-200 focus:outline-none group-hover:opacity-100 hover:scale-110'>
                              <div className='rounded-lg p-2 transition-colors hover:bg-zinc-600/30'>
                                <MoreVertical className='h-4 w-4 text-zinc-400' />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='border-zinc-600/50 bg-zinc-800/95 backdrop-blur-xl'>
                              {(
                                ["wantToLearn", "learning", "learned"] as const
                              ).map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() =>
                                    onStatusChange(
                                      song.id,
                                      status,
                                      song.title,
                                      song.artist
                                    )
                                  }
                                  className='flex cursor-pointer items-center gap-3 py-2 text-sm hover:bg-zinc-700/50'>
                                  <ArrowRight className='h-4 w-4' />
                                  <span>Przenieś do:</span>
                                  <span
                                    className={cn(
                                      "font-medium",
                                      STATUS_CONFIG[status].color
                                    )}>
                                    {t(`songs:status.${status}`)}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                onClick={() => onSongRemove(song.id)}
                                className='cursor-pointer py-2 text-sm text-red-400 hover:bg-red-500/10'>
                                Usuń utwór
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
              {provided.placeholder}
            </ScrollArea>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
};
