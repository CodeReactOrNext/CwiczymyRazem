import Avatar from "components/UI/Avatar"; // Correct import
import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { useRecordingMutations } from "feature/recordings/hooks/useRecordingMutations";
import { getComments } from "feature/recordings/services/comments.service"; 
import { selectUserAuth } from "feature/user/store/userSlice";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "store/hooks";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string | null;
}

export const CommentsModal = ({ isOpen, onClose, recordingId }: CommentsModalProps) => {
  const [newComment, setNewComment] = useState("");
  const userId = useAppSelector(selectUserAuth);
  const { addComment, isAddingComment } = useRecordingMutations();

  const { data: comments, isLoading, refetch } = useQuery({
      queryKey: ["comments", recordingId],
      queryFn: () => recordingId ? getComments(recordingId) : [],
      enabled: !!recordingId && isOpen,
  });

   useEffect(() => {
       if (isOpen && recordingId) refetch();
   }, [isOpen, recordingId, refetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !recordingId || !userId) return;

    await addComment({ recordingId, userId, content: newComment });
    setNewComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-950 border-white/5 text-white flex flex-col h-full sm:h-[80vh] sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            Comments
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 p-1">
          {isLoading ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-500" /></div>
          ) : comments?.length === 0 ? (
             <div className="text-center text-zinc-500 py-8 italic">No comments yet. Be the first!</div>
          ) : (
             comments?.map((comment) => {
                const formattedDate = new Date(
                    (comment.createdAt as any)?.toDate 
                    ? (comment.createdAt as any).toDate() 
                    : comment.createdAt || new Date()
                ).toLocaleDateString();

                return (
                    <div key={comment.id} className="flex gap-3">
                    <div className="transform scale-[0.85] origin-top mt-1">
                         <Avatar 
                            avatarURL={comment.userAvatarUrl || undefined} 
                            name={comment.userName || "?"}
                            lvl={comment.userAvatarFrame}
                            size="sm"
                        />
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-3 flex-1 border border-white/5">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-sm text-cyan-400">{comment.userName}</span>
                            <span className="text-[10px] text-zinc-500">
                                {formattedDate}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    </div>
                );
             })
          )}
        </div>

        <div className="pt-4 border-t border-white/5">
           <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="bg-zinc-900 border-white/10 flex-1"
                disabled={isAddingComment}
              />
              <Button type="submit" size="icon" disabled={!newComment.trim() || isAddingComment} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  {isAddingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
           </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
