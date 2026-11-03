import { Skeleton } from "assets/components/ui/skeleton";
import { useTranslation } from "hooks/useTranslation";

import { journeyModules } from "../../data/journeyModules";

/**
 * Placeholders for the two Journey screens while the player's progress loads —
 * the same containers and spacing as `ModuleSelectionScreen` and `JourneyPath`,
 * so the progress arriving fills the rows in instead of replacing the page.
 * Keep them in step with those two.
 */
export const ModuleSelectionSkeleton = () => {
  const { t } = useTranslation("journey");

  return (
    <div
      aria-busy='true'
      aria-label='Loading'
      className='relative min-h-screen w-full overflow-x-hidden bg-zinc-950'>
      <div
        className='pointer-events-none absolute inset-x-0 top-0 h-[420px]'
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className='relative mx-auto max-w-3xl px-4 pb-10 pt-6 md:px-8'>
        {/* Static copy, so the heading is already the real one. */}
        <div className='mb-6'>
          <h1 className='font-display text-2xl font-bold text-white'>{t("modules.title")}</h1>
          <p className='mt-1 text-sm text-zinc-400'>{t("modules.subtitle")}</p>
        </div>

        <div className='space-y-3'>
          {journeyModules.map((module) => (
            <Skeleton key={module.id} variant='block' className='h-[76px]' />
          ))}
          <Skeleton variant='block' className='h-[68px]' />
        </div>
      </div>
    </div>
  );
};

export const JourneyPathSkeleton = () => (
  <div
    aria-busy='true'
    aria-label='Loading'
    className='relative h-full min-h-screen overflow-x-hidden bg-zinc-950'>
    <div className='px-6 py-10 md:px-10'>
      <Skeleton className='mb-6 h-8 w-20 rounded-lg' />
      <Skeleton className='h-9 w-56 max-w-full md:h-10' />
      <Skeleton className='mt-2 h-4 w-48 max-w-full' />
      <div className='mt-6 flex items-center gap-3'>
        <Skeleton className='h-1.5 w-40 rounded-full' />
        <Skeleton className='h-3 w-16' />
      </div>
    </div>

    <div className='px-3 py-4 md:px-10'>
      <div className='mx-auto flex w-full max-w-[480px] flex-col items-center gap-14 pb-14 pt-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-20 w-20 rounded-full' />
        ))}
      </div>
    </div>
  </div>
);
