"use client";

import { cn } from "assets/lib/utils";
import { SkillConnection } from "feature/skills/components/SkillConnection";
import { SkillNode } from "feature/skills/components/SkillNode";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import { skillTreeData } from "feature/skills/data/skillTreeStructure";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId, UserSkills } from "feature/skills/skills.types";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ZoomIn, ZoomOut, X, Check } from "lucide-react";
import { FaPlay } from "react-icons/fa"; // Using FaPlay as a generic action icon

interface RPGSkillTreeProps {
  userSkills: UserSkills;
  onSkillUpgrade: (skillId: string) => void;
}

export const RPGSkillTree = ({
  userSkills,
  onSkillUpgrade,
}: RPGSkillTreeProps) => {
  const { t } = useTranslation("skills");
  const totalAvailablePoints = Object.values(userSkills.availablePoints).reduce(
    (sum, points) => sum + points as number,
    0
  );

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction State
  const [selectedSkillId, setSelectedSkillId] = useState<GuitarSkillId | null>(null);

  const getNode = (id: GuitarSkillId) => skillTreeData.find((n) => n.id === id);
  const getSkillData = (id: GuitarSkillId) => guitarSkills.find((s) => s.id === id);

  // Drag to scroll state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (containerRef.current?.offsetLeft || 0);
    startY.current = e.pageY - (containerRef.current?.offsetTop || 0);
    scrollLeft.current = containerRef.current?.scrollLeft || 0;
    scrollTop.current = containerRef.current?.scrollTop || 0;
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const y = e.pageY - (containerRef.current?.offsetTop || 0);
    const walkX = (x - startX.current) * 1.5; // Scroll-fast
    const walkY = (y - startY.current) * 1.5;
    if (containerRef.current) {
        containerRef.current.scrollLeft = scrollLeft.current - walkX;
        containerRef.current.scrollTop = scrollTop.current - walkY;
    }
  };

  const handleNodeClick = (id: GuitarSkillId) => {
    // Prevent click if we were dragging (simple check: if moved > 5px?)
    // For now, simple implementation. 
    // If a node handles click itself, it bubbles? 
    // Actually, SkillNode onClick is passed handleNodeClick.
    // We should probably allow click even after drag unless logic is improved, 
    // but usually panning distinguishes click vs drag. 
    // Let's rely on standard behavior for now.
    setSelectedSkillId(id);
  };

  const handleClosePanel = () => {
    setSelectedSkillId(null);
  };

  // Center the view on mount
  useState(() => {
     // We can't use layoutEffect efficiently here without a proper ref callback or simple timeout
     // But for a quick fix, let's just default the refs to center approx.
     // Center of map is roughly 1680, 1680. 
     // Wrapper is screen size.
     // Let's use an effect
     setTimeout(() => {
        if (containerRef.current) {
            containerRef.current.scrollLeft = 1680 - containerRef.current.clientWidth / 2;
            containerRef.current.scrollTop = 1680 - containerRef.current.clientHeight / 2;
        }
     }, 100);
  });

  const handleUpgradeConfirm = () => {
    if (selectedSkillId) {
      onSkillUpgrade(selectedSkillId);
    }
  };

  const selectedSkill = selectedSkillId ? getSkillData(selectedSkillId) : null;
  const selectedNode = selectedSkillId ? getNode(selectedSkillId) : null;

  return (
    <div className="relative w-full h-[calc(100vh-100px)] bg-[#050505] overflow-hidden flex flex-col font-openSans">
      
      {/* HUD Layer */}
      <div className="absolute top-0 left-0 right-0 p-6 z-40 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-md shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Skill Matrix</h1>
            <p className="text-zinc-400 text-sm">
                 {t("intro.description", "Unlock new abilities to progress.")}
            </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
           <div className="flex flex-col items-end px-2">
               <span className="text-xs text-zinc-400 uppercase tracking-wider">Available Points</span>
               <span className="text-3xl font-bold text-cyan-400">{totalAvailablePoints}</span>
           </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-8 z-40 pointer-events-auto flex flex-col gap-2">
         <button onClick={() => setScale(s => Math.min(s + 0.1, 1.5))} className="p-3 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800 transition-colors">
            <ZoomIn className="w-5 h-5" />
         </button>
         <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="p-3 bg-zinc-900 border border-zinc-700 text-white rounded-full hover:bg-zinc-800 transition-colors">
            <ZoomOut className="w-5 h-5" />
         </button>
      </div>

      {/* Skill Details Panel (Modal/Overlay) */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full md:w-[400px] z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl p-8 flex flex-col"
          >
            <button onClick={handleClosePanel} className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            <div className="mt-12 flex-1">
               {/* Icon */}
               <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-6 shadow-lg">
                  {selectedSkill.icon ? <selectedSkill.icon className="w-10 h-10 text-cyan-400" /> : <div className="w-10 h-10 bg-zinc-800 rounded-full" />}
               </div>
               
               <h2 className="text-3xl font-bold text-white mb-2">{selectedSkill.name || t(`skills.${selectedSkill.id}.name` as any)}</h2>
               <div className="inline-flex px-3 py-1 rounded bg-zinc-800 text-zinc-400 text-xs uppercase tracking-wider mb-6">
                 {t(`categories.${selectedSkill.category}` as any)}
               </div>
               
               <p className="text-zinc-300 leading-relaxed mb-8 text-lg">
                 {t(`skills.${selectedSkill.id}.description` as any)}
               </p>

               <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 mb-8">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm text-zinc-500">Current Level</span>
                     <span className="text-xl font-bold text-white">{userSkills.unlockedSkills[selectedSkill.id] || 0}</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full bg-cyan-500" style={{ width: `${((userSkills.unlockedSkills[selectedSkill.id] || 0) / 10) * 100}%` }}></div>
                   </div>
               </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
               {userSkills.availablePoints[selectedSkill.category] > 0 ? (
                 <button 
                  onClick={handleUpgradeConfirm}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                   <span>Unlock / Upgrade</span>
                   <span className="bg-black/20 px-2 py-0.5 rounded text-sm">-1 pt</span>
                 </button>
               ) : (
                 <button disabled className="w-full py-4 bg-zinc-800 text-zinc-500 font-bold rounded-xl cursor-not-allowed border border-zinc-700">
                   Not enough points
                 </button>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Main Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative cursor-grab active:cursor-grabbing custom-scrollbar"
        style={{ scrollBehavior: 'auto' }} // auto for smooth drag
        onClick={(e) => {
           if (e.target === containerRef.current) handleClosePanel();
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{ 
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                width: '4000px', height: '4000px'
             }}
        />
        
        <div 
            style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: 'top left',
                width: '4000px', 
                height: '4000px',
                position: 'relative',
                padding: '100px'
            }}
        >
             {/* PLAYER CORE (Center) */}
             <div className="absolute left-[1200px] top-[1200px] -translate-x-1/2 -translate-y-1/2 w-4 pointer-events-none z-0">
                {/* Core Energy Lines to Totems */}
                <svg className="absolute overflow-visible" style={{ left: 0, top: 0 }}>
                    {/* To Technique (Top: 12, 5 -> 120, 50 :: Grid=12*140, 5*140) */}
                    {/* Wait, coordinates: x * (80+60) = 140. 
                        Center (12,12) = 1680, 1680.
                        Technique Center (12, 5) = 1680, 700.
                        Theory Center (5, 12) = 700, 1680.
                        Creativity Center (19, 12) = 2660, 1680.
                        Hearing Center (12, 19) = 1680, 2660.
                        
                        My offset in render was 'left + 48' for center of node.
                        Let's use consistent logic.
                    */}
                    <defs>
                        <linearGradient id="core-beam-red" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                            <stop offset="50%" stopColor="#ef4444" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                        </linearGradient>
                         <linearGradient id="core-beam-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Beams */}
                    {/* We can just draw lines from center 12,12 to the cluster centers */}
                </svg>
             </div>

             {/* CLUSTER TOTEMS */}
             {/* Technique (12, 5) */}
             <div className="absolute left-[1680px] top-[700px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none opacity-80">
                <div className="w-32 h-32 rounded-full border-4 border-red-500/20 bg-red-900/5 backdrop-blur-sm flex items-center justify-center animate-pulse-slow">
                     <span className="text-4xl text-red-500 font-bold tracking-widest opacity-50">TECH</span>
                </div>
                {/* Connecting Beam to Core */}
                <div className="absolute top-32 left-1/2 w-1 h-[900px] bg-gradient-to-b from-red-500/20 to-transparent -translate-x-1/2" /> 
             </div>

             {/* Theory (5, 12) */}
             <div className="absolute left-[700px] top-[1680px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none opacity-80">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 bg-blue-900/5 backdrop-blur-sm flex items-center justify-center animate-pulse-slow">
                     <span className="text-4xl text-blue-500 font-bold tracking-widest opacity-50">THEO</span>
                </div>
                <div className="absolute left-32 top-1/2 h-1 w-[900px] bg-gradient-to-r from-blue-500/20 to-transparent -translate-y-1/2" />
             </div>

             {/* Creativity (19, 12) */}
             <div className="absolute left-[2660px] top-[1680px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none opacity-80">
                <div className="w-32 h-32 rounded-full border-4 border-purple-500/20 bg-purple-900/5 backdrop-blur-sm flex items-center justify-center animate-pulse-slow">
                     <span className="text-4xl text-purple-500 font-bold tracking-widest opacity-50">CREA</span>
                </div>
                 <div className="absolute right-32 top-1/2 h-1 w-[900px] bg-gradient-to-l from-purple-500/20 to-transparent -translate-y-1/2" />
             </div>

             {/* Hearing (12, 19) */}
             <div className="absolute left-[1680px] top-[2660px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none opacity-80">
                <div className="w-32 h-32 rounded-full border-4 border-emerald-500/20 bg-emerald-900/5 backdrop-blur-sm flex items-center justify-center animate-pulse-slow">
                     <span className="text-4xl text-emerald-500 font-bold tracking-widest opacity-50">HEAR</span>
                </div>
                <div className="absolute bottom-32 left-1/2 w-1 h-[900px] bg-gradient-to-t from-emerald-500/20 to-transparent -translate-x-1/2" />
             </div>


             {/* AMBIENT ZONES (Nebulas) - Updated Coordinates for new layout */}
             {/* Technique (Top) */}
             <div className="absolute left-[1680px] top-[700px] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
             {/* Theory (Left) */}
             <div className="absolute left-[700px] top-[1680px] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
             {/* Creativity (Right) */}
             <div className="absolute left-[2660px] top-[1680px] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
             {/* Hearing (Bottom) */}
             <div className="absolute left-[1680px] top-[2660px] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

             {/* Connections */}
             {skillTreeData.map((node) => {
                if (!node.visualConnections) return null;
                const nodeSkill = getSkillData(node.id);
                const theme = nodeSkill ? getSkillTheme(nodeSkill.category) : { line: "#52525b" };

                return node.visualConnections.map((targetId) => {
                    const targetNode = getNode(targetId);
                    if (!targetNode) return null;
                    const isParentUnlocked = userSkills.unlockedSkills[node.id] !== undefined;
                    
                    return (
                        <SkillConnection
                            key={`${node.id}-${targetId}`}
                            fromNode={node}
                            toNode={targetNode}
                            isUnlocked={isParentUnlocked}
                            color={theme.line}
                        />
                    );
                });
             })}

             {/* Nodes */}
             {skillTreeData.map((node) => {
                const skillData = getSkillData(node.id);
                if (!skillData) return null;

                const currentPoints = userSkills.unlockedSkills[node.id] || 0;
                const isUnlocked = currentPoints > 0;
                const isAvailable = true;

                // Highlight selected node
                const isSelected = selectedSkillId === node.id;

                return (
                  <div key={node.id} className={cn("transition-opacity duration-300", selectedSkillId && !isSelected ? "opacity-30" : "opacity-100")}>
                    <SkillNode
                        skill={skillData}
                        x={node.x}
                        y={node.y}
                        isUnlocked={isUnlocked}
                        currentPoints={currentPoints}
                        isAvailable={isAvailable}
                        isSelected={isSelected}
                        onUpgrade={handleNodeClick} 
                    />
                  </div>
                );
             })}
        </div>
      </div>
    </div>
  );
};
