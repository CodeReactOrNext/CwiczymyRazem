import { cn } from "assets/lib/utils";
import { X } from "lucide-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaInfoCircle, FaLightbulb } from "react-icons/fa";
import type { Exercise } from "../../../types/exercise.types";

interface ExerciseInstructionsTriggerProps {
  exercise: Exercise;
}

export const ExerciseInstructionsTrigger = ({ exercise }: ExerciseInstructionsTriggerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasInstructions = !!(exercise.instructions?.length || exercise.tips?.length);

  if (!hasInstructions) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/50 border border-white/5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md"
        title="About Exercise"
      >
        <FaInfoCircle size={18} />
        <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-cyan-500 animate-pulse border-2 border-zinc-900" />
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500" />
            
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight mb-2">Exercise Guide</h2>
                <p className="text-zinc-500 text-sm font-medium tracking-wide">{exercise.title}</p>
              </div>

              {exercise.instructions && exercise.instructions.length > 0 && (
                <div className={cn(exercise.tips?.length ? "mb-10" : "")}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <FaInfoCircle size={18} />
                    </div>
                    <h3 className="font-bold text-white text-lg tracking-tight">Instructions</h3>
                  </div>
                  <div className="space-y-4 text-zinc-300 leading-relaxed text-sm md:text-base">
                    {exercise.instructions.map((instruction, idx) => (
                      <p key={idx} className="pl-4 border-l-2 border-zinc-800">{instruction}</p>
                    ))}
                  </div>
                </div>
              )}

              {exercise.tips && exercise.tips.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <FaLightbulb size={18} />
                    </div>
                    <h3 className="font-bold text-white text-lg tracking-tight">Pro Tips</h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-3">
                    {exercise.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-zinc-300 text-sm">
                        <span className="text-amber-500/50 font-bold">#{idx + 1}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-6 bg-zinc-950/50 border-t border-white/5 flex justify-end">
                <button 
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors"
                >
                    Got it
                </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
