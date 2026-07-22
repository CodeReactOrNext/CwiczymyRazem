import type { BlogFrontmatter } from "lib/blog";
import { ArrowRight } from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";

interface BlogSectionProps {
  blogs: BlogFrontmatter[];
}

// The guitar-apps pillar earns the most search impressions site-wide; keep the
// highest-authority page (homepage) permanently linking to it instead of letting
// it rotate out as newer posts are published.
const PINNED_SLUG = "best-app-for-guitar-practice";

export const BlogSection = ({ blogs }: BlogSectionProps) => {
  const pinned = blogs.find((blog) => blog.slug === PINNED_SLUG);
  const rest = blogs.filter((blog) => blog.slug !== PINNED_SLUG);
  const latestBlogs = (pinned ? [pinned, ...rest] : blogs).slice(0, 4);

  return (
    <section className="py-24 bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter text-white leading-tight font-display">
              Knowledge <br />
              <span className="text-zinc-600">for the journey.</span>
            </h2>
          </div>
          <Link href="/blog" className="text-sm font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
            View all articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestBlogs.map((article, index) => (
            <div key={index}>
              <Link href={`/blog/${article.slug}`} className="group block">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-900 mb-4">
                  <NextImage
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600">
                    <span className="text-cyan-500/80">Article</span>
                    <span aria-hidden>·</span>
                    <span>{new Date(article.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
