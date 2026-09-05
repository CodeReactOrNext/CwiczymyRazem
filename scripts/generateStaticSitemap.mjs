import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LANDING_DIR = join(__dirname, '../src/feature/seoLanding/content');
const OUTPUT_PATH = join(__dirname, '../public/sitemap-static.xml');
const BASE_URL = 'https://riff.quest';

/**
 * The static sitemap was a hand-typed file whose dates drifted from the pages
 * (SEO audit 2026-09-05). The five practice-guide landings now take their
 * lastmod straight from the `updatedAt` in their content config — the same value
 * the page renders and puts in its Article JSON-LD — so the three can't disagree.
 *
 * The informational pages below change rarely and have no such field, so their
 * dates stay declared here; bump one when you actually edit that page.
 */
const INFO_PAGES = [
  { path: '/', lastmod: '2026-09-05', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', lastmod: '2026-07-03', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', lastmod: '2026-07-03', changefreq: 'monthly', priority: '0.5' },
  { path: '/how-it-works', lastmod: '2026-07-03', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', lastmod: '2026-07-03', changefreq: 'monthly', priority: '0.5' },
  { path: '/tools', lastmod: '2026-08-04', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy-policy', lastmod: '2026-07-03', changefreq: 'monthly', priority: '0.3' },
  { path: '/terms-of-service', lastmod: '2026-07-03', changefreq: 'monthly', priority: '0.3' },
];

const extractField = (source, field) => {
  const match = source.match(new RegExp(`${field}:\\s*"([^"]+)"`));
  return match ? match[1] : null;
};

const urlEntry = (entry) => `  <url>
    <loc>${BASE_URL}${entry.path}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;

async function generateStaticSitemap() {
  try {
    const files = (await fs.readdir(LANDING_DIR)).filter(
      (file) =>
        file.endsWith('.ts') &&
        !file.endsWith('.test.ts') &&
        file !== 'index.ts'
    );

    const landings = [];
    for (const file of files) {
      const source = await fs.readFile(join(LANDING_DIR, file), 'utf8');
      const slug = extractField(source, 'slug');
      const updatedAt = extractField(source, 'updatedAt');
      if (!slug || !updatedAt) {
        throw new Error(`${file} is missing slug or updatedAt`);
      }
      landings.push({
        path: `/${slug}`,
        lastmod: updatedAt,
        changefreq: 'weekly',
        priority: '0.9',
      });
    }

    if (landings.length === 0) {
      throw new Error(`no landing configs found in ${LANDING_DIR}`);
    }

    landings.sort((a, b) => (a.path > b.path ? 1 : -1));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home and information pages -->
${INFO_PAGES.map(urlEntry).join('\n\n')}

  <!-- Practice guide landing pages (replaced the auto-generated /exercises/*) -->
${landings.map(urlEntry).join('\n\n')}
</urlset>
`;

    await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
    console.log(
      `✓ Generated static sitemap with ${INFO_PAGES.length + landings.length} URLs at ${OUTPUT_PATH}`
    );
  } catch (error) {
    console.error('✗ Failed to generate static sitemap:', error.message);
    process.exit(1);
  }
}

generateStaticSitemap();
