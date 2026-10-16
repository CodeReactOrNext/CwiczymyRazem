const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

async function install(entries) {
  const directory = "public/images/blog/neon";
  fs.mkdirSync(directory, { recursive: true });
  for (const { slug, source } of entries) {
    const destination = path.join(directory, `${slug}.webp`);
    await sharp(source).resize(1600, 900, { fit: "cover" }).webp({ quality: 86 }).toFile(destination);
    const article = `src/content/blog/${slug}.mdx`;
    const original = fs.readFileSync(article, "utf8");
    const updated = original.replace(/^image: .*$/m, `image: "/images/blog/neon/${slug}.webp"`);
    if (original === updated) throw new Error(`Image reference not updated: ${slug}`);
    fs.writeFileSync(article, updated);
    console.log(`${slug}: ${Math.round(fs.statSync(destination).size / 1024)} KB`);
  }
}

install(JSON.parse(fs.readFileSync(process.argv[2], "utf8"))).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
