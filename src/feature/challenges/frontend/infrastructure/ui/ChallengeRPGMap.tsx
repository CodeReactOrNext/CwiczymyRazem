import { Trophy, CheckCircle2, Star, Swords, Shield, Wand2, Lock, Gift, ArrowUpCircle, Play, X } from "lucide-react";
import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import { Challenge } from "../../../backend/domain/models/Challenge";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  onAdd,
  onStart
 }: ChallengeRPGMapProps) => {
  const [activeNode, setActiveNode] = useState<{ challenge: Challenge; rect: DOMRect; cat: any } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setActiveNode(null);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { id: 'technique', name: 'Technique', icon: Swords, color: 'text-blue-400', accent: 'blue' },
    { id: 'theory', name: 'Theory', icon: Shield, color: 'text-amber-400', accent: 'amber' },
    { id: 'hearing', name: 'Hearing', icon: Wand2, color: 'text-emerald-400', accent: 'emerald' },
    { id: 'creativity', name: 'Creativity', icon: Star, color: 'text-purple-400', accent: 'purple' },
  ];

  const handleNodeClick = (e: React.MouseEvent, challenge: Challenge, cat: any) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (activeNode?.challenge.id === challenge.id) {
      setActiveNode(null);
    } else {
      setActiveNode({ challenge, rect, cat });
    }
  };

  return (
    <div className="mb-20 space-y-12">
      <div className="flex flex-col gap-1 px-1">
         <h2 className="text-2xl font-black text-white italic tracking-tighter">Skill Mapping</h2>
         <p className="text-[11px] font-bold text-zinc-500 tracking-wide leading-none opacity-80">Track your evolution & start practice</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
          {Object.entries(challengesByCategory).map(([catId, skillsMap]) => {
            const predefined = categories.find(c => c.id === catId);
            const cat = predefined || { 
              id: catId, 
              name: catId.charAt(0).toUpperCase() + catId.slice(1), 
              icon: Trophy, 
              color: 'text-zinc-400', 
              accent: 'zinc' 
            };
            
            const skillIds = Object.keys(skillsMap);
            const allChallenges = Object.values(skillsMap).flat();
            const completedCount = allChallenges.filter(c => completedChallenges.includes(c.id)).length;
            const progress = allChallenges.length > 0 ? (completedCount / allChallenges.length) : 0;
            const CatIcon = cat.icon;

            return (
              <div key={cat.id} className="w-full rounded-xl bg-zinc-900/50 p-8 flex flex-col gap-10 relative overflow-hidden shadow-2xl">
                {/* Header Section */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                     <div className={cn(
                       "w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center",
                       cat.color
                     )}>
                        <CatIcon size={24} strokeWidth={2} />
                     </div>
                     <div className="flex flex-col gap-0.5">
                       <h3 className="text-lg font-black text-white italic tracking-tight">{cat.name}</h3>
                       <span className="text-[10px] font-bold text-zinc-500 tracking-wide leading-none">
                         {completedCount} / {allChallenges.length} Mastered
                       </span>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs font-black text-white tracking-widest">{Math.round(progress * 100)}%</div>
                    <div className="h-1.5 w-24 bg-zinc-950 rounded-full overflow-hidden">
                       <div 
                        className={cn("h-full rounded-full transition-all duration-700", `bg-${cat.accent}-400`)}
                        style={{ width: `${progress * 100}%` }}
                       />
                    </div>
                  </div>
                </div>

                {/* Skill Columns Journey */}
                <div className="flex flex-wrap gap-x-16 gap-y-24 flex-1 items-start justify-center relative z-10">
                  {skillIds.map((skillId) => {
                    const skillData = guitarSkills.find(s => s.id === skillId);
                    const SkillIcon = skillData?.icon || CatIcon;
                    const challenges = [...skillsMap[skillId]].sort((a, b) => a.requiredLevel - b.requiredLevel);
                    const currentSkillLevel = userSkills[skillId] || 0;

                    return (
                      <div key={skillId} className="flex flex-col items-center gap-6 min-w-[70px]">
                        {/* Skill Header with Level */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-950",
                            currentSkillLevel > 0 ? cat.color : "text-zinc-800"
                          )}>
                             <SkillIcon size={16} />
                          </div>
                          <span className="text-[9px] font-bold text-zinc-500 text-center leading-tight max-w-[80px] truncate">
                            {skillData?.name || skillId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "font-black text-[10px] border-none px-2 py-0",
                              currentSkillLevel > 0 ? `bg-${cat.accent}-500/20 text-${cat.accent}-400` : "bg-zinc-800 text-zinc-500"
                            )}
                          >
                            Lvl {currentSkillLevel}
                          </Badge>
                        </div>
                        
                        {/* Challenge Nodes */}
                        <div className="flex flex-col items-center gap-14">
                        {challenges.map((challenge, cIdx) => {
                          const isDone = completedChallenges.includes(challenge.id);
                          const isActive = activeChallenges.some(ac => ac.challengeId === challenge.id);
                          const isRequirementMet = currentSkillLevel >= challenge.requiredLevel;
                          const isAvailable = !isDone && isRequirementMet && (!challenge.dependsOn || completedChallenges.includes(challenge.dependsOn));
                          const isSelected = activeNode?.challenge.id === challenge.id;

                          return (
                            <div key={challenge.id} className="relative">
                              {/* Vertical Connector */}
                              {cIdx > 0 && (
                                <div className={cn(
                                  "absolute -top-14 left-1/2 -translate-x-1/2 w-0.5 h-14",
                                  isDone ? `bg-${cat.accent}-500/40` : isAvailable ? `bg-${cat.accent}-500/20` : "bg-zinc-800"
                                )} />
                              )}

                              {/* Node Element */}
                              <button 
                                onClick={(e) => handleNodeClick(e, challenge, cat)}
                                className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative z-10 shadow-lg",
                                isDone 
                                    ? `bg-${cat.accent}-950 text-${cat.accent}-400` 
                                    : isAvailable
                                      ? "bg-zinc-800 text-zinc-300 shadow-lg"
                                      : "bg-zinc-950 text-zinc-800 opacity-40",
                                isSelected && "ring-2 ring-white/20 ring-offset-4 ring-offset-zinc-900"
                              )}>
                                 <SkillIcon size={24} />
                                 
                                 {isActive && (
                                   <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-lg">
                                      <Play size={10} fill="currentColor" />
                                   </div>
                                 )}

                                 {!isDone && !isAvailable && (
                                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                                     <Lock size={12} className="text-zinc-600" />
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

      {/* Portal Tooltip */}
      {mounted && activeNode && createPortal(
         <div 
          className="fixed inset-0 z-[99999] pointer-events-auto bg-black/50 sm:bg-transparent flex items-center justify-center sm:block"
          onClick={() => setActiveNode(null)}
         >
            <div 
              className="animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 duration-200 sm:absolute mx-4 sm:mx-0"
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
               <div className="bg-zinc-950 p-5 rounded-2xl shadow-2xl flex flex-col gap-4 w-[300px] sm:min-w-[240px] sm:max-w-[300px] relative">
                  <button 
                    onClick={() => setActiveNode(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white shadow-lg"
                  >
                    <X size={12} />
                  </button>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-white tracking-wide">{activeNode.challenge.title}</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        completedChallenges.includes(activeNode.challenge.id) ? `bg-${activeNode.cat.accent}-500` : "bg-amber-500"
                      )} />
                      <span className="text-[9px] font-bold text-zinc-500">
                        {completedChallenges.includes(activeNode.challenge.id) ? 'Completed' : 'Next Milestone'}
                      </span>
                    </div>
                  </div>

                  {/* Requirements & Progress */}
                  {activeNode.challenge.requiredLevel > 0 && (
                    <div className="bg-zinc-900/50 p-2.5 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1.5">
                              <ArrowUpCircle size={10} /> Requirement
                            </span>
                            <span className={cn("text-[10px] font-black", (userSkills[activeNode.challenge.requiredSkillId] || 0) >= activeNode.challenge.requiredLevel ? "text-emerald-400" : "text-amber-400")}>
                              Lvl {activeNode.challenge.requiredLevel}
                            </span>
                        </div>
                        <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", (userSkills[activeNode.challenge.requiredSkillId] || 0) >= activeNode.challenge.requiredLevel ? "bg-emerald-500" : "bg-zinc-800")}
                              style={{ width: `${Math.min(((userSkills[activeNode.challenge.requiredSkillId] || 0) / activeNode.challenge.requiredLevel) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="text-[8px] font-bold text-zinc-600 text-center">
                            Your Current: Lvl {userSkills[activeNode.challenge.requiredSkillId] || 0}
                        </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 p-3 bg-zinc-900/40 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-zinc-950 text-amber-500 shrink-0">
                          <Gift size={14} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[8px] font-black text-zinc-500 tracking-wide">Reward</span>
                          <p className="text-[10px] text-zinc-300 font-medium leading-tight truncate">{activeNode.challenge.rewardDescription || "XP & Mastery Badge"}</p>
                      </div>
                    </div>
                    {activeNode.challenge.rewardSkillId && (
                      <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-950 rounded-lg">
                        <span className="text-[9px] font-bold text-zinc-500 truncate">
                          {activeNode.challenge.rewardSkillId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        <span className="text-[10px] font-black text-emerald-400">+{activeNode.challenge.rewardLevel} pts</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-2">
                    {activeChallenges.some(ac => ac.challengeId === activeNode.challenge.id) ? (
                      <button 
                        onClick={() => { onPractice(activeNode.challenge); setActiveNode(null); }}
                        className="w-full py-2.5 bg-white text-black rounded-lg font-bold text-[10px] tracking-wide hover:bg-zinc-200"
                      >
                        Practice Now
                      </button>
                    ) : (completedChallenges.includes(activeNode.challenge.id) || ((userSkills[activeNode.challenge.requiredSkillId] || 0) >= activeNode.challenge.requiredLevel)) ? (
                      <button 
                        onClick={() => { 
                          if (completedChallenges.includes(activeNode.challenge.id)) onPractice(activeNode.challenge);
                          else onStart(activeNode.challenge); 
                          setActiveNode(null); 
                        }}
                        className={cn(
                          "w-full py-2.5 rounded-lg font-bold text-[10px] tracking-wide transition-colors",
                          completedChallenges.includes(activeNode.challenge.id) ? "border border-white/10 text-white hover:bg-white/5" : "bg-emerald-500 text-black hover:bg-emerald-400"
                        )}
                      >
                        {completedChallenges.includes(activeNode.challenge.id) ? 'Mastery Review' : 'Start Challenge'}
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full py-2.5 bg-zinc-800 text-zinc-600 rounded-lg font-bold text-[10px] tracking-wide cursor-not-allowed"
                      >
                        Path Locked
                      </button>
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
