import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import {
  EFFECT_DEFINITIONS,
  EFFECTS_BY_ID,
} from "feature/arsenal/data/effectDefinitions";
import { getEffectValue } from "feature/arsenal/data/effectStats";
import {
  GUITAR_DEFINITIONS,
  GUITARS_BY_ID,
} from "feature/arsenal/data/guitarDefinitions";
import { getItemValue } from "feature/arsenal/data/itemStats";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import {
  getModResaleValue,
  getPartResaleValue,
} from "feature/arsenal/data/resale";
import {
  canFitSalvagedMod,
  getSalvageableMod,
  getSalvagedModOptions,
  getScrappedMods,
} from "feature/arsenal/data/salvage";
import {
  getEffectSubject,
  getGuitarSubject,
  getModDef,
} from "feature/arsenal/data/workshop";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { useFuseParts } from "feature/arsenal/hooks/useFuseParts";
import { useListItem } from "feature/arsenal/hooks/useMarketplace";
import { useScrapEffect } from "feature/arsenal/hooks/useScrapEffect";
import { useScrapEffectsBulk } from "feature/arsenal/hooks/useScrapEffectsBulk";
import { useScrapGuitar } from "feature/arsenal/hooks/useScrapGuitar";
import { useScrapGuitarsBulk } from "feature/arsenal/hooks/useScrapGuitarsBulk";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { useSellEffectsBulk } from "feature/arsenal/hooks/useSellEffectsBulk";
import { useSellGuitar } from "feature/arsenal/hooks/useSellGuitar";
import { useSellGuitarsBulk } from "feature/arsenal/hooks/useSellGuitarsBulk";
import { useSellPart } from "feature/arsenal/hooks/useSellPart";
import { useSellSalvagedMod } from "feature/arsenal/hooks/useSellSalvagedMod";
import { useUnequipGuitar } from "feature/arsenal/hooks/useUnequipGuitar";
import { useUpdatePedalboard } from "feature/arsenal/hooks/useUpdatePedalboard";
import { useUpdateRig } from "feature/arsenal/hooks/useUpdateRig";
import { useUpdateStashLayout } from "feature/arsenal/hooks/useUpdateStashLayout";
import { useWorkshopMod } from "feature/arsenal/hooks/useWorkshopMod";
import {
  getEffectEntries,
  getGuitarEntries,
} from "feature/arsenal/utils/collectionEntries";
import type {
  CollectionScope,
  CollectionSort,
} from "feature/arsenal/utils/collectionFilter";
import {
  filterAndSortEntries,
  isScopeVisible,
  matchesQuery,
} from "feature/arsenal/utils/collectionFilter";
import {
  getEffectDuplicates,
  getGuitarDuplicates,
} from "feature/arsenal/utils/duplicates";
import { getInUseGuitarIds } from "feature/arsenal/utils/inUse";
import {
  getEffectScrapYield,
  getGuitarScrapYield,
  groupWalletByPart,
} from "feature/arsenal/utils/scrap";
import type { StashLayout } from "feature/arsenal/utils/stashLayout";
import {
  columnOf,
  resolveLayout,
  rowOf,
} from "feature/arsenal/utils/stashLayout";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import {
  ArrowDownWideNarrow,
  Guitar,
  Info,
  Layers,
  Store,
  Trash2,
  Unplug,
  Wrench,
} from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "store/hooks";
import { useResponsiveStore } from "store/useResponsiveStore";

import type {
  ArsenalUserData,
  EffectInventoryItem,
  InventoryItem,
  PartId,
  PartTier,
  RigSetup,
  SalvagedMod,
  ScrapPart,
} from "../../types/arsenal.types";
import { DEFAULT_RIG } from "../../types/arsenal.types";
import { BulkDuplicatesDialog } from "../GuitarInventory/BulkDuplicatesDialog";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { EffectStashTile } from "../GuitarInventory/EffectStashTile";
import { EquipTargetDialog } from "../GuitarInventory/EquipTargetDialog";
import type { EquipTarget } from "../GuitarInventory/GuitarCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { GuitarStashTile } from "../GuitarInventory/GuitarStashTile";
import { SellConfirmDialog } from "../GuitarInventory/SellConfirmDialog";
import { ListItemDialog } from "../Marketplace/ListItemDialog";
import { PartIcon } from "../Parts/PartIcon";
import { ScrapConfirmDialog } from "../Parts/ScrapConfirmDialog";
import { ModArt } from "../Workshop/ModArt";
import { CollectionEmptyResult } from "./CollectionEmptyResult";
import { CollectionSectionHeader } from "./CollectionSectionHeader";
import { FitSalvagedDialog } from "./FitSalvagedDialog";
import { SalvagedModCard } from "./SalvagedModCard";
import { ScrapPartCard } from "./ScrapPartCard";
import { StashBoard } from "./StashBoard";
import type { StashMenuItem } from "./StashContextMenu";
import { StashContextMenu } from "./StashContextMenu";
import { StashItemDialog } from "./StashItemDialog";
import type { StashDropTarget, StashPlacement } from "./StashTile";
import { StashTile } from "./StashTile";
import { useStashDrag } from "./useStashDrag";

/** Which half of the arsenal an id belongs to. */
type Kind = "guitar" | "effect";

/** A confirm dialog waiting on the player, whatever it is about. */
type Pending = {
  action: "sell" | "list" | "scrap";
  kind: Kind;
  itemId: string;
} | null;

/** A sale of something that is not gear, waiting on the same confirm dialog. */
type ResalePending =
  | { kind: "mod"; mod: SalvagedMod }
  | { kind: "part"; partId: PartId; tier: PartTier; qty: number }
  | null;

/** One thing hanging on the board, with everything its socket needs to draw. */
type BoardPiece =
  | {
      id: string;
      tall: true;
      kind: "guitar";
      item: InventoryItem;
      name: string;
    }
  | {
      id: string;
      tall: false;
      kind: "effect";
      item: EffectInventoryItem;
      name: string;
    }
  | {
      id: string;
      tall: false;
      kind: "part";
      part: ScrapPart & { tier: PartTier };
      name: string;
    }
  | {
      id: string;
      tall: false;
      kind: "mod";
      mod: SalvagedMod;
      name: string;
    };

interface StashInventoryProps {
  data: ArsenalUserData;
  query: string;
  sort: CollectionSort;
  scope: CollectionScope;
  /** The player dragged something while a sort was still driving the board. */
  onManualArrange: () => void;
}

const bulkButtonClass =
  "flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors disabled:opacity-50 hover:bg-red-500/20";

const arrangeButtonClass =
  "flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-700/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50";

/**
 * The orders Tidy up can lay the board out in, said as what the player gets
 * rather than as the name of a sort — this writes their arrangement, so it is
 * worth being plain about what is about to happen to it.
 */
const ARRANGE_ORDERS: { id: CollectionSort; label: string }[] = [
  { id: "equipped", label: "What I'm playing first" },
  { id: "type", label: "Guitars, then pedals" },
  { id: "rarity", label: "Rarest first" },
  { id: "level", label: "Highest level first" },
  { id: "newest", label: "Newest first" },
];

/** Part stacks get a stable id of their own — they have no inventory row. */
const partPieceId = (partId: string, tier: string) => `part:${partId}:${tier}`;

/** Mods are purple everywhere in the arsenal — the bench, the picker, the socket. */
const MOD_TILE_COLOR = "#c084fc";

/**
 * One board for the whole arsenal, arranged by hand.
 *
 * Guitars, pedals and salvaged parts used to be three separate walls, each with
 * its own heading and its own grid. They are all just things the player owns, so
 * they hang in one cabinet: parts take a socket, pedals take a socket, guitars
 * take two — and under `Manual` order every one of them can be picked up and
 * dropped somewhere else, which is the only ordering a collector really trusts.
 */
export const StashInventory = ({
  data,
  query,
  sort,
  scope,
  onManualArrange,
}: StashInventoryProps) => {
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const { mutate: unequip } = useUnequipGuitar();
  const { mutate: sellGuitar, isPending: isSellingGuitar } = useSellGuitar();
  const { mutate: sellEffect, isPending: isSellingEffect } = useSellEffect();
  const { mutate: sellGuitarsBulk, isPending: isSellingGuitarsBulk } =
    useSellGuitarsBulk();
  const { mutate: sellEffectsBulk, isPending: isSellingEffectsBulk } =
    useSellEffectsBulk();
  const { mutate: scrapGuitarsBulk, isPending: isScrappingGuitarsBulk } =
    useScrapGuitarsBulk();
  const { mutate: scrapEffectsBulk, isPending: isScrappingEffectsBulk } =
    useScrapEffectsBulk();
  const { mutate: listOnMarket, isPending: isListing } = useListItem();
  const { mutate: scrapGuitar, isPending: isScrappingGuitar } =
    useScrapGuitar();
  const { mutate: scrapEffect, isPending: isScrappingEffect } =
    useScrapEffect();
  const { mutate: saveRig } = useUpdateRig();
  const { mutate: savePedalboard, isPending: isRemovingFromBoard } =
    useUpdatePedalboard();
  const { mutate: saveLayout } = useUpdateStashLayout();
  const { mutate: sellMod, isPending: isSellingMod } = useSellSalvagedMod();
  const { mutate: sellPart, isPending: isSellingPart } = useSellPart();
  const { mutate: fusePartsStack, isPending: isFusingPart } = useFuseParts();
  const { mutate: fitMod, isPending: isFitting } = useWorkshopMod();
  const currentFame = useAppSelector(selectCurrentUserStats)?.fame || 0;
  const isMobile = useResponsiveStore((state) => state.isMobile);

  const rig: RigSetup = data.rig ?? DEFAULT_RIG;
  // Stable identity: the pieces and the arrangement are both memoised on it.
  const effectInventory = useMemo(
    () => data.effectInventory ?? [],
    [data.effectInventory],
  );
  const salvagedMods = useMemo(
    () => data.salvagedMods ?? [],
    [data.salvagedMods],
  );
  // Memoised because "what is in use" is now an ordering input, not just a flag
  // on a card: it feeds the pieces of the whole board.
  const pedalboardItemIds = useMemo(
    () => new Set(rig.pedalboardItems?.map((p) => p.itemId) ?? []),
    [rig.pedalboardItems],
  );
  const inUseGuitarIds = useMemo(
    () => getInUseGuitarIds(data.equippedItemId, rig.guitarSlots),
    [data.equippedItemId, rig.guitarSlots],
  );

  /** The socket the player opened, and the confirm dialog they triggered from it. */
  const [detail, setDetail] = useState<{ kind: Kind; itemId: string } | null>(
    null,
  );
  const [pending, setPending] = useState<Pending>(null);
  /** A salvaged mod the player tapped. Its own sheet — it has no card. */
  const [modDetail, setModDetail] = useState<SalvagedMod | null>(null);
  /** A part stack the player tapped. Parts have no card of their own either. */
  const [partDetail, setPartDetail] = useState<{
    partId: PartId;
    tier: PartTier;
    qty: number;
  } | null>(null);
  /**
   * A sale of stash clutter waiting to be confirmed. Gear confirms through
   * `pending`, which is keyed by inventory id; neither a mod nor a part stack has
   * one, so they carry what they are instead.
   */
  const [resale, setResale] = useState<ResalePending>(null);
  /** A rescued mod dropped onto an instrument, waiting on the bill. */
  const [fitPending, setFitPending] = useState<{
    mod: SalvagedMod;
    targetId: string;
  } | null>(null);
  /** The socket that was right-clicked, and where the menu should hang. */
  const [menu, setMenu] = useState<{
    piece: BoardPiece;
    x: number;
    y: number;
  } | null>(null);
  const [bulk, setBulk] = useState<Kind | null>(null);
  const [equipItemId, setEquipItemId] = useState<string | null>(null);
  /** The arrangement being edited, before it comes back from the server. */
  const [draft, setDraft] = useState<StashLayout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const guitarOf = (itemId: string) => {
    const item = data.inventory.find((i) => i.id === itemId);
    const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : undefined;
    return item && guitar ? { item, guitar } : null;
  };
  const effectOf = (itemId: string) => {
    const item = effectInventory.find((i) => i.id === itemId);
    const effect = item ? EFFECTS_BY_ID.get(item.effectId) : undefined;
    return item && effect ? { item, effect } : null;
  };
  const rigSlotOf = (itemId: string) => {
    const index = rig.guitarSlots.indexOf(itemId);
    return index >= 0 ? index : null;
  };

  /** The bench's view of one owned item, built on demand for a drop check. */
  const subjectOf = useCallback(
    (kind: Kind, itemId: string) => {
      if (kind === "guitar") {
        const item = data.inventory.find((i) => i.id === itemId);
        const def = item ? GUITARS_BY_ID.get(item.guitarId) : undefined;
        return item && def ? getGuitarSubject(item, def) : null;
      }
      const item = effectInventory.find((i) => i.id === itemId);
      const def = item ? EFFECTS_BY_ID.get(item.effectId) : undefined;
      return item && def ? getEffectSubject(item, def) : null;
    },
    [data.inventory, effectInventory],
  );

  /**
   * Whether the carried piece is a rescued mod and the piece under it is an
   * instrument that could take it. Drives both the highlight and the drop.
   */
  const canApplySalvaged = useCallback(
    (carriedId: string, targetId: string) => {
      const mod = salvagedMods.find((m) => m.id === carriedId);
      if (!mod) return false;
      const subject = subjectOf(mod.kind, targetId);
      return subject != null && canFitSalvagedMod(subject, mod);
    },
    [salvagedMods, subjectOf],
  );

  const guitarDuplicates = useMemo(
    () =>
      getGuitarDuplicates(data.inventory, {
        equippedItemId: data.equippedItemId,
        rigSlots: rig.guitarSlots,
      }),
    [data.inventory, data.equippedItemId, rig.guitarSlots],
  );
  const effectDuplicates = useMemo(
    () => getEffectDuplicates(effectInventory, pedalboardItemIds),
    [effectInventory, pedalboardItemIds],
  );

  const manual = sort === "manual";

  // Everything the player owns, as pieces. Under a sort the board is a listing
  // and only shows what passes the filters; arranged by hand it is a place, so
  // filters dim rather than reshuffle — a stash you have to re-learn after every
  // search is not worth arranging.
  //
  // Takes the order it should build in rather than reading it off the props,
  // because Tidy up asks for one the board is not currently showing: it needs
  // the whole collection in a chosen order to write it into the arrangement.
  const buildPieces = useCallback(
    (
      order: CollectionSort,
      search: string,
      within: CollectionScope,
    ): BoardPiece[] => {
      const byHand = order === "manual";
      const guitarPiece = (item: InventoryItem): BoardPiece => {
        const guitar = GUITARS_BY_ID.get(item.guitarId);
        return {
          id: item.id,
          tall: true,
          kind: "guitar",
          item,
          name: guitar ? `${guitar.brand} ${guitar.name}` : "",
        };
      };

      const pedalPiece = (item: EffectInventoryItem): BoardPiece => {
        const effect = EFFECTS_BY_ID.get(item.effectId);
        return {
          id: item.id,
          tall: false,
          kind: "effect",
          item,
          name: effect ? `${effect.brand} ${effect.name}` : "",
        };
      };

      const partStacks = groupWalletByPart(data.parts ?? []).flatMap((row) =>
        row.tiers.map((tier) => ({ partId: row.partId, ...tier })),
      );

      const parts: BoardPiece[] = partStacks
        .filter(
          (stack) =>
            byHand ||
            (within === "all" &&
              matchesQuery(getPartLabel(stack.partId), search)),
        )
        .map((stack) => ({
          id: partPieceId(stack.partId, stack.tier),
          tall: false,
          kind: "part",
          part: stack,
          name: `${stack.tier} ${getPartLabel(stack.partId)}`,
        }));

      // Rescued mods hang with everything else — they are gear, not a counter,
      // and the whole point of the stash is that you can see what you hold.
      const mods: BoardPiece[] = salvagedMods
        .map((mod) => ({
          id: mod.id,
          tall: false as const,
          kind: "mod" as const,
          mod,
          name: getModDef(mod.kind, mod.featureId)?.label ?? mod.featureId,
        }))
        .filter(
          (piece) =>
            byHand || (within === "all" && matchesQuery(piece.name, search)),
        );

      // Hand-arranged: the saved layout decides where everything hangs, so the
      // order the pieces are listed in only settles what was never placed.
      if (byHand)
        return [
          ...parts,
          ...mods,
          ...data.inventory.map(guitarPiece),
          ...effectInventory.map(pedalPiece),
        ];

      // Under an auto-sort, guitars and pedals are ordered as one collection
      // rather than two blocks — a Legendary pedal earns the place next to a
      // Legendary guitar. The kinds are only kept apart by `type`, which is the
      // order for a player who wants to walk the guitars first.
      const guitarEntries = isScopeVisible(within, "guitars")
        ? getGuitarEntries(data.inventory, inUseGuitarIds).map((entry) => ({
            ...entry,
            item: guitarPiece(entry.item),
            // Both kinds key their group off a bare model id, so a guitar and a
            // pedal could tie-break into each other's runs of copies.
            groupKey: `guitar:${entry.groupKey}`,
          }))
        : [];
      const pedalEntries = isScopeVisible(within, "pedals")
        ? getEffectEntries(effectInventory, pedalboardItemIds).map((entry) => ({
            ...entry,
            item: pedalPiece(entry.item),
            groupKey: `pedal:${entry.groupKey}`,
          }))
        : [];

      const gear =
        order === "type"
          ? [
              ...filterAndSortEntries(guitarEntries, search, "rarity"),
              ...filterAndSortEntries(pedalEntries, search, "rarity"),
            ]
          : filterAndSortEntries(
              [...guitarEntries, ...pedalEntries],
              search,
              order,
            );

      // The gear leads and the loose stuff trails: mods are a shelf of
      // blueprints waiting for a build, parts are a currency, and neither is
      // what the player came to the stash to look at.
      return [...gear, ...mods, ...parts];
    },
    [
      data.inventory,
      data.parts,
      effectInventory,
      inUseGuitarIds,
      pedalboardItemIds,
      salvagedMods,
    ],
  );

  const pieces = useMemo(
    () => buildPieces(sort, query, scope),
    [buildPieces, sort, query, scope],
  );

  // Hand-arranged positions are only honoured under Manual order; every other
  // order flows the pieces from the top-left in the order the toolbar chose.
  const { layout, rows } = useMemo(
    () =>
      resolveLayout(pieces, manual ? (draft ?? data.stashLayout ?? {}) : {}),
    [pieces, manual, draft, data.stashLayout],
  );

  const applyMove = (next: StashLayout) => {
    setDraft(next);
    saveLayout(next);
  };

  /**
   * Sort the arrangement itself, rather than looking at the collection through
   * a sort.
   *
   * The toolbar's orders are a way of *looking* at the board and leave the
   * saved positions alone — the point of arranging a stash by hand is that
   * nothing moves behind your back. But a board that has been lived in gets
   * messy, and re-dragging sixty sockets to fix it is not a hobby. This lays the
   * whole collection out in a chosen order and writes that down as the player's
   * own arrangement, which they can then keep pulling apart by hand.
   */
  // Counted off the collection rather than off what is on the board, so a
  // search that narrows the view down to one socket doesn't take the button away
  // — it arranges everything either way.
  const canArrange =
    data.inventory.length +
      effectInventory.length +
      salvagedMods.length +
      (data.parts?.length ?? 0) >
    1;

  const arrangeBy = (order: CollectionSort) => {
    // Everything, not just what the filters are showing: a tidy-up that only
    // placed the search results would bury the rest of the stash underneath.
    const { layout: next } = resolveLayout(buildPieces(order, "", "all"), {});
    setDraft(next);
    saveLayout(next);
    // It is a hand-made arrangement now, made by machine — so the board goes
    // back to Manual and the next drag is an edit, not a takeover.
    onManualArrange();
  };

  const { ghost, drop, applyTarget, dragHandlers, consumeClick } = useStashDrag(
    {
      pieces,
      layout,
      rows,
      gridRef,
      canApply: canApplySalvaged,
      // Parts leave the wallet, so the drop asks first rather than fitting on
      // release — the bench never charges without showing the bill either.
      onApply: (carriedId, targetId) => {
        const mod = salvagedMods.find((m) => m.id === carriedId);
        if (mod) setFitPending({ mod, targetId });
      },
      // A draggable socket has to swallow touch gestures to work at all, which
      // would cost the player the ability to scroll the board on a phone. So on
      // touch the pieces only come loose once Manual order is chosen deliberately.
      enabled: manual || !isMobile,
      onMove: applyMove,
      // The first drag under a sort freezes what is on screen and hands the board
      // over to the player, so the piece doesn't snap back the moment it lands.
      onTakeOver: () => {
        if (manual) return;
        setDraft(layout);
        onManualArrange();
      },
    },
  );

  const closeDetail = () => setDetail(null);
  const openDetail = (kind: Kind, itemId: string) => {
    if (consumeClick()) return;
    setDetail({ kind, itemId });
  };
  /** Opening a confirm dialog always closes the sheet it was triggered from. */
  const open = (
    action: "sell" | "list" | "scrap",
    kind: Kind,
    itemId: string,
  ) => {
    closeDetail();
    setPending({ action, kind, itemId });
  };

  const handleEquipTo = (itemId: string, target: EquipTarget) => {
    const found = guitarOf(itemId);
    if (!found) return;
    if (target === "profile") {
      equip({
        guitarId: found.item.guitarId,
        itemId: found.item.id,
        year: found.item.year,
        country: found.item.country,
      });
      return;
    }
    // A guitar can occupy only one slot — clear it from any other first.
    const slots = rig.guitarSlots.map((id) =>
      id === itemId ? null : id,
    ) as RigSetup["guitarSlots"];
    slots[target] = itemId;
    saveRig({ rig: { ...rig, guitarSlots: slots } });
  };

  const handleRemoveFrom = (itemId: string, target: EquipTarget) => {
    if (target === "profile") {
      unequip();
      return;
    }
    const slots = [...rig.guitarSlots] as RigSetup["guitarSlots"];
    if (slots[target] === itemId) slots[target] = null;
    saveRig({ rig: { ...rig, guitarSlots: slots } });
  };

  const handleRemoveFromBoard = (itemId: string) => {
    closeDetail();
    savePedalboard(
      (rig.pedalboardItems ?? []).filter((p) => p.itemId !== itemId),
    );
  };

  const confirmSell = () => {
    if (!pending) return;
    const done = { onSuccess: () => setPending(null) };
    if (pending.kind === "guitar") sellGuitar(pending.itemId, done);
    else sellEffect(pending.itemId, done);
  };

  const confirmScrap = () => {
    if (!pending) return;
    const done = { onSuccess: () => setPending(null) };
    if (pending.kind === "guitar") scrapGuitar(pending.itemId, done);
    else scrapEffect(pending.itemId, done);
  };

  const confirmList = (price: number) => {
    if (!pending) return;
    listOnMarket(
      { itemType: pending.kind, inventoryItemId: pending.itemId, price },
      { onSuccess: () => setPending(null) },
    );
  };

  const confirmBulkSell = () => {
    const done = { onSuccess: () => setBulk(null) };
    if (bulk === "guitar") sellGuitarsBulk(guitarDuplicates.ids, done);
    if (bulk === "effect") sellEffectsBulk(effectDuplicates.ids, done);
  };

  const confirmBulkScrap = () => {
    const done = { onSuccess: () => setBulk(null) };
    if (bulk === "guitar") scrapGuitarsBulk(guitarDuplicates.ids, done);
    if (bulk === "effect") scrapEffectsBulk(effectDuplicates.ids, done);
  };

  const isSelling = isSellingGuitar || isSellingEffect;
  const isScrapping = isScrappingGuitar || isScrappingEffect;
  const uniqueOwned =
    new Set(data.inventory.map((i) => i.guitarId)).size +
    new Set(effectInventory.map((i) => i.effectId)).size;

  /** The rescued mod currently in hand, if that is what is being carried. */
  const carriedMod = ghost
    ? (salvagedMods.find((m) => m.id === ghost.id) ?? null)
    : null;

  // Every instrument the carried mod could go into. Computed once per pickup
  // rather than per socket per frame — a drag re-renders the whole board on
  // every pointer move.
  const fitTargets = useMemo(() => {
    if (!carriedMod) return null;
    const ids = new Set<string>();
    const items =
      carriedMod.kind === "guitar"
        ? data.inventory.map((i) => i.id)
        : effectInventory.map((i) => i.id);
    for (const id of items) {
      if (canApplySalvaged(carriedMod.id, id)) ids.add(id);
    }
    return ids;
  }, [canApplySalvaged, carriedMod, data.inventory, effectInventory]);

  const dropTargetOf = (piece: BoardPiece): StashDropTarget | undefined => {
    if (!fitTargets?.has(piece.id)) return undefined;
    return applyTarget === piece.id ? "active" : "candidate";
  };

  /** Under Manual order the filters grey a piece out instead of removing it. */
  const isDimmed = (piece: BoardPiece) => {
    // While a mod is in hand the board answers one question only, so everything
    // it cannot go into steps back — including whatever the filters think.
    if (fitTargets) return !fitTargets.has(piece.id) && piece.id !== ghost?.id;
    if (!manual) return false;
    const inScope =
      piece.kind === "part" || piece.kind === "mod"
        ? scope === "all"
        : isScopeVisible(scope, piece.kind === "guitar" ? "guitars" : "pedals");
    return !inScope || !matchesQuery(piece.name, query);
  };

  /**
   * What the right-click menu offers for one piece.
   *
   * The same actions its card carries, under the same locks: a guitar on the
   * profile cannot be sold from here either. Blocked entries stay in the list
   * rather than vanishing — "why can this not be scrapped" is a question the
   * menu should answer, and a missing row answers nothing.
   */
  const menuItemsFor = (piece: BoardPiece): StashMenuItem[] => {
    if (piece.kind === "guitar") {
      const equipped = data.equippedItemId === piece.id;
      const slot = rigSlotOf(piece.id);
      const inUse = equipped || slot != null;
      const reason = equipped
        ? "Unequip from your profile first"
        : slot != null
          ? `Remove from rig slot ${slot + 1} first`
          : undefined;

      return [
        {
          id: "details",
          label: "Details",
          icon: Info,
          onSelect: () => setDetail({ kind: "guitar", itemId: piece.id }),
        },
        {
          id: "equip",
          label: "Equip…",
          icon: Guitar,
          disabled: isEquipping,
          onSelect: () => setEquipItemId(piece.id),
        },
        ...(equipped
          ? [
              {
                id: "unequip",
                label: "Unequip from profile",
                icon: Unplug,
                onSelect: () => handleRemoveFrom(piece.id, "profile"),
              },
            ]
          : []),
        ...(slot != null
          ? [
              {
                id: "unrig",
                label: `Take out of rig slot ${slot + 1}`,
                icon: Unplug,
                onSelect: () => handleRemoveFrom(piece.id, slot as EquipTarget),
              },
            ]
          : []),
        {
          id: "list",
          label: "Market",
          icon: Store,
          disabled: isListing || inUse,
          reason,
          onSelect: () => open("list", "guitar", piece.id),
        },
        {
          id: "scrap",
          label: "Scrap",
          icon: Wrench,
          danger: true,
          disabled: isScrappingGuitar || inUse,
          reason,
          onSelect: () => open("scrap", "guitar", piece.id),
        },
        {
          id: "sell",
          label: "Sell",
          icon: Trash2,
          danger: true,
          disabled: isSellingGuitar || equipped,
          reason: equipped ? "Unequip from your profile first" : undefined,
          onSelect: () => open("sell", "guitar", piece.id),
        },
      ];
    }

    if (piece.kind === "effect") {
      const onBoard = pedalboardItemIds.has(piece.id);
      const reason = onBoard ? "Take it off the pedalboard first" : undefined;

      return [
        {
          id: "details",
          label: "Details",
          icon: Info,
          onSelect: () => setDetail({ kind: "effect", itemId: piece.id }),
        },
        ...(onBoard
          ? [
              {
                id: "unboard",
                label: "Remove from board",
                icon: Unplug,
                disabled: isRemovingFromBoard,
                onSelect: () => handleRemoveFromBoard(piece.id),
              },
            ]
          : []),
        {
          id: "list",
          label: "Market",
          icon: Store,
          disabled: isListing || onBoard,
          reason,
          onSelect: () => open("list", "effect", piece.id),
        },
        {
          id: "scrap",
          label: "Scrap",
          icon: Wrench,
          danger: true,
          disabled: isScrappingEffect || onBoard,
          reason,
          onSelect: () => open("scrap", "effect", piece.id),
        },
        {
          id: "sell",
          label: "Sell",
          icon: Trash2,
          danger: true,
          disabled: isSellingEffect || onBoard,
          reason,
          onSelect: () => open("sell", "effect", piece.id),
        },
      ];
    }

    if (piece.kind === "mod")
      return [
        {
          id: "details",
          label: "Details",
          icon: Info,
          onSelect: () => setModDetail(piece.mod),
        },
        {
          id: "sell",
          label: "Sell",
          icon: Trash2,
          danger: true,
          disabled: isSellingMod,
          onSelect: () => setResale({ kind: "mod", mod: piece.mod }),
        },
      ];

    // A part stack sells whole from here; splitting one off is what its sheet
    // is for, and the menu is the shortcut, not the second way of doing it.
    return [
      {
        id: "details",
        label: "Details",
        icon: Info,
        onSelect: () => setPartDetail(piece.part),
      },
      {
        id: "sell",
        label: `Sell all ×${piece.part.qty}`,
        icon: Trash2,
        danger: true,
        disabled: isSellingPart,
        onSelect: () =>
          setResale({
            kind: "part",
            partId: piece.part.partId,
            tier: piece.part.tier,
            qty: piece.part.qty,
          }),
      },
    ];
  };

  const openMenu =
    (piece: BoardPiece) => (event: ReactMouseEvent<HTMLElement>) => {
      // The browser's own menu has nothing to say about a socket.
      event.preventDefault();
      setMenu({ piece, x: event.clientX, y: event.clientY });
    };

  const renderPiece = (piece: BoardPiece, carried = false) => {
    const placement: StashPlacement = carried
      ? { column: 0, row: 0 }
      : {
          column: columnOf(layout[piece.id]),
          row: rowOf(layout[piece.id]),
          dragging: ghost?.id === piece.id,
          dimmed: isDimmed(piece),
          dropTarget: dropTargetOf(piece),
          dragHandlers: dragHandlers(piece),
          onContextMenu: openMenu(piece),
        };

    if (piece.kind === "guitar")
      return (
        <GuitarStashTile
          key={piece.id}
          {...placement}
          item={piece.item}
          isEquipped={data.equippedItemId === piece.id}
          rigSlot={rigSlotOf(piece.id)}
          onClick={() => openDetail("guitar", piece.id)}
        />
      );

    if (piece.kind === "effect")
      return (
        <EffectStashTile
          key={piece.id}
          {...placement}
          item={piece.item}
          isOnPedalboard={pedalboardItemIds.has(piece.id)}
          onClick={() => openDetail("effect", piece.id)}
        />
      );

    if (piece.kind === "mod")
      return (
        <StashTile
          key={piece.id}
          {...placement}
          color={MOD_TILE_COLOR}
          art={<ModArt modId={piece.mod.featureId} />}
          label={`${piece.name} +${piece.mod.points}`}
          level={piece.mod.points}
          levelPrefix='+'
          preview={<SalvagedModCard mod={piece.mod} />}
          onClick={() => {
            if (consumeClick()) return;
            setModDetail(piece.mod);
          }}
        />
      );

    return (
      <StashTile
        key={piece.id}
        {...placement}
        color={PART_TIER_COLORS[piece.part.tier]}
        // Sized off the socket rather than in px: the board's cells grow with
        // the viewport, and a fixed box left a part swimming in a wide one.
        art={<PartIcon partId={piece.part.partId} className='p-[14%]' />}
        label={`${piece.name} ×${piece.part.qty}`}
        count={piece.part.qty}
        preview={
          <ScrapPartCard
            partId={piece.part.partId}
            tier={piece.part.tier}
            qty={piece.part.qty}
          />
        }
        onClick={() => {
          if (consumeClick()) return;
          setPartDetail(piece.part);
        }}
      />
    );
  };

  const carried = ghost ? pieces.find((p) => p.id === ghost.id) : undefined;

  return (
    <div className='flex flex-col gap-3'>
      <CollectionSectionHeader
        eyebrow='Arsenal'
        title='Stash'
        owned={uniqueOwned}
        total={GUITAR_DEFINITIONS.length + EFFECT_DEFINITIONS.length}
        unit='items collected'
        action={
          <div className='flex flex-wrap gap-2'>
            {canArrange && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={arrangeButtonClass}
                  title='Lay the whole stash out again in one go — it stays your arrangement afterwards'>
                  <ArrowDownWideNarrow size={14} />
                  Tidy up
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='border-0 bg-zinc-900 p-1'>
                  {ARRANGE_ORDERS.map((order) => (
                    <DropdownMenuItem
                      key={order.id}
                      onSelect={() => arrangeBy(order.id)}
                      className='cursor-pointer rounded px-3 py-2 text-xs font-semibold text-zinc-300 focus:bg-zinc-800 focus:text-white'>
                      {order.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {guitarDuplicates.ids.length > 0 && (
              <button
                onClick={() => setBulk("guitar")}
                disabled={isSellingGuitarsBulk || isScrappingGuitarsBulk}
                className={bulkButtonClass}
                title='Sell or scrap every lower-level duplicate guitar, keeping the best copy of each'>
                <Layers size={14} />
                Duplicate guitars ({guitarDuplicates.ids.length})
              </button>
            )}
            {effectDuplicates.ids.length > 0 && (
              <button
                onClick={() => setBulk("effect")}
                disabled={isSellingEffectsBulk || isScrappingEffectsBulk}
                className={bulkButtonClass}
                title='Sell or scrap every lower-level duplicate pedal, keeping the best copy of each'>
                <Layers size={14} />
                Duplicate pedals ({effectDuplicates.ids.length})
              </button>
            )}
          </div>
        }
      />

      {pieces.length === 0 ? (
        <CollectionEmptyResult query={query} />
      ) : (
        <StashBoard
          rows={rows}
          gridRef={gridRef}
          drop={drop}
          label='Arsenal stash'>
          {pieces.map((piece) => renderPiece(piece))}
        </StashBoard>
      )}

      {/* The carried piece, drawn at the size of the socket it came from. */}
      {ghost &&
        carried &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            className='pointer-events-none fixed z-[60] opacity-90'
            style={{
              left: ghost.x,
              top: ghost.y,
              width: ghost.width,
              height: ghost.height,
              filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.75))",
            }}>
            {renderPiece(carried, true)}
          </div>,
          document.body,
        )}

      {/* Right-click: the same actions, without opening the card first. */}
      <StashContextMenu
        anchor={menu}
        title={menu?.piece.name ?? ""}
        items={menu ? menuItemsFor(menu.piece) : []}
        onClose={() => setMenu(null)}
      />

      {/* A socket opens the item's own card, actions and all. */}
      {(() => {
        if (!detail) return null;
        if (detail.kind === "guitar") {
          const found = guitarOf(detail.itemId);
          if (!found) return null;
          const { item, guitar } = found;
          return (
            <StashItemDialog
              isOpen
              onClose={closeDetail}
              title={`${guitar.brand} ${guitar.name}`}>
              <GuitarCard
                item={item}
                isEquipped={data.equippedItemId === item.id}
                rigSlot={rigSlotOf(item.id)}
                onEquipClick={() => {
                  closeDetail();
                  setEquipItemId(item.id);
                }}
                isEquipping={isEquipping}
                onSellClick={(itemId) => open("sell", "guitar", itemId)}
                isSelling={isSellingGuitar}
                onListClick={(itemId) => open("list", "guitar", itemId)}
                isListing={isListing}
                onScrapClick={(itemId) => open("scrap", "guitar", itemId)}
                isScrapping={isScrappingGuitar}
              />
            </StashItemDialog>
          );
        }
        const found = effectOf(detail.itemId);
        if (!found) return null;
        const { item, effect } = found;
        return (
          <StashItemDialog
            isOpen
            onClose={closeDetail}
            title={`${effect.brand} ${effect.name}`}>
            <EffectCard
              item={item}
              isOnPedalboard={pedalboardItemIds.has(item.id)}
              onSellClick={(itemId) => open("sell", "effect", itemId)}
              isSelling={isSellingEffect}
              onListClick={(itemId) => open("list", "effect", itemId)}
              isListing={isListing}
              onScrapClick={(itemId) => open("scrap", "effect", itemId)}
              isScrapping={isScrappingEffect}
              onRemoveFromBoard={handleRemoveFromBoard}
              isRemovingFromBoard={isRemovingFromBoard}
            />
          </StashItemDialog>
        );
      })()}

      {/* Dropped a rescued mod onto an instrument: confirm, then the job. */}
      {(() => {
        if (!fitPending) return null;
        const subject = subjectOf(fitPending.mod.kind, fitPending.targetId);
        if (!subject) return null;
        const option = getSalvagedModOptions(subject, [fitPending.mod])[0];
        if (!option) return null;

        return (
          <FitSalvagedDialog
            isOpen
            option={option}
            targetName={subject.name}
            onConfirm={() =>
              fitMod(
                {
                  itemId: fitPending.targetId,
                  kind: fitPending.mod.kind,
                  featureId: null,
                  action: "fit-salvaged",
                  salvagedId: fitPending.mod.id,
                },
                { onSuccess: () => setFitPending(null) },
              )
            }
            onCancel={() => setFitPending(null)}
            isLoading={isFitting}
          />
        );
      })()}

      {/* A rescued mod has no card anywhere else — this is the only place it
          explains itself. */}
      <StashItemDialog
        isOpen={modDetail !== null}
        onClose={() => setModDetail(null)}
        title={
          modDetail
            ? (getModDef(modDetail.kind, modDetail.featureId)?.label ??
              modDetail.featureId)
            : ""
        }>
        {modDetail && (
          <SalvagedModCard
            mod={modDetail}
            onSellClick={() => {
              setModDetail(null);
              setResale({ kind: "mod", mod: modDetail });
            }}
            isSelling={isSellingMod}
          />
        )}
      </StashItemDialog>

      {/* Same for a stack of parts: a currency the player can cash out. */}
      <StashItemDialog
        isOpen={partDetail !== null}
        onClose={() => setPartDetail(null)}
        title={
          partDetail
            ? `${partDetail.tier} ${getPartLabel(partDetail.partId)}`
            : ""
        }>
        {partDetail && (
          <ScrapPartCard
            partId={partDetail.partId}
            tier={partDetail.tier}
            qty={partDetail.qty}
            onSellClick={(qty) => {
              setPartDetail(null);
              setResale({
                kind: "part",
                partId: partDetail.partId,
                tier: partDetail.tier,
                qty,
              });
            }}
            isSelling={isSellingPart}
            onFuseClick={(crafts) => {
              setPartDetail(null);
              fusePartsStack({
                partId: partDetail.partId,
                tier: partDetail.tier,
                crafts,
              });
            }}
            isFusing={isFusingPart}
            fame={currentFame}
          />
        )}
      </StashItemDialog>

      {/* Mods and parts confirm the same way gear does — a sale is a sale. */}
      {resale && (
        <SellConfirmDialog
          isOpen
          itemType={resale.kind === "mod" ? "Mod" : "Parts"}
          itemName={
            resale.kind === "mod"
              ? `${getModDef(resale.mod.kind, resale.mod.featureId)?.label ?? resale.mod.featureId} +${resale.mod.points}`
              : `${resale.tier} ${getPartLabel(resale.partId)} ×${resale.qty}`
          }
          fameReward={
            resale.kind === "mod"
              ? getModResaleValue(
                  resale.mod.kind,
                  resale.mod.featureId,
                  resale.mod.points,
                )
              : getPartResaleValue(resale.partId, resale.tier, resale.qty)
          }
          onConfirm={() => {
            if (resale.kind === "mod") {
              sellMod(resale.mod.id, { onSuccess: () => setResale(null) });
              return;
            }
            sellPart(
              { partId: resale.partId, tier: resale.tier, qty: resale.qty },
              { onSuccess: () => setResale(null) },
            );
          }}
          onCancel={() => setResale(null)}
          isLoading={isSellingMod || isSellingPart}
        />
      )}

      {/* Sell / Market / Scrap all confirm against the same pending action. */}
      {(() => {
        if (!pending) return null;
        const guitar =
          pending.kind === "guitar" ? guitarOf(pending.itemId) : null;
        const effect =
          pending.kind === "effect" ? effectOf(pending.itemId) : null;
        if (!guitar && !effect) return null;

        const itemType = pending.kind === "guitar" ? "Guitar" : "Effect";
        const itemName = guitar
          ? `${guitar.guitar.brand} ${guitar.guitar.name}`
          : `${effect!.effect.brand} ${effect!.effect.name}`;
        const value = guitar
          ? getItemValue(guitar.item, guitar.guitar)
          : getEffectValue(effect!.effect);
        const cancel = () => setPending(null);

        if (pending.action === "sell")
          return (
            <SellConfirmDialog
              isOpen
              itemType={itemType}
              itemName={itemName}
              fameReward={value}
              onConfirm={confirmSell}
              onCancel={cancel}
              isLoading={isSelling}
            />
          );

        if (pending.action === "list")
          return (
            <ListItemDialog
              isOpen
              itemType={itemType}
              itemName={itemName}
              minPrice={value}
              currentFame={currentFame}
              onConfirm={confirmList}
              onCancel={cancel}
              isLoading={isListing}
            />
          );

        return (
          <ScrapConfirmDialog
            isOpen
            itemType={itemType}
            itemName={itemName}
            parts={
              guitar
                ? getGuitarScrapYield(guitar.item, guitar.guitar)
                : getEffectScrapYield(effect!.item, effect!.effect)
            }
            salvaged={
              guitar
                ? getSalvageableMod(guitar.item, "guitar")
                : getSalvageableMod(effect!.item, "effect")
            }
            scrapped={
              guitar
                ? getScrappedMods(guitar.item, "guitar")
                : getScrappedMods(effect!.item, "effect")
            }
            onConfirm={confirmScrap}
            onCancel={cancel}
            isLoading={isScrapping}
          />
        );
      })()}

      <BulkDuplicatesDialog
        isOpen={bulk !== null}
        items={
          bulk === "effect" ? effectDuplicates.items : guitarDuplicates.items
        }
        fameReward={
          bulk === "effect" ? effectDuplicates.fame : guitarDuplicates.fame
        }
        scrapParts={
          bulk === "effect" ? effectDuplicates.parts : guitarDuplicates.parts
        }
        salvagedCount={
          bulk === "effect"
            ? effectDuplicates.salvagedCount
            : guitarDuplicates.salvagedCount
        }
        protectedNote={
          bulk === "effect"
            ? "Pedals on your pedalboard are never touched."
            : undefined
        }
        onSell={confirmBulkSell}
        onScrap={confirmBulkScrap}
        onCancel={() => setBulk(null)}
        isSelling={isSellingGuitarsBulk || isSellingEffectsBulk}
        isScrapping={isScrappingGuitarsBulk || isScrappingEffectsBulk}
      />

      {(() => {
        const found = equipItemId ? guitarOf(equipItemId) : null;
        return (
          <EquipTargetDialog
            isOpen={found !== null}
            itemId={equipItemId ?? ""}
            inventory={data.inventory}
            equippedItemId={data.equippedItemId}
            rigSlots={rig.guitarSlots}
            onSelect={(target) => {
              if (equipItemId) handleEquipTo(equipItemId, target);
              setEquipItemId(null);
            }}
            onRemove={(target) => {
              if (equipItemId) handleRemoveFrom(equipItemId, target);
              setEquipItemId(null);
            }}
            onClose={() => setEquipItemId(null)}
          />
        );
      })()}
    </div>
  );
};
