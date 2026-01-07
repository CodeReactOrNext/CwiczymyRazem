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
    <h3 className="text-xl font-bold text-white mb-2">Start Building Your Habit Today</h3>
    <p className="text-zinc-400 mb-6">
      Track your practice, build consistency, and see real progress with Riff Quest.
    </p>
    <Link 
      href="/signup"
      className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded transition-colors"
    >
      Start Your Free Account <ArrowRight size={18} />
    </Link>
  </div>
);

export default function PracticeHabitsPage() {
  return (
    <>
      <Head>
        <title>Daily Guitar Practice Habits: Build Consistency & Track Your Progress</title>
        <meta 
          name="description" 
          content="Build unbreakable guitar practice habits in 21 days. Learn the simple 3-step system that makes daily practice automatic—no willpower required." 
        />
        <link rel="canonical" href="https://riff.quest/practice-habits" />
        <meta property="og:title" content="How to Build Daily Guitar Practice Habits & Track Progress" />
        <meta property="og:description" content="Science-backed strategies for consistent guitar practice and habit formation." />
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
            <p className="text-xs uppercase tracking-wider text-cyan-400 mb-4">Habit Formation</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              How to Build Daily Guitar Practice Habits & Track Progress
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Science-backed strategies for consistent guitar practice.
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none">
            
            {/* Intro */}
            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Why Building a Daily Habit is Hard</h2>
            <p>Most guitarists want a consistent routine, but daily practice tends to fall apart for predictable reasons:</p>
            <ul className="space-y-2 my-6">
              <li>You don't know what to practice ("I should practice" is vague)</li>
              <li>You don't feel progress day-to-day</li>
              <li>Life interrupts the streak</li>
              <li>Practice feels too big</li>
            </ul>
            <p>
              The fix? Build a practice habit that's <strong className="text-white">small enough to start</strong>, <strong className="text-white">clear enough to repeat</strong>, and <strong className="text-white">easy to track</strong>.
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4 my-12 text-center">
              <div className="p-4 bg-zinc-900 rounded border border-white/10">
                <div className="text-2xl font-bold text-cyan-400">67%</div>
                <div className="text-xs text-zinc-500 mt-1">struggle with consistency</div>
              </div>
              <div className="p-4 bg-zinc-900 rounded border border-white/10">
                <div className="text-2xl font-bold text-cyan-400">21</div>
                <div className="text-xs text-zinc-500 mt-1">days to form a habit</div>
              </div>
              <div className="p-4 bg-zinc-900 rounded border border-white/10">
                <div className="text-2xl font-bold text-cyan-400">5 min</div>
                <div className="text-xs text-zinc-500 mt-1">minimum for habit building</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">The Science of Habit Formation</h2>
            <p>
              Habits form through repetition, not intensity. The first few reps matter most—afterward, the behavior starts running on autopilot.
            </p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-3">Key Takeaways:</h3>
            <ul className="space-y-3">
              <li><strong className="text-white">Consistency beats perfection</strong> — Missing once doesn't "reset" your habit</li>
              <li><strong className="text-white">Context cues are powerful</strong> — "After coffee, I play guitar" makes practice easier to start</li>
              <li><strong className="text-white">Rewards accelerate repetition</strong> — Seeing progress creates a loop that makes you want to repeat</li>
            </ul>

            <div className="my-8 p-4 bg-zinc-900/50 rounded border border-white/10 text-sm text-zinc-400">
              <p className="font-bold text-white mb-2">Research Sources:</p>
              <ul className="space-y-1">
                <li>European Journal of Social Psychology (Lally et al., 2010)</li>
                <li>Journal of Personality and Social Psychology (Wood & Neal, 2007)</li>
                <li>Behavioral Policy (Milkman et al., 2014)</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Key Strategies for Consistent Practice</h2>

            <div className="my-12 space-y-12">
              <div className="border-l-2 border-cyan-500/50 pl-6">
                <h3 className="text-xl font-bold text-white mb-4">1. Set Clear Goals</h3>
                <p>A goal like "get better at guitar" sounds inspiring, but it's not actionable. Try this structure:</p>
                <ul className="text-sm space-y-2 my-4">
                  <li><strong className="text-white">Skill goal:</strong> "Improve alternate picking endurance"</li>
                  <li><strong className="text-white">Metric goal:</strong> "Practice 10 minutes daily for 14 days"</li>
                  <li><strong className="text-white">Music goal:</strong> "Learn the verse riff at 80% tempo"</li>
                </ul>
                <p className="text-sm">This removes decision fatigue and makes progress trackable.</p>
              </div>

              <div className="border-l-2 border-purple-500/50 pl-6">
                <h3 className="text-xl font-bold text-white mb-4">2. Track Daily Progress</h3>
                <p>If you want a practice habit to stick, you need proof that you're showing up.</p>
                <p className="text-sm my-4">Daily tracking should be simple:</p>
                <ul className="text-sm space-y-2">
                  <li>Log your practice session (even a short one)</li>
                  <li>Track time spent</li>
                  <li>Track what you practiced (skill category or focus)</li>
                  <li>Watch your totals grow over weeks</li>
                </ul>
                <p className="text-sm">
                  This turns practice into something you can <strong className="text-white">see</strong>. Your brain starts protecting the streak and chasing the next milestone.
                </p>
              </div>

              <div className="border-l-2 border-amber-500/50 pl-6">
                <h3 className="text-xl font-bold text-white mb-4">3. Habit Stacking</h3>
                <p>One of the easiest ways to build a daily habit is habit stacking:</p>
                <p className="font-mono text-sm bg-zinc-900 p-3 rounded my-4">"After I do X, I will practice guitar for Y minutes."</p>
                <p className="text-sm mb-4">Examples:</p>
                <ul className="text-sm space-y-2">
                  <li>After I make coffee → I practice for 5 minutes</li>
                  <li>After I finish work → I practice for 10 minutes</li>
                  <li>After I brush my teeth → I play one exercise</li>
                </ul>
                <p className="text-sm">The key is choosing a trigger that already happens daily.</p>
                
                <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded text-sm">
                  <p className="font-bold text-white mb-2">Minimum Rule:</p>
                  <p>Minimum = 5 minutes | Bonus = anything extra</p>
                  <p className="text-xs text-zinc-500 mt-2">You'll be shocked how often 5 minutes turns into 20.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">How Riff Quest Helps</h2>
            <p>Riff Quest makes tracking simple: you see what you practiced, how long, and whether you showed up. Check out our <Link href="/guitar-practice-tracker" className="text-cyan-400 hover:text-cyan-300 underline">practice tracker guide</Link> for more details.</p>

            <div className="my-8 space-y-6">
              <div className="border-l-2 border-cyan-500/50 pl-6">
                <h4 className="font-bold text-white mb-2">Practice tracking that feels rewarding</h4>
                <p className="text-sm">Log practice time and sessions, earn points, and see your totals rise. This makes progress real, not imagined.</p>
              </div>

              <div className="border-l-2 border-purple-500/50 pl-6">
                <h4 className="font-bold text-white mb-2">Track time by skill</h4>
                <p className="text-sm">See which areas you're feeding—technique, theory, creativity—so your routine stays balanced.</p>
              </div>

              <div className="border-l-2 border-emerald-500/50 pl-6">
                <h4 className="font-bold text-white mb-2">Clear consistency view</h4>
                <p className="text-sm">Activity history gives you a simple "did I show up?" view—perfect for habit building.</p>
              </div>

              <div className="border-l-2 border-amber-500/50 pl-6">
                <h4 className="font-bold text-white mb-2">Songs + learning workflow</h4>
                <p className="text-sm">Track your song learning process so practice stays connected to real music.</p>
              </div>
            </div>

            <CTASection />

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">7-Day Setup to Start</h2>
            <ol className="space-y-4 my-8">
              <li className="flex gap-3">
                <span className="font-mono text-cyan-400 font-bold">1.</span>
                <div>
                  <strong className="text-white">Choose Your Goal</strong>
                  <p className="text-sm text-zinc-400">Pick one specific practice goal for 2-4 weeks</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-cyan-400 font-bold">2.</span>
                <div>
                  <strong className="text-white">Set Your Trigger</strong>
                  <p className="text-sm text-zinc-400">Link practice to an existing daily habit</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-cyan-400 font-bold">3.</span>
                <div>
                  <strong className="text-white">Start Small</strong>
                  <p className="text-sm text-zinc-400">Begin with 5 minutes - make it easy to start</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-cyan-400 font-bold">4.</span>
                <div>
                  <strong className="text-white">Track Everything</strong>
                  <p className="text-sm text-zinc-400">Log every session, no matter how short</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-cyan-400 font-bold">5.</span>
                <div>
                  <strong className="text-white">Review Weekly</strong>
                  <p className="text-sm text-zinc-400">Are you consistent? Adjust based on what works</p>
                </div>
              </li>
            </ol>

            <p className="italic text-cyan-400 my-8">
              A consistent routine doesn't come from willpower. It comes from a system you can repeat—daily—and a tracker that shows you your progress.
            </p>
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

