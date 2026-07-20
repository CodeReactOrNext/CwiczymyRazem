import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(
  __dirname,
  '../src/feature/song-library/song-guides/content'
);
const OUTPUT_PATH = join(__dirname, '../public/sitemap-song-guides.xml');
const BASE_URL = 'https://riff.quest';

const today = new Date().toISOString().split('T')[0];

// Content files are TS modules, so we extract the two fields we need with a
// regex instead of importing them (same spirit as the blog sitemap reading
// frontmatter). Both fields are simple string literals by convention.
const extractField = (source, field) => {
  const match = source.match(new RegExp(`${field}:\\s*"([^"]+)"`));
  return match ? match[1] : null;
};

async function generateSongGuidesSitemap() {
  try {
    const files = (await fs.readdir(CONTENT_DIR)).filter(
      (file) =>
        file.endsWith('.ts') &&
        !file.endsWith('.test.ts') &&
        file !== 'index.ts'
    );

    const guides = [];
    for (const file of files) {
      const source = await fs.readFile(join(CONTENT_DIR, file), 'utf8');
      const slug = extractField(source, 'slug');
      if (!slug) continue;
      guides.push({
        slug,
        lastmod: extractField(source, 'updatedAt') || today,
      });
    }

    if (guides.length === 0) {
      throw new Error(`no guides found in ${CONTENT_DIR}`);
    }

    guides.sort((a, b) => (a.slug > b.slug ? 1 : -1));

    const urls = guides
      .map(
        (guide) => `  <url>
    <loc>${BASE_URL}/song-library/${guide.slug}</loc>
    <lastmod>${guide.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
    console.log(
      `✓ Generated song guides sitemap with ${guides.length} guides at ${OUTPUT_PATH}`
    );
  } catch (error) {
    console.error('✗ Failed to generate song guides sitemap:', error.message);
    process.exit(1);
  }
}

generateSongGuidesSitemap();
