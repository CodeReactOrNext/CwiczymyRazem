import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import {
  AlertTriangle,
  ArrowLeftRight,
  Expand,
  LayoutGrid,
  Minimize2,
  Plug,
  Plus,
  Shrink,
  Unplug,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { readBoardLevel } from "../../data/boardDuplicates";
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
import type { BoardView } from "../../utils/boardZoom";
import {
  AT_REST,
  clampZoom,
  FIT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  panForZoom,
  pinchSpan,
  settleView,
  ZOOM_STEP,
} from "../../utils/boardZoom";
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
  heightPctFor,
  inChainOrder,
  layoutBoard,
  packInOrder,
  planSwap,
  replacementSpots,
  rowIndexOf,
  squeezeIn,
  tidyBoard,
} from "../../utils/pedalboardLayout";
import { grabOffsetY, hasLeftTheTap } from "../../utils/pedalDrag";
import type { RowSpan } from "../../utils/powerLayout";
import { dcJackAt, RAIL_H, railFor } from "../../utils/powerLayout";
import { CardAction, CardActionRow } from "../CardActions";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { RARITY_STYLES } from "../RarityBadge";
import { BoardStatusStrip } from "./BoardStatusStrip";
import { duplicateGlow, DuplicateMark } from "./DuplicateMark";
import { DuplicateStrip } from "./DuplicateStrip";
import { EffectPickerModal } from "./EffectPickerModal";
import { MakeRoomBar } from "./MakeRoomBar";
import { PedalboardCase } from "./PedalboardCase";
import type { PoweredPedal } from "./PowerLoom";
import { PedalDcPlug, PowerLoom, PowerRail } from "./PowerLoom";
import { RigHardwarePanel } from "./RigHardwarePanel";
import { RIG_BUTTON, RIG_BUTTON_FIX, RIG_BUTTON_PRIMARY } from "./RigSection";
import { SignalCable } from "./SignalCable";
import { SignalOrderStrip } from "./SignalOrderStrip";

/** How long a "no room left" message stays up next to the board controls. */
const NOTICE_MS = 8000;

/** One key of the zoom control that floats over the case on a touch screen.
    Thumb-sized, unlit, and out of the way until it is aimed at. */
const ZOOM_KEY =
  `${PRESSABLE} flex h-10 w-10 items-center justify-center rounded-lg bg-black/70 text-zinc-200 backdrop-blur-sm transition-colors active:bg-black/90 disabled:opacity-25 border-b-black/30`;

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
  /** The pointer carrying it — a second finger cannot steer the same pedal. */
  pointerId: number;
  /** Where the press went down, in viewport pixels. The tap threshold is
   *  measured from here. */
  startX: number;
  startY: number;
  /** Has the press travelled far enough to be a carry rather than a tap? Until
   *  it has, nothing on the board has moved and letting go opens the card. */
  active: boolean;
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
  /** Touch-only: tapping a pedal opens its card in a modal, since there is no
   *  hover to read one with. Dragging works either way. */
  onShowCard?: (content: React.ReactNode) => void;
}

export const PedalboardView = ({
  data,
  fame,
  onUpdateItems,
  onHover,
  onShowCard,
}: PedalboardViewProps) => {
  // A screen with no cursor: every control that hides behind a hover has to
  // stand on its own here, and a card is read by tapping rather than pointing.
  const isTouch = Boolean(onShowCard);
  const { t } = useArsenalLabels();
  const boardRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragging, setDraggingState] = useState<DragState | null>(null);
  // Mirrors `dragging` for the window handlers: the mouse can move twice
  // before React re-renders, and the second move has to see the slot the
  // first one traded for.
  const draggingRef = useRef<DragState | null>(null);
  /** Opens a pedal's card. Written further down, where the actions the card
   *  carries are defined, and kept fresh by the effect beside them — the same
   *  arrangement as `patchActionsRef`. */
  const openSheetRef = useRef<(itemId: string) => void>(() => undefined);
  /** What a tap on a pedal does — open its card, or trade it for the pedal in
   *  hand while the board is making room. Kept fresh the same way. */
  const tapPedalRef = useRef<(itemId: string) => void>(() => undefined);
  /**
   * A pedal the player has picked up that the board has no room for yet: one
   * chosen in the picker, or one parked below the case. It stays in hand until
   * it lands — traded for a pedal on the deck, squeezed in, or dropped into a
   * gap the player opens — or until the hunt is called off. See `MakeRoomBar`.
   */
  const [placing, setPlacing] = useState<string | null>(null);

  const setDragging = (next: DragState | null) => {
    draggingRef.current = next;
    setDraggingState(next);
  };

  // Where the board is being looked at from. Life size on a desktop and never
  // anything else there; on a phone it is the difference between a picture of a
  // pedalboard and one that can be worked on. See `utils/boardZoom`.
  const viewportRef = useRef<HTMLDivElement>(null);
  const caseRef = useRef<HTMLDivElement>(null);
  const [view, setViewState] = useState<BoardView>(AT_REST);
  const viewRef = useRef<BoardView>(AT_REST);
  /** Fingers on the deck that are moving the view rather than a pedal. */
  const viewPointersRef = useRef<Map<number, Point> | null>(null);
  /** The span the pinch was last measured at, and where a one-finger push was. */
  const pinchRef = useRef(0);
  const pushRef = useRef<Point | null>(null);

  const setView = (next: BoardView) => {
    viewRef.current = next;
    setViewState(next);
  };

  /** The board, taken out of the page and given the whole screen. */
  const [fullscreen, setFullscreen] = useState(false);
  /** How small the board may be drawn here. Only a full screen has room to
   *  spare, and only there is "show me all of it" a thing worth asking for. */
  const zoomFloor = fullscreen ? FIT_ZOOM : MIN_ZOOM;

  const [isColliding, setIsColliding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // The pedal the pointer is over, as a catalogue id, while that pedal stands
  // on the board more than once. Every copy of it lights at once, so "a
  // duplicate of what?" is answered by moving the mouse, not by reading.
  const [hoverDuplicate, setHoverDuplicate] = useState<number | string | null>(
    null,
  );
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
  const boardBoxes = useCallback(
    (excludeId?: string): BoardBox[] => {
      const overflow = overflowRef.current;
      return localItemsRef.current
        .filter((i) => i.itemId !== excludeId && !overflow.includes(i.itemId))
        .map((i) => ({
          itemId: i.itemId,
          xPct: i.xPct,
          yPct: i.yPct,
          wPct: widthOfRef.current(i.itemId),
          hPct: heightPctFor(geo, widthOfRef.current, i.itemId),
        }));
    },
    [geo],
  );

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
          t("board.no_output", { supply: supply.name, count: short }),
          setNotice,
        );
      }
    },
    [applyLayout, geo, rail, savePower, supply, t, widthOf],
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

  /** Everything with a cable in the brick — and, on a legacy board, everything. */
  const hasPower = useCallback(
    (itemId: string) =>
      localPower === null || powerState.poweredIds.has(itemId),
    [localPower, powerState],
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
          point.y <=
            top + (heightPctFor(geo, widthOf, item.itemId) / 100) * geo.viewH
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
        setNotice(t("board.tap_target"));
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
  }, [patching, t]);

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
      announce(t("board.outputs_taken", { supply: supply.name }), setNotice);
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

  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      let drag = draggingRef.current;
      if (!drag || !boardRef.current) return;
      if (e.pointerId !== drag.pointerId) return;

      // The press decides here what it was. Below the threshold nothing has
      // happened yet — on a touch screen the very same press is how a card is
      // opened, and on a mouse a twitch between click and release should not
      // rearrange a board.
      if (!drag.active) {
        if (
          !hasLeftTheTap(
            { x: drag.startX, y: drag.startY },
            { x: e.clientX, y: e.clientY },
          )
        )
          return;
        drag = {
          ...drag,
          active: true,
          offYPct: grabOffsetY(
            e.pointerType,
            drag.offYPct,
            heightPctFor(geo, widthOfRef.current, drag.itemId),
          ),
        };
        setDragging(drag);
        onHover?.(null, null);
      }

      const { itemId } = drag;
      const rect = boardRef.current.getBoundingClientRect();
      const wPct = widthOfRef.current(itemId);
      const hPct = heightPctFor(geo, widthOfRef.current, itemId);
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
          100 - hPct,
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
      const target = findSwapTarget(geo, { xPct, yPct, wPct, hPct }, others);
      if (target && target.itemId !== drag.lockedId) {
        const plan = planSwap(
          geo,
          { ...home, wPct, hPct },
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
        hPct: heightPctFor(geo, widthOfRef.current, i.itemId),
      }));
      setIsColliding(
        collidesWithAny(geo, { xPct, yPct, wPct, hPct }, boxes) &&
          collidesWithAny(geo, { ...home, wPct, hPct }, boxes),
      );

      setLocalItems(next);
    },
    [boardBoxes, geo, onHover],
  );

  const handleDragEnd = useCallback(
    (e: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      if (e.pointerId !== drag.pointerId) return;

      // A press that never travelled is a tap, and the board is exactly as it
      // was — so there is nothing to settle and nothing to save. On a touch
      // screen the tap is what opens the pedal's card, which is also where its
      // actions live.
      if (!drag.active) {
        setDragging(null);
        tapPedalRef.current(drag.itemId);
        return;
      }

      const { itemId, swapped } = drag;
      const home = { xPct: drag.homeXPct, yPct: drag.homeYPct };
      setDragging(null);
      setIsColliding(false);

      const prev = localItemsRef.current;
      const dropped = prev.find((i) => i.itemId === itemId);
      const wPct = widthOfRef.current(itemId);
      const hPct = heightPctFor(geo, widthOfRef.current, itemId);
      const others = boardBoxes(itemId);
      const settleAt = (spot: { xPct: number; yPct: number }) =>
        prev.map((item) =>
          item.itemId === itemId ? { ...item, ...spot } : item,
        );
      let next = prev;

      if (dropped) {
        const box = { xPct: dropped.xPct, yPct: dropped.yPct, wPct, hPct };
        const homeBox = { ...home, wPct, hPct };
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
          const spot = findFreeSpot(geo, others, wPct, hPct);
          if (spot) {
            next = settleAt(spot);
          } else {
            // Off the deck, but still in hand: the board goes straight to
            // looking for room for it rather than just saying there is none.
            setOverflowIds((ids) =>
              ids.includes(itemId) ? ids : [...ids, itemId],
            );
            setPlacing(itemId);
          }
        }
      }

      setLocalItems(next);
      debouncedSave(next);
    },
    [debouncedSave, boardBoxes, geo],
  );

  useEffect(() => {
    if (!dragging) return;
    // Pointer events, not mouse ones: the same handlers then carry a finger,
    // and the board becomes something a phone can rearrange.
    const end = (e: PointerEvent) => handleDragEnd(e);
    // A cancelled pointer (a call, the browser taking the gesture) is not a
    // drop and never a tap — the pedal simply stays where it was last drawn.
    const cancel = (e: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      if (!drag.active) {
        setDragging(null);
        return;
      }
      handleDragEnd(e);
    };
    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  const handlePedalPointerDown = (
    e: React.PointerEvent,
    item: PedalboardPlacement,
  ) => {
    // A right-click is not a drag, a second finger does not join one in
    // progress, and a cable already in the air owns the next press.
    if (e.button !== 0 || draggingRef.current || patch) return;
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
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
    });
  };

  /* ---------------------------------------------------------- the view ---- */

  const viewPointers = () => (viewPointersRef.current ??= new Map());

  /** The window the case is seen through, and the case at its own size. */
  const viewFrame = () => {
    const window = viewportRef.current;
    const board = caseRef.current;
    if (!window || !board) return null;
    return {
      window: window.getBoundingClientRect(),
      // Layout size, which a transform never touches — so this stays the board
      // at life size however far into it the player has zoomed.
      size: { width: board.offsetWidth, height: board.offsetHeight },
    };
  };

  /** Grows or shrinks the board about one point, and settles it in its window. */
  const zoomAbout = (zoom: number, origin: Point) => {
    const frame = viewFrame();
    if (!frame) return;
    const from = viewRef.current;
    const to = clampZoom(zoom, zoomFloor);
    setView(
      settleView(
        {
          zoom: to,
          x: panForZoom(from.x, origin.x, from.zoom, to),
          y: panForZoom(from.y, origin.y, from.zoom, to),
        },
        frame.window,
        frame.size,
      ),
    );
  };

  /** The zoom keys. They hold the middle of the window, having no finger to
   *  hold instead. */
  const stepZoom = (by: number) => {
    const frame = viewFrame();
    if (!frame) return;
    zoomAbout(viewRef.current.zoom + by, {
      x: frame.window.width / 2,
      y: frame.window.height / 2,
    });
  };

  const handleViewPointerDown = (e: React.PointerEvent) => {
    // A press already carrying a pedal or a DC cable is not a press on the
    // view, and a desktop board never moves at all.
    if (!isTouch || draggingRef.current || patchRef.current) return;
    const points = viewPointers();
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    const down = [...points.values()];
    pinchRef.current = down.length === 2 ? pinchSpan(down[0], down[1]) : 0;
    pushRef.current = down.length === 1 ? down[0] : null;
  };

  const handleViewPointerMove = (e: React.PointerEvent) => {
    const points = viewPointersRef.current;
    if (!points?.has(e.pointerId)) return;
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const frame = viewFrame();
    if (!frame) return;
    const down = [...points.values()];

    // Two fingers: the board grows and shrinks around whatever is between them.
    if (down.length >= 2) {
      const span = pinchSpan(down[0], down[1]);
      if (pinchRef.current > 0) {
        zoomAbout(viewRef.current.zoom * (span / pinchRef.current), {
          x: (down[0].x + down[1].x) / 2 - frame.window.left,
          y: (down[0].y + down[1].y) / 2 - frame.window.top,
        });
      }
      pinchRef.current = span;
      pushRef.current = null;
      return;
    }

    // One finger pushes the board around under the window — but in the page,
    // only once there is more board than window, or a swipe meant for the page
    // would be eaten. Full screen there is no page to scroll past.
    const from = pushRef.current;
    if (!from || (!fullscreen && viewRef.current.zoom === MIN_ZOOM)) return;
    const current = viewRef.current;
    setView(
      settleView(
        {
          ...current,
          x: current.x + e.clientX - from.x,
          y: current.y + e.clientY - from.y,
        },
        frame.window,
        frame.size,
      ),
    );
    pushRef.current = { x: e.clientX, y: e.clientY };
  };

  /**
   * Opens the board on the whole screen.
   *
   * The overlay is the part that matters and the part that always works: the
   * same board, moved to the top of the document. Everything after it is a
   * bonus the platform may refuse — iOS puts nothing but video full screen for
   * real, and not every phone will take an orientation lock — so none of it is
   * waited on and none of it can fail the gesture. A player whose phone refuses
   * both can still simply turn it, which is what the overlay is sized for.
   */
  const openFullscreen = () => {
    setFullscreen(true);
    setView(AT_REST);
    void document.documentElement
      .requestFullscreen?.()
      .then(() => window.screen?.orientation?.lock?.("landscape"))
      .catch(() => undefined);
  };

  const closeFullscreen = () => {
    setFullscreen(false);
    setView(AT_REST);
    window.screen?.orientation?.unlock?.();
    if (document.fullscreenElement) void document.exitFullscreen?.();
  };

  // Escape gets out, the page underneath holds still, and letting go of the
  // browser's own full screen (the system gesture, the Escape key it swallows)
  // puts the board back in the page rather than leaving an overlay behind.
  useEffect(() => {
    if (!fullscreen) return undefined;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    const changed = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", changed);
    return () => {
      document.body.style.overflow = scroll;
      window.removeEventListener("keydown", key);
      document.removeEventListener("fullscreenchange", changed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const handleViewPointerUp = (e: React.PointerEvent) => {
    const points = viewPointersRef.current;
    if (!points) return;
    points.delete(e.pointerId);
    const left = [...points.values()];
    // The finger left behind by a pinch carries on pushing from where it is,
    // not from where the pinch started.
    pinchRef.current = left.length === 2 ? pinchSpan(left[0], left[1]) : 0;
    pushRef.current = left.length === 1 ? left[0] : null;
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

  const takeOffBoard = (itemId: string) => {
    const remaining = localItems.filter((i) => i.itemId !== itemId);
    // Taking a pedal off can free the room a parked one was waiting for.
    const next = applyLayout(layoutBoard(geo, remaining, widthOf), remaining);
    const links = powerState.links.filter((link) => link.itemId !== itemId);
    setLocalPower(links);
    debouncedSave(next, links);
  };

  const handleRemove = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    takeOffBoard(itemId);
  };

  /**
   * Puts a pedal down on the deck at `spot` — in the place of `replacedId` when
   * there is one, which goes back to the collection rather than anywhere worse.
   * A pedal parked below the case is moved up, not added twice.
   */
  const landPedal = (
    incoming: string,
    spot: { xPct: number; yPct: number },
    replacedId?: string,
  ) => {
    const placement = { itemId: incoming, ...spot };
    const kept = localItems.filter((i) => i.itemId !== incoming);
    const next = replacedId
      ? kept.map((i) => (i.itemId === replacedId ? placement : i))
      : [...kept, placement];
    setOverflowIds((ids) =>
      ids.filter((id) => id !== incoming && id !== replacedId),
    );
    setLocalItems(next);
    setPlacing(null);

    // A pedal that lands on the board gets a cable if the brick has an output
    // left, because that is what the player meant by adding it — and one taking
    // another's place takes its cable too, so a swap never costs power. When
    // there is none, the pedal still goes down: dark, and with the reason said
    // out loud.
    const base = powerState.links.filter(
      (link) => link.itemId !== incoming && link.itemId !== replacedId,
    );
    const inherited =
      powerState.links.find((link) => link.itemId === replacedId)?.out ?? null;
    const out =
      inherited ??
      pickOutput(
        rail,
        placement,
        widthOf(incoming),
        new Set(base.map((link) => link.out)),
      );
    const links = out === null ? base : [...base, { itemId: incoming, out }];

    setLocalPower(links);
    debouncedSave(next, links);
    const refusal = out === null ? refusalFor(supply, powerState) : null;
    if (refusal) announce(refusal, setNotice);
    else setNotice(null);
  };

  /**
   * Adds a pedal from the collection — or brings a parked one back up. Where
   * there is room it simply lands; where there is none it stays in hand and the
   * board starts making room for it, instead of just saying it is full.
   */
  const handlePickerSelect = (inventoryItemId: string | null) => {
    if (
      !inventoryItemId ||
      boardItems.some((i) => i.itemId === inventoryItemId)
    )
      return;
    const spot = findFreeSpot(
      geo,
      boardBoxes(),
      widthOf(inventoryItemId),
      heightPctFor(geo, widthOf, inventoryItemId),
    );
    if (spot) {
      landPedal(inventoryItemId, spot);
      return;
    }
    setPatch(null);
    setNotice(null);
    setPlacing(inventoryItemId);
  };

  /**
   * Lays the whole board out in the order the craft asks for.
   *
   * One button for what is otherwise six drags — and on a phone, where the deck
   * is thumb-sized, that is the difference between a board somebody wires and a
   * board they give up on. Watching the pedals slide into place and the cable go
   * green in one motion is also the moment that teaches the rule. Pedals sharing
   * a stage keep the order the player put them in; only the ones actually
   * standing in the wrong place move.
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
        t("board.no_room_wired", { count: layout.overflow.length }),
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
      announce(t("board.no_room_parked", { count }), setNotice);
    } else {
      setNotice(null);
    }
  };

  /**
   * The pedal in hand, while it still has nowhere to go. Anything that lands it
   * — a swap, a squeeze, a tidy that finds it a spot on its own — ends the hunt
   * by the same token, without a second piece of state to keep in step.
   */
  const placingId =
    placing !== null &&
    !boardItems.some((i) => i.itemId === placing) &&
    data.effectInventory.some((e) => e.id === placing)
      ? placing
      : null;

  /**
   * Every way there is of making room for it, read off the board as it stands —
   * so dragging a neighbour aside to open a gap is answered the moment it is let
   * go. A gap already there wins outright; otherwise the pedals it could trade
   * places with, and whether pushing the board together would do instead.
   */
  const makeRoom = useMemo(() => {
    if (!placingId) return null;
    const wPct = widthOf(placingId);
    const hPct = heightPctFor(geo, widthOf, placingId);
    const boxes: BoardBox[] = boardItems.map((i) => ({
      itemId: i.itemId,
      xPct: i.xPct,
      yPct: i.yPct,
      wPct: widthOf(i.itemId),
      hPct: heightPctFor(geo, widthOf, i.itemId),
    }));
    const spot = findFreeSpot(geo, boxes, wPct, hPct);
    return {
      spot,
      swaps: spot
        ? new Map<string, { xPct: number; yPct: number }>()
        : replacementSpots(geo, boxes, wPct, hPct),
      squeeze: spot ? null : squeezeIn(geo, boardItems, placingId, widthOf),
    };
  }, [placingId, boardItems, geo, widthOf]);

  /** Trades the pedal in hand for one on the deck, which goes back to the stash. */
  const handleSwap = (targetId: string) => {
    const spot = makeRoom?.swaps.get(targetId);
    if (!placingId || !spot) return;
    landPedal(placingId, spot, targetId);
    toast.success(
      t("board.swapped", {
        incoming: nameOf(placingId),
        outgoing: nameOf(targetId),
      }),
    );
  };

  /** Pushes the board together, same signal order, with the newcomer at the end. */
  const handleSqueeze = () => {
    const layout = makeRoom?.squeeze;
    if (!placingId || !layout) return;
    const placedById = new Map(layout.placed.map((i) => [i.itemId, i]));
    const source = localItems.some((i) => i.itemId === placingId)
      ? localItems
      : [...localItems, { itemId: placingId, xPct: 0, yPct: 0 }];
    const next = source.map((i) => placedById.get(i.itemId) ?? i);
    // Only the pedal in hand comes up: anything else parked stays parked.
    const parked = overflowIds.filter((id) => id !== placingId);
    setOverflowIds(parked);
    setLocalItems(next);

    const links = repatch(next, parked, powerState.links);
    const landed = placedById.get(placingId);
    const out = landed
      ? pickOutput(
          rail,
          landed,
          widthOf(placingId),
          new Set(links.map((link) => link.out)),
        )
      : null;
    savePower(out === null ? links : [...links, { itemId: placingId, out }]);
    setPlacing(null);
    setNotice(null);
    toast.success(t("board.squeezed", { name: nameOf(placingId) }));
  };

  const handlePlaceNow = () => {
    if (placingId && makeRoom?.spot) landPedal(placingId, makeRoom.spot);
  };

  const cancelMakingRoom = () => setPlacing(null);

  // Escape puts the pedal back down where it came from, like any other pick-up.
  useEffect(() => {
    if (!placingId) return undefined;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlacing(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [placingId]);

  const cardFor = (itemId: string) => {
    const invItem = data.effectInventory.find((e) => e.id === itemId);
    return invItem ? <EffectCard item={invItem} readOnly /> : null;
  };

  /**
   * The card a tap opens on a touch screen, with the pedal's two board actions
   * along the bottom of it.
   *
   * On a desktop those actions live on the pedal itself, appearing under the
   * cursor. A phone has no cursor, and leaving them out permanently turned the
   * deck into a wall of buttons with the pedals hidden somewhere behind it — so
   * the board stays a board, and the actions wait inside the card instead.
   *
   * Each one closes the card as it fires, which is also what keeps this snapshot
   * honest: nothing here outlives the state it was built from.
   */
  const sheetFor = (itemId: string) => {
    const invItem = data.effectInventory.find((e) => e.id === itemId);
    if (!invItem) return null;
    const onBoard = !overflowIds.includes(itemId);
    const powered = hasPower(itemId);
    const close = () => onShowCard?.(null);

    return (
      <EffectCard
        item={invItem}
        isOnPedalboard={onBoard}
        footer={
          <CardActionRow>
            {onBoard && (
              <CardAction
                icon={powered ? Unplug : Plug}
                onClick={() => {
                  if (powered) unplug(itemId);
                  else plugIn(itemId);
                  close();
                }}>
                {powered ? t("board.unplug") : t("board.plug_in")}
              </CardAction>
            )}
            {!onBoard && (
              <CardAction
                icon={ArrowLeftRight}
                onClick={() => {
                  handlePickerSelect(itemId);
                  close();
                }}>
                {t("board.find_room")}
              </CardAction>
            )}
            <CardAction
              icon={X}
              onClick={() => {
                takeOffBoard(itemId);
                close();
              }}>
              {t("board.off_the_board")}
            </CardAction>
          </CardActionRow>
        }
      />
    );
  };

  // Re-written every render, because everything the card's actions do is read
  // off the board as it stands right now.
  useEffect(() => {
    openSheetRef.current = (itemId: string) => onShowCard?.(sheetFor(itemId));
    tapPedalRef.current = (itemId: string) => {
      if (placingId) handleSwap(itemId);
      else if (isTouch) openSheetRef.current(itemId);
    };
  });

  const occupiedIds = localItems.map((i) => i.itemId);
  const overflowItems = localItems.filter((i) =>
    overflowIds.includes(i.itemId),
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

  // The same pedals, priced: what the powered board adds to Rig Level once a
  // second copy of a model counts half and a third nothing. Live for the same
  // reason the verdict is — a duplicate should cost something the moment it
  // lands, not 600ms later — and off the same inputs, so the number this shows
  // is the number the save writes.
  const boardLevel = useMemo(
    () =>
      readBoardLevel(
        localItems,
        data.effectInventory,
        localPower === null ? undefined : hasPower,
      ),
    [localItems, data.effectInventory, localPower, hasPower],
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
        jack: dcJackAt(
          geo,
          item.xPct,
          item.yPct,
          wPct,
          dcOf(link.itemId),
          heightPctFor(geo, widthOf, link.itemId),
        ),
        left: (item.xPct / 100) * geo.viewW,
        right: ((item.xPct + wPct) / 100) * geo.viewW,
        top: (item.yPct / 100) * geo.viewH,
      },
    ];
  });

  /** The pedals with a cable actually in them — the ones that get a plug. */
  const patchedIds = new Set(patched.map((pedal) => pedal.itemId));

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
      toast.success(t("board.by_the_book", { rate: verdict.rate.toFixed(1) }));
    }
  }, [dragging, verdict.tier, verdict.rate, t]);

  // Lets the picker grey out pedals the board has no space for, so a full
  // board is visible before anything is clicked.
  const occupancy = boardItems.map((i) => ({
    xPct: i.xPct,
    yPct: i.yPct,
    wPct: widthOf(i.itemId),
    hPct: heightPctFor(geo, widthOf, i.itemId),
  }));
  const canFit = (itemId: string) =>
    findFreeSpot(
      geo,
      occupancy,
      widthOf(itemId),
      heightPctFor(geo, widthOf, itemId),
    ) !== null;

  // Filling every output the brick still has saves a player eight drags — but
  // only offer it when it would actually do something.
  const canPatch =
    powerState.outputsFree > 0 && powerState.unpoweredIds.length > 0;
  const handlePatch = () =>
    savePower(autoPatch(rail, boardItems, powerState.links, widthOf));
  const canWireUp = verdict.tip !== null && boardItems.length > 1;

  /**
   * Whether the board is being drawn through a window rather than simply laid
   * out in the page: clipped to it, moved under it, scaled inside it.
   *
   * Life size in the page is neither — no transform, no clipping, nothing for a
   * gesture to take hold of — which is what keeps a desktop board exactly the
   * board it has always been. Full screen is always a window, because a case is
   * taller than a phone lying on its side even at life size.
   */
  const movable = fullscreen || view.zoom !== MIN_ZOOM;

  /**
   * The actions that are nobody's fault — tidying and adding. On the page the
   * two fixes ("Wire it up", "Patch power") sit in the readout they fix; full
   * screen has no readouts, so they join these in the floating bar. The Fame
   * shop is in neither — buying a case is not something anybody does
   * mid-wiring, and it stays back on the page.
   */
  const boardActions = (
    <>
      {boardItems.length > 1 && (
        <button
          onClick={handleTidy}
          className={RIG_BUTTON}
          title={t("board.tidy_hint")}>
          <LayoutGrid size={12} strokeWidth={2.5} />
          {t("stash.tidy_up")}
        </button>
      )}
      <button
        onClick={() => setShowPicker(true)}
        className={RIG_BUTTON_PRIMARY}>
        <Plus size={12} strokeWidth={2.5} />
        {t("board.add_pedal")}
      </button>
    </>
  );

  /**
   * The board itself: the window, the case inside it, and the keys that resize
   * it. Written once and rendered in one of two places — in the page, or at the
   * top of the document with the screen to itself. Moving it is a move, not a
   * rebuild: the component never unmounts, so the board comes back from full
   * screen wired exactly as it was left.
   */
  // The outer element is the window the case is seen through. Laid out in the
  // page at life size it is not a window at all — nothing clipped, nothing
  // moved, no transform — so a desktop board is exactly the board it has always
  // been. Full screen it is the screen.
  const stage = (
    <div
      ref={viewportRef}
      className={cn("relative w-full", fullscreen && "h-full")}
      style={{
        overflow: movable ? "hidden" : "visible",
        // Once the board can move, every gesture on the deck belongs to it.
        // Sitting still in the page the page still scrolls through it,
        // because the board is then just one more thing on a long page.
        touchAction: isTouch ? (movable ? "none" : "pan-y") : undefined,
      }}
      onPointerDown={handleViewPointerDown}
      onPointerMove={handleViewPointerMove}
      onPointerUp={handleViewPointerUp}
      onPointerCancel={handleViewPointerUp}>
      <div
        ref={caseRef}
        style={
          movable
            ? {
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
                transformOrigin: "0 0",
              }
            : undefined
        }>
        <PedalboardCase
          geo={geo}
          flawless={verdict.flawless}
          deckRef={boardRef}
          deckCursor={dragging?.active ? "grabbing" : "default"}
          rail={
            <>
              <PowerRail
                rail={rail}
                used={new Set(patched.map((pedal) => pedal.out))}
                pending={
                  patch && !patch.armed ? (patchSocket?.index ?? null) : null
                }
              />
              {/* The brick is the grab handle: a cable is dragged out of it
                  and dropped on the pedal it feeds. */}
              <div
                onPointerDown={handleBrickPointerDown}
                title={t("board.brick_hint", { supply: supply.name })}
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
            </>
          }>
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
            // Only once the press has become a carry: a tap that opens a card
            // should not make the pedal jump off the deck and back again.
            const isDragging =
              dragging?.active === true && dragging.itemId === placement.itemId;
            const showCollision = isDragging && isColliding;
            const wPct = widthOf(placement.itemId);
            const powered = hasPower(placement.itemId);
            // Every copy of a pedal that stands here more than once wears a
            // mark — the count on the one that keeps its levels, the share on
            // the ones that lose them — so the player can see which copy to
            // swap out without opening a card. See `DuplicateMark`.
            const copy = boardLevel.copies.get(placement.itemId);
            const dupModel = copy && copy.total > 1 ? copy.model : null;
            const dupActive = dupModel !== null && hoverDuplicate === dupModel;
            const dupGlow = duplicateGlow(copy, dupActive);
            // The pedal the loose end of a cable is currently over. Amber when
            // the brick can carry it, red when the drop would be refused — so
            // the answer arrives before the cable is let go, not after.
            const aimedAt = patchTarget?.itemId === placement.itemId;
            // While a pedal is in hand with nowhere to go, the deck answers
            // "which of these could I trade it for?" at a glance: those light
            // up, the rest go dark.
            const huntingRoom = makeRoom !== null && makeRoom.spot === null;
            const swappable =
              huntingRoom && makeRoom.swaps.has(placement.itemId);

            return (
              <div
                key={placement.itemId}
                onPointerDown={(e) => handlePedalPointerDown(e, placement)}
                onMouseEnter={() => setHoverDuplicate(dupModel)}
                onMouseMove={(e) => {
                  if (!dragging && invItem)
                    onHover?.(e, <EffectCard item={invItem} readOnly />);
                }}
                onMouseLeave={() => {
                  setHoverDuplicate(null);
                  onHover?.(null, null);
                }}
                className='group absolute'
                style={{
                  left: `${placement.xPct}%`,
                  top: `${placement.yPct}%`,
                  width: `${wPct}%`,
                  height: `${heightPctFor(geo, widthOf, placement.itemId)}%`,
                  zIndex: isDragging ? 50 : 2,
                  cursor: isDragging
                    ? "grabbing"
                    : swappable
                      ? "pointer"
                      : "grab",
                  // The pointer drives the drag, so the browser must not take
                  // the gesture for a scroll — or for a long-press on artwork,
                  // which is what a phone would otherwise offer to save.
                  touchAction: "none",
                  WebkitTouchCallout: "none",
                  filter: showCollision
                    ? `drop-shadow(0 14px 28px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(220,38,38,0.9))`
                    : isDragging
                      ? `drop-shadow(0 18px 32px rgba(0,0,0,0.98)) drop-shadow(0 0 14px ${rs.baseColor}70)`
                      : swappable
                        ? "drop-shadow(0 0 12px rgba(245,158,11,0.8))"
                        : huntingRoom
                          ? "grayscale(0.7) brightness(0.45)"
                          : aimedAt
                            ? `drop-shadow(0 0 14px ${
                                patchAllowed
                                  ? "rgba(245,158,11,0.85)"
                                  : "rgba(248,113,113,0.85)"
                              })`
                            : // An unpowered pedal is off. Not dimmed to say "you
                              // cannot have this" — dimmed because there is no
                              // current in it. A powered one may still be lit as
                              // one of several copies of the same pedal.
                              powered
                              ? (dupGlow ?? "none")
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
                {copy && (
                  <DuplicateMark
                    copy={copy}
                    name={effect.name}
                    active={dupActive}
                  />
                )}
                {/* The plug in its inlet, over the artwork rather than under
                    it, so it can sit down in a socket drawn on the top face. */}
                {patchedIds.has(placement.itemId) && (
                  <PedalDcPlug
                    dc={dcOf(placement.itemId)}
                    widthUnits={(wPct / 100) * geo.viewW}
                    heightUnits={
                      (heightPctFor(geo, widthOf, placement.itemId) / 100) *
                      geo.viewH
                    }
                  />
                )}
                {/* The two controls a pedal carries live under the cursor and
                    nowhere else. A touch screen has no cursor to hide them
                    under, and leaving them out permanently buries the board
                    under its own buttons — so there they move into the card a
                    tap opens. See `sheetFor`. */}
                {swappable && !isDragging && (
                  <span className='pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-black/85 px-2.5 py-1 text-xs font-semibold text-amber-300'>
                    <ArrowLeftRight size={12} strokeWidth={2.5} />
                    {t("board.swap")}
                  </span>
                )}
                {!isTouch && !huntingRoom && (
                  <>
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
                        aria-label={t("board.unplug_name", {
                          name: effect.name,
                        })}
                        title={t("board.unplug_name", { name: effect.name })}
                        className='absolute z-10 flex h-[30px] w-[30px] -translate-x-1/2 items-center justify-center rounded-full bg-black/85 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-amber-300'
                        style={{
                          left: `${dcOf(placement.itemId).x * 100}%`,
                          // Straddling the edge rather than floating clear of
                          // it: a narrow board leaves only a few pixels of
                          // margin above the top row, and the deck clips
                          // whatever spills out.
                          top: -11,
                        }}>
                        <Unplug size={15} strokeWidth={2.5} />
                      </button>
                    )}
                    {/* Take it off the board */}
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleRemove(placement.itemId, e)}
                      aria-label={t("board.take_off_name", {
                        name: effect.name,
                      })}
                      className='absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded border border-zinc-500 bg-black/90 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:border-zinc-300 hover:text-white'>
                      <X size={8} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </PedalboardCase>
      </div>

      {/* The zoom keys, floating over the case rather than riding in the
            heading: they belong to the board they resize, and a thumb finds
            them without leaving it. Pinching does the same thing — this is for
            everybody who has no reason to guess that. */}
      {isTouch && (
        <div
          className='absolute bottom-3 right-3 z-40 flex flex-col gap-1.5'
          onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => stepZoom(ZOOM_STEP)}
            disabled={view.zoom >= MAX_ZOOM}
            aria-label={t("board.zoom_in")}
            className={ZOOM_KEY}>
            <ZoomIn size={17} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => stepZoom(-ZOOM_STEP)}
            disabled={view.zoom <= zoomFloor}
            aria-label={t("board.zoom_out")}
            className={ZOOM_KEY}>
            <ZoomOut size={17} strokeWidth={2.5} />
          </button>
          {view.zoom !== MIN_ZOOM && (
            <button
              onClick={() => setView(AT_REST)}
              aria-label={t("board.fit_board")}
              className={ZOOM_KEY}>
              <Minimize2 size={16} strokeWidth={2.5} />
            </button>
          )}
          {/* Zooming into a phone-sized column only goes so far. This is the
                other half of the answer: the whole screen, and a board that is
                worth turning the phone sideways for. */}
          {!fullscreen && (
            <button
              onClick={openFullscreen}
              aria-label={t("board.open_fullscreen")}
              className={ZOOM_KEY}>
              <Expand size={17} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  /** The pedal in hand and the ways of making room for it — over the case,
   *  where the pedals it could be traded for are lighting up. */
  const placingItem = placingId
    ? data.effectInventory.find((e) => e.id === placingId)
    : undefined;
  const placingEffect = placingItem
    ? EFFECTS_BY_ID.get(placingItem.effectId)
    : null;
  const makeRoomBar = (floating: boolean) =>
    placingId && placingEffect && makeRoom ? (
      <MakeRoomBar
        name={placingEffect.name}
        imageSrc={getEffectImageSrc(placingEffect.imageId, "small")}
        ready={makeRoom.spot !== null}
        swapCount={makeRoom.swaps.size}
        canSqueeze={makeRoom.squeeze !== null}
        onPlace={handlePlaceNow}
        onSqueeze={handleSqueeze}
        onCancel={cancelMakingRoom}
        floating={floating}
      />
    ) : null;

  /** The same board with the screen to itself, and the controls that belong to
   *  a board nobody can see the page behind. */
  const fullscreenStage = (
    <div className='fixed inset-0 z-[9998] flex flex-col bg-zinc-950'>
      {/* One slim bar, floating over the deck rather than taking a strip of a
          screen that has none to spare — a phone on its side is 350 pixels
          tall, and the case wants every one of them. */}
      <div className='pointer-events-none absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-2'>
        <div className='pointer-events-auto flex flex-wrap items-center gap-2'>
          {canWireUp && (
            <button
              onClick={handleWireUp}
              className={cn(RIG_BUTTON, RIG_BUTTON_FIX)}
              title={t("signal.wire_it_up_hint")}>
              <Zap size={12} strokeWidth={2.5} />
              {t("signal.wire_it_up")}
            </button>
          )}
          {canPatch && (
            <button
              onClick={handlePatch}
              className={cn(RIG_BUTTON, RIG_BUTTON_FIX)}
              title={t("power.patch_hint")}>
              <Plug size={12} strokeWidth={2.5} />
              {t("power.patch")}
            </button>
          )}
          {boardActions}
        </div>
        <button
          onClick={closeFullscreen}
          aria-label={t("board.leave_fullscreen")}
          className={cn(ZOOM_KEY, "pointer-events-auto shrink-0")}>
          <Shrink size={17} strokeWidth={2.5} />
        </button>
      </div>

      <div className='flex min-h-0 flex-1 items-center'>{stage}</div>

      {placingId ? (
        <div className='absolute inset-x-2 bottom-2 z-50'>
          {makeRoomBar(true)}
        </div>
      ) : (
        notice && (
          <p className='pointer-events-none absolute inset-x-0 bottom-3 z-50 flex items-center justify-center gap-1.5 px-16 text-center text-[11px] font-semibold text-orange-400'>
            <AlertTriangle size={13} strokeWidth={2.5} className='shrink-0' />
            {notice}
          </p>
        )
      )}
    </div>
  );

  return (
    <>
      {/* The board's own heading carries only what buys it more room. Tidying
          and adding sit on the case itself, and the fixes in the readouts they
          answer. */}
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
        <p className='font-display text-2xl font-black text-arsenal-text-primary'>
          {t("board.title")}
        </p>
        <div className='flex flex-wrap items-center gap-2'>
          <RigHardwarePanel rig={data.rig} fame={fame} />
        </div>
      </div>

      {notice && (
        <p className='flex items-center gap-1.5 text-[11px] font-semibold text-orange-400'>
          <AlertTriangle size={13} strokeWidth={2.5} className='shrink-0' />
          {notice}
        </p>
      )}

      {/* A phone has no cursor to hint with, so the board says out loud what a
          finger can do to it — but only while there is something to do it to. */}
      {isTouch && boardItems.length > 0 && (
        <p className='text-[11px] leading-relaxed text-zinc-500'>
          {t("board.touch_help")}
        </p>
      )}

      {/* What the wiring is worth and whether the brick has a hole left, then
          the chain itself as a line of names. */}
      {boardItems.length > 0 && (
        <>
          <BoardStatusStrip
            verdict={verdict}
            supply={supply}
            power={powerState}
            unpowered={unpoweredNames}
            onWireUp={canWireUp ? handleWireUp : null}
            onPatch={canPatch ? handlePatch : null}
          />
          <DuplicateStrip
            board={boardLevel}
            activeModel={hoverDuplicate}
            onHoverModel={setHoverDuplicate}
          />
          <SignalOrderStrip verdict={verdict} board={boardLevel} />
        </>
      )}

      {/* Right on top of the case they act on. Full screen, these same
          buttons float over the board instead. */}
      {!fullscreen && (
        <div className='flex flex-wrap items-center justify-end gap-2'>
          {boardActions}
        </div>
      )}

      {!fullscreen && makeRoomBar(false)}

      {fullscreen && typeof document !== "undefined"
        ? createPortal(fullscreenStage, document.body)
        : stage}

      {/* Parked pedals: still equipped, but the board ran out of room for them. */}
      {overflowItems.length > 0 && (
        <div className='mt-4 flex flex-col gap-3 rounded bg-zinc-900/40 p-4'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-amber-500/90'>
              {t("board.off_the_board")}
            </p>
            <p className='text-xs text-zinc-400'>
              {t("board.overflow_hint", { count: overflowItems.length })}
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
                    // Same card as a pedal on the deck, so a parked one can be
                    // sent away by a thumb too.
                    if (isTouch) openSheetRef.current(placement.itemId);
                  }}>
                  <img
                    src={getEffectImageSrc(effect.imageId, "small")}
                    alt={effect.name}
                    className={cn(
                      "h-14 w-auto object-contain transition-opacity group-hover:opacity-100",
                      placingId === placement.itemId
                        ? "opacity-100"
                        : "opacity-60",
                    )}
                    draggable={false}
                  />
                  {/* Brings it back up: straight onto the deck where there is
                      a gap, into the make-room hunt where there is not. */}
                  {!isTouch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickerSelect(placement.itemId);
                      }}
                      className={cn(RIG_BUTTON, "mt-2")}>
                      <ArrowLeftRight size={12} strokeWidth={2.5} />
                      {t("board.find_room")}
                    </button>
                  )}
                  {/* Invisible until hovered, so on a touch screen it is left
                      out altogether rather than left lying there as a corner
                      that quietly removes a pedal. */}
                  {!isTouch && (
                    <button
                      onClick={(e) => handleRemove(placement.itemId, e)}
                      aria-label={t("board.remove_name", { name: effect.name })}
                      className='absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded bg-black/90 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white'>
                      <X size={8} />
                    </button>
                  )}
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
