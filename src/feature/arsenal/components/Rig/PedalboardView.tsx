import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import {
  AlertTriangle,
  LayoutGrid,
  Plug,
  Plus,
  Unplug,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  autoPatch,
  pickOutput,
  readPowerState,
  refusalFor,
} from "../../data/powerSupply";
import { boardTierOf, supplyTierOf } from "../../data/rigHardware";
import {
  type ChainTier,
  evaluateChain,
  readChainNodes,
  wiredOrder,
} from "../../data/signalChain";
import type {
  ArsenalUserData,
  PedalboardPlacement,
  PowerLink,
} from "../../types/arsenal.types";
import type { Point } from "../../utils/cableGeometry";
import { getEffectImageSrc } from "../../utils/effectImage";
import type { BoardBox, BoardLayout } from "../../utils/pedalboardLayout";
import {
  collidesWithAny,
  createDcResolver,
  createJackResolver,
  createWidthResolver,
  DEFAULT_ASPECT,
  EFFECT_IMAGE_ASPECT,
  findFreeSpot,
  findSwapTarget,
  geometryFor,
  inChainOrder,
  layoutBoard,
  packInOrder,
  planSwap,
  rowIndexOf,
  tidyBoard,
} from "../../utils/pedalboardLayout";
import type { RowSpan } from "../../utils/powerLayout";
import {
  dcJackAt,
  RAIL_H,
  railFor,
  railPaddingPct,
} from "../../utils/powerLayout";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { RARITY_STYLES } from "../RarityBadge";
import { EffectPickerModal } from "./EffectPickerModal";
import type { PoweredPedal } from "./PowerLoom";
import { PowerLoom, PowerRail } from "./PowerLoom";
import { PowerPanel } from "./PowerPanel";
import { RigHardwarePanel } from "./RigHardwarePanel";
import { RIG_BUTTON, RIG_BUTTON_FIX, SectionHeading } from "./RigSection";
import { SignalCable } from "./SignalCable";
import { SignalPathPanel } from "./SignalPathPanel";

/** How long a "no room left" message stays up next to the board controls. */
const NOTICE_MS = 8000;

const BOARD_FULL =
  "The board is full — take a pedal off before adding another.";

/** Says it twice: a toast you cannot miss, and a line that stays on the board. */
const announce = (message: string, setNotice: (value: string) => void) => {
  setNotice(message);
  toast.warning(message);
};

interface DragState {
  itemId: string;
  offXPct: number;
  offYPct: number;
  /** The slot the pedal owns while it is in the air, and drops back into.
   *  Trading places with a neighbour hands it that neighbour's slot. */
  homeXPct: number;
  homeYPct: number;
  /** The pedal just traded with. It is off limits until the dragged one has
   *  stepped off it again, which is what stops a swap ping-ponging. */
  lockedId: string | null;
  /** Something has been traded, so letting go is an exchange, not a drop. */
  swapped: boolean;
}

/**
 * A DC cable in the air: the pointer that is carrying it, and whether it has
 * ever moved. A press that never moves is a tap, which arms the brick instead of
 * dragging out of it — the only way to patch a board on a touch screen.
 */
interface PatchState {
  /** Where the loose end is, in board units. */
  to: Point;
  moved: boolean;
  /** Waiting for a second tap on a pedal rather than following a pointer. */
  armed: boolean;
}

interface PedalboardViewProps {
  data: ArsenalUserData;
  /** The wallet, for the two hardware buttons on the heading. */
  fame: number;
  onUpdateItems: (items: PedalboardPlacement[], power: PowerLink[]) => void;
  onHover?: (
    e: React.MouseEvent | null,
    content: React.ReactNode | null,
  ) => void;
  /** Touch-only: tapping a pedal opens its card in a modal (drag is disabled when set). */
  onShowCard?: (content: React.ReactNode) => void;
}

export const PedalboardView = ({
  data,
  fame,
  onUpdateItems,
  onHover,
  onShowCard,
}: PedalboardViewProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragging, setDraggingState] = useState<DragState | null>(null);
  // Mirrors `dragging` for the window handlers: the mouse can move twice
  // before React re-renders, and the second move has to see the slot the
  // first one traded for.
  const draggingRef = useRef<DragState | null>(null);

  const setDragging = (next: DragState | null) => {
    draggingRef.current = next;
    setDraggingState(next);
  };

  const [isColliding, setIsColliding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Natural aspect ratio (w/h) per image, measured once the image loads. It
  // only ever corrects EFFECT_IMAGE_ASPECT, which already knows every shipped
  // pedal — so the board can lay itself out before a single image is decoded.
  const [aspectById, setAspectById] = useState<Record<number | string, number>>(
    {},
  );
  // Pedals the board has no room for. They stay in the rig (they are still
  // equipped) but are parked below the case instead of stacked on top of
  // another pedal.
  const [overflowIds, setOverflowIds] = useState<string[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);
  const onUpdateItemsRef = useRef(onUpdateItems);

  /**
   * What is plugged into the brick. `null` is a board saved before the brick
   * existed — read as fully powered until the migration below patches it, so
   * opening the Rig never costs anybody a wiring bonus they had already earned.
   */
  const [localPower, setLocalPowerState] = useState<PowerLink[] | null>(() =>
    Array.isArray(data.rig.power) ? data.rig.power : null,
  );
  const localPowerRef = useRef(localPower);

  const setLocalPower = (next: PowerLink[]) => {
    localPowerRef.current = next;
    setLocalPowerState(next);
  };

  const debouncedSave = useCallback(
    (items: PedalboardPlacement[], power?: PowerLink[]) => {
      pendingSaveRef.current = true;
      const links = power ?? localPowerRef.current ?? [];
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        pendingSaveRef.current = false;
        onUpdateItemsRef.current(items, links);
      }, 600);
    },
    [],
  );

  const [localItems, setLocalItemsState] = useState<PedalboardPlacement[]>(
    () =>
      Array.isArray(data.rig.pedalboardItems) ? data.rig.pedalboardItems : [],
  );
  // Mirrors `localItems` for the drag handlers, which read positions between
  // renders while the mouse is moving.
  const localItemsRef = useRef(localItems);

  const setLocalItems = (next: PedalboardPlacement[]) => {
    localItemsRef.current = next;
    setLocalItemsState(next);
  };

  /**
   * The two pieces of hardware the board is made of: the case it stands in and
   * the brick racked above it, both bought with Fame (`data/rigHardware`).
   *
   * Every measurement below is taken off them rather than off a constant, which
   * is what makes an upgrade a different board instead of the same board with a
   * bigger number on the panel. A rig that has bought nothing gets the bottom
   * rung of each, and a layout too big for it comes back as overflow.
   */
  const geo = useMemo(
    () => geometryFor(boardTierOf(data.rig.boardTier)),
    [data.rig.boardTier],
  );
  const supply = useMemo(
    () => supplyTierOf(data.rig.supplyTier),
    [data.rig.supplyTier],
  );
  const rail = useMemo(() => railFor(geo, supply), [geo, supply]);

  // Width-in-board-% of every pedal, driven by its image's own proportions so
  // a wide (dual) pedal really is wider instead of being squished.
  const widthOf = useMemo(
    () => createWidthResolver(geo, data.effectInventory, aspectById),
    [geo, data.effectInventory, aspectById],
  );

  // Where each pedal takes its cable, so a top-mounted enclosure gets the
  // patch coming over the board rather than in through its side.
  const jacksOf = useMemo(
    () => createJackResolver(data.effectInventory),
    [data.effectInventory],
  );

  /** …and where its power goes in, which is a different socket entirely. */
  const dcOf = useMemo(() => createDcResolver(jacksOf), [jacksOf]);

  const widthOfRef = useRef(widthOf);
  const overflowRef = useRef(overflowIds);

  // Handlers that outlive a render (drag, save) read these through refs.
  useEffect(() => {
    onUpdateItemsRef.current = onUpdateItems;
    widthOfRef.current = widthOf;
    overflowRef.current = overflowIds;
  }, [onUpdateItems, widthOf, overflowIds]);

  /** Sets the loom and saves it. Every change to a DC cable goes through here. */
  const savePower = useCallback(
    (links: PowerLink[]) => {
      setLocalPower(links);
      debouncedSave(localItemsRef.current, links);
    },
    [debouncedSave],
  );

  /** Everything currently occupying board space, minus one pedal. */
  const boardBoxes = useCallback((excludeId?: string): BoardBox[] => {
    const overflow = overflowRef.current;
    return localItemsRef.current
      .filter((i) => i.itemId !== excludeId && !overflow.includes(i.itemId))
      .map((i) => ({
        itemId: i.itemId,
        xPct: i.xPct,
        yPct: i.yPct,
        wPct: widthOfRef.current(i.itemId),
      }));
  }, []);

  /** Applies a computed layout: board positions, parked pedals and the save. */
  const applyLayout = useCallback(
    (layout: BoardLayout, source: PedalboardPlacement[]) => {
      const byId = new Map(layout.placed.map((item) => [item.itemId, item]));
      // Keep the stored order — only the positions change.
      const next = source.map((item) => byId.get(item.itemId) ?? item);
      setOverflowIds(layout.overflow.map((i) => i.itemId));
      setLocalItems(next);
      if (layout.changed) debouncedSave(next);
      return next;
    },
    [debouncedSave],
  );

  /**
   * Takes the server's copy of the board over the local one — positions, parked
   * pedals and DC cables together, because they only make sense together.
   * Pedals dropped on top of each other by older builds get moved to free space
   * on the way in.
   *
   * A board with no `power` at all was saved before the brick existed, and it
   * patches itself here: in signal order, keeping as much as the budget can pay
   * for, so a player who had wired a board by the book keeps as much of that
   * bonus as there is current for. Whatever is left over stays unpowered where
   * it can be seen and moved, rather than being quietly dropped.
   */
  const adoptSaved = useCallback(
    (
      items: PedalboardPlacement[],
      links: PowerLink[] | undefined,
      /**
       * The case just changed under the board — so repack it rather than
       * repairing it.
       *
       * `layoutBoard` deliberately leaves a pedal wherever its owner put it, and
       * after an upgrade that is the wrong instinct: the pedals are standing on
       * the old case's rows, which straddle the new one's, and a parked pedal
       * can find nowhere to land between them. The player has just paid for the
       * room, so the board takes the one liberty it otherwise never takes and
       * lines everything up — same signal order, new rows.
       */
      recase = false,
      /**
       * …and the same for the brick: a supply that just grew under the board.
       *
       * The cables already in it are left exactly where they are — this only
       * fills the holes that were bought a moment ago, in signal order. A hole
       * the player has just paid for and that nothing is plugged into is the
       * one thing the upgrade was supposed to buy, so it does not wait to be
       * patched by hand.
       */
      rebrick = false,
    ) => {
      const layout = recase
        ? tidyBoard(geo, items, widthOf)
        : layoutBoard(geo, items, widthOf);
      applyLayout(layout, items);
      if (Array.isArray(links)) {
        const toppedUp = rebrick
          ? autoPatch(rail, layout.placed, links, widthOf)
          : links;
        if (toppedUp.length > links.length) savePower(toppedUp);
        else setLocalPower(links);
        return;
      }

      const patched = autoPatch(rail, layout.placed, [], widthOf);
      savePower(patched);
      const short = layout.placed.length - patched.length;
      if (short > 0) {
        announce(
          `The ${supply.name} has no output for ${short} pedal${
            short > 1 ? "s" : ""
          } — unpowered, so out of the signal chain and out of the rig.`,
          setNotice,
        );
      }
    },
    [applyLayout, geo, rail, savePower, supply, widthOf],
  );

  /**
   * The case and the brick the board was last read against, so a change of
   * either is noticed — that is what tells an upgrade apart from a refetch.
   */
  const lastCaseRef = useRef(geo.tier.id);
  const lastSupplyRef = useRef(supply.id);

  useEffect(() => {
    if (dragging || pendingSaveRef.current) return;
    const recased = lastCaseRef.current !== geo.tier.id;
    const rebricked = lastSupplyRef.current !== supply.id;
    lastCaseRef.current = geo.tier.id;
    lastSupplyRef.current = supply.id;
    adoptSaved(
      Array.isArray(data.rig.pedalboardItems) ? data.rig.pedalboardItems : [],
      data.rig.power,
      recased,
      rebricked,
    );
  }, [
    data.rig.pedalboardItems,
    data.rig.power,
    dragging,
    adoptSaved,
    geo.tier.id,
    supply.id,
  ]);

  useEffect(() => {
    const timer = notice ? setTimeout(() => setNotice(null), NOTICE_MS) : null;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notice]);

  const boardItems = useMemo(
    () => localItems.filter((i) => !overflowIds.includes(i.itemId)),
    [localItems, overflowIds],
  );

  // What the brick is actually carrying, read against the board that is there
  // rather than against whatever the last save happened to hold.
  const powerState = useMemo(
    () => readPowerState(supply, boardItems, localPower),
    [supply, boardItems, localPower],
  );

  /** The pedal's own name, for the messages that have to say which one. */
  const nameOf = useCallback(
    (itemId: string) => {
      const invItem = data.effectInventory.find((e) => e.id === itemId);
      const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
      return effect?.name ?? "pedal";
    },
    [data.effectInventory],
  );

  /** Puts a cable in the brick, or says why it cannot. */
  const plugIn = useCallback(
    (itemId: string) => {
      if (powerState.poweredIds.has(itemId)) return;
      const item = boardItems.find((i) => i.itemId === itemId);
      if (!item) return;

      const refusal = refusalFor(supply, powerState);
      if (refusal) {
        announce(refusal, setNotice);
        return;
      }

      const out = pickOutput(
        rail,
        item,
        widthOf(itemId),
        new Set(powerState.links.map((link) => link.out)),
      );
      if (out === null) return;
      setNotice(null);
      savePower([...powerState.links, { itemId, out }]);
    },
    [boardItems, powerState, rail, savePower, supply, widthOf],
  );

  const unplug = useCallback(
    (itemId: string) =>
      savePower(powerState.links.filter((link) => link.itemId !== itemId)),
    [powerState.links, savePower],
  );

  const [patch, setPatchState] = useState<PatchState | null>(null);
  const patchRef = useRef<PatchState | null>(null);

  const setPatch = (next: PatchState | null) => {
    patchRef.current = next;
    setPatchState(next);
  };

  /** Pointer position in the board's own units, which is what the loom draws in. */
  const toBoard = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * geo.viewW,
        y: ((clientY - rect.top) / rect.height) * geo.viewH,
      };
    },
    [geo.viewH, geo.viewW],
  );

  const pedalUnder = useCallback(
    (point: Point) =>
      boardItems.find((item) => {
        const left = (item.xPct / 100) * geo.viewW;
        const top = (item.yPct / 100) * geo.viewH;
        return (
          point.x >= left &&
          point.x <= left + (widthOf(item.itemId) / 100) * geo.viewW &&
          point.y >= top &&
          point.y <= top + (geo.pedalHPct / 100) * geo.viewH
        );
      }) ?? null,
    [boardItems, geo, widthOf],
  );

  // The drop handler outlives the render it was written in — the pointer can
  // come up two frames after the last move — so it reads the live versions.
  const patchActionsRef = useRef({ plugIn, pedalUnder, toBoard });
  useEffect(() => {
    patchActionsRef.current = { plugIn, pedalUnder, toBoard };
  }, [plugIn, pedalUnder, toBoard]);

  const patching = patch !== null && !patch.armed;

  useEffect(() => {
    if (!patching) return;
    const move = (e: PointerEvent) => {
      const to = patchActionsRef.current.toBoard(e.clientX, e.clientY);
      const current = patchRef.current;
      if (!to || !current) return;
      setPatch({ ...current, to, moved: true });
    };
    const up = (e: PointerEvent) => {
      const current = patchRef.current;
      if (!current) return;
      const {
        toBoard: at,
        pedalUnder: under,
        plugIn: plug,
      } = patchActionsRef.current;
      const to = at(e.clientX, e.clientY) ?? current.to;
      const target = under(to);
      if (target) {
        setPatch(null);
        plug(target.itemId);
        return;
      }
      // A press that never moved is a tap, and a tap is how a board gets patched
      // on a screen with no cursor: the brick stays armed for the pedal to come.
      if (!current.moved) {
        setPatch({ ...current, armed: true });
        setNotice("Now tap the pedal this cable goes to.");
        return;
      }
      setPatch(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [patching]);

  useEffect(() => {
    if (!patch) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPatch(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [patch]);

  const handleBrickPointerDown = (e: React.PointerEvent) => {
    if (dragging) return;
    e.preventDefault();
    if (patch?.armed) {
      setPatch(null);
      return;
    }
    if (powerState.outputsFree === 0) {
      announce(
        `Every output on the ${supply.name} is taken — pull a cable out first.`,
        setNotice,
      );
      return;
    }
    const to = toBoard(e.clientX, e.clientY);
    if (to) setPatch({ to, moved: false, armed: false });
  };

  /** The armed brick waiting for its second tap: anywhere else puts it away. */
  const handleArmedTap = (e: React.PointerEvent) => {
    e.preventDefault();
    setPatch(null);
    setNotice(null);
    const to = toBoard(e.clientX, e.clientY);
    const target = to ? pedalUnder(to) : null;
    if (target) plugIn(target.itemId);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const drag = draggingRef.current;
      if (!drag || !boardRef.current) return;
      const { itemId } = drag;
      const rect = boardRef.current.getBoundingClientRect();
      const wPct = widthOfRef.current(itemId);
      // A pedal in the air goes wherever the hand takes it — neighbours are
      // traded with rather than bumped into, so nothing is in its way.
      const xPct = Math.max(
        0,
        Math.min(
          100 - wPct,
          ((e.clientX - rect.left) / rect.width) * 100 - drag.offXPct,
        ),
      );
      const yPct = Math.max(
        0,
        Math.min(
          100 - geo.pedalHPct,
          ((e.clientY - rect.top) / rect.height) * 100 - drag.offYPct,
        ),
      );

      let next = localItemsRef.current.map((item) =>
        item.itemId === itemId ? { ...item, xPct, yPct } : item,
      );
      let home = { xPct: drag.homeXPct, yPct: drag.homeYPct };

      // Standing on a neighbour trades places with it: the neighbour slides
      // into the slot being carried around, and the dragged pedal inherits the
      // one just vacated. That is the whole of reordering the board — no
      // shuffling anything out of the way first.
      const others = boardBoxes(itemId);
      const target = findSwapTarget(geo, { xPct, yPct, wPct }, others);
      if (target && target.itemId !== drag.lockedId) {
        const plan = planSwap(
          geo,
          { ...home, wPct },
          target,
          others.filter((box) => box.itemId !== target.itemId),
        );
        if (plan) {
          home = plan.home;
          next = next.map((item) =>
            item.itemId === target.itemId ? { ...item, ...plan.target } : item,
          );
          setDragging({
            ...drag,
            homeXPct: plan.home.xPct,
            homeYPct: plan.home.yPct,
            lockedId: target.itemId,
            swapped: true,
          });
        }
      } else if (!target && drag.lockedId) {
        setDragging({ ...drag, lockedId: null });
      }

      // Red only when the pedal has nowhere of its own to fall back to: it is
      // covering a neighbour and its own slot is taken as well. Trading places
      // never lights it up, because that lands cleanly.
      const settled = next.filter(
        (i) => i.itemId !== itemId && !overflowRef.current.includes(i.itemId),
      );
      const boxes = settled.map((i) => ({
        xPct: i.xPct,
        yPct: i.yPct,
        wPct: widthOfRef.current(i.itemId),
      }));
      setIsColliding(
        collidesWithAny(geo, { xPct, yPct, wPct }, boxes) &&
          collidesWithAny(geo, { ...home, wPct }, boxes),
      );

      setLocalItems(next);
    },
    [boardBoxes, geo],
  );

  const handleMouseUp = useCallback(() => {
    const drag = draggingRef.current;
    if (!drag) return;
    const { itemId, swapped } = drag;
    const home = { xPct: drag.homeXPct, yPct: drag.homeYPct };
    setDragging(null);
    setIsColliding(false);

    const prev = localItemsRef.current;
    const dropped = prev.find((i) => i.itemId === itemId);
    const wPct = widthOfRef.current(itemId);
    const others = boardBoxes(itemId);
    const settleAt = (spot: { xPct: number; yPct: number }) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, ...spot } : item,
      );
    let next = prev;

    if (dropped) {
      const box = { xPct: dropped.xPct, yPct: dropped.yPct, wPct };
      const homeBox = { ...home, wPct };
      const covered = collidesWithAny(geo, box, others);
      const homeFree = !collidesWithAny(geo, homeBox, others);

      if (
        homeFree &&
        (covered || (swapped && collidesWithAny(geo, box, [homeBox])))
      ) {
        // An exchange finishes in the slot it traded for, so the two pedals
        // really do end up in each other's places instead of near enough.
        next = settleAt(home);
      } else if (covered) {
        // Nowhere of its own to go back to — the pedal came off a stack, or
        // its slot was taken while it was in the air.
        const spot = findFreeSpot(geo, others, wPct);
        if (spot) {
          next = settleAt(spot);
        } else {
          setOverflowIds((ids) =>
            ids.includes(itemId) ? ids : [...ids, itemId],
          );
          announce(BOARD_FULL, setNotice);
        }
      }
    }

    setLocalItems(next);
    debouncedSave(next);
  }, [debouncedSave, boardBoxes, geo]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handlePedalMouseDown = (
    e: React.MouseEvent,
    item: PedalboardPlacement,
  ) => {
    // On touch devices we open the card on tap instead of dragging.
    if (onShowCard) return;
    e.preventDefault();
    onHover?.(null, null);
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const curXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const curYPct = ((e.clientY - rect.top) / rect.height) * 100;
    setDragging({
      itemId: item.itemId,
      offXPct: curXPct - item.xPct,
      offYPct: curYPct - item.yPct,
      homeXPct: item.xPct,
      homeYPct: item.yPct,
      lockedId: null,
      swapped: false,
    });
  };

  /**
   * Re-seats every cable after the board has been rearranged.
   *
   * The brick's outputs alternate between its two faces, so an output that faced
   * a pedal's row before a tidy may be facing away from it after one — and a
   * loom full of cables going the long way round the brick is a loom nobody
   * would have wired. Which pedals are powered never changes here; only which
   * hole each one is in.
   */
  const repatch = useCallback(
    (
      items: PedalboardPlacement[],
      overflow: string[],
      links: PowerLink[],
    ): PowerLink[] => {
      const powered = new Set(links.map((link) => link.itemId));
      const taken = new Set<number>();

      return inChainOrder(
        geo,
        items.filter((item) => !overflow.includes(item.itemId)),
      ).flatMap((item) => {
        if (!powered.has(item.itemId)) return [];
        const out = pickOutput(rail, item, widthOf(item.itemId), taken);
        if (out === null) return [];
        taken.add(out);
        return [{ itemId: item.itemId, out }];
      });
    },
    [geo, rail, widthOf],
  );

  const handleRemove = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const remaining = localItems.filter((i) => i.itemId !== itemId);
    // Taking a pedal off can free the room a parked one was waiting for.
    const next = applyLayout(layoutBoard(geo, remaining, widthOf), remaining);
    const links = powerState.links.filter((link) => link.itemId !== itemId);
    setLocalPower(links);
    debouncedSave(next, links);
  };

  const handlePickerSelect = (inventoryItemId: string | null) => {
    if (
      !inventoryItemId ||
      localItems.some((i) => i.itemId === inventoryItemId)
    )
      return;
    const spot = findFreeSpot(geo, boardBoxes(), widthOf(inventoryItemId));
    if (!spot) {
      announce(BOARD_FULL, setNotice);
      return;
    }
    const placement = { itemId: inventoryItemId, ...spot };
    const next = [...localItems, placement];
    setLocalItems(next);

    // A pedal that lands on the board gets a cable if the brick has an output
    // left, because that is what the player meant by adding it. When it has
    // none, the pedal still goes down — dark, and with the reason said out loud.
    const refusal = refusalFor(supply, powerState);
    const out = refusal
      ? null
      : pickOutput(
          rail,
          placement,
          widthOf(inventoryItemId),
          new Set(powerState.links.map((link) => link.out)),
        );
    const links =
      out === null
        ? powerState.links
        : [...powerState.links, { itemId: inventoryItemId, out }];

    setLocalPower(links);
    debouncedSave(next, links);
    if (refusal) announce(refusal, setNotice);
  };

  /**
   * Lays the whole board out in the order the craft asks for.
   *
   * It is the only way to reorder the board on a touch device, where dragging is
   * off — but it earns its place on the desktop too, because watching six pedals
   * slide into place and the cable go green in one motion is the moment that
   * teaches the rule. Pedals sharing a stage keep the order the player put them
   * in; only the ones actually standing in the wrong place move.
   */
  const handleWireUp = () => {
    const layout = packInOrder(
      geo,
      wiredOrder(geo, localItems, data.effectInventory),
      widthOf,
    );
    const next = applyLayout(layout, localItems);
    savePower(
      repatch(
        next,
        layout.overflow.map((item) => item.itemId),
        powerState.links,
      ),
    );
    setNotice(null);
    if (layout.overflow.length > 0) {
      announce(
        `No room for ${layout.overflow.length} pedal${layout.overflow.length > 1 ? "s" : ""} — the rest is wired in order.`,
        setNotice,
      );
    }
  };

  const handleTidy = () => {
    const layout = tidyBoard(geo, localItems, widthOf);
    const next = applyLayout(layout, localItems);
    savePower(
      repatch(
        next,
        layout.overflow.map((item) => item.itemId),
        powerState.links,
      ),
    );
    if (layout.overflow.length > 0) {
      const count = layout.overflow.length;
      announce(
        `No room for ${count} pedal${count > 1 ? "s" : ""} — ${count > 1 ? "they are" : "it is"} parked below the board.`,
        setNotice,
      );
    } else {
      setNotice(null);
    }
  };

  const cardFor = (itemId: string) => {
    const invItem = data.effectInventory.find((e) => e.id === itemId);
    return invItem ? <EffectCard item={invItem} readOnly /> : null;
  };

  const occupiedIds = localItems.map((i) => i.itemId);
  const overflowItems = localItems.filter((i) =>
    overflowIds.includes(i.itemId),
  );

  /** Everything with a cable in the brick — and, on a legacy board, everything. */
  const hasPower = useCallback(
    (itemId: string) =>
      localPower === null || powerState.poweredIds.has(itemId),
    [localPower, powerState],
  );

  // Scored off the *live* board rather than the saved one, so the panel and the
  // cable move under the player's hand instead of 600ms after it. Only pedals
  // with power are in it: a dead pedal is a box the signal walks through, so it
  // neither earns a cable's Fame nor is blamed for one — which is what the
  // report API pays on too.
  const verdict = useMemo(
    () =>
      evaluateChain(
        readChainNodes(
          geo,
          localItems,
          data.effectInventory,
          localPower === null ? undefined : hasPower,
        ),
      ),
    [geo, localItems, data.effectInventory, localPower, hasPower],
  );
  const isOnBoard = useCallback(
    (itemId: string) => !overflowIds.includes(itemId),
    [overflowIds],
  );

  // Where every DC cable begins and ends, and the rest of each row, so a run
  // climbing to the top row can pick a gap between two pedals to climb through.
  const patched: PoweredPedal[] = powerState.links.flatMap((link) => {
    const item = boardItems.find((i) => i.itemId === link.itemId);
    if (!item) return [];
    const wPct = widthOf(link.itemId);
    return [
      {
        itemId: link.itemId,
        out: link.out,
        row: rowIndexOf(geo, item.yPct),
        jack: dcJackAt(geo, item.xPct, item.yPct, wPct, dcOf(link.itemId)),
        left: (item.xPct / 100) * geo.viewW,
        right: ((item.xPct + wPct) / 100) * geo.viewW,
      },
    ];
  });

  const rowSpans = boardItems.reduce<Record<number, RowSpan[]>>((acc, item) => {
    const row = rowIndexOf(geo, item.yPct);
    const wPct = widthOf(item.itemId);
    (acc[row] ??= []).push({
      left: (item.xPct / 100) * geo.viewW,
      right: ((item.xPct + wPct) / 100) * geo.viewW,
    });
    return acc;
  }, {});

  // The loose end of a cable being dragged out of the brick: which socket it is
  // hanging from, what it is over, and whether the brick can carry it.
  const patchTarget = patch && !patch.armed ? pedalUnder(patch.to) : null;
  const patchFree = rail.sockets.filter(
    (socket) => !powerState.links.some((link) => link.out === socket.index),
  );
  const patchSocket =
    patch && patchFree.length > 0
      ? patchTarget && !powerState.poweredIds.has(patchTarget.itemId)
        ? rail.sockets[
            pickOutput(
              rail,
              patchTarget,
              widthOf(patchTarget.itemId),
              new Set(powerState.links.map((link) => link.out)),
            ) ?? patchFree[0].index
          ]
        : patchFree.reduce((best, socket) =>
            Math.abs(socket.x - patch.to.x) < Math.abs(best.x - patch.to.x)
              ? socket
              : best,
          )
      : null;
  const patchAllowed =
    patchTarget !== null && !powerState.poweredIds.has(patchTarget.itemId);

  const unpoweredNames = powerState.unpoweredIds.map(nameOf);

  // The one moment the whole system exists for: say it out loud, once, on the
  // transition — not every render the board happens to be right.
  const lastTierRef = useRef<ChainTier | null>(null);
  useEffect(() => {
    // Mid-drag the board is in whatever state the mouse left it; wait for the
    // pedal to land before congratulating anybody.
    if (dragging) return;
    const previous = lastTierRef.current;
    lastTierRef.current = verdict.tier;
    if (previous === null || previous === verdict.tier) return;
    if (verdict.tier === "book" && verdict.rate > 0) {
      toast.success(
        `By the book — the board pays +${verdict.rate.toFixed(1)} Fame/h`,
      );
    }
  }, [dragging, verdict.tier, verdict.rate]);

  // Lets the picker grey out pedals the board has no space for, so a full
  // board is visible before anything is clicked.
  const occupancy = boardItems.map((i) => ({
    xPct: i.xPct,
    yPct: i.yPct,
    wPct: widthOf(i.itemId),
  }));
  const canFit = (itemId: string) =>
    findFreeSpot(geo, occupancy, widthOf(itemId)) !== null;

  // Filling every output the brick still has saves a player eight drags — but
  // only offer it when it would actually do something.
  const canPatch =
    powerState.outputsFree > 0 && powerState.unpoweredIds.length > 0;

  return (
    <>
      <SectionHeading title='Pedalboard' />

      {/* What the wiring is worth, and whether the brick has a hole left. */}
      {boardItems.length > 0 && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <SignalPathPanel verdict={verdict} />
          <PowerPanel
            supply={supply}
            state={powerState}
            unpowered={unpoweredNames}
          />
        </div>
      )}

      {/* Every button the board has, on the board's own doorstep: the four that
          rearrange it, and the two that buy it more room. Directly above the
          case, because each one is answering something the deck below is
          already showing. */}
      <div className='flex flex-wrap items-center justify-end gap-2'>
        {notice && (
          <p className='mr-auto flex items-center gap-1.5 text-[11px] font-semibold text-amber-400'>
            <AlertTriangle size={13} strokeWidth={2.5} className='shrink-0' />
            {notice}
          </p>
        )}

        {verdict.tip !== null && boardItems.length > 1 && (
          <button
            onClick={handleWireUp}
            className={cn(RIG_BUTTON, RIG_BUTTON_FIX)}
            title='Lay the whole board out in the order the craft asks for'>
            <Zap size={12} strokeWidth={2.5} />
            Wire it up
          </button>
        )}
        {canPatch && (
          <button
            onClick={() =>
              savePower(autoPatch(rail, boardItems, powerState.links, widthOf))
            }
            className={cn(RIG_BUTTON, RIG_BUTTON_FIX)}
            title='Plug in everything the brick still has a hole for'>
            <Plug size={12} strokeWidth={2.5} />
            Patch power
          </button>
        )}
        {boardItems.length > 1 && (
          <button
            onClick={handleTidy}
            className={RIG_BUTTON}
            title='Line every pedal up in rows'>
            <LayoutGrid size={12} strokeWidth={2.5} />
            Tidy up
          </button>
        )}
        <button onClick={() => setShowPicker(true)} className={RIG_BUTTON}>
          <Plus size={12} strokeWidth={2.5} />
          Add pedal
        </button>

        {/* Set a little apart from the rest, because these two spend Fame. */}
        <div className='flex flex-wrap items-center gap-2 sm:ml-3'>
          <RigHardwarePanel rig={data.rig} fame={fame} />
        </div>
      </div>

      {/* Case outer shell */}
      <div
        className='relative w-full select-none'
        style={{
          background:
            "linear-gradient(160deg, #2e2e2e 0%, #1c1c1c 50%, #222 100%)",
          borderRadius: 4,
          padding: "10px 14px 14px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          border: "2px solid #383838",
        }}>
        {/* Top bar: latches + label */}
        <div className='mb-2.5 flex items-center justify-between px-1'>
          <div className='flex gap-2'>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 11,
                  background:
                    "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)",
                  borderRadius: 4,
                  boxShadow:
                    "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
          <div className='flex gap-2'>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 11,
                  background:
                    "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)",
                  borderRadius: 4,
                  boxShadow:
                    "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        </div>

        {/* The supply, racked on the case above the deck. Its cables carry on
            into the board below — see `PowerLoom` for the seam. */}
        <div
          className='relative w-full'
          style={{ paddingTop: `${railPaddingPct(geo)}%` }}>
          <PowerRail
            rail={rail}
            used={new Set(patched.map((pedal) => pedal.out))}
            pending={
              patch && !patch.armed ? (patchSocket?.index ?? null) : null
            }
          />
          {/* The brick is the grab handle: a cable is dragged out of it and
              dropped on the pedal it feeds. */}
          <div
            onPointerDown={handleBrickPointerDown}
            title={`${supply.name} — drag a cable onto a pedal to power it`}
            className='absolute'
            style={{
              left: `${(rail.brick.x / geo.viewW) * 100}%`,
              width: `${(rail.brick.w / geo.viewW) * 100}%`,
              top: `${(rail.brick.y / RAIL_H) * 100}%`,
              height: `${(rail.brick.h / RAIL_H) * 100}%`,
              cursor: patch ? "grabbing" : "grab",
              touchAction: "none",
            }}
          />
        </div>

        {/* Board surface — perforated */}
        <div
          ref={boardRef}
          className='relative w-full overflow-hidden'
          style={{
            aspectRatio: `${geo.w} / ${geo.h}`,
            borderRadius: 4,
            backgroundImage:
              "radial-gradient(circle, #272727 1.4px, transparent 1.4px)",
            backgroundSize: "9px 9px",
            backgroundColor: "#141414",
            // A board wired by the book washes emerald from the inside. It is the
            // one piece of feedback that needs no reading at all.
            boxShadow: verdict.flawless
              ? "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(52,211,153,0.10), inset 0 0 44px rgba(16,185,129,0.11)"
              : "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.02)",
            transition: "box-shadow 0.4s ease",
            cursor: dragging ? "grabbing" : "default",
          }}>
          {/* Power first, under everything, the way it is on a real board. The
              cable in the air picks up where the rail's stub left off, at the
              deck's own top edge. */}
          <PowerLoom
            rail={rail}
            patched={patched}
            rowSpans={rowSpans}
            dragging={
              patch && !patch.armed && patchSocket
                ? {
                    from: { x: patchSocket.x, y: 0 },
                    to: patch.to,
                    allowed: patchAllowed,
                  }
                : null
            }
          />

          {/* An armed brick waits for one tap anywhere: on a pedal it patches
              it, anywhere else it puts the cable away. Touch has no hover to
              drag with, and this is what it gets instead. */}
          {patch?.armed && (
            <div
              onPointerDown={handleArmedTap}
              className='absolute inset-0 z-[60]'
              style={{ touchAction: "none" }}
            />
          )}

          <SignalCable
            geo={geo}
            verdict={verdict}
            widthOf={widthOf}
            jacksOf={jacksOf}
            isOnBoard={isOnBoard}
          />

          {/* Pedals */}
          {boardItems.map((placement) => {
            const invItem = data.effectInventory.find(
              (e) => e.id === placement.itemId,
            );
            const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
            const rs = effect
              ? RARITY_STYLES[
                  getEffectiveRarity(effect.rarity, invItem?.buildLevel)
                ]
              : null;
            if (!effect || !rs) return null;
            const isDragging = dragging?.itemId === placement.itemId;
            const showCollision = isDragging && isColliding;
            const wPct = widthOf(placement.itemId);
            const powered = hasPower(placement.itemId);
            // The pedal the loose end of a cable is currently over. Amber when
            // the brick can carry it, red when the drop would be refused — so
            // the answer arrives before the cable is let go, not after.
            const aimedAt = patchTarget?.itemId === placement.itemId;

            return (
              <div
                key={placement.itemId}
                onMouseDown={(e) => handlePedalMouseDown(e, placement)}
                onMouseMove={(e) => {
                  if (!dragging && invItem)
                    onHover?.(e, <EffectCard item={invItem} readOnly />);
                }}
                onMouseLeave={() => onHover?.(null, null)}
                onClick={() => {
                  if (onShowCard && invItem)
                    onShowCard(<EffectCard item={invItem} readOnly />);
                }}
                className='group absolute'
                style={{
                  left: `${placement.xPct}%`,
                  top: `${placement.yPct}%`,
                  width: `${wPct}%`,
                  height: `${geo.pedalHPct}%`,
                  zIndex: isDragging ? 50 : 2,
                  cursor: isDragging ? "grabbing" : "grab",
                  filter: showCollision
                    ? `drop-shadow(0 14px 28px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(220,38,38,0.9))`
                    : isDragging
                      ? `drop-shadow(0 18px 32px rgba(0,0,0,0.98)) drop-shadow(0 0 14px ${rs.baseColor}70)`
                      : aimedAt
                        ? `drop-shadow(0 0 14px ${
                            patchAllowed
                              ? "rgba(245,158,11,0.85)"
                              : "rgba(248,113,113,0.85)"
                          })`
                        : // An unpowered pedal is off. Not dimmed to say "you
                          // cannot have this" — dimmed because there is no
                          // current in it.
                          powered
                          ? "none"
                          : "grayscale(0.7) brightness(0.55)",
                  transform: isDragging
                    ? "scale(1.07) translateY(-6px)"
                    : "scale(1)",
                  // A pedal being traded with slides into its new place, so the
                  // exchange is something the player watches happen rather than
                  // a jump they have to work out afterwards.
                  transition: isDragging
                    ? "none"
                    : "left 0.18s ease, top 0.18s ease, filter 0.15s, transform 0.15s",
                }}>
                <img
                  src={getEffectImageSrc(effect.imageId, "full")}
                  alt={effect.name}
                  className='h-full w-full object-contain'
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (!img.naturalWidth || !img.naturalHeight) return;
                    const ar = img.naturalWidth / img.naturalHeight;
                    const known =
                      EFFECT_IMAGE_ASPECT[effect.imageId] ?? DEFAULT_ASPECT;
                    // Only worth remembering when the image is not what the
                    // layout table already assumes.
                    if (Math.abs(known - ar) < 0.005) return;
                    setAspectById((prev) =>
                      prev[effect.imageId] === ar
                        ? prev
                        : { ...prev, [effect.imageId]: ar },
                    );
                  }}
                />
                {/* Pull the DC cable out. It stands over the pedal's own
                    inlet, so it reads as the plug it removes rather than as
                    another button in the corner — and it is a whole control
                    wide, which the drawn plug never could be. */}
                {powered && (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      unplug(placement.itemId);
                    }}
                    aria-label={`Unplug ${effect.name}`}
                    title={`Unplug ${effect.name}`}
                    className={`absolute z-10 flex h-[30px] w-[30px] -translate-x-1/2 items-center justify-center rounded-full bg-black/85 text-zinc-300 transition-opacity hover:text-amber-300 ${
                      // No hover on a touch screen, so there it simply stays up.
                      onShowCard
                        ? "opacity-90"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                    style={{
                      left: `${dcOf(placement.itemId).x * 100}%`,
                      // Straddling the edge rather than floating clear of it:
                      // a narrow board leaves only a few pixels of margin above
                      // the top row, and the deck clips whatever spills out.
                      top: -11,
                    }}>
                    <Unplug size={15} strokeWidth={2.5} />
                  </button>
                )}
                {/* Remove */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleRemove(placement.itemId, e)}
                  className='absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded border border-zinc-500 bg-black/90 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:border-zinc-300 hover:text-white'>
                  <X size={8} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom: handles + rubber feet */}
        <div className='mt-2.5 flex items-center justify-between px-3'>
          <div
            style={{
              width: 52,
              height: 9,
              background: "linear-gradient(180deg,#555,#2a2a2a)",
              borderRadius: 4,
              boxShadow:
                "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          />
          <div className='flex gap-6'>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 4,
                  background:
                    "radial-gradient(circle at 35% 35%,#3a3a3a,#0a0a0a)",
                  boxShadow:
                    "0 3px 5px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              width: 52,
              height: 9,
              background: "linear-gradient(180deg,#555,#2a2a2a)",
              borderRadius: 4,
              boxShadow:
                "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>

      {/* Parked pedals: still equipped, but the board ran out of room for them. */}
      {overflowItems.length > 0 && (
        <div className='mt-4 flex flex-col gap-3 rounded bg-zinc-900/40 p-4'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-amber-500/90'>
              Off the board
            </p>
            <p className='text-xs text-zinc-400'>
              No room left for{" "}
              {overflowItems.length === 1 ? "this pedal" : "these pedals"} —
              take something off the board, then tidy up to put{" "}
              {overflowItems.length === 1 ? "it" : "them"} back.
            </p>
          </div>
          <div className='flex flex-wrap gap-5'>
            {overflowItems.map((placement) => {
              const invItem = data.effectInventory.find(
                (e) => e.id === placement.itemId,
              );
              const effect = invItem
                ? EFFECTS_BY_ID.get(invItem.effectId)
                : null;
              if (!effect || !invItem) return null;

              return (
                <div
                  key={placement.itemId}
                  className='group relative'
                  onMouseMove={(e) => onHover?.(e, cardFor(placement.itemId))}
                  onMouseLeave={() => onHover?.(null, null)}
                  onClick={() => {
                    if (onShowCard) onShowCard(cardFor(placement.itemId));
                  }}>
                  <img
                    src={getEffectImageSrc(effect.imageId, "small")}
                    alt={effect.name}
                    className='h-14 w-auto object-contain opacity-60 transition-opacity group-hover:opacity-100'
                    draggable={false}
                  />
                  <button
                    onClick={(e) => handleRemove(placement.itemId, e)}
                    aria-label={`Remove ${effect.name}`}
                    className='absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded bg-black/90 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white'>
                    <X size={8} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showPicker && (
        <EffectPickerModal
          effectInventory={data.effectInventory}
          occupiedItemIds={occupiedIds}
          slotIndex={localItems.length}
          currentItemId={null}
          canFit={canFit}
          onSelect={(id) => {
            if (id) handlePickerSelect(id);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
};
