import { useState } from "react";
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

interface SongRecommenderProps {
  onSuccess?: () => void;
  variant?: 'inline' | 'modal';
}

const GENRES = [
  "Rock", "Metal", "Pop", "Blues", "Jazz", "Funk", "Alternative", "Metalcore", "Punk", "Acoustic", "Any"
];

export const SongRecommender = ({ onSuccess, variant = 'modal' }: SongRecommenderProps) => {
  const currentUserId = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState<QuizFilters>({
    genre: "Rock",
    difficulty: "beginner",
    popularity: "classic"
  });
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleFinish = async () => {
    setIsLoading(true);
    setStep(4);
    const results = await getQuizRecommendations(filters);
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
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">What genre are we shredding today?</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => {
                    setFilters(f => ({ ...f, genre }));
                    nextStep();
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 text-xs font-black uppercase tracking-tight flex flex-col items-center gap-2",
                    filters.genre === genre 
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                      : "border-white/5 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  <Music className={cn("w-4 h-4", filters.genre === genre ? "text-cyan-400" : "text-zinc-600")} />
                  {genre}
                </button>
              ))}
            </div>
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
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Curation: {filters.genre} / {filters.difficulty}</p>
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
                  const tier = getSongTier(song.tier || song.avgDifficulty || 0);
                  return (
                    <Card 
                      key={song.id} 
                      className="group overflow-hidden border-white/5 bg-zinc-900/80 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Music className="h-8 w-8 text-zinc-700" />
                            </div>
                          )}
                          <div 
                            className="absolute bottom-0 right-0 p-1 px-1.5 text-[10px] font-black"
                            style={{ backgroundColor: tier.color, color: '#000' }}
                          >
                            {tier.tier}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate text-lg leading-tight">{song.title}</h4>
                          <p className="text-zinc-500 truncate font-medium">{song.artist}</p>
                        </div>
                        <Button
                          size="sm"
                          disabled={isAdding === song.id}
                          onClick={() => handleAddSong(song)}
                          className={cn(
                            "rounded-full px-4 font-bold transition-all active:scale-90",
                            isAdding === song.id ? "bg-zinc-800" : "bg-cyan-600 hover:bg-cyan-500 text-white"
                          )}
                        >
                          {isAdding === song.id ? "..." : "Learn"}
                        </Button>
                      </div>
                    </Card>
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
