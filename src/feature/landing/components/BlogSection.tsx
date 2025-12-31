import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Badge } from "assets/components/ui/badge";
import Link from "next/link";
import { Card, CardContent } from "assets/components/ui/card";

const articles = [
  {
    title: "How to Build Daily Guitar Practice Habits & Track Progress",
    excerpt: "Master the art of building daily guitar practice habits with science-backed strategies and practical tracking techniques.",
    readTime: "8 min read",
    tag: "Habit Formation",
    link: "/practice-habits",
    borderColor: "group-hover:border-blue-500/50"
  },
  {
    title: "Guitar Practice Routine That Actually Works (The Training Loop)",
    excerpt: "Most routines fail because they lack structure. Discover the simple loop that makes practicing addictive and productive.",
    readTime: "5 min read",
    tag: "Methodology",
    link: "/guitar-practice-routine",
    borderColor: "group-hover:border-cyan-500/50"
  },
  {
    title: "Guitar Practice Tracker: What to Log & How to Measure Progress",
    excerpt: "Stop tracking just minutes. Learn the 5 metrics that actually predict improvement and how to log them quickly.",
    readTime: "6 min read",
    tag: "Growth Systems",
    link: "/guitar-practice-tracker",
    borderColor: "group-hover:border-purple-500/50"
  },
  {
    title: "30-Day Guitar Practice Streak Challenge (Free Tracker + XP Score)",
    excerpt: "A simple 30-day streak system designed to help you show up daily, build momentum, and actually see proof that you're improving.",
    readTime: "4 min read",
    tag: "Community Challenge",
    link: "/guitar-practice-streak-challenge",
    borderColor: "group-hover:border-emerald-500/50"
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
            Level Up Your <span className="text-cyan-400">Understanding</span>
          </h2>
          <p className="text-lg text-zinc-400">
            Deep dives into practice psychology, routine building, and effective learning strategies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={article.link} className="block group h-full">
                <Card className={`h-full bg-zinc-900/50 border-white/5 transition-all duration-300 ${article.borderColor} hover:bg-zinc-900`}>
                  <CardContent className="p-8 flex flex-col h-full">
                    
                    <div className="flex items-center gap-4 mb-4 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Today
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {article.readTime}
                      </span>
                      <Badge variant="secondary" className="bg-white/5 text-zinc-300 hover:bg-white/10">
                        {article.tag}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-zinc-400 mb-6 flex-grow">
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
