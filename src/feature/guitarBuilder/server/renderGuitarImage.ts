import sharp from "sharp";

import {
  getBody,
  getHead,
  getNeck,
  getSticker,
  getTop,
} from "../data/guitarParts";
import type { GuitarBuild } from "../types/guitarBuilder.types";
import { layoutGuitar } from "../utils/layout";
import { paintBody } from "../utils/paint";
import { applyStickers } from "../utils/stickers";

/**
 * Server-side twin of `renderGuitar` (the browser canvas): the same layout,
 * paint and sticker code, composited with sharp. A build is rendered once,
 * when it's made, and the picture is what every card and rack shows after.
 *
 * Part art is fetched over HTTP from the app's own origin — the files under
 * `public/` are served by the CDN, not shipped inside the function.
 */

interface Raw {
  data: Buffer;
  width: number;
  height: number;
}

/** Room around the body so a sticker hanging over its edge still composites. */
const STICKER_PAD = 220;

export async function renderGuitarImage(
  build: GuitarBuild,
  origin: string,
): Promise<Buffer> {
  const cache = new Map<string, Promise<Buffer>>();
  const fetchFile = (path: string) => {
    let pending = cache.get(path);
    if (!pending) {
      pending = fetch(new URL(path, origin)).then(async (res) => {
        if (!res.ok) throw new Error(`Asset ${path}: ${res.status}`);
        return Buffer.from(await res.arrayBuffer());
      });
      cache.set(path, pending);
    }
    return pending;
  };
  const raw = async (path: string): Promise<Raw> => {
    const { data, info } = await sharp(await fetchFile(path))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  };

  const body = getBody(build.bodyKey);
  const neck = getNeck(build.neckKey);
  const head = getHead(build.headKey);
  const top = getTop(build.top);
  const [base, maps, surface, topTile] = await Promise.all([
    raw(body.src),
    raw(body.maps),
    raw(body.surface),
    top ? raw(top.src) : Promise.resolve(null),
  ]);

  const pixels = new Uint8ClampedArray(base.data);
  paintBody(pixels, new Uint8ClampedArray(maps.data), {
    width: base.width,
    finish: build.finish,
    top:
      top && topTile
        ? {
            pixels: new Uint8ClampedArray(topTile.data),
            size: top.size,
            depth: top.depth,
          }
        : null,
    burst: build.burst,
    burstColor: build.burstColor,
    style: build.style,
    pickguard: build.pickguard,
    pickups: build.pickups,
    surface: new Uint8ClampedArray(surface.data),
    singleCoils: body.singleCoils,
    finishL: body.finishL,
    pickguardL: body.pickguardL,
    pickupTone: body.pickupTone,
  });

  if (build.stickers.length) {
    const W = base.width + STICKER_PAD * 2;
    const H = base.height + STICKER_PAD * 2;
    const layers = await Promise.all(
      build.stickers.map(async (sticker) => {
        const size = Math.max(1, Math.round(sticker.size));
        const art = await sharp(await fetchFile(getSticker(sticker.key).src), {
          density: 300,
        })
          .resize(size, size)
          .rotate(sticker.rotation, {
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
        const meta = await sharp(art).metadata();
        return {
          input: art,
          left: Math.round(STICKER_PAD + sticker.x - (meta.width ?? size) / 2),
          top: Math.round(STICKER_PAD + sticker.y - (meta.height ?? size) / 2),
        };
      }),
    );
    const layer = await sharp({
      create: {
        width: W,
        height: H,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(layers)
      .png()
      .toBuffer()
      .then((png) =>
        sharp(png)
          .extract({
            left: STICKER_PAD,
            top: STICKER_PAD,
            width: base.width,
            height: base.height,
          })
          .raw()
          .toBuffer(),
      );
    applyStickers(
      pixels,
      new Uint8ClampedArray(layer),
      new Uint8ClampedArray(base.data),
      new Uint8ClampedArray(surface.data),
      new Uint8ClampedArray(maps.data),
      body.finishL,
      body.pickguardL,
    );
  }

  const sources: Record<"body" | "neck" | "head", () => Promise<sharp.Sharp>> =
    {
      body: async () =>
        sharp(Buffer.from(pixels), {
          raw: { width: base.width, height: base.height, channels: 4 },
        }),
      neck: async () => sharp(await fetchFile(neck.src)).ensureAlpha(),
      head: async () => sharp(await fetchFile(head.src)).ensureAlpha(),
    };

  const layout = layoutGuitar(body, neck, head);
  const pieces = await Promise.all(
    layout.steps.map(async ({ part, src, dest }) => {
      const width = Math.max(1, Math.round(dest.w));
      const height = Math.max(1, Math.round(dest.h));
      const piece = await (
        await sources[part]()
      )
        .extract({
          left: Math.round(src.x),
          top: Math.round(src.y),
          width: Math.max(1, Math.round(src.w)),
          height: Math.round(src.h),
        })
        .resize(width, height, { fit: "fill" })
        .png()
        .toBuffer();
      return {
        input: piece,
        left: Math.round(dest.x),
        top: Math.round(dest.y),
      };
    }),
  );

  return sharp({
    create: {
      width: layout.width,
      height: layout.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(pieces)
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
}
