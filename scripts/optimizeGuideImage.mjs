/**
 * Converts a source photo into the WebP a guide hero expects.
 *
 * `images.unoptimized` is on in next.config.js, so Next ships whatever file the
 * <Image> points at, at full byte size, with `sizes`/`srcset` a no-op. Guide
 * photos therefore have to be resized and encoded by hand before they land in
 * public/images/guides.
 *
 * Usage:
 *   node scripts/optimizeGuideImage.mjs <source> <output-name> [width]
 *
 * Example:
 *   node scripts/optimizeGuideImage.mjs ~/Downloads/photo.jpg intermediate-practice-setup
 *
 * Prints the width/height to paste into the config's `heroImage`.
 */
import { mkdir, stat } from "fs/promises";
import path from "path";
import sharp from "sharp";

const [source, outputName, widthArg] = process.argv.slice(2);

if (!source || !outputName) {
  console.error(
    "usage: node scripts/optimizeGuideImage.mjs <source> <output-name> [width]",
  );
  process.exit(1);
}

// The hero renders at max-w-7xl minus padding, so 1536 covers a 2x display
// without shipping a file nobody's screen can use.
const targetWidth = Number(widthArg) || 1536;
const outDir = path.join(process.cwd(), "public", "images", "guides");
const outPath = path.join(outDir, `${outputName}.webp`);

await mkdir(outDir, { recursive: true });

const info = await sharp(source)
  .resize({ width: targetWidth, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(outPath);

const { size } = await stat(outPath);

console.log(`wrote ${path.relative(process.cwd(), outPath)}`);
console.log(`  ${info.width}x${info.height}, ${Math.round(size / 1024)} KB`);
console.log(`  heroImage: width: ${info.width}, height: ${info.height}`);
