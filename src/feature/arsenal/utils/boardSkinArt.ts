import type { BoardLookId } from "feature/arsenal/data/boardSkins";

/**
 * The board skins, drawn.
 *
 * Each look is a different object — open rails, a slab of walnut, a suitcase —
 * rather than a repaint of the flight case, so each is drawn from scratch
 * around the same hole: the *bay*, which is the supply rail and the deck
 * stacked, in the board's own units (`utils/cableGeometry`). Everything a
 * pedal or a cable is placed against stays exactly where it was; only what
 * surrounds and lies under it changes.
 *
 * Built as an SVG string rather than as JSX. A look is a few hundred static
 * shapes with nothing to diff and nothing a user typed, so it is assembled once
 * per case size, memoised by the caller, and handed to the DOM whole.
 */

interface Margins {
  l: number;
  r: number;
  t: number;
  b: number;
}

/** How far each look reaches past the bay, in board units. */
export const BOARD_LOOK_MARGINS: Record<BoardLookId, Margins> = {
  rail: { l: 7, r: 7, t: 2.5, b: 2.5 },
  wood: { l: 11, r: 11, t: 5, b: 5 },
  tweed: { l: 8.5, r: 8.5, t: 8.5, b: 10.5 },
  road: { l: 8.5, r: 8.5, t: 9, b: 9 },
  steel: { l: 10, r: 10, t: 4, b: 4 },
};

export interface BoardLookArt {
  /** The whole object, bay and margins together. */
  width: number;
  height: number;
  /** Everything inside the `<svg>`. */
  markup: string;
}

interface Frame {
  /** Unique prefix for every id this drawing defines. */
  u: string;
  W: number;
  H: number;
  /** The bay: where the rail and the deck go. */
  bx: number;
  by: number;
  bw: number;
  bh: number;
  /** Where the top row ends and the next begins, if there is a next. */
  step: number | null;
}

type Stop = [offset: number, color: string, opacity?: number];

const n = (value: number) => +value.toFixed(2);

const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  attrs: string,
) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${rx}"` : ""} ${attrs}/>`;

const circle = (x: number, y: number, r: number, attrs: string) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" ${attrs}/>`;

const gradient = (id: string, x2: number, y2: number, stops: Stop[]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(
      ([offset, color, opacity]) =>
        `<stop offset="${offset}%" stop-color="${color}"${opacity != null ? ` stop-opacity="${opacity}"` : ""}/>`,
    )
    .join("")}</linearGradient>`;

/** Noise as paint: one flat colour whose alpha is `gain × noise + bias`. */
const noise = (
  id: string,
  frequency: string,
  octaves: number,
  rgb: [number, number, number],
  gain: number,
  bias: number,
  seed: number,
) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="${octaves}" seed="${seed}"/><feColorMatrix values="0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  ${gain} 0 0 0 ${bias}"/></filter>`;

const screw = (x: number, y: number, r: number, fill: string, turn: number) =>
  circle(x, y, r, `fill="${fill}"`) +
  circle(x, y, r, 'fill="none" stroke="#000" stroke-width="0.14" opacity="0.6"') +
  `<line x1="${n(x - r * 0.62)}" y1="${n(y)}" x2="${n(x + r * 0.62)}" y2="${n(y)}" stroke="#000" stroke-width="0.22" opacity="0.6" transform="rotate(${turn} ${n(x)} ${n(y)})"/>`;

const fillOf = (u: string, name: string) => `fill="url(#${u}${name})"`;

/** Gradients and filters every look shares: metals, light and cast shadows. */
const commonDefs = (u: string) =>
  gradient(`${u}steel`, 0, 1, [
    [0, "#b9bec4"],
    [50, "#6a6f75"],
    [100, "#8d9299"],
  ]) +
  gradient(`${u}brass`, 0, 1, [
    [0, "#f0d896"],
    [50, "#8f6f2e"],
    [100, "#c2a052"],
  ]) +
  gradient(`${u}wt`, 0, 1, [
    [0, "#000000", 0.7],
    [100, "#000000", 0],
  ]) +
  gradient(`${u}wl`, 1, 0, [
    [0, "#000000", 0.55],
    [100, "#000000", 0],
  ]) +
  gradient(`${u}wr`, 1, 0, [
    [0, "#000000", 0],
    [100, "#000000", 0.55],
  ]) +
  gradient(`${u}wb`, 0, 1, [
    [0, "#000000", 0],
    [100, "#000000", 0.4],
  ]) +
  // One key light from the top left, over a whole surface.
  gradient(`${u}gl`, 1, 1, [
    [0, "#ffffff", 0.09],
    [40, "#ffffff", 0],
    [100, "#000000", 0.24],
  ]) +
  `<filter id="${u}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.9"/></filter>` +
  `<filter id="${u}ground" x="-10%" y="-25%" width="120%" height="160%"><feGaussianBlur stdDeviation="1.7"/></filter>`;

/** A tray seen from above: the top wall throws the long shadow, the sides a short one. */
const well = ({ u, bx, by, bw, bh }: Frame) =>
  rect(bx, by, bw, 7.5, 0, fillOf(u, "wt")) +
  rect(bx, by, 3.5, bh, 0, fillOf(u, "wl")) +
  rect(bx + bw - 3.5, by, 3.5, bh, 0, fillOf(u, "wr")) +
  rect(bx, by + bh - 2.5, bw, 2.5, 0, fillOf(u, "wb"));

/** Open aluminium rails on two cast end frames. */
const drawRail = (f: Frame) => {
  const { u, W, H, bx, by, bw, bh } = f;
  const gap = 2.25;
  const count = Math.max(3, Math.round((bh + gap) / 14.45));
  const railH = (bh - (count - 1) * gap) / count;
  const pitch = railH + gap;
  const x0 = bx - 2.2;
  const railW = bw + 4.4;
  const slotH = Math.min(11, railH - 1.2);

  const defs =
    gradient(`${u}rail`, 0, 1, [
      [0, "#9299a2"],
      [5, "#5a5f67"],
      [50, "#4a4e56"],
      [93, "#3c3f46"],
      [100, "#1b1c20"],
    ]) +
    // Brushed metal reflects in bands along its grain, not evenly.
    gradient(`${u}ani`, 1, 0, [
      [0, "#000000", 0.12],
      [14, "#ffffff", 0.14],
      [30, "#ffffff", 0],
      [56, "#ffffff", 0],
      [71, "#ffffff", 0.18],
      [86, "#ffffff", 0],
      [100, "#000000", 0.22],
    ]) +
    gradient(`${u}end`, 0, 1, [
      [0, "#4a4d54"],
      [12, "#2f3136"],
      [88, "#25272b"],
      [100, "#151619"],
    ]) +
    gradient(`${u}sub`, 1, 0, [
      [0, "#2b2d32"],
      [100, "#0c0d0f"],
    ]) +
    noise(`${u}brush`, "0.004 1.6", 2, [1, 1, 1], 0.45, -0.15, 5);

  let body = "";
  // The cross-members under the rails, seen through the gaps.
  [0.19, 0.5, 0.81].forEach((along) => {
    body += rect(bx + bw * along - 2.2, by + 3, 4.4, bh - 6, 0, fillOf(u, "sub"));
  });

  for (let i = 0; i < count; i++) {
    const y = by + i * pitch;
    const mid = y + railH / 2;
    body +=
      rect(x0, y + 0.9, railW, railH, 0.5, 'fill="#000" opacity="0.6"') +
      rect(x0, y, railW, railH, 0.5, fillOf(u, "rail")) +
      rect(x0, y, railW, railH, 0.5, `filter="url(#${u}brush)"`) +
      rect(x0, y, railW, railH, 0.5, fillOf(u, "ani")) +
      // The T-slot every extrusion has down its middle.
      rect(x0, mid - 0.8, railW, 0.25, 0, 'fill="#000" opacity="0.35"') +
      rect(x0, mid - 0.55, railW, 1.1, 0, 'fill="#0b0c0e"') +
      rect(x0, mid + 0.55, railW, 0.22, 0, 'fill="#fff" opacity="0.16"');
  }

  [0, W - 7.4].forEach((x, side) => {
    body +=
      rect(x + 0.3, 0.7, 7.4, H, 2.4, 'fill="#000" opacity="0.5"') +
      rect(x, 0, 7.4, H, 2.4, fillOf(u, "end")) +
      rect(x + (side ? 0.3 : 6.8), 2, 0.3, H - 4, 0, 'fill="#fff" opacity="0.08"') +
      rect(x + 2.5, H / 2 - slotH / 2, 2.4, slotH, 1.2, 'fill="#050506"') +
      rect(
        x + 2.5,
        H / 2 - slotH / 2,
        2.4,
        slotH,
        1.2,
        'fill="none" stroke="#fff" stroke-width="0.18" opacity="0.16"',
      );
    for (let i = 0; i < count; i++) {
      const mid = by + i * pitch + railH / 2;
      // No bolt where the hand slot is cut.
      if (Math.abs(mid - H / 2) < slotH / 2 + 2) continue;
      body += screw(x + 3.7, mid, 1.05, `url(#${u}steel)`, 20 + i * 37 + side * 50);
    }
  });

  return { defs, body };
};

/** Three planks of oiled walnut with a hand slot routed through each end. */
const drawWood = (f: Frame) => {
  const { u, W, H } = f;
  const slotH = Math.min(26, H * 0.34);
  const slot = (x: number, attrs: string) =>
    rect(x, H / 2 - slotH / 2, 4.4, slotH, 2.2, attrs);
  const slots = [3.8, W - 8.2];

  /** Grain is long noise pulled into waves by a second, slower field. */
  const grain = (id: string, seed: number, gain: number) =>
    `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.005 0.5" numOctaves="3" seed="${seed}" result="g"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.011 0.03" numOctaves="2" seed="${seed + 3}" result="w"/>` +
    '<feDisplacementMap in="g" in2="w" scale="10" xChannelSelector="R" yChannelSelector="G"/>' +
    `<feColorMatrix values="0 0 0 0 0.07  0 0 0 0 0.03  0 0 0 0 0.01  ${gain} 0 0 0 ${n(-gain * 0.4)}"/></filter>`;

  const planks = [
    { tone: "#5e3d24", seed: 11, gain: 1.9 },
    { tone: "#4d301a", seed: 23, gain: 2.1 },
    { tone: "#573721", seed: 37, gain: 1.8 },
  ];
  const plankH = H / planks.length;

  const defs =
    planks.map((p, i) => grain(`${u}g${i}`, p.seed, p.gain)).join("") +
    gradient(`${u}bev`, 0, 1, [
      [0, "#ffffff", 0.3],
      [30, "#ffffff", 0],
      [70, "#000000", 0],
      [100, "#000000", 0.55],
    ]) +
    gradient(`${u}sheen`, 1, 0.4, [
      [0, "#ffffff", 0],
      [26, "#ffffff", 0.09],
      [40, "#ffffff", 0],
      [100, "#000000", 0.18],
    ]) +
    `<mask id="${u}cut">${rect(0, 0, W, H, 4.5, 'fill="#fff"')}${slots.map((x) => slot(x, 'fill="#000"')).join("")}</mask>`;

  let body = `<g mask="url(#${u}cut)">`;
  planks.forEach((p, i) => {
    const y = plankH * i;
    body +=
      rect(0, y, W, plankH + 0.1, 0, `fill="${p.tone}"`) +
      rect(0, y, W, plankH + 0.1, 0, `filter="url(#${u}g${i})"`);
  });
  for (let i = 1; i < planks.length; i++) {
    const y = plankH * i;
    body +=
      rect(0, y - 0.14, W, 0.28, 0, 'fill="#000" opacity="0.5"') +
      rect(0, y + 0.14, W, 0.18, 0, 'fill="#fff" opacity="0.08"');
  }
  body +=
    rect(0, 0, W, H, 0, fillOf(u, "sheen")) +
    rect(
      0,
      0,
      W,
      H,
      4.5,
      `fill="none" stroke="#000" stroke-width="5" opacity="0.3" filter="url(#${u}soft)"`,
    ) +
    rect(
      0.4,
      0.4,
      W - 0.8,
      H - 0.8,
      4.2,
      `fill="none" stroke="url(#${u}bev)" stroke-width="0.8"`,
    ) +
    "</g>";

  slots.forEach((x) => {
    body +=
      slot(x, 'fill="none" stroke="#000" stroke-width="0.7" opacity="0.65"') +
      slot(
        x,
        'fill="none" stroke="#e7b98a" stroke-width="0.25" opacity="0.3" transform="translate(0 0.45)"',
      );
  });
  [
    [5.8, 5.8, 20],
    [W - 5.8, 5.8, 110],
    [5.8, H - 5.8, 65],
    [W - 5.8, H - 5.8, 150],
  ].forEach(([x, y, turn]) => {
    body += screw(x, y, 1.1, `url(#${u}brass)`, turn);
  });

  return { defs, body };
};

/** A tweed suitcase: leather corners, brass latches, felt inside. */
const drawTweed = (f: Frame) => {
  const { u, W, H, bx, by, bw, bh } = f;
  const stitch = 'stroke="#e7d2a3" stroke-dasharray="0.9 0.7"';

  const defs =
    `<pattern id="${u}tw" width="1.4" height="1.4" patternUnits="userSpaceOnUse"><rect width="1.4" height="1.4" fill="#a68753"/>` +
    '<path d="M0 1.4 L1.4 0" stroke="#5a4020" stroke-width="0.3" opacity="0.6"/><path d="M0 0 L1.4 1.4" stroke="#f0ddae" stroke-width="0.24" opacity="0.5"/></pattern>' +
    gradient(`${u}round`, 0, 1, [
      [0, "#ffffff", 0.16],
      [16, "#ffffff", 0],
      [80, "#000000", 0],
      [100, "#000000", 0.45],
    ]) +
    gradient(`${u}lea`, 0.5, 1, [
      [0, "#754d2b"],
      [100, "#3c2413"],
    ]) +
    noise(`${u}fib`, "2.6", 1, [0.1, 0.06, 0.02], 0.9, -0.3, 8) +
    noise(`${u}felt`, "3.2", 1, [1, 0.9, 0.8], 0.22, -0.06, 2) +
    `<clipPath id="${u}shell">${rect(0, 0, W, H, 3.4, "")}</clipPath>`;

  let body =
    `<g clip-path="url(#${u}shell)">` +
    rect(0, 0, W, H, 0, fillOf(u, "tw")) +
    rect(0, 0, W, H, 0, `filter="url(#${u}fib)" opacity="0.6"`) +
    rect(0, 0, W, H, 0, fillOf(u, "gl")) +
    rect(0, 0, W, H, 0, fillOf(u, "round")) +
    rect(
      1.5,
      1.5,
      W - 3,
      H - 3,
      2.4,
      'fill="none" stroke="#f1e2bb" stroke-width="0.24" stroke-dasharray="1 0.8" opacity="0.6"',
    );
  [
    [0, 0, 1, 1],
    [W, 0, -1, 1],
    [0, H, 1, -1],
    [W, H, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    body +=
      `<g transform="translate(${n(x)} ${n(y)}) scale(${sx} ${sy})">` +
      '<path d="M0 13.6 L0 0 L13.6 0 Q10 10 0 13.6 Z" fill="#000" opacity="0.35" transform="translate(0.35 0.45)"/>' +
      `<path d="M0 13 L0 0 L13 0 Q9.6 9.6 0 13 Z" ${fillOf(u, "lea")}/>` +
      `<path d="M11.1 1 Q8.3 8.3 1 11.1" fill="none" ${stitch} stroke-width="0.22" opacity="0.7"/>` +
      circle(3.6, 3.6, 0.75, fillOf(u, "brass")) +
      "</g>";
  });
  body += "</g>";

  // The leather rim round the opening, and the felt at the bottom of it.
  body +=
    rect(bx - 2.6, by - 2.2, bw + 5.2, bh + 5.2, 2.4, 'fill="#000" opacity="0.4"') +
    rect(bx - 2.6, by - 2.6, bw + 5.2, bh + 5.2, 2.4, fillOf(u, "lea")) +
    rect(bx - 2.6, by - 2.6, bw + 5.2, 0.3, 0, 'fill="#fff" opacity="0.12"') +
    rect(
      bx - 1.4,
      by - 1.4,
      bw + 2.8,
      bh + 2.8,
      1.6,
      `fill="none" ${stitch} stroke-width="0.2" opacity="0.55"`,
    ) +
    rect(bx - 0.4, by - 0.4, bw + 0.8, bh + 0.8, 1.1, 'fill="#0d0906"') +
    rect(bx, by, bw, bh, 0.9, 'fill="#211a13"') +
    rect(bx, by, bw, bh, 0.9, `filter="url(#${u}felt)"`) +
    well(f);

  [W * 0.24, W * 0.76].forEach((x) => {
    body +=
      rect(x - 3.8, 1.75, 7.6, 4.2, 0.5, 'fill="#000" opacity="0.4"') +
      rect(x - 3.8, 1.4, 7.6, 4.2, 0.5, fillOf(u, "brass")) +
      rect(x - 1.6, 0.7, 3.2, 3.4, 0.4, 'fill="#6b5120" stroke="#f0d896" stroke-width="0.16"') +
      circle(x, 4.5, 0.4, 'fill="#2a1d0a"');
  });

  const handleY = H - 6.4;
  const handleW = 38;
  const handleX = W / 2 - handleW / 2;
  body +=
    rect(handleX, handleY + 0.5, handleW, 3.7, 1.85, 'fill="#000" opacity="0.45"') +
    rect(handleX, handleY, handleW, 3.7, 1.85, fillOf(u, "lea")) +
    rect(
      handleX + 4,
      handleY + 0.6,
      handleW - 8,
      2.5,
      1.25,
      `fill="none" ${stitch} stroke-width="0.2" opacity="0.6"`,
    );
  [handleX - 1, handleX + handleW - 3.2].forEach((x) => {
    body +=
      rect(x, handleY - 0.5, 4.2, 4.7, 0.6, fillOf(u, "brass")) +
      circle(x + 2.1, handleY + 1.85, 0.5, 'fill="#5a431a"');
  });

  return { defs, body };
};

/** A touring case: laminate, aluminium extrusion, ball corners, butterfly latches. */
const drawRoad = (f: Frame) => {
  const { u, W, H, bx, by, bw, bh } = f;
  const rivet = 'fill="#5c6168"';
  const bolt = 'fill="#4d5258"';

  const defs =
    gradient(`${u}alu`, 0.25, 1, [
      [0, "#e6e9ec"],
      [40, "#8a9098"],
      [60, "#b3b9c0"],
      [100, "#737981"],
    ]) +
    gradient(`${u}dish`, 0, 1, [
      [0, "#070708"],
      [100, "#26272b"],
    ]) +
    `<radialGradient id="${u}ball" cx="0.35" cy="0.3" r="0.9"><stop offset="0%" stop-color="#f3f5f7"/><stop offset="45%" stop-color="#9299a1"/><stop offset="100%" stop-color="#555a61"/></radialGradient>` +
    `<pattern id="${u}hex" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><path d="M0 0.8 L0.8 0 L1.6 0.8 L0.8 1.6 Z" fill="none" stroke="#fff" stroke-width="0.09" opacity="0.07"/></pattern>` +
    noise(`${u}peb`, "3", 1, [1, 1, 1], 0.2, -0.06, 6) +
    noise(`${u}foam`, "3.4", 1, [1, 1, 1], 0.24, -0.07, 9);

  let body =
    rect(0, 0, W, H, 1.2, 'fill="#17181b"') +
    rect(0, 0, W, H, 1.2, fillOf(u, "hex")) +
    rect(0, 0, W, H, 1.2, `filter="url(#${u}peb)"`) +
    rect(0, 0, W, H, 1.2, fillOf(u, "gl")) +
    rect(0.95, 0.95, W - 1.9, H - 1.9, 0.9, `fill="none" stroke="url(#${u}alu)" stroke-width="1.9"`) +
    rect(0.95, 0.95, W - 1.9, H - 1.9, 0.9, 'fill="none" stroke="#000" stroke-width="0.16" opacity="0.35"') +
    rect(2.05, 2.05, W - 4.1, H - 4.1, 0.5, 'fill="none" stroke="#000" stroke-width="0.3" opacity="0.7"');
  for (let x = 16; x < W - 10; x += 13) {
    body += circle(x, 0.95, 0.36, rivet) + circle(x, H - 0.95, 0.36, rivet);
  }
  for (let y = 14; y < H - 10; y += 13) {
    body += circle(0.95, y, 0.36, rivet) + circle(W - 0.95, y, 0.36, rivet);
  }

  body +=
    rect(bx - 1.6, by - 1.2, bw + 3.2, bh + 3.2, 1.1, 'fill="#000" opacity="0.5"') +
    rect(bx - 1.6, by - 1.6, bw + 3.2, bh + 3.2, 1.1, fillOf(u, "alu")) +
    rect(bx - 0.9, by - 0.9, bw + 1.8, bh + 1.8, 0.9, 'fill="none" stroke="#000" stroke-width="0.14" opacity="0.4"') +
    rect(bx - 0.35, by - 0.35, bw + 0.7, bh + 0.7, 0.8, 'fill="#08080a"') +
    rect(bx, by, bw, bh, 0.7, 'fill="#1e1f23"') +
    rect(bx, by, bw, bh, 0.7, `filter="url(#${u}foam)"`) +
    well(f);

  [
    [0, 0],
    [W - 7.6, 0],
    [0, H - 7.6],
    [W - 7.6, H - 7.6],
  ].forEach(([cx, cy], i) => {
    const right = i % 2 === 1;
    const low = i > 1;
    const x = cx + (right ? 0.7 : -0.7);
    const y = cy + (low ? 0.7 : -0.7);
    const nearX = right ? x + 5.6 : x + 2;
    const nearY = low ? y + 5.6 : y + 2;
    const farX = right ? x + 2 : x + 5.6;
    const farY = low ? y + 2 : y + 5.6;
    body +=
      rect(x + 0.3, y + 0.5, 7.6, 7.6, 2.6, 'fill="#000" opacity="0.45"') +
      rect(x, y, 7.6, 7.6, 2.6, fillOf(u, "ball")) +
      circle(nearX, nearY, 0.5, bolt) +
      circle(farX, nearY, 0.5, bolt) +
      circle(nearX, farY, 0.5, bolt);
  });

  [W * 0.27, W * 0.73].forEach((x) => {
    body +=
      rect(x - 4.6, 2.5, 9.2, 5, 0.6, `${fillOf(u, "dish")} stroke="url(#${u}alu)" stroke-width="0.4"`) +
      rect(x - 3.1, 4.35, 6.2, 1.3, 0.65, fillOf(u, "steel")) +
      circle(x, 5, 1.25, fillOf(u, "ball")) +
      rect(x - 0.9, 2.9, 1.8, 1.2, 0.3, fillOf(u, "steel"));
  });

  const handleY = H - 7.3;
  body +=
    rect(W / 2 - 12, handleY, 24, 5, 0.6, `${fillOf(u, "dish")} stroke="url(#${u}alu)" stroke-width="0.4"`) +
    rect(W / 2 - 8.5, handleY + 1.75, 17, 1.5, 0.75, 'fill="#1e1f22" stroke="#3a3c41" stroke-width="0.2"') +
    rect(W / 2 - 10, handleY + 1.5, 2, 2, 0.4, fillOf(u, "steel")) +
    rect(W / 2 + 8, handleY + 1.5, 2, 2, 0.4, fillOf(u, "steel"));

  return { defs, body };
};

/** Folded black steel, slotted for cable ties, the back row raised a step. */
const drawSteel = (f: Frame) => {
  const { u, W, H, step } = f;
  const px = 4.4;
  const pw = W - 8.8;
  const lip = 2.4;
  const tier = step ?? H;

  const defs =
    gradient(`${u}up`, 0, 1, [
      [0, "#3a3c42"],
      [100, "#2c2e33"],
    ]) +
    gradient(`${u}lo`, 0, 1, [
      [0, "#08090a"],
      [16, "#1b1c20"],
      [100, "#222327"],
    ]) +
    gradient(`${u}chr`, 1, 0, [
      [0, "#f1f3f5"],
      [30, "#9aa0a7"],
      [55, "#4b5057"],
      [80, "#b3b8be"],
      [100, "#6d7279"],
    ]) +
    noise(`${u}pow`, "3.6", 1, [1, 1, 1], 0.16, -0.05, 7) +
    `<pattern id="${u}slot" x="${n(px + 3)}" y="${lip + 0.6}" width="18" height="8.8" patternUnits="userSpaceOnUse">` +
    [
      [2, 1.5],
      [11, 1.5],
      [6.5, 5.9],
      [15.5, 5.9],
    ]
      .map(
        ([x, y]) =>
          rect(x, y + 0.22, 5, 1.3, 0.65, 'fill="#fff" opacity="0.12"') +
          rect(x, y, 5, 1.3, 0.65, 'fill="#030304"'),
      )
      .join("") +
    "</pattern>" +
    `<clipPath id="${u}plate">${rect(px, 0, pw, H, 1.3, "")}</clipPath>`;

  let body =
    `<g clip-path="url(#${u}plate)">` +
    rect(px, 0, pw, tier, 0, fillOf(u, "up")) +
    (step !== null
      ? rect(px, step, pw, H - step, 0, fillOf(u, "lo")) +
        rect(px, step - 0.5, pw, 0.5, 0, 'fill="#fff" opacity="0.22"')
      : "") +
    rect(px, lip + 0.6, pw, H - lip * 2 - 1.2, 0, fillOf(u, "slot")) +
    rect(px, 0, pw, H, 0, `filter="url(#${u}pow)"`) +
    rect(px, 0, pw, H, 0, fillOf(u, "gl")) +
    // The folded lips, back and front.
    rect(px, 0, pw, lip, 0, 'fill="#fff" opacity="0.06"') +
    rect(px, lip, pw, 0.3, 0, 'fill="#000" opacity="0.45"') +
    rect(px, 0, pw, 0.35, 0, 'fill="#fff" opacity="0.2"') +
    rect(px, H - lip, pw, lip, 0, 'fill="#000" opacity="0.28"') +
    rect(px, H - lip - 0.3, pw, 0.3, 0, 'fill="#fff" opacity="0.14"') +
    rect(px, 0, 1.1, H, 0, 'fill="#000" opacity="0.3"') +
    rect(px + pw - 1.1, 0, 1.1, H, 0, 'fill="#000" opacity="0.3"') +
    "</g>";

  [
    [px + 3, 1.2],
    [px + pw - 3, 1.2],
    [px + 3, H - 1.2],
    [px + pw - 3, H - 1.2],
  ].forEach(([x, y], i) => {
    body += screw(x, y, 0.8, "#4a4c52", 30 + i * 40);
  });

  const barH = Math.min(28, H * 0.4);
  [
    { x: 0.6, inward: 1 },
    { x: W - 3.2, inward: -1 },
  ].forEach(({ x, inward }) => {
    const standoff = inward > 0 ? x + 1.3 : x - 3.3;
    const foot = inward > 0 ? x + 4.4 : x - 4.4;
    [H / 2 - barH / 2 + 2.5, H / 2 + barH / 2 - 4.7].forEach((y) => {
      body +=
        rect(standoff, y, 4.6, 2.2, 0.5, fillOf(u, "steel")) +
        rect(foot, y - 0.6, 2.6, 3.4, 0.5, fillOf(u, "steel"));
    });
    body +=
      rect(x + 0.3, H / 2 - barH / 2 + 0.4, 2.6, barH, 1.3, 'fill="#000" opacity="0.4"') +
      rect(x, H / 2 - barH / 2, 2.6, barH, 1.3, fillOf(u, "chr"));
  });

  return { defs, body };
};

const DRAW: Record<
  BoardLookId,
  (frame: Frame) => { defs: string; body: string }
> = {
  rail: drawRail,
  wood: drawWood,
  tweed: drawTweed,
  road: drawRoad,
  steel: drawSteel,
};

/**
 * One look, sized to a bay.
 *
 * `bayStep` is how far down the bay the top row of pedals ends, for the looks
 * that are built in tiers; leave it out on a one-row board. `uid` has to be
 * unique on the page, since every gradient and filter is addressed by id.
 */
export const boardLookArt = (
  look: BoardLookId,
  uid: string,
  bayW: number,
  bayH: number,
  bayStep: number | null = null,
): BoardLookArt => {
  const m = BOARD_LOOK_MARGINS[look];
  const W = m.l + bayW + m.r;
  const H = m.t + bayH + m.b;
  // React's `useId` hands out colons; plain ids keep every `url(#…)` simple.
  const u = `${uid.replace(/[^a-zA-Z0-9_-]/g, "")}-`;
  const { defs, body } = DRAW[look]({
    u,
    W,
    H,
    bx: m.l,
    by: m.t,
    bw: bayW,
    bh: bayH,
    step: bayStep === null ? null : m.t + bayStep,
  });

  return {
    width: W,
    height: H,
    markup:
      `<defs>${commonDefs(u)}${defs}</defs>` +
      rect(0.6, 1.8, W - 1.2, H, 2.5, `fill="#000" opacity="0.6" filter="url(#${u}ground)"`) +
      body,
  };
};
