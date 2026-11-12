/**
 * Builds the stills of the onboarding's walk-through before the first riff
 * (feature/onboarding/view/FirstRiffIntro): real screenshots of the practice
 * session, one set per level and per device — desktop, phone held sideways,
 * phone held upright — cropped around the control a slide talks about, with
 * that control ringed and the rest dimmed.
 *
 * Crops are cut at the capture's device pixels and never resampled, so they
 * stay sharp when the page shows them enlarged.
 *
 * Needs the dev server (the session comes from /dev/highway-preview):
 *   npm run dev
 *   node scripts/buildFirstRiffIntroScreens.mjs [baseUrl] [outDir]
 *
 * The crop sizes below are mirrored in FirstRiffIntro's SCREEN_SIZE.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";
import sharp from "sharp";

const BASE_URL = process.argv[2] || "http://localhost:3000";
const OUT_DIR =
  process.argv[3] || path.join("public", "images", "onboarding", "first-riff");

const LEVELS = {
  new: "first-riff-open-strings",
  some: "first-riff-pentatonic",
  experienced: "first-riff-lead-lick",
};

/** `crop` is in CSS px; the file is crop × deviceScaleFactor. */
const DEVICES = {
  desktop: {
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
    crop: { width: 720, height: 480 },
    phone: false,
  },
  landscape: {
    context: {
      viewport: { width: 844, height: 390 },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
    },
    crop: { width: 444, height: 310 },
    phone: true,
  },
  portrait: {
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
    },
    crop: { width: 390, height: 444 },
    phone: true,
    // Upright, the session lies on its side; the still is turned back so it
    // reads the right way up in the walk-through.
    rotate: -90,
  },
};

const RING_PAD = 6;
const RING_RADIUS = 12;
const RING_WIDTH = 2;
/** How far the rest of the screen steps back; the tab slide keeps the tab readable. */
const DIM = 0.45;
const DIM_TAB = 0.15;
/** The ring never leaves the crop, even for a control at the screen edge. */
const RING_INSET = 2;

const HIDE_DEV_UI = `
  nextjs-portal, .tsqd-parent-container, [data-sonner-toaster] { display: none !important; }
`;

const visibleBox = async (page, role, name) => {
  const all = page.getByRole(role, { name });
  const count = await all.count();
  // The desktop and phone views are both mounted; the hidden one measures 0×0.
  // The drawer's backdrop shares the toggle's name, so the smallest box wins.
  let best = null;
  for (let i = 0; i < count; i++) {
    const box = await all.nth(i).boundingBox();
    if (!box || box.width < 4 || box.height < 4) continue;
    if (!best || box.width * box.height < best.width * best.height) best = box;
  }
  if (!best) throw new Error(`No visible "${name}"`);
  return best;
};

const union = (boxes) => {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x, y, width: right - x, height: bottom - y };
};

const clickIfThere = async (page, name) => {
  const all = page.getByRole("button", { name });
  const count = await all.count();
  for (let i = 0; i < count; i++) {
    const button = all.nth(i);
    if (await button.isVisible()) {
      await button.click({ force: true });
      await page.waitForTimeout(500);
      return true;
    }
  }
  return false;
};

/** The crop, centred on everything the shot points at and kept on screen. */
const cropAround = (boxes, device) => {
  const around = union(boxes);
  const { width, height } = device.crop;
  const { viewport } = device.context;
  const clamp = (value, max) => Math.max(0, Math.min(Math.round(value), max));
  return {
    x: clamp(around.x + around.width / 2 - width / 2, viewport.width - width),
    y: clamp(
      around.y + around.height / 2 - height / 2,
      viewport.height - height,
    ),
    width,
    height,
  };
};

/**
 * `ring` gets the white outline; `clear` is only left undimmed (the button
 * that opens the panel the ringed control sits in).
 */
const writeShot = async ({
  screenshot,
  device,
  crop,
  ring,
  clear,
  file,
  dim = DIM,
}) => {
  const scale = device.context.deviceScaleFactor;
  const w = crop.width * scale;
  const h = crop.height * scale;
  const local = (box, pad) => ({
    x: (box.x - crop.x - pad) * scale,
    y: (box.y - crop.y - pad) * scale,
    width: (box.width + pad * 2) * scale,
    height: (box.height + pad * 2) * scale,
  });
  const rounded = ({ x, y, width, height }) => {
    const r = RING_RADIUS * scale;
    return `M${x + r},${y} h${width - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${height - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(width - 2 * r)} a${r},${r} 0 0 1 ${-r},${-r} v${-(height - 2 * r)} a${r},${r} 0 0 1 ${r},${-r} z`;
  };
  const fit = (box) => {
    const min = RING_INSET * scale;
    const x = Math.max(box.x, min);
    const y = Math.max(box.y, min);
    return {
      x,
      y,
      width: Math.min(box.x + box.width, w - min) - x,
      height: Math.min(box.y + box.height, h - min) - y,
    };
  };
  const ringPath = rounded(fit(local(ring, RING_PAD)));
  const holes = [ringPath, ...clear.map((box) => rounded(local(box, 2)))];
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <path fill="#000" fill-opacity="${dim}" fill-rule="evenodd" d="M0,0 h${w} v${h} h${-w} z ${holes.join(" ")}"/>
    <path fill="none" stroke="#fff" stroke-width="${RING_WIDTH * scale}" d="${ringPath}"/>
  </svg>`;
  // Two passes: sharp turns an image before it composites, so the ring would
  // land on the turned picture at the unturned coordinates.
  const ringed = await sharp(screenshot)
    .extract({
      left: crop.x * scale,
      top: crop.y * scale,
      width: w,
      height: h,
    })
    .composite([{ input: Buffer.from(overlay) }])
    .png()
    .toBuffer();
  await sharp(ringed)
    .rotate(device.rotate ?? 0)
    .webp({ lossless: true, effort: 6 })
    .toFile(file);
  console.log("wrote", file);
};

const openSession = async (browser, device, exerciseId, micOn) => {
  const context = await browser.newContext({
    ...device.context,
    permissions: ["microphone"],
  });
  await context.addInitScript((value) => {
    localStorage.setItem("mic_tracking_enabled", value);
  }, String(micOn));
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dev/highway-preview?id=${exerciseId}`, {
    waitUntil: "load",
    timeout: 180000,
  });
  await page.addStyleTag({ content: HIDE_DEV_UI });
  await page
    .getByRole("button", { name: "Preview" })
    .first()
    .waitFor({ state: "attached", timeout: 120000 });
  // Let the tab finish drawing and the mic (and its speaker hint) come up.
  await page.waitForTimeout(micOn ? 5000 : 2500);
  await clickIfThere(page, "Got it");
  // Preview lifts the start gate off the tab without starting the clock.
  // The click can land before the gate is wired up, so it is repeated until the gate is gone.
  for (let attempt = 0; attempt < 8; attempt++) {
    if (!(await clickIfThere(page, "Preview"))) break;
  }
  await page.waitForTimeout(800);
  return { context, page };
};

const captureState = async (browser, level, deviceName, micOn) => {
  const device = DEVICES[deviceName];
  const { context, page } = await openSession(
    browser,
    device,
    LEVELS[level],
    micOn,
  );
  const file = (shot) =>
    path.join(OUT_DIR, `${level}-${deviceName}-${shot}.webp`);
  const tabKeys = async () =>
    union([
      await visibleBox(page, "button", "Tablature settings"),
      await visibleBox(page, "button", "Zoom in"),
    ]);
  const tempo = async () =>
    union([
      await visibleBox(page, "button", "Slower"),
      await visibleBox(page, "button", "Faster"),
    ]);

  if (!micOn) {
    const keys = await tabKeys();
    await writeShot({
      screenshot: await page.screenshot(),
      device,
      crop: cropAround([keys], device),
      ring: keys,
      clear: [],
      file: file("tab"),
      dim: DIM_TAB,
    });
  }

  let clear = [];
  if (device.phone) {
    await clickIfThere(page, "Show exercise tools");
    await page.waitForTimeout(700);
    clear = [await visibleBox(page, "button", "Hide exercise tools")];
  }
  const mic = device.phone
    ? await visibleBox(page, "button", /^Pitch Detect/)
    : union([
        await visibleBox(page, "button", /^Pitch Detect/),
        await visibleBox(page, "button", "Input tools"),
      ]);
  const bpm = await tempo();
  // One crop for the panel's slides: only the ring moves between them.
  const crop = cropAround([mic, bpm, ...clear], device);
  const screenshot = await page.screenshot();
  const shots = micOn ? { mic } : { tempo: bpm, no_mic: mic };
  for (const [shot, ring] of Object.entries(shots)) {
    await writeShot({
      screenshot,
      device,
      crop,
      ring,
      clear,
      file: file(shot),
    });
  }
  await context.close();
};

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const only = process.env.ONLY?.split(",");
for (const level of Object.keys(LEVELS)) {
  for (const deviceName of Object.keys(DEVICES)) {
    if (only && !only.includes(`${level}-${deviceName}`)) continue;
    await captureState(browser, level, deviceName, false);
    await captureState(browser, level, deviceName, true);
  }
}
await browser.close();
