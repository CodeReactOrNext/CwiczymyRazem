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
    <section className='bg-zinc-950 py-20'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end'>
          <div>
            <h2 className='font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white'>
              Knowledge <br />
              <span className='text-zinc-400'>for the journey.</span>
            </h2>
          </div>
          <Link
            href='/blog'
            className='flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
            View all articles <ArrowRight className='h-4 w-4' />
          </Link>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {latestBlogs.map((article, index) => (
            <div key={index}>
              <Link href={`/blog/${article.slug}`} className='group block'>
                <div className='relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-900'>
                  <NextImage
                    src={article.image}
                    alt={article.title}
                    fill
                    className='object-cover opacity-60 grayscale transition-all duration-700 group-hover:opacity-100 group-hover:grayscale-0'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center gap-3 text-[10px] font-bold text-zinc-400'>
                    <span className='text-cyan-500/80'>Article</span>
                    <span aria-hidden>·</span>
                    <span>{new Date(article.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className='line-clamp-2 text-lg font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-cyan-400'>
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
