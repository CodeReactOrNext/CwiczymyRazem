import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaGuitar } from "react-icons/fa";
import { Ear } from "lucide-react";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

import {
  getAllBpmProgress,
  type BpmProgressData,
} from "../services/bpmProgressService";
import { exercisesAgregat } from "../data/exercisesAgregat";
import { generateBpmStages } from "../utils/generateBpmStages";
import { BpmProgressGrid } from "./BpmProgressGrid";

interface ExerciseProgressEntry {
  exerciseId: string;
  exerciseTitle: string;
  exerciseCategory: string;
  bpmStages: number[];
  completedBpms: number[];
  recommendedBpm: number;
  percentage: number;
}

interface EarTrainingEntry {
  exerciseId: string;
  exerciseTitle: string;
  earTrainingHighScore: number;
}

export const BpmProgressOverview = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const [entries, setEntries] = useState<ExerciseProgressEntry[]>([]);
  const [earTrainingEntries, setEarTrainingEntries] = useState<EarTrainingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userAuth) return;
    let cancelled = false;

    setIsLoading(true);
    getAllBpmProgress(userAuth).then((progressMap) => {
      if (cancelled) return;

      const results: ExerciseProgressEntry[] = [];
      const earResults: EarTrainingEntry[] = [];

      progressMap.forEach((data: BpmProgressData, exerciseId: string) => {
        const exerciseDef = exercisesAgregat.find((e) => e.id === exerciseId);

        // Collect ear training entries
        if (data.earTrainingHighScore && data.earTrainingHighScore > 0) {
          earResults.push({
            exerciseId,
            exerciseTitle: data.exerciseTitle || exerciseDef?.title || exerciseId,
            earTrainingHighScore: data.earTrainingHighScore,
          });
        }

        if (!exerciseDef?.metronomeSpeed) return;

        const bpmStages = generateBpmStages(exerciseDef.metronomeSpeed);
        const percentage =
          bpmStages.length > 0
            ? Math.round((data.completedBpms.length / bpmStages.length) * 100)
            : 0;

        results.push({
          exerciseId,
          exerciseTitle: data.exerciseTitle || exerciseDef.title,
          exerciseCategory: data.exerciseCategory || exerciseDef.category,
          bpmStages,
          completedBpms: data.completedBpms,
          recommendedBpm: exerciseDef.metronomeSpeed.recommended,
          percentage,
        });
      });

      results.sort((a, b) => b.percentage - a.percentage);
      earResults.sort((a, b) => b.earTrainingHighScore - a.earTrainingHighScore);
      setEntries(results);
      setEarTrainingEntries(earResults);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userAuth]);

  if (!userAuth) return null;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-zinc-900/20 p-8 text-center">
        <FaGuitar className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
        <h4 className="text-sm font-bold text-zinc-400">No BPM progress yet</h4>
        <p className="mt-1 text-xs text-zinc-600">
          Start a practice session and mark your BPM milestones!
        </p>
      </div>
    );
  }

  const totalStages = entries.reduce((acc, e) => acc + e.bpmStages.length, 0);
  const totalCompleted = entries.reduce(
    (acc, e) => acc + e.completedBpms.length,
    0
  );
  const overallPercentage =
    totalStages > 0 ? Math.round((totalCompleted / totalStages) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wider">
            BPM Progress
          </h3>
          <p className="text-xs text-zinc-500">
            {entries.length} exercises tracked
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">
            {overallPercentage}%
          </div>
          <div className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">
            Overall
          </div>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800 border border-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${overallPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <button
            key={entry.exerciseId}
            onClick={() =>
              setExpandedId(
                expandedId === entry.exerciseId ? null : entry.exerciseId
              )
            }
            className="w-full text-left"
          >
            <div
              className={cn(
                "rounded-lg border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-800/40",
                expandedId === entry.exerciseId &&
                  "bg-zinc-800/60 border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {entry.exerciseTitle}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[8px] border-white/10 text-zinc-500 capitalize"
                  >
                    {entry.exerciseCategory}
                  </Badge>
                </div>
                <span className="text-sm font-black text-white">
                  {entry.percentage}%
                </span>
              </div>

              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${entry.percentage}%` }}
                />
              </div>

              {expandedId === entry.exerciseId && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <BpmProgressGrid
                    bpmStages={entry.bpmStages}
                    completedBpms={entry.completedBpms}
                    recommendedBpm={entry.recommendedBpm}
                    onToggle={() => {}}
                    readOnly
                  />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Ear Training Records */}
      {earTrainingEntries.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <Ear className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wider">
              Ear Training Records
            </h3>
          </div>
          <div className="space-y-2">
            {earTrainingEntries.map((entry) => (
              <div
                key={entry.exerciseId}
                className="rounded-lg border border-purple-500/10 bg-purple-950/10 p-4 flex items-center justify-between"
              >
                <span className="text-sm font-bold text-white">
                  {entry.exerciseTitle}
                </span>
                <span className="text-sm font-black text-purple-400">
                  {entry.earTrainingHighScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
