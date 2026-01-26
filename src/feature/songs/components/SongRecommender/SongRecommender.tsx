import { useEffect, useState } from "react";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { 
  Music, 
  Flame, 
  Trophy, 
  Undo2, 
  CheckCircle2, 
  Sparkles, 
  Search,
  ChevronRight,
  TrendingUp,
  Ghost
} from "lucide-react";
import { cn } from "assets/lib/utils";
import { getQuizRecommendations, QuizFilters } from "feature/songs/services/pickSongQuiz";
import type { Song } from "feature/songs/types/songs.type";
import { useAppSelector } from "store/hooks";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import { toast } from "sonner";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { getGlobalGenres } from "feature/songs/services/getGlobalMetadata";

interface SongRecommenderProps {
  onSuccess?: () => void;
  variant?: 'inline' | 'modal';
}

export const SongRecommender = ({ onSuccess, variant = 'modal' }: SongRecommenderProps) => {
  const currentUserId = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState<{
    genres: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    popularity: "classic" | "discovery";
  }>({
    genres: ["Any"],
    difficulty: "beginner",
    popularity: "classic"
  });
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      const genres = await getGlobalGenres();
      if (genres.length > 0) {
        setAvailableGenres(["Any", ...genres]);
      }
    };
    fetchGenres();
  }, []);

  const toggleGenre = (genre: string) => {
    setFilters(prev => {
      if (genre === "Any") return { ...prev, genres: ["Any"] };
      
      const newGenres = prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres.filter(g => g !== "Any"), genre];
      
      return { ...prev, genres: newGenres.length > 0 ? newGenres : ["Any"] };
    });
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleFinish = async () => {
    setIsLoading(true);
    setStep(4);
    // Transform state to service filter format
    const results = await getQuizRecommendations({
        ...filters,
        genres: filters.genres
    } as any);
    setRecommendations(results);
    setIsLoading(false);
  };

  const handleAddSong = async (song: Song) => {
    if (!currentUserId) {
      toast.error("Please log in to add songs");
      return;
    }
    setIsAdding(song.id);
    try {
      await updateSongStatus(
        currentUserId,
        song.id,
        song.title,
        song.artist,
        "wantToLearn",
        userInfo?.avatar || ""
      );
      toast.success(`${song.title} added to your learning list!`);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add song");
    } finally {
      setIsAdding(null);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                Pick your <span className="text-cyan-500">poison</span>
              </h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Select one or more vibes</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {availableGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 text-[10px] font-black uppercase tracking-tight flex flex-col items-center gap-2",
                    filters.genres.includes(genre) 
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                      : "border-white/5 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  <Music className={cn("w-3 h-3", filters.genres.includes(genre) ? "text-cyan-400" : "text-zinc-600")} />
                  {genre}
                </button>
              ))}
            </div>
            <Button 
                onClick={nextStep} 
                disabled={filters.genres.length === 0}
                className="w-full h-12 text-xs font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500"
            >
              CONTINUE
            </Button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                Choose your <span className="text-orange-500">battle</span>
              </h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">How brutal should the tabs be?</p>
            </div>
            <div className="space-y-3">
              {[
                { id: "beginner", icon: Flame, title: "Fresh Meat", desc: "Basic chords & simple rhythm", color: "text-blue-400" },
                { id: "intermediate", icon: Sparkles, title: "Road Warrior", desc: "Riffs, slides & solid technique", color: "text-amber-400" },
                { id: "advanced", icon: Trophy, title: "Legend Status", desc: "Fast solos & complex structures", color: "text-red-400" }
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => {
                    setFilters(f => ({ ...f, difficulty: level.id as QuizFilters['difficulty'] }));
                    nextStep();
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left hover:scale-[1.01]",
                    filters.difficulty === level.id 
                      ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                      : "border-white/5 bg-zinc-900/50 hover:border-zinc-700"
                  )}
                >
                  <div className={cn("p-2 rounded-lg bg-zinc-800/50", filters.difficulty === level.id ? "text-cyan-400" : level.color)}>
                    <level.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tight text-white">{level.title}</h4>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">{level.desc}</p>
                  </div>
                  <ChevronRight className="ml-auto w-4 h-4 text-zinc-600" />
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={prevStep} className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-widest">
              <Undo2 className="w-3 h-3 mr-2" /> RE-TUNE
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                The <span className="text-purple-500">Selection</span>
              </h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Famous anthems or underground gems?</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: "classic", icon: TrendingUp, title: "Pure Gold", desc: "The legendary hits everyone knows", color: "text-emerald-400" },
                { id: "discovery", icon: Ghost, title: "Crate Digging", desc: "Rare tracks & fresh challenges", color: "text-indigo-400" }
              ].map(vibe => (
                <button
                  key={vibe.id}
                  onClick={() => {
                    setFilters(f => ({ ...f, popularity: vibe.id as QuizFilters['popularity'] }));
                    nextStep();
                  }}
                  className={cn(
                    "w-full p-5 rounded-xl border-2 transition-all flex items-center gap-5 text-left hover:scale-[1.01]",
                    filters.popularity === vibe.id 
                      ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                      : "border-white/5 bg-zinc-900/50 hover:border-zinc-700"
                  )}
                >
                  <div className={cn("p-3 rounded-xl bg-zinc-800/50", filters.popularity === vibe.id ? "text-cyan-400" : vibe.color)}>
                    <vibe.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-white">{vibe.title}</h4>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">{vibe.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={prevStep} className="flex-1 text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-widest">
                <Undo2 className="w-3 h-3 mr-2" /> RE-TUNE
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
             <div className="relative inline-block">
                <Flame className="w-20 h-20 text-orange-500 animate-pulse" />
                <Music className="w-8 h-8 text-cyan-500 absolute -top-2 -right-2 rotate-12" />
             </div>
             <div className="space-y-2">
                <h3 className="text-4xl font-black italic tracking-tighter text-white uppercase">Your Riff is Ready</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">We've filtered the noise to find your match.</p>
             </div>
             <Button 
                onClick={handleFinish} 
                className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/5"
             >
                SHOW ME THE TRACKS
             </Button>
             <Button variant="ghost" onClick={prevStep} className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-widest">
                Wait, re-tune my choices
             </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">The <span className="text-cyan-500">Shortlist</span></h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Curation: {filters.genres.join(', ')} / {filters.difficulty}</p>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 py-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {recommendations.map((song, idx) => {
                  const avgDifficulty = song.avgDifficulty || 0;
                  const tier = getSongTier(avgDifficulty === 0 ? "?" : (song.tier || avgDifficulty));
                  return (
                    <div 
                      key={song.id} 
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 p-4 transition-all duration-300 hover:border-cyan-500/30 hover:bg-zinc-900 shadow-xl"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      {/* Cover Background Blur */}
                      {song.coverUrl && (
                        <div className="absolute inset-0 z-0 opacity-10 transition-opacity group-hover:opacity-20">
                          <img src={song.coverUrl} className="h-full w-full object-cover blur-2xl" alt="" />
                        </div>
                      )}

                      <div className="relative z-10 flex gap-4">
                        {/* Cover Image Wrapper */}
                        <div className="relative shrink-0">
                          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                            {song.coverUrl ? (
                              <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                                <Music className="h-6 w-6 text-zinc-600" />
                              </div>
                            )}
                          </div>
                          {/* Tier Badge */}
                          <div 
                            className="absolute -bottom-1 -right-1 z-20 flex h-6 w-6 items-center justify-center rounded-lg border text-[9px] font-black shadow-lg backdrop-blur-xl"
                            style={{
                              borderColor: `${tier.color}40`,
                              backgroundColor: `rgba(10, 10, 10, 0.9)`,
                              color: tier.color,
                            }}
                          >
                            {tier.tier}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate text-base leading-tight group-hover:text-cyan-400 transition-colors uppercase italic">{song.title}</h4>
                          <p className="text-zinc-500 truncate text-xs font-bold uppercase tracking-tight">{song.artist}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1.5 opacity-60">
                              <TrendingUp className="h-3 w-3 text-cyan-500" />
                              <span className="text-[10px] font-black text-zinc-500">{song.popularity || 0}</span>
                            </div>
                            {song.genres && song.genres.length > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-black text-zinc-400">
                                  {song.genres[0]}
                                </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Difficulty Stats */}
                      <div className="relative z-10 mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          <span>Difficulty</span>
                          <span style={{ color: tier.color }}>{avgDifficulty.toFixed(1)}</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(avgDifficulty * 10, 100)}%`,
                              backgroundColor: tier.color,
                              boxShadow: `0 0 10px ${tier.color}40`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Call to action */}
                      <Button
                        size="sm"
                        disabled={isAdding === song.id}
                        onClick={() => handleAddSong(song)}
                        className={cn(
                          "relative z-10 mt-4 h-9 w-full rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                          isAdding === song.id 
                            ? "bg-zinc-800 text-zinc-500" 
                            : "bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-600 hover:text-white"
                        )}
                      >
                        {isAdding === song.id ? "Adding..." : "Add to learn"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Search className="w-16 h-16 text-zinc-800 mx-auto" />
                <p className="text-zinc-500">No matches found for these exact criteria. Try re-tuning!</p>
                <Button variant="outline" onClick={() => setStep(0)} className="border-white/10">Try Again</Button>
              </div>
            )}
            
            <div className="pt-4 flex justify-center">
              <Button 
                variant="ghost" 
                onClick={() => setStep(0)} 
                className="text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 font-bold"
              >
                Restart Quiz
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "w-full max-w-lg mx-auto",
      variant === 'modal' ? "" : "p-6 rounded-3xl bg-zinc-950 border border-white/5"
    )}>
      {renderStep()}
    </div>
  );
};
