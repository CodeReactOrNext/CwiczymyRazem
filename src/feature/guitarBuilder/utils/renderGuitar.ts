import {
  getBody,
  getHead,
  getNeck,
  getSticker,
  getTop,
} from "../data/guitarParts";
import type {
  BodyPart,
  GuitarBuild,
  PlacedSticker,
} from "../types/guitarBuilder.types";
import { layoutGuitar } from "./layout";
import { paintBody } from "./paint";
import { applyStickers } from "./stickers";

const images = new Map<string, Promise<HTMLImageElement>>();
const pixelCache = new Map<string, Promise<Uint8ClampedArray>>();

function loadImage(src: string) {
  let pending = images.get(src);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
    images.set(src, pending);
  }
  return pending;
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

function readPixels(img: HTMLImageElement) {
  const { ctx } = canvasOf(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
}

/** Masks and textures are read once; paint copies the base, never mutates cache. */
function loadPixels(src: string) {
  let pending = pixelCache.get(src);
  if (!pending) {
    pending = loadImage(src).then(readPixels);
    pixelCache.set(src, pending);
  }
  return pending;
}

/** Last painted body, so dragging a sticker doesn't repaint the finish. */
let paintedCache: { key: string; pixels: Uint8ClampedArray } | null = null;

async function paintedBody(body: BodyPart, build: GuitarBuild) {
  const key = JSON.stringify([
    body.key,
    build.finish,
    build.top,
    build.burst,
    build.burstColor,
    build.style,
    build.pickguard,
    build.pickups,
  ]);
  const top = getTop(build.top);
  const [bodyPixels, maps, surface, topPixels] = await Promise.all([
    loadPixels(body.src),
    loadPixels(body.maps),
    loadPixels(body.surface),
    top ? loadPixels(top.src) : Promise.resolve(null),
  ]);
  if (paintedCache?.key !== key) {
    const pixels = paintBody(new Uint8ClampedArray(bodyPixels), maps, {
      width: body.width,
      finish: build.finish,
      top:
        top && topPixels
          ? { pixels: topPixels, size: top.size, depth: top.depth }
          : null,
      burst: build.burst,
      burstColor: build.burstColor,
      style: build.style,
      pickguard: build.pickguard,
      pickups: build.pickups,
      surface,
      singleCoils: body.singleCoils,
      finishL: body.finishL,
      pickguardL: body.pickguardL,
      pickupTone: body.pickupTone,
    });
    paintedCache = { key, pixels };
  }
  return { painted: paintedCache.pixels, base: bodyPixels, maps, surface };
}

async function stickerLayer(body: BodyPart, stickers: PlacedSticker[]) {
  const arts = await Promise.all(
    stickers.map((sticker) => loadImage(getSticker(sticker.key).src)),
  );
  const { ctx } = canvasOf(body.width, body.height);
  stickers.forEach((sticker, i) => {
    ctx.save();
    ctx.translate(sticker.x, sticker.y);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    ctx.drawImage(
      arts[i],
      -sticker.size / 2,
      -sticker.size / 2,
      sticker.size,
      sticker.size,
    );
    ctx.restore();
  });
  return ctx.getImageData(0, 0, body.width, body.height).data;
}

interface RenderOptions {
  selectedStickerId: string | null;
  isStale: () => boolean;
}

/** Draws the build onto `canvas`, resizing it to the guitar's template size. */
export async function renderGuitar(
  canvas: HTMLCanvasElement,
  build: GuitarBuild,
  { selectedStickerId, isStale }: RenderOptions,
) {
  const body = getBody(build.bodyKey);
  const neck = getNeck(build.neckKey);
  const head = getHead(build.headKey);

  const [{ painted, base, maps, surface }, neckImg, headImg, layer] =
    await Promise.all([
      paintedBody(body, build),
      loadImage(neck.src),
      loadImage(head.src),
      build.stickers.length ? stickerLayer(body, build.stickers) : null,
    ]);
  if (isStale()) return;

  const bodyData = new ImageData(
    new Uint8ClampedArray(painted),
    body.width,
    body.height,
  );
  if (layer) {
    applyStickers(
      bodyData.data,
      layer,
      base,
      surface,
      maps,
      body.finishL,
      body.pickguardL,
    );
  }
  const bodyCanvas = canvasOf(body.width, body.height);
  bodyCanvas.ctx.putImageData(bodyData, 0, 0);

  const layout = layoutGuitar(body, neck, head);
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingQuality = "high";
  const sources = { body: bodyCanvas.canvas, neck: neckImg, head: headImg };
  for (const { part, src, dest } of layout.steps) {
    ctx.drawImage(
      sources[part],
      src.x,
      src.y,
      src.w,
      src.h,
      dest.x,
      dest.y,
      dest.w,
      dest.h,
    );
  }

  const selected = build.stickers.find(
    (sticker) => sticker.id === selectedStickerId,
  );
  if (selected) {
    const origin = layout.steps[0].dest;
    ctx.save();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(
      origin.x + selected.x,
      origin.y + selected.y,
      selected.size * 0.58,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }
}
