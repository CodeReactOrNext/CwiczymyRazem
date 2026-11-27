import { Reveal } from "feature/landing/components/Reveal";
import type { BlogFrontmatter } from "lib/blog";
import { ArrowRight } from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";

interface BlogSectionProps {
  blogs: BlogFrontmatter[];
}

// The two guitar-apps posts earn the most search impressions site-wide (the
// free-apps one alone had 26k in three months at position ~8, GSC 2026-11-27);
// keep the highest-authority page (homepage) permanently linking to both instead
// of letting them rotate out as newer posts are published.
const PINNED_SLUGS = ["best-free-apps-to-learn-guitar", "best-app-for-guitar-practice"];

export const BlogSection = ({ blogs }: BlogSectionProps) => {
  const pinned = PINNED_SLUGS.flatMap((slug) => blogs.find((blog) => blog.slug === slug) ?? []);
  const rest = blogs.filter((blog) => !PINNED_SLUGS.includes(blog.slug));
  const latestBlogs = [...pinned, ...rest].slice(0, 4);

  return (
    <section className='bg-zinc-950 py-20'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <Reveal className='mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end'>
          <div>
            <h2 className='font-landingHeading text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white'>
              Latest from the blog
            </h2>
          </div>
          <Link
            href='/blog'
            className='flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
            View all articles <ArrowRight className='h-4 w-4' />
          </Link>
        </Reveal>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {latestBlogs.map((article, index) => (
            <Reveal key={index} delay={index * 0.06}>
              <Link href={`/blog/${article.slug}`} className='group block'>
                <div className='relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-900'>
                  <NextImage
                    src={article.image}
                    alt={article.title}
                    fill
                    className='object-cover opacity-90 transition-opacity duration-slow group-hover:opacity-100'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center gap-3 text-[10px] font-bold text-zinc-400'>
                    <span className='text-cyan-500/80'>Article</span>
                    <span aria-hidden>·</span>
                    <span>
                      {new Date(article.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className='line-clamp-2 text-lg font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-cyan-400'>
                    {article.title}
                  </h3>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
