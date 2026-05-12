import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  AlertCircle,
CheckCircle2, Play,   Square, SquareCheck,
Star, Target,   X, } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

import { getSongsByIds } from "../../services/journey.service";
import type { JourneyStepWithStatus } from "../../types/journey.types";

interface StepSidebarProps {
  step: JourneyStepWithStatus;
  moduleId: string;
  onClose: () => void;
  onComplete: (stepId: string) => Promise<void>;
  onStart: (stepId: string) => Promise<void>;
  isSaving: boolean;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  locked:        { label: "Locked",      cls: "text-zinc-500 bg-zinc-800" },
  available:     { label: "Available",   cls: "text-cyan-400 bg-cyan-500/10" },
  "in-progress": { label: "In Progress", cls: "text-amber-400 bg-amber-500/10" },
  completed:     { label: "Completed",   cls: "text-emerald-400 bg-emerald-500/10" },
};

export const StepSidebar: React.FC<StepSidebarProps> = ({
  step,
  moduleId,
  onClose,
  onComplete,
  onStart,
  isSaving,
}) => {
  const [checklistState, setChecklistState] = useState<boolean[]>(
    () => (step.checklist ?? []).map(() => false)
  );
  const [pickerSongs, setPickerSongs] = useState<Song[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const userId = useAppSelector(selectUserAuth);
  const router = useRouter();

  const allChecked = step.checklist ? checklistState.every(Boolean) : true;
  const canComplete = allChecked && (step.songPicker ? selectedSongId !== null : true);

  useEffect(() => {
    if (!step.songPicker?.length) return;
    setPickerLoading(true);
    getSongsByIds(step.songPicker)
      .then(setPickerSongs)
      .finally(() => setPickerLoading(false));
  }, [step.songPicker]);

  const handleStartExercise = async () => {
    if (step.status === "available") await onStart(step.id);
    router.push({ pathname: `/practice/exercise/${step.suggestedExerciseId}`, query: { stepId: step.id, moduleId } });
  };

  const status = STATUS_CFG[step.status];
  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950">
      {/* Header */}
      <div className="relative h-24 sm:h-48 flex-shrink-0">
        <Image src={step.image} alt={step.title} fill className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        <button
          onClick={onClose}
          data-vaul-no-drag
          className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition hover:bg-black/80"
        >
          <X size={20} />
        </button>
        
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${status.cls}`}>
              {status.label}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Step {step.order}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">{step.title}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-8">
        {/* Short info */}
        <p className="text-zinc-400 text-sm leading-relaxed">{step.shortDescription}</p>

        {/* Content blocks or description */}
        <div className="space-y-6">
          {step.contentBlocks && step.contentBlocks.length > 0 ? (
            step.contentBlocks.map((block, i) => (
              <div key={i} className="text-sm leading-relaxed text-zinc-300">
                {block.type === "text" && <p>{block.body}</p>}
                {block.type === "callout" && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                        <p className="font-bold text-zinc-200 mb-1">{block.label}</p>
                        <p className="text-zinc-500">{block.body}</p>
                    </div>
                )}
                {block.type === "image" && (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 mt-2">
                        <Image src={block.url || ""} alt="" fill className="object-cover" />
                    </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-zinc-300">{step.fullDescription}</p>
          )}
        </div>

        {/* Checklist - HIGHLIGHTED */}
        {step.checklist && step.checklist.length > 0 && (
          <div className="space-y-4">
            {!isCompleted && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 border border-amber-500/20 text-amber-200/80">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
                <p className="text-xs font-medium leading-relaxed">
                  Please complete all mandatory tasks below by ticking the checkboxes to proceed to the next stage.
                </p>
              </div>
            )}
            <div className="rounded-2xl bg-zinc-900 p-5 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Your Tasks</h3>
                  <span className="text-[10px] font-bold text-zinc-500">{checklistState.filter(Boolean).length}/{checklistState.length}</span>
              </div>
              <div className="space-y-2">
                {step.checklist.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setChecklistState(prev => prev.map((v, idx) => idx === i ? !v : v))}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      checklistState[i] ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {checklistState[i] ? <SquareCheck size={18} /> : <Square size={18} />}
                    <span className="text-xs font-medium">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Song Picker */}
        {step.songPicker && step.songPicker.length > 0 && (
            <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Choose a target</h3>
                <div className="grid grid-cols-1 gap-2">
                    {pickerLoading ? (
                        <div className="h-16 animate-pulse bg-zinc-900 rounded-xl" />
                    ) : (
                        pickerSongs.map(song => (
                            <button
                                key={song.id}
                                onClick={() => setSelectedSongId(song.id)}
                                className={`flex items-center gap-3 rounded-xl border p-2 text-left transition ${
                                    selectedSongId === song.id ? "border-white bg-zinc-800" : "border-zinc-800 bg-zinc-900"
                                }`}
                            >
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                                    <Image src={song.coverUrl || ""} alt="" fill className="object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-white">{song.title}</p>
                                    <p className="truncate text-[10px] text-zinc-500">{song.artist}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-auto border-t border-zinc-800 bg-zinc-950 p-4 sm:p-6 space-y-3">
        {step.modalOnly ? (
          !isCompleted && (
            <button
              onClick={async () => {
                if (isSaving || !canComplete) return;
                if (step.songPicker && selectedSongId && userId) {
                  const song = pickerSongs.find((s) => s.id === selectedSongId);
                  if (song) {
                    await updateSongStatus(userId as string, selectedSongId, song.title, song.artist, "wantToLearn", undefined);
                  }
                }
                onComplete(step.id);
              }}
              disabled={isLocked || isSaving || !canComplete}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40"
            >
              {isSaving ? "Saving..." : "Done & Complete"}
              <CheckCircle2 size={18} />
            </button>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStartExercise}
              disabled={isLocked}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-40"
            >
              <Play size={16} fill="currentColor" />
              Practice
            </button>
            <button
              onClick={async () => {
                if (step.status === "available") await onStart(step.id);
                const bpm = step.examBpm ?? 60;
                router.push(`/practice/exercise/${step.suggestedExerciseId}?mode=exam&bpm=${bpm}&stepId=${step.id}&moduleId=${moduleId}`);
              }}
              disabled={isLocked}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-40"
            >
              <Target size={16} />
              {isCompleted ? "Retake" : "Exam"}
            </button>
          </div>
        )}
        {isCompleted && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 size={14} /> Completed
                {step.stars && <span className="ml-2 flex items-center gap-0.5">
                    {[1,2,3].map(n => <Star key={n} size={10} className={n <= step.stars! ? "fill-current" : "text-zinc-800"} />)}
                </span>}
            </div>
        )}
      </div>
    </div>
  );
};
