import { SongRecommender } from "feature/songs/components/SongRecommender/SongRecommender";
import { Sparkles } from "lucide-react";

export const SongRecommenderSection = () => {
  return (
    <section id="song-recommender" className="relative py-24 overflow-hidden border-y border-white/5 bg-zinc-950/50">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Song Recommendation Tool
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
            What guitar song should <span className="text-cyan-500">I learn next?</span>
          </h2>
          <p className="max-w-2xl text-zinc-400 text-lg">
            Don't waste time scrolling through thousands of tabs. Answer 3 quick questions and let our algorithm pick the perfect guitar track for your current skill level and vibe.
          </p>
          {/* SEO Text */}
          <div className="sr-only">
            Find the best guitar songs for beginners, intermediate players and advanced shredders. 
            Our guitar song recommender helps you choose which guitar song to learn based on genre, 
            difficulty and popularity. Whether you like rock, metal, pop or blues, we find the 
            perfect track for your guitar practice.
          </div>
        </div>

        <div className="flex justify-center">
          <SongRecommender variant="inline" />
        </div>
        
        <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale pointer-events-none select-none">
            <span className="text-xl font-bold tracking-tighter text-zinc-500 uppercase">Rock Standards</span>
            <span className="text-xl font-bold tracking-tighter text-zinc-500 uppercase">Metal Riffs</span>
            <span className="text-xl font-bold tracking-tighter text-zinc-500 uppercase">Pop Chords</span>
            <span className="text-xl font-bold tracking-tighter text-zinc-500 uppercase">Blues Soul</span>
            <span className="text-xl font-bold tracking-tighter text-zinc-500 uppercase">Jazz Grooves</span>
        </div>
      </div>
    </section>
  );
};
