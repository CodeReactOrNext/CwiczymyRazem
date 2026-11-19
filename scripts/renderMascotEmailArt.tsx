/**
 * Renders the email header art (public/images/email/*.jpg, 1200×600) from the
 * real Echo component, so the mascot in the inbox is the one in the app.
 *
 *   npx esbuild scripts/renderMascotEmailArt.tsx --bundle --platform=node \
 *     --format=esm --jsx=automatic --outfile=tmp/renderMascotEmailArt.mjs \
 *     --external:react --external:react-dom --external:framer-motion --external:sharp
 *   node tmp/renderMascotEmailArt.mjs
 *
 * Email clients block SVG, so the output is a flattened JPEG. Entry reactions
 * and looping effects do not exist in a still, so the extras a pose needs to
 * read (sound rings, the podium) are drawn here.
 */
import { Echo, type EchoMood } from "components/Mascot/Echo";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";

const W = 1200;
const H = 600;
const BG = "#0b0d10";
const CYAN = "#22D3EE";

interface Art {
  file: string;
  mood: EchoMood;
  /** Extra SVG drawn behind / in front of Echo, in the 1200×600 frame. */
  back?: string;
  front?: string;
  /** Echo's box in the frame (centre and height). */
  box?: { x: number; y: number; h: number };
}

const rings = (cx: number, cy: number, r: number) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CYAN}" stroke-width="6" opacity="0.35"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 1.25}" fill="none" stroke="${CYAN}" stroke-width="4" opacity="0.18"/>`;

const podium = `
  <rect x="440" y="452" width="320" height="110" rx="12" fill="#1c2026"/>
  <rect x="440" y="452" width="320" height="14" rx="7" fill="#2a3038"/>`;

const ARTS: Art[] = [
  { file: "welcome", mood: "celebrate", back: rings(600, 318, 200) },
  { file: "streak-d1", mood: "standby" },
  { file: "streak-d3", mood: "asleep" },
  { file: "results-ranked", mood: "celebrate", back: rings(600, 300, 165) + podium, box: { x: 600, y: 290, h: 320 } },
  { file: "results-unranked", mood: "nudge" },
];

const render = async ({ file, mood, back = "", front = "", box = { x: 600, y: 315, h: 420 } }: Art) => {
  // The figure's viewBox is 100 × 98; scale it to the requested height.
  const w = (box.h * 100) / 98;
  const echo = renderToStaticMarkup(<Echo mood={mood} lookAt='left' className='' />)
    .replace(/class="[^"]*"/, "")
    .replace("<svg", `<svg x="${box.x - w / 2}" y="${box.y - box.h / 2}" height="${box.h}" width="${w}"`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${BG}"/>
    ${back}
    ${echo}
    ${front}
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(`public/images/email/${file}.jpg`);
  console.log("wrote", file);
};

for (const art of ARTS) await render(art);
