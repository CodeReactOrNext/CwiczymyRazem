import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  author_name?: string;
  publish_date: string;
  slug: string;
}

interface WebhookPayload {
  event_type: string;
  timestamp: string;
  data: {
    articles: Article[];
  };
}

const validateAuthorization = (authHeader: string | undefined): boolean => {
  const token = process.env.GRANDRANKER_WEBHOOK_TOKEN;

  if (!token) {
    console.error('GRANDRANKER_WEBHOOK_TOKEN not configured');
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authHeader.substring(7);
  return providedToken === token;
};

const getMonthYearFolder = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
};

const getPolishMonth = (dateStr: string): string => {
  const months: Record<number, string> = {
    0: 'Styczeń', 1: 'Luty', 2: 'Marzec', 3: 'Kwiecień',
    4: 'Maj', 5: 'Czerwiec', 6: 'Lipiec', 7: 'Sierpień',
    8: 'Wrzesień', 9: 'Październik', 10: 'Listopad', 11: 'Grudzień'
  };

  const date = new Date(dateStr);
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return new Date().toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
  }
};

const formatArticleEntry = (article: Article): string => {
  const author = article.author_name ? ` — ${article.author_name}` : '';
  return `📚 ${article.title}${author}`;
};

const ensureChangelogFile = (filePath: string): void => {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, '');
  }
};

const readChangelogContent = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
};

const appendArticlesToChangelog = (filePath: string, articles: Article[]): void => {
  ensureChangelogFile(filePath);

  let content = readChangelogContent(filePath);

  // Group articles by date
  const articlesByDate = new Map<string, Article[]>();
  articles.forEach(article => {
    const formattedDate = formatDate(article.publish_date);
    if (!articlesByDate.has(formattedDate)) {
      articlesByDate.set(formattedDate, []);
    }
    articlesByDate.get(formattedDate)!.push(article);
  });

  // Build new content
  const monthYear = getPolishMonth(articles[0].publish_date);

  // Check if file is empty or needs header
  if (!content.trim()) {
    content = `# ${monthYear}\n\n`;
  } else if (!content.includes(`# ${monthYear}`)) {
    // Add header if it doesn't exist
    content = `# ${monthYear}\n\n${content}`;
  }

  // Add entries for each date (in reverse chronological order)
  const sortedDates = Array.from(articlesByDate.keys()).sort().reverse();

  sortedDates.forEach(date => {
    const dateArticles = articlesByDate.get(date) || [];

    // Check if date section already exists
    const dateHeaderRegex = new RegExp(`^## ${date}$`, 'm');
    if (!dateHeaderRegex.test(content)) {
      // Add new date section at the appropriate place
      const lines = content.split('\n');
      let insertIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## ')) {
          insertIndex = i;
          break;
        }
      }

      if (insertIndex === 0) {
        // No date section exists, add after header
        const headerIndex = lines.findIndex(line => line.startsWith('# '));
        insertIndex = headerIndex + 2;
      }

      const newSection = `## ${date}\n${dateArticles.map(a => `- ${formatArticleEntry(a)}`).join('\n')}\n`;
      lines.splice(insertIndex, 0, newSection);
      content = lines.join('\n');
    } else {
      // Append to existing date section
      const lines = content.split('\n');
      const dateHeaderIndex = lines.findIndex(line => line === `## ${date}`);

      if (dateHeaderIndex !== -1) {
        // Find where this section ends
        let sectionEndIndex = dateHeaderIndex + 1;
        while (sectionEndIndex < lines.length &&
               !lines[sectionEndIndex].startsWith('## ') &&
               !lines[sectionEndIndex].startsWith('# ')) {
          sectionEndIndex++;
        }

        dateArticles.forEach(article => {
          lines.splice(sectionEndIndex, 0, `- ${formatArticleEntry(article)}`);
          sectionEndIndex++;
        });

        content = lines.join('\n');
      }
    }
  });

  fs.writeFileSync(filePath, content, 'utf-8');
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate authorization
  const authHeader = req.headers.authorization;
  if (!validateAuthorization(authHeader)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload: WebhookPayload = req.body;

    // Validate payload structure
    if (!payload.event_type || payload.event_type !== 'publish_articles') {
      return res.status(400).json({ error: 'Invalid payload: missing or incorrect event_type' });
    }

    if (!payload.data || !Array.isArray(payload.data.articles)) {
      return res.status(400).json({ error: 'Invalid payload: missing articles data' });
    }

    const articles = payload.data.articles;
    if (articles.length === 0) {
      return res.status(400).json({ error: 'No articles provided' });
    }

    // Group articles by month
    const articlesByMonth = new Map<string, Article[]>();
    articles.forEach(article => {
      const monthFolder = getMonthYearFolder(article.publish_date);
      if (!articlesByMonth.has(monthFolder)) {
        articlesByMonth.set(monthFolder, []);
      }
      articlesByMonth.get(monthFolder)!.push(article);
    });

    // Save articles to changelog files
    articlesByMonth.forEach((monthArticles, monthFolder) => {
      const changelogPath = path.join(process.cwd(), 'public', 'changelogs', `${monthFolder}.md`);
      appendArticlesToChangelog(changelogPath, monthArticles);
    });

    res.status(200).json({
      success: true,
      message: `Successfully processed ${articles.length} article(s)`,
      articlesCount: articles.length,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
