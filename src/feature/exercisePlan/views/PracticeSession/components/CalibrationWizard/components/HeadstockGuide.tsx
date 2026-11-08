import { motion } from "framer-motion";
import { mirrorStyle, uprightTransform, useIsLeftHanded } from "hooks/useHandedness";
import Image from "next/image";
import { memo } from "react";

import type { GuitarString } from "../calibration.constants";

/**
 * The headstock art (public/images/setup/headstock-3x3.webp) is a generated
 * illustration of a 3+3 headstock, checked by hand to carry exactly six pegs
 * and six strings. Everything that marks a string is drawn over it here, in
 * the image's own pixel space, from points measured on the art itself.
 */
const SRC = "/images/setup/headstock-3x3.webp";
const W = 784;
const H = 954;

interface StringArt {
  /** Centre of the tuner button, the part you turn. */
  knob: [number, number];
  /** Which side of the headstock the button sticks out of. */
  side: "left" | "right";
  /** The string from its post down over the nut and off the bottom. */
  path: [number, number][];
}

/** By string number (1 = thinnest). Low strings on the left, as seen facing the guitar. */
const ART: Record<number, StringArt> = {
  6: { knob: [140, 497], side: "left", path: [[276, 497], [282, 570], [287, 650], [290, 720], [290, 954]] },
  5: { knob: [155, 350], side: "left", path: [[291, 350], [300, 410], [318, 570], [328, 650], [334, 720], [334, 954]] },
  4: { knob: [166, 199], side: "left", path: [[296, 199], [313, 250], [335, 410], [356, 570], [367, 650], [374, 720], [374, 954]] },
  3: { knob: [606, 199], side: "right", path: [[479, 199], [465, 250], [446, 410], [428, 570], [419, 650], [414, 720], [414, 954]] },
  2: { knob: [618, 350], side: "right", path: [[486, 350], [480, 410], [465, 570], [457, 650], [453, 720], [453, 954]] },
  1: { knob: [639, 497], side: "right", path: [[501, 497], [499, 570], [495, 650], [493, 720], [493, 954]] },
};

/** A tuner button on the art is an upright oval. */
const KNOB_RX = 39;
const KNOB_RY = 46;

const toPoints =(path: [number, number][]) => path.map(([x, y]) => `${x},${y}`).join(" ");

/** Only a six-string guitar matches the art; anything else shows no headstock. */
export const hasHeadstockArt = (strings: GuitarString[]) =>
  strings.length === 6 && strings.every((s) => ART[s.id]);

/**
 * Which string and which tuner: the current string lit along its whole length
 * with its tuner ringed and named, strings already tuned traced in green.
 */
// Memoised: the tuning step re-renders ~20×/s with the tuner, the headstock
// only when the string or its in-tune state changes.
export const HeadstockGuide = memo(function HeadstockGuide({
  strings, currentId, tuned, inTune,
}: {
  strings: GuitarString[];
  currentId: number;
  /** Tuned strings, by string id. */
  tuned: Record<number, true>;
  /** The current string reads in tune right now. */
  inTune: boolean;
}) {
  const leftHanded = useIsLeftHanded();
  const current = ART[currentId];
  const currentName = strings.find((s) => s.id === currentId)?.name ?? "";
  const accent = inTune ? "#34d399" : "#fafafa";
  const labelX = current.side === "left" ? current.knob[0] - 104 : current.knob[0] + 104;

  return (
    <div
      className="relative mx-auto aspect-[784/954] h-full max-h-[340px] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
      style={{ transform: mirrorStyle(leftHanded) }}
    >
      <Image src={SRC} alt="" fill sizes="280px" className="select-none object-contain" draggable={false} priority />
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
        {strings.map((s) =>
          tuned[s.id] && s.id !== currentId ? (
            <polyline key={s.id} points={toPoints(ART[s.id].path)} fill="none" stroke="#10b981" strokeOpacity={0.7} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          ) : null,
        )}

        <motion.polyline
          key={currentId}
          points={toPoints(current.path)}
          fill="none"
          stroke={accent}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
        {/* The other tuners: tuned ones green with a tick, the rest dimmed so
            the one to turn stands out. */}
        {strings.map((s) => {
          if (s.id === currentId) return null;
          const [cx, cy] = ART[s.id].knob;
          return tuned[s.id] ? (
            <g key={s.id}>
              <ellipse cx={cx} cy={cy} rx={KNOB_RX} ry={KNOB_RY} fill="#10b981" />
              <path
                d={`M ${cx - 13} ${cy + 1} l 9 10 l 18 -20`}
                fill="none"
                stroke="#022c22"
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ) : (
            <ellipse key={s.id} cx={cx} cy={cy} rx={KNOB_RX} ry={KNOB_RY} fill="#09090b" fillOpacity={0.55} />
          );
        })}

        {/* The tuner to turn: lit, ringed, and pulsing outwards. */}
        <ellipse cx={current.knob[0]} cy={current.knob[1]} rx={KNOB_RX} ry={KNOB_RY} fill={accent} fillOpacity={0.35} />
        {/* Scale + opacity only, so the pulse can run off the main thread. */}
        <motion.circle
          key={`pulse-${currentId}`}
          cx={current.knob[0]}
          cy={current.knob[1]}
          r={KNOB_RY + 6}
          fill="none"
          stroke={accent}
          strokeWidth={5}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <circle cx={current.knob[0]} cy={current.knob[1]} r={KNOB_RY + 6} fill="none" stroke={accent} strokeWidth={7} />

        <g transform={uprightTransform(labelX, leftHanded)}>
          <rect x={labelX - 46} y={current.knob[1] - 26} width={92} height={52} rx={10} fill={accent} />
          <text x={labelX} y={current.knob[1] + 11} textAnchor="middle" fontSize={32} fontWeight={700} fill="#09090b">
            {currentName}
          </text>
        </g>
      </svg>
    </div>
  );
});
