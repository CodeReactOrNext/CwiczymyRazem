import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { GuitarRack } from "feature/arsenal/components/Rig/GuitarRack";
import type {
  BoardSkinState,
  RackBays,
  RackSkin,
} from "feature/arsenal/data/boardSkins";
import {
  RACK_SKINS,
  SKINS_BY_ID,
  withRackOnBays,
} from "feature/arsenal/data/boardSkins";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { rackSceneSrc } from "feature/arsenal/utils/rackLookArt";
import type { ShopItemLabels } from "feature/cosmetics/components/ShopItemCard";
import { ShopItemCard } from "feature/cosmetics/components/ShopItemCard";
import type { useBoardSkinShop } from "feature/supporterPanel/hooks/useBoardSkinShop";
import { useTranslation } from "hooks/useTranslation";
import { Check, Eye, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

/** Which bays the shelf is dressing: the whole wall, or one of the three. */
type Target = "all" | "0" | "1" | "2";

const BAYS_OF: Record<Target, number[]> = {
  all: [0, 1, 2],
  "0": [0],
  "1": [1],
  "2": [2],
};

const sameBays = (a: RackBays, b: RackBays) =>
  a.every((id, bay) => id === b[bay]);

type SkinShop = ReturnType<typeof useBoardSkinShop>;

interface RackShelfProps {
  state: BoardSkinState;
  tokensLeft: number;
  /** Window shopping without the badge: trying on works, buying does not. */
  preview: boolean;
  labels: ShopItemLabels;
  buy: SkinShop["buy"];
  wear: SkinShop["wear"];
}

/**
 * The display cases, with a fitting room: the player's own guitar wall above
 * the shelf, and every case one press away from hanging on it.
 *
 * Trying a case on changes nothing but this page — the wall goes back to what
 * the account wears the moment the tab is left. Buying or putting on writes
 * the bays picked in the tray, so a case can go behind one guitar or all
 * three, and one purchase covers either.
 */
export const RackShelf = ({
  state,
  tokensLeft,
  preview,
  labels,
  buy,
  wear,
}: RackShelfProps) => {
  const { t } = useTranslation("supporter");
  const { data: arsenal } = useArsenalData();
  const wallRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Target>("all");
  // What is being tried on; `null` while the wall shows what the account wears.
  const [draft, setDraft] = useState<RackBays | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const bays = BAYS_OF[target];
  const shown = draft ?? state.rack;
  const busy = buy.isPending || wear.isPending;
  const covers = (rack: RackBays, skinId: string) =>
    bays.every((bay) => rack[bay] === skinId);

  const tryOn = (skin: RackSkin) => {
    // A second press takes it back down to what was there.
    const next = covers(shown, skin.id)
      ? (shown.map((id, bay) =>
          bays.includes(bay) ? state.rack[bay] : id,
        ) as RackBays)
      : withRackOnBays(shown, skin.id, bays);
    setDraft(sameBays(next, state.rack) ? null : next);
    wallRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const unowned = [...new Set(shown)]
    .filter((id): id is string => id !== null && !state.owned.includes(id))
    .map((id) => SKINS_BY_ID.get(id)?.name)
    .filter(Boolean);

  return (
    <section className='flex flex-col gap-6'>
      <div>
        <h3 className='text-base font-bold text-zinc-100'>
          {t("shop.racks_title")}
        </h3>
        <p className='mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400'>
          {t("shop.racks_body")}
        </p>
      </div>

      <div className='grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start'>
        {/* The fitting room: stays in sight while the shelf scrolls past. */}
        <div ref={wallRef} className='flex flex-col gap-4 xl:sticky xl:top-6'>
          <GuitarRack
            strip
            slots={arsenal?.rig.guitarSlots ?? [null, null, null]}
            inventory={arsenal?.inventory ?? []}
            looks={shown.map((id) => {
              const skin = id ? SKINS_BY_ID.get(id) : undefined;
              return skin?.kind === "rack" ? skin.look : undefined;
            })}
            emptyLamp={1}
          />
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <SegmentedControl<Target>
              label={t("shop.rack_target")}
              options={[
                { value: "all", label: t("shop.rack_all") },
                { value: "0", label: "I" },
                { value: "1", label: "II" },
                { value: "2", label: "III" },
              ]}
              selected={[target]}
              onSelect={setTarget}
            />
            {draft && (
              <Button variant='ghost' size='sm' onClick={() => setDraft(null)}>
                <RotateCcw />
                {t("shop.rack_reset")}
              </Button>
            )}
          </div>
          {draft && unowned.length > 0 && (
            <p className='text-sm text-zinc-400'>
              {t("shop.rack_trying", { names: unowned.join(", ") })}
            </p>
          )}
        </div>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3'>
          {RACK_SKINS.map((skin) => {
            const onWall = covers(shown, skin.id);
            const worn = covers(state.rack, skin.id);
            return (
              <ShopItemCard
                key={skin.id}
                art={
                  <div className='force-dark relative overflow-hidden rounded-lg'>
                    <img
                      src={rackSceneSrc(skin.look, "thumb")}
                      alt=''
                      loading='lazy'
                      className='block aspect-[3/4] w-full object-cover'
                    />
                    <Button
                      size='sm'
                      variant='secondary'
                      aria-pressed={onWall}
                      onClick={() => tryOn(skin)}
                      className={cn(
                        "absolute bottom-2 left-2",
                        onWall && "text-emerald-300",
                      )}>
                      {onWall ? <Check /> : <Eye />}
                      {onWall ? t("shop.rack_on_wall") : t("shop.rack_try")}
                    </Button>
                  </div>
                }
                name={skin.name}
                price={skin.price}
                owned={state.owned.includes(skin.id)}
                worn={worn}
                canAfford={tokensLeft >= skin.price}
                confirming={confirmingId === skin.id}
                busy={busy}
                preview={preview}
                labels={{ ...labels, worn: t("shop.rack_in_use") }}
                onAskBuy={() => setConfirmingId(skin.id)}
                onBuy={() =>
                  buy.mutate(
                    { skin, bays },
                    {
                      onSuccess: () => setDraft(null),
                      onSettled: () => setConfirmingId(null),
                    },
                  )
                }
                onToggleWear={() =>
                  wear.mutate(
                    { kind: "rack", skinId: worn ? null : skin.id, bays },
                    { onSuccess: () => setDraft(null) },
                  )
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
