import {
  type BannerParticleKind,
  PARTICLES,
} from "feature/cosmetics/data/bannerParticles";
import { type CanvasSetup, runCanvas, seeded } from "feature/cosmetics/utils/canvasLoop";
import { useEffect, useRef } from "react";

/** Sparks, snow, rain… drifting over a painted banner. */
const particleSetup =
  (kind: BannerParticleKind): CanvasSetup =>
  (g, width, height) => {
    const cfg = PARTICLES[kind];
    const random = seeded(cfg.count * 7 + kind.length);
    const between = ([lo, hi]: [number, number]) => lo + random() * (hi - lo);
    const particles = Array.from({ length: cfg.count }, () => ({
      x: random(),
      y: random(),
      vx: between(cfg.vx),
      vy: between(cfg.vy),
      size: between(cfg.size),
      alpha: between(cfg.alpha),
      color: cfg.colors[Math.floor(random() * cfg.colors.length)],
      speed: 0.6 + random() * 2.4,
      phase: random() * Math.PI * 2,
    }));

    // Only the right two-thirds, fading in, so nothing moves behind the name.
    const left = width * 0.3;
    const span = width - left + 20;
    const tall = height + 20;

    return (seconds) => {
      g.clearRect(0, 0, width, height);
      g.globalCompositeOperation = "lighter";

      for (const p of particles) {
        const x = left + ((((p.x * span + p.vx * seconds) % span) + span) % span);
        const y = ((((p.y * tall + p.vy * seconds) % tall) + tall) % tall) - 10;
        const edge = Math.min(1, (x - left) / (width * 0.22));
        const twinkle = 0.55 + 0.45 * Math.sin(seconds * p.speed + p.phase);
        g.globalAlpha = Math.max(0, Math.min(1, p.alpha * twinkle * edge));
        g.fillStyle = p.color;

        if (cfg.streak) {
          g.save();
          g.translate(x, y);
          g.rotate(Math.atan2(p.vy, p.vx));
          g.fillRect(-cfg.streak, -p.size / 2, cfg.streak * 2, p.size);
          g.restore();
        } else {
          g.beginPath();
          g.arc(x, y, p.size, 0, Math.PI * 2);
          g.fill();
        }
      }

      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    };
  };

export const BannerParticles = ({ kind }: { kind: BannerParticleKind }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => runCanvas(canvasRef.current, particleSetup(kind)), [kind]);

  return <canvas ref={canvasRef} aria-hidden className='absolute inset-0 h-full w-full' />;
};
