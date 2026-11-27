import { cn } from "assets/lib/utils";
import type { TraitKind } from "feature/arsenal/data/traits";
import { useTranslation } from "hooks/useTranslation";
import { Guitar } from "lucide-react";

interface ImprintKindMarkProps {
  kind: TraitKind;
  className?: string;
}

/** A stompbox seen from above: two knobs and the footswitch. */
const PedalGlyph = () => (
  <svg viewBox='0 0 12 12' width={12} height={12} aria-hidden>
    <rect x='2.5' y='1' width='7' height='10' rx='1.6' fill='currentColor' />
    <circle cx='4.6' cy='3.4' r='0.9' className='fill-zinc-100' />
    <circle cx='7.4' cy='3.4' r='0.9' className='fill-zinc-100' />
    <rect x='4' y='6.6' width='4' height='2.6' rx='0.8' className='fill-zinc-100' />
  </svg>
);

/**
 * Which kind of instrument a Trait Imprint goes into. Every imprint wears the
 * same emerald plate, so this is the one thing that tells a guitar trait from a
 * pedal trait before the player tries to put it somewhere.
 *
 * Shaped like the plug and hammer marks, and neutral for the same reason: every
 * hue a socket can wear already means something.
 */
export const ImprintKindMark = ({ kind, className }: ImprintKindMarkProps) => {
  const { t } = useTranslation("arsenal");

  return (
    <span
      title={t(`trait_craft.imprint_caps.${kind}`)}
      aria-hidden
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-zinc-100 text-zinc-900 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]",
        className,
      )}>
      {kind === "guitar" ? (
        <Guitar size={12} strokeWidth={2.75} aria-hidden />
      ) : (
        <PedalGlyph />
      )}
    </span>
  );
};
