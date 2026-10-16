import { cn } from 'assets/lib/utils';
import { format } from 'date-fns';
import type { BlogFrontmatter } from 'lib/blog';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

interface BlogCardProps {
  blog: BlogFrontmatter;
  /** Lead post of a grid: spans two columns and, from `sm` up, sets the image
   *  beside the text instead of above it. */
  featured?: boolean;
}

export const BlogCard = ({ blog, featured = false }: BlogCardProps) => {
  return (
    <Link href={`/blog/${blog.slug}`} className={featured ? 'sm:col-span-2' : undefined}>
      <div
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-lg bg-zinc-900/40 transition-background hover:bg-zinc-900/60',
          featured && 'sm:flex-row'
        )}>
        <div
          className={cn(
            'relative aspect-video overflow-hidden',
            featured && 'sm:aspect-auto sm:min-h-64 sm:w-1/2 sm:shrink-0'
          )}>
          <img
            src={blog.image}
            alt={blog.title}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            className={cn('h-full w-full object-cover', featured && 'absolute inset-0')}
          />
          <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-0" />
        </div>

        {/* Translated posts sit in the same grid as the English ones, so the card
            declares its own language rather than inheriting <html lang='en'>. */}
        <div
          lang={blog.lang || 'en'}
          className={cn('flex flex-1 flex-col p-5', featured && 'sm:justify-center sm:p-8')}>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-400">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(blog.date), 'MMM dd, yyyy')}</span>
          </div>

          <h2
            className={cn(
              'mb-2 text-xl font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-cyan-400',
              featured && 'sm:mb-3 sm:text-2xl'
            )}>
            {blog.title}
          </h2>

          <p
            className={cn(
              'line-clamp-2 text-sm text-zinc-400',
              featured && 'sm:line-clamp-4 sm:text-base'
            )}>
            {blog.description}
          </p>
        </div>
      </div>
    </Link>
  );
};
