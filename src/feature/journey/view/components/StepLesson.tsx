import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useTranslation } from "hooks/useTranslation";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  Star,
  Target,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

import { getSongsByIds } from "../../services/journey.service";
import type {
  JourneyStepWithStatus,
  StepContentBlock,
} from "../../types/journey.types";
import type { LessonPage } from "../../utils/lessonPages";
import { buildLessonPages } from "../../utils/lessonPages";
import { FretDiagram } from "./FretDiagram";

interface StepLessonProps {
  step: JourneyStepWithStatus | null;
  onClose: () => void;
  onComplete: (stepId: string) => Promise<void>;
  onPractice: (step: JourneyStepWithStatus) => void;
  onExam: (step: JourneyStepWithStatus) => void;
  isSaving: boolean;
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function LessonBlock({ block }: { block: StepContentBlock }) {
  switch (block.type) {
    case "text":
      return block.body?.includes("\n") ? (
        <pre className='font-mono overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-300'>
          {block.body}
        </pre>
      ) : (
        <p className='text-lg leading-relaxed text-zinc-200'>{block.body}</p>
      );
    case "callout":
      return (
        <section className='space-y-3'>
          {block.label && (
            <h3 className='font-display text-2xl font-black leading-tight text-zinc-100 [text-wrap:balance] sm:text-3xl'>
              {block.label}
            </h3>
          )}
          <p className='text-lg leading-relaxed text-zinc-300'>{block.body}</p>
        </section>
      );
    case "image":
      return (
        <div className='relative aspect-video w-full overflow-hidden rounded-lg'>
          <Image
            src={block.url || ""}
            alt={block.caption ?? ""}
            fill
            className='object-cover'
          />
        </div>
      );
    case "fretDiagram":
      return block.diagram ? <FretDiagram data={block.diagram} /> : null;
    default:
      return null;
  }
}

function ContentPage({
  page,
}: {
  page: Extract<LessonPage, { kind: "content" }>;
}) {
  return (
    <div className='space-y-6'>
      {page.blocks.map((block, i) => (
        <LessonBlock key={i} block={block} />
      ))}
    </div>
  );
}

interface FinishPageProps {
  step: JourneyStepWithStatus;
  checks: boolean[];
  onToggle: (index: number) => void;
  pickerSongs: Song[];
  selectedSongId: string | null;
  onSelectSong: (id: string) => void;
}

function FinishPage({
  step,
  checks,
  onToggle,
  pickerSongs,
  selectedSongId,
  onSelectSong,
}: FinishPageProps) {
  const { t } = useTranslation("journey");
  const isCompleted = step.status === "completed";

  return (
    <div className='space-y-10'>
      {isCompleted && (
        <p className='flex items-center gap-2 text-sm font-semibold text-emerald-400'>
          <CheckCircle2 size={16} />
          {t("sidebar.status.completed")}
          {step.stars && (
            <span
              className='ml-1 flex items-center gap-0.5'
              aria-label={`${step.stars}/3`}>
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  size={12}
                  className={
                    n <= step.stars!
                      ? "fill-current text-amber-400"
                      : "text-zinc-700"
                  }
                />
              ))}
            </span>
          )}
        </p>
      )}

      {!step.modalOnly && step.examGoal && (
        <section className='space-y-3'>
          <h3 className='font-display text-2xl font-black text-zinc-100 sm:text-3xl'>
            {t("lesson.how_to_pass")}
          </h3>
          <p className='text-lg leading-relaxed text-zinc-300'>
            {step.examGoal}
          </p>
        </section>
      )}

      {!!step.checklist?.length && (
        <section className='space-y-4'>
          <div className='space-y-2'>
            <h3 className='font-display text-2xl font-black text-zinc-100 sm:text-3xl'>
              {t("lesson.before_you_start")}
            </h3>
            <p className='text-base text-zinc-400'>{t("lesson.tick_all")}</p>
          </div>
          <div className='space-y-2'>
            {step.checklist.map((item, i) => (
              <button
                key={i}
                type='button'
                role='checkbox'
                aria-checked={checks[i]}
                onClick={() => onToggle(i)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg p-4 text-left text-base leading-snug transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  checks[i]
                    ? "bg-zinc-900 text-zinc-100"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800",
                )}>
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md",
                    checks[i] ? "bg-emerald-400 text-zinc-950" : "bg-zinc-800",
                  )}>
                  {checks[i] && <Check size={14} strokeWidth={3} />}
                </span>
                {item.text}
              </button>
            ))}
          </div>
        </section>
      )}

      {!!step.songPicker?.length && (
        <section className='space-y-4'>
          <h3 className='font-display text-2xl font-black text-zinc-100 sm:text-3xl'>
            {t("sidebar.choose_target")}
          </h3>
          <div className='grid grid-cols-1 gap-2'>
            {pickerSongs.length === 0 ? (
              <div className='h-16 animate-pulse rounded-lg bg-zinc-900' />
            ) : (
              pickerSongs.map((song) => (
                <button
                  key={song.id}
                  type='button'
                  aria-pressed={selectedSongId === song.id}
                  onClick={() => onSelectSong(song.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    selectedSongId === song.id
                      ? "bg-zinc-800 ring-1 ring-zinc-400"
                      : "bg-zinc-900 hover:bg-zinc-800",
                  )}>
                  <div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg'>
                    <Image
                      src={song.coverUrl || ""}
                      alt=''
                      fill
                      className='object-cover'
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-bold text-zinc-100'>
                      {song.title}
                    </p>
                    <p className='truncate text-xs text-zinc-500'>
                      {song.artist}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Body ─────────────────────────────────────────────────────────────────────

type LessonBodyProps = Omit<StepLessonProps, "step"> & {
  step: JourneyStepWithStatus;
};

function LessonBody({
  step,
  onClose,
  onComplete,
  onPractice,
  onExam,
  isSaving,
}: LessonBodyProps) {
  const { t } = useTranslation("journey");
  const userId = useAppSelector(selectUserAuth);
  const pages = useMemo(() => buildLessonPages(step), [step]);
  const [pageIndex, setPageIndex] = useState(0);
  const [checks, setChecks] = useState<boolean[]>(() =>
    (step.checklist ?? []).map(() => false),
  );
  const [pickerSongs, setPickerSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const page = pages[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === pages.length - 1;
  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";

  const checksLeft = checks.filter((done) => !done).length;
  const songMissing = !!step.songPicker?.length && !selectedSongId;
  const canComplete = checksLeft === 0 && !songMissing;

  useEffect(() => {
    if (!step.songPicker?.length) return undefined;
    let live = true;
    getSongsByIds(step.songPicker).then((songs) => {
      if (live) setPickerSongs(songs);
    });
    return () => {
      live = false;
    };
  }, [step.songPicker]);

  // Every page starts at its top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pageIndex]);

  const goTo = (index: number) =>
    setPageIndex(Math.max(0, Math.min(pages.length - 1, index)));

  const complete = async () => {
    if (isSaving || !canComplete) return;
    if (step.songPicker && selectedSongId && userId) {
      const song = pickerSongs.find((s) => s.id === selectedSongId);
      if (song) {
        await updateSongStatus(
          userId as string,
          selectedSongId,
          song.title,
          song.artist,
          "wantToLearn",
          undefined,
        );
      }
    }
    await onComplete(step.id);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" && !isLast) goTo(pageIndex + 1);
    if (event.key === "ArrowLeft" && !isFirst) goTo(pageIndex - 1);
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col' onKeyDown={onKeyDown}>
      {/* ── Top bar: leave, and how far through ── */}
      <div className='flex flex-shrink-0 items-center gap-4 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6'>
        <DialogPrimitive.Close asChild>
          <Button variant='subtle' size='icon' aria-label={t("sidebar.close")}>
            <X />
          </Button>
        </DialogPrimitive.Close>
        <div className='flex flex-1 gap-1' aria-hidden>
          {pages.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= pageIndex ? "bg-zinc-200" : "bg-zinc-800",
              )}
            />
          ))}
        </div>
        <span className='text-xs font-medium tabular-nums text-zinc-500'>
          {pageIndex + 1} / {pages.length}
        </span>
      </div>

      {/* ── The page ── */}
      <div
        ref={scrollRef}
        className='min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-4 sm:px-8 sm:pt-8'>
        <div className='mx-auto w-full max-w-2xl space-y-7'>
          <header>
            <p className='text-xs font-medium text-zinc-500'>
              {t("sidebar.step", { n: step.order })}
            </p>
            <DialogPrimitive.Title
              className={cn(
                "mt-1 font-display font-black leading-tight text-zinc-100 [text-wrap:balance]",
                isFirst ? "text-3xl sm:text-4xl" : "text-base text-zinc-400",
              )}>
              {step.title}
            </DialogPrimitive.Title>
            {isFirst && (
              <p className='mt-3 text-lg leading-relaxed text-zinc-400'>
                {step.shortDescription}
              </p>
            )}
          </header>

          {page.kind === "content" ? (
            <ContentPage page={page} />
          ) : (
            <FinishPage
              step={step}
              checks={checks}
              onToggle={(i) =>
                setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
              }
              pickerSongs={pickerSongs}
              selectedSongId={selectedSongId}
              onSelectSong={setSelectedSongId}
            />
          )}
        </div>
      </div>

      {/* ── Back / Next, and on the last page the way out ── */}
      <div className='flex-shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-8'>
        <div className='mx-auto flex w-full max-w-2xl gap-3'>
          {!isFirst && (
            <Button
              variant='subtle'
              size='icon'
              className='h-11 w-11 flex-shrink-0'
              onClick={() => goTo(pageIndex - 1)}
              aria-label={t("lesson.back")}>
              <ChevronLeft />
            </Button>
          )}

          {!isLast ? (
            <Button
              className='h-11 flex-1 gap-2 text-sm font-bold'
              onClick={() => goTo(pageIndex + 1)}>
              {t("lesson.next")}
              <ChevronRight />
            </Button>
          ) : !step.modalOnly ? (
            <div className='grid flex-1 grid-cols-2 gap-3'>
              <Button
                variant='subtle'
                className='h-11 gap-2 text-sm font-bold'
                disabled={isLocked}
                onClick={() => onPractice(step)}>
                <Play className='fill-current' />
                {t("sidebar.practice")}
              </Button>
              <Button
                className='h-11 gap-2 text-sm font-bold'
                disabled={isLocked}
                onClick={() => onExam(step)}>
                <Target />
                {isCompleted ? t("sidebar.retake") : t("sidebar.exam")}
              </Button>
            </div>
          ) : isCompleted ? (
            <Button
              className='h-11 flex-1 gap-2 text-sm font-bold'
              onClick={onClose}>
              {t("sidebar.close")}
            </Button>
          ) : (
            <Button
              className='h-11 flex-1 gap-2 text-sm font-bold'
              disabled={isLocked || isSaving || !canComplete}
              onClick={complete}>
              {isSaving
                ? t("sidebar.saving")
                : checksLeft > 0
                  ? t("lesson.tick_more", { count: checksLeft })
                  : songMissing
                    ? t("lesson.pick_song")
                    : t("sidebar.done_complete")}
              {canComplete && !isSaving && <CheckCircle2 />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A step's lesson on the whole screen, one idea per page: progress across the
 * top, Back / Next at the bottom, and the way to finish the step on the last
 * page. Keyed by step, so a new step always opens on page one.
 */
export const StepLesson: React.FC<StepLessonProps> = ({
  step,
  onClose,
  ...rest
}) => {
  const { isElectron } = useElectronWindowControls();

  return (
    <DialogPrimitive.Root
      open={!!step}
      onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            // Over the phone's bottom tab bar (z-[100]) and every in-app dialog
            // layer, under the Electron title bar, which it leaves room for.
            "fixed inset-x-0 bottom-0 z-[120] flex flex-col bg-zinc-950 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0",
            isElectron ? "top-10" : "top-0",
          )}>
          {step && (
            <LessonBody key={step.id} step={step} onClose={onClose} {...rest} />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
