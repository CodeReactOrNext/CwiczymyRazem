import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";

export const SupportBanner = () => {
  return (
    <Link
      href='/roadmap'
      className='group flex items-center gap-4 rounded-lg bg-zinc-900/40 p-4 transition-background hover:bg-zinc-900/60 sm:p-5'>
      <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400'>
        <Heart size={20} fill='currentColor' />
      </span>

      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
          Help build Riff Quest
        </p>
        <p className='mt-0.5 text-xs leading-snug text-zinc-400 sm:text-sm'>
          Riff Quest is free and built in the open. See what your support
          unlocks next on the roadmap.
        </p>
      </div>

      <span className='flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-200 transition-background group-hover:bg-amber-500/30 sm:text-sm'>
        <span className='hidden sm:inline'>View roadmap</span>
        <ArrowRight
          size={16}
          className='transition-transform duration-300 group-hover:translate-x-0.5'
        />
      </span>
    </Link>
  );
};
