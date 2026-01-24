import { Button } from "assets/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "assets/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../assets/components/ui/alert-dialog";
import Avatar from "components/UI/Avatar"; 
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import type { Recording } from "feature/recordings/types/types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Heart, MessageSquare, Play, Trash2 } from "lucide-react";
import { useAppSelector } from "store/hooks";
import { cn } from "assets/lib/utils";

interface RecordingCardProps {
  recording: Recording;
  onView: (recordingId: string) => void;
}

export const RecordingCard = ({ recording, onView }: RecordingCardProps) => {
  const userId = useAppSelector(selectUserAuth);
  const { toggleLike, deleteRecording, isDeleting } = useRecordingMutations();

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(recording.videoUrl);
  const hasLiked = userId ? recording.likes.includes(userId) : false;
  const isOwner = userId === recording.userId;

  const handleLike = async () => {
      if (!userId) return;
      await toggleLike({ recordingId: recording.id, userId });
  };

  const handleDelete = async () => {
      if (!userId || !isOwner) return;
      await deleteRecording({ recordingId: recording.id, userId });
  };

  const formattedDate = new Date(
      (recording.createdAt as any)?.toDate 
      ? (recording.createdAt as any).toDate() 
      : recording.createdAt || new Date()
  ).toLocaleDateString();

  return (
    <Card className="bg-zinc-900/50 border-white/5 overflow-hidden flex flex-col h-full hover:border-white/10 transition-colors group/card">
      <div 
        className="aspect-video bg-black relative group cursor-pointer" 
        onClick={() => onView(recording.id)}
      >
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: videoId ? `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)` : undefined }}
            >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="rounded-full bg-white/10 p-4 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white fill-current" />
                    </div>
                </div>
            </div>
      </div>

      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
            <h3 
                className="font-bold text-lg text-white leading-tight line-clamp-2 cursor-pointer hover:text-cyan-400 transition-colors"
                onClick={() => onView(recording.id)}
            >
                {recording.title}
            </h3>
            {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 -mt-1 -mr-2 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-950 border-white/10 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        This action cannot be undone. This will permanently delete your recording.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-900 border-white/10 hover:bg-zinc-800 text-white">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        {(recording.songTitle || recording.songArtist) && (
             <div className="text-xs font-medium text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded inline-block">
                {recording.songArtist} - {recording.songTitle}
             </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
        <p className="text-zinc-400 text-sm line-clamp-3 mb-4">
            {recording.description}
        </p>
        
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
             <div className="transform scale-[0.85] origin-left">
                <Avatar 
                    avatarURL={recording.userAvatarUrl || undefined} 
                    name={recording.userDisplayName || "?"}
                    lvl={recording.userAvatarFrame}
                    size="sm"
                />
             </div>
             <span className="text-xs text-zinc-500 font-medium">
                {recording.userDisplayName} • {formattedDate}
             </span>
        </div>
      </CardContent>

      <CardFooter className="p-3 bg-white/5 flex items-center justify-between">
            <Button 
                variant="ghost" 
                size="sm" 
                className={cn("gap-1.5 hover:text-red-400", hasLiked && "text-red-500 hover:text-red-600")}
                onClick={handleLike}
            >
                <Heart className={cn("h-4 w-4", hasLiked && "fill-current")} />
                <span className="text-xs font-bold">{recording.likes.length}</span>
            </Button>

            <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5 hover:text-cyan-400"
                onClick={() => onView(recording.id)}
            >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs font-bold">{recording.commentCount}</span>
            </Button>
      </CardFooter>
    </Card>
  );
};
