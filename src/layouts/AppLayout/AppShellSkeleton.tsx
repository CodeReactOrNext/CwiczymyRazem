import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import Image from "next/image";

const NAV_ROW_WIDTHS = ["w-20", "w-24", "w-16", "w-28", "w-20", "w-24", "w-16", "w-20"];

/**
 * What the app shows while the session and the profile are still loading — a full
 * page load, the desktop app starting. The shell in its real proportions (sidebar,
 * header bar, bottom nav on mobile) with placeholder content, instead of a spinner
 * on an empty screen: when the data arrives, `MainLoggedLayout` takes its place
 * without anything moving. Mirrors the layout classes of `MainLoggedLayout`,
 * `RockSidebar`, `UserHeader` and `MobileBottomNav` — keep them in step.
 */
export const AppShellSkeleton = () => {
  const { isElectron } = useElectronWindowControls();

  return (
    <div
      aria-busy='true'
      aria-label='Loading'
      className={cn(
        "flex overflow-hidden bg-zinc-950",
        isElectron ? "h-[calc(100dvh-2.5rem)]" : "h-[100dvh]"
      )}>
      <aside className='hidden h-full bg-card lg:flex lg:w-64 lg:flex-col'>
        <div className='flex items-center gap-3 p-4'>
          <div className='flex h-9 w-9 items-center justify-center'>
            <Image src='/images/logolight.svg' alt='' width={32} height={32} className='h-8 w-8' />
          </div>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold text-white'>Riff Quest</span>
            <span className='text-xs font-medium text-amber-500/80'>beta</span>
          </div>
        </div>

        <div className='flex items-center gap-3 p-4'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-3 w-20' />
          </div>
        </div>

        <div className='space-y-1 px-3 pt-2'>
          {NAV_ROW_WIDTHS.map((width, i) => (
            <div key={i} className='flex min-h-11 items-center gap-3 px-3'>
              <Skeleton className='h-[18px] w-[18px] rounded' />
              <Skeleton className={cn("h-3.5", width)} />
            </div>
          ))}
        </div>
      </aside>

      <div className='flex h-full flex-1 flex-col overflow-hidden'>
        <div className='hidden h-14 w-full items-center gap-3 bg-zinc-950/80 px-8 md:flex'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <Skeleton className='h-3 w-40' />
          <Skeleton className='ml-auto h-8 w-24 rounded-lg' />
        </div>
        <div className='mx-auto w-full max-w-[1490px] md:pt-8 lg:px-8'>
          <PageLoadingLayout />
        </div>
      </div>

      <div className='fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-zinc-900/95 px-2 pb-safe pt-1.5 lg:hidden'>
        <div className='h-14' />
      </div>
    </div>
  );
};
