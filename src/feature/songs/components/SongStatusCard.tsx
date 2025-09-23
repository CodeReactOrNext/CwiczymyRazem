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
import { getSongTier } from "feature/songs/utils/getSongTier";
import { getAverageDifficulty } from "feature/songs/utils/getAvgRaiting";
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

const TierBadge = ({ song, t }: { song: Song; t: any }) => {
  const avgRating = getAverageDifficulty(song.difficulties);

  if (avgRating === 0) return null;

  const tier = getSongTier(avgRating);

  return (
    <div
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-sm text-xs font-bold",
        tier.bgColor,
        tier.borderColor,
        "border shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110"
      )}
      style={{
        color: tier.color,
        boxShadow: `0 1px 3px ${tier.color}20`,
      }}
      title={`${t(tier.description as any)} - ${avgRating.toFixed(1)}/10`}>
      {tier.tier}
    </div>
  );
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
    <div className='flex-1'>
      {/* Elegant Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className={cn("rounded-full p-2", config.lightBgColor)}>
            <StatusIcon className={cn("h-5 w-5", config.color)} />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white'>{title}</h3>
            <p className='text-sm text-slate-500'>
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
            "rounded-full px-3 py-1 text-sm font-medium",
            config.lightBgColor,
            config.color
          )}>
          {songs?.length}
        </div>
      </div>

      {/* Content Area */}
      <div>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              className={cn(
                "relative min-h-[300px] rounded-xl border-2 border-dashed p-4 transition-all duration-300",
                snapshot.isDraggingOver
                  ? "border-slate-400 bg-slate-500/15"
                  : "border-slate-600/30 bg-slate-800/20"
              )}
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                position: "relative",
                zIndex: snapshot.isDraggingOver ? 1000 : 0,
              }}>
              {songs?.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center space-y-3 text-center'>
                  <StatusIcon
                    className={cn("h-12 w-12 opacity-40", config.color)}
                  />
                  <div>
                    <p className='text-slate-400'>
                      {snapshot.isDraggingOver ? "Upuść tutaj" : "Brak utworów"}
                    </p>
                    {!isLanding && !snapshot.isDraggingOver && (
                      <p className='mt-1 text-xs text-slate-600'>
                        Przeciągnij utwory lub użyj przycisków
                      </p>
                    )}
                  </div>
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
                            "rounded-lg border p-3 transition-all duration-200",
                            snapshot.isDragging
                              ? "border-slate-400 bg-slate-500/30 shadow-2xl shadow-slate-500/60 ring-2 ring-slate-400/50 backdrop-blur-sm"
                              : "border-transparent bg-slate-800/60 hover:bg-slate-700/80"
                          )}
                          style={{
                            transform: snapshot.isDragging
                              ? "rotate(3deg) scale(1.1)"
                              : undefined,
                            zIndex: snapshot.isDragging ? 9999 : "auto",
                            position: snapshot.isDragging ? "fixed" : undefined,
                            opacity: snapshot.isDragging ? 0.95 : 1,
                            pointerEvents: snapshot.isDragging
                              ? "none"
                              : "auto",
                            ...provided.draggableProps.style,
                          }}>
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
                            <div className='flex-1 overflow-hidden'>
                              <div className='flex items-center gap-2'>
                                <p
                                  className={cn(
                                    "truncate text-sm font-medium transition-colors",
                                    snapshot.isDragging
                                      ? "text-slate-100"
                                      : "text-white"
                                  )}>
                                  {song.title}
                                </p>
                                <div className='flex items-center gap-1'>
                                  <TierBadge song={song} t={t} />
                                  {getAverageDifficulty(song.difficulties) >
                                    0 && (
                                    <span className='text-xs font-medium text-slate-500'>
                                      {getAverageDifficulty(
                                        song.difficulties
                                      ).toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p
                                className={cn(
                                  "truncate text-xs transition-colors",
                                  snapshot.isDragging
                                    ? "text-slate-300"
                                    : "text-slate-400"
                                )}>
                                {song.artist}
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions - visible on hover */}
                          <div className='flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                            {droppableId !== "wantToLearn" && (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(
                                    song.id,
                                    "wantToLearn",
                                    song.title,
                                    song.artist
                                  );
                                }}
                                className='h-6 w-6 p-0 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                                title='Chcę się nauczyć'>
                                <Music className='h-3 w-3' />
                              </Button>
                            )}
                            {droppableId !== "learning" && (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(
                                    song.id,
                                    "learning",
                                    song.title,
                                    song.artist
                                  );
                                }}
                                className='h-6 w-6 p-0 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300'
                                title='Uczę się'>
                                <BookOpen className='h-3 w-3' />
                              </Button>
                            )}
                            {droppableId !== "learned" && (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(
                                    song.id,
                                    "learned",
                                    song.title,
                                    song.artist
                                  );
                                }}
                                className='h-6 w-6 p-0 text-green-400 hover:bg-green-500/20 hover:text-green-300'
                                title='Nauczone'>
                                <CheckCircle className='h-3 w-3' />
                              </Button>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className='ml-2 opacity-0 transition-all duration-200 focus:outline-none group-hover:opacity-100 hover:scale-110'>
                              <div className='rounded-lg p-2 transition-colors hover:bg-slate-600/30'>
                                <MoreVertical className='h-4 w-4 text-slate-400' />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='border-slate-600/50 bg-slate-800/95 backdrop-blur-xl'>
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
                                  className='flex cursor-pointer items-center gap-3 py-2 text-sm hover:bg-slate-700/50'>
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
                                className='cursor-pointer py-2 text-sm text-red-400 hover:bg-red-500/15'>
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
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
};
