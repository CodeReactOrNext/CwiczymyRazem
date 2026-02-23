import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Timer, TrendingUp, Music, Layers, Play } from "lucide-react";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";
import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { Song } from "feature/songs/types/songs.type";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";

interface ScheduleItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: ExercisePlan) => void;
  onSelectSong: (song: Song) => void;
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
  userPlans: ExercisePlan[];
}

export const ScheduleItemSelector = ({
  isOpen,
  onClose,
  onSelectPlan,
  onSelectSong,
  userSongs,
  userPlans,
}: ScheduleItemSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"plans" | "songs">("plans");
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | "local" | "user">("all");
  const [playalongOnly, setPlayalongOnly] = useState(false);

  const renderLocalized = (content: any) => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object") {
      return content.en || content.pl || "";
    }
    return "";
  };

  const allUserSongs = useMemo(() => [
    ...userSongs.wantToLearn,
    ...userSongs.learning,
  ], [userSongs.wantToLearn, userSongs.learning]);

  const filteredSongs = useMemo(() => {
    return allUserSongs.filter((song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUserSongs, searchQuery]);

  const filteredPlans = useMemo(() => {
    const allPlans = [...defaultPlans, ...userPlans];
    return allPlans.filter((plan) => {
      if (!plan) return false;
      const title = String(plan.title || "");
      const description = String(plan.description || "");
      
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = !difficultyFilter || plan.difficulty === difficultyFilter;
      const matchesSource = sourceFilter === "all" || 
                           (sourceFilter === "user" && userPlans.includes(plan)) ||
                           (sourceFilter === "local" && defaultPlans.includes(plan));
      
      const isPlayalong = title.toLowerCase().includes("playalong") || 
                         (plan.exercises && Array.isArray(plan.exercises) && plan.exercises.some(e => e?.isPlayalong));
      const matchesPlayalong = !playalongOnly || isPlayalong;

      return matchesSearch && matchesDifficulty && matchesSource && matchesPlayalong;
    });
  }, [searchQuery, difficultyFilter, sourceFilter, playalongOnly, userPlans]);



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "hard": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  if (typeof window === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
          />
          
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-3xl max-h-[80vh] bg-zinc-950 border-2 border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Choose Your Practice
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab("plans")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${
                    activeTab === "plans"
                      ? "bg-white text-zinc-950"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Plans ({filteredPlans.length})
                </button>
                <button
                  onClick={() => setActiveTab("songs")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${
                    activeTab === "songs"
                      ? "bg-white text-zinc-950"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Songs ({filteredSongs.length})
                </button>
              </div>

              {activeTab === "plans" && (
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <span className="text-[10px] font-black uppercase text-zinc-400 mr-1 shrink-0">Difficulty:</span>
                    {["easy", "medium", "hard"].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficultyFilter(difficultyFilter === diff ? null : diff)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all shrink-0 ${
                          difficultyFilter === diff
                            ? getDifficultyColor(diff)
                            : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/10"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSourceFilter(sourceFilter === "user" ? "all" : "user")}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                        sourceFilter === "user"
                          ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                          : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/10"
                      }`}
                    >
                      My Plans
                    </button>
                    <button
                      onClick={() => setPlayalongOnly(!playalongOnly)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                        playalongOnly
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/10"
                      }`}
                    >
                      Playalongs
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {activeTab === "plans" && (
                <>
                  {filteredPlans.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      No plans found
                    </div>
                  ) : (
                    filteredPlans.map((plan) => {
                      const isPlayalong = (plan.title || "").toLowerCase().includes("playalong") || 
                                          (plan.exercises && plan.exercises.some(e => e?.isPlayalong));
                      
                      return (
                        <motion.button
                          key={plan.id}
                          onClick={() => {
                            onSelectPlan(plan);
                            onClose();
                          }}
                          whileHover={{ x: 4 }}
                          className="w-full p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl text-left transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-black text-white tracking-tight mb-1 group-hover:text-cyan-400 transition-colors">
                                {renderLocalized(plan.title)}
                              </h3>
                              <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                                {renderLocalized(plan.description)}
                              </p>
                            </div>
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center ${
                              isPlayalong ? "bg-red-500/20 border-red-500/20 text-red-500" :
                              plan.category === "technique" ? "bg-blue-500/20 border-blue-500/20 text-blue-400" :
                              plan.category === "theory" ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-400" :
                              plan.category === "creativity" ? "bg-purple-500/20 border-purple-500/20 text-purple-400" :
                              plan.category === "hearing" ? "bg-orange-500/20 border-orange-500/20 text-orange-400" :
                              "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/20 text-cyan-400"
                            }`}>
                              {isPlayalong ? <Play size={20} fill="currentColor" /> :
                               plan.category === "technique" ? <TechniqueIcon size="large" /> :
                               plan.category === "theory" ? <TheoryIcon size="large" /> :
                               plan.category === "creativity" ? <CreativityIcon size="large" /> :
                               plan.category === "hearing" ? <HearingIcon size="large" /> :
                               <TrendingUp size={20} />}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </>
              )}



              {activeTab === "songs" && (
                <>
                  {filteredSongs.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      {allUserSongs.length === 0 ? "No songs in your library" : "No songs found"}
                    </div>
                  ) : (
                    filteredSongs.map((song) => {
                      const status = userSongs.wantToLearn.includes(song) ? "Want to Learn" :
                                    userSongs.learning.includes(song) ? "Learning" : "Learned";
                      const statusColor = status === "Want to Learn" ? "text-blue-400" :
                                         status === "Learning" ? "text-amber-400" : "text-emerald-400";
                      
                      return (
                        <motion.button
                          key={song.id}
                          onClick={() => {
                            onSelectSong(song);
                            onClose();
                          }}
                          whileHover={{ x: 4 }}
                          className="w-full p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl text-left transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-black text-white tracking-tight mb-1 group-hover:text-violet-400 transition-colors">
                                {song.title}
                              </h3>
                              <p className="text-xs text-zinc-400 mb-2">
                                {song.artist}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColor}`}>
                                  {status}
                                </span>
                              </div>
                            </div>
                            {song.coverUrl ? (
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                                <Music size={20} className="text-violet-400" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
