/*
 * Generator for pedal (effect) art variants — the same treatment the rank
 * badges got in scripts/generate-rank-badge-variants.js.
 *
 * Source is public/static/images/effects/<id>.png when it is still around,
 * otherwise the full-size <id>.webp this script wrote last time. Produces:
 *   <id>.webp         — original pixels, what the pedalboard lays out against
 *   <id>-medium.webp  — cards (Dex, EffectCard, case reveal, workshop)
 *   <id>-small.webp   — tiles, logs, off-the-board strips
 *
 * Usage: node scripts/generate-effect-image-variants.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "static", "images", "effects");

/** Longest edge of each downscaled variant. `full` keeps the source size. */
const VARIANTS = {
  medium: 400,
  small: 200,
};

/** Pedal art is metal and gradients — the full size gets the kinder quality. */
const FULL_QUALITY = 88;
const VARIANT_QUALITY = 82;

const isVariant = (file) => /-(medium|small)\.webp$/.test(file);

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => /\.(png|webp)$/.test(f) && !isVariant(f));

  /** One entry per pedal, preferring the PNG original when both exist. */
  const sources = new Map();
  for (const file of files) {
    const base = file.replace(/\.(png|webp)$/, "");
    if (file.endsWith(".png") || !sources.has(base)) sources.set(base, file);
  }

  let totalBefore = 0;
  let totalAfter = 0;

  for (const [base, file] of sources) {
    const srcPath = path.join(DIR, file);
    totalBefore += fs.statSync(srcPath).size;

    const fullBuffer = await sharp(srcPath).webp({ quality: FULL_QUALITY, alphaQuality: 100 }).toBuffer();
    fs.writeFileSync(path.join(DIR, `${base}.webp`), fullBuffer);
    totalAfter += fullBuffer.length;

    for (const [variant, longestEdge] of Object.entries(VARIANTS)) {
      const outPath = path.join(DIR, `${base}-${variant}.webp`);
      await sharp(srcPath)
        .resize({ width: longestEdge, height: longestEdge, fit: "inside", withoutEnlargement: true })
        .webp({ quality: VARIANT_QUALITY, alphaQuality: 100 })
        .toFile(outPath);
      totalAfter += fs.statSync(outPath).size;
    }
  }

  console.log(`Processed ${sources.size} images.`);
  console.log(`Source total: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Generated total (full + variants): ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
})();
