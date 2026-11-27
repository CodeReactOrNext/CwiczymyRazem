"use client";

import { Sheet, SheetContent, SheetTitle } from "assets/components/ui/sheet";
import { cn } from "assets/lib/utils";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type {
  PartId,
  PartTier,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type { ForgeStack } from "feature/arsenal/utils/forgeShelves";
import {
  getForgeSections,
  getPartTierLadder,
} from "feature/arsenal/utils/forgeShelves";
import { motion } from "framer-motion";
import { useIsCompactViewport } from "hooks/useMediaQuery";
import { useMemo, useState } from "react";

import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import type { ForgeMade } from "./ForgeAnvil";
import { ForgeAnvil } from "./ForgeAnvil";
import { ReadyMark } from "./ReadyMark";

interface PartsForgeProps {
  wallet: ScrapPart[];
  fame: number;
}

interface StackRef {
  partId: PartId;
  tier: PartTier;
}

type Filter = "all" | "ready";

const sameStack = (a: StackRef | null, b: StackRef) =>
  a?.partId === b.partId && a.tier === b.tier;

interface StackPlateProps {
  stack: ForgeStack;
  selected: boolean;
  /** Bumped each time a job lands on this stack, to light it once. */
  freshRun: number | null;
  onClick: () => void;
}

/**
 * One tier of one part on its shelf: the stash's own plate, tappable. A tier the
 * player holds none of stays on the shelf grey, as the rung it is — tapping it
 * puts the tier under it on the anvil, which is how it gets made.
 */
const StackPlate = ({
  stack,
  selected,
  freshRun,
  onClick,
}: StackPlateProps) => {
  const labels = useArsenalLabels();
  const color = PART_TIER_COLORS[stack.tier];
  const { progress } = stack;
  const missing = stack.qty <= 0;
  // Nothing under Standard to make it from.
  const makeable =
    !missing || getPartTierLadder(stack.partId)[0] !== stack.tier;

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={!makeable}
      aria-pressed={selected}
      title={`${stack.qty}× ${labels.partName(stack.tier, stack.partId)}`}
      className={cn(
        "relative rounded-md transition-[filter] duration-fast disabled:cursor-default enabled:hover:brightness-125",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100",
        selected && "outline outline-2 outline-offset-2 outline-zinc-100",
      )}>
      <motion.span
        key={freshRun ?? "rest"}
        className='block'
        initial={freshRun != null ? { scale: 1.18 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14 }}>
        <TierPlate color={color} size={56} count={stack.qty} muted={missing}>
          <PartIcon partId={stack.partId} size={34} />
        </TierPlate>
      </motion.span>

      {progress?.ready && (
        <ReadyMark className='absolute -right-1.5 -top-1.5' />
      )}

      {/* The way to the next tier — the stash's thin bar along the socket's floor. */}
      {progress && !progress.ready && (
        <span
          aria-hidden
          className='absolute inset-x-1.5 -bottom-1 h-[3px] overflow-hidden rounded-full bg-white/10'>
          <span
            className='absolute inset-y-0 left-0 rounded-full'
            style={{
              width: `${Math.round(progress.fill * 100)}%`,
              backgroundColor: PART_TIER_COLORS[progress.outputTier],
            }}
          />
        </span>
      )}
    </button>
  );
};

/**
 * The Parts half of the Workshop: the bin laid out on shelves, and the anvil.
 *
 * One stack at a time goes on the anvil — tap a plate, make the next tier. On a
 * wide screen the anvil stands beside the shelves; on a phone it comes up from
 * the bottom over them, so the shelves keep the whole width.
 */
export const PartsForge = ({ wallet, fame }: PartsForgeProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const compact = useIsCompactViewport();
  const [filter, setFilter] = useState<Filter>("all");
  const [picked, setPicked] = useState<StackRef | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  /** The stack a job just landed on, lit once on the shelf. */
  const [fresh, setFresh] = useState<(StackRef & { run: number }) | null>(null);

  const sections = useMemo(
    () => getForgeSections(wallet, fame, filter === "ready"),
    [wallet, fame, filter],
  );
  const allSections = useMemo(
    () => getForgeSections(wallet, fame),
    [wallet, fame],
  );
  const readyTotal = allSections.reduce((sum, s) => sum + s.ready, 0);
  const stacks = allSections.flatMap((s) =>
    s.shelves.flatMap((sh) => sh.stacks),
  );

  // With nothing picked the anvil starts on a stack it can work. A picked stack
  // stays on the anvil even once it is used up — the job that emptied it is
  // still playing there, and `onMade` moves the anvil on when it is done.
  const firstReady = stacks.find((s) => s.progress?.ready);
  const onAnvil: StackRef | null =
    picked ??
    (firstReady ? { partId: firstReady.partId, tier: firstReady.tier } : null);

  const pick = (stack: ForgeStack) => {
    // A grey rung opens the job that makes it: the tier under it.
    const ladder = getPartTierLadder(stack.partId);
    const tier =
      stack.qty > 0
        ? stack.tier
        : (ladder[ladder.indexOf(stack.tier) - 1] ?? stack.tier);
    setPicked({ partId: stack.partId, tier });
    if (compact) setSheetOpen(true);
  };

  const onMade = (made: ForgeMade) => {
    setFresh((f) => ({
      partId: made.partId,
      tier: made.tier,
      run: (f?.run ?? 0) + 1,
    }));
    // Climbing on: once the stack cannot pay for another job, the anvil moves
    // to what it just made, which is often the next job up the ladder.
    if (made.left < made.ratio) {
      setPicked({ partId: made.partId, tier: made.tier });
    }
  };

  const holdsAny = stacks.some((s) => s.qty > 0);

  const anvil = onAnvil && (
    <ForgeAnvil
      key={`${onAnvil.partId}:${onAnvil.tier}`}
      partId={onAnvil.partId}
      tier={onAnvil.tier}
      wallet={wallet}
      fame={fame}
      onStart={() => setPicked(onAnvil)}
      onMade={onMade}
    />
  );

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start'>
      <div className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-4 sm:p-5'>
        <SegmentedControl
          label={t("workshop.forge.filter")}
          options={[
            { value: "all", label: t("workshop.forge.filter_all") },
            {
              value: "ready",
              label: t("workshop.forge.filter_ready"),
              count: readyTotal,
            },
          ]}
          selected={[filter]}
          onSelect={(value) => setFilter(value as Filter)}
        />

        {!holdsAny && (
          <p className='text-sm text-zinc-500'>{t("parts.wallet_empty")}</p>
        )}

        {sections.length === 0 ? (
          <p className='py-10 text-center text-sm text-zinc-500'>
            {t("workshop.forge.nothing_ready")}
          </p>
        ) : (
          sections.map((section) => (
            <section key={section.group} className='flex flex-col gap-1.5'>
              <h3 className='mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-500'>
                {t(`workshop.forge.group.${section.group}`)}
                {section.ready > 0 && <ReadyMark count={section.ready} />}
              </h3>

              {section.shelves.map((shelf) => (
                <div
                  key={shelf.partId}
                  className='grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-lg px-2.5 py-2.5 odd:bg-white/[0.035] sm:grid-cols-[110px_minmax(0,1fr)] sm:px-3'>
                  <span className='truncate text-sm font-semibold text-zinc-300'>
                    {labels.part(shelf.partId)}
                  </span>
                  <div className='flex flex-wrap gap-2.5'>
                    {shelf.stacks.map((stack) => (
                      <StackPlate
                        key={stack.tier}
                        stack={stack}
                        selected={!!onAnvil && sameStack(onAnvil, stack)}
                        freshRun={
                          fresh && sameStack(fresh, stack) ? fresh.run : null
                        }
                        onClick={() => pick(stack)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </div>

      {compact ? (
        <Sheet open={sheetOpen && !!anvil} onOpenChange={setSheetOpen}>
          <SheetContent
            side='bottom'
            className='max-h-[92vh] overflow-y-auto bg-zinc-950 p-0'>
            <SheetTitle className='sr-only'>
              {onAnvil ? labels.partName(onAnvil.tier, onAnvil.partId) : ""}
            </SheetTitle>
            {anvil}
          </SheetContent>
        </Sheet>
      ) : (
        <div className='sticky top-4'>
          {anvil ?? (
            <div className='flex flex-col items-center gap-4 rounded-lg bg-zinc-900/40 px-6 py-16 text-center'>
              <span className='h-[88px] w-[88px] rounded-md bg-white/[0.03]' />
              <p className='max-w-[28ch] text-sm text-zinc-400'>
                {t("workshop.forge.pick")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
