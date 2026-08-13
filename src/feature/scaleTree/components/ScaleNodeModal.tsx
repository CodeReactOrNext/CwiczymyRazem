import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { TablaturePreview } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/TablaturePreview";
import { generateScaleExercise, generateSingleStringScaleExercise } from "feature/exercisePlan/scales/scaleExerciseGenerator";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Lock, Minus, Play, Plus, Target, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BASE_ROOT_NOTE, transposeFret } from "../data/scaleTreeKeys";
import { nextRecordTarget, RECORD_MAX_BPM, RECORD_MIN_BPM, stepRecordBpm } from "../data/scaleTreeRecords";
import type { NodeStatus, ScaleRecord, ScaleTreeNodeDef } from "../types/scaleTree.types";

const PATTERN_LABELS: Record<string, string> = {
  ascending:            "Ascending",
  descending:           "Descending",
  ascending_descending: "Ascending + Descending",
  intervals_thirds:     "Thirds",
  intervals_fourths:    "Fourths",
  sequence_3_notes:     "Sequence 3",
  sequence_4_notes:     "Sequence 4",
};

const FAMILY_LABEL: Record<string, string> = {
  pentatonic: "Pentatonic",
  diatonic:   "Diatonic Scale",
  mode:       "Modal Mode",
};

const FAMILY_COLOR: Record<string, string> = {
  pentatonic: "text-amber-400",
  diatonic:   "text-cyan-400",
  mode:       "text-violet-400",
};

interface ScaleNodeModalProps {
  node: ScaleTreeNodeDef | null;
  status: NodeStatus | null;
  /** Key the tree is currently played in — moves every shape along the neck. */
  rootNote: string;
  /** Fastest clean run above the exam tempo, shared across keys. */
  record: ScaleRecord | null;
  onClose: () => void;
  /** Timed exam at the required BPM — passing it unlocks the next node. */
  onStartExam: () => void;
  /** Free run of the same exercise, with the usual session controls. */
  onStartPractice: () => void;
  /** The same exam, run faster than the tree asks for, chasing a personal best. */
  onStartRecord: (bpm: number) => void;
}

export function ScaleNodeModal({
  node,
  status,
  rootNote,
  record,
  onClose,
  onStartExam,
  onStartPractice,
  onStartRecord,
}: ScaleNodeModalProps) {
  const req = node?.requiredExercises[0];
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const fret = req ? transposeFret(req.position, rootNote) : 0;

  // Stepper for the record run. It resets whenever the sheet moves to another
  // node (or that node's record changes) so it always opens one step past the
  // best that node has seen — adjusted during render rather than in an effect.
  const [lastRecordBaseline, setLastRecordBaseline] = useState("");
  const [recordTarget, setRecordTarget] = useState(() => nextRecordTarget(record?.bpm));
  // Held steady while the sheet animates out (node is already null by then).
  const recordBaseline = node ? `${node.id}:${record?.bpm ?? 0}` : lastRecordBaseline;
  if (recordBaseline !== lastRecordBaseline) {
    setLastRecordBaseline(recordBaseline);
    setRecordTarget(nextRecordTarget(record?.bpm));
  }

  // Escape closes, and the page behind stays put while the sheet is open.
  useEffect(() => {
    if (!node) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [node, onClose]);

  const tablature = useMemo(() => {
    if (!req) return null;
    try {
      if (req.stringNum != null) {
        const exercise = generateSingleStringScaleExercise({
          rootNote,
          scaleType: req.scaleType,
          stringNum: req.stringNum,
        });
        return exercise.tablature ?? null;
      } else {
        const exercise = generateScaleExercise({
          rootNote,
          scaleType: req.scaleType,
          patternType: req.patternType,
          position: fret,
        });
        return exercise.tablature ?? null;
      }
    } catch {
      return null;
    }
  }, [req, rootNote, fret]);

  return (
    <AnimatePresence>
      {node && (
        <div
          key='scale-node-modal'
          className='fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={onClose}
          />

          {/* Bottom sheet on phones, centered card from sm up */}
          <motion.div
            role='dialog'
            aria-modal='true'
            aria-label={node.label}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className='relative flex max-h-[88dvh] w-full flex-col gap-5 overflow-y-auto overscroll-contain rounded-lg bg-zinc-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-md sm:pb-5'>
            {/* Header */}
            <div className='flex items-start gap-4'>
              <div className='min-w-0 flex-1'>
                <p className={cn("text-xs font-semibold capitalize tracking-wide", FAMILY_COLOR[node.scaleFamily] ?? "text-zinc-400")}>
                  {FAMILY_LABEL[node.scaleFamily] ?? node.scaleFamily}
                </p>
                <h2 className='mt-1 font-display text-xl font-bold leading-tight text-zinc-100'>
                  {node.label}
                </h2>
                {node.subtitle && (
                  <p className='mt-1 text-sm text-zinc-400'>{node.subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label='Close'
                className='-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400 transition-background hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                <X className='h-4 w-4' />
              </button>
            </div>

            {/* Exercise tags */}
            {req && (
              <div className='flex flex-wrap gap-2'>
                <Chip>{PATTERN_LABELS[req.patternType] ?? req.patternType}</Chip>
                {req.stringNum != null ? (
                  <Chip>String {req.stringNum}</Chip>
                ) : (
                  // Box names exist for pentatonics only — elsewhere the fret
                  // range chip below already says everything there is to say.
                  req.boxNumber != null && <Chip>Box {req.boxNumber}</Chip>
                )}
                {req.stringNum == null && (
                  <Chip>Frets {fret}–{fret + 4}</Chip>
                )}
                <Chip color='cyan'>{req.requiredBpm} BPM</Chip>
                {rootNote !== BASE_ROOT_NOTE && <Chip color='purple'>Key of {rootNote}</Chip>}
              </div>
            )}

            {/* Tablature preview — no inner card, the sheet is the only surface */}
            {tablature && tablature.length > 0 && (
              <TablaturePreview measures={tablature} />
            )}

            {/* Actions */}
            {isLocked ? (
              <div className='flex items-center gap-2.5 rounded-lg bg-zinc-800/40 px-4 py-3 text-sm text-zinc-400'>
                <Lock className='h-4 w-4 shrink-0 text-zinc-400' />
                Complete the required exercises to unlock
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-3'>
                <button
                  onClick={onStartPractice}
                  className='flex items-center justify-center gap-2 rounded-lg bg-zinc-800/60 py-3 text-sm font-bold text-zinc-100 transition-background hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:click-behavior'>
                  <Play className='h-4 w-4' fill='currentColor' />
                  Practice
                </button>
                <button
                  onClick={onStartExam}
                  className='flex items-center justify-center gap-2 rounded-lg bg-cyan-500 py-3 text-sm font-bold text-zinc-950 transition-background hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:click-behavior'>
                  <Target className='h-4 w-4' />
                  {isCompleted ? "Retake" : "Exam"}
                </button>
              </div>
            )}

            {/* Record run — the same exam above the tree's tempo. Opens up once the
                node itself is cleared, so the exam stays the way in. */}
            {!isLocked && (
              isCompleted ? (
                <div className='flex flex-col gap-4 rounded-lg bg-zinc-800/40 p-4'>
                  <div className='flex items-center gap-3'>
                    <Flame className='h-4 w-4 shrink-0 text-orange-400' />
                    <span className='flex-1 text-sm font-bold text-zinc-100'>Record run</span>
                    {record ? (
                      <span className='flex items-center gap-1.5 text-sm font-bold tabular-nums text-orange-400'>
                        <Trophy className='h-3.5 w-3.5' />
                        {record.bpm} BPM
                        {record.rootNote && (
                          <span className='font-medium text-zinc-500'>· {record.rootNote}</span>
                        )}
                      </span>
                    ) : (
                      <span className='text-xs text-zinc-500'>No record yet</span>
                    )}
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='flex flex-1 items-center justify-between gap-2 rounded-lg bg-zinc-900/60 px-2 py-2'>
                      <button
                        onClick={() => setRecordTarget((bpm) => stepRecordBpm(bpm, -1))}
                        disabled={recordTarget <= RECORD_MIN_BPM}
                        aria-label='Lower target tempo'
                        className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300 transition-background hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40'>
                        <Minus className='h-4 w-4' />
                      </button>
                      <span className='text-sm font-bold tabular-nums text-zinc-100'>
                        {recordTarget} BPM
                      </span>
                      <button
                        onClick={() => setRecordTarget((bpm) => stepRecordBpm(bpm, 1))}
                        disabled={recordTarget >= RECORD_MAX_BPM}
                        aria-label='Raise target tempo'
                        className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300 transition-background hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40'>
                        <Plus className='h-4 w-4' />
                      </button>
                    </div>
                    <button
                      onClick={() => onStartRecord(recordTarget)}
                      className='flex shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-bold text-zinc-950 transition-background hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:click-behavior'>
                      <Flame className='h-4 w-4' />
                      {record ? "Beat it" : "Set record"}
                    </button>
                  </div>

                  <p className='text-xs leading-relaxed text-zinc-500'>
                    Only a clean run counts — hold the tempo to the end and the fastest one is kept.
                  </p>
                </div>
              ) : (
                <p className='text-xs leading-relaxed text-zinc-500'>
                  Pass the exam to open record runs above {req?.requiredBpm ?? RECORD_MIN_BPM} BPM.
                </p>
              )
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
