import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');

const cssToJs = (cssString: string): string => {
  const styles: Record<string, string> = {};
  cssString.split(';').forEach(rule => {
    const [property, value] = rule.split(':').map(s => s.trim());
    if (property && value) {
      const jsProperty = property.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      styles[jsProperty] = value;
    }
  });
  return JSON.stringify(styles);
};

const transformStyleAttributes = (content: string): string => {
  return content.replace(/style="([^"]*)"/g, (_match, styleString) => {
    const jsStyles = cssToJs(styleString);
    return `style={${jsStyles}}`;
  });
};

const transformDirectives = (content: string): string => {
  const typeMap: Record<string, string> = {
    tip: 'tip',
    warning: 'warning',
    bestfor: 'tip',
    important: 'important',
    note: 'info',
  };

  return content.replace(/:::([\w]+)\n([\s\S]*?)\n:::/g, (_match, type, blockContent) => {
    const alertType = typeMap[type] || 'info';
    const cleanContent = blockContent.trim();

    return `\n<BlogAlert type="${alertType}">\n${cleanContent}\n</BlogAlert>\n`;
  });
};

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  image: string;
  slug: string;
  author?: string;
}

export const getAllBlogs = (): BlogFrontmatter[] => {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR);
  
  const blogs = files
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(BLOG_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);
      
      return data as BlogFrontmatter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return blogs;
};

export const getBlogBySlug = async (slug: string) => {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  let transformedContent = transformDirectives(content);
  transformedContent = transformStyleAttributes(transformedContent);

  return {
    frontmatter: data as BlogFrontmatter,
    content: transformedContent,
  };
};
