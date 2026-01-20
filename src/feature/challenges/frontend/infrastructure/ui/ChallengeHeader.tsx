import { ArrowLeft, ChevronRight,Flame } from "lucide-react";
import { useRouter } from "next/router";

interface ChallengeHeaderProps {
  onBack: () => void;
}

export const ChallengeHeader = ({ onBack }: ChallengeHeaderProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 mb-10">
      <button 
        onClick={onBack}
        className="group w-fit flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold tracking-wide"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic leading-none mb-2">
            Challenge <span className="text-main">Map</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-zinc-500">
            Select a theme and complete daily exercises to level up your skills.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/profile/skills')}
            className="group flex items-center gap-4 px-6 py-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-all backdrop-blur-sm active:scale-95"
          >
            <div className="w-10 h-10 rounded-lg bg-main/10 flex items-center justify-center text-main group-hover:scale-110 transition-transform">
               <Flame size={20} />
            </div>
            <div className="flex flex-col items-start leading-none gap-1">
              <span className="text-[10px] tracking-wide font-bold text-zinc-500">View Progress</span>
              <span className="text-sm font-black text-white italic flex items-center gap-2">
                Your Skills <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
