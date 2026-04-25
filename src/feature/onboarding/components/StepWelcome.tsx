import { cn } from "assets/lib/utils";
import { Crown, Guitar, Play, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";

/* ───────────────────────────────────────
   Animated XP / level loop
─────────────────────────────────────── */
function useXpLoop() {
  const [xp, setXp] = useState(40);
  const [level, setLevel] = useState(6);

  useEffect(() => {
    const interval = setInterval(() => {
      setXp((prev) => {
        const next = prev + 6;
        if (next >= 100) {
          setLevel((l) => l + 1);
          return 8;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return { xp, level };
}

/* ───────────────────────────────────────
   Main
─────────────────────────────────────── */
export const StepWelcome = () => {
  const { xp, level } = useXpLoop();

  return (
    <div className='flex flex-col items-center justify-center space-y-10 text-center pb-8'>
      
      {/* Hero Visual */}
      <div className='relative mt-4'>
        <div className='absolute inset-0 bg-orange-500/20 blur-3xl rounded-full' />
        <div className='relative flex items-center justify-center'>
          <div className='relative rounded-[2rem] bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 p-8 shadow-2xl border border-white/10'>
            <Guitar className='h-16 w-16 text-white/90' strokeWidth={1.5} />
            <div className='absolute -top-3 -right-3 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl'>
              <span className='text-sm font-black text-zinc-950 tabular-nums'>{level}</span>
            </div>
            
            {/* Mini XP Bar */}
            <div className='absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 bg-zinc-950 rounded-full p-1 border border-white/10 shadow-lg'>
               <div className='h-2 rounded-full bg-white/5 overflow-hidden w-full'>
                <div
                  className='h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700'
                  style={{ width: `${xp}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intro copy */}
      <div className='max-w-xs space-y-3'>
        <p className='text-xs font-bold tracking-[0.2em] uppercase text-orange-400'>
          Riff Quest
        </p>
        <h2 className='text-3xl font-black text-white leading-tight'>
          Guitar practice,<br/>as an RPG
        </h2>
        <p className='text-base text-zinc-400 leading-relaxed font-medium'>
          Play guitar. We count the time, award XP, and you level up. 
        </p>
      </div>

      {/* Quick Loop */}
      <div className='grid grid-cols-2 gap-4 w-full max-w-sm'>
        {[
          { label: "Play", icon: Play, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Earn XP", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Level up", icon: Crown, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Unlock", icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className='flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-white/5'>
              <div className={cn("p-2 rounded-xl", item.bg, item.color)}>
                <Icon className='h-5 w-5' fill={i === 0 ? "currentColor" : "none"} />
              </div>
              <span className='text-sm font-bold text-white'>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
