import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import { rateSong } from "feature/user/store/userSlice.asyncThunk";
import { getUserSongMeta, saveUserSongMeta } from "feature/songs/services/songSections.service";
import type { SongSection, MasteryLevel } from "feature/songs/types/songSection.type";
import { MASTERY_LABELS, SECTION_COLORS } from "feature/songs/types/songSection.type";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import Avatar from "components/UI/Avatar/Avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "assets/components/ui/tooltip";
import { 
  Clock, 
  History, 
  Music, 
  Play, 
  Star, 
  Target, 
  Trash2,
  TrendingUp,
  ArrowRightLeft,
  ArrowLeft,
  FileText,
  Users,
  Info,
  ChevronRight,
  Save,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { SpotifyPlayer } from "../SpotifyPlayer";
import { Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "assets/components/ui/chart";

interface SongDetailViewProps {
  song: Song;
  progress: any; // UserSongProgress
  status: any; // SongStatus | null
  onPractice: (song: Song) => void;
  onRemove: (songId: string) => void;
  onStatusChange: (songId: string, status: any, title: string, artist: string) => void;
  onBack?: () => void;
}

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  0: "#3f3f46", // zinc-700
  1: "#ef4444", // red-500
  2: "#f59e0b", // amber-500
  3: "#22c55e", // green-500
  4: "#52525b", // zinc-600
};

const StarRatingDisplay = ({ rating, color, size = 12, onRate }: { rating: number; color: string; size?: number; onRate?: (rating: number) => void }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-0.5 group/stars">
      {[...Array(10)].map((_, i) => {
        const starValue = i + 1;
        const isActive = hoverRating !== null ? starValue <= hoverRating : starValue <= Math.round(rating);
        
        return (
          <Star 
            key={i} 
            size={size} 
            onClick={() => onRate?.(starValue)}
            onMouseEnter={() => onRate && setHoverRating(starValue)}
            onMouseLeave={() => onRate && setHoverRating(null)}
            className={cn(
              "transition-all",
              onRate ? "cursor-pointer hover:scale-125 active:scale-90" : "",
              isActive ? "opacity-100 fill-current" : "opacity-20 text-zinc-600"
            )}
            style={isActive ? { color } : {}}
          />
        );
      })}
    </div>
  );
};

export const SongDetailView = ({ song, progress, status, onPractice, onRemove, onStatusChange, onBack }: SongDetailViewProps) => {
  const { t } = useTranslation("songs");
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const [isRating, setIsRating] = useState(false);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [raterProfiles, setRaterProfiles] = useState<Record<string, { displayName: string; avatar: string; lvl: number }>>({});
  
  const avgDifficulty = song.avgDifficulty || 0;
  const userRating = song.difficulties?.find(d => d.userId === userAuth)?.rating;
  const tier = getSongTier(song.tier || avgDifficulty);
  
  const handleRate = async (rating: number) => {
    if (!userAuth || !song.id || isRating) return;
    setIsRating(true);
    try {
      await dispatch(rateSong({ songId: song.id, userId: userAuth, rating }));
    } catch (error) {
      console.error("Error rating song:", error);
    } finally {
      setIsRating(false);
    }
  };

  useEffect(() => {
    if (userAuth && song.id) {
      getUserSongMeta(userAuth, song.id).then(meta => {
        setSections(meta.sections || []);
        setNotes(meta.notes || "");
      });
    }
  }, [userAuth, song.id]);

  useEffect(() => {
    if (!userAuth || !song.id) return;
    
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveUserSongMeta(userAuth, song.id, {
          notes,
          sections,
        });
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [notes, sections, userAuth, song.id]);

  useEffect(() => {
    const fetchRaterProfiles = async () => {
      const raters = song.difficulties?.map(d => d.userId) || [];
      if (raters.length === 0) return;

      try {
        const uniqueRaters = Array.from(new Set(raters)).slice(0, 10);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where(documentId(), "in", uniqueRaters));
        const snapshot = await getDocs(q);
        
        const profiles: Record<string, any> = {};
        snapshot.docs.forEach(d => {
          const data = d.data();
          profiles[d.id] = {
            displayName: data.displayName || "Musician",
            avatar: data.avatar || "",
            lvl: data.lvl || 0
          };
        });
        setRaterProfiles(profiles);
      } catch (error) {
        console.error("Error fetching rater profiles:", error);
      }
    };

    fetchRaterProfiles();
  }, [song.difficulties]);

  const masteryData = useMemo(() => {
    if (!sections || sections.length === 0) return null;
    const totalSections = sections.length;
    const masteredCount = sections.filter(s => s.mastery === 3).length;
    const counts = ([0, 1, 2, 3] as MasteryLevel[]).map(level => ({
      level,
      name: MASTERY_LABELS[level],
      value: sections.filter(s => s.mastery === level).length
    })).filter(c => c.value > 0);

    const totalWeighted = sections.reduce((acc, s) => acc + (s.mastery / 3), 0);
    const progressPct = Math.round((totalWeighted / totalSections) * 100);

    return { counts, progressPct, totalSections, masteredCount };
  }, [sections]);

  const totalHours = progress ? Math.floor(progress.totalPracticeMs / 3600000) : 0;
  const totalMinutes = progress ? Math.floor((progress.totalPracticeMs % 3600000) / 60000) : 0;

  return (
    <div className="relative h-full w-full flex flex-col xl:overflow-hidden overflow-y-auto no-scrollbar bg-second-600">
      {/* Header Section */}
      <div className="relative shrink-0 overflow-hidden bg-zinc-900/50 border-b border-white/5">
         <div className="absolute inset-0 overflow-hidden">
            {song.coverUrl && (
              <img src={song.coverUrl} className="w-full h-full object-cover blur-xl opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
         </div>

         {/* Mobile Back Button */}
         {onBack && (
           <div className="relative z-20 xl:hidden pt-4 px-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="gap-2 text-zinc-400 hover:text-white bg-white/5 backdrop-blur-md rounded-full px-4"
              >
                <ArrowLeft size={16} />
                <span className="text-[11px] font-bold tracking-tight">Back to library</span>
              </Button>
           </div>
         )}

         <div className="relative flex flex-row items-center p-6 md:p-8 gap-5 md:gap-8">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-20 w-20 sm:h-32 sm:w-32 md:h-40 md:w-40 shrink-0 rounded-lg overflow-hidden shadow-2xl bg-zinc-900 border border-white/10"
            >
              {song.coverUrl ? (
                <img src={song.coverUrl} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                   <Music className="h-8 w-8 sm:h-10 sm:w-10 text-zinc-700" />
                </div>
              )}
            </motion.div>

            <div className="flex-1 text-left">
               <div className="flex items-center justify-start gap-3 mb-1 sm:mb-2">
                   <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-cyan-500/10 border border-cyan-500/20 text-[9px] sm:text-[10px] font-bold capitalize tracking-widest text-cyan-400 backdrop-blur-sm">
                     {song.genres?.[0] || "Guitar Track"}
                   </span>
               </div>
               <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">{song.title}</h2>
               <p className="text-sm sm:text-lg md:text-xl font-bold text-zinc-400 drop-shadow-sm">{song.artist}</p>
            </div>

            <div className="shrink-0 hidden sm:flex flex-col items-center gap-2">
               <div 
                 className="h-16 w-16 md:h-20 md:w-20 rounded-[10px] border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-lg"
                 style={{ 
                   borderColor: `${tier.color}40`,
                   backgroundColor: `${tier.color}10`,
                   boxShadow: `0 0 20px ${tier.color}15`
                 }}
               >
                   <div className="absolute inset-0 opacity-10" style={{ backgroundColor: tier.color }} />
                   <span className="text-3xl md:text-4xl font-black relative z-10" style={{ color: tier.color }}>{tier.tier}</span>
                   <span className="text-[8px] md:text-[10px] font-bold capitalize tracking-widest relative z-10" style={{ color: `${tier.color}90` }}>Tier</span>
               </div>
               <span className="text-[10px] md:text-[11px] text-zinc-500 capitalize font-bold tracking-widest">
                  Lvl {avgDifficulty.toFixed(1)}
               </span>
            </div>
         </div>
         
         <div className="relative px-6 md:px-8 pb-8 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10 w-full lg:w-auto">
               {/* Primary Action Button */}
               <Button 
                 onClick={() => onPractice(song)}
                 className="h-14 w-full sm:w-auto px-8 rounded-lg bg-white hover:bg-zinc-200 text-black font-black tracking-widest flex items-center justify-center gap-6 transition-all active:scale-95 shadow-xl border-none group"
               >
                 <div className="mr-4 p-2 rounded-md transition-colors">
                    <Play className="h-5 w-5 fill-current" />
                 </div>
                 <span className="text-sm">Start practice</span>
               </Button>

               {/* Steam-style Info Boxes */}
               <div className="flex items-center gap-6 sm:gap-10 border-t sm:border-t-0 sm:border-l border-white/10 pt-6 sm:pt-0 sm:pl-8 w-full sm:w-auto justify-around sm:justify-start">
                  <div className="flex flex-col items-center sm:items-start">
                     <span className="text-[11px] font-black tracking-[0.2em] text-zinc-500 mb-1">Sessions</span>
                     <span className="text-sm font-bold text-zinc-200">{progress?.sessionCount || 0}</span>
                  </div>

                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                     <span className="text-[11px] font-black tracking-[0.2em] text-zinc-500 mb-1">Last Practiced</span>
                     <span className="text-sm font-bold text-zinc-200">
                        {progress?.lastPracticedAt ? progress.lastPracticedAt.toLocaleDateString() : "Never"}
                     </span>
                  </div>

                  <div className="flex flex-col items-center sm:items-start">
                     <div className="flex items-center gap-2 mb-1">
                        <Clock size={12} className="text-zinc-500" />
                        <span className="text-[11px] font-black tracking-[0.2em] text-zinc-500">Play Time</span>
                     </div>
                     <span className="text-sm font-bold text-zinc-200">{totalHours}h {totalMinutes}m</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto justify-center lg:justify-end">
               <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                  {(["wantToLearn", "learning", "learned"] as const).map((s) => {
                    const config = STATUS_CONFIG[s];
                    const Icon = config.icon;
                    const isActive = status === s;
                    
                    return (
                      <TooltipProvider key={s}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => onStatusChange(song.id, s, song.title, song.artist)}
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-11 w-11 rounded-lg transition-all",
                                isActive 
                                  ? "bg-zinc-800 text-white shadow-xl" 
                                  : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                              )}
                            >
                              <Icon size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs font-bold">{t(`status.${s}` as any)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
               </div>

               <div className="w-px h-8 bg-white/10" />

               <Button 
                 onClick={() => {
                   if (window.confirm("Are you sure you want to remove this song from your board?")) {
                     onRemove(song.id);
                   }
                 }}
                 variant="ghost"
                 className="h-11 w-11 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95 p-0"
               >
                 <Trash2 size={16} />
               </Button>
            </div>
         </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 xl:overflow-y-auto p-4 md:p-6 lg:p-8 no-scrollbar">
         
         {/* Spotify Preview */}
         {song.spotifyId && (
           <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
             <div className="bg-zinc-800/40 rounded-xl border-0 p-1 backdrop-blur-sm shadow-sm">
                <SpotifyPlayer trackId={song.spotifyId} height={80} />
             </div>
           </div>
         )}



         {/* Second Row: Detailed Info & Progress */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Your Progress */}
            <div className="bg-zinc-800/40 rounded-xl border-0 p-6 space-y-6 shadow-sm backdrop-blur-sm">
               <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="transition-all duration-500 text-zinc-700" />
                  <span className="text-[11px] font-semibold text-zinc-400">Your Progress</span>
               </div>
               
               <div className="space-y-8">
                  <div className="group/rate px-1">
                     <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">My Rating</p>
                        {isRating && <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />}
                     </div>
                     <div className="flex items-center justify-between">
                        <span className={cn(
                           "text-4xl font-black transition-colors leading-none",
                           userRating !== undefined ? "text-white" : "text-zinc-700"
                        )}>
                           {userRating !== undefined ? userRating : "--"}
                        </span>
                        <StarRatingDisplay 
                           rating={userRating || 0} 
                           color={userRating !== undefined ? getSongTier(userRating).color : "#52525b"} 
                           size={20} 
                           onRate={handleRate}
                        />
                     </div>
                     <p className="text-[9px] text-zinc-600 mt-3 opacity-0 group-hover/rate:opacity-100 transition-opacity">
                        Click stars to {userRating !== undefined ? "change" : "set"} your rating
                     </p>
                  </div>

                  <div className="space-y-3">
                     <InfoRow label="Mastery progress" value={`${song.masteryProgress || 0}%`} icon={Target} />
                     <InfoRow label="Last practiced" value={progress?.lastPracticedAt ? progress.lastPracticedAt.toLocaleDateString() : "Never"} icon={Clock} />
                     <InfoRow label="Attached file" value={progress?.gpFileName || "None"} icon={FileText} />
                  </div>
               </div>
            </div>

            {/* Column 2: Song Info */}
            <div className="bg-zinc-800/40 rounded-xl border-0 p-6 space-y-6 shadow-sm backdrop-blur-sm">
               <div className="flex items-center gap-2">
                  <Music size={18} className="transition-all duration-500 text-zinc-700" />
                  <span className="text-[11px] font-semibold text-zinc-400">Song Data</span>
               </div>

               <div className="space-y-5">
                  <div className="space-y-3 mt-4">
                     <InfoRow label="Artist" value={song.artist} icon={Users} />
                     <InfoRow label="Total sections" value={song.totalSections || 0} icon={FileText} />
                     <InfoRow label="Practicing users" value={song.practicingUsers?.length || 0} icon={Users} />
                  </div>
               </div>
            </div>

            {/* Column 3: Community & Ratings */}
            <div className="bg-zinc-800/40 rounded-xl border-0 p-6 flex flex-col gap-6 shadow-sm backdrop-blur-sm">
               <div className="flex items-center gap-2">
                  <Star size={18} className="transition-all duration-500 text-zinc-700" />
                  <span className="text-[11px] font-semibold text-zinc-400">Community Ratings</span>
               </div>

               <div className="px-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase mb-3 tracking-widest">Avg. Difficulty</p>
                  <div className="flex items-center justify-between">
                     <span className="text-4xl font-black text-white leading-none">{avgDifficulty.toFixed(1)}</span>
                     <StarRatingDisplay rating={avgDifficulty} color={tier.color} size={20} />
                  </div>
               </div>

               <div className="flex-1">
                  <div className="flex flex-wrap gap-4">
                     {song.difficulties && song.difficulties.length > 0 ? (
                       song.difficulties.slice(0, 15).map((diff, i) => {
                         const profile = raterProfiles[diff.userId];
                         const t = getSongTier(diff.rating);
                         
                         return (
                           <div key={diff.userId || i} className="relative group/avatar">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="relative">
                                       <Avatar 
                                         name={profile?.displayName || "Musician"}
                                         avatarURL={profile?.avatar}
                                         lvl={profile?.lvl || 0}
                                         size="sm"
                                         className="transition-transform group-hover/avatar:scale-110 shadow-lg"
                                       />
                                       <div 
                                         className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-[8px] font-black shadow-lg" 
                                         style={{ color: t.color }}
                                       >
                                         {t.tier}
                                       </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-zinc-950 border-white/10 p-3 shadow-2xl">
                                    <div className="space-y-1">
                                       <p className="text-xs font-black text-white">{profile?.displayName || "Unknown Musician"}</p>
                                       <p className="text-[10px] text-zinc-400">Rating: <span className="font-bold" style={{ color: t.color }}>{diff.rating}/10</span></p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                           </div>
                         );
                       })
                     ) : (
                       <p className="text-xs text-zinc-600 italic">No ratings yet</p>
                     )}
                     {song.difficulties && song.difficulties.length > 15 && (
                       <div className="h-8 w-8 rounded-full bg-zinc-800/40 border border-dashed border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                         +{song.difficulties.length - 15}
                       </div>
                     )}
                  </div>
               </div>


            </div>
         </div>

         {/* Full Width Bottom: Integrated Mastery Timeline Box */}
         {masteryData && (
           <div className="bg-zinc-800/40 rounded-xl border-0 p-8 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
             <div className="flex flex-col items-center gap-8">
               {/* Mastery Summary (Timeline) */}
               <div className="w-full space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500">
                           Song Mastery
                        </span>
                        <p className="text-[9px] font-bold text-zinc-600 tracking-widest mt-1">Practice Progression</p>
                     </div>
                     <span className="text-[10px] font-black text-zinc-400 tabular-nums">
                        {masteryData.masteredCount} / {masteryData.totalSections} Sections ({masteryData.progressPct}%)
                     </span>
                  </div>
                  
                  <div className="h-4 w-full rounded-full overflow-hidden bg-black/40 border border-white/5 relative">
                     <TooltipProvider>
                        {sections
                          .sort((a, b) => a.startTime - b.startTime)
                          .map((s, idx, arr) => {
                             const nextStart = arr[idx + 1]?.startTime || (s.startTime + 10);
                             const lastSection = arr[arr.length - 1];
                             const totalDuration = lastSection.startTime + 10;
                             const widthPct = ( (nextStart - s.startTime) / totalDuration ) * 100;
                             const leftPct = ( s.startTime / totalDuration ) * 100;
                             
                             return (
                               <Tooltip key={s.id}>
                                 <TooltipTrigger asChild>
                                   <div
                                     className="absolute top-0 h-full transition-all hover:brightness-125 cursor-help"
                                     style={{ 
                                        left: `${leftPct}%`, 
                                        width: `${widthPct}%`,
                                        backgroundColor: MASTERY_COLORS[s.mastery]
                                     }}
                                   />
                                 </TooltipTrigger>
                                 <TooltipContent className="bg-zinc-950 border-white/10 shadow-2xl">
                                    <div className="space-y-1">
                                       <p className="text-xs font-black text-white">{s.name}</p>
                                       <p className="text-[10px] font-bold" style={{ color: MASTERY_COLORS[s.mastery] }}>
                                          {MASTERY_LABELS[s.mastery]}
                                       </p>
                                    </div>
                                 </TooltipContent>
                               </Tooltip>
                             );
                          })}
                     </TooltipProvider>
                  </div>
               </div>

               {/* Legend Area */}
               <div className="w-full pt-4 border-t border-white/5 space-y-4">
                  <div className="flex flex-wrap justify-center gap-6">
                    <LegendItem color="#3f3f46" label="Not learned" />
                    <LegendItem color="#ef4444" label="Bad" />
                    <LegendItem color="#f59e0b" label="Medium" />
                    <LegendItem color="#22c55e" label="Mastered" glow />
                  </div>
               </div>
             </div>

             {/* Column 4: Practice Notes */}
             <div className="lg:col-span-3 bg-zinc-800/40 rounded-xl border-0 p-6 space-y-4 shadow-sm backdrop-blur-sm relative group/notes mt-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <MessageSquare size={18} className="transition-all duration-500 text-zinc-700" />
                      <span className="text-[11px] font-semibold text-zinc-400">Practice Notes</span>
                   </div>
                   <div className="flex items-center gap-3">
                      {isSaving && (
                         <div className="flex items-center gap-1.5 animate-pulse">
                            <Save size={10} className="text-zinc-500" />
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Saving</span>
                         </div>
                      )}
                      <span className={cn(
                        "text-[9px] font-bold tracking-widest",
                        notes.length > 450 ? "text-amber-500" : "text-zinc-600"
                      )}>
                        {notes.length} / 500 CHARACTERS
                      </span>
                   </div>
                </div>

                <textarea
                   value={notes}
                   onChange={(e) => {
                     if (e.target.value.length <= 500) {
                        setNotes(e.target.value);
                     }
                   }}
                   placeholder="Add your practice notes here... (e.g. guitar settings, tips for difficult parts, gear used)"
                   className="w-full min-h-[250px] bg-black/20 rounded-lg p-4 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all resize-none leading-relaxed border border-white/5 shadow-inner"
                />
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, glow }: { color: string; label: string; glow?: boolean }) => (
  <div className="flex items-center gap-2">
     <div 
        className="w-2 h-2 rounded-full" 
        style={{ 
           backgroundColor: color,
           boxShadow: glow ? `0 0 10px ${color}80` : 'none'
        }} 
     />
     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
  </div>
);

const StatCard = ({ icon: Icon, label, value, subValue }: any) => (
  <div className="bg-zinc-800/40 p-6 rounded-xl border-0 flex flex-col justify-between min-h-[140px] transition-all hover:bg-zinc-800/60 group shadow-sm backdrop-blur-sm">
     <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="transition-all duration-500 text-zinc-700 group-hover:text-zinc-500" />
        <p className="text-[11px] font-semibold text-zinc-400">{label}</p>
     </div>
     <div>
        <p className="text-3xl font-black text-white tracking-tighter leading-none mb-1">{value}</p>
        <p className="text-[10px] font-bold text-cyan-500 capitalize tracking-widest opacity-80">{subValue}</p>
     </div>
  </div>
);

const InfoRow = ({ label, value, icon: Icon }: any) => (
  <div className="flex items-center justify-between group py-1">
    <div className="flex items-center gap-3">
       <Icon className="h-3.5 w-3.5 text-zinc-500" />
       <span className="text-[11px] font-bold text-zinc-500 capitalize tracking-wider">{label}</span>
    </div>
    <span className="text-[11px] font-bold text-white text-right max-w-[150px] truncate">{value}</span>
  </div>
);
