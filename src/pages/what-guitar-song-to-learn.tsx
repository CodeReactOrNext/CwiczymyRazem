import Head from "next/head";
import { SongRecommender } from "feature/songs/components/SongRecommender/SongRecommender";
import { Footer } from "feature/landing/components/Footer";
import { useTranslation } from "hooks/useTranslation";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "assets/components/ui/button";

const WhatSongPage = () => {
  const { t } = useTranslation("common");
  const siteUrl = "https://riff.quest/what-guitar-song-to-learn";

  return (
    <>
      <Head>
        <title>What guitar song to learn? | Guitar Song Recommender</title>
        <meta 
          name='description' 
          content="Can't decide what to play? Our interactive guitar song recommender helps you find the perfect song to learn based on your skill level and favorite genres." 
        />
        <meta name='keywords' content='what guitar song to learn, guitar song recommender, guitar song picker, learn guitar songs quiz, guitar practice routine' />
        <link rel='canonical' href={siteUrl} />
      </Head>

      <main className='min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30 flex flex-col'>
        {/* Navigation */}
        <div className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-wider">Back to Home</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center py-12 md:py-24 px-4 overflow-hidden relative">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] aspect-square bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] aspect-square bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="container relative z-10 mx-auto">
            <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-16 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4 duration-700">
                <Sparkles className="w-4 h-4" />
                Find Your Fingerboard Focus
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-[0.9]">
                Stop Browsing.<br />
                <span className="text-cyan-500">Start Shredding.</span>
              </h1>
              <p className="max-w-2xl text-zinc-400 text-lg md:text-xl font-medium leading-relaxed">
                Finding the right song is half the battle. We've curated a library of legendary tracks 
                and built this tool to match you with the one you'll actually enjoy practicing.
              </p>
            </div>

            <div className="flex justify-center animate-in fade-in zoom-in-95 duration-1000 delay-300">
              <div className="w-full max-w-xl p-8 md:p-12 rounded-[2rem] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-2xl relative group">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-colors" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-colors" />
                
                <SongRecommender variant="inline" />
              </div>
            </div>

            {/* Structured Content for SEO */}
            <div className="max-w-3xl mx-auto mt-24 prose prose-invert">
              <h2 className="text-2xl font-bold text-white mb-4">Why use a guitar song recommender?</h2>
              <p className="text-zinc-400 mb-6">
                Most guitarists spend more time looking for songs than actually playing them. Our recommendation 
                engine considers your current skill tier (from beginner D-Tier to legendary S-Tier) and your 
                preferred genre to suggest songs that are challenging enough to help you grow, but not so 
                difficult that you get frustrated.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div className="space-y-2">
                  <h3 className="font-bold text-cyan-400 uppercase tracking-wider">For Beginners</h3>
                  <p className="text-zinc-500">Focus on fundamental chords and simple rhythm patterns within iconic rock and pop songs.</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-purple-400 uppercase tracking-wider">For Shredders</h3>
                  <p className="text-zinc-500">Discover metal solos and complex progressive riffs that test your alternate picking and speed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default WhatSongPage;
