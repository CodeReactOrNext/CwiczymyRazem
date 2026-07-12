import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import { Clock, Play } from "lucide-react";

interface ExercisePreviewDialogProps {
  exercise: Exercise | null;
  onClose: () => void;
  onStart?: () => void;
}

const chipClassName =
  "flex items-center gap-1.5 rounded border-transparent bg-zinc-800/40 px-2.5 py-1 text-xs font-medium text-zinc-300";

export function ExercisePreviewDialog({
  exercise,
  onClose,
  onStart,
}: ExercisePreviewDialogProps) {
  const { t } = useTranslation(["common", "exercises"]);

  if (!exercise) return null;

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  return (
    <Dialog
      open={!!exercise}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}>
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden border-0 bg-zinc-950/95 p-0 shadow-none backdrop-blur-3xl sm:max-w-[900px] lg:max-w-[1024px]'>
        <div className='scrollbar-premium min-h-0 flex-1 overflow-y-auto'>
          {/* Header */}
          <div className='p-6 pt-8'>
            <DialogHeader>
              <DialogTitle className='text-2xl font-semibold leading-tight text-zinc-100'>
                {exercise.title}
              </DialogTitle>
              <p className='mt-2 max-w-xl text-sm leading-relaxed text-zinc-400'>
                {exercise.description}
              </p>

              <div className='mt-5 hidden flex-wrap items-center gap-2 sm:flex'>
                <Badge variant='outline' className={chipClassName}>
                  <Clock className='h-3 w-3 text-zinc-500' />
                  {exercise.timeInMinutes < 1
                    ? `${Math.round(exercise.timeInMinutes * 60)}s`
                    : `${exercise.timeInMinutes} min`}
                </Badge>

                <Badge variant='outline' className={chipClassName}>
                  {t(`common:difficulty.${exercise.difficulty}` as any)}
                </Badge>

                <Badge variant='outline' className={chipClassName}>
                  {t(`common:categories.${exercise.category}` as any)}
                </Badge>

                {skills.map((skill) => {
                  if (!skill) return null;
                  const Icon = skill.icon;
                  return (
                    <Badge
                      key={skill.id}
                      variant='outline'
                      className={chipClassName}>
                      {Icon && <Icon className='h-3 w-3 text-zinc-500' />}
                      {t(`common:skills.${skill.id}` as any)}
                    </Badge>
                  );
                })}
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className='space-y-10 p-6 pt-2'>
            {exercise.tablature && exercise.tablature.length > 0 && (
              <div className='space-y-3'>
                <h4 className='text-sm font-medium text-zinc-400'>Tablature</h4>
                <div className='overflow-hidden rounded-lg bg-zinc-900/40'>
                  <TablatureViewer
                    measures={exercise.tablature}
                    bpm={exercise.metronomeSpeed?.recommended || 100}
                    isPlaying={false}
                    startTime={null}
                    className='min-h-[340px] w-full cursor-grab active:cursor-grabbing'
                  />
                </div>
              </div>
            )}

            {exercise.instructions && exercise.instructions.length > 0 && (
              <div className='space-y-3'>
                <h4 className='text-sm font-medium text-zinc-400'>
                  Instructions
                </h4>
                <ul className='space-y-2.5'>
                  {exercise.instructions.map((inst, i) => (
                    <li
                      key={i}
                      className='flex items-start gap-3 text-sm text-zinc-200'>
                      <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-[10px] font-semibold text-zinc-400'>
                        {i + 1}
                      </span>
                      <span className='leading-relaxed'>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {exercise.tips && exercise.tips.length > 0 && (
              <div className='space-y-3 rounded-lg bg-zinc-900/40 p-5'>
                <h4 className='text-sm font-medium text-zinc-400'>Pro tips</h4>
                <ul className='space-y-2'>
                  {exercise.tips.map((tip, i) => (
                    <li
                      key={i}
                      className='flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300'>
                      <span className='mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500' />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {exercise.metronomeSpeed && (
              <div className='space-y-3'>
                <h4 className='text-sm font-medium text-zinc-400'>
                  Metronome speeds
                </h4>
                <div className='flex gap-4'>
                  <div className='flex-1 rounded-lg bg-zinc-900/40 p-4 text-center'>
                    <div className='text-xs text-zinc-500'>Minimum</div>
                    <div className='mt-1 text-lg font-semibold text-zinc-200'>
                      {exercise.metronomeSpeed.min}{" "}
                      <span className='text-xs font-normal text-zinc-500'>
                        BPM
                      </span>
                    </div>
                  </div>
                  <div className='flex-1 rounded-lg bg-cyan-500/10 p-4 text-center'>
                    <div className='text-xs text-cyan-400/80'>Recommended</div>
                    <div className='mt-1 text-lg font-semibold text-cyan-400'>
                      {exercise.metronomeSpeed.recommended}{" "}
                      <span className='text-xs font-normal text-cyan-400/60'>
                        BPM
                      </span>
                    </div>
                  </div>
                  <div className='flex-1 rounded-lg bg-zinc-900/40 p-4 text-center'>
                    <div className='text-xs text-zinc-500'>Maximum</div>
                    <div className='mt-1 text-lg font-semibold text-zinc-200'>
                      {exercise.metronomeSpeed.max}{" "}
                      <span className='text-xs font-normal text-zinc-500'>
                        BPM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer — always visible, outside the scroll area */}
        <div className='flex shrink-0 items-center justify-end gap-3 p-6 pb-8 pt-4 sm:pb-6'>
          <Button
            variant='ghost'
            onClick={onClose}
            className='text-zinc-400 hover:bg-white/5 hover:text-zinc-100'>
            Close
          </Button>
          {onStart && (
            <Button
              onClick={onStart}
              className='gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-white'>
              <Play className='h-3.5 w-3.5 fill-current' />
              Start
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
