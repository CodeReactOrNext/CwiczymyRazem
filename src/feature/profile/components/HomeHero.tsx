import { Button } from "assets/components/ui/button";
import { Kostek, type KostekMood } from "components/Mascot/Kostek";
import { pageTitleClass } from "components/PageTitle/PageTitle";
import { inkAccent } from "lib/colorTheme/colorTheme";
import { ArrowRight, Flame, Loader2, Settings2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

interface HomeHeroProps {
  title: string;
  /** The one fact under the title: today's time, or the streak that is at stake. */
  fact?: { text: string; isStreak?: boolean } | null;
  cta: {
    label: string;
    /** White until today's session is in; after it the key steps back. */
    isPrimary: boolean;
    onClick: () => void;
  };
  /** The equipped guitar. Without one Kostek has the stage. */
  guitar?: {
    src: string;
    caption?: { name: string; rarity: string };
    /**
     * What the stage is lit with: the rarity colour, and how far the wash goes
     * into it (0–1) — the rarer the guitar, the further.
     */
    light?: { color: string; strength: number };
  } | null;
  mascot: { mood: KostekMood; lookAt?: "left" | "right" };
  /** Stats under the button on a phone, where the strip does not exist. */
  stackedStats: ReactNode;
  /** Stats in the strip under the stage, from `md` up. */
  stripStats: ReactNode;
  customize: {
    label: string;
    refreshingLabel: string;
    isEditing: boolean;
    isRefreshing: boolean;
    onClick: () => void;
  };
}

/**
 * Home's header: a stage and, from `md` up, a strip under it.
 *
 * The stage belongs to the guitar — nothing is written over it. The title, the
 * fact and the Practice key stand beside it (under it on a phone, where the
 * guitar gets a band of its own). The strip carries the progress numbers and
 * the Customize key, which used to float alone between the hero and the cards.
 */
export const HomeHero = ({
  title,
  fact,
  cta,
  guitar,
  mascot,
  stackedStats,
  stripStats,
  customize,
}: HomeHeroProps) => {
  // The one place the rarity colour is used at full strength: its own name.
  const rarityInk = guitar?.light ? inkAccent(guitar.light.color) : undefined;

  return (
    <section>
      <div className='relative overflow-hidden md:h-64'>
        {/* The figure. A band of its own on a phone; from md the band dissolves
          (static, no height) and the figure is placed against the stage. */}
        <div className='relative h-[150px] overflow-hidden md:static md:h-auto md:overflow-visible'>
          {guitar?.light ? (
            // The guitar's rarity as the light it stands in: one wash across the
            // stage, out of the dark on the title's side and into the rarity
            // colour behind the guitar. No spots or halos — the colour and how
            // far it is allowed to go say which tier this is.
            <div
              aria-hidden
              className='pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent_0%,var(--hero-light)_70%)] md:bg-[linear-gradient(100deg,transparent_22%,var(--hero-light)_78%)]'
              style={
                {
                  "--hero-light": `color-mix(in srgb, ${guitar.light.color} ${Math.round(guitar.light.strength * 100)}%, transparent)`,
                } as CSSProperties
              }
            />
          ) : (
            // Light behind the figure, not an outline around it.
            <div
              aria-hidden
              className='light-hide pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_95%_at_50%_50%,rgba(255,255,255,0.07),transparent_70%)] md:bg-[radial-gradient(ellipse_46%_95%_at_63%_50%,rgba(255,255,255,0.07),transparent_70%)]'
            />
          )}
          {guitar ? (
            <img
              src={guitar.src}
              alt=''
              aria-hidden
              draggable={false}
              className='light-flat pointer-events-none absolute left-1/2 top-[-37px] h-[190px] w-auto max-w-none -translate-x-1/2 -rotate-[8deg] select-none md:left-[clamp(340px,34%,440px)] md:top-[-19px] md:h-[250px] md:translate-x-0 lg:top-[-54px] lg:h-[310px]'
              style={{ filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.7))" }}
            />
          ) : (
            // A wrapper does the placing: Kostek animates its own transform.
            <div className='pointer-events-none absolute inset-x-0 top-3.5 flex justify-center md:inset-x-auto md:left-[max(56%,420px)] md:top-[30px]'>
              <Kostek
                mood={mascot.mood}
                lookAt={mascot.lookAt}
                className='h-[126px] md:h-[200px]'
              />
            </div>
          )}
        </div>

        {/* Desktop only. On a phone the guitar and its light say enough; the
            name over the title was one line too many. */}
        {guitar?.caption && (
          <div className='absolute bottom-6 right-10 hidden flex-col items-end gap-0.5 lg:flex'>
            <span className='text-sm font-semibold text-zinc-200'>
              {guitar.caption.name}
            </span>
            <span
              className='text-xs font-semibold text-zinc-400'
              style={rarityInk ? { color: rarityInk } : undefined}>
              {guitar.caption.rarity}
            </span>
          </div>
        )}

        <div className='relative flex flex-col gap-5 px-5 pb-6 pt-4 md:h-full md:max-w-[400px] md:justify-center md:gap-6 md:p-0 md:pl-10'>
          <div className='flex flex-col gap-1 md:gap-1.5'>
            <h1 className={pageTitleClass}>{title}</h1>
            {fact && (
              <p
                className={
                  fact.isStreak
                    ? "flex items-center gap-1.5 text-sm font-medium text-orange-400 md:text-[15px]"
                    : "text-sm font-medium text-zinc-400 md:text-[15px]"
                }>
                {fact.isStreak && (
                  <Flame aria-hidden className='h-4 w-4 shrink-0' />
                )}
                {fact.text}
              </p>
            )}
          </div>

          <Button
            variant={cta.isPrimary ? "default" : "secondary"}
            size='xl'
            onClick={cta.onClick}
            className='group/btn w-full md:w-auto md:self-start'>
            {cta.label}
            <ArrowRight className='transition-transform duration-base group-hover/btn:translate-x-1' />
          </Button>

          {/* No backdrop of its own: on a phone the hero is the one level of card. */}
          <div className='select-none pt-1 md:hidden'>{stackedStats}</div>
        </div>
      </div>

      <div className='hidden h-[76px] items-center gap-10 bg-zinc-800/40 px-10 md:flex lg:gap-14'>
        {stripStats}
        <div className='relative shrink-0'>
          {/* Out of the flow, so the level bar does not shift when it shows. */}
          {customize.isRefreshing && !customize.isEditing && (
            <span
              role='status'
              className='absolute right-full top-1/2 mr-3 flex -translate-y-1/2 items-center'>
              <Loader2
                aria-hidden
                className='h-3.5 w-3.5 animate-spin text-zinc-500'
              />
              <span className='sr-only'>{customize.refreshingLabel}</span>
            </span>
          )}
          <Button
            type='button'
            variant='subtle'
            size='icon'
            aria-label={customize.label}
            title={customize.label}
            disabled={customize.isEditing}
            onClick={customize.onClick}>
            <Settings2 aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
};
