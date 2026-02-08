import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import React, { useEffect } from "react";

interface SuccessRewardCardProps {
  displayedPoints: number;
  currentLevel: number;
  prevProgressPercent: number;
  currProgressPercent: number;
}

export const SuccessRewardCard = ({
  displayedPoints,
  currentLevel,
  prevProgressPercent,
  currProgressPercent,
}: SuccessRewardCardProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
        const end = Date.now() + 2 * 1000;
        const colors = ['#06b6d4', '#ffffff', '#22d3ee'];

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0.5, y: 0.4 },
            colors: colors
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 0.5, y: 0.4 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
       initial={{ opacity: 0, y: 30, scale: 0.98 }}
       animate={{ opacity: 1, y: 0, scale: 1 }}
       transition={{ 
          type: "spring",
          damping: 25,
          stiffness: 100,
          delay: 0.1 
       }}
       className='relative flex flex-col items-center justify-center bg-zinc-900/40 p-10 sm:p-12 rounded-lg backdrop-blur-3xl shadow-2xl overflow-hidden mb-8 group'
    >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent opacity-50" />
        
        <div className="flex flex-col items-center text-center relative z-10 mb-10">
           <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
              className="relative mb-4"
           >
              <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                 className="absolute -inset-4 border border-cyan-500/10 rounded-full"
              />
              <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                 className="absolute -inset-6 border border-white/5 rounded-full"
              />

              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-zinc-900 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                 <motion.div
                    animate={{ 
                       scale: [1, 1.2, 1],
                       filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                 >
                   <Zap className="h-8 w-8 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                 </motion.div>
              </div>

              {[0, 72, 144, 216, 288].map((angle, i) => (
                 <motion.div
                    key={i}
                    animate={{ 
                       y: [0, -10, 0],
                       opacity: [0, 1, 0],
                       scale: [0, 1, 0]
                    }}
                    transition={{ 
                       duration: 2, 
                       repeat: Infinity, 
                       delay: i * 0.4,
                       ease: "easeInOut"
                    }}
                    className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400"
                    style={{
                       top: '50%',
                       left: '50%',
                       transform: `rotate(${angle}deg) translate(28px) rotate(-${angle}deg)`
                    }}
                 />
              ))}
           </motion.div>

           <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              Great Progress!
           </h1>
           
        </div>

        <div className="flex flex-col items-center relative z-10 text-center mb-10">
           <div className="flex items-center gap-4">
              <span className="text-8xl sm:text-9xl font-black text-white tracking-tighter drop-shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-transform group-hover:scale-105 duration-700">{displayedPoints}</span>
              <span className="text-3xl font-black text-cyan-500 uppercase tracking-tighter leading-none">XP</span>
           </div>
        </div>
        
        <div className='max-w-xl w-full relative z-10 space-y-5'>
            <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                    <h4 className="text-lg font-bold text-white tracking-tight">Level {currentLevel} <span className="text-zinc-500 mx-2">→</span> {currentLevel+1}</h4>
                    <span className="text-xl font-black text-cyan-500 tabular-nums leading-none">{Math.round(currProgressPercent)}%</span>
                </div>
                
                <div className='relative h-3 w-full rounded-full bg-zinc-950 p-0.5 overflow-hidden border border-white/5'>
                    <motion.div
                        initial={{ width: `${prevProgressPercent}%` }}
                        animate={{ width: `${currProgressPercent}%` }}
                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                        className='relative h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:12px_12px] animate-[progress-stripe_2s_linear_infinite]" />
                    </motion.div>
                </div>
            </div>
        </div>
    </motion.div>
  );
};
