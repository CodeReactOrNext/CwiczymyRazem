import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIKI_DIR = join(__dirname, '../src/content/wiki');
const OUTPUT_PATH = join(__dirname, '../public/sitemap-wiki.xml');
const BASE_URL = 'https://riff.quest';

// Wiki articles carry no date in their frontmatter — they're a living manual,
// not dated posts — so lastmod comes from the file's own mtime.
const toDate = (value) => new Date(value).toISOString().split('T')[0];

async function generateWikiSitemap() {
  try {
    const files = (await fs.readdir(WIKI_DIR)).filter(
      (file) => file.endsWith('.mdx') || file.endsWith('.md')
    );

    const pages = [];
    for (const file of files) {
      const path = join(WIKI_DIR, file);
      const raw = await fs.readFile(path, 'utf8');
      const { data } = matter(raw);
      // Same guard as getAllWikiPages: a markdown file without frontmatter
      // isn't an article and has no route to point a crawler at.
      if (!data.slug || !data.title || !data.section) continue;

      const { mtime } = await fs.stat(path);
      pages.push({ slug: data.slug, lastmod: toDate(mtime) });
    }

    pages.sort((a, b) => (a.slug < b.slug ? -1 : 1));

    const newest = pages.reduce(
      (latest, page) => (page.lastmod > latest ? page.lastmod : latest),
      pages[0]?.lastmod ?? toDate(Date.now())
    );

    const wikiIndex = `  <url>
    <loc>${BASE_URL}/wiki</loc>
    <lastmod>${newest}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    const urls = pages
      .map(
        (page) => `  <url>
    <loc>${BASE_URL}/wiki/${page.slug}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${wikiIndex}
${urls}
</urlset>
`;

    await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
    console.log(
      `✓ Generated wiki sitemap with ${pages.length} articles at ${OUTPUT_PATH}`
    );
  } catch (error) {
    console.error('✗ Failed to generate wiki sitemap:', error.message);
    process.exit(1);
  }
}

generateWikiSitemap();
