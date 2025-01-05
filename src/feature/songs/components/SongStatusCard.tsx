import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { ScrollArea } from "assets/components/ui/scroll-area";
import { Song, SongStatus } from "utils/firebase/client/firebase.types";

export const SongStatusCard = ({
  title,
  songs,
  onStatusChange,
  artist,
}: {
  title: string;
  songs: Song[];
  artist: Song;
  onStatusChange: (
    songId: string,
    status: SongStatus | null,
    title: string,
    artist: string
  ) => Promise<void>;
}) => (
  <Card className='flex-1'>
    <CardHeader>
      <CardTitle className='text-sm font-medium'>
        {title} ({songs.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ScrollArea className='h-32'>
        <div className='space-y-2'>
          {songs.map((song) => (
            <div
              key={song.id}
              className='flex items-center justify-between text-sm'>
              <span>
                {song.title} - {song.artist}
              </span>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0'
                onClick={() => onStatusChange(song.id, null, title, artist)}>
                ×
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
);
