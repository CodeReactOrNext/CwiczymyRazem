import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../public');
const OUTPUT_PATH = join(PUBLIC_DIR, 'sitemap.xml');
const BASE_URL = 'https://riff.quest';

/**
 * The index used to carry hand-typed dates, which drifted behind the child
 * sitemaps it points at — the index claimed 2026-07-03 for a static sitemap
 * holding 2026-08-04 entries (SEO audit 2026-09-05). Each child's lastmod is now
 * the newest lastmod inside it, so the index can only ever be as stale as the
 * content it lists. Run after the child generators.
 */
const CHILDREN = [
  'sitemap-static.xml',
  'sitemap-blog.xml',
  'sitemap-song-guides.xml',
  'sitemap-wiki.xml',
];

const newestLastmod = (xml) => {
  const dates = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
    (match) => match[1].trim()
  );
  if (dates.length === 0) return null;
  return dates.sort().at(-1);
};

async function generateSitemapIndex() {
  try {
    const entries = [];

    for (const file of CHILDREN) {
      const xml = await fs.readFile(join(PUBLIC_DIR, file), 'utf8');
      const lastmod = newestLastmod(xml);
      if (!lastmod) throw new Error(`${file} has no <lastmod> to read`);
      entries.push({ file, lastmod });
    }

    const body = entries
      .map(
        (entry) => `  <sitemap>
    <loc>${BASE_URL}/${entry.file}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </sitemap>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;

    await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
    console.log(
      `✓ Generated sitemap index over ${entries.length} sitemaps at ${OUTPUT_PATH}`
    );
  } catch (error) {
    console.error('✗ Failed to generate sitemap index:', error.message);
    process.exit(1);
  }
}

generateSitemapIndex();
