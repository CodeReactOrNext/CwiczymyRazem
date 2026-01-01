import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../next-i18next.config";
import { Footer } from "feature/landing/components/Footer";
import { ArrowRight } from "lucide-react";

const CTASection = () => (
  <div className="my-16 p-8 bg-cyan-500/5 border-l-4 border-cyan-500">
    <h3 className="text-xl font-bold text-white mb-2">Use a tracker that works for you</h3>
    <p className="text-zinc-400 mb-6">
      Instead of a spreadsheet, log your stats in Riff Quest in 10 seconds.
    </p>
    <Link 
      href="/signup"
      className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded transition-colors"
    >
      Start Your Free Account <ArrowRight size={18} />
    </Link>
  </div>
);

export default function GuitarPracticeTrackerPage() {
  return (
    <>
      <Head>
        <title>Guitar Practice Tracker: How to Measure Real Progress</title>
        <meta 
          name="description" 
          content="Most people track the wrong thing. Learn what 5 metrics actually predict guitar progress and how to log them in under a minute." 
        />
        <link rel="canonical" href="https://riff.quest/guitar-practice-tracker" />
        <meta property="og:title" content="Guitar Practice Tracker: What to Log (and How to Measure Real Progress)" />
        <meta property="og:description" content="Stop logging just 'minutes'. Track focus, intensity, and consistency to see real results." />
        <meta property="og:type" content="article" />
      </Head>

      <main className="min-h-screen bg-zinc-950 text-zinc-300">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image src='/images/longlightlogo.svg' alt='Riff Quest' width={120} height={32} className='h-6 w-auto' />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Start Free →</Link>
            </div>
          </div>
        </nav>

        <article className="mx-auto max-w-2xl px-6 pt-32 pb-24">
          <header className="mb-16">
            <p className="text-xs uppercase tracking-wider text-cyan-400 mb-4">Growth Systems</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Guitar Practice Tracker: 5 Metrics That Predict Progress
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              A tracker can be the difference between "I think I'm getting better?" and knowing you're improving. But most people track the wrong thing.
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none">
            <p>
              Tracking gives you clarity: what works, what doesn't, and what to try next.
            </p>
            <p>
              Below is a simple, beginner-friendly system you can use as a guitar practice log (or guitar practice journal) that actually measures progress—without turning practice into a chore.
            </p>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Why "minutes practiced" isn't enough</h2>
            <p>Time is useful, but it lies by omission.</p>
            <ul className="space-y-2 my-6">
              <li>You can practice 30 minutes half-asleep and barely improve.</li>
              <li>You can practice 10 focused minutes and make a real breakthrough.</li>
              <li>You can practice daily but scatter your attention across 12 things and stall.</li>
            </ul>
            <p className="italic border-l-2 border-cyan-500 pl-4">
              Minutes tell you how long you played. They don't tell you how well you trained.
            </p>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">The 5 Things Worth Logging</h2>
            <p>If you only log these five, you'll be ahead of 95% of players who "track" their practice.</p>

            <div className="my-12 space-y-8">
              <div className="border-l-2 border-blue-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">1. Time (Volume)</h3>
                <p className="text-sm mb-3">Keep it simple (10 min, 35 min). You don't need perfection.</p>
                <p className="text-xs text-zinc-500">Why it matters: Time reveals volume. Over weeks, volume predicts results.</p>
              </div>

              <div className="border-l-2 border-purple-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">2. Focus (Technique)</h3>
                <p className="text-sm mb-3">Pick ONE main focus: alternate picking, rhythm, bending, etc.</p>
                <p className="text-xs text-zinc-500">Why it matters: Progress accelerates when practice stops being random.</p>
              </div>

              <div className="border-l-2 border-amber-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">3. Intensity (Effort)</h3>
                <p className="text-sm mb-3">Rating 1-3. 1=Easy maintenance, 2=Focused, 3=Hard push.</p>
                <p className="text-xs text-zinc-500">Why it matters: Explains why two weeks of 'same minutes' yield different results.</p>
              </div>

              <div className="border-l-2 border-orange-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">4. Consistency (Streak)</h3>
                <p className="text-sm mb-3">Did you practice today? Yes/No. Track your streak.</p>
                <p className="text-xs text-zinc-500">Why it matters: Consistency is the engine. Skill is built by repeated exposure.</p>
              </div>

              <div className="border-l-2 border-emerald-500/50 pl-6">
                <h3 className="text-lg font-bold text-white mb-2">5. Song Work</h3>
                <p className="text-sm mb-3">If you want real-world results, track what song/section you drilled.</p>
                <p className="text-xs text-zinc-500">Why it matters: Technique becomes music only when applied to songs.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">What Progress Looks Like</h2>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-3">After ~2 weeks</h3>
            <ul className="text-sm space-y-2">
              <li>Practice becomes regular (fewer gaps)</li>
              <li>Focus becomes clearer (less "everything")</li>
              <li>You can name what's improving</li>
            </ul>

            <h3 className="text-lg font-bold text-white mt-8 mb-3">After ~3-4 weeks</h3>
            <ul className="text-sm space-y-2">
              <li>Small skill jumps (cleaner transitions)</li>
              <li>Increasing challenge naturally</li>
              <li><strong>Biggest sign:</strong> You stop guessing what to practice</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Common Tracking Mistakes</h2>
            <dl className="space-y-6 my-8">
              <div>
                <dt className="font-bold text-red-300 mb-1">Tracking too many details</dt>
                <dd className="text-sm text-zinc-400">Fix: Track only the 5 essentials.</dd>
              </div>
              <div>
                <dt className="font-bold text-red-300 mb-1">Writing vague notes ('scales', 'song')</dt>
                <dd className="text-sm text-zinc-400">Fix: Be specific: 'Alt picking: 6-note, 80bpm'.</dd>
              </div>
              <div>
                <dt className="font-bold text-red-300 mb-1">Mixing ten focuses in one session</dt>
                <dd className="text-sm text-zinc-400">Fix: One main focus per session.</dd>
              </div>
              <div>
                <dt className="font-bold text-red-300 mb-1">Only logging 'good days'</dt>
                <dd className="text-sm text-zinc-400">Fix: Log short sessions too. They keep the habit alive.</dd>
              </div>
            </dl>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Sample Log Template</h2>
            <div className="bg-zinc-900 p-6 rounded border border-white/10 font-mono text-sm my-8">
              <div className="space-y-2 text-zinc-300">
                <p><span className="text-cyan-400">Date:</span> Jan 1</p>
                <p><span className="text-cyan-400">Time practiced:</span> 30 min</p>
                <p><span className="text-cyan-400">Main focus:</span> rhythm/timing</p>
                <p><span className="text-cyan-400">Intensity (1-3):</span> 2</p>
                <p><span className="text-cyan-400">Consistency:</span> ✅ Practiced / Streak: 5 days</p>
                <p><span className="text-cyan-400">Song work:</span> "Schism" verse riff (slow + clean)</p>
                <p><span className="text-cyan-400">Quick note:</span> timing improved when I counted subdivisions</p>
              </div>
            </div>

            <CTASection />

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">How Riff Quest Automates This</h2>
            <ul className="space-y-3 my-6 text-sm">
              <li><strong className="text-white">Auto-Time</strong> — Time is captured automatically when you use a timer</li>
              <li><strong className="text-white">Skill Focus</strong> — Focus is baked into how you start a session</li>
              <li><strong className="text-white">XP & Rewards</strong> — Intensity + consistency boost rewards (XP multipliers)</li>
              <li><strong className="text-white">History</strong> — Song work becomes part of your history</li>
            </ul>
          </div>

          <div className="mt-16">
            <CTASection />
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "en",
        ["common"],
        nextI18nextConfig
      )),
    },
  };
};
