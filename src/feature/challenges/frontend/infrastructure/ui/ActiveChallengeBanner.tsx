import { Trophy, Calendar, CheckCircle2, Play, XCircle } from "lucide-react";
import { cn } from "assets/lib/utils";
import { ActiveChallenge, Challenge } from "../../../backend/domain/models/Challenge";

interface ActiveChallengeBannerProps {
  activeChallenge: ActiveChallenge;
  challengeData: Challenge;
  onStart: (challenge: Challenge) => void;
  onAbandon: (id: string) => void;
}

export const ActiveChallengeBanner = ({ 
  activeChallenge, 
  challengeData, 
  onStart, 
  onAbandon 
}: ActiveChallengeBannerProps) => {
  return (
    <div className="mt-4 overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl shadow-2xl relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-main/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="p-5 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
          <div className="relative">
              <div className="w-20 h-20 bg-zinc-950 rounded-2xl border border-white/10 flex items-center justify-center text-main shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <Trophy size={36} fill="currentColor" className="opacity-80" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-main text-black flex items-center justify-center font-black text-xs shadow-lg">
                  {activeChallenge.currentDay}
              </div>
          </div>
          
          <div>
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded bg-main/10 text-main text-[9px] font-black uppercase tracking-widest">Active Quest</span>
                  <span className="h-[1px] w-8 bg-zinc-800" />
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-tight">
                      Day {activeChallenge.currentDay} of {activeChallenge.totalDays}
                  </span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
                {challengeData.title}
              </h3>
              
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                 <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-600" />
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                      Ends in {activeChallenge.totalDays - activeChallenge.currentDay + 1} Days
                    </span>
                 </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {Array.from({ length: activeChallenge.totalDays }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const isCompleted = dayNum < activeChallenge.currentDay;
                      const isCurrent = dayNum === activeChallenge.currentDay;
                      
                      return (
                          <div 
                              key={dayNum} 
                              className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 border",
                                  isCompleted 
                                      ? "bg-main border-main text-white shadow-[0_4px_12px_rgba(var(--main-rgb),0.3)]" 
                                      : isCurrent 
                                          ? "bg-main/10 border-main/50 text-main shadow-[0_0_15px_rgba(var(--main-rgb),0.1)]" 
                                          : "bg-zinc-800/30 border-white/5 text-zinc-600"
                              )}
                          >
                              {isCompleted ? <CheckCircle2 size={12} strokeWidth={3} /> : <span className="text-[10px] font-bold">{dayNum}</span>}
                          </div>
                      );
                  })}
              </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
              onClick={() => onStart(challengeData)}
              className="px-6 py-3 rounded-xl bg-main text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-main/20 hover:scale-105 transition-all flex items-center gap-2"
          >
              <Play size={16} fill="currentColor" />
              Practice
          </button>
          <button
              onClick={() => onAbandon(activeChallenge.challengeId)}
              className="px-5 py-3 rounded-xl bg-zinc-950 border border-white/5 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group/btn"
          >
              <XCircle size={16} className="group-hover/btn:rotate-90 transition-transform" />
              Abandon
          </button>
        </div>
      </div>
    </div>
  );
};
