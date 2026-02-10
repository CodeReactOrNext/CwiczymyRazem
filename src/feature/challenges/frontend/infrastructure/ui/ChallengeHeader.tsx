import { ChevronRight, Target } from "lucide-react";
import { useRouter } from "next/router";

export const ChallengeHeader = () => {
  const router = useRouter();

  return (
<div className="flex flex-col gap-6 mb-12">
      <div className="bg-white rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-200/60 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight leading-none">
            Challenge Hub
          </h1>
        </div>

        <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
          <button 
            onClick={() => router.push('/profile/skills')}
            className="group flex items-center justify-center gap-2 px-5 h-10 rounded-lg bg-black hover:bg-zinc-900 transition-all text-white"
          >
            <span className="text-xs font-semibold">
              Your Progress
            </span>
            <ChevronRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <Target size={180} strokeWidth={0.8} className="text-black" />
        </div>
      </div>
    </div>
  );
};
