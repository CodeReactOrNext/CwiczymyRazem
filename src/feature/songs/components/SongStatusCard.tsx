import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { ScrollArea } from "assets/components/ui/scroll-area";
import { Song, SongStatus } from "utils/firebase/client/firebase.types";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { MoreVertical, Music } from "lucide-react";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { Button } from "assets/components/ui/button";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
  const userId = useAppSelector(selectUserAuth);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Check on initial render
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Card className='flex-1 '>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>
          {title} ({songs?.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <ScrollArea
              className={`h-48 rounded-md p-2 ${
                snapshot.isDraggingOver ? "bg-muted/50" : ""
              }`}
              {...provided.droppableProps}
              ref={provided.innerRef}>
              {songs?.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center space-y-2 p-4 text-center'>
                  <Music className='h-5 w-5  text-muted-foreground' />
                  <p className=' text-sm '>
                    {t("songs:no_songs_in_status", { status: title })}
                  </p>
                  {isLanding && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => router.push("songs")}>
                      {t("common:song_status.add")}
                    </Button>
                  )}
                  {!isLanding && (
                    <p className='text-sm text-muted-foreground'>
                      {t("no_songs_in_status_desc" as any)}
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
                          className={`flex items-center justify-between rounded-md border bg-card bg-second-700  p-2 ${
                            snapshot.isDragging ? "shadow-lg" : ""
                          }`}>
                          <span className='text-sm '>
                            <span className='capitalize'>{song.artist}</span> -{" "}
                            <span className='capitalize'>{song.title}</span>
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger className='focus:outline-none'>
                              <MoreVertical className='h-4 w-4' />
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
                                  className='cursor-pointer'>
                                  {t("common:song_status.move_to")}{" "}
                                  {t(`songs:status.${status}`)}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                onClick={() => onSongRemove(song.id)}
                                className='cursor-pointer text-destructive'>
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
