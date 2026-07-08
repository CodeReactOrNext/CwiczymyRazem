/*
 * One-off generator for responsive rank badge variants (issue #614).
 * Reads public/static/images/rank/special/<id>.webp (the "large" / original
 * size) and produces <id>-medium.webp and <id>-small.webp next to it.
 *
 * Usage: node scripts/generate-rank-badge-variants.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "static", "images", "rank", "special");

const VARIANTS = {
  medium: 900,
  small: 420,
};

(async () => {
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".webp") && !f.includes("-medium") && !f.includes("-small"));

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const srcPath = path.join(DIR, file);
    const base = file.replace(/\.webp$/, "");
    totalBefore += fs.statSync(srcPath).size;

    for (const [variant, longestEdge] of Object.entries(VARIANTS)) {
      const outPath = path.join(DIR, `${base}-${variant}.webp`);
      await sharp(srcPath)
        .resize({ width: longestEdge, height: longestEdge, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);
      totalAfter += fs.statSync(outPath).size;
    }
  }

  console.log(`Processed ${files.length} images.`);
  console.log(`Original total: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Generated variants total: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
})();
