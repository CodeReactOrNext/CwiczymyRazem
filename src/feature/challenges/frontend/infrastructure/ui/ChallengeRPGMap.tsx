import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import { ArrowUpCircle, Gift, Lock, Play, Shield, Star, Swords, Trophy, Wand2, X, Sparkles, ChevronRight, Zap } from "lucide-react";
import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";
import { useEffect,useState } from "react";
import { createPortal } from "react-dom";

import type { Challenge } from "../../../backend/domain/models/Challenge";

interface ChallengeRPGMapProps {
  challengesByCategory: Record<string, Record<string, Challenge[]>>;
  completedChallenges: string[];
  activeChallenges: any[];
  userSkills?: Record<string, number>;
  onPractice: (challenge: Challenge) => void;
  onAdd: (challenge: Challenge) => void;
  onStart: (challenge: Challenge) => void;
}

export const ChallengeRPGMap = ({ 
  challengesByCategory, 
  completedChallenges,
  activeChallenges,
  userSkills = {},
  onPractice,
  onStart
 }: ChallengeRPGMapProps) => {
  const [activeNode, setActiveNode] = useState<{ challenge: Challenge; rect: DOMRect; cat: any; theme: any } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setActiveNode(null);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { id: 'technique', name: 'Technique', icon: TechniqueIcon },
    { id: 'theory', name: 'Theory', icon: TheoryIcon },
    { id: 'hearing', name: 'Hearing', icon: HearingIcon },
    { id: 'creativity', name: 'Creativity', icon: CreativityIcon },
  ];

  const handleNodeClick = (e: React.MouseEvent, challenge: Challenge, cat: any, theme: any) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (activeNode?.challenge.id === challenge.id) {
      setActiveNode(null);
    } else {
      setActiveNode({ challenge, rect, cat, theme });
    }
  };

  return (
    <div className="mb-24 space-y-12">
      <div className="flex flex-col gap-1 px-1">
         <h2 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap size={12} className="text-blue-500" />
            Skill Mapping
         </h2>
         <p className="text-xl font-bold text-white tracking-tight">Your evolution journey</p>
      </div>

      <div className="grid grid-cols-1 gap-16">
          {Object.entries(challengesByCategory).map(([catId, skillsMap]) => {
            const predefined = categories.find(c => c.id === catId);
            const theme = getSkillTheme(catId as any);
            const cat = predefined || { 
              id: catId, 
              name: catId.charAt(0).toUpperCase() + catId.slice(1), 
              icon: Trophy
            };
            
            const skillIds = Object.keys(skillsMap);
            const allChallenges = Object.values(skillsMap).flat();
            const completedCount = allChallenges.filter(c => completedChallenges.includes(c.id)).length;
            const progress = allChallenges.length > 0 ? (completedCount / allChallenges.length) : 0;
            const CatIcon = cat.icon;

            return (
              <div key={cat.id} className="w-full rounded-lg bg-[#0a0a0a] border border-zinc-900 p-6 md:p-8 flex flex-col gap-10 relative overflow-hidden shadow-xl">
                {/* Visual Background Decoration */}
                <div className={cn(
                  "absolute top-0 left-0 w-48 h-48 blur-[80px] opacity-[0.05] pointer-events-none",
                  theme.glow
                )} />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                     <div className={cn(
                       "w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-900 flex items-center justify-center shadow-lg",
                       theme.primary
                     )}>
                        <CatIcon size="large" className="text-[28px]" />
                     </div>
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Map Track</span>
                       <h3 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">{cat.name}</h3>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] font-bold text-zinc-500">
                            {completedCount} <span className="text-zinc-700">/ {allChallenges.length} Mastered</span>
                          </span>
                       </div>
                     </div>
                  </div>

                  <div className="flex flex-col items-end gap-2.5 min-w-[180px]">
                    <div className="flex items-center justify-between w-full">
                       <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Category Completion</span>
                       <span className="text-[11px] font-bold text-white tracking-widest">{Math.round(progress * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                       <div 
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out", theme.glow)}
                        style={{ width: `${progress * 100}%` }}
                       />
                    </div>
                  </div>
                </div>

                {/* Skill Journey Grid */}
                <div className="flex flex-wrap gap-x-12 md:gap-x-16 gap-y-20 flex-1 items-start justify-center md:justify-start relative z-10 px-4">
                  {skillIds.map((skillId) => {
                    const skillData = guitarSkills.find(s => s.id === skillId);
                    const SkillIcon = skillData?.icon || Trophy;
                    const challenges = [...skillsMap[skillId]].sort((a, b) => a.requiredLevel - b.requiredLevel);
                    const currentSkillLevel = userSkills ? (userSkills[skillId] || 0) : 0;

                    return (
                      <div key={skillId} className="flex flex-col items-center gap-8 min-w-[70px]">
                        {/* Skill Node Hub */}
                        <div className="flex flex-col items-center gap-3 group/hub">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center bg-zinc-900 border transition-all duration-300 shadow-md",
                            currentSkillLevel > 0 ? theme.border : "border-zinc-800 text-zinc-700",
                            currentSkillLevel > 0 && theme.primary
                          )}>
                             <SkillIcon size={18} />
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-bold text-white uppercase tracking-tight text-center leading-tight max-w-[90px]">
                              {skillData?.name || skillId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                            <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                              Lvl {currentSkillLevel}
                            </span>
                          </div>
                        </div>
                        
                        {/* Journey Nodes */}
                        <div className="flex flex-col items-center gap-16 w-full">
                        {challenges.map((challenge, cIdx) => {
                          const isDone = completedChallenges.includes(challenge.id);
                          const isActive = activeChallenges.some(ac => ac.challengeId === challenge.id);
                          const isRequirementMet = currentSkillLevel >= challenge.requiredLevel;
                          const isAvailable = !isDone && isRequirementMet && (!challenge.dependsOn || completedChallenges.includes(challenge.dependsOn));
                          const isSelected = activeNode?.challenge.id === challenge.id;

                          return (
                            <div key={challenge.id} className="relative">
                              {/* Connector Logic */}
                              {cIdx > 0 && (
                                <div className={cn(
                                  "absolute -top-16 left-1/2 -translate-x-1/2 w-[2px] h-16",
                                  isDone ? theme.bg : isAvailable ? "bg-zinc-800" : "bg-zinc-900/40"
                                )} />
                              )}

                              {/* Target Node */}
                              <button 
                                onClick={(e) => handleNodeClick(e, challenge, cat, theme)}
                                className={cn(
                                "w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10 shadow-lg border-2",
                                isDone 
                                    ? "bg-white border-white text-black" 
                                    : isAvailable
                                      ? "bg-[#111111] border-zinc-800 text-white hover:border-zinc-700"
                                      : "bg-[#050505] border-zinc-900 text-zinc-800 opacity-40 cursor-not-allowed",
                                isSelected && "ring-2 ring-white/20 ring-offset-2 ring-offset-[#0a0a0a]"
                              )}>
                                 <SkillIcon size={18} strokeWidth={1.5} />
                                 
                                 {isActive && (
                                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white shadow-lg">
                                      <Play size={10} fill="currentColor" />
                                   </div>
                                 )}

                                 {!isDone && !isAvailable && (
                                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zinc-900 rounded-sm flex items-center justify-center border border-zinc-800">
                                      <Lock size={10} className="text-zinc-600" />
                                   </div>
                                 )}

                                 {isDone && (
                                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-sm flex items-center justify-center text-white shadow-md">
                                      <Zap size={10} fill="currentColor" />
                                   </div>
                                 )}
                              </button>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Simplified RPG Tooltip */}
      {mounted && activeNode && createPortal(
         <div 
          className="fixed inset-0 z-[99999] pointer-events-auto bg-black/40 backdrop-blur-sm sm:bg-transparent flex items-center justify-center sm:block"
          onClick={() => setActiveNode(null)}
         >
            <div 
              className="animate-in fade-in slide-in-from-bottom-2 duration-200 sm:absolute mx-4 sm:mx-0"
              style={{
                ...(typeof window !== 'undefined' && window.innerWidth >= 640 ? {
                  top: activeNode.rect.top + activeNode.rect.height / 2,
                  left: activeNode.rect.right + 24,
                  transform: 'translateY(-50%)',
                  ...(activeNode.rect.right > window.innerWidth / 2 ? {
                    left: 'auto',
                    right: window.innerWidth - activeNode.rect.left + 24,
                  } : {})
                } : {})
              }}
              onClick={(e) => e.stopPropagation()}
            >
               <div className="bg-[#111111] p-6 rounded-lg shadow-2xl flex flex-col gap-5 w-[320px] relative border border-zinc-800">
                  <button 
                    onClick={() => setActiveNode(null)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>

                  <div className="pr-6">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Module {activeNode.challenge.requiredLevel}</span>
                    <h4 className="text-lg font-bold text-white tracking-tight mb-2">{activeNode.challenge.title}</h4>
                    <p className="text-zinc-500 text-[11px] font-medium leading-normal">{activeNode.challenge.description}</p>
                  </div>

                  {/* Requirements */}
                  <div className="bg-zinc-900/50 p-4 rounded-lg flex flex-col gap-3 border border-zinc-800/50">
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Mastery Gate</span>
                            <span className="text-xs font-bold text-zinc-300">Requires Rank {activeNode.challenge.requiredLevel}</span>
                         </div>
                         <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border",
                            (userSkills[activeNode.challenge.requiredSkillId] || 0) >= activeNode.challenge.requiredLevel ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-700"
                         )}>
                            <Trophy size={14} />
                         </div>
                      </div>
                      <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-700", (userSkills[activeNode.challenge.requiredSkillId] || 0) >= activeNode.challenge.requiredLevel ? "bg-emerald-500" : "bg-zinc-700")}
                            style={{ width: `${Math.min(((userSkills[activeNode.challenge.requiredSkillId] || 0) / activeNode.challenge.requiredLevel) * 100, 100)}%` }}
                          />
                      </div>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-transparent">
                    <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Gift size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Reward</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-zinc-200">{activeNode.challenge.rewardDescription || "Mastery Points"}</span>
                           <Sparkles size={11} className="text-zinc-500" />
                        </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {activeChallenges.some(ac => ac.challengeId === activeNode.challenge.id) ? (
                      <button 
                        onClick={() => { onPractice(activeNode.challenge); setActiveNode(null); }}
                        className="w-full h-11 bg-white text-black rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Play size={14} fill="currentColor" />
                        Resume Training
                      </button>
                    ) : (completedChallenges.includes(activeNode.challenge.id) || ((userSkills[activeNode.challenge.requiredSkillId] || 0) >= activeNode.challenge.requiredLevel)) ? (
                      <button 
                        onClick={() => { 
                          if (completedChallenges.includes(activeNode.challenge.id)) onPractice(activeNode.challenge);
                          else onStart(activeNode.challenge); 
                          setActiveNode(null); 
                        }}
                        className={cn(
                          "w-full h-11 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg",
                          completedChallenges.includes(activeNode.challenge.id) 
                            ? "bg-zinc-800 text-white hover:bg-zinc-700" 
                            : "bg-white text-black hover:bg-zinc-100"
                        )}
                      >
                        {completedChallenges.includes(activeNode.challenge.id) ? (
                          <>Mastery Rewatch <ChevronRight size={14} /></>
                        ) : (
                          <>Unlock Node <ChevronRight size={14} /></>
                        )}
                      </button>
                    ) : (
                      <div className="w-full h-11 bg-zinc-900/50 border border-zinc-800/50 rounded-lg flex items-center justify-center gap-2">
                        <Lock size={12} className="text-zinc-700" />
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Locked</span>
                      </div>
                    )}
                  </div>
               </div>
            </div>
         </div>,
         document.body
      )}
    </div>
  );
};
