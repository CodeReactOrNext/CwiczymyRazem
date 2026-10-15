// Usage: node scripts/prepare-arsenal-asset.cjs <source.png> <guitar|effect> <imageId>
// Preserve generated alpha and create only the new asset's responsive variants.
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

async function main() {
  const [source, kind, imageId] = process.argv.slice(2);
  if (
    !source ||
    !["guitar", "effect"].includes(kind) ||
    !/^\d+$/.test(imageId)
  ) {
    throw new Error("Expected <source.png> <guitar|effect> <numeric imageId>");
  }
  const dir = path.join(
    __dirname,
    "..",
    "public",
    "static",
    "images",
    ...(kind === "guitar" ? ["rank", "special"] : ["effects"]),
  );
  const sizes =
    kind === "guitar"
      ? [
          ["", 1800],
          ["-medium", 900],
          ["-small", 420],
        ]
      : [
          ["", 800],
          ["-medium", 400],
          ["-small", 200],
        ];
  for (const [suffix] of sizes) {
    if (fs.existsSync(path.join(dir, `${imageId}${suffix}.webp`))) {
      throw new Error(`Refusing to overwrite ${kind} ${imageId}${suffix}`);
    }
  }
  const stats = await sharp(source).stats();
  if (stats.isOpaque || stats.channels.length !== 4) {
    throw new Error("Asset must have a transparent alpha channel");
  }
  // Trim empty alpha padding without removing or repainting any subject pixels.
  const trimmed = await sharp(source)
    .trim({ background: "#00000000", threshold: 10 })
    .toBuffer();
  const outputs = [];
  for (const [suffix, edge] of sizes) {
    const target = path.join(dir, `${imageId}${suffix}.webp`);
    const info = await sharp(trimmed)
      .resize({
        width: edge,
        height: edge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: suffix ? 82 : 88, alphaQuality: 100 })
      .toFile(target);
    outputs.push({
      file: path.relative(process.cwd(), target),
      width: info.width,
      height: info.height,
    });
  }
  console.log(JSON.stringify({ kind, imageId, outputs }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
