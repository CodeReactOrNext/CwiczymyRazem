import { Button } from "assets/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "assets/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Check, Ellipsis, Flag, Keyboard, LogOut, SkipForward } from "lucide-react";
import type { ReactNode } from "react";
import { memo, useRef, useState } from "react";

import type { Exercise } from "../../../types/exercise.types";
import { sumSessionTime, useSessionTimeStore } from "../hooks/sessionTimeStore";
import { FinishSessionDialog } from "./FinishSessionDialog";
import { SessionTransport } from "./SessionTransport";
import { VERDICT_GROUND, type VerdictTone } from "./SessionVerdict";
import { ShortcutsDialog } from "./ShortcutsLegend";

interface SessionBottomBarProps {
  /** Song practice with a backing track — surfaces its nudge keys in the legend. */
  hasBackingTrack?: boolean;
  onClose?: () => void;
  skipExitDialog?: boolean;
  currentExercise: Exercise;
  isLastExercise: boolean;
  isPlaying: boolean;
  toggleTimer: () => void;
  handleRestart: () => void;
  handleNextExerciseClick: () => Promise<void>;

  /** The session's own bar is met — finishing awards skill points as usual. */
  canFinishSession: boolean;
  /** At least one exercise got its 20s, so there is something worth logging. */
  hasLoggedPractice: boolean;
  currentExerciseIndex: number;
  totalExercises: number;
  onGoToPreviousExercise: () => void;
  isFinishing?: boolean;
  isSubmittingReport: boolean;
  onFinishSession: (options?: { earlyFinish?: boolean }) => Promise<void>;
  examMode?: boolean;
  /** The start gate over the tab offers Start, so the bar doesn't. */
  hideTransport?: boolean;
  /** The exercise's clock is down: the white key moves on from Start. */
  isTimeUp?: boolean;
  /** What Next leads to. */
  nextTitle?: string;
  /** `nextTitle` is a song's name — left untranslated. */
  isNextSong?: boolean;
  /** The answer to a run that just ended, in place of the transport. */
  verdict?: { tone: VerdictTone; strip: ReactNode };
  /** The answer to one round of a hunt, over the bar — the transport stays. */
  roundVerdict?: { tone: VerdictTone; strip: ReactNode };
}

interface MoveOnKeyProps {
  title: string;
  detail?: string;
  icon: ReactNode;
  /** The bar's one white key. */
  isPrimary: boolean;
  onClick: () => void;
  isBusy?: boolean;
  isDetailName?: boolean;
}

/** Next or Finish: what it does, and under it where that leads. */
const MoveOnKey = ({ title, detail, icon, isPrimary, onClick, isBusy, isDetailName }: MoveOnKeyProps) => (
  <Button
    variant={isPrimary ? "default" : "subtle"}
    size="xl"
    className="h-14 max-w-full gap-4 px-5"
    loading={isBusy}
    onClick={onClick}>
    <span className="min-w-0 text-left">
      <span className="block text-base font-bold leading-tight">{title}</span>
      {detail && (
        <span translate={isDetailName ? "no" : undefined} className="block max-w-48 truncate text-xs font-medium leading-tight opacity-75">
          {detail}
        </span>
      )}
    </span>
    {icon}
  </Button>
);

/**
 * Fixed bottom bar: the way out on the left, the exercise's clock and Start in
 * the middle, the way on at the right. One key is white at a time — Start while
 * there is something to play, Next or Finish once its clock is down.
 */
const SessionBottomBarComponent = ({
  onClose,
  currentExercise,
  isLastExercise,
  isPlaying,
  toggleTimer,
  handleRestart,
  handleNextExerciseClick,
  canFinishSession,
  hasLoggedPractice,
  currentExerciseIndex,
  totalExercises,
  onGoToPreviousExercise,
  isFinishing,
  isSubmittingReport,
  onFinishSession,
  skipExitDialog = false,
  examMode = false,
  hasBackingTrack = false,
  hideTransport = false,
  isTimeUp = false,
  nextTitle,
  isNextSong = false,
  verdict,
  roundVerdict,
}: SessionBottomBarProps) => {
  const { t } = useTranslation(["common", "session"]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const hasTempoControl = !!currentExercise.metronomeSpeed;
  const [showFinishEarlyDialog, setShowFinishEarlyDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Only meaningful mid-plan: the last exercise already has its own "Finish
  // Session" action, and a single-exercise plan has nothing to skip ahead of.
  const canFinishEarly = !examMode && !isLastExercise && totalExercises > 1;
  // The session isn't played out yet — its last exercise still has time on the
  // clock (on every route alike). Finishing from here is still allowed, it just
  // keeps the time only; the dialog spells that out.
  const isEarlyFinish = !canFinishSession;
  const finishDisabled = !hasLoggedPractice;
  const isBusy = !!isFinishing || isSubmittingReport;

  // Nothing was practised yet (timer never ran) — there is no progress to lose,
  // so Exit leaves straight away instead of warning about an unsaved session.
  const handleExitClick = () => {
    const hasPractised = isPlaying || sumSessionTime(useSessionTimeStore.getState().time) > 0;
    if (skipExitDialog || !hasPractised) {
      onClose?.();
      return;
    }
    setShowExitDialog(true);
  };

  return (
    <>
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 transition-colors duration-base",
      verdict ? VERDICT_GROUND[verdict.tone] : "bg-zinc-950",
    )}>
      {roundVerdict && !verdict && (
        <div className={VERDICT_GROUND[roundVerdict.tone]}>
          <div className="mx-auto flex max-w-7xl items-center px-6 py-3">{roundVerdict.strip}</div>
        </div>
      )}
      <div className={cn(
        "mx-auto max-w-7xl items-center gap-6 px-6 py-3",
        verdict ? "flex justify-between" : "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
      )}>

        {/* Left: Exit */}
        <div className="flex items-center justify-start gap-2.5">
          <Button variant="subtle" size="touch" onClick={handleExitClick}>
            <LogOut />
            {t("common:practice.exit")}
          </Button>
          {!verdict && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="subtle" size="icon-touch" aria-label={t("session:bar.more")} title={t("session:bar.more")}>
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              {/* Clears the session's full-screen layer, like its dialogs. */}
              <DropdownMenuContent side="top" align="start" sideOffset={8} className="z-[99999999] min-w-52">
                <DropdownMenuItem className="gap-3 py-2.5 font-semibold" onSelect={() => setShowShortcuts(true)}>
                  <Keyboard className="size-4 text-zinc-400" aria-hidden />
                  {t("session:shortcuts.title")}
                </DropdownMenuItem>
                {/* Not offered before there is anything to save. */}
                {canFinishEarly && !finishDisabled && (
                  <DropdownMenuItem className="gap-3 py-2.5 font-semibold" onSelect={() => setShowFinishEarlyDialog(true)}>
                    <Flag className="size-4 text-zinc-400" aria-hidden />
                    {t("common:practice.finish_plan_early")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {verdict ? verdict.strip : (
        <>

        <SessionTransport
          isPlaying={isPlaying}
          onToggle={toggleTimer}
          onRestart={handleRestart}
          onBack={currentExerciseIndex > 0 ? onGoToPreviousExercise : undefined}
          hidePlay={currentExercise.riddleConfig?.mode === "sequenceRepeat"}
          clockOnly={hideTransport}
        />

        <div className="flex min-w-0 items-center justify-end">
          {!examMode && (isLastExercise ? (
            // Nothing to finish before there is something to save.
            !finishDisabled && (
              <MoveOnKey
                title={isBusy ? t("session:saving") : t("common:finish_session")}
                detail={isEarlyFinish ? t("session:bar.time_only") : t("session:bar.save")}
                icon={<Check />}
                isPrimary={isTimeUp || !isEarlyFinish}
                isBusy={isBusy}
                // Below the bar — never finish on the first click, the
                // dialog has to state what the player is giving up first.
                onClick={isEarlyFinish ? () => setShowFinishEarlyDialog(true) : () => void onFinishSession()}
              />
            )
          ) : (
            <MoveOnKey
              title={t("common:next") || "Next"}
              detail={nextTitle}
              isDetailName={isNextSong}
              icon={<SkipForward />}
              isPrimary={isTimeUp}
              isBusy={isBusy}
              onClick={() => void handleNextExerciseClick()}
            />
          ))}
        </div>
        </>
        )}

      </div>
    </div>

    <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      {/* z-index must beat the session view, overlay included, or this dialog
          opens invisibly behind it. */}
      <DialogContent
        className='bg-zinc-900 text-white sm:max-w-md sm:p-8 z-[99999999]'
        overlayClassName='z-[99999998]'
        // Radix would focus the first button — Exit — so a stray Enter threw the
        // session away. Land on the harmless choice instead.
        onOpenAutoFocus={(e) => { e.preventDefault(); stayButtonRef.current?.focus(); }}>
        <DialogHeader className='space-y-3 pr-10'>
          <DialogTitle className='text-xl font-bold tracking-tight'>{t("session:exit.title")}</DialogTitle>
          <DialogDescription className='text-sm leading-relaxed text-zinc-400'>
            {finishDisabled
              ? t("session:exit.too_short")
              : t("session:exit.not_saved")}
          </DialogDescription>
        </DialogHeader>

        <div className='mt-6 flex flex-col gap-3'>
          {!finishDisabled && (
            <div className='flex flex-col gap-2'>
              <Button
                size='lg'
                className='w-full'
                loading={isFinishing || isSubmittingReport}
                onClick={async () => { setShowExitDialog(false); await onFinishSession({ earlyFinish: isEarlyFinish }); }}>
                <Check />
                {t("session:exit.finish_save")}
              </Button>
              {isEarlyFinish && (
                <p className='text-center text-xs text-zinc-400'>
                  {t("common:practice.finish_early.hint")}
                </p>
              )}
            </div>
          )}

          <div className='flex flex-col-reverse gap-2 sm:flex-row'>
            <Button
              variant='subtle'
              size='lg'
              className='flex-1 text-zinc-400 hover:bg-red-500/15 hover:text-red-400'
              onClick={() => { setShowExitDialog(false); onClose?.(); }}>
              <LogOut />
              {finishDisabled ? t("session:exit.exit") : t("session:exit.exit_no_save")}
            </Button>
            <Button
              ref={stayButtonRef}
              variant={finishDisabled ? "default" : "subtle"}
              size="lg"
              className="flex-1"
              onClick={() => setShowExitDialog(false)}>
              {t("session:exit.stay")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ShortcutsDialog
      open={showShortcuts}
      onOpenChange={setShowShortcuts}
      hasTempoControl={hasTempoControl}
      hasBackingTrack={hasBackingTrack}
    />

    <FinishSessionDialog
      open={showFinishEarlyDialog}
      onOpenChange={setShowFinishEarlyDialog}
      mode={isEarlyFinish ? "early" : "plan"}
      disabled={finishDisabled}
      isLoading={isFinishing || isSubmittingReport}
      onConfirm={async () => {
        setShowFinishEarlyDialog(false);
        await onFinishSession({ earlyFinish: isEarlyFinish });
      }}
    />

    </>
  );
};

export const SessionBottomBar = memo(SessionBottomBarComponent);
SessionBottomBar.displayName = "SessionBottomBar";
