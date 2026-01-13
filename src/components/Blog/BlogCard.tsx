import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { BlogFrontmatter } from 'lib/blog';

interface BlogCardProps {
  blog: BlogFrontmatter;
}

export const BlogCard = ({ blog }: BlogCardProps) => {
  return (
    <Link href={`/blog/${blog.slug}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-card transition-colors hover:border-primary/50"
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={blog.image}
            alt={blog.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-0" />
        </div>
        
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(blog.date), 'MMM dd, yyyy')}</span>
          </div>
          
          <h3 className="mb-2 text-2xl font-bold leading-tight group-hover:text-primary font-teko uppercase tracking-wide">
            {blog.title}
          </h3>
          
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {blog.description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};
