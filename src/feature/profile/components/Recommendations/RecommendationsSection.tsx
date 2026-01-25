import { getDailyExerciseRecommendation } from "feature/exercisePlan/services/getDailyRecommendation";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { DailyPlanRecommendation } from "feature/songs/components/DailyRecommendation/DailyPlanRecommendation";
import { DailyRecommendation } from "feature/songs/components/DailyRecommendation/DailyRecommendation";
import { RecommendationSkeleton } from "feature/songs/components/DailyRecommendation/RecommendationSkeleton";
import { getDailyRecommendation } from "feature/songs/services/getRecommendation";
import type { Song } from "feature/songs/types/songs.type";
import { useEffect,useState } from "react";

interface RecommendationsSectionProps {
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  } | undefined;
  isOwnProfile: boolean;
  onRefreshSongs: () => void;
  onOpenDetails: (song: Song) => void;
  className?: string;
  type?: "song" | "exercise";
}

const CACHE_KEY_SONG = "daily_song_recommendation";
const CACHE_KEY_EXERCISE = "daily_exercise_recommendation";

export const RecommendationsSection = ({
  userSongs,
  isOwnProfile,
  onRefreshSongs,
  onOpenDetails,
  className,
  type = "song"
}: RecommendationsSectionProps) => {
  const [dailyPick, setDailyPick] = useState<Song | null>(null);
  const [dailyExercisePick, setDailyExercisePick] = useState<ExercisePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!isOwnProfile) return;
    
    // Check cache first
    try {
        if (type === "song") {
            const cachedSongStr = localStorage.getItem(CACHE_KEY_SONG);
            if (cachedSongStr) {
                const cachedData = JSON.parse(cachedSongStr);
                const cacheDate = new Date(cachedData.timestamp);
                const now = new Date();
                
                // If we have learning songs, the pick MUST be one of them. 
                // If it's not, we invalidate cache to force the "learning priority" logic.
                const isCachedSongInLearning = userSongs?.learning.some(s => s.id === cachedData.data.id);
                const shouldBeInLearning = (userSongs?.learning.length ?? 0) > 0;

                if (now.toDateString() === cacheDate.toDateString()) {
                    if (shouldBeInLearning && !isCachedSongInLearning) {
                        // Invalidate cache - we have songs to learn but cache shows something else
                    } else {
                        setDailyPick(cachedData.data);
                        return; 
                    }
                }
            }
        } else if (type === "exercise") {
            const cachedExStr = localStorage.getItem(CACHE_KEY_EXERCISE);
             if (cachedExStr) {
                const cachedData = JSON.parse(cachedExStr);
                const cacheDate = new Date(cachedData.timestamp);
                const now = new Date();
                
                if (now.toDateString() === cacheDate.toDateString()) {
                    setDailyExercisePick(cachedData.data);
                    return;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to read recommendation cache", e);
    }

    setIsLoading(true);
    try {
      if (type === "song" && userSongs) {
        let pick: Song | null = null;
        
        // Prioritize songs the user is currently learning
        if (userSongs.learning.length > 0) {
            const today = new Date();
            const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            let hash = 0;
            for (let i = 0; i < dateString.length; i++) {
                const char = dateString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            const index = Math.abs(hash) % userSongs.learning.length;
            pick = userSongs.learning[index];
        } else {
            const ownedIds = [
              ...userSongs.wantToLearn.map((s) => s.id),
              ...userSongs.learning.map((s) => s.id),
              ...userSongs.learned.map((s) => s.id),
            ];
            pick = await getDailyRecommendation(ownedIds);
        }

        setDailyPick(pick);
        
        // Cache song
        if (pick) {
            localStorage.setItem(CACHE_KEY_SONG, JSON.stringify({
                timestamp: new Date().toISOString(),
                data: pick
            }));
        }
      } else if (type === "exercise") {
        const exPick = getDailyExerciseRecommendation();
        setDailyExercisePick(exPick);
        
         // Cache exercise
        if (exPick) {
            localStorage.setItem(CACHE_KEY_EXERCISE, JSON.stringify({
                timestamp: new Date().toISOString(),
                data: exPick
            }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userSongs, isOwnProfile, type]);

  if (!isOwnProfile) return null;

  if (isLoading) {
    return <RecommendationSkeleton type={type} />;
  }

  if (type === "song" && dailyPick) {
    return (
      <div className={className}>
        <DailyRecommendation
          song={dailyPick}
          userSongs={userSongs || { wantToLearn: [], learning: [], learned: [] }}
          onRefreshSongs={onRefreshSongs}
          onOpenDetails={onOpenDetails}
        />
      </div>
    );
  }

  if (type === "exercise" && dailyExercisePick) {
    return (
      <div className={className}>
        <DailyPlanRecommendation plan={dailyExercisePick} />
      </div>
    );
  }

  return null;
};
