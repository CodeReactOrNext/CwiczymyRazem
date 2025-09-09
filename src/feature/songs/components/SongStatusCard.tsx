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
    <Card className='flex-1 overflow-hidden border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm'>
      <CardHeader className='border-b border-zinc-700/30 bg-zinc-800/20 p-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className={cn("rounded-md p-2", config.bgColor)}>
              <StatusIcon className={cn("h-4 w-4", config.color)} />
            </div>
            <div>
              <CardTitle className='text-sm font-bold text-white'>
                {title}
              </CardTitle>
              <p className='text-xs text-zinc-500'>
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
              "flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold",
              config.color,
              config.lightBgColor
            )}
            style={{ borderColor: config.color.replace("text-", "") }}>
            <span>{songs?.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-3'>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <ScrollArea
              className={cn(
                "h-40 rounded-md border border-zinc-700/20 bg-zinc-800/5 p-2",
                snapshot.isDraggingOver &&
                  "border-2 border-dashed border-cyan-400/50 bg-cyan-500/5"
              )}
              {...provided.droppableProps}
              ref={provided.innerRef}>
              {songs?.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center space-y-2 p-3 text-center'>
                  <div className={cn("rounded-full p-2", config.lightBgColor)}>
                    <StatusIcon className={cn("h-6 w-6", config.color)} />
                  </div>
                  <div>
                    <p className='text-xs font-medium text-zinc-400'>
                      Brak utworów
                    </p>
                  </div>
                  {!isLanding && (
                    <p className='max-w-[150px] text-xs text-zinc-600'>
                      Przeciągnij tutaj
                    </p>
                  )}
                </div>
              ) : (
                <div className='space-y-2'>
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
                            "rounded-md border border-zinc-700/30 bg-zinc-800/20 p-2",
                            "transition-all duration-200 hover:border-zinc-600/50 hover:bg-zinc-700/30",
                            snapshot.isDragging &&
                              "scale-105 border-cyan-400/50 bg-cyan-500/10 shadow-lg"
                          )}>
                          <div className='flex flex-1 items-center gap-2 overflow-hidden'>
                            <div
                              className={cn(
                                "h-2 w-1 flex-shrink-0 rounded-full",
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
                              <p className='truncate text-xs font-medium text-white'>
                                {song.title}
                              </p>
                              <p className='truncate text-xs text-zinc-500'>
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className='ml-1 opacity-0 transition-opacity focus:outline-none group-hover:opacity-100'>
                              <div className='rounded p-1 transition-colors hover:bg-zinc-600/30'>
                                <MoreVertical className='h-3 w-3 text-zinc-500' />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='border-zinc-600/50 bg-zinc-800/90 backdrop-blur-xl'>
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
                                  className='flex cursor-pointer items-center gap-2 py-1.5 text-xs hover:bg-zinc-700/50'>
                                  <ArrowRight className='h-3 w-3' />
                                  <span>Do:</span>
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
                                className='cursor-pointer py-1.5 text-xs text-red-400 hover:bg-red-500/10'>
                                Usuń
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
