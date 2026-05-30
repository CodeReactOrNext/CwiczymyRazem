import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '../src/content/blog');
const OUTPUT_PATH = join(__dirname, '../public/sitemap-blog.xml');
const BASE_URL = 'https://riff.quest';

// Normalise any date input to YYYY-MM-DD; fall back to today when missing/invalid.
const today = new Date().toISOString().split('T')[0];
const toDate = (value) => {
  if (!value) return today;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? today : d.toISOString().split('T')[0];
};

async function generateBlogSitemap() {
  try {
    const files = (await fs.readdir(BLOG_DIR)).filter(
      (file) => file.endsWith('.mdx') || file.endsWith('.md')
    );

    const posts = [];
    for (const file of files) {
      const raw = await fs.readFile(join(BLOG_DIR, file), 'utf8');
      const { data } = matter(raw);
      const slug = data.slug || file.replace(/\.mdx?$/, '');
      posts.push({
        slug,
        lastmod: toDate(data.updatedAt || data.date),
      });
    }

    // Newest first so the sitemap reads predictably; order is not significant to crawlers.
    posts.sort((a, b) => (a.lastmod < b.lastmod ? 1 : -1));

    const blogIndex = `  <url>
    <loc>${BASE_URL}/blog</loc>
    <lastmod>${posts[0]?.lastmod || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    const urls = posts
      .map(
        (post) => `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogIndex}
${urls}
</urlset>
`;

    await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
    console.log(
      `✓ Generated blog sitemap with ${posts.length} posts at ${OUTPUT_PATH}`
    );
  } catch (error) {
    console.error('✗ Failed to generate blog sitemap:', error.message);
    process.exit(1);
  }
}

generateBlogSitemap();
