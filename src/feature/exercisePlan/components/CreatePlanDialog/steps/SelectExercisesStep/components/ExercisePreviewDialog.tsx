import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'assets/components/ui/dialog';
import { Badge } from 'assets/components/ui/badge';
import type { Exercise } from 'feature/exercisePlan/types/exercise.types';
import { useTranslation } from 'hooks/useTranslation';
import { guitarSkills } from 'feature/skills/data/guitarSkills';
import { Clock, Info, CheckCircle2, Lightbulb, Activity, Tag, Play } from 'lucide-react';
import { TablatureViewer } from 'feature/exercisePlan/views/PracticeSession/components/TablatureViewer';
import { Button } from 'assets/components/ui/button';
import { cn } from 'assets/lib/utils';

interface ExercisePreviewDialogProps {
  exercise: Exercise | null;
  isSelected?: boolean;
  onClose: () => void;
  onToggleExercise?: (exercise: Exercise) => void;
}

export function ExercisePreviewDialog({
  exercise,
  isSelected,
  onClose,
  onToggleExercise,
}: ExercisePreviewDialogProps) {
  const { t } = useTranslation(['common', 'exercises']);

  if (!exercise) return null;

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1024px] bg-zinc-950/95 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden !rounded-[12px] max-h-[85vh] flex flex-col">
        <div className="w-full h-full overflow-y-auto scrollbar-premium flex flex-col">
          {/* Header - Top Banner */}
        <div className="relative p-6 pt-8 pb-6 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />
          
          <DialogHeader className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-black text-white leading-tight">
                  {exercise.title}
                </DialogTitle>
                <p className="mt-2 text-[14px] text-zinc-400 font-medium leading-relaxed max-w-xl">
                  {exercise.description}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex flex-wrap items-center gap-2 mt-5">
              <Badge variant="outline" className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-zinc-900/80 border-white/10 text-white flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                {exercise.timeInMinutes} min
              </Badge>
              
              <Badge variant="outline" className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                {t(`common:difficulty.${exercise.difficulty}` as any)}
              </Badge>

              <Badge variant="outline" className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-white/5 border-white/10 text-zinc-300">
                {t(`common:categories.${exercise.category}` as any)}
              </Badge>

              {skills.map((skill) => {
                if (!skill) return null;
                const Icon = skill.icon;
                return (
                  <Badge key={skill.id} variant="outline" className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[8px] bg-white/5 border-white/10 text-zinc-400 flex items-center gap-1">
                    {Icon && <Icon className="w-3 h-3 opacity-70" />}
                    {t(`common:skills.${skill.id}` as any)}
                  </Badge>
                );
              })}
            </div>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-8 flex-1 shrink-0">
          
          {/* Tablature Preview */}
          {exercise.tablature && exercise.tablature.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                <Play className="w-4 h-4 text-emerald-400" />
                Tablature
              </h4>
              <div className="rounded-[12px] bg-[#0a0a0a] border border-white/5 overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                <TablatureViewer 
                  measures={exercise.tablature}
                  bpm={exercise.metronomeSpeed?.recommended || 100}
                  isPlaying={false}
                  startTime={null}
                  className="min-h-[340px] w-full cursor-grab active:cursor-grabbing"
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                <CheckCircle2 className="w-4 h-4 text-cyan-500/70" />
                Instructions
              </h4>
              <ul className="space-y-2.5">
                {exercise.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-zinc-300">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800/50 text-[10px] font-bold text-zinc-500 shrink-0 mt-0.5 border border-white/5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <div className="space-y-3 p-5 rounded-[8px] bg-amber-500/5 border border-amber-500/10">
              <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-amber-500/80">
                <Lightbulb className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="space-y-2">
                {exercise.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-amber-100/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40 shrink-0 mt-1.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metronome Speed */}
          {exercise.metronomeSpeed && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-zinc-500">
                <Activity className="w-4 h-4 text-indigo-400" />
                Metronome Speeds
              </h4>
              <div className="flex gap-4">
                <div className="flex-1 p-3 rounded-[8px] bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Minimum</div>
                  <div className="text-lg font-black text-zinc-300">{exercise.metronomeSpeed.min} <span className="text-[11px] text-zinc-600 font-medium font-sans">BPM</span></div>
                </div>
                <div className="flex-1 p-3 rounded-[8px] bg-cyan-500/10 border border-cyan-500/20 text-center">
                  <div className="text-[10px] uppercase font-bold text-cyan-500/70 mb-1">Recommended</div>
                  <div className="text-lg font-black text-cyan-400">{exercise.metronomeSpeed.recommended} <span className="text-[11px] text-cyan-500/50 font-medium font-sans">BPM</span></div>
                </div>
                <div className="flex-1 p-3 rounded-[8px] bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Maximum</div>
                  <div className="text-lg font-black text-zinc-300">{exercise.metronomeSpeed.max} <span className="text-[11px] text-zinc-600 font-medium font-sans">BPM</span></div>
                </div>
              </div>
            </div>
          )}


          
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end p-5 border-t border-white/5 bg-zinc-950/40 gap-3 mt-auto shrink-0 pb-6 sm:pb-5">
           <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[11px] rounded-[8px]">
             Cancel
           </Button>
           <Button 
             onClick={() => {
                if(onToggleExercise) onToggleExercise(exercise);
                onClose();
             }}
             className={cn(
               "px-8 rounded-[8px] font-black uppercase tracking-widest text-[11px] transition-all",
               isSelected 
                 ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-none hover:border-red-500/50"
                 : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02]"
             )}
           >
             {isSelected ? "Remove from Plan" : "Add to Plan"}
           </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
