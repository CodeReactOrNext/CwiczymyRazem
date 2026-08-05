import { Dialog, DialogContent, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar/Avatar";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

import { getExerciseLeaderboard, type LeaderboardEntry } from "../services/bpmProgressService";

/** Gold / silver / bronze tint for the top 3 ranks — plain tinted bg + colored text, no border (Chip pattern). */
const RANK_BADGE_STYLES: Record<number, string> = {
  1: "bg-amber-400/15 text-amber-300",
  2: "bg-zinc-300/15 text-zinc-200",
  3: "bg-orange-600/15 text-orange-400",
};

const getRankBadgeStyle = (place: number, isCurrentUser: boolean) => {
  if (isCurrentUser) return "bg-cyan-500 text-black";
  return RANK_BADGE_STYLES[place] ?? "bg-zinc-800/60 text-zinc-400";
};

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
      <DialogContent className="max-w-xl bg-zinc-950 border-0 p-0 sm:rounded-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-8 pb-5 pr-14 sm:pr-16 shrink-0">
          <DialogHeader className="mb-0 text-left">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wide">Leaderboard</span>
              {entries.length > 0 && (
                <span className="text-[10px] font-semibold text-zinc-600 tabular-nums">
                  · {entries.length} {entries.length === 1 ? "player" : "players"}
                </span>
              )}
            </div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight text-left">
              {exerciseTitle}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-8 pb-8 min-h-0 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/40 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-zinc-800" />
                  <div className="w-10 h-10 rounded-full bg-zinc-800" />
                  <div className="flex-1 h-4 rounded bg-zinc-800" />
                  <div className="w-16 h-5 rounded bg-zinc-800" />
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
            <div className="flex flex-col gap-3">
              {entries.map((entry, index) => {
                const isCurrentUser = entry.userId === userAuth;
                const place = index + 1;

                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-all",
                      isCurrentUser
                        ? "bg-gradient-to-r from-cyan-900/20 via-zinc-900/60 to-cyan-900/20"
                        : "bg-zinc-900/40"
                    )}
                  >
                    {/* Rank Badge — gold/silver/bronze for top 3, cyan overrides for the current user */}
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      getRankBadgeStyle(place, isCurrentUser)
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
                    <span translate="no" className={cn(
                      "flex-1 min-w-0 text-sm font-bold truncate",
                      isCurrentUser ? "text-cyan-300" : "text-zinc-300"
                    )}>
                      {entry.displayName || "Anonymous"}
                    </span>

                    {/* Score */}
                    <span className={cn(
                      "shrink-0 text-lg font-bold tabular-nums",
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
