import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Badge } from "assets/components/ui/badge";
import Link from "next/link";
import { Card, CardContent } from "assets/components/ui/card";

const articles = [
  {
    title: "What Song Should I Learn on Guitar? Find Songs by Difficulty (with Riff.quest)",
    excerpt: "Choosing the perfect next song on guitar isn’t easy – especially when every player’s experience is different. Learn how to find songs by difficulty using Riff.quest.",
    readTime: "7 min read",
    tag: "Song Discovery",
    link: "/blog/find-guitar-songs-difficulty",
    image: "/images/blog/find-guitar-songs-difficulty.png",
    borderColor: "group-hover:border-amber-500/50"
  },
  {
    title: "Science-Backed Strategies for Consistent Guitar Practice",
    excerpt: "Master the art of building daily guitar practice habits with science-backed strategies and practical tracking techniques.",
    readTime: "8 min read",
    tag: "Habit Formation",
    link: "/blog/practice-habits",
    image: "/images/blog/guitar-1.jpg",
    borderColor: "group-hover:border-blue-500/50"
  },
  {
    title: "Guitar Practice Routine That Actually Works (The Training Loop)",
    excerpt: "Most routines fail because they lack structure. Discover the simple loop that makes practicing addictive and productive.",
    readTime: "5 min read",
    tag: "Methodology",
    link: "/blog/guitar-practice-routine",
    image: "/images/blog/guitar-4677875_1920.jpg",
    borderColor: "group-hover:border-cyan-500/50"
  },
  {
    title: "Guitar Practice Tracker: What to Log & How to Measure Progress",
    excerpt: "Stop tracking just minutes. Learn the 5 metrics that actually predict improvement and how to log them quickly.",
    readTime: "6 min read",
    tag: "Growth Systems",
    link: "/blog/guitar-practice-tracker",
    image: "/images/blog/guitar-1853661_1280.jpg",
    borderColor: "group-hover:border-purple-500/50"
  }
];

export const BlogSection = () => {
  return (
    <section className="relative py-24 bg-zinc-950">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-zinc-700 text-zinc-400">
            Knowledge Base
          </Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            Knowledge & <span className="text-cyan-400">Inspiration</span>
          </h2>
          <p className="text-lg text-zinc-400">
            Discover articles that will help you become a better guitarist. From technique to practice psychology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={article.link} className="block group h-full">
                <Card className={`h-full flex flex-col overflow-hidden bg-zinc-900/50 border-white/5 transition-all duration-300 ${article.borderColor} hover:bg-zinc-900`}>
                  
                  {/* Image Section */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 mb-4 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {article.readTime}
                      </span>
                      <Badge variant="secondary" className="bg-white/5 text-zinc-300 hover:bg-white/10">
                        {article.tag}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-zinc-400 mb-6 flex-grow line-clamp-3 text-sm">
                      {article.excerpt}
                    </p>

                    <div className="flex items-center text-sm font-bold text-cyan-400 mt-auto">
                      Read Article <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
