import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  meta_description?: string;
  content_html?: string;
  content_markdown?: string;
  publish_date: string;
  image_url?: string;
  author_name?: string;
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

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

const generateMdxContent = (article: Article): string => {
  const title = article.title.replace(/"/g, '\\"');
  const description = (article.meta_description || article.subtitle || '').replace(/"/g, '\\"');
  const date = formatDate(article.publish_date);
  const author = article.author_name || 'Riff Quest';
  const image = article.image_url || '/images/blog/default.webp';

  const frontmatter = `---
title: "${title}"
description: "${description}"
date: "${date}"
image: "${image}"
slug: "${article.slug}"
author: "${author}"
---

`;

  const content = article.content_markdown || article.content_html || '';

  return frontmatter + content;
};

const getGitHubClient = () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  return new Octokit({ auth: token });
};

const commitToGitHub = async (
  octokit: InstanceType<typeof Octokit>,
  article: Article,
  mdxContent: string
): Promise<void> => {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!owner || !repo) {
    throw new Error('GITHUB_OWNER or GITHUB_REPO not configured');
  }

  const path = `src/content/blog/${article.slug}.mdx`;
  const message = `📚 Add blog post: ${article.title}`;

  try {
    // Check if file exists
    let sha: string | undefined;
    try {
      const existing = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      if (Array.isArray(existing.data)) {
        throw new Error('Path is a directory');
      }
      sha = existing.data.sha;
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, that's fine
    }

    // Create or update file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(mdxContent).toString('base64'),
      ...(sha && { sha }),
    });
  } catch (error) {
    console.error('GitHub commit error:', error);
    throw error;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const octokit = getGitHubClient();
    const results = [];

    // Process each article
    for (const article of articles) {
      try {
        const mdxContent = generateMdxContent(article);
        await commitToGitHub(octokit, article, mdxContent);
        results.push({
          slug: article.slug,
          status: 'success',
          message: `Article "${article.title}" committed successfully`,
        });
      } catch (error) {
        results.push({
          slug: article.slug,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.status(200).json({
      success: true,
      message: `Processed ${articles.length} article(s)`,
      summary: {
        total: articles.length,
        successful: successCount,
        failed: errorCount,
      },
      details: results,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
