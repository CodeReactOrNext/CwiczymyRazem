import { useId } from "react";

import type { Point } from "../../utils/cableGeometry";
import type { DcTarget, RailGeometry, RowSpan } from "../../utils/powerLayout";
import {
  BAY_TOP,
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
/** The machined edges that catch the light: chamfers, screw heads, grooves. */
const BRICK_BRIGHT = "#5c626d";

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
  const collarY = dir < 0 ? point.y - DC_COLLAR_H : point.y - 0.06;
  const bootY = dir < 0 ? top : back - DC_COLLAR_H * 0.9;

  return (
    <g>
      {/* The shadow it drops on whatever it is standing on. Cast off to one
          side rather than ringed around it, so the plug seats on the metal
          instead of glowing against it. */}
      <rect
        x={point.x - half + 0.3}
        y={top + 0.22}
        width={half * 2}
        height={reach}
        rx={half * 0.55}
        fill='#000000'
        opacity={0.45}
      />
      {/* The moulded barrel, lit down one side and turning away on the other,
          which is the whole of what makes it round at this size. */}
      <rect
        x={point.x - half}
        y={top}
        width={half * 2}
        height={reach}
        rx={half * 0.5}
        fill='#15161a'
      />
      <rect
        x={point.x - half}
        y={top}
        width={half * 0.6}
        height={reach}
        rx={half * 0.42}
        fill='#ffffff'
        opacity={0.11}
      />
      <rect
        x={point.x + half * 0.44}
        y={top}
        width={half * 0.56}
        height={reach}
        rx={half * 0.42}
        fill='#000000'
        opacity={0.38}
      />
      {/* The strain-relief boot the cable leaves through — narrower than the
          barrel, because that is the step a moulded plug has. */}
      <rect
        x={point.x - half * 0.64}
        y={bootY}
        width={half * 1.28}
        height={DC_COLLAR_H * 0.9}
        rx={0.15}
        fill='#0c0d10'
      />
      {/* …and the collar seated against the socket, which is what covers the
          hole: a plugged jack is a jack nobody can see any more. A band round
          the barrel, not a plate on the end of it — the same copper as the
          outputs, and no wider than the body it belongs to. */}
      <rect
        x={point.x - half - 0.04}
        y={collarY}
        width={half * 2 + 0.08}
        height={DC_COLLAR_H * 0.78}
        rx={0.13}
        fill={COPPER}
        opacity={0.62}
      />
      <rect
        x={point.x - half - 0.04}
        y={collarY}
        width={half * 2 + 0.08}
        height={DC_COLLAR_H * 0.3}
        rx={0.1}
        fill='#ffffff'
        opacity={0.15}
      />
      <rect
        x={point.x - half - 0.04}
        y={collarY + DC_COLLAR_H * 0.78}
        width={half * 2 + 0.08}
        height={0.11}
        fill='#000000'
        opacity={0.45}
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
  const sheen = `${uid}-sheen`;
  const halo = `${uid}-halo`;

  const { brick, supply } = rail;
  /** What is silkscreened on it: whose it is, and how many pedals it feeds. */
  const name = supply.name;
  const legend = `9V ⎓ ${supply.outputs} out`;

  const lit = (index: number) => live && used.has(index);
  const stubs = rail.sockets.filter(
    (socket) => used.has(socket.index) || socket.index === pending,
  );

  /**
   * The cast end blocks, and the stretch of extrusion left between them.
   *
   * Capped as a share of the body as well as in units, because the smallest
   * brick in the shop is a quarter the length of the biggest and a fixed block
   * would eat most of its face.
   */
  const capW = Math.min(3.6, brick.w * 0.13);
  const inner = { x: brick.x + capW, w: brick.w - capW * 2 };
  const bottom = brick.y + brick.h;
  /** The bay the outputs are recessed into, milled along the underside. */
  const bayTop = brick.y + brick.h * BAY_TOP;
  const bayBottom = bottom - 0.24;
  /** The row of pilot LEDs, on the face just above it. */
  const ledY = brick.y + brick.h * 0.446;
  /** …and the silkscreen, on the clear stretch of face above them. */
  const nameY = brick.y + brick.h * 0.29;
  /** Where the mains lead leaves the left cap, and how far it has to travel. */
  const leadY = brick.y + brick.h * 0.44;
  const leadRun = brick.x + 3;

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
          <stop offset='0%' stopColor='#43464f' />
          <stop offset='7%' stopColor='#2e3138' />
          <stop offset='19%' stopColor='#383b43' />
          <stop offset='34%' stopColor='#2a2c33' />
          <stop offset='52%' stopColor={BRICK_FACE} />
          <stop offset='72%' stopColor='#212329' />
          <stop offset='90%' stopColor='#15161a' />
          <stop offset='100%' stopColor='#0e0f12' />
        </linearGradient>
        {/* A cast end block is grittier than the extrusion and turns over
            harder at the top, because it is a thicker piece of metal. */}
        <linearGradient id={cap} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#3c3f47' />
          <stop offset='22%' stopColor='#23252b' />
          <stop offset='60%' stopColor='#16171b' />
          <stop offset='100%' stopColor='#08090b' />
        </linearGradient>
        {/* The bay is a hole, so it is darkest at the top, under the lip. */}
        <linearGradient id={bay} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#000000' />
          <stop offset='45%' stopColor='#0a0b0d' />
          <stop offset='100%' stopColor='#1c1d23' />
        </linearGradient>
        {/* One soft sweep of light down the length of it. A metre of extrusion
            is never lit evenly end to end, and the unevenness is most of what
            separates a machined body from a rounded rectangle. */}
        <linearGradient id={sheen} x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0%' stopColor='#ffffff' stopOpacity={0} />
          <stop offset='16%' stopColor='#ffffff' stopOpacity={0.05} />
          <stop offset='30%' stopColor='#ffffff' stopOpacity={0} />
          <stop offset='58%' stopColor='#ffffff' stopOpacity={0.065} />
          <stop offset='76%' stopColor='#ffffff' stopOpacity={0} />
          <stop offset='93%' stopColor='#ffffff' stopOpacity={0.035} />
          <stop offset='100%' stopColor='#ffffff' stopOpacity={0} />
        </linearGradient>
        {/* What a lit pilot lamp throws on the metal around it. */}
        <radialGradient id={halo}>
          <stop offset='0%' stopColor={DC_CORE_LIVE} stopOpacity={0.5} />
          <stop offset='45%' stopColor={DC_CORE_LIVE} stopOpacity={0.16} />
          <stop offset='100%' stopColor={DC_CORE_LIVE} stopOpacity={0} />
        </radialGradient>
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

      {/* The mains lead, out of the left cap and away into the case. It always
          leaves the frame, whatever the brick's length: a lead that stops in
          mid-air on a short brick is a lead plugged into nothing. */}
      <path
        d={`M ${brick.x + 0.4} ${leadY} C ${brick.x - leadRun * 0.34} ${
          leadY + 0.25
        } ${brick.x - leadRun * 0.66} ${RAIL_H - 0.75} ${-3} ${RAIL_H - 0.2}`}
        fill='none'
        stroke={DC_JACKET}
        strokeWidth={DC_JACKET_W + 0.25}
        strokeLinecap='round'
      />
      {/* …and the strain-relief boot it leaves through. */}
      <rect
        x={brick.x - 2.5}
        y={leadY - 0.68}
        width={2.9}
        height={1.36}
        rx={0.55}
        fill='#1b1c21'
      />
      <rect
        x={brick.x - 2.5}
        y={leadY - 0.68}
        width={2.9}
        height={0.4}
        rx={0.2}
        fill='#ffffff'
        opacity={0.07}
      />

      {/* The shadow the whole thing sits in — two passes, so it falls off
          instead of stopping dead, and the brick reads as standing on the case
          rather than as printed on it. */}
      <rect
        x={brick.x - 0.5}
        y={brick.y + 1.1}
        width={brick.w + 1}
        height={brick.h}
        rx={1}
        fill='#000000'
        opacity={0.3}
      />
      <rect
        x={brick.x}
        y={brick.y + 0.4}
        width={brick.w}
        height={brick.h}
        rx={0.7}
        fill='#000000'
        opacity={0.6}
      />

      {/* The extrusion itself, and the sweep of light down the length of it. */}
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
        x={brick.x}
        y={brick.y}
        width={brick.w}
        height={brick.h}
        rx={0.7}
        fill={`url(#${sheen})`}
      />

      {/* The chamfer along the top edge: the hard line the light catches, and
          the softer band falling away under it. */}
      <rect
        x={brick.x + 0.55}
        y={brick.y + 0.1}
        width={brick.w - 1.1}
        height={0.13}
        rx={0.07}
        fill='#ffffff'
        opacity={0.3}
      />
      <rect
        x={brick.x + 0.55}
        y={brick.y + 0.23}
        width={brick.w - 1.1}
        height={0.34}
        fill='#ffffff'
        opacity={0.06}
      />

      {/* Two grooves pulled the length of the extrusion, the way a die leaves
          them. They are what says this body was drawn through something. */}
      {[0.86, 1.06].map((at, index) => (
        <rect
          key={at}
          x={inner.x - 1.4}
          y={brick.y + at}
          width={inner.w + 2.8}
          height={index === 0 ? 0.14 : 0.08}
          fill={index === 0 ? "#000000" : "#ffffff"}
          opacity={index === 0 ? 0.45 : 0.11}
        />
      ))}

      {/* …and the dark turn of the bottom edge, under everything else. */}
      <rect
        x={brick.x + 0.4}
        y={bottom - 0.28}
        width={brick.w - 0.8}
        height={0.28}
        fill='#000000'
        opacity={0.45}
      />

      {/* The bay the outputs are recessed into: a hole, with the lip of the
          face overhanging it and a thread of light off the bottom edge that
          stands proud of it. */}
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
        height={0.55}
        rx={0.2}
        fill='#000000'
        opacity={0.8}
      />
      <rect
        x={inner.x - 0.4}
        y={bayTop - 0.14}
        width={inner.w + 0.8}
        height={0.14}
        fill='#ffffff'
        opacity={0.16}
      />
      <rect
        x={inner.x - 0.4}
        y={bayBottom - 0.06}
        width={inner.w + 0.8}
        height={0.13}
        fill='#ffffff'
        opacity={0.12}
      />

      {/* A cast end cap at each end, bolted through top and bottom. Drawn over
          the bay, because the block is solid where the extrusion is hollow. */}
      {[brick.x, brick.x + brick.w - capW].map((x, side) => (
        <g key={x}>
          <rect
            x={x}
            y={brick.y}
            width={capW}
            height={brick.h}
            rx={0.7}
            fill={`url(#${cap})`}
          />
          {/* The seam where the block meets the extrusion: a shadowed joint,
              and the lit edge of the block beside it. */}
          <rect
            x={side === 0 ? x + capW - 0.16 : x}
            y={brick.y + 0.12}
            width={0.16}
            height={brick.h - 0.24}
            fill='#000000'
            opacity={0.55}
          />
          <rect
            x={side === 0 ? x + capW - 0.24 : x + 0.16}
            y={brick.y + 0.12}
            width={0.08}
            height={brick.h - 0.24}
            fill='#ffffff'
            opacity={0.07}
          />
          <rect
            x={x + 0.5}
            y={brick.y + 0.1}
            width={capW - 1}
            height={0.13}
            rx={0.07}
            fill='#ffffff'
            opacity={0.26}
          />
          {[0.3, 0.72].map((at) => (
            <g key={at}>
              <circle
                cx={x + capW / 2}
                cy={brick.y + brick.h * at}
                r={0.46}
                fill='#0a0b0e'
                stroke={BRICK_BRIGHT}
                strokeWidth={0.15}
              />
              {/* The slot, so it reads as a fastener rather than as a hole. */}
              <line
                x1={x + capW / 2 - 0.25}
                y1={brick.y + brick.h * at - 0.25}
                x2={x + capW / 2 + 0.25}
                y2={brick.y + brick.h * at + 0.25}
                stroke={BRICK_BRIGHT}
                strokeWidth={0.15}
              />
            </g>
          ))}
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
          x={inner.x + 0.9}
          y={nameY + pass.dy}
          fill={pass.ink}
          opacity={pass.opacity}
          fontSize={1.5}
          letterSpacing={0.44}
          fontFamily='ui-sans-serif, system-ui, sans-serif'
          fontWeight={800}>
          {brand.toUpperCase()}
          {model && (
            <tspan
              dx={0.72}
              fill={pass.mark}
              fontWeight={700}
              letterSpacing={0.16}>
              {model}
            </tspan>
          )}
        </text>
      ))}
      {/* The rating, on its own etched plate at the other end — where a spec is
          stamped, and far enough from the name that neither is reading as part
          of the other. */}
      <rect
        x={inner.x + inner.w - 0.4 - legend.length * 0.78}
        y={nameY - 1.18}
        width={legend.length * 0.78 + 0.4}
        height={1.66}
        rx={0.28}
        fill='#000000'
        opacity={0.42}
      />
      <rect
        x={inner.x + inner.w - 0.4 - legend.length * 0.78}
        y={nameY + 0.41}
        width={legend.length * 0.78 + 0.4}
        height={0.07}
        rx={0.03}
        fill='#ffffff'
        opacity={0.12}
      />
      <text
        x={inner.x + inner.w - 0.8}
        y={nameY}
        textAnchor='end'
        fill={DC_CORE_LIVE}
        opacity={live ? 0.72 : 0.34}
        fontSize={1.16}
        letterSpacing={0.16}
        fontFamily='ui-sans-serif, system-ui, sans-serif'
        fontWeight={700}>
        {legend}
      </text>

      {rail.sockets.map((socket) => {
        const on = lit(socket.index);
        /** A hole with a plug in it is a hole nobody can see. */
        const open = !stubs.some((taken) => taken.index === socket.index);
        return (
          <g key={socket.index}>
            {/* The pilot LED, on the face directly above its own output. It is
                a lamp sunk in a bezel whether or not it is on, so an unused
                output reads as dark rather than as missing. */}
            {on && (
              <circle cx={socket.x} cy={ledY} r={1.4} fill={`url(#${halo})`} />
            )}
            <circle
              cx={socket.x}
              cy={ledY}
              r={0.4}
              fill='#08090b'
              stroke='#33363d'
              strokeWidth={0.09}
            />
            <circle
              cx={socket.x}
              cy={ledY}
              r={0.25}
              fill={on ? "#f0a51c" : "#1a1b20"}
            />
            {on && (
              <circle
                cx={socket.x}
                cy={ledY - 0.06}
                r={0.12}
                fill='#fef3c7'
                opacity={0.9}
              />
            )}

            {/* The counterbore the jack is sunk into. Drawn whether or not the
                hole is filled, because it is machined into the metal and a
                plug sits down in it rather than on top of it. */}
            <circle
              cx={socket.x}
              cy={socket.y}
              r={SOCKET_R + 0.36}
              fill='#000000'
              opacity={0.55}
            />

            {/* The output itself: a copper-ringed barrel jack. Only while it is
                empty — a plug's collar seats on the panel and covers the whole
                of it, and drawing both is what turns a plugged output into a
                pail with a handle. */}
            {open && (
              <>
                <circle
                  cx={socket.x}
                  cy={socket.y}
                  r={SOCKET_R + 0.2}
                  fill={COPPER}
                  opacity={0.45}
                />
                <circle
                  cx={socket.x}
                  cy={socket.y}
                  r={SOCKET_R + 0.2}
                  fill='none'
                  stroke='#000000'
                  strokeWidth={0.1}
                  opacity={0.45}
                />
                <circle
                  cx={socket.x}
                  cy={socket.y}
                  r={SOCKET_R}
                  fill='#050506'
                />
                {/* The shadow the near lip of the hole casts down inside it. */}
                <path
                  d={`M ${socket.x - SOCKET_R} ${socket.y} A ${SOCKET_R} ${SOCKET_R} 0 0 1 ${socket.x + SOCKET_R} ${socket.y}`}
                  fill='none'
                  stroke='#000000'
                  strokeWidth={0.3}
                  opacity={0.75}
                />
                {/* The centre pin every barrel jack has standing in it. */}
                <circle
                  cx={socket.x}
                  cy={socket.y}
                  r={SOCKET_R * 0.3}
                  fill='#41454e'
                />
                <circle
                  cx={socket.x}
                  cy={socket.y - SOCKET_R * 0.08}
                  r={SOCKET_R * 0.14}
                  fill='#767c88'
                />
                {/* One highlight off the rim, so it reads as metal, not a dot. */}
                <path
                  d={`M ${socket.x - SOCKET_R * 0.82} ${socket.y - SOCKET_R * 0.62} A ${SOCKET_R + 0.2} ${SOCKET_R + 0.2} 0 0 1 ${socket.x + SOCKET_R * 0.4} ${socket.y - SOCKET_R * 1.02}`}
                  fill='none'
                  stroke='#ffffff'
                  strokeWidth={0.16}
                  strokeLinecap='round'
                  opacity={0.32}
                />
              </>
            )}
          </g>
        );
      })}

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
