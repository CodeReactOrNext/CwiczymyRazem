import type { RackLookId } from "feature/arsenal/data/boardSkins";
import type { RackMotes as MoteKind } from "feature/arsenal/utils/rackLookArt";
import {
  RACK_LOOK_ART,
  RACK_NEON_TUBE_SRC,
  rackSceneSrc,
} from "feature/arsenal/utils/rackLookArt";
import type { MotionValue } from "framer-motion";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

/** Fades a layer out toward the bottom-left and bottom-right of the beam. */
export const LAMP_MASK =
  "radial-gradient(ellipse 34% 62% at 50% 0%, #000 0%, rgba(0,0,0,0.65) 45%, transparent 100%)";

/** The corners of the niche, a touch darker than the photograph left them. */
const SCENE_VIGNETTE =
  "radial-gradient(100% 100% at 50% 42%, transparent 45%, rgba(0,0,0,0.55) 100%)";

/** A reflection across a pane of glass: one bright streak and a faint second. */
export const GLASS_STREAK =
  "linear-gradient(112deg, transparent 22%, rgba(255,255,255,0.075) 28%, rgba(255,255,255,0.02) 36%, transparent 37%, transparent 63%, rgba(255,255,255,0.04) 66%, transparent 71%)";

/** How the neon tube stutters every few seconds, as fractions of full light. */
const NEON_BUZZ = [1, 1, 0.3, 1, 0.55, 1, 1];
const NEON_BUZZ_TIMES = [0, 0.9, 0.915, 0.93, 0.95, 0.965, 1];

const MOTE_COUNT = 26;

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
}

const newMote = (kind: MoteKind): Mote => ({
  // Dust keeps to the beam; petals and bubbles use the whole width.
  x: kind === "dust" ? 0.5 + (Math.random() - 0.5) * 0.5 : Math.random(),
  y: Math.random() * 0.85,
  r: 0.6 + Math.random() * 1.3,
  vx: (Math.random() - 0.5) * 0.00018,
  vy: 0.00008 + Math.random() * 0.00022,
  phase: Math.random() * Math.PI * 2,
});

/**
 * What drifts through a scene: dust in the lamp's beam, bubbles rising through
 * the tank, petals coming down from the branches. A couple of dozen specks on
 * a canvas, stopped whenever the bay is off screen.
 */
const RackMotes = ({ kind }: { kind: MoteKind }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    const motes = Array.from({ length: MOTE_COUNT }, () => newMote(kind));
    let frame = 0;
    let visible = false;

    const fit = () => {
      canvas.width = Math.round(canvas.clientWidth);
      canvas.height = Math.round(canvas.clientHeight);
    };

    const draw = (t: number) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const mote of motes) {
        if (kind === "petals") {
          mote.x += Math.sin(t / 1300 + mote.phase) * 0.0006;
          mote.y += mote.vy * 4;
          if (mote.y > 0.95) {
            mote.y = -0.02;
            mote.x = Math.random();
          }
          ctx.save();
          ctx.translate(mote.x * width, mote.y * height);
          ctx.rotate(t / 900 + mote.phase);
          ctx.fillStyle = "rgba(255,150,185,0.75)";
          ctx.beginPath();
          ctx.ellipse(0, 0, mote.r * 2.4, mote.r * 1.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }

        let alpha: number;
        if (kind === "bubbles") {
          mote.x += Math.sin(t / 700 + mote.phase) * 0.0004;
          mote.y -= mote.vy * 6;
          if (mote.y < 0.06) {
            mote.y = 0.9;
            mote.x = 0.12 + Math.random() * 0.76;
          }
          alpha = 0.16 + 0.2 * Math.min(1, (mote.y - 0.06) * 4);
        } else {
          mote.x += mote.vx + Math.sin(t / 2400 + mote.phase) * 0.00012;
          mote.y += mote.vy;
          if (mote.y > 0.9) {
            mote.y = 0.02;
            mote.x = 0.5 + (Math.random() - 0.5) * 0.3;
          }
          // Brightest on the lamp's axis, gone at the edge of its cone.
          const offAxis = Math.abs(mote.x - 0.5) / (0.08 + mote.y * 0.3);
          alpha =
            Math.max(0, 1 - offAxis) *
            (0.25 + 0.35 * Math.sin(t / 900 + mote.phase) ** 2) *
            (1 - mote.y * 0.7);
        }
        if (alpha <= 0.01) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.arc(mote.x * width, mote.y * height, mote.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (visible) frame = requestAnimationFrame(draw);
    };

    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(canvas);
    const sight = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry?.isIntersecting ?? false;
      if (visible && !wasVisible) frame = requestAnimationFrame(draw);
    });
    sight.observe(canvas);

    return () => {
      visible = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      sight.disconnect();
    };
  }, [kind]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className='pointer-events-none absolute inset-0 z-[12] h-full w-full mix-blend-screen'
    />
  );
};

interface RackSceneProps {
  look: RackLookId;
  /** The guitar's rarity (`#rrggbb`). Absent on an empty bay: a plain lamp. */
  color?: string;
  /** How hard the lamp is driven right now; `1` is a lit, occupied bay. */
  level: MotionValue<number>;
}

/**
 * A display case: the photographed niche a bay shows in place of the stock
 * dark wall, and the lamp's rarity colour mixed into it.
 *
 * The photograph already has a lamp, a beam and a floor — all white. The
 * colour is three blended layers over it: one that recolours the fixture and
 * the top of the beam, a wash down the wall, and a pool on the floor. The
 * whole case is dimmed by `level`, so it goes dark and stutters on with the
 * bay's lamp exactly as the stock wall does.
 */
export const RackScene = ({ look, color, level }: RackSceneProps) => {
  const art = RACK_LOOK_ART[look];
  const reduceMotion = useReducedMotion();
  // A dim empty bay still has to show what case it is, so the scene falls off
  // slower than the lamp does.
  const dimmed = useTransform(level, (s) =>
    s >= 1 ? "none" : `brightness(${0.08 + 0.92 * Math.sqrt(Math.max(0, s))})`,
  );
  const frontOpacity = useTransform(level, (s) => Math.min(1, s * 1.2));
  const glow = art.glow;
  const glowMotion =
    !glow || reduceMotion
      ? undefined
      : glow.motion === "breathe"
        ? {
            animate: { opacity: [0.55, 0.9, 0.62, 1, 0.7, 0.55] },
            transition: {
              duration: glow.period,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          }
        : {
            animate: { x: ["-6%", "6%"], scale: [1.05, 1.15] },
            transition: {
              duration: glow.period,
              repeat: Infinity,
              repeatType: "mirror" as const,
              ease: "easeInOut" as const,
            },
          };
  const glowLayer = glow && (
    <motion.div
      className={
        glow.front
          ? "pointer-events-none absolute inset-0 z-[11] mix-blend-screen"
          : "pointer-events-none absolute inset-0 mix-blend-screen"
      }
      style={{ background: glow.background }}
      {...glowMotion}
    />
  );

  return (
    <>
      {/* Everything behind the guitar, dimmed together by the lamp. */}
      <motion.div
        className='pointer-events-none absolute inset-0'
        style={{ filter: dimmed }}>
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{ backgroundImage: `url(${rackSceneSrc(look)})` }}
        />
        {color && (
          <>
            <div
              className='absolute inset-0 mix-blend-color'
              style={{
                background: color,
                opacity: art.tint.lamp,
                maskImage: LAMP_MASK,
                WebkitMaskImage: LAMP_MASK,
              }}
            />
            <div
              className='absolute inset-0 mix-blend-soft-light'
              style={{
                background: `radial-gradient(95% 85% at 50% 8%, ${color} 0%, ${color}73 45%, transparent 80%)`,
                opacity: art.tint.wash,
              }}
            />
            <div
              className='absolute inset-x-0 bottom-0 h-[22%] mix-blend-overlay'
              style={{
                background: `radial-gradient(50% 90% at 50% 70%, ${color}, transparent 100%)`,
                opacity: art.tint.pool,
              }}
            />
          </>
        )}
        <div
          className='absolute inset-0'
          style={{ background: SCENE_VIGNETTE }}
        />
        {!glow?.front && glowLayer}
        {art.neon && (
          <motion.div
            className='absolute inset-0 mix-blend-screen'
            style={{
              backgroundImage: `url(${RACK_NEON_TUBE_SRC})`,
              backgroundSize: "195% 104%",
              backgroundPosition: "50% 40%",
              backgroundRepeat: "no-repeat",
            }}
            {...(reduceMotion
              ? undefined
              : {
                  animate: { opacity: NEON_BUZZ },
                  transition: {
                    duration: 6,
                    times: NEON_BUZZ_TIMES,
                    repeat: Infinity,
                    ease: "linear" as const,
                  },
                })}>
            {/* The photographed tube is white; this is what colours it. */}
            <div
              className='absolute inset-0 mix-blend-multiply'
              style={{
                background: `color-mix(in srgb, ${color ?? "#ffffff"} 82%, #ffffff)`,
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* What sits in front of the guitar: mist, drifting specks, the glass. */}
      {(glow?.front || art.motes || art.glass) && (
        <motion.div
          className='pointer-events-none absolute inset-0 z-[11]'
          style={{ opacity: frontOpacity }}>
          {glow?.front && glowLayer}
          {art.motes && !reduceMotion && <RackMotes kind={art.motes} />}
          {art.glass && (
            <div
              className='absolute inset-0'
              style={{ background: GLASS_STREAK }}
            />
          )}
        </motion.div>
      )}
    </>
  );
};
