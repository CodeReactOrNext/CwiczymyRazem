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
    <Card className='flex-1'>
      <CardHeader className='border-b pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <div className={cn("mr-3 rounded-md p-2", config.bgColor)}>
              <StatusIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <CardTitle className='text-base font-semibold tracking-wide'>
              {title}
            </CardTitle>
          </div>
          <Badge
            className={cn(
              "font-mono ml-auto px-2.5 py-1",
              config.color,
              config.lightBgColor,
              "border-0"
            )}>
            {songs?.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='p-3'>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <ScrollArea
              className={cn(
                "h-52 rounded-md p-2",
                snapshot.isDraggingOver && "border border-dashed bg-muted/30"
              )}
              {...provided.droppableProps}
              ref={provided.innerRef}>
              {songs?.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center space-y-3 p-4 text-center'>
                  <StatusIcon
                    className={cn("h-8 w-8 opacity-60", config.color)}
                  />
                  <p className='text-sm text-muted-foreground'>
                    {t("songs:no_songs_in_status", { status: title })}
                  </p>
                  {isLanding && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='mt-1 h-auto px-3 py-1 text-xs'
                      onClick={() => router.push("songs")}>
                      {t("common:song_status.add")}
                    </Button>
                  )}
                  {!isLanding && (
                    <p className='max-w-[200px] text-xs text-muted-foreground/70'>
                      {t("no_songs_in_status_desc" as any)}
                    </p>
                  )}
                </div>
              ) : (
                <div className='space-y-2.5'>
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
                            "flex items-center justify-between",
                            "rounded-md border p-2.5",
                            "transition-all duration-200",
                            snapshot.isDragging && "shadow-lg"
                          )}>
                          <div className='flex items-center gap-2 overflow-hidden'>
                            <div
                              className={cn(
                                "w-1 self-stretch rounded-full",
                                config.bgColor
                              )}
                            />
                            <span className='truncate text-sm leading-tight'>
                              <span className='font-medium capitalize'>
                                {song.artist}
                              </span>
                              <span className='mx-1 opacity-60'>-</span>
                              <span className='capitalize'>{song.title}</span>
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className='ml-1.5 focus:outline-none'>
                              <div className='rounded-full p-1.5 transition-colors hover:bg-muted/30'>
                                <MoreVertical className='h-3.5 w-3.5' />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
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
                                  className='flex cursor-pointer items-center gap-2 py-1.5 text-sm'>
                                  <ArrowRight className='h-3 w-3' />
                                  {t("common:song_status.move_to")}{" "}
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
                                className='cursor-pointer py-1.5 text-sm text-destructive'>
                                {t("common:song_status.remove")}
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
