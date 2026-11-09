import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { OnboardingSource } from "../analytics/onboardingAnalytics";
import {
  trackOnboardingFirstRiffIntroDone,
  trackOnboardingFirstRiffMicChosen,
} from "../analytics/onboardingAnalytics";
import type { IntroSlideId } from "../data/firstRiffIntro";
import { getIntroSlides, getIntroVoice } from "../data/firstRiffIntro";
import type { OnboardingLevel } from "../types";
import type { PreviewFocus } from "./SessionPreview";
import { SessionPreview } from "./SessionPreview";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

const FOCUS_BY_SLIDE: Record<IntroSlideId, PreviewFocus> = {
  tempo: "tempo",
  mic: "mic",
  // The mic key shown off: this is the button they skipped.
  no_mic: "mic",
  tab: "tab",
};

/**
 * Before the first riff: can the player use a mic, then three short slides on
 * where the tempo is, what the mic does (or that without it they just play
 * along) and that the tab can be set up — each beside a still of the session
 * with that control lit. Ends by handing the mic answer to the session, which
 * then skips its own "use the mic?" prompt.
 *
 * Desktop: copy on the left, the session still on the right. Phone: a full
 * screen like a native app — the still fills the top, the copy and buttons sit
 * in a sheet at the bottom, within thumb reach.
 */
export const FirstRiffIntro = ({
  level,
  bpm,
  tablature,
  isMobile,
  source,
  onStart,
}: {
  level: OnboardingLevel;
  bpm: number;
  tablature: TablatureMeasure[];
  isMobile: boolean;
  source: OnboardingSource;
  onStart: (withMic: boolean) => void;
}) => {
  const { t } = useTranslation("onboarding");
  const [withMic, setWithMic] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);

  const voice = getIntroVoice(level);
  const slides = getIntroSlides(withMic ?? true);
  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const onQuestion = withMic === null;
  // The mic question is the first of the progress bar's segments.
  const position = onQuestion ? 0 : index + 1;

  const chooseMic = (mic: boolean) => {
    trackOnboardingFirstRiffMicChosen({ level, withMic: mic, source });
    setWithMic(mic);
    setIndex(0);
  };

  const start = (skipped: boolean) => {
    trackOnboardingFirstRiffIntroDone({
      level,
      withMic: withMic ?? false,
      skipped,
      slidesSeen: index + 1,
      source,
    });
    onStart(withMic ?? false);
  };

  const title = onQuestion
    ? t("first_riff_intro.mic_question.title")
    : t(`first_riff_intro.slides.${slide.id}.${voice}.title`, { bpm });
  const body = onQuestion
    ? t("first_riff_intro.mic_question.description")
    : t(`first_riff_intro.slides.${slide.id}.${voice}.body`);
  const phoneNote =
    !onQuestion && isMobile && slide.inPhonePanel
      ? t("first_riff_intro.phone_panel")
      : null;

  const primary = onQuestion ? (
    <Button
      size='lg'
      className='w-full lg:w-auto'
      onClick={() => chooseMic(true)}>
      {t("first_riff_intro.mic_question.yes")}
    </Button>
  ) : (
    <Button
      size='lg'
      className='w-full lg:w-auto'
      onClick={() => (isLast ? start(false) : setIndex(index + 1))}>
      {isLast ? (
        t("first_riff_intro.start")
      ) : (
        <>
          {t("first_riff_intro.next")}
          <ArrowRight className='ml-2 h-4 w-4' />
        </>
      )}
    </Button>
  );

  const secondary = (
    <button
      type='button'
      onClick={() =>
        onQuestion
          ? chooseMic(false)
          : index === 0
            ? setWithMic(null)
            : setIndex(index - 1)
      }
      className={cn(
        "flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-3 text-sm transition-colors hover:bg-zinc-800/60 lg:w-auto",
        onQuestion
          ? "text-zinc-300 hover:text-zinc-100"
          : "text-zinc-400 hover:text-zinc-200",
        FOCUS_RING,
      )}>
      {onQuestion ? (
        t("first_riff_intro.mic_question.no")
      ) : (
        <>
          <ArrowLeft className='h-4 w-4' />
          {t("first_riff_intro.back")}
        </>
      )}
    </button>
  );

  return (
    <div className='flex h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-zinc-100 lg:h-auto lg:min-h-[100dvh] lg:overflow-visible'>
      <header className='mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 lg:px-10 lg:py-6'>
        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={100}
          height={24}
          className='block max-h-5 w-auto'
          priority
        />
        {!onQuestion && (
          <button
            type='button'
            onClick={() => start(true)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200",
              FOCUS_RING,
            )}>
            {t("first_riff_intro.skip")}
          </button>
        )}
      </header>

      <div
        className='mx-auto flex w-full max-w-7xl shrink-0 gap-1.5 px-4 sm:px-6 lg:px-10'
        aria-hidden>
        {Array.from({ length: slides.length + 1 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-base",
              i <= position ? "bg-zinc-200" : "bg-zinc-800",
            )}
          />
        ))}
      </div>

      <main className='mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 lg:px-10 lg:py-16'>
        {/* The still: fills the screen above the sheet on a phone, the right column on desktop. */}
        <div
          className={cn(
            "min-h-0 flex-1 lg:order-2 lg:flex-none",
            isMobile ? "" : "flex items-center px-4 py-6 sm:px-6 lg:p-0",
          )}>
          <div className={cn(isMobile ? "h-full" : "w-full")}>
            <SessionPreview
              device={isMobile ? "phone" : "desktop"}
              focus={onQuestion ? "mic" : FOCUS_BY_SLIDE[slide.id]}
              micOn={!onQuestion && withMic === true}
              bpm={bpm}
              tablature={tablature}
            />
          </div>
        </div>

        <div
          key={onQuestion ? "question" : slide.id}
          className={cn(
            "shrink-0 duration-base animate-in fade-in lg:order-1",
            // Phone: a bottom sheet, buttons within thumb reach.
            "rounded-t-2xl bg-zinc-900 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-6",
            "lg:rounded-none lg:bg-transparent lg:p-0",
          )}>
          <h1 className='text-2xl font-semibold tracking-tight text-zinc-100 lg:text-4xl'>
            {title}
          </h1>
          <p className='mt-2 text-base leading-relaxed text-zinc-300 lg:mt-4 lg:text-lg'>
            {body}
          </p>
          {phoneNote && (
            <p className='mt-2 text-sm leading-relaxed text-zinc-500'>
              {phoneNote}
            </p>
          )}
          <div className='mt-6 flex flex-col gap-1 lg:mt-10 lg:flex-row lg:items-center lg:gap-3'>
            {primary}
            {secondary}
          </div>
        </div>
      </main>
    </div>
  );
};
