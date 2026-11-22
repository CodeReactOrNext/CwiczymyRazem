import { Dialog, DialogContent, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { Skeleton } from "assets/components/ui/skeleton";
import { EmptyState } from "components/EmptyState/EmptyState";
import { RankRow } from "feature/leadboard/components/RankRow";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("plans");
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
      {/* Above the Community drawer (z-110) — the activity feed opens this from inside it. */}
      <DialogContent overlayClassName="z-[120]" className="z-[120] bg-zinc-950 p-0 max-h-[85vh] flex flex-col">
        <div className="p-8 pb-5 pr-14 sm:pr-16 shrink-0">
          <DialogHeader className="mb-0 text-left">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-medium text-zinc-400">{t("leaderboard.title")}</span>
              {entries.length > 0 && (
                <span className="text-xs font-semibold text-zinc-500 tabular-nums">
                  · {entries.length === 1 ? t("leaderboard.player_one") : t("leaderboard.players", { count: entries.length })}
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
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/40">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="flex-1 h-4" />
                  <Skeleton className="w-16 h-5" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              size="compact"
              icon={<Trophy />}
              title={t("leaderboard.empty")}
              description={t("leaderboard.empty_hint")}
              className="bg-transparent px-0"
            />
          ) : (
            <ol className="flex flex-col gap-2">
              {entries.map((entry, index) => (
                <RankRow
                  key={entry.userId}
                  place={index + 1}
                  nick={entry.displayName || t("custom.anonymous")}
                  avatarUrl={entry.avatar}
                  profileId={entry.userId}
                  isCurrentUser={entry.userId === userAuth}
                  score={entry.score}
                  // Older entries and metronome-less exercises simply have no tempo to show.
                  scoreLabel={entry.bpm != null ? `${entry.bpm} BPM` : undefined}
                  density="compact"
                />
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
