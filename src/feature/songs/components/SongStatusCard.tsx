import { Card, CardContent, CardHeader, CardTitle } from "assets/components/ui/card";
import { ScrollArea } from "assets/components/ui/scroll-area";
import { Song, SongStatus } from "utils/firebase/client/firebase.types";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface SongStatusCardProps {
  title: string;
  songs: Song[];
  droppableId: SongStatus;
  onStatusChange: (songId: string, status: SongStatus | null, title: string, artist: string) => Promise<void>;
}

export const SongStatusCard = ({ title, songs, droppableId, onStatusChange }: SongStatusCardProps) => (
  <Card className="flex-1">
    <CardHeader>
      <CardTitle className="text-sm font-medium">
        {title} ({songs.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <ScrollArea 
            className={`h-32 p-2 rounded-md ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            <div className="space-y-2">
              {songs.map((song, index) => (
                <Draggable key={song.id} draggableId={song.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-2 rounded-md border bg-card flex justify-between items-center ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      <span className="text-sm">
                        {song.title} - {song.artist}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {(['wantToLearn', 'learning', 'learned'] as const).map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => onStatusChange(song.id, status, song.title, song.artist)}
                              className="cursor-pointer"
                            >
                              Move to {status}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => onStatusChange(song.id, null, song.title, song.artist)}
                            className="cursor-pointer text-destructive"
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </CardContent>
  </Card>
);
