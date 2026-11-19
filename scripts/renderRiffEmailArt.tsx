/**
 * Renders the email header art (public/images/email/*.jpg, 1200×600) from the
 * real Riff component, so the mascot in the inbox is the one in the app.
 *
 *   npx esbuild scripts/renderRiffEmailArt.tsx --bundle --platform=node \
 *     --format=esm --jsx=automatic --outfile=tmp/renderRiffEmailArt.mjs \
 *     --external:react --external:react-dom --external:framer-motion --external:sharp
 *   node tmp/renderRiffEmailArt.mjs
 *
 * Email clients block SVG, so the output is a flattened JPEG. Entry reactions
 * and looping effects do not exist in a still, so the extras a pose needs to
 * read (Zzz, the stage) are drawn here.
 */
import { Riff, type RiffMood } from "components/Mascot/Riff";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";

const W = 1200;
const H = 600;
const BG = "#080808";

interface Art {
  file: string;
  mood: RiffMood;
  /** Extra SVG drawn behind / in front of Riff, in the 1200×600 frame. */
  back?: string;
  front?: string;
  /** Riff's box in the frame. */
  box?: { x: number; y: number; h: number };
}

const zzz = `
  <g font-family="Georgia, serif" font-weight="700" fill="#e9dcbe">
    <text x="770" y="215" font-size="44" opacity="0.9">z</text>
    <text x="815" y="165" font-size="58" opacity="0.7">z</text>
    <text x="870" y="105" font-size="74" opacity="0.5">Z</text>
  </g>`;

const stage = `
  <g>
    <rect x="430" y="428" width="340" height="120" rx="10" fill="#27272a"/>
    <rect x="430" y="428" width="340" height="14" rx="7" fill="#3f3f46"/>
    <path d="M380,170 L396,200 L430,204 L405,226 L412,260 L380,242 L348,260 L355,226 L330,204 L364,200 Z" fill="#f4b63e" opacity="0.95"/>
  </g>`;

const ARTS: Art[] = [
  { file: "welcome", mood: "celebrate" },
  { file: "streak-d1", mood: "standby" },
  { file: "streak-d3", mood: "asleep", front: zzz },
  { file: "results-ranked", mood: "celebrate", back: stage, box: { x: 600, y: 300, h: 330 } },
  { file: "results-unranked", mood: "nudge" },
];

const render = async ({ file, mood, back = "", front = "", box = { x: 600, y: 330, h: 440 } }: Art) => {
  // The figure's own viewBox is 200×175; scale it to the requested height.
  const riff = renderToStaticMarkup(<Riff mood={mood} lookAt='left' className='' />)
    .replace(/class="[^"]*"/, "")
    .replace("<svg", `<svg x="${box.x - (box.h * 200) / 175 / 2}" y="${box.y - box.h / 2}" height="${box.h}" width="${(box.h * 200) / 175}"`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${BG}"/>
    ${back}
    ${riff}
    ${front}
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(`public/images/email/${file}.jpg`);
  console.log("wrote", file);
};

for (const art of ARTS) await render(art);
