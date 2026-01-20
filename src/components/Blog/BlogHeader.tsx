import { format } from 'date-fns';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, ChevronRight,Clock, User } from 'lucide-react';
import Link from 'next/link';
import React, { useRef } from 'react';

interface BlogHeaderProps {
  title: string;
  description: string;
  date: string;
  image: string;
  author?: string;
  readTime?: string;
}

export const BlogHeader = ({ title, description, date, image, author, readTime = "5 min" }: BlogHeaderProps) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div ref={ref} className="relative h-[75vh] min-h-[500px] w-full overflow-hidden bg-zinc-950">
      {/* Parallax Background Image */}
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent z-10" />
        
        <motion.img
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={image}
          alt={title}
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 flex h-full items-center pt-24 pb-16 md:items-end md:pt-0 md:pb-24">
        <div className="container mx-auto px-6">
          <motion.div
            style={{ opacity }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="max-w-4xl"
          >
            {/* Breadcrumb-ish / Top Meta */}
            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-cyan-400">
              <Link href="/blog" className="hover:text-cyan-300 transition-colors uppercase tracking-widest text-xs">
                Blog
              </Link>
              <ChevronRight className="h-3 w-3 text-zinc-600" />
              <span className="text-zinc-400 uppercase tracking-widest text-xs">Article</span>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl font-teko uppercase leading-[0.9]">
              {title}
            </h1>
            
            {/* Description */}
            <p className="mb-8 max-w-2xl text-lg text-zinc-300/90 md:text-xl font-light leading-relaxed">
              {description}
            </p>

            {/* Metadata Footer */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400 border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-white/10">
                  <User className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="font-medium text-zinc-200">{author || "Riff Quest"}</span>
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span>{format(new Date(date), 'MMM dd, yyyy')}</span>
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span>{readTime} read</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
