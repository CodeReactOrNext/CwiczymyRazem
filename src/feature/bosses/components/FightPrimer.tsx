import { cn } from "assets/lib/utils";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { useTranslation } from "hooks/useTranslation";
import { Swords } from "lucide-react";
import type { ReactNode } from "react";

/** A picture of a part of the fight, on the arena's own dark ground. */
const Picture = ({ children }: { children: ReactNode }) => (
  <div aria-hidden className='force-dark flex h-28 flex-col justify-center gap-4 rounded-lg bg-zinc-950/70 px-5'>
    {children}
  </div>
);

const Bar = ({ className, fill, width }: { className?: string; fill: string; width: string }) => (
  <span className={cn("flex h-3 overflow-hidden rounded-full bg-zinc-800", className)}>
    <span className={cn("h-full rounded-full", fill)} style={{ width }} />
  </span>
);

/** The notes of a tab going by: played, then still to come. */
const NOTES = [5, 6, 7, 8, 5, 6, 7];
const PLAYED = 3;

/** You and the boss face to face over the tab. */
const FacePicture = () => (
  <Picture>
    <span className='grid grid-cols-2 gap-6'>
      <Bar fill='bg-emerald-500' width='86%' />
      <Bar fill='bg-purple-500' width='52%' className='justify-end' />
    </span>
    <span className='flex justify-between gap-1'>
      {NOTES.map((fret, i) => (
        <span
          key={i}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded text-xs font-bold tabular-nums",
            i < PLAYED ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-300",
          )}>
          {fret}
        </span>
      ))}
    </span>
  </Picture>
);

/** The sword filling up, and its blow. */
const SwordPicture = () => (
  <Picture>
    <span className='flex items-center gap-4'>
      <Swords className='size-9 shrink-0 text-amber-400' />
      <Bar fill='bg-amber-400' width='88%' className='flex-1' />
      <span className='font-teko text-4xl leading-none tabular-nums text-amber-300'>−48</span>
    </span>
  </Picture>
);

/** Phase after phase, a step faster each. */
const PhasesPicture = () => (
  <Picture>
    <span className='flex h-16 items-end gap-2'>
      {[1, 2, 3, 4, 5, 6].map((phase) => (
        <span
          key={phase}
          style={{ height: `${28 + phase * 12}%` }}
          className={cn(
            "flex flex-1 items-end justify-center rounded pb-1 font-teko text-lg leading-none tabular-nums",
            phase < 4 ? "bg-zinc-600 text-zinc-50" : phase === 4 ? "bg-zinc-100 text-zinc-950" : "bg-zinc-800 text-zinc-500",
          )}>
          {phase}
        </span>
      ))}
    </span>
  </Picture>
);

const STEPS = [
  { key: "looks", picture: <FacePicture /> },
  { key: "goes", picture: <SwordPicture /> },
  { key: "why", picture: <PhasesPicture /> },
] as const;

/** Under the posters: what a fight looks like, how it goes and what it is for. */
export const FightPrimer = () => {
  const { t } = useTranslation("bosses");
  return (
    <section>
      <SectionHeader size='lg' title={t("primer.title")} className='mb-0' />
      <ul className='mt-5 grid gap-x-8 gap-y-8 lg:grid-cols-3'>
        {STEPS.map(({ key, picture }) => (
          <li key={key} className='space-y-4'>
            {picture}
            <div className='space-y-1'>
              <h3 className='font-display text-lg font-bold text-zinc-100'>{t(`primer.${key}.title`)}</h3>
              <p className='max-w-prose text-sm leading-relaxed text-zinc-400'>{t(`primer.${key}.body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
