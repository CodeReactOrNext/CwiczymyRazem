import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { SlateItemArt } from "feature/supporterCase/components/SlateItemArt";
import { useSupporterCase } from "feature/supporterCase/hooks/useSupporterCase";
import { CalendarClock, Heart, Package } from "lucide-react";
import Link from "next/link";

interface SupporterCaseCardProps {
  currentFame: number;
  onOpen: (caseType: string) => void;
  isOpening: boolean;
}

/**
 * The supporter case on the shop shelf.
 *
 * It shows all six items outright, because that is the entire product: this is
 * the one case where you know exactly what can come out, and the reason you
 * know is that supporters spent their tokens deciding it. Hiding the slate
 * behind the panel would leave the case looking like an expensive Featured.
 */
export const SupporterCaseCard = ({
  currentFame,
  onOpen,
  isOpening,
}: SupporterCaseCardProps) => {
  const { data: state } = useSupporterCase();
  const caseDef = CASE_DEFINITIONS.supporter;

  if (!caseDef) return null;

  const canAfford = currentFame >= caseDef.fameCost;

  return (
    <section className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400'>
            <Package size={20} />
          </span>
          <div>
            <h3 className='flex items-center gap-2 text-lg font-bold text-zinc-100'>
              {caseDef.name}
              <Heart
                size={13}
                fill='currentColor'
                className='text-amber-400'
                aria-label='Chosen by supporters'
              />
            </h3>
            <p className='mt-0.5 text-sm text-zinc-400'>
              {caseDef.description}
            </p>
          </div>
        </div>

        {state && (
          <span className='inline-flex items-center gap-1.5 text-xs text-zinc-500'>
            <CalendarClock size={13} />
            {state.daysLeft === 1
              ? "new slate tomorrow"
              : `new slate in ${state.daysLeft} days`}
          </span>
        )}
      </div>

      {state && (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          {state.slots.map((slot) => {
            const styles = RARITY_STYLES[slot.rarity];

            return (
              <div
                key={slot.rarity}
                className='flex items-center gap-3 rounded-lg bg-zinc-950/40 p-3'>
                {slot.current ? (
                  <SlateItemArt
                    item={slot.current}
                    color={styles.baseColor}
                    size={40}
                  />
                ) : (
                  <span className='h-10 w-10 shrink-0 rounded-md bg-zinc-950/40' />
                )}

                <div className='min-w-0'>
                  <span
                    className={cn(
                      "block text-[10px] font-black tracking-widest",
                      styles.text,
                    )}>
                    {slot.rarity}
                  </span>
                  <span className='block truncate text-sm font-bold text-zinc-100'>
                    {slot.current?.name ?? "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className='flex flex-wrap items-center gap-4'>
        <Button
          onClick={() => onOpen("supporter")}
          disabled={!canAfford || isOpening}>
          {canAfford
            ? `Open for ${caseDef.fameCost} Fame`
            : `Needs ${caseDef.fameCost} Fame`}
        </Button>

        <Link
          href='/supporter'
          className='text-xs text-zinc-500 transition-colors hover:text-zinc-300'>
          Supporters pick what goes in here →
        </Link>
      </div>
    </section>
  );
};
