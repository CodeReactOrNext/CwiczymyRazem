import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { FaSync, FaGem } from "react-icons/fa";
import React, { useEffect } from "react";

interface SuccessRewardCardProps {
  displayedPoints: number;
  fameEarned?: number;
  currentLevel: number;
  prevProgressPercent: number;
  currProgressPercent: number;
  skillRewardSkillId?: string;
  skillRewardAmount?: number;
  skillPointsGained?: Record<string, number>;
  onRestart?: () => void;
  onContinue?: () => void;
}

export const SuccessRewardCard = ({
  displayedPoints,
  fameEarned,
  currentLevel,
  prevProgressPercent,
  currProgressPercent,
  skillRewardSkillId,
  skillRewardAmount,
  skillPointsGained,
  onRestart,
  onContinue
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
       className='relative flex flex-col items-center justify-center bg-zinc-900 border border-white/5 p-8 sm:p-10 rounded-2xl shadow-xl overflow-visible mb-4 group'
    >
        <div className="flex flex-col md:flex-row items-center justify-center w-full relative z-10 gap-6 md:gap-12 mb-8 md:mb-10">
           
           {/* Text Content */}
           <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2"
              >
                  Great Progress!
              </motion.h1>
              <motion.div
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                 className="flex items-end gap-2 text-white"
              >
                 <span className="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight">+{displayedPoints}</span>
                 <span className="text-lg font-bold text-orange-500 mb-1 tracking-wider">XP</span>
              </motion.div>
              {fameEarned != null && fameEarned > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-1.5 mt-1"
                >
                  <FaGem className="text-amber-400" size={13} />
                  <span className="text-sm font-black text-amber-400 tracking-widest">+{fameEarned} Fame</span>
                </motion.div>
              )}
           </div>

        </div>

        <div className="flex flex-col items-center relative z-10 text-center mb-10 w-full">
               {skillPointsGained && Object.keys(skillPointsGained).length > 0 && (
                 <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {Object.entries(skillPointsGained).map(([skillId, points], index) => {
                      const name = skillId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                      return (
                        <motion.div
                          key={skillId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + (index * 0.1), duration: 0.5 }}
                          className="flex items-center gap-2 bg-[#1c1c1c] border border-white/5 px-3 py-1.5 rounded-md shadow-sm"
                        >
                          <span className="text-zinc-300 font-semibold text-xs tracking-wide">
                             <span className="text-orange-400 mr-1">+{points}</span>{name}
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
                    className="flex items-center gap-2 bg-[#1c1c1c] border border-white/5 px-3 py-1.5 rounded-md shadow-sm"
                  >
                    <span className="text-zinc-300 font-semibold text-xs tracking-wide">
                       <span className="text-orange-400 mr-1">+{skillRewardAmount}</span>{skillName}
                    </span>
                  </motion.div>
               )}
            </div>

        <div className='max-w-xl w-full relative z-10 space-y-6'>
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end px-1">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Level Progress</span>
                       <h4 className="text-[15px] font-medium text-white tracking-wide">Level {currentLevel} <span className="text-zinc-600 mx-1">→</span> {currentLevel+1}</h4>
                    </div>
                    <span className="text-base font-bold text-zinc-300 tabular-nums leading-none mb-1">{Math.round(currProgressPercent)}%</span>
                </div>
                
                <div className='relative h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden'>
                    <motion.div
                        initial={{ width: `${prevProgressPercent}%` }}
                        animate={{ width: `${currProgressPercent}%` }}
                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                        className='absolute inset-y-0 left-0 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                    />
                </div>

            {(onRestart || onContinue) && (
              <div className="flex justify-center gap-4 pt-8">
                {onRestart && (
                  <motion.button
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRestart}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#1c1c1c] border border-white/5 text-zinc-300 font-medium text-xs tracking-wide transition-all shadow-sm"
                  >
                    <FaSync className="h-3 w-3 text-zinc-400" />
                    Repeat Session
                  </motion.button>
                )}
                {onContinue && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onContinue}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs tracking-wide transition-all shadow-md"
                  >
                    Continue <span>→</span>
                  </motion.button>
                )}
              </div>
            )}
            </div>
          </div>
        </motion.div>
  );
};
