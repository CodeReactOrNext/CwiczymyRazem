import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { ArrowUpRight, Heart } from "lucide-react";
import Link from "next/link";

import { useBuyMeACoffeeFunding } from "../hooks/useBuyMeACoffeeFunding";

/**
 * Quiet, borderless indicator of community support over the last 7 days.
 * Mirrors the "Live Now" header styling and links through to the roadmap.
 */
export const SupportPulse = ({ className = "" }: { className?: string }) => {
  const { raisedThisMonth, supporters, isLoading } = useBuyMeACoffeeFunding();

  if (isLoading) return null;

  const hasSupport = raisedThisMonth > 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <Link
            href='/roadmap'
            className={`group flex items-center gap-2.5 text-zinc-400 transition-colors hover:text-zinc-200 ${className}`}>
            <Heart
              size={16}
              fill='currentColor'
              className='shrink-0 text-amber-500/70 transition-colors group-hover:text-amber-400'
            />
            <div className='flex flex-col leading-tight'>
              {hasSupport ? (
                <span className='text-[13px] font-bold'>
                  ${raisedThisMonth}{" "}
                  <span className='font-medium text-zinc-500'>this month</span>
                </span>
              ) : (
                <span className='text-[13px] font-bold'>Support the roadmap</span>
              )}
              <span className='text-[11px] font-medium text-zinc-500'>
                {supporters > 0
                  ? `${supporters} supporters · community`
                  : "community support"}
              </span>
            </div>
            <ArrowUpRight
              size={14}
              className='shrink-0 text-zinc-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-300'
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side='bottom'
          className='max-w-[230px] border-white/10 bg-zinc-900 font-normal leading-relaxed text-zinc-300'>
          {hasSupport
            ? `${supporters} supporters have chipped in $${raisedThisMonth} this month. It keeps Riff Quest free and funds the roadmap — tap to see where it goes.`
            : "Riff Quest is free and funded by the community. Tap to see the roadmap and what your support unlocks next."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
