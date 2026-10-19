import { useTranslation } from "hooks/useTranslation";

const INTRO_SEEN_KEY = "rq_backing_intro_seen";

/** Whether this browser has already been through the intro. */
export function hasSeenBackingIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    // Private mode: better to show it once too often than never.
    return false;
  }
}

function markBackingIntroSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* private mode — it will simply show again next time */
  }
}

interface BackingTrackIntroProps {
  /** Off the desktop there are no files, so step 1 says where they live. */
  desktopAvailable: boolean;
  onDone: () => void;
}

/**
 * What a backing track is and how it is set up, said once before the editor
 * is first used — three numbered steps, then out of the way.
 *
 * The editor itself carries a one-line hint per step, but a hint only helps
 * someone who already knows what the screen is for. This is the "what" and
 * the "why"; it also says plainly that a YouTube video works, which nobody
 * would otherwise guess from a screen about audio files.
 */
export function BackingTrackIntro({ desktopAvailable, onDone }: BackingTrackIntroProps) {
  const { t } = useTranslation("backing_track");
  const steps = [
    {
      title: t("intro.step1_title"),
      body: desktopAvailable ? t("intro.step1_body") : t("intro.step1_web"),
    },
    { title: t("intro.step2_title"), body: t("intro.step2_body") },
    { title: t("intro.step3_title"), body: t("intro.step3_body") },
  ];

  return (
    <div
      role='dialog'
      aria-labelledby='backing-intro-title'
      className='absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-zinc-950/95 px-6 py-10'>
      <div className='flex w-full max-w-xl flex-col gap-8'>
        <div className='flex flex-col gap-3'>
          <h2 id='backing-intro-title' className='text-2xl font-semibold text-zinc-100'>
            {t("intro.title")}
          </h2>
          <p className='text-sm leading-relaxed text-zinc-400'>{t("intro.lead")}</p>
        </div>

        <ol className='flex flex-col gap-6'>
          {steps.map((step, index) => (
            <li key={step.title} className='flex gap-4'>
              <span className='w-6 shrink-0 text-lg font-semibold tabular-nums text-zinc-500'>
                {index + 1}
              </span>
              <div className='flex flex-col gap-1'>
                <span className='text-base font-semibold text-zinc-100'>{step.title}</span>
                <p className='text-sm leading-relaxed text-zinc-400'>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          type='button'
          onClick={() => {
            markBackingIntroSeen();
            onDone();
          }}
          className='self-start rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
          {t("intro.start")}
        </button>
      </div>
    </div>
  );
}
