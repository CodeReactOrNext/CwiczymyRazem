import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { FaSync } from "react-icons/fa";
import React, { useEffect } from "react";

interface SuccessRewardCardProps {
  displayedPoints: number;
  currentLevel: number;
  prevProgressPercent: number;
  currProgressPercent: number;
  skillRewardSkillId?: string;
  skillRewardAmount?: number;
  skillPointsGained?: Record<string, number>;
  onRestart?: () => void;
}

export const SuccessRewardCard = ({
  displayedPoints,
  currentLevel,
  prevProgressPercent,
  currProgressPercent,
  skillRewardSkillId,
  skillRewardAmount,
  skillPointsGained,
  onRestart
}: SuccessRewardCardProps) => {
  const skillName = skillRewardSkillId ? skillRewardSkillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "";

  useEffect(() => {
    const timer = setTimeout(() => {
        const end = Date.now() + 2 * 1000;
        const colors = ['#f97316', '#ffffff', '#fb923c'];

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
       className='relative flex flex-col items-center justify-center bg-zinc-900/40 p-8 sm:p-10 rounded-lg backdrop-blur-3xl shadow-2xl overflow-visible mb-8 group mt-16 md:mt-20'
    >
        {/* Ambient background glow - Subtler */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/5 via-transparent to-transparent opacity-40 rounded-lg" />
        
        <div className="flex flex-col md:flex-row items-center justify-center w-full relative z-10 gap-6 md:gap-12 mb-8 md:mb-10">
           
           {/* Text Content */}
           <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-4xl font-black text-orange-500 tracking-tight mb-1 uppercase italic leading-none"
              >
                  Great Progress!
              </motion.h1>
              <motion.div
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                 className="flex items-center gap-2 text-orange-400"
              >
                 <span className="text-5xl sm:text-6xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_8px_rgba(249,115,22,0.2)]">+{displayedPoints}</span>
                 <span className="text-base font-black text-orange-500/70 mt-3 uppercase tracking-widest">XP</span>
              </motion.div>
           </div>

           {/* Character Visual - Sticking out from the top */}
           <div className="relative md:absolute md:-top-24 md:right-4 group/char">
              {/* Subtle Character Glow Effect - Static */}
              <div 
                 className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full scale-125 pointer-events-none opacity-20" 
              />
              
              <motion.img 
                 initial={{ opacity: 0, y: 100, scale: 0.8 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ 
                   delay: 0.4, 
                   type: "spring", 
                   stiffness: 80, 
                   damping: 15 
                 }}
                 src="/images/3d/summary.png" 
                 alt="Summary Character" 
                 className="relative h-[220px] sm:h-[300px] w-auto object-contain pointer-events-none select-none drop-shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
              />
           </div>
        </div>

        <div className="flex flex-col items-center relative z-10 text-center mb-10 w-full">
               {skillPointsGained && Object.keys(skillPointsGained).length > 0 && (
                 <div className="flex flex-wrap justify-center gap-2.5 mt-2">
                    {Object.entries(skillPointsGained).map(([skillId, points], index) => {
                      const name = skillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                      return (
                        <motion.div
                          key={skillId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + (index * 0.1), duration: 0.5 }}
                          className="flex items-center gap-2 bg-gradient-to-r from-orange-500/15 to-orange-600/5 border border-orange-500/20 px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg shadow-orange-500/5"
                        >
                          <span className="text-orange-400 font-bold text-[10px] tracking-widest uppercase">
                             +{points} {name}
                          </span>
                        </motion.div>
                      );
                    })}
                 </div>
               )}

               {skillRewardSkillId && !skillPointsGained && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500/15 to-orange-600/5 border border-orange-500/20 px-4 py-1.5 rounded-full backdrop-blur-md"
                  >
                    <span className="text-orange-400 font-bold text-[10px] tracking-widest uppercase">
                       +{skillRewardAmount} {skillName}
                    </span>
                  </motion.div>
               )}
            </div>

        <div className='max-w-xl w-full relative z-10 space-y-5'>
            <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500/50 mb-0.5">Level Progress</span>
                       <h4 className="text-xl font-black text-white tracking-tight italic">Level {currentLevel} <span className="text-zinc-700 mx-1 not-italic">→</span> {currentLevel+1}</h4>
                    </div>
                    <span className="text-2xl font-black text-orange-500 tabular-nums leading-none tracking-tighter">{Math.round(currProgressPercent)}%</span>
                </div>
                
                <div className='relative h-4 w-full rounded-full bg-zinc-950 p-1 overflow-hidden border border-white/5'>
                    <motion.div
                        initial={{ width: `${prevProgressPercent}%` }}
                        animate={{ width: `${currProgressPercent}%` }}
                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                        className='relative h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:12px_12px] animate-[progress-stripe_2s_linear_infinite]" />
                    </motion.div>
                </div>

            {onRestart && (
              <div className="flex justify-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(249, 115, 22, 0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRestart}
                  className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:border-orange-500/50 shadow-lg shadow-orange-500/5"
                >
                  <FaSync className="h-3.5 w-3.5" />
                  Repeat Session
                </motion.button>
              </div>
            )}
            </div>
            </div>
        </motion.div>
  );
};
