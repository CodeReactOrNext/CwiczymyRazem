import { Badge } from "assets/components/ui/badge";
import { Card, CardContent } from "assets/components/ui/card";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { motion } from "framer-motion";

const articles = [
  {
    title: "What Song Should I Learn on Guitar? Find Songs by Difficulty",
    excerpt: "Choosing the perfect next song isn't easy. Learn how to find songs by difficulty using Riff.quest.",
    readTime: "7 min read",
    tag: "Song Discovery",
    link: "/blog/find-guitar-songs-difficulty",
    image: "/images/blog/find-guitar-songs-difficulty.png",
  },
  {
    title: "Science-Backed Strategies for Consistent Guitar Practice",
    excerpt: "Master the art of daily guitar practice habits with science-backed strategies and tracking.",
    readTime: "8 min read",
    tag: "Habit Formation",
    link: "/blog/practice-habits",
    image: "/images/blog/guitar-1.jpg",
  },
  {
    title: "Guitar Practice Routine That Actually Works (The Training Loop)",
    excerpt: "Most routines fail because they lack structure. Discover the simple loop that makes practicing addictive.",
    readTime: "5 min read",
    tag: "Methodology",
    link: "/blog/guitar-practice-routine",
    image: "/images/blog/guitar-4677875_1920.jpg",
  },
  {
    title: "Guitar Practice Tracker: What to Log & How to Measure Progress",
    excerpt: "Stop tracking just minutes. Learn the 5 metrics that actually predict improvement and how to log them.",
    readTime: "6 min read",
    tag: "Growth Systems",
    link: "/blog/guitar-practice-tracker",
    image: "/images/blog/guitar-1853661_1280.jpg",
  }
];

export const BlogSection = () => {
  return (
    <section className="py-24 bg-black border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tighter text-white leading-tight font-display">
              Knowledge <br />
              <span className="text-zinc-600">for the journey.</span>
            </h2>
          </motion.div>
          <Link href="/blog" className="text-sm font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest">
            View all articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={article.link} className="group block">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-900 mb-4 border border-white/5 group-hover:border-white/20 transition-colors">
                  <NextImage 
                    src={article.image} 
                    alt={article.title}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <span className="text-cyan-500/80">{article.tag}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
