import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Helper to convert ID (underscores) to slug (dashes)
const idToSlug = (id) => id.replace(/_/g, '-');

// Helper to format date as YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

async function generateExerciseSitemap() {
  try {
    // Read exercises from compiled JS — we'll read from the built dist or use a fallback
    // For Next.js, we can import from the build output or read from a JSON export
    // Fallback: read from exercises_dump.json if it exists

    const dumpPath = join(__dirname, '../exercises_dump.json');
    let exercises = [];

    try {
      const data = await fs.readFile(dumpPath, 'utf8');
      exercises = JSON.parse(data);
    } catch (e) {
      console.warn(
        'exercises_dump.json not found. Falling back to empty exercises list.',
        'Please ensure exercises are exported before build.'
      );
      exercises = [];
    }

    // Generate XML URLs
    const urls = exercises
      .map(
        (ex) => `  <url>
    <loc>https://riff.quest/exercises/${idToSlug(ex.id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    // Write to public/sitemap-exercises.xml
    const outputPath = join(__dirname, '../public/sitemap-exercises.xml');
    await fs.writeFile(outputPath, xml, 'utf8');

    console.log(
      `✓ Generated sitemap with ${exercises.length} exercises at ${outputPath}`
    );
  } catch (error) {
    console.error('✗ Failed to generate exercise sitemap:', error.message);
    process.exit(1);
  }
}

generateExerciseSitemap();
