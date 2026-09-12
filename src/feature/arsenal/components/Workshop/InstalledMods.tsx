import { cn } from "assets/lib/utils";
import type { FittedMod, ModSlots } from "feature/arsenal/data/workshop";
import type { WorkshopKind } from "feature/arsenal/types/arsenal.types";
import type {
  ModSocketLayout,
  SocketSide,
} from "feature/arsenal/utils/modAnchors";
import { layoutModSockets } from "feature/arsenal/utils/modAnchors";
import { Lock, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useMemo, useState } from "react";

import { MOD_TILE_COLOR } from "../Collection/BoardPieceTile";
import { ModArt } from "./ModArt";
import type { ModSlotTarget } from "./ModSlotDialog";

interface InstalledModsProps {
  kind: WorkshopKind;
  name: string;
  heroImageSrc: string;
  /** Guitar art ships horizontal — stand it up on the bench. */
  rotate: boolean;
  fitted: FittedMod[];
  slots: ModSlots;
  /** Slots the next promotion would unlock, drawn as ghosts past the cap. */
  locked: number;
  /** A socket opens its own slot: a fitted one to manage, a free one to fill. */
  onOpenSlot: (slot: ModSlotTarget) => void;
}

/** One connector, in px inside the stage. */
interface Wire {
  side: SocketSide;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

/** What each column holds, in top-to-bottom order. */
interface Column {
  fitted: (ModSocketLayout & { mod: FittedMod })[];
  free: number;
  locked: number;
}

/** Sockets never shrink: a crowded column makes the stage taller instead. */
const SOCKET_PX = 64;
const SOCKET_CLASS = "h-16 w-16";
const SOCKET_GAP_PX = 10;
/** The stage is never shorter than this, so a two-slot Common still gets a big render. */
const MIN_STAGE_PX = 544;
/** Clearance between the part's edge and the column beside it. */
const COLUMN_CLEARANCE_PX = 28;
/** Half of a stood-up guitar's visible width as a fraction of its (square) box. */
const GUITAR_HALF_WIDTH = 0.215;

/**
 * The instrument on the bench with its mod sockets down both sides.
 *
 * Sockets are the slots as slots: one square per slot the build has, the fitted
 * ones showing the part that is in them, the free ones an open "+", and the
 * ones a promotion would still unlock as ghosts. Each fitted socket is wired to
 * the spot on the render where that part lives — pickups over the body, tuners
 * up the neck — so the two columns read as a parts diagram, not a list.
 *
 * Which side a mod hangs on is decided by `layoutModSockets`: sorted by where
 * it lands and dealt alternately, so every wire on a side runs top to bottom in
 * the same order as its neighbours and none of them cross. Open and locked
 * slots fill in under the fitted ones, split between the two columns.
 *
 * The wires are measured off the DOM rather than laid out by hand: the stage
 * is fluid, the sockets are not, and the picture's box sits wherever the
 * height puts it. A ref callback with a ResizeObserver keeps the measurement
 * out of render and out of an effect, and re-runs it when the stage reflows.
 */
export const InstalledMods = ({
  kind,
  name,
  heroImageSrc,
  rotate,
  fitted,
  slots,
  locked,
  onOpenSlot,
}: InstalledModsProps) => {
  const [wires, setWires] = useState<Wire[]>([]);
  // The picture's natural size is what tells us where the visible part ends
  // inside its box, and it is only known once the file has loaded — so the
  // load is a dependency of the measurement, not a thing it polls for.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const columns = useMemo<Record<SocketSide, Column>>(() => {
    const byId = new Map(fitted.map((m) => [m.id, m]));
    const placed = layoutModSockets(
      kind,
      fitted.map((m) => m.id),
    ).map((l) => ({ ...l, mod: byId.get(l.modId)! }));
    const left = placed.filter((p) => p.side === "left");
    const right = placed.filter((p) => p.side === "right");
    // Open slots go to whichever column is shorter first, so the two stay level.
    const free = Math.max(0, slots.max - fitted.length);
    const freeLeft =
      left.length <= right.length ? Math.ceil(free / 2) : Math.floor(free / 2);
    const freeRight = free - freeLeft;
    const lockedLeft =
      left.length + freeLeft <= right.length + freeRight
        ? Math.ceil(locked / 2)
        : Math.floor(locked / 2);
    return {
      left: { fitted: left, free: freeLeft, locked: lockedLeft },
      right: { fitted: right, free: freeRight, locked: locked - lockedLeft },
    };
  }, [kind, fitted, slots.max, locked]);

  // The stage grows with the busier column so every socket keeps its size,
  // and the render grows with the stage. The columns sit a fixed clearance
  // off the instrument's own edge rather than at the stage's edges, so
  // the wires stay short whatever the bench's width.
  const busiest = Math.max(
    columns.left.fitted.length + columns.left.free + columns.left.locked,
    columns.right.fitted.length + columns.right.free + columns.right.locked,
  );
  const stageHeight = Math.max(
    MIN_STAGE_PX,
    busiest * (SOCKET_PX + SOCKET_GAP_PX) - SOCKET_GAP_PX + 32,
  );
  // A stood-up guitar is narrow, so its columns are pulled in towards it. A
  // pedal is as wide as the space allows, so its columns stay at the stage's
  // edges and the picture is boxed in between them instead.
  const reach =
    stageHeight * GUITAR_HALF_WIDTH + COLUMN_CLEARANCE_PX + SOCKET_PX;
  const columnOffset = rotate
    ? `max(0px, calc(50% - ${Math.round(reach)}px))`
    : "0px";

  const stageRef = useCallback(
    (stage: HTMLDivElement | null) => {
      if (!stage || typeof ResizeObserver === "undefined") return undefined;

      const measure = () => {
        const art = stage.querySelector<HTMLImageElement>("[data-hero-art]");
        if (!art) return;
        // Until the file is in, the natural size is zero and every wire would
        // be aimed at the element's box instead of the picture — so no wires.
        if (loadedSrc !== heroImageSrc && art.naturalWidth === 0) {
          setWires([]);
          return;
        }
        const box = stage.getBoundingClientRect();
        const artBox = art.getBoundingClientRect();
        // The element's box and the picture in it are not the same thing:
        // object-contain letterboxes the file inside the element, and a
        // guitar is then turned on its side. Work out the rectangle the eye
        // actually sees and anchor everything to that. (A rotated element's
        // bounding box is only trustworthy because the element is square.)
        const nw = art.naturalWidth;
        const nh = art.naturalHeight;
        let visible = {
          left: artBox.left,
          top: artBox.top,
          width: artBox.width,
          height: artBox.height,
        };
        if (nw > 0 && nh > 0) {
          const scale = Math.min(artBox.width / nw, artBox.height / nh);
          let w = nw * scale;
          let h = nh * scale;
          if (rotate) [w, h] = [h, w];
          visible = {
            left: artBox.left + (artBox.width - w) / 2,
            top: artBox.top + (artBox.height - h) / 2,
            width: w,
            height: h,
          };
        }
        const next: Wire[] = [];
        for (const side of ["left", "right"] as const) {
          for (const item of columns[side].fitted) {
            const socket = stage.querySelector<HTMLElement>(
              `[data-mod-socket="${item.modId}"]`,
            );
            if (!socket) continue;
            const s = socket.getBoundingClientRect();
            // Below the wide layout the sockets sit under the picture; a wire
            // from there would cross the instrument, so the diagram waits for
            // the columns to be beside the art.
            const beside =
              side === "left"
                ? s.right <= visible.left + 4
                : s.left >= visible.left + visible.width - 4;
            if (!beside) continue;
            next.push({
              side,
              from: {
                x: (side === "left" ? s.right : s.left) - box.left,
                y: s.top - box.top + s.height / 2,
              },
              to: {
                x: visible.left - box.left + visible.width * item.anchor.x,
                y: visible.top - box.top + visible.height * item.anchor.y,
              },
            });
          }
        }
        setWires(next);
      };

      const observer = new ResizeObserver(() => measure());
      observer.observe(stage);
      measure();
      return () => observer.disconnect();
    },
    [columns, rotate, loadedSrc, heroImageSrc],
  );

  const renderColumn = (side: SocketSide) => {
    const column = columns[side];
    const size = SOCKET_CLASS;
    return (
      <div
        className={cn(
          "relative z-30 flex flex-row flex-wrap items-center justify-center gap-2.5 md:absolute md:top-1/2 md:w-16 md:-translate-y-1/2 md:flex-col md:flex-nowrap",
          side === "left" ? "md:items-start" : "md:items-end",
        )}
        style={
          side === "left" ? { left: columnOffset } : { right: columnOffset }
        }>
        {column.fitted.map(({ mod }) => (
          <button
            key={mod.id}
            type='button'
            data-mod-socket={mod.id}
            onClick={() =>
              onOpenSlot({ kind: "fitted", index: fitted.indexOf(mod), mod })
            }
            title={`${mod.label} · +${mod.points}`}
            aria-label={`${mod.label}, installed`}
            className={cn(
              size,
              "relative overflow-hidden rounded-lg bg-zinc-950/80 transition-transform focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-300/60 hover:-translate-y-0.5",
            )}
            style={{
              boxShadow: `inset 0 0 0 1px ${MOD_TILE_COLOR}66, 0 0 16px -4px ${MOD_TILE_COLOR}80`,
            }}>
            <ModArt modId={mod.id} />
            <span
              className='absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full'
              style={{
                backgroundColor: MOD_TILE_COLOR,
                boxShadow: `0 0 6px ${MOD_TILE_COLOR}`,
              }}
            />
          </button>
        ))}

        {Array.from({ length: column.free }).map((_, i) => (
          <button
            key={`free-${i}`}
            type='button'
            // Free slots are numbered after the fitted ones, left column first.
            onClick={() =>
              onOpenSlot({
                kind: "free",
                index:
                  fitted.length + (side === "left" ? 0 : columns.left.free) + i,
              })
            }
            title='Empty slot · Install mod'
            aria-label='Empty slot, install mod'
            className={cn(
              size,
              "flex items-center justify-center rounded-lg bg-zinc-100/[0.04] text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-100/[0.08] hover:text-zinc-300",
            )}
            style={{ boxShadow: "inset 0 0 0 1px rgba(244,244,245,0.08)" }}>
            <Plus size={18} />
          </button>
        ))}

        {Array.from({ length: column.locked }).map((_, i) => (
          <span
            key={`locked-${i}`}
            title='Unlocks with the next promotion'
            className={cn(
              size,
              "flex items-center justify-center rounded-lg bg-zinc-100/[0.02] text-zinc-700",
            )}
            style={{ boxShadow: "inset 0 0 0 1px rgba(244,244,245,0.04)" }}>
            <Lock size={14} />
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={stageRef}
      className='relative flex flex-col items-center gap-4 md:block md:h-[var(--stage-h)]'
      style={{ "--stage-h": `${stageHeight}px` } as CSSProperties}>
      {/* The instrument, stood up in the light, between the two columns.
          Same trick as the Dex wall: the art is a square sized by the box's
          height, so a rotated guitar gets the full height and its square is
          allowed past the sides. */}
      <div
        className={cn(
          "relative flex h-64 items-center justify-center sm:h-80 md:absolute md:inset-y-0 md:h-auto",
          rotate ? "md:inset-x-0" : "md:inset-x-[5.5rem]",
        )}>
        <div className='pointer-events-none absolute bottom-[3%] left-1/2 h-[5%] w-[40%] -translate-x-1/2 rounded-[100%] bg-black/85 blur-[6px]' />
        <img
          data-hero-art
          src={heroImageSrc}
          alt={name}
          onLoad={() => setLoadedSrc(heroImageSrc)}
          className={cn(
            "relative z-10 shrink-0 object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.55)]",
            rotate
              ? "aspect-square h-full max-w-none -rotate-90"
              : "h-full max-h-full w-full max-w-full",
          )}
          draggable={false}
        />
      </div>

      {/* Wires, drawn over the stage but under the sockets: a short run out of
          the socket, then straight to the part's edge, with a pin at the end. */}
      {wires.length > 0 && (
        <svg
          className='pointer-events-none absolute inset-0 z-20 hidden h-full w-full md:block'
          aria-hidden>
          {wires.map((w, i) => {
            const elbowX = w.side === "left" ? w.from.x + 12 : w.from.x - 12;
            return (
              <g key={i} stroke={MOD_TILE_COLOR} fill='none'>
                <path
                  d={`M ${w.from.x} ${w.from.y} L ${elbowX} ${w.from.y} L ${w.to.x} ${w.to.y}`}
                  strokeWidth={1}
                  strokeOpacity={0.45}
                />
                <circle
                  cx={w.to.x}
                  cy={w.to.y}
                  r={3}
                  fill={MOD_TILE_COLOR}
                  fillOpacity={0.9}
                  strokeOpacity={0}
                />
              </g>
            );
          })}
        </svg>
      )}

      {renderColumn("left")}
      {renderColumn("right")}
    </div>
  );
};
