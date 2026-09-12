import { cn } from "assets/lib/utils";
import type { KnobProps } from "feature/toneStudio/components/Knob";
import { Knob } from "feature/toneStudio/components/Knob";
import { useElementWidth } from "feature/toneStudio/hooks/useElementWidth";
import { ACCENT_HEX } from "feature/toneStudio/utils/chassis";
import {
  PEDAL_ASPECT,
  PEDAL_FOOTSWITCH,
  PEDAL_KNOBS,
  PEDAL_LED,
} from "feature/toneStudio/utils/gearArt";

/** Width the pedal is drawn at before anything has measured it — the size it
 *  settles on in a full-width window, so the first paint is already right. */
const NOMINAL_WIDTH = 340;

/** A control standing on the pedal. Size, face and ink are the pedal's to
 *  decide, since they follow from the artwork. */
export type PedalKnob = Omit<
  KnobProps,
  "size" | "face" | "faceAspect" | "ring" | "ink"
>;

interface PedalFaceProps {
  src: string;
  /** Lamp colour. The render paints the lamp unlit, so engaging the pedal
   *  lights it. */
  accent: "orange" | "amber" | "cyan";
  engaged: boolean;
  /** Thrown by the footswitch, and only by the footswitch. */
  onToggle: () => void;
  /** The controls, in the order the caps are painted on, left to right. At
   *  most as many as the render has caps (PEDAL_KNOBS). */
  knobs?: PedalKnob[];
  className?: string;
}

/**
 * A stompbox with its controls standing on it.
 *
 * The renders carry their knobs already — blank-capped, lit by the same lamp
 * as the enclosure — and every part's position is measured out of the file
 * (see PEDAL_KNOBS, PEDAL_LED, PEDAL_FOOTSWITCH) rather than eyeballed. So a
 * dial's pointer lands on its painted cap at any drawn size, and the knobs are
 * exactly as big as the artwork says they are: nothing to fit, nothing to
 * overflow.
 *
 * Only the footswitch switches the pedal. The whole enclosure used to be one
 * big button, which meant a knob-grab that landed a few pixels wide flipped the
 * bypass instead — the pedal is a picture of a thing with a switch on it, not a
 * switch shaped like a pedal.
 */
export const PedalFace = ({
  src,
  accent,
  engaged,
  onToggle,
  knobs = [],
  className,
}: PedalFaceProps) => {
  const [ref, measuredWidth] = useElementWidth<HTMLDivElement>();
  const width = measuredWidth || NOMINAL_WIDTH;
  const knobSize = Math.round(width * PEDAL_KNOBS.diameter);

  return (
    <div ref={ref} className={cn("relative shrink-0", className)}>
      <img
        src={src}
        alt=''
        draggable={false}
        className='w-full select-none'
        style={{
          aspectRatio: PEDAL_ASPECT,
          filter: "drop-shadow(0 12px 22px rgba(0,0,0,0.55))",
        }}
      />

      {/* The lamp lit: a hot core over the jewel, a halo on the metal around
          it. Off, the jewel stays as painted — dark glass. */}
      <span
        aria-hidden
        className='pointer-events-none absolute rounded-full transition-opacity duration-200'
        style={{
          left: `${PEDAL_LED.cx * 100}%`,
          top: `${PEDAL_LED.cy * 100}%`,
          width: `${PEDAL_LED.diameter * 300}%`,
          aspectRatio: 1,
          transform: "translate(-50%, -50%)",
          opacity: engaged ? 1 : 0,
          background: `radial-gradient(circle, #fff6e8 0%, ${ACCENT_HEX[accent]} 12%, ${ACCENT_HEX[accent]}99 22%, ${ACCENT_HEX[accent]}33 40%, transparent 68%)`,
        }}
      />

      {/* The switch itself: sits exactly over the drawn one, and presses in
          when you use it. Nothing else on the enclosure is clickable. */}
      <button
        type='button'
        onClick={onToggle}
        title={engaged ? "Bypass this pedal" : "Engage this pedal"}
        className='group absolute rounded-full transition-transform active:scale-90'
        style={{
          left: `${PEDAL_FOOTSWITCH.left * 100}%`,
          top: `${PEDAL_FOOTSWITCH.top * 100}%`,
          width: `${PEDAL_FOOTSWITCH.width * 100}%`,
          height: `${PEDAL_FOOTSWITCH.height * 100}%`,
        }}>
        <span
          aria-hidden
          className='absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100'
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 68%)",
          }}
        />
      </button>

      {knobs.slice(0, PEDAL_KNOBS.cx.length).map((knob, i) => (
        <div
          key={knob.label}
          className='absolute'
          style={{
            left: `${PEDAL_KNOBS.cx[i] * 100}%`,
            top: `${PEDAL_KNOBS.cy * 100}%`,
            // Centre the dial on the painted cap (a painted dial is exactly
            // the cap's size, nothing around it); the label hangs under it.
            transform: `translate(-50%, ${-knobSize / 2}px)`,
          }}>
          <Knob
            {...knob}
            size={knobSize}
            face='painted'
            faceAspect={PEDAL_KNOBS.faceAspect}
            ink='dark'
          />
        </div>
      ))}
    </div>
  );
};
