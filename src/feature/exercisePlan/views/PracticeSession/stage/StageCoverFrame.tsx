import { GLASS_STREAK } from "feature/arsenal/components/Rig/RackScene";
import { useState } from "react";

import { Piece, surface, WALL_H, WALL_TOP, WALL_Z } from "./StageWallCases";

const ART = "/static/images/session/stage-studio";

/*
 * The song's cover, framed and hung in the middle of the back wall — above the
 * score, between the lamp and the cases. A real picture frame in the room's 3D
 * space (vw): a satin-black moulding standing FRAME_DEPTH off the wall, a wide
 * off-white mat with a bevelled window, the cover behind it, glass in front,
 * and the frame's shadow on the slats. Lit by a brass picture light over it —
 * its photograph from ComfyUI, like the rest of the room.
 */
/** The frame's middle, as a share of the wall's height: high enough to clear the score. */
export const COVER_FRAME_MIDDLE = 0.3;
const SIZE = 14.5;
const MOULDING = 0.85;
const COVER = 8.4;
const FRAME_DEPTH = 1.1;
/** How far the mat's window is cut: the white core of the bevel shows round the cover. */
const BEVEL = 0.14;
/** The picture light: its photograph is 640 × 163; how wide it hangs, how far it reaches out, how high over the frame. */
const LIGHT_W = 9.6;
const LIGHT_H = (LIGHT_W * 163) / 640;
const LIGHT_REACH = 2.4;
const LIGHT_ABOVE = 0.55;

/** A satin-black moulding side, lit by the downlight above in proportion to how much it faces up. */
const SIDE_TONES = {
  top: ["#3d3631", "#1a1714"],
  bottom: ["#0b0a09", "#060505"],
  side: ["#1f1b18", "#0e0c0b"],
} as const;

const FrameSides = () => {
  const half = FRAME_DEPTH / 2;
  const edge = SIZE / 2;
  const fill = ([front, back]: readonly [string, string], to: string) => ({
    background: `linear-gradient(${to}, ${front}, ${back})`,
    filter: surface(1),
  });
  return (
    <>
      <Piece
        y={-edge}
        z={half}
        w={SIZE}
        h={FRAME_DEPTH}
        turn='rotateX(90deg)'
        style={fill(SIDE_TONES.top, "to top")}
      />
      <Piece
        y={edge}
        z={half}
        w={SIZE}
        h={FRAME_DEPTH}
        turn='rotateX(-90deg)'
        style={fill(SIDE_TONES.bottom, "to bottom")}
      />
      <Piece
        x={-edge}
        z={half}
        w={FRAME_DEPTH}
        h={SIZE}
        turn='rotateY(-90deg)'
        style={fill(SIDE_TONES.side, "to left")}
      />
      <Piece
        x={edge}
        z={half}
        w={FRAME_DEPTH}
        h={SIZE}
        turn='rotateY(90deg)'
        style={fill(SIDE_TONES.side, "to right")}
      />
    </>
  );
};

interface StageCoverFrameProps {
  coverUrl: string;
  title: string;
}

/**
 * The framed cover on the studio's back wall. Renders nothing once the cover
 * fails to load — an empty frame on the wall would look broken.
 */
export const StageCoverFrame = ({ coverUrl, title }: StageCoverFrameProps) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  const y = WALL_TOP + COVER_FRAME_MIDDLE * WALL_H;
  const matSize = SIZE - MOULDING * 2;
  return (
    <div
      className='pointer-events-none absolute left-0 top-0 h-0 w-0'
      style={{
        transform: `translate3d(0vw, ${y}vw, ${WALL_Z}vw)`,
        transformStyle: "preserve-3d",
      }}>
      {/* The frame's shadow on the slats: it stands off the wall and the light is above, so it falls below it. */}
      <Piece
        z={0.02}
        w={SIZE}
        h={SIZE}
        style={{
          boxShadow:
            "0.2vw 0.95vw 1.5vw rgba(0,0,0,0.72), 0 0.25vw 0.4vw rgba(0,0,0,0.55)",
        }}
      />
      {/* The picture light's wash on the wall round the top of the frame. */}
      <Piece
        y={-SIZE * 0.32}
        z={0.01}
        w={SIZE * 1.6}
        h={SIZE * 0.95}
        style={{
          background:
            "radial-gradient(ellipse 42% 38% at 50% 20%, rgba(255,214,160,0.16), rgba(255,214,160,0.04) 55%, rgba(255,214,160,0) 100%)",
        }}
      />
      <FrameSides />
      {/* The front: moulding, mat and cover in one plane, lit from the top. */}
      <Piece
        z={FRAME_DEPTH}
        w={SIZE}
        h={SIZE}
        style={{
          background:
            "linear-gradient(to bottom, #2a2521 0%, #151210 45%, #0b0a09 100%)",
          // A hairline of light along the moulding's top edge, where the downlight catches it.
          boxShadow:
            "inset 0 0.07vw 0 rgba(255,234,206,0.32), inset 0 -0.05vw 0 rgba(0,0,0,0.6)",
          filter: surface(1),
        }}>
        <div
          className='absolute overflow-hidden'
          style={{
            inset: `${MOULDING}vw`,
            // Off-white museum board, warmer and darker in this light than on paper.
            backgroundColor: "#b3a996",
            // The picture light is just above: brightest at the top, falling off down the board.
            backgroundImage:
              "radial-gradient(ellipse 70% 42% at 50% 0%, rgba(255,222,172,0.34), rgba(255,222,172,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.42) 100%)",
            // The moulding's lip throws a band of shadow onto the mat's top edge.
            boxShadow:
              "inset 0 0.32vw 0.45vw rgba(0,0,0,0.5), inset 0.12vw 0 0.3vw rgba(0,0,0,0.25), inset -0.12vw 0 0.3vw rgba(0,0,0,0.25)",
          }}>
          {/* The bevelled window: the board's white core showing round the cover, lit on its lower edge (it faces up). */}
          <div
            className='absolute'
            style={{
              left: `${(matSize - COVER) / 2 - BEVEL}vw`,
              top: `${(matSize - COVER) / 2 - BEVEL}vw`,
              width: `${COVER + BEVEL * 2}vw`,
              height: `${COVER + BEVEL * 2}vw`,
              background:
                "linear-gradient(to bottom, #b9b1a2 0%, #e7e0d2 100%)",
            }}>
            {/* A plain img: it lives on a CSS 3D plane, and next/image's box would fight the transform. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={title}
              draggable={false}
              referrerPolicy='no-referrer'
              onError={() => setFailed(true)}
              className='absolute object-cover'
              style={{
                inset: `${BEVEL}vw`,
                width: `${COVER}vw`,
                height: `${COVER}vw`,
                filter: "saturate(0.88) brightness(0.86)",
              }}
            />
            {/* The bevel's top edge shades the top of the cover. */}
            <div
              className='absolute'
              style={{
                inset: `${BEVEL}vw`,
                boxShadow: "inset 0 0.18vw 0.3vw rgba(0,0,0,0.45)",
              }}
            />
          </div>
        </div>
      </Piece>
      {/* The picture light, reaching out over the frame on its arms. */}
      <Piece
        y={-SIZE / 2 - LIGHT_ABOVE}
        z={FRAME_DEPTH + LIGHT_REACH}
        w={LIGHT_W}
        h={LIGHT_H}
        style={{
          background: `url(${ART}/picture-light.webp) center / contain no-repeat`,
          filter: `${surface(0.82)} drop-shadow(0 0.5vw 0.5vw rgba(0,0,0,0.45))`,
        }}
      />
      {/* The glass: two faint streaks and a sheen that is a little stronger toward the top, under the light. */}
      <Piece
        z={FRAME_DEPTH + 0.03}
        w={SIZE - MOULDING * 2}
        h={SIZE - MOULDING * 2}
        style={{
          background: [
            GLASS_STREAK,
            "linear-gradient(to bottom, rgba(255,240,222,0.06), rgba(255,240,222,0) 45%)",
          ].join(", "),
        }}
      />
    </div>
  );
};
