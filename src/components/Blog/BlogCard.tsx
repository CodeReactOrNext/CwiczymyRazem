import { format } from 'date-fns';
import type { BlogFrontmatter } from 'lib/blog';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

interface BlogCardProps {
  blog: BlogFrontmatter;
}

export const BlogCard = ({ blog }: BlogCardProps) => {
  return (
    <Link href={`/blog/${blog.slug}`}>
      <div className="group flex h-full flex-col overflow-hidden rounded-lg bg-zinc-900/40 transition-background hover:bg-zinc-900/60">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={blog.image}
            alt={blog.title}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-0" />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(blog.date), 'MMM dd, yyyy')}</span>
          </div>

          <h2 className="mb-2 text-xl font-bold leading-tight tracking-wide text-white transition-colors group-hover:text-cyan-400">
            {blog.title}
          </h2>

          <p className="line-clamp-2 text-sm text-zinc-400">
            {blog.description}
          </p>
        </div>
      </div>
    </Link>
  );
};
