import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { RoadPathNodeProps, RoadTone } from "./RoadPathNode";
import { RoadPathNode } from "./RoadPathNode";

/** How far the road swings to each side, in px. */
export const ROAD_WAVE = 56;

/** Sideways position of the stop at `index` on the road. */
export const roadWaveX = (index: number) =>
  Math.round(ROAD_WAVE * Math.sin((index * Math.PI) / 2));

export interface RoadPathStop extends Omit<
  RoadPathNodeProps,
  "buttonRef" | "size" | "halo"
> {
  id: string;
  /** Next to the stop, on the side the road swings away from. */
  label: ReactNode;
  /** Across the road just above this stop — a stage title. */
  before?: ReactNode;
  /** Across the road right under this stop — an open bubble. The line runs behind it. */
  after?: ReactNode;
}

/** The line into a stop takes the colour of where it leads. */
const lineOf = (tone: RoadTone): { stroke: string; dashed: boolean } => {
  switch (tone) {
    case "done":
      return { stroke: "rgb(16,185,129)", dashed: false };
    case "current":
      return { stroke: "rgb(6,182,212)", dashed: false };
    case "locked":
      return { stroke: "rgb(63,63,70)", dashed: true };
    default:
      return { stroke: "rgba(6,182,212,0.35)", dashed: false };
  }
};

type Points = Record<string, { x: number; y: number }>;

const samePoints = (a: Points, b: Points) => {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) => b[key] && a[key].x === b[key].x && a[key].y === b[key].y,
    )
  );
};

/**
 * A winding road of stops joined by one curved line, Duolingo-style. Used by
 * Journey (a module's steps) and What Next (what to play next).
 *
 * The line is drawn from where the stops actually landed, measured after
 * layout, so anything that changes the height between two stops — a stage
 * title, an opened bubble — bends it with them.
 */
export const RoadPath = ({
  stops,
  footer,
  className,
}: {
  stops: RoadPathStop[];
  /** Under the last stop, on the road — Journey's finish card. */
  footer?: ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const [points, setPoints] = useState<Points>({});
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const box = container.getBoundingClientRect();
    const next: Points = {};
    nodeRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      next[id] = {
        x: Math.round(r.left + r.width / 2 - box.left),
        y: Math.round(r.top + r.height / 2 - box.top),
      };
    });
    // Measured after every render, so only a real move may set state.
    setPoints((prev) => (samePoints(prev, next) ? prev : next));
    setCanvas((prev) =>
      prev.width === container.offsetWidth &&
      prev.height === container.offsetHeight
        ? prev
        : { width: container.offsetWidth, height: container.offsetHeight },
    );
  }, []);

  // A bubble opening on another stop moves everything below it without
  // resizing anything the observer would notice, hence every render too.
  useLayoutEffect(() => {
    measure();
  });

  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const segments = stops.slice(1).flatMap((stop, i) => {
    const p0 = points[stops[i].id];
    const p1 = points[stop.id];
    if (!p0 || !p1) return [];
    const dy = (p1.y - p0.y) / 2;
    return [
      {
        d: `M ${p0.x} ${p0.y} C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`,
        ...lineOf(stop.tone),
      },
    ];
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex w-full max-w-[480px] flex-col items-center gap-14",
        className,
      )}>
      <svg
        aria-hidden
        className='pointer-events-none absolute left-0 top-0 z-0'
        width={canvas.width}
        height={canvas.height}>
        {segments.map((segment, i) => (
          <path
            key={i}
            d={segment.d}
            fill='none'
            stroke={segment.stroke}
            strokeWidth={4}
            strokeLinecap='round'
            strokeDasharray={segment.dashed ? "2 10" : undefined}
          />
        ))}
      </svg>

      {stops.map(({ id, label, before, after, ...node }, index) => {
        const x = roadWaveX(index);
        const side =
          x > 0 ? "left" : x < 0 ? "right" : index % 4 === 0 ? "right" : "left";
        return (
          <Fragment key={id}>
            {before && <div className='relative z-10'>{before}</div>}
            <div
              className='relative z-10 flex justify-center'
              style={{ transform: `translateX(${x}px)` }}>
              <RoadPathNode
                {...node}
                buttonRef={(el) => {
                  if (el) nodeRefs.current.set(id, el);
                  else nodeRefs.current.delete(id);
                }}
              />
              <div
                className={cn(
                  "absolute top-1/2 flex w-28 -translate-y-1/2 flex-col",
                  side === "left"
                    ? "right-full mr-3 items-end text-right"
                    : "left-full ml-3 items-start text-left",
                )}>
                {label}
              </div>
            </div>
            {after && <div className='relative z-10 -mt-8 w-full'>{after}</div>}
          </Fragment>
        );
      })}

      {footer}
    </div>
  );
};
