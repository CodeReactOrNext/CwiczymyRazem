import { Dialog, DialogContent, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar/Avatar";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

import { getExerciseLeaderboard, type LeaderboardEntry } from "../services/bpmProgressService";

interface EarTrainingLeaderboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseTitle: string;
}

export const EarTrainingLeaderboardDialog = ({
  isOpen,
  onClose,
  exerciseId,
  exerciseTitle,
}: EarTrainingLeaderboardDialogProps) => {
  const userAuth = useAppSelector(selectUserAuth);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getExerciseLeaderboard(exerciseId).then((data) => {
      setEntries(data);
      setIsLoading(false);
    });
  }, [isOpen, exerciseId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0a0a0a] border-zinc-900 p-0 sm:rounded-xl shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wide">Leaderboard</span>
            </div>
            <DialogTitle className="text-lg font-bold text-white tracking-tight text-left">
              {exerciseTitle}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-zinc-800" />
                  <div className="w-8 h-8 rounded-full bg-zinc-800" />
                  <div className="flex-1 h-4 rounded bg-zinc-800" />
                  <div className="w-12 h-4 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Trophy size={32} className="mb-4 opacity-10" />
              <p className="text-sm font-semibold text-zinc-500">No scores yet</p>
              <p className="text-xs text-zinc-700 mt-1">Be the first to set a record!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, index) => {
                const isCurrentUser = entry.userId === userAuth;
                const place = index + 1;

                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      isCurrentUser
                        ? "bg-gradient-to-r from-cyan-900/20 via-zinc-900/60 to-cyan-900/20 border-cyan-500/20"
                        : "bg-zinc-900/40 border-zinc-800/50"
                    )}
                  >
                    {/* Rank Badge */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      isCurrentUser
                        ? "bg-cyan-500 text-black"
                        : place <= 3
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-zinc-800/60 text-zinc-400"
                    )}>
                      {place}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar
                        avatarURL={entry.avatar}
                        name={entry.displayName || "Player"}
                        size="sm"
                      />
                    </div>

                    {/* Name */}
                    <span className={cn(
                      "flex-1 text-sm font-bold truncate",
                      isCurrentUser ? "text-cyan-300" : "text-zinc-300"
                    )}>
                      {entry.displayName || "Anonymous"}
                    </span>

                    {/* Score */}
                    <span className={cn(
                      "text-lg font-bold tabular-nums",
                      isCurrentUser ? "text-cyan-400" : "text-white"
                    )}>
                      {entry.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
