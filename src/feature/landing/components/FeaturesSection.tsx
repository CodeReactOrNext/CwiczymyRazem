"use client";

import { AchievementCard } from "feature/achievements/components/Card/AchievementCard";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { 
    Brain, Music2, TrendingUp, Zap, Target, Flame, 
    Sparkles, Search, ClipboardCheck, ClipboardList, 
    Library, ChevronRight, LayoutGrid, Clock, Star,
    CheckCircle2, Trophy
} from "lucide-react";
import { useMemo } from "react";
import { LandingSongCard } from "./LandingSongCard";

export const FeaturesSection = () => {
  const MOCK_SONGS = [
    {
      id: "1",
      title: "Master of Puppets",
      artist: "Metallica",
      avgDifficulty: 8.9,
      coverUrl: "https://i.scdn.co/image/ab67616d0000b273668e3aca3167e6e569a9aa20",
      popularity: 1240
    },
    {
      id: "2",
      title: "Wish You Were Here",
      artist: "Pink Floyd",
      avgDifficulty: 3.5,
      coverUrl: "https://i.scdn.co/image/ab67616d0000b273828e52cfb7bf22869349799e",
      popularity: 850
    },
    {
        id: "3",
        title: "Scarlet",
        artist: "Periphery",
        avgDifficulty: 9.2,
        coverUrl: "https://i.scdn.co/image/ab67616d0000b2735e07ee269b03adc236d0d6ae",
        popularity: 420
    }
  ];

  const activityData = useMemo(() => {
    return Array.from({ length: 42 }).map(() => 
      Array.from({ length: 7 }).map(() => 
        Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0
      )
    );
  }, []);

  const grainOverlay = "before:content-[''] before:absolute before:inset-0 before:opacity-[0.03] before:pointer-events-none before:bg-[url('/static/images/old_effect_dark.webp')] before:z-50";

  const navigationCards = [
    { title: "Report Practice", desc: "Save and log your manual practice session.", icon: <ClipboardCheck className="w-5 h-5" />, color: "cyan", action: "Log Now" },
    { title: "Play Songs", desc: "Practice real songs from your library.", icon: <Music2 className="w-5 h-5" />, color: "purple", action: "Choose a Song" },
    { title: "Guided Routine", desc: "Follow a structured daily workout.", icon: <ClipboardList className="w-5 h-5" />, color: "green", action: "Start Plan" },
    { title: "Generate Session", desc: "A ready-to-play session prepared for you.", icon: <Sparkles className="w-5 h-5" />, color: "amber", action: "Start Auto" }
  ];

  const dailyQuests = [
    { title: "Complete a Practice Plan", pts: "100", done: true },
    { title: "Generate & Practice Auto Plan", pts: "100", done: false },
    { title: "Add song to 'Want to Learn'", pts: "50", done: false },
  ];

  return (
    <section id='features' className={`relative py-32 overflow-hidden bg-zinc-950 ${grainOverlay}`}>
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-teal-500/5 blur-[150px] rounded-full"></div>
      </div>

      <div className='mx-auto max-w-7xl px-6 lg:px-8 relative z-10'>
        {/* Header Section */}
        <div className='max-w-3xl mb-12'>
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
           >
            <h2 className='text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6'>
                The Platform
            </h2>
            <h3 className='text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6'>
              Unfair advantage <br />
              <span className="text-zinc-600">for your practice.</span>
            </h3>
          </motion.div>
        </div>

        {/* Portal-like Layout */}
        <div className="flex flex-col gap-6">
            
            {/* Top Navigation Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {navigationCards.map((card, i) => (
                    <div 
                        key={i}
                        className={cn(
                            "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 p-4 shadow-lg transition-all duration-300",
                            "hover:ring-1 hover:ring-white/10"
                        )}
                    >
                        <div className="relative z-10 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-[12px] font-black tracking-wider text-white uppercase">{card.title}</h4>
                                <p className="text-[10px] font-medium text-zinc-500 leading-relaxed max-w-[150px]">{card.desc}</p>
                            </div>
                            <div className={cn(
                                "rounded-xl p-2.5 shadow-2xl transition-all duration-500 group-hover:scale-110",
                                card.color === "cyan" && "bg-cyan-500/10 text-cyan-400",
                                card.color === "purple" && "bg-purple-500/10 text-purple-400",
                                card.color === "green" && "bg-emerald-500/10 text-emerald-400",
                                card.color === "amber" && "bg-amber-500/10 text-amber-400"
                            )}>
                                {card.icon}
                            </div>
                        </div>
                        <div className="relative z-10 mt-6 flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-zinc-500 transition-colors group-hover:text-white uppercase">
                            <span>{card.action}</span>
                            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </div>
                        <div className={cn(
                            "absolute top-0 right-0 -mt-10 -mr-10 w-24 h-24 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full",
                            card.color === "cyan" && "bg-cyan-500",
                            card.color === "purple" && "bg-purple-500",
                            card.color === "green" && "bg-emerald-500",
                            card.color === "amber" && "bg-amber-500"
                        )} />
                    </div>
                ))}
            </div>

            {/* Main Activity Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Daily Quests - Left Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-zinc-400" />
                                <h4 className="text-[11px] font-black text-white/50 uppercase tracking-widest">Daily Quests</h4>
                            </div>
                            <span className="text-[9px] font-bold text-zinc-600">27.01.2026</span>
                        </div>
                        <div className="space-y-3">
                            {dailyQuests.map((quest, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 group hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                            quest.done ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-zinc-800 text-transparent"
                                        )}>
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                        <span className={cn("text-[11px] font-bold transition-opacity", quest.done ? "text-zinc-300" : "text-zinc-500")}>{quest.title}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-500/60 uppercase">+{quest.pts} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-gradient-to-br from-orange-500/10 to-transparent p-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-white uppercase tracking-tighter">24 Day Streak</div>
                            <div className="text-[10px] font-bold text-zinc-600 uppercase">Limitless Potential</div>
                        </div>
                    </div>
                </div>

                {/* Growth Pulse Activity - Main Center Column */}
                <div className="lg:col-span-8 rounded-xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-bold text-white tracking-tight">Activity</h4>
                        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                            {['2024', '2025', '2026'].map((year) => (
                                <div key={year} className={cn(
                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-colors",
                                    year === '2026' ? "bg-white/10 text-white" : "text-zinc-600"
                                )}>{year}</div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        {/* Day Labels */}
                        <div className="flex flex-col justify-between text-[11px] font-bold text-zinc-600 h-[128px] py-1 shrink-0">
                            <span>Mon</span>
                            <span>Thu</span>
                            <span>Sun</span>
                        </div>
                        
                        {/* Heatmap Grid - Exact Portal Specs */}
                        <div className="flex-1 overflow-hidden">
                            <div className="flex gap-[5px] h-[128px]">
                                {activityData.map((week, i) => (
                                    <div key={i} className="flex flex-col gap-[5px] shrink-0">
                                        {week.map((level, j) => (
                                            <div 
                                                key={j}
                                                className={cn(
                                                    "w-[14px] h-[14px] rounded-[3px] transition-colors duration-300",
                                                    level === 0 ? "bg-[#3f3f46]/30" :
                                                    level === 1 ? "bg-[#A5F3FC]" :
                                                    level === 2 ? "bg-[#67E8F9]" :
                                                    level === 3 ? "bg-[#22D3EE]" :
                                                    level === 4 ? "bg-[#06B6D4]" : "bg-[#0891B2]"
                                                )}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Less</span>
                        <div className="flex gap-[5px]">
                            {['#3f3f46', '#A5F3FC', '#67E8F9', '#22D3EE', '#06B6D4', '#0891B2'].map((color, i) => (
                                <div key={i} className="w-[14px] h-[14px] rounded-[3px]" style={{ backgroundColor: i === 0 ? color + '4d' : color }} />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">More</span>
                    </div>
                </div>
            </div>

            {/* Achievements & Library Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Achievement Showcase - Balanced Size */}
                <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">128 Unlocked</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Achievements Map</h4>
                        </div>

                        <div className="flex justify-between items-center py-6 px-4 gap-4">
                            <div className="flex flex-col items-center gap-4 group cursor-pointer lg:scale-100 scale-90">
                                <div className="p-1 rounded-2xl transition-all duration-500 bg-white/5 group-hover:bg-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                    <div className="scale-[1.8] py-4 px-3 flex items-center justify-center">
                                         <AchievementCard id="fire" />
                                    </div>
                                </div>
                                <div className="text-center group-hover:translate-y-[-2px] transition-transform duration-500">
                                    <div className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">Fire Practice</div>
                                    <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Very Rare</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4 group cursor-pointer lg:scale-110 scale-95">
                                <div className="p-1 rounded-2xl transition-all duration-500 bg-purple-500/5 group-hover:bg-purple-500/10 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                                    <div className="scale-[2.4] py-6 px-4 flex items-center justify-center">
                                         <AchievementCard id="lvl100" />
                                    </div>
                                </div>
                                <div className="text-center group-hover:translate-y-[-2px] transition-transform duration-500">
                                    <div className="text-[12px] font-black text-white uppercase tracking-wider mb-0.5">Elite Master</div>
                                    <div className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Epic Rarity</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4 group cursor-pointer lg:scale-100 scale-90">
                                <div className="p-1 rounded-2xl transition-all duration-500 bg-cyan-500/5 group-hover:bg-cyan-500/10 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                                    <div className="scale-[1.8] py-4 px-3 flex items-center justify-center">
                                         <AchievementCard id="diamond" />
                                    </div>
                                </div>
                                <div className="text-center group-hover:translate-y-[-2px] transition-transform duration-500">
                                    <div className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">Diamond Pick</div>
                                    <div className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Rare</div>
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 text-[9px] font-black text-zinc-700 text-center uppercase tracking-[0.4em] leading-relaxed">
                            Collect 3D Holo Achievements <br /> with every milestone reached.
                        </p>
                    </div>
                </div>

                {/* Song Library */}
                <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Library className="w-5 h-5 text-cyan-400" />
                            <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Intelligence</h4>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="text-[10px] font-black text-white uppercase tracking-widest opacity-40">Filters Active:</div>
                             <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded uppercase">Technique Level 8</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {MOCK_SONGS.slice(0, 2).map((song) => (
                            <div key={song.id} className="h-44">
                                <LandingSongCard song={song} />
                            </div>
                        ))}
                        <div className="h-44 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-white/20 transition-all bg-white/[0.02] hover:bg-white/[0.04]">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:translate-y-[-2px] transition-transform">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Explore Library</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Technical Footer Trace */}
        <div className="mt-24 pt-8 border-t border-white/5 flex justify-between items-center opacity-30">
            <div className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500">SYSTEM.LOG_v.2.0.4</div>
            <div className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500">SYNC_STATUS: 100%_SECURE</div>
        </div>
      </div>
    </section>
  );
};

const Plus = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14m-7-7h14"/></svg>
);
