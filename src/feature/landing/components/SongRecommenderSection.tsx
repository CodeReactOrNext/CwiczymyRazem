import { Sparkles, Guitar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "assets/components/ui/button";

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
            Don't waste time scrolling through thousands of tabs. Let our algorithm focus your practice on the tracks that matter most for your progress.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-xl p-8 md:p-10 rounded-[2rem] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-2xl relative group flex flex-col items-center text-center">
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />
            
            <div className="relative z-10 space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Guitar className="w-8 h-8 text-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Smart Recommendations Coming Soon</h3>
                <p className="text-zinc-400 text-sm">
                  We are upgrading our recommendation engine to provide even better matches for your style and skill level. 
                  In the meantime, browse our full library.
                </p>
              </div>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 bg-white hover:bg-zinc-200 text-black font-extrabold h-12 rounded-xl group transition-all duration-300">
                  Browse All Songs
                  <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
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
