import styles from "feature/cosmetics/components/drawnBanners.module.css";
import type { DrawnLook } from "feature/cosmetics/types/cosmetics.types";
import { type CanvasSetup, runCanvas, seeded } from "feature/cosmetics/utils/canvasLoop";
import { useColorTheme } from "lib/colorTheme/colorTheme";
import { type CSSProperties, useEffect, useId, useMemo, useRef } from "react";

/**
 * The banners drawn in code instead of painted: foil, bokeh, a record…
 *
 * Unlike the paintings these work on both themes — the card under them stays
 * the player's normal card, and every colour is picked twice, once for the
 * near-black card and once for the white one. Each look lives in the right
 * part of the card and fades out before the text, the way the paintings do.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const fade = (from: number, to: number, angle = 90): CSSProperties => {
  const mask = `linear-gradient(${angle}deg, transparent ${from}%, #000 ${to}%)`;
  return { WebkitMaskImage: mask, maskImage: mask };
};

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, "");

/* ───────────────────────────── canvases ───────────────────────────── */

const Canvas = ({ setup, style }: { setup: CanvasSetup; style?: CSSProperties }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => runCanvas(ref.current, setup), [setup]);
  return <canvas ref={ref} aria-hidden className='absolute inset-0 h-full w-full' style={style} />;
};

/** Spectrum analyser in LEDs, falling away towards the text. Steps ten times a second. */
const ledSetup =
  (dark: boolean): CanvasSetup =>
  (g, width, height) => {
    const pitch = 10;
    const dot = 2.6;
    const columns = Math.ceil((width * 0.6) / pitch);
    const rows = Math.floor((height - 6) / pitch);
    const random = seeded(5);
    const cols = Array.from({ length: columns }, () => ({ p: random() * 9, q: random() * 9 }));
    const off = dark ? "rgba(255,255,255,0.07)" : "rgba(24,24,27,0.08)";
    const lit = (row: number) =>
      row < 5
        ? dark ? "#34d399" : "#10b981"
        : row < 8
          ? dark ? "#fbbf24" : "#f59e0b"
          : dark ? "#fb7185" : "#f43f5e";
    let last = -1;

    return (seconds) => {
      const step = Math.floor(seconds / 0.095);
      if (step === last) return;
      last = step;
      const s = step * 0.095;
      g.clearRect(0, 0, width, height);

      cols.forEach((c, i) => {
        const k = i / columns;
        const env = Math.pow(1 - k, 0.75) * (0.72 + 0.28 * Math.sin(i * 0.33 + 1.2));
        const v =
          0.62 +
          0.24 * Math.sin(s * 2.1 + c.p + i * 0.5) +
          0.2 * Math.sin(s * 5.3 + c.q) +
          0.1 * Math.sin(s * 9.7 + i);
        const on = Math.max(1, Math.round(Math.max(0, v) * env * 11));
        const x = width - 9 - i * pitch - pitch / 2;
        // Fades in from the left of the analyser, like every other look.
        g.globalAlpha = Math.min(1, (1 - k) * 2.2);

        for (let r = 0; r < rows; r++) {
          const y = height - 6 - r * pitch - pitch / 2;
          g.fillStyle = r < on ? lit(r) : off;
          g.beginPath();
          g.arc(x, y, dot, 0, Math.PI * 2);
          g.fill();
        }
      });
      g.globalAlpha = 1;
    };
  };

/** Concert-poster halftone gathering in the top right corner, slowly breathing. */
const halftoneSetup =
  (dark: boolean): CanvasSetup =>
  (g, width, height) => {
    const pitch = 8.5;
    const grad = g.createLinearGradient(width * 0.45, 0, width, height);
    grad.addColorStop(0, dark ? "rgba(251,146,60,.6)" : "rgba(249,115,22,.5)");
    grad.addColorStop(1, dark ? "rgba(244,63,94,.72)" : "rgba(225,29,72,.6)");

    return (seconds) => {
      g.clearRect(0, 0, width, height);
      g.fillStyle = grad;
      g.beginPath();
      const reach = Math.max(width * 0.44, 230);
      const phase = (seconds * 1000) / 2600;
      let row = 0;
      for (let y = -pitch; y < height + pitch; y += pitch / 2, row++) {
        for (let x = width + pitch - (row % 2 ? pitch / 2 : 0); x > width - reach - pitch; x -= pitch) {
          const dx = (width - x) / reach;
          const dy = y / (height * 1.25);
          const d = Math.sqrt(dx * dx + dy * dy);
          const f = 1 - d + 0.06 * Math.sin(d * 9 - phase) + 0.03 * Math.sin(x * 0.05 + phase * 0.7);
          if (f <= 0.02) continue;
          const radius = Math.min(pitch * 0.36, Math.pow(f, 1.5) * pitch * 0.44);
          if (radius < 0.35) continue;
          g.moveTo(x + radius, y);
          g.arc(x, y, radius, 0, Math.PI * 2);
        }
      }
      g.fill();
    };
  };

/** Gold dust drifting down the right-hand side and glinting. */
const dustSetup =
  (dark: boolean): CanvasSetup =>
  (g, width, height) => {
    const random = seeded(77);
    const colors = dark
      ? ["#fff3c4", "#fde68a", "#fbbf24", "#f0b545", "#d99a2b"]
      : ["#f59e0b", "#eab308", "#d97706", "#fbbf24", "#e8a317"];
    const motes = Array.from({ length: Math.round(width * 0.95) }, () => {
      const u = Math.pow(random(), 2.3);
      return {
        x: width * (1 - u * 0.72) + (random() - 0.5) * 8,
        y: random() * (height + 20) - 10,
        size: random() < 0.07 ? 1.5 + random() * 0.9 : 0.45 + random() * 0.75,
        color: colors[Math.floor(random() * colors.length)],
        alpha: (dark ? 0.35 : 0.5) + random() * 0.6,
        speed: 0.5 + random() * 2.2,
        phase: random() * 6.28,
        vx: -(2 + random() * 5),
        vy: 2 + random() * 6,
        star: random() < 0.035,
      };
    });
    const span = width * 0.78;

    return (seconds) => {
      g.clearRect(0, 0, width, height);
      for (const m of motes) {
        let x = m.x + m.vx * seconds;
        const y = ((m.y + m.vy * seconds + 10) % (height + 20)) - 10;
        x = width - ((((width - x) % span) + span) % span);
        const edge = Math.min(1, Math.max(0, (x - width * 0.22) / (width * 0.3)));
        const twinkle = 0.55 + 0.45 * Math.sin(seconds * m.speed + m.phase);
        g.globalAlpha = Math.min(1, m.alpha * twinkle * edge);
        g.fillStyle = m.color;
        g.beginPath();
        g.arc(x, y, m.size, 0, Math.PI * 2);
        g.fill();
        if (m.star && twinkle > 0.8) {
          const len = 3.2 * (twinkle - 0.8) * 5 * m.size * 0.9;
          g.globalAlpha = Math.min(1, m.alpha * edge * 0.8);
          g.fillRect(x - len, y - 0.3, len * 2, 0.6);
          g.fillRect(x - 0.3, y - len, 0.6, len * 2);
        }
      }
      g.globalAlpha = 1;
    };
  };

/* ───────────────────────────── CSS looks ───────────────────────────── */

const HUES = [188, 232, 278, 330, 28, 150];
const foil = (s: string, l: string, a: number, shift: number) => {
  const stops: string[] = [];
  for (let k = 0; k < 2; k++)
    HUES.forEach((h, i) =>
      stops.push(`hsl(${(h + shift) % 360} ${s} ${l} / ${a}) ${(((k * 6 + i) / 12) * 100).toFixed(2)}%`),
    );
  stops.push(`hsl(${(HUES[0] + shift) % 360} ${s} ${l} / ${a}) 100%`);
  return `linear-gradient(112deg, ${stops.join(", ")})`;
};

const Holo = ({ dark }: { dark: boolean }) => (
  <div
    className={styles.layer}
    style={
      {
        ...fade(22, 78, 100),
        "--foil": dark ? foil("55%", "55%", 0.2, 0) : foil("85%", "82%", 0.7, 0),
        "--foil2": dark ? foil("85%", "72%", 0.7, 120) : foil("80%", "60%", 0.42, 120),
        "--sh": dark ? 0.14 : 0.7,
      } as Vars
    }>
    <div className={styles.foil} />
    <div className={styles.foilDots} />
    <div className={styles.sheen} />
  </div>
);

const Bokeh = ({ dark }: { dark: boolean }) => {
  const discs = useMemo(() => {
    const random = seeded(11);
    const colors = dark
      ? ["251 191 36", "251 146 60", "251 113 133", "192 132 252", "253 224 71"]
      : ["245 158 11", "249 115 22", "244 63 94", "168 85 247", "234 179 8"];
    return Array.from({ length: 13 }, (_, i) => {
      const small = i >= 8;
      const size = small ? 8 + random() * 12 : 44 + random() * 74;
      const opacity = small ? (dark ? 0.5 : 0.45) + random() * 0.3 : (dark ? 0.1 : 0.12) + random() * 0.16;
      return {
        "--x": `${(34 + random() * 68).toFixed(1)}%`,
        "--y": `${(random() * 100).toFixed(1)}%`,
        "--s": `${size.toFixed(0)}px`,
        "--bl": small ? "0.6px" : "1.6px",
        "--c": colors[i % colors.length],
        "--o": opacity.toFixed(2),
        "--blend": dark ? "screen" : "multiply",
        "--dx": `${(-16 + random() * 32).toFixed(0)}px`,
        "--dy": `${(-10 + random() * 20).toFixed(0)}px`,
        "--d": `${(7 + random() * 9).toFixed(1)}s`,
        "--dl": `-${(random() * 12).toFixed(1)}s`,
      } as Vars;
    });
  }, [dark]);

  return (
    <div className={styles.layer} style={fade(12, 60)}>
      <div
        className={styles.layer}
        style={{
          background: dark
            ? "linear-gradient(100deg, transparent 30%, rgb(251 146 60 / .07) 70%, rgb(244 63 94 / .12))"
            : "linear-gradient(100deg, transparent 30%, rgb(253 186 116 / .14) 70%, rgb(253 164 175 / .22))",
        }}
      />
      {discs.map((style, i) => (
        <i key={i} className={styles.disc} style={style} />
      ))}
    </div>
  );
};

const Vinyl = ({ dark }: { dark: boolean }) => {
  const groove = dark ? "rgb(255 255 255 / .045)" : "rgb(24 24 27 / .06)";
  const gap = dark ? "rgb(255 255 255 / .10)" : "rgb(24 24 27 / .10)";
  const ink = dark ? "#1a1408" : "#3b2a08";
  const shine = (a: number, b: number) => `rgb(255 255 255 / ${dark ? a : b})`;

  return (
    <div className={styles.layer} style={fade(46, 70)}>
      <div
        className={styles.record}
        style={
          {
            "--vinyl": [
              `radial-gradient(circle closest-side, transparent 0 51.2%, ${gap} 51.6% 52.2%, transparent 52.6% 66.4%, ${gap} 66.8% 67.3%, transparent 67.7% 80.6%, ${gap} 81% 81.5%, transparent 81.9%)`,
              `repeating-radial-gradient(circle closest-side, transparent 0 1.1px, ${groove} 1.1px 2.2px)`,
              dark
                ? "radial-gradient(circle closest-side, #060607 0, #0d0d0f 36%, #0a0a0b 96.5%, #3a3a40 98%, #0a0a0b 100%)"
                : "radial-gradient(circle closest-side, #d9d9de 0, #e9e9ed 36%, #e2e2e7 96.5%, #ffffff 98%, #cfcfd6 100%)",
            ].join(", "),
            "--vshine": `conic-gradient(from 28deg, transparent 0, ${shine(0.02, 0.2)} 3%, ${shine(0.26, 0.95)} 8%, ${shine(0.03, 0.2)} 14%, transparent 20% 50%, ${shine(0.02, 0.2)} 53%, ${shine(0.2, 0.9)} 58%, transparent 66%)`,
            "--vlabel": [
              `radial-gradient(circle closest-side, var(--card-hole, ${dark ? "#1c1c1f" : "#ffffff"}) 0 7%, ${ink} 7.5% 9%, transparent 9.5%)`,
              `radial-gradient(circle closest-side, transparent 0 40%, ${ink} 40.5% 41.5%, transparent 42% 93%, rgb(${dark ? "0 0 0" : "24 24 27"} / .35) 94% 100%)`,
              `radial-gradient(circle closest-side, ${dark ? "#d6a441" : "#e0a93c"} 0, ${dark ? "#b8862d" : "#c98f26"} 100%)`,
            ].join(", "),
            "--vtext": `conic-gradient(from 0deg, ${ink} 0 17%, transparent 17% 24%, ${ink} 24% 29%, transparent 29% 55%, ${ink} 55% 78%, transparent 78%)`,
          } as Vars
        }>
        <div className={styles.recordShine} />
        <div className={styles.label}>
          <i className={styles.labelPrint} />
        </div>
      </div>
    </div>
  );
};

/* The app's own icon watermark (GuitarPatternBackground's set), tinted and drifting. */
const ICONS = [
  "<path d='m11.9 12.1 4.514-4.514'/><path d='M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z'/><path d='m6 16 2 2'/><path d='M8.23 9.85A3 3 0 0 1 11 8a5 5 0 0 1 5 5 3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4 6 6 0 0 1-6-6 4 4 0 0 1 4-4 2 2 0 0 0 1.85-1.23z'/>",
  "<path d='M9 18V5l12-2v13'/><circle cx='6' cy='18' r='3'/><circle cx='18' cy='16' r='3'/>",
  "<path d='M16 18.5c2-2.5 4-6.5 4-10.5c0-2.946-2.084-4.157-4.204-4.654c-.864-.23-2.13-.346-3.796-.346c-1.667 0-2.932.115-3.796.346c-2.12.497-4.204 1.708-4.204 4.654c0 3.312 2 8 4 10.5c.297.37.618.731.963 1.081l.354.347a3.9 3.9 0 0 0 5.364 0a14.05 14.05 0 0 0 1.319-1.428z'/>",
  "<path d='M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3'/>",
];
const SLOTS = [[20, 20], [100, 40], [40, 100], [110, 110]];

const Pattern = ({ dark }: { dark: boolean }) => {
  const id = svgId(useId());
  const tile = 112;
  const scale = tile / 160;
  const icons = SLOTS.map(
    ([x, y], i) =>
      `<g transform='translate(${(x * scale).toFixed(1)} ${(y * scale).toFixed(1)}) scale(${(scale * 1.25).toFixed(3)})'>${ICONS[i]}</g>`,
  ).join("");
  const markup =
    `<defs><pattern id='${id}' width='${tile}' height='${tile}' patternUnits='userSpaceOnUse' patternTransform='rotate(-15)'>` +
    `<animateTransform attributeName='patternTransform' type='translate' from='0 0' to='${tile} 0' dur='36s' repeatCount='indefinite' additive='sum'/>` +
    `<g fill='none' stroke='${dark ? "#a5f3fc" : "#92400e"}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='${dark ? 0.3 : 0.34}'>${icons}</g>` +
    `</pattern></defs><rect width='100%' height='100%' fill='url(#${id})'/>`;

  return (
    <div className={styles.layer} style={fade(14, 70)}>
      <div
        className={styles.layer}
        style={{
          background: dark
            ? "linear-gradient(100deg, transparent 26%, rgb(92 150 165 / .14) 62%, rgb(34 211 238 / .26))"
            : "linear-gradient(100deg, transparent 26%, rgb(214 170 90 / .14) 62%, rgb(217 119 6 / .24))",
        }}
      />
      <svg className='absolute inset-0 h-full w-full' dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  );
};

/* ───────────────────────────── entry ───────────────────────────── */

const CanvasLook = ({ dark, look }: { dark: boolean; look: "led" | "halftone" | "dust" }) => {
  const setup = useMemo(
    () => (look === "led" ? ledSetup(dark) : look === "halftone" ? halftoneSetup(dark) : dustSetup(dark)),
    [dark, look],
  );

  if (look === "dust")
    return (
      <>
        <div
          className={styles.layer}
          style={{
            background: dark
              ? "linear-gradient(104deg, transparent 42%, rgb(217 160 60 / .07) 72%, rgb(240 190 90 / .14))"
              : "linear-gradient(104deg, transparent 42%, rgb(245 200 110 / .12) 72%, rgb(240 180 80 / .26))",
          }}
        />
        <Canvas setup={setup} />
      </>
    );

  return <Canvas setup={setup} style={look === "led" ? fade(30, 62) : undefined} />;
};

export const DrawnBanner = ({ look }: { look: DrawnLook }) => {
  const dark = useColorTheme() !== "light";

  switch (look) {
    case "holo":
      return <Holo dark={dark} />;
    case "bokeh":
      return <Bokeh dark={dark} />;
    case "vinyl":
      return <Vinyl dark={dark} />;
    case "pattern":
      return <Pattern dark={dark} />;
    default:
      return <CanvasLook dark={dark} look={look} />;
  }
};
