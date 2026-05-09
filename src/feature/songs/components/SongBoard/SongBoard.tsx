import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { 
  BarChart3, 
  Clock, 
  History, 
  Music, 
  Play, 
  Star, 
  Target, 
  TrendingUp, 
  X 
} from "lucide-react";
import { motion } from "framer-motion";

import { TierBadge } from "../SongsGrid/TierBadge";

interface SongBoardProps {
  song: Song | null;
  progress: any; // UserSongProgress
  isOpen: boolean;
  onClose: () => void;
  onPractice: (song: Song) => void;
}

export const SongBoard = ({ song, progress, isOpen, onClose, onPractice }: SongBoardProps) => {
  if (!song) return null;

  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(song.tier || avgDifficulty);
  
  const totalHours = progress ? Math.floor(progress.totalPracticeMs / 3600000) : 0;
  const totalMinutes = progress ? Math.floor((progress.totalPracticeMs % 3600000) / 60000) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-[#0a0a0c] border-white/5 shadow-2xl">
        <div className="relative h-full w-full flex flex-col">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header Section */}
          <div className="relative h-[280px] shrink-0">
             {/* Background Blur */}
             <div className="absolute inset-0 overflow-hidden">
                {song.coverUrl && (
                  <img src={song.coverUrl} className="w-full h-full object-cover blur-3xl opacity-20 scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0c]/50 to-[#0a0a0c]" />
             </div>

             <div className="relative h-full flex items-end p-10 gap-8">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="h-44 w-44 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                >
                  {song.coverUrl ? (
                    <img src={song.coverUrl} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-zinc-900">
                       <Music className="h-16 w-16 text-zinc-800" />
                    </div>
                  )}
                </motion.div>

                <div className="flex-1 pb-4">
                   <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                        {song.genres?.[0] || "Guitar Track"}
                      </span>
                      <TierBadge song={song} className="h-6 w-6 text-[10px]" />
                   </div>
                   <h2 className="text-5xl font-black text-white tracking-tighter mb-1">{song.title}</h2>
                   <p className="text-xl font-bold text-zinc-400">{song.artist}</p>
                </div>

                <div className="pb-4">
                   <Button 
                    onClick={() => onPractice(song)}
                    className="h-16 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest gap-3 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                   >
                     <Play className="h-6 w-6 fill-current" />
                     Start Practice
                   </Button>
                </div>
             </div>
          </div>

          {/* Stats & Dashboard Section */}
          <div className="flex-1 overflow-y-auto p-10 pt-4 grid grid-cols-3 gap-8">
             
             {/* Main Column - Analytics */}
             <div className="col-span-2 space-y-8">
                
                {/* Key Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                   <StatCard 
                    icon={Clock} 
                    label="Practice Time" 
                    value={`${totalHours}h ${totalMinutes}m`} 
                    color="text-blue-400"
                    bg="bg-blue-500/5"
                   />
                   <StatCard 
                    icon={Target} 
                    label="Best Accuracy" 
                    value={progress?.bestAccuracy ? `${progress.bestAccuracy}%` : "--"} 
                    color="text-emerald-400"
                    bg="bg-emerald-500/5"
                   />
                   <StatCard 
                    icon={History} 
                    label="Sessions" 
                    value={progress?.sessionCount || 0} 
                    color="text-purple-400"
                    bg="bg-purple-500/5"
                   />
                </div>

                {/* Performance Chart Placeholder */}
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-xl bg-cyan-500/10">
                            <TrendingUp className="h-5 w-5 text-cyan-500" />
                         </div>
                         <h3 className="text-lg font-black text-white">Accuracy Progress</h3>
                      </div>
                      <div className="flex gap-2">
                         <div className="h-2 w-2 rounded-full bg-cyan-500" />
                         <span className="text-[10px] font-bold text-zinc-500 uppercase">Last 10 sessions</span>
                      </div>
                   </div>
                   
                   <div className="h-48 flex items-end justify-between gap-2 px-2">
                      {[40, 65, 55, 80, 75, 90, 85, 95, 92, 98].map((val, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ delay: i * 0.05 }}
                          className="flex-1 bg-gradient-to-t from-cyan-500/40 to-cyan-400 rounded-t-lg relative group"
                        >
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 px-2 py-1 rounded text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              {val}%
                           </div>
                        </motion.div>
                      ))}
                   </div>
                </div>

                {/* Mastery Breakdown */}
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h4 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Technique mastery
                      </h4>
                      <div className="space-y-4">
                         <ProgressRow label="Speed" val={75} color="bg-orange-500" />
                         <ProgressRow label="Clarity" val={88} color="bg-cyan-500" />
                         <ProgressRow label="Rhythm" val={62} color="bg-emerald-500" />
                      </div>
                   </div>
                   <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Current Status</p>
                      <div className="h-20 w-20 rounded-full border-4 border-cyan-500/20 flex items-center justify-center mb-4">
                         <TierBadge song={song} className="h-16 w-16 text-xl" />
                      </div>
                      <p className="text-sm font-bold text-white">Tier {tier.tier}</p>
                      <p className="text-xs text-zinc-500">Mastered {progress?.sessionCount || 0} times</p>
                   </div>
                </div>
             </div>

             {/* Right Column - Info & Settings */}
             <div className="space-y-8">
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
                   <div>
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">About Track</h4>
                      <div className="space-y-3">
                         <InfoRow label="Difficulty" value={`${avgDifficulty.toFixed(1)} / 10`} icon={Star} iconColor="text-amber-500" />
                         <InfoRow label="Tempo" value="120 BPM" icon={TrendingUp} iconColor="text-cyan-500" />
                         <InfoRow label="Artist" value={song.artist} icon={Music} iconColor="text-purple-500" />
                      </div>
                   </div>

                   <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Song Resources</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300">
                           <Music className="h-4 w-4" />
                           Spotify Web Player
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300">
                           <History className="h-4 w-4" />
                           Practice History
                        </Button>
                      </div>
                   </div>
                </div>

                {/* Social/Practitioners */}
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Others Practicing</h4>
                   <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-[#0a0a0c] bg-zinc-800 overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + song.id}`} alt="" />
                        </div>
                      ))}
                      <div className="h-10 w-10 rounded-full border-2 border-[#0a0a0c] bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                         +12
                      </div>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className={cn("rounded-3xl p-6 border border-white/5 flex flex-col gap-4", bg)}>
     <div className={cn("p-3 rounded-2xl w-fit", color.replace('text-', 'bg-').replace('400', '500/10'))}>
        <Icon className={cn("h-6 w-6", color)} />
     </div>
     <div>
        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
     </div>
  </div>
);

const ProgressRow = ({ label, val, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white">{val}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${val}%` }}
        className={cn("h-full rounded-full", color)} 
      />
    </div>
  </div>
);

const InfoRow = ({ label, value, icon: Icon, iconColor }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
       <Icon className={cn("h-3.5 w-3.5", iconColor)} />
       <span className="text-xs font-medium text-zinc-500">{label}</span>
    </div>
    <span className="text-xs font-bold text-white">{value}</span>
  </div>
);
