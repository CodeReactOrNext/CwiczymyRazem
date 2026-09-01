import { useId } from "react";

import type { Point } from "../../utils/cableGeometry";
import type { DcTarget, RailGeometry, RowSpan } from "../../utils/powerLayout";
import {
  DC_BRICK_PLUG_REACH,
  DC_COLLAR_H,
  DC_JACKET_W,
  DC_PLUG_HALF_W,
  DC_PLUG_REACH,
  dragRun,
  powerRun,
  RAIL_H,
  risersFor,
  SOCKET_R,
  socketStub,
} from "../../utils/powerLayout";

/**
 * The power loom, drawn: a brick on its rail above the deck, and a DC cable from
 * it to every pedal that has one.
 *
 * It comes in two pieces because it crosses a seam. `PowerRail` is the strip of
 * case above the board — the brick, its outputs, and the stub of cable hanging
 * out of each one; `PowerLoom` is everything below the deck's top edge. They
 * share an x axis and meet edge to edge, so a cable drawn half in each reads as
 * one cable. The split is what lets the brick be a real object standing on the
 * case while its cables still slide under the pedals, which nothing drawn in a
 * single layer could do: the deck clips its own children, and it has to.
 *
 * The loom is deliberately not the signal path. That one is fat, lit and
 * coloured by a verdict, because the player is being told something about it;
 * this one is thin, black and quiet, because it is plumbing — right up until a
 * pedal has no cable, and then the absence is the whole message. So the only
 * colour here is amber, and mostly on the brick: the LED beside a used output,
 * and the thread of current down the middle of the cable leaving it.
 *
 * Inside the deck it draws *under* the signal path and under the pedals
 * (`z-index: 0` against their 1 and 2), which is the order they stack in on a
 * real board — power runs beneath everything, disappears under the enclosures
 * and shows in the gaps between them. Most of a tidy loom is hidden, and that is
 * correct.
 */

/** Jacket, and the amber thread of current down the middle of it. */
const DC_JACKET = "#0a0a0c";
const DC_CORE = "#b45309";
const DC_CORE_LIVE = "#f59e0b";

/** The brick's own body, and the copper its outputs are ringed in. */
const BRICK_FACE = "#17181c";
const BRICK_EDGE = "#0a0a0c";
const COPPER = "#b45309";

interface DcPlugProps {
  at: Point;
  /**
   * Which way the body stands off the socket: `-1` above it, for a plug pushed
   * down into a pedal's inlet, `1` below it, for one pushed up into the brick.
   */
  dir?: -1 | 1;
  reach?: number;
}

/**
 * A right-angle DC plug, drawn tip-first at the hole it is pushed into.
 *
 * The moulded body stands off the jack rather than beside it, because a DC cable
 * comes into a pedal from above on both rows of this board — off the top margin
 * for one and out of the channel for the other — and hangs out of the brick's
 * underside at the other end of the same run. Barrel and collar are drawn,
 * sleeve is not: the sleeve is inside the socket, and a stub of it left showing
 * reads as a plug half pulled out.
 *
 * Both ends of a cable get one, because a cable that is moulded into a pedal at
 * one end and welded to the brick at the other is not a cable a player believes
 * they can pull. The plug is the affordance — the unplug button sits right on
 * top of the pedal's, and this is what it looks like it is for.
 */
const DcPlug = ({
  at: point,
  dir = -1,
  reach = DC_PLUG_REACH,
}: DcPlugProps) => {
  const back = point.y + dir * reach;
  const half = DC_PLUG_HALF_W;
  /** The body, top-down, whichever way it is facing. */
  const top = Math.min(point.y, back);
  /** …and the two bands on it: the collar at the socket, the boot at the cable. */
  const collarY = dir < 0 ? point.y - DC_COLLAR_H : point.y;
  const bootY = dir < 0 ? top : back - DC_COLLAR_H * 0.7;

  return (
    <g>
      {/* The shadow it drops on whatever it is standing on. */}
      <ellipse
        cx={point.x + 0.25}
        cy={(point.y + back) / 2 + 0.2}
        rx={half + 0.42}
        ry={reach / 2 + 0.3}
        fill='#000000'
        opacity={0.4}
      />
      {/* The moulded body, lit down one side so it reads as round. */}
      <rect
        x={point.x - half}
        y={top}
        width={half * 2}
        height={reach}
        rx={0.32}
        fill='#1c1d22'
      />
      <rect
        x={point.x - half}
        y={top}
        width={half * 0.75}
        height={reach}
        rx={0.32}
        fill='#ffffff'
        opacity={0.08}
      />
      {/* The strain-relief boot the cable leaves through. */}
      <rect
        x={point.x - half - 0.06}
        y={bootY}
        width={half * 2 + 0.12}
        height={DC_COLLAR_H * 0.7}
        rx={0.16}
        fill='#000000'
        opacity={0.5}
      />
      {/* …and the collar seated against the socket. */}
      <rect
        x={point.x - half - 0.12}
        y={collarY}
        width={half * 2 + 0.24}
        height={DC_COLLAR_H}
        rx={0.15}
        fill={COPPER}
        opacity={0.75}
      />
    </g>
  );
};

interface PowerRailProps {
  /**
   * The brick this rig owns, standing on the case it owns: its body, its
   * outputs, and the tier they came off. Everything drawn below is measured
   * from it, so a bought upgrade is a different piece of hardware on the rail
   * rather than the same one with a bigger number printed on it.
   */
  rail: RailGeometry;
  /** Which outputs have a cable in them — the ones whose LED is lit. */
  used: Set<number>;
  /** The output a cable is currently being dragged out of, if any. */
  pending?: number | null;
  /** A visitor's board: no LEDs, and nothing to plug in. */
  live?: boolean;
}

/**
 * The supply on its rail, above the deck.
 *
 * Built the way the real part is, because at this size that is the only thing
 * separating a piece of hardware from a grey bar. It is an extruded aluminium
 * body with a cast end cap bolted on at each end; the face is brushed, so it is
 * lit in bands rather than in one smooth ramp; and the outputs sit in a bay
 * milled along the underside, dark and overhung, rather than printed on the
 * front. Each one has its own pilot LED on the face above it, which is where a
 * brick puts them and which lets the socket keep its copper whether anything is
 * plugged into it or not.
 *
 * Everything is laid out between the two end caps rather than against the
 * brick's own edges, so the proportions can change without the silkscreen
 * sliding out from under them.
 *
 * The name and the rating are silkscreened here rather than left to the panel
 * above the board, because that is where they are on the real thing — and
 * because a player looking at a full brick is already looking here.
 */
export const PowerRail = ({
  rail,
  used,
  pending = null,
  live = true,
}: PowerRailProps) => {
  const uid = useId();
  const face = `${uid}-face`;
  const cap = `${uid}-cap`;
  const bay = `${uid}-bay`;

  const { brick, supply } = rail;
  /** What is silkscreened on it: whose it is, and how many pedals it feeds. */
  const name = supply.name;
  const legend = `9V ⎓ ${supply.outputs} out`;

  const lit = (index: number) => live && used.has(index);
  const stubs = rail.sockets.filter(
    (socket) => used.has(socket.index) || socket.index === pending,
  );

  /** The cast end blocks, and the stretch of extrusion left between them. */
  const CAP_W = 3.4;
  const inner = { x: brick.x + CAP_W, w: brick.w - CAP_W * 2 };
  /** The bay the outputs are recessed into, milled along the underside. */
  const bayTop = brick.y + 2.86;
  const bayBottom = brick.y + brick.h - 0.22;
  /** The row of pilot LEDs, on the face just above it. */
  const ledY = brick.y + 2.3;

  /**
   * The name, split where a brand splits: the make in ink, the model number in
   * the same copper as the outputs. A trailing number is how these things are
   * named — it is the count of holes — so it is set apart rather than trailing
   * off the end of the word.
   */
  const named = /^(.*?)(?:\s+(\d+))?$/.exec(name);
  const brand = named?.[1] || name;
  const model = named?.[2] ?? "";

  return (
    <svg
      viewBox={`0 0 ${rail.geo.viewW} ${RAIL_H}`}
      preserveAspectRatio='none'
      className='pointer-events-none absolute inset-0 h-full w-full'
      aria-hidden>
      <defs>
        {/* Brushed aluminium: lit in bands rather than in one smooth ramp. The
            little reversals are what read as grain instead of as a gradient. */}
        <linearGradient id={face} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#3a3d45' />
          <stop offset='14%' stopColor='#2a2c33' />
          <stop offset='31%' stopColor='#34373e' />
          <stop offset='53%' stopColor={BRICK_FACE} />
          <stop offset='75%' stopColor='#24262c' />
          <stop offset='100%' stopColor='#111216' />
        </linearGradient>
        <linearGradient id={cap} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#31343c' />
          <stop offset='45%' stopColor='#1a1c21' />
          <stop offset='100%' stopColor='#0b0c0f' />
        </linearGradient>
        {/* The bay is a hole, so it is darkest at the top, under the lip. */}
        <linearGradient id={bay} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#000000' />
          <stop offset='45%' stopColor='#0a0b0d' />
          <stop offset='100%' stopColor='#191a1f' />
        </linearGradient>
      </defs>

      {/* The stubs go down first, so each one disappears behind the enclosure
          it leaves rather than being drawn across its face. */}
      <g fill='none' strokeLinecap='round'>
        {stubs.map((socket) => (
          <g key={socket.index}>
            <path
              d={socketStub(socket)}
              stroke='#000000'
              strokeWidth={DC_JACKET_W + 0.7}
              opacity={0.45}
              transform='translate(0.35 0)'
            />
            <path
              d={socketStub(socket)}
              stroke={DC_JACKET}
              strokeWidth={DC_JACKET_W}
            />
            <path
              d={socketStub(socket)}
              stroke={live ? DC_CORE : "#2c2c30"}
              strokeWidth={0.26}
              opacity={live ? 0.7 : 1}
            />
          </g>
        ))}
      </g>

      {/* The mains lead, out of the left cap and away into the case. */}
      <path
        d={`M ${brick.x + 0.4} ${brick.y + brick.h * 0.55} C ${brick.x - 10} ${
          brick.y + brick.h * 0.52
        } ${brick.x - 17} ${RAIL_H - 0.7} ${brick.x - 27} ${RAIL_H - 0.25}`}
        fill='none'
        stroke={DC_JACKET}
        strokeWidth={DC_JACKET_W + 0.25}
        strokeLinecap='round'
      />
      {/* …and the strain-relief boot it leaves through. */}
      <rect
        x={brick.x - 2.4}
        y={brick.y + brick.h * 0.55 - 0.62}
        width={2.8}
        height={1.24}
        rx={0.5}
        fill='#1b1c21'
      />

      {/* The shadow the whole thing sits in. */}
      <rect
        x={brick.x}
        y={brick.y + 0.45}
        width={brick.w}
        height={brick.h}
        rx={0.7}
        fill='#000000'
        opacity={0.55}
      />

      {/* The extrusion, and the chamfer running along its top edge. */}
      <rect
        x={brick.x}
        y={brick.y}
        width={brick.w}
        height={brick.h}
        rx={0.7}
        fill={`url(#${face})`}
        stroke={BRICK_EDGE}
        strokeWidth={0.2}
      />
      <rect
        x={brick.x + 0.5}
        y={brick.y + 0.16}
        width={brick.w - 1}
        height={0.16}
        rx={0.08}
        fill='#ffffff'
        opacity={0.18}
      />

      {/* The bay the outputs are recessed into, and the lip overhanging it. */}
      <rect
        x={inner.x - 0.6}
        y={bayTop}
        width={inner.w + 1.2}
        height={bayBottom - bayTop}
        rx={0.42}
        fill={`url(#${bay})`}
      />
      <rect
        x={inner.x - 0.6}
        y={bayTop}
        width={inner.w + 1.2}
        height={0.22}
        rx={0.11}
        fill='#000000'
        opacity={0.7}
      />

      {/* A cast end cap at each end, bolted through. */}
      {[brick.x, brick.x + brick.w - CAP_W].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y={brick.y}
            width={CAP_W}
            height={brick.h}
            rx={0.7}
            fill={`url(#${cap})`}
          />
          <circle
            cx={x + CAP_W / 2}
            cy={brick.y + brick.h / 2}
            r={0.5}
            fill='#0a0b0e'
            stroke='#565c66'
            strokeWidth={0.16}
          />
          {/* The slot, so it reads as a fastener rather than as a hole. */}
          <line
            x1={x + CAP_W / 2 - 0.28}
            y1={brick.y + brick.h / 2 - 0.28}
            x2={x + CAP_W / 2 + 0.28}
            y2={brick.y + brick.h / 2 + 0.28}
            stroke='#565c66'
            strokeWidth={0.16}
          />
        </g>
      ))}

      {/* Silkscreen: whose it is on the left, what it gives on the right.
          Printed twice — a dark copy a hair low, a light one over it — because
          that is the bite ink has on a brushed face, and one flat grey string
          is the difference between a badge and a label. */}
      {[
        { dy: 0.11, ink: "#000000", mark: "#000000", opacity: 0.5 },
        { dy: 0, ink: "#d7dce4", mark: DC_CORE_LIVE, opacity: 0.72 },
      ].map((pass) => (
        <text
          key={pass.ink}
          x={inner.x + 0.8}
          y={brick.y + 1.72 + pass.dy}
          fill={pass.ink}
          opacity={pass.opacity}
          fontSize={1.3}
          letterSpacing={0.38}
          fontFamily='ui-sans-serif, system-ui, sans-serif'
          fontWeight={800}>
          {brand.toUpperCase()}
          {model && (
            <tspan
              dx={0.62}
              fill={pass.mark}
              fontWeight={700}
              letterSpacing={0.14}>
              {model}
            </tspan>
          )}
        </text>
      ))}
      <text
        x={inner.x + inner.w - 0.7}
        y={brick.y + 1.66}
        textAnchor='end'
        fill={DC_CORE_LIVE}
        opacity={live ? 0.5 : 0.28}
        fontSize={1.14}
        letterSpacing={0.14}
        fontFamily='ui-sans-serif, system-ui, sans-serif'
        fontWeight={700}>
        {legend}
      </text>

      {rail.sockets.map((socket) => (
        <g key={socket.index}>
          {/* The pilot LED, on the face directly above its own output. */}
          {lit(socket.index) && (
            <circle
              cx={socket.x}
              cy={ledY}
              r={0.95}
              fill={DC_CORE_LIVE}
              opacity={0.22}
            />
          )}
          <circle
            cx={socket.x}
            cy={ledY}
            r={0.3}
            fill={lit(socket.index) ? "#fcd34d" : "#191a1e"}
          />

          {/* The output: a copper-ringed barrel jack sunk into the bay. */}
          <circle
            cx={socket.x}
            cy={socket.y}
            r={SOCKET_R + 0.22}
            fill={COPPER}
            opacity={lit(socket.index) ? 0.8 : 0.42}
          />
          <circle cx={socket.x} cy={socket.y} r={SOCKET_R} fill='#050506' />
          {/* The centre pin every barrel jack has standing in it. */}
          <circle
            cx={socket.x}
            cy={socket.y}
            r={SOCKET_R * 0.28}
            fill='#3d4149'
          />
          {/* One highlight off the rim, so it reads as metal, not as a dot. */}
          <path
            d={`M ${socket.x - SOCKET_R * 0.8} ${socket.y - SOCKET_R * 0.48} A ${SOCKET_R} ${SOCKET_R} 0 0 1 ${socket.x + SOCKET_R * 0.34} ${socket.y - SOCKET_R * 0.92}`}
            fill='none'
            stroke='#ffffff'
            strokeWidth={0.16}
            strokeLinecap='round'
            opacity={0.28}
          />
        </g>
      ))}

      {/* …and a plug in every output that has a cable in it, hanging out of the
          bay the way the pedal end stands on the enclosure. Drawn over the
          sockets, because a plug is what covers a hole. */}
      {stubs.map((socket) => (
        <DcPlug
          key={`plug-${socket.index}`}
          at={{ x: socket.x, y: socket.y }}
          dir={1}
          reach={DC_BRICK_PLUG_REACH}
        />
      ))}
    </svg>
  );
};

export interface PoweredPedal extends DcTarget {
  /** The output its cable is plugged into. */
  out: number;
}

interface PowerLoomProps {
  /** The case and the brick — see `PowerRail`. */
  rail: RailGeometry;
  /** Every cable on the board, already resolved to sockets and jacks. */
  patched: PoweredPedal[];
  /** The pedals in each row, for picking a gap to thread a cable down. */
  rowSpans: Record<number, RowSpan[]>;
  /** The cable being dragged out of the brick, in board units. */
  dragging?: { from: Point; to: Point; allowed: boolean } | null;
  /** A visitor's board: no live cable, and the loom drawn dead. */
  live?: boolean;
}

export const PowerLoom = ({
  rail,
  patched,
  rowSpans,
  dragging,
  live = true,
}: PowerLoomProps) => {
  const runs = patched.map((pedal) => {
    const socket = rail.sockets[pedal.out];
    // A run to the top row needs no gap at all — it drops straight onto the
    // pedal's own inlet. Every row below it has to get past the rows above
    // first, and it does that between two of their enclosures — one gap per
    // row crossed, which on the biggest case is two.
    const risers = risersFor(rail.geo, rowSpans, pedal.row, pedal.jack.x);

    return {
      itemId: pedal.itemId,
      d: powerRun(rail, socket, pedal, risers),
      jack: pedal.jack,
    };
  });

  const loose = dragging ? dragRun(dragging.from, dragging.to) : null;

  return (
    <svg
      viewBox={`0 0 ${rail.geo.viewW} ${rail.geo.viewH}`}
      preserveAspectRatio='none'
      className='pointer-events-none absolute inset-0 h-full w-full'
      style={{ zIndex: 0 }}
      aria-hidden>
      <g fill='none' strokeLinecap='round' strokeLinejoin='round'>
        {/* Every cast shadow first, so one cable's never darkens the next. */}
        {runs.map((run) => (
          <path
            key={`shadow-${run.itemId}`}
            d={run.d}
            stroke='#000000'
            strokeWidth={DC_JACKET_W + 0.7}
            opacity={0.45}
            transform='translate(0 0.45)'
          />
        ))}
        {runs.map((run) => (
          <g key={run.itemId}>
            <path d={run.d} stroke={DC_JACKET} strokeWidth={DC_JACKET_W} />
            {/* The sheen off a rubber jacket, which is what rounds it. */}
            <path
              d={run.d}
              stroke='#ffffff'
              strokeWidth={0.22}
              opacity={0.1}
              transform='translate(0 -0.26)'
            />
            <path
              d={run.d}
              stroke={live ? DC_CORE : "#2c2c30"}
              strokeWidth={0.26}
              opacity={live ? 0.7 : 1}
            />
          </g>
        ))}

        {loose && (
          <>
            <path
              d={loose}
              stroke='#000000'
              strokeWidth={DC_JACKET_W + 0.7}
              opacity={0.45}
              transform='translate(0 0.45)'
            />
            <path d={loose} stroke={DC_JACKET} strokeWidth={DC_JACKET_W} />
            {/* Amber says the brick can carry it, red says the drop will be
                refused — before the cable is let go, not after. */}
            <path
              d={loose}
              stroke={dragging?.allowed ? DC_CORE_LIVE : "#f87171"}
              strokeWidth={0.34}
              opacity={0.95}
            />
          </>
        )}
      </g>

      {runs.map((run) => (
        <DcPlug key={`plug-${run.itemId}`} at={run.jack} />
      ))}
      {dragging && <DcPlug at={dragging.to} />}
    </svg>
  );
};
