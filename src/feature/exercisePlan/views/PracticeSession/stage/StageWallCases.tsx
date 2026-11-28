import {
  GLASS_STREAK,
  LAMP_MASK,
  RackScene,
} from "feature/arsenal/components/Rig/RackScene";
import { useMotionValue } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import type { StageGuitar } from "./useStageGuitars";

const ART = "/static/images/session/stage-studio";

/*
 * The cases are built in the room's own 3D space (StageRoom), in vw: the back
 * wall stands at z = -70, 150 wide and 48 tall, its top 28 above the eye line
 * (CSS y runs down). Each case is a real recess in it — the frame on the wall's
 * face, the back panel DEPTH behind it, four inner sides between them, glass in
 * front — so its sides show in perspective and it moves as a box, not a picture.
 */
export const WALL_Z = -70;
export const WALL_W = 150;
export const WALL_TOP = -28;
export const WALL_H = 48;
/** How deep a case goes into the wall. */
const DEPTH = 7;
/** How far in front of its back panel a guitar hangs: close, so it moves with the case's own scene. */
const GUITAR_OFF_BACK = 1.1;
/** Where a guitar hangs in an opening, as fractions of its height: the Rig's own case box, and the studio niche's. */
const LOOK_GUITAR = { top: 0.09, bottom: 0.08 };
const STUDIO_GUITAR = { top: 0.075, bottom: 0.065 };

/**
 * Where the cases sit on the back wall, by how many there are — centres in % of
 * its width. Right of the lamp and clear of the score: two to the right of it,
 * a third on its left between the lamp and the score.
 */
const CASE_SPOTS: Record<number, number[]> = {
  1: [84],
  2: [77, 91],
  3: [21, 77, 91],
};
/** Where the cases hang for `count` guitars — and so where the ceiling's downlights are. */
export const caseSpots = (count: number): number[] => CASE_SPOTS[count] ?? [];

/** A case's height (vw), and its middle as a share of the wall's height. */
const CASE_H = 25;
const CASE_MIDDLE = 0.46;
/** Where the floor lamp stands in the wall's photograph, in % of its width, and how far its light reaches. */
const LAMP_AT = 7;
const LAMP_REACH = 38;

/**
 * How much of the floor lamp a case at `spot` gets: 1 right beside it, 0 out
 * in the dark half of the wall. The wall's photograph falls off the same way,
 * so a case that ignored it would read as stuck on.
 */
export const lampLightAt = (spot: number) =>
  Math.max(0, 1 - Math.abs(spot - LAMP_AT) / LAMP_REACH);

/** The studio's own case photograph (864 × 1068): a bronze-framed niche with a strip of wall either side. */
const STUDIO_ASPECT = 864 / 1068;
/** Its frame's outer edge and its opening, in fractions of the photograph. */
const STUDIO_FRAME = { left: 0.145, right: 0.86, top: 0.037, bottom: 0.988 };
const STUDIO_OPENING = { left: 0.168, right: 0.833, top: 0.056, bottom: 0.964 };
/** The Rig's case photographs are 3:4 and are all opening; a trim frames them on the wall. */
const LOOK_ASPECT = 3 / 4;
const LOOK_TRIM = 0.42;

/** Every surface of a case follows the room's light (StageRoom sets --stage-heat), and is as soft as the wall. */
export const surface = (brightness: number) =>
  `brightness(calc(${brightness.toFixed(3)} * (0.95 + var(--stage-heat) * 0.5))) blur(0.7px) saturate(0.85)`;

interface Rect {
  /** Centre offset from the case's centre, and size (vw). */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A flat piece of the case, placed in 3D around the case's centre on the wall. */
export const Piece = ({
  x = 0,
  y = 0,
  z = 0,
  w,
  h,
  turn = "",
  style,
  children,
}: {
  x?: number;
  y?: number;
  z?: number;
  w: number;
  h: number;
  turn?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) => (
  <div
    className='pointer-events-none absolute left-0 top-0'
    style={{
      width: `${w}vw`,
      height: `${h}vw`,
      transform: `translate(-50%, -50%) translate3d(${x}vw, ${y}vw, ${z}vw) ${turn}`,
      ...style,
    }}>
    {children}
  </div>
);

/**
 * Shadow over an inner side's wood, from the front edge to the back corner: lit
 * at the front (less so in the dark half of the room), nearly black at the back.
 * `front` 0…1 is how much light that side catches.
 */
const woodFalloff = (front: number, back: number, shade: number) => {
  const near = Math.min(0.95, 1 - front * (1 - shade));
  return `rgba(0,0,0,${near.toFixed(3)}) 0%, rgba(0,0,0,${back.toFixed(3)}) 100%`;
};
/** The inner sides are the same smoked oak as the studio niche's back panel. */
const SIDE_WOOD = `url(${ART}/case.webp) 50% 50% / 300% 140%`;

/**
 * The four inner sides of the recess, wood falling into shadow toward the back.
 * The floor of the niche catches its downlight.
 */
const InnerSides = ({ o, shade }: { o: Rect; shade: number }) => {
  const half = DEPTH / 2;
  const soft = { filter: surface(1) };
  // The niche's downlight grazing its sides from the top, and pooling on its floor.
  const graze = (
    <div
      className='absolute inset-0'
      style={{
        background:
          "linear-gradient(to bottom, rgba(255,228,196,0.13) 0%, rgba(255,228,196,0.03) 45%, rgba(255,228,196,0) 70%)",
      }}
    />
  );
  return (
    <>
      <Piece
        x={o.x - o.w / 2}
        y={o.y}
        z={-half}
        w={DEPTH}
        h={o.h}
        turn='rotateY(90deg)'
        style={{
          ...soft,
          background: `linear-gradient(to right, ${woodFalloff(0.62, 0.9, shade)}), ${SIDE_WOOD}`,
        }}>
        {graze}
      </Piece>
      <Piece
        x={o.x + o.w / 2}
        y={o.y}
        z={-half}
        w={DEPTH}
        h={o.h}
        turn='rotateY(-90deg)'
        style={{
          ...soft,
          background: `linear-gradient(to left, ${woodFalloff(0.62, 0.9, shade)}), ${SIDE_WOOD}`,
        }}>
        {graze}
      </Piece>
      <Piece
        x={o.x}
        y={o.y - o.h / 2}
        z={-half}
        w={o.w}
        h={DEPTH}
        turn='rotateX(-90deg)'
        style={{
          ...soft,
          background: `linear-gradient(to bottom, ${woodFalloff(0.42, 0.92, shade)}), ${SIDE_WOOD}`,
        }}
      />
      <Piece
        x={o.x}
        y={o.y + o.h / 2}
        z={-half}
        w={o.w}
        h={DEPTH}
        turn='rotateX(90deg)'
        style={{
          ...soft,
          background: `linear-gradient(to top, ${woodFalloff(0.85, 0.75, shade)}), ${SIDE_WOOD}`,
        }}>
        <div
          className='absolute inset-0'
          style={{
            background:
              "radial-gradient(ellipse 34% 90% at 50% 55%, rgba(255,228,196,0.2), rgba(255,228,196,0) 100%)",
          }}
        />
      </Piece>
    </>
  );
};

/** The room's light over a surface of the case: the shadow it sits in away from the lamp, and the lamp warming its near side. */
const RoomLight = ({ lamp, shade }: { lamp: number; shade: number }) => (
  <>
    <div
      className='absolute inset-0'
      style={{ background: `rgba(0,0,0,${shade.toFixed(3)})` }}
    />
    {lamp > 0 && (
      <div
        className='absolute inset-0 mix-blend-soft-light'
        style={{
          background: `linear-gradient(to right, rgba(255,170,95,${(0.55 * lamp).toFixed(3)}), rgba(255,170,95,0) 55%)`,
        }}
      />
    )}
  </>
);

/** The glass over the opening: a pane's two streaks, and the lamp's warm smear on its near side. */
const Glass = ({ o, lamp }: { o: Rect; lamp: number }) => (
  <Piece
    x={o.x}
    y={o.y}
    z={0.05}
    w={o.w}
    h={o.h}
    style={{
      background: [
        GLASS_STREAK,
        `linear-gradient(104deg, rgba(255,190,120,${(0.14 * lamp).toFixed(3)}) 0%, rgba(255,190,120,0) 32%)`,
        "rgba(12,12,14,0.08)",
      ].join(", "),
    }}
  />
);

/** The guitar's own outline, as a mask: what its shadow and its light are cut to. */
const guitarMask = (src: string): CSSProperties => ({
  maskImage: `url("${src}")`,
  WebkitMaskImage: `url("${src}")`,
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskPosition: "center",
  WebkitMaskPosition: "center",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
});

/** The art stood upright: a square as tall as its box, turned so the headstock (the art's right side) is up. */
const Upright = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div className='flex h-full w-full items-center justify-center'>
    <div className='relative aspect-square h-full -rotate-90' style={style}>
      {children}
    </div>
  </div>
);

/**
 * The guitar in its case, close in front of the back panel, and what ties it
 * to the case: its shadow on the panel — the downlight is straight above, so
 * it drops and spreads — and that light running down it, bright at the
 * headstock and falling off over the body, a breath of the case's colour on top.
 */
const HungGuitar = ({
  guitar,
  o,
  shade,
  box,
}: {
  guitar: StageGuitar;
  o: Rect;
  shade: number;
  box: { top: number; bottom: number };
}) => {
  const h = o.h * (1 - box.top - box.bottom);
  const y = o.y - o.h / 2 + o.h * box.top + h / 2;
  const mask = guitarMask(guitar.src);
  return (
    <>
      <Piece x={o.x} y={y + 0.8} z={-DEPTH + 0.04} w={o.w} h={h * 1.03}>
        {/* Blurred on the wrapper: a filter on the masked element itself would run before the mask and leave a hard edge. */}
        <Upright style={{ filter: "blur(0.4vw)", opacity: 0.6 }}>
          <div
            className='absolute inset-0'
            style={{ ...mask, background: "#000" }}
          />
        </Upright>
      </Piece>
      <Piece x={o.x} y={y} z={-DEPTH + GUITAR_OFF_BACK} w={o.w} h={h}>
        <Upright style={{ filter: surface(0.98 * (1 - shade * 0.5)) }}>
          {/* A plain img: it lives on a CSS 3D plane, and next/image's box would fight the transform. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={guitar.src}
            alt={guitar.name}
            draggable={false}
            className='absolute inset-0 h-full w-full object-contain'
          />
          <div
            className='absolute inset-0'
            style={{
              ...mask,
              // Plain alpha, not a blend mode: inside the room's 3D space browsers drop blend modes.
              background:
                "linear-gradient(to left, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 32%, rgba(0,0,0,0.42) 100%)",
            }}
          />
          <div
            className='absolute inset-0'
            style={{
              ...mask,
              background: `linear-gradient(to left, ${guitar.color}1f 0%, rgba(0,0,0,0) 38%)`,
            }}
          />
        </Upright>
      </Piece>
    </>
  );
};

/** The downlight's cone through the air of the case, between the glass and the guitar. */
const LightCone = ({ o }: { o: Rect }) => (
  <Piece
    x={o.x}
    y={o.y}
    z={-DEPTH * 0.3}
    w={o.w}
    h={o.h}
    style={{
      background:
        "radial-gradient(ellipse 30% 78% at 50% 0%, rgba(255,236,212,0.09), rgba(255,236,212,0.03) 55%, rgba(255,236,212,0) 100%)",
    }}
  />
);

/**
 * The niche's light reaching out past its frame onto the slats — a breath round
 * it and a pool under it — and, for the studio case, the frame's own shadow
 * thrown down and to the right (the lamp is on the left).
 */
const OnTheWall = ({
  w,
  frame,
  lamp,
}: {
  w: number;
  frame?: Rect;
  lamp: number;
}) => {
  const dim = 1 - 0.4 * lamp;
  return (
    <>
      <Piece
        y={CASE_H * 0.13}
        z={0.01}
        w={w * 1.8}
        h={CASE_H * 1.5}
        style={{
          background: [
            `radial-gradient(ellipse 30% 16% at 50% 86%, rgba(255,214,170,${(0.11 * dim).toFixed(3)}), rgba(255,214,170,0) 100%)`,
            `radial-gradient(ellipse 42% 46% at 50% 44%, rgba(255,214,170,${(0.05 * dim).toFixed(3)}), rgba(255,214,170,0) 100%)`,
          ].join(", "),
        }}
      />
      {frame && (
        <Piece
          x={frame.x}
          y={frame.y}
          z={0.02}
          w={frame.w}
          h={frame.h}
          style={{
            boxShadow:
              "0.35vw 0.55vw 1.1vw rgba(0,0,0,0.6), 0 0 0.25vw rgba(0,0,0,0.7)",
          }}
        />
      )}
    </>
  );
};

const rectOf = (
  r: { left: number; right: number; top: number; bottom: number },
  w: number,
  h: number,
): Rect => ({
  x: ((r.left + r.right) / 2 - 0.5) * w,
  y: ((r.top + r.bottom) / 2 - 0.5) * h,
  w: (r.right - r.left) * w,
  h: (r.bottom - r.top) * h,
});

/** The studio's own case: its bronze frame cut from the photograph, the niche's back set DEPTH behind it. */
const StudioCase = ({
  guitar,
  lamp,
  shade,
}: {
  guitar: StageGuitar;
  lamp: number;
  shade: number;
}) => {
  const w = CASE_H * STUDIO_ASPECT;
  const h = CASE_H;
  const frame = rectOf(STUDIO_FRAME, w, h);
  const o = rectOf(STUDIO_OPENING, w, h);
  // The frame alone: the photograph inside the frame's outer edge, less the opening.
  const sizes = `${frame.w}vw ${frame.h}vw, ${o.w}vw ${o.h}vw`;
  const places = `${STUDIO_FRAME.left * w}vw ${STUDIO_FRAME.top * h}vw, ${STUDIO_OPENING.left * w}vw ${STUDIO_OPENING.top * h}vw`;
  const ring: CSSProperties = {
    maskImage: "linear-gradient(#000, #000), linear-gradient(#000, #000)",
    WebkitMaskImage: "linear-gradient(#000, #000), linear-gradient(#000, #000)",
    maskSize: sizes,
    WebkitMaskSize: sizes,
    maskPosition: places,
    WebkitMaskPosition: places,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskComposite: "exclude",
    WebkitMaskComposite: "xor",
  };
  const photo = {
    backgroundImage: `url(${ART}/case.webp)`,
    backgroundSize: `${w}vw ${h}vw`,
  };
  return (
    <>
      <OnTheWall w={w} frame={frame} lamp={lamp} />
      {/* The back panel, with its downlight — the photograph's own, cut to the opening. */}
      <Piece
        x={o.x}
        y={o.y}
        z={-DEPTH}
        w={o.w}
        h={o.h}
        style={{
          ...photo,
          backgroundPosition: `${-STUDIO_OPENING.left * w}vw ${-STUDIO_OPENING.top * h}vw`,
          filter: surface(1),
        }}>
        <div
          className='absolute inset-0 mix-blend-color'
          style={{
            background: guitar.color,
            opacity: 0.22,
            maskImage: LAMP_MASK,
            WebkitMaskImage: LAMP_MASK,
          }}
        />
        <RoomLight lamp={lamp} shade={shade} />
      </Piece>
      <InnerSides o={o} shade={shade} />
      <HungGuitar guitar={guitar} o={o} shade={shade} box={STUDIO_GUITAR} />
      <LightCone o={o} />
      <Glass o={o} lamp={lamp} />
      <Piece
        z={0.06}
        w={w}
        h={h}
        style={{ ...photo, ...ring, filter: surface(1) }}>
        <RoomLight lamp={lamp} shade={shade} />
      </Piece>
    </>
  );
};

/** A case the player put in that bay of their Rig: its scene as the back panel, a dark trim round the opening. */
const LookCase = ({
  guitar,
  lamp,
  shade,
}: {
  guitar: StageGuitar;
  lamp: number;
  shade: number;
}) => {
  // Always fully lit: on the stage every case holds a guitar.
  const level = useMotionValue(1);
  const w = CASE_H * LOOK_ASPECT;
  const o: Rect = { x: 0, y: 0, w, h: CASE_H };
  return (
    <>
      <OnTheWall w={w} lamp={lamp} />
      <Piece
        z={-DEPTH}
        w={w}
        h={CASE_H}
        style={{ overflow: "hidden", filter: surface(1) }}>
        {guitar.look && (
          <RackScene look={guitar.look} color={guitar.color} level={level} />
        )}
        <RoomLight lamp={lamp} shade={shade} />
      </Piece>
      <InnerSides o={o} shade={shade} />
      <HungGuitar guitar={guitar} o={o} shade={shade} box={LOOK_GUITAR} />
      <LightCone o={o} />
      <Glass o={o} lamp={lamp} />
      <Piece
        z={0.06}
        w={w + LOOK_TRIM * 2}
        h={CASE_H + LOOK_TRIM * 2}
        style={{
          border: `${LOOK_TRIM}vw solid #140e0a`,
          boxShadow:
            "inset 0 0 0 0.1vw rgba(201,162,88,0.22), 0 1.4vw 2.4vw rgba(0,0,0,0.55)",
          filter: surface(1 - shade),
        }}
      />
    </>
  );
};

/**
 * The player's own guitars on the studio's back wall, each in a display case
 * set into it — the case they chose for that bay of their Rig, or the studio's
 * own. Rendered beside the wall inside the room's preserve-3d space: the wall
 * itself is flattened by its filter, so nothing inside it could have depth.
 */
export const StageWallCases = ({ guitars }: { guitars: StageGuitar[] }) => {
  const spots = CASE_SPOTS[guitars.length] ?? [];
  return (
    <>
      {guitars.map((guitar, i) => {
        const spot = spots[i];
        const lamp = lampLightAt(spot);
        // A little shadow away from the lamp, enough to sit in the room, not so much the cases go dull.
        const shade = 0.1 + 0.16 * (1 - lamp);
        const x = -WALL_W / 2 + (spot / 100) * WALL_W;
        const y = WALL_TOP + CASE_MIDDLE * WALL_H;
        return (
          <div
            key={guitar.key}
            className='pointer-events-none absolute left-0 top-0 h-0 w-0'
            style={{
              transform: `translate3d(${x}vw, ${y}vw, ${WALL_Z}vw)`,
              transformStyle: "preserve-3d",
            }}>
            {guitar.look ? (
              <LookCase guitar={guitar} lamp={lamp} shade={shade} />
            ) : (
              <StudioCase guitar={guitar} lamp={lamp} shade={shade} />
            )}
          </div>
        );
      })}
    </>
  );
};

/** Each case's opening on the wall: where the wall has to be cut away for the recess to show. */
const openingOnWall = (guitar: StageGuitar, spot: number): Rect => {
  const o = guitar.look
    ? { x: 0, y: 0, w: CASE_H * LOOK_ASPECT, h: CASE_H }
    : rectOf(STUDIO_OPENING, CASE_H * STUDIO_ASPECT, CASE_H);
  return {
    ...o,
    x: (spot / 100) * WALL_W + o.x,
    y: CASE_MIDDLE * WALL_H + o.y,
  };
};

/**
 * The back wall with a hole where each case's opening is, as a mask for the
 * wall's own element (its box is WALL_W × WALL_H vw): the full wall, and one
 * rectangle per case taken away from it.
 */
export function wallHolesMask(
  guitars: StageGuitar[],
): CSSProperties | undefined {
  if (guitars.length === 0) return undefined;
  const spots = CASE_SPOTS[guitars.length] ?? [];
  const holes = guitars.map((guitar, i) => openingOnWall(guitar, spots[i]));
  const images = [
    "linear-gradient(#000, #000)",
    ...holes.map(() => "linear-gradient(#000, #000)"),
  ].join(", ");
  const sizes = ["100% 100%", ...holes.map((r) => `${r.w}vw ${r.h}vw`)].join(
    ", ",
  );
  const places = [
    "0 0",
    ...holes.map((r) => `${r.x - r.w / 2}vw ${r.y - r.h / 2}vw`),
  ].join(", ");
  // Holes never overlap, so each one taken out of the wall below it leaves the wall less that hole.
  const composite = holes.map(() => "exclude").join(", ");
  return {
    maskImage: images,
    WebkitMaskImage: images,
    maskSize: sizes,
    WebkitMaskSize: sizes,
    maskPosition: places,
    WebkitMaskPosition: places,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskComposite: composite,
    WebkitMaskComposite: holes.map(() => "xor").join(", "),
  };
}
