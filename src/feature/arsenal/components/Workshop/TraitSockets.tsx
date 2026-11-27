"use client";

import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { TraitCardInfo } from "feature/arsenal/components/CardTraits";
import {
  imprintAsTrait,
  type InsertTarget,
  listInsertTargets,
  MAX_ITEM_TRAITS,
} from "feature/arsenal/data/traitCraft";
import type { ResolvedTrait } from "feature/arsenal/data/traits";
import { formatTraitValue, getItemTraits } from "feature/arsenal/data/traits";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import {
  useExtractTrait,
  useInsertTrait,
} from "feature/arsenal/hooks/useTraitCraft";
import type { TraitImprint } from "feature/arsenal/types/arsenal.types";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { StashItemDialog } from "../Collection/StashItemDialog";
import {
  ExtractorArt,
  IMPRINT_TILE_COLOR,
  ImprintArt,
} from "../Traits/TraitItemArt";
import { FameCoin } from "./FameCoin";
import { GO_KEY } from "./goKey";
import { ReadyMark } from "./ReadyMark";

/**
 * A trait socket in the bench's mod-socket shape: a dark square with a hairline
 * of the traits' emerald, and the imprint's own art in it — the same object the
 * player holds in the stash, so a trait in an instrument reads as an imprint
 * that went in. An empty one is the faint plate of a free mod slot.
 */
const TraitPlate = ({
  size,
  filled,
  invite = false,
  children,
}: {
  size: number;
  filled: boolean;
  /** An imprint the player owns fits here: the empty plate takes the emerald. */
  invite?: boolean;
  children?: ReactNode;
}) => (
  <span
    className={cn(
      "relative flex shrink-0 items-center justify-center rounded-lg",
      !filled && (invite ? "text-emerald-300" : "text-zinc-500"),
    )}
    style={{
      width: size,
      height: size,
      backgroundColor: filled
        ? "rgba(9,9,11,0.8)"
        : invite
          ? `${IMPRINT_TILE_COLOR}17`
          : "rgba(244,244,245,0.04)",
      boxShadow: `inset 0 0 0 1px ${
        filled || invite ? `${IMPRINT_TILE_COLOR}4d` : "rgba(244,244,245,0.08)"
      }`,
    }}>
    {children}
  </span>
);

/** One slot on the bench: the socket and what is in it, on a dark tray of its own. */
const SLOT_CLASS =
  "flex min-w-0 items-center gap-3 rounded-xl bg-zinc-950/50 p-2 pr-4 text-left transition-colors duration-fast hover:bg-zinc-900/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60";

interface TraitSocketsProps {
  entry: WorkshopEntry;
  states: TraitCardInfo[] | null;
  fame: number;
}

type Open = { kind: "trait"; index: number } | { kind: "empty" } | null;

/**
 * The instrument's three trait sockets, under it on the bench.
 *
 * Every instrument shows all three, filled or not: an empty socket is what
 * tells a player that traits can be added at all. An empty one turns emerald,
 * with the hammer mark, when an imprint they own fits it; a filled one opens
 * the trait, where an extractor can lift it out.
 *
 * (Round sockets with a drawn gem were tried first and looked like clip-art;
 * these are the bench's mod sockets, so the two kinds of slot match.)
 */
export const TraitSockets = ({ entry, states, fame }: TraitSocketsProps) => {
  const { data } = useArsenalData();
  const labels = useArsenalLabels();
  const { t } = labels;
  const [open, setOpen] = useState<Open>(null);
  const { mutate: extract, isPending: isExtracting } = useExtractTrait();
  const { mutate: insert, isPending: isInserting } = useInsertTrait();

  const extractors = data?.traitExtractors?.length ?? 0;

  /** Imprints this instrument can take, each with its verdict. */
  const fits = useMemo(() => {
    const out: { imprint: TraitImprint; target: InsertTarget }[] = [];
    for (const imprint of data?.traitImprints ?? []) {
      if (imprint.kind !== entry.kind) continue;
      const target = listInsertTargets(
        imprint,
        data?.inventory ?? [],
        data?.effectInventory ?? [],
      ).find((candidate) => candidate.itemId === entry.id);
      if (target?.decision.ok) out.push({ imprint, target });
    }
    return out;
  }, [data, entry.id, entry.kind]);

  const traits = entry.traits;
  const openTrait: ResolvedTrait | null =
    open?.kind === "trait" ? (traits[open.index] ?? null) : null;

  return (
    <>
      <div
        role='list'
        aria-label={t("workshop.gems.title")}
        className='relative mx-auto grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3'>
        {Array.from({ length: MAX_ITEM_TRAITS }, (_, i) => {
          const trait = traits[i];

          if (trait) {
            const unmet = states?.[i]?.state === "unmet";
            return (
              <button
                key={trait.def.id}
                type='button'
                role='listitem'
                onClick={() => setOpen({ kind: "trait", index: i })}
                className={SLOT_CLASS}>
                <TraitPlate size={48} filled>
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={trait.def.id}
                      className={cn(
                        "block h-9 w-9",
                        unmet && "opacity-40 grayscale",
                      )}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 16,
                        opacity: { duration: 0.12 },
                      }}>
                      <ImprintArt />
                    </motion.span>
                  </AnimatePresence>
                </TraitPlate>
                <span className='flex min-w-0 flex-col gap-0.5'>
                  <span className='truncate text-sm font-bold text-zinc-100'>
                    {labels.traitLabel(trait)}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      unmet ? "text-zinc-500" : "text-emerald-300",
                    )}>
                    {formatTraitValue(trait.value)} Fame/h
                  </span>
                </span>
              </button>
            );
          }

          const invite = fits.length > 0;
          return (
            <button
              key={`empty-${i}`}
              type='button'
              role='listitem'
              onClick={() => setOpen({ kind: "empty" })}
              className={SLOT_CLASS}>
              <TraitPlate size={48} filled={false} invite={invite}>
                <Plus size={18} />
              </TraitPlate>
              <span
                className={cn(
                  "flex min-w-0 items-center gap-2 text-sm font-semibold",
                  invite ? "text-emerald-200" : "text-zinc-500",
                )}>
                <span className='truncate'>
                  {invite ? t("workshop.gems.add") : t("workshop.gems.empty")}
                </span>
                {invite && <ReadyMark />}
              </span>
            </button>
          );
        })}
      </div>

      <StashItemDialog
        wide
        isOpen={open !== null}
        onClose={() => setOpen(null)}
        title={
          openTrait
            ? labels.traitLabel(openTrait)
            : t("workshop.gems.socket", {
                n: traits.length + 1,
                max: MAX_ITEM_TRAITS,
              })
        }>
        <div className='flex flex-col gap-8 rounded-lg bg-zinc-900 px-6 pb-8 pt-7 sm:px-9 sm:pb-9 sm:pt-8'>
          {openTrait ? (
            <>
              <div className='flex items-center gap-4'>
                <TraitPlate size={72} filled>
                  <span className='block h-12 w-12'>
                    <ImprintArt />
                  </span>
                </TraitPlate>
                <div className='flex min-w-0 flex-col gap-1'>
                  <span className='text-2xl font-black leading-tight text-zinc-100'>
                    {labels.traitLabel(openTrait)}
                  </span>
                  <span className='text-sm font-bold tabular-nums text-emerald-300'>
                    {formatTraitValue(openTrait.value)} Fame/h
                  </span>
                </div>
              </div>

              <p className='text-[15px] leading-relaxed text-zinc-300'>
                {labels.traitDescription(openTrait)}
              </p>

              {/* Lifting it out: what it takes, then the one key. */}
              <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-4 rounded-lg bg-zinc-950/50 p-4'>
                  <span
                    className={cn(
                      "block h-11 w-11 shrink-0",
                      extractors <= 0 && "opacity-40 grayscale",
                    )}>
                    <ExtractorArt />
                  </span>
                  <span className='text-sm leading-snug text-zinc-400'>
                    {extractors > 0
                      ? t("trait_craft.extract_cost", { count: extractors })
                      : t("trait_craft.need_extractor")}
                  </span>
                </div>
                {extractors > 0 && (
                  <button
                    type='button'
                    disabled={isExtracting}
                    onClick={() =>
                      extract(
                        {
                          itemId: entry.id,
                          kind: entry.kind,
                          traitId: openTrait.def.id,
                        },
                        { onSuccess: () => setOpen(null) },
                      )
                    }
                    className={cn(
                      buttonVariants({ size: "xl" }),
                      "h-14 w-full text-lg",
                    )}>
                    {isExtracting
                      ? t("trait_craft.extracting")
                      : t("trait_craft.extract")}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className='flex items-center gap-4'>
                <TraitPlate size={72} filled={false} invite={fits.length > 0}>
                  <Plus size={26} />
                </TraitPlate>
                <div className='flex min-w-0 flex-col gap-1'>
                  <span className='text-2xl font-black leading-tight text-zinc-100'>
                    {t("workshop.gems.socket", {
                      n: traits.length + 1,
                      max: MAX_ITEM_TRAITS,
                    })}
                  </span>
                  <span className='truncate text-sm text-zinc-400'>
                    {entry.name}
                  </span>
                </div>
              </div>

              {fits.length === 0 ? (
                <div className='flex items-center gap-4 rounded-lg bg-zinc-950/50 p-4'>
                  <span className='block h-11 w-11 shrink-0 opacity-40 grayscale'>
                    <ImprintArt />
                  </span>
                  <p className='text-sm leading-snug text-zinc-400'>
                    {t("workshop.gems.no_imprint")}
                  </p>
                </div>
              ) : (
                <div className='flex flex-col gap-3'>
                  <p className='text-sm text-zinc-400'>
                    {t("workshop.gems.add_body")}
                  </p>
                  {fits.map(({ imprint, target }) => {
                    const [trait] = getItemTraits({
                      traits: [imprintAsTrait(imprint)],
                    });
                    const cost = target.decision.ok ? target.decision.cost : 0;
                    const short = Math.max(0, cost - fame);
                    return (
                      <div
                        key={imprint.id}
                        className='flex items-center gap-3 rounded-lg bg-zinc-950/50 p-3 sm:gap-4'>
                        <span className='block h-11 w-11 shrink-0'>
                          <ImprintArt />
                        </span>
                        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                          <span className='truncate text-[15px] font-bold text-zinc-100'>
                            {trait ? labels.traitLabel(trait) : imprint.traitId}
                          </span>
                          {trait && (
                            <span className='text-xs font-bold tabular-nums text-emerald-300'>
                              {formatTraitValue(trait.value)} Fame/h
                            </span>
                          )}
                          {short > 0 && (
                            <span className='text-xs font-semibold text-red-300'>
                              {t("workshop.forge.fame_short", {
                                fame: short.toLocaleString(),
                              })}
                            </span>
                          )}
                        </span>
                        <button
                          type='button'
                          disabled={short > 0 || isInserting}
                          onClick={() =>
                            insert(
                              {
                                imprintId: imprint.id,
                                itemId: entry.id,
                                kind: entry.kind,
                              },
                              { onSuccess: () => setOpen(null) },
                            )
                          }
                          aria-label={t("trait_craft.insert_for", {
                            fame: cost.toLocaleString(),
                          })}
                          className={cn(
                            buttonVariants({ size: "lg" }),
                            short === 0 && GO_KEY,
                            "h-12 shrink-0 gap-1.5 px-4 tabular-nums",
                          )}>
                          <FameCoin size={16} />
                          {cost.toLocaleString()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </StashItemDialog>
    </>
  );
};
