import { ArrowLeft, ChevronRight, Flame, Target, TrendingUp } from "lucide-react";
import { useRouter } from "next/router";

interface ChallengeHeaderProps {
  onBack: () => void;
}

export const ChallengeHeader = ({ onBack }: ChallengeHeaderProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 mb-12">
      <button 
        onClick={onBack}
        className="group w-fit flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to training
      </button>
      
      {/* Refined Hero Banner */}
      <div className="bg-white rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-100 rounded-full blur-2xl -mr-24 -mt-24 pointer-events-none" />
        
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">
              Practice Hub
            </div>
            <div className="flex items-center gap-1 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
              <TrendingUp size={10} />
              Mastery Map
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-3 leading-none">
            Challenge Hub
          </h1>
          
          <p className="text-zinc-500 text-sm max-w-sm font-medium leading-relaxed">
            Select a theme and complete daily exercises to level up.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
          <button 
            onClick={() => router.push('/profile/skills')}
            className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all border border-zinc-200/50"
          >
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white transition-transform shadow-lg shadow-black/5">
               <Flame size={20} />
            </div>
            <div className="flex flex-col items-start leading-none gap-1">
              <span className="text-[9px] tracking-widest font-bold text-zinc-400 uppercase">View Mastery</span>
              <span className="text-sm font-bold text-black flex items-center gap-2">
                Your Progress <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>
        </div>

        {/* Smaller Icon Decoration */}
        <div className="absolute right-8 bottom-0 opacity-[0.02] pointer-events-none transform translate-y-1/4">
          <Target size={200} strokeWidth={1} className="text-black" />
        </div>
      </div>
    </div>
  );
};
