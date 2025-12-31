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
    <h3 className="text-xl font-bold text-white mb-2">Ready to build your habit?</h3>
    <p className="text-zinc-400 mb-6">
      Track your next session in Riff Quest right after you finish & report, while the session is still fresh.
    </p>
    <Link 
      href="/signup"
      className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded transition-colors"
    >
      Start Your Free Account <ArrowRight size={18} />
    </Link>
  </div>
);

export default function GuitarPracticeRoutinePage() {
  return (
    <>
      <Head>
        <title>Guitar Practice Routine That Actually Works | The Training Loop</title>
        <meta 
          name="description" 
          content="A simple, structured guitar practice method you can repeat daily. The Training Loop helps you build consistency and measurable progress." 
        />
        <link rel="canonical" href="https://riff.quest/guitar-practice-routine" />
        <meta property="og:title" content="Guitar Practice Routine That Actually Works (The Training Loop)" />
        <meta property="og:description" content="Most routines fail because they lack structure and feedback. Discover a system that makes consistency easy." />
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
            <p className="text-xs uppercase tracking-wider text-cyan-400 mb-4">Practice Methodology</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Guitar Practice Routine That Actually Works
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              If you've ever tried to build a routine and watched it fall apart, you're not lazy — you're missing a system.
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none">
            <p>
              Most routines fail because they're built around good intentions ("I'll practice every day") instead of a repeatable loop with feedback. That's what this guide is: a simple, structured method you can repeat daily — whether you have 15 minutes or 45.
            </p>
            <p>
              It works especially well if you like using a timer, tracking what you did, and seeing your progress build over time.
            </p>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">The #1 Reason Routines Fail</h2>
            <p>A lot of "daily guitar practice routine" advice is vague:</p>
            <ul className="space-y-2 my-6">
              <li>"Warm up for a bit"</li>
              <li>"Practice scales"</li>
              <li>"Work on a song"</li>
              <li>"Jam"</li>
            </ul>
            <p className="font-medium text-white">That's not a routine — that's a list of ideas.</p>
            <p>
              A routine becomes sustainable when two things are true: <strong className="text-white">Structure</strong> (you know what to do) and <strong className="text-white">Feedback</strong> (you get a result when you finish). Without feedback, your brain doesn't "close the loop".
            </p>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">The Training Loop</h2>
            <p className="text-center font-mono text-sm bg-zinc-900 p-4 rounded border border-white/10 my-8">
              Start → Focus → Report → Improve
            </p>
            <ol className="space-y-4 my-8">
              <li><strong className="text-white">Start</strong> — Choose a mode that fits your energy</li>
              <li><strong className="text-white">Focus</strong> — Deep work in one clear lane</li>
              <li><strong className="text-white">Report</strong> — Close the loop & log stats</li>
              <li><strong className="text-white">Improve</strong> — Tweak tomorrow based on data</li>
            </ol>
            <p>That's it. Simple. Repeatable. And it scales from beginner to advanced.</p>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Choosing a Mode</h2>
            <p>Different days need different entry points. A routine that only works on "perfect days" won't work long-term.</p>

            <div className="my-8 space-y-6">
              <div className="border-l-2 border-cyan-500/50 pl-4">
                <h3 className="font-bold text-white mb-1">Timer</h3>
                <p className="text-sm text-zinc-400 mb-2">Best for consistency & limited time.</p>
                <p className="text-sm">Don't want decisions, just need to show up, protect the streak.</p>
              </div>

              <div className="border-l-2 border-purple-500/50 pl-4">
                <h3 className="font-bold text-white mb-1">Exercise</h3>
                <p className="text-sm text-zinc-400 mb-2">Best for targeted improvement.</p>
                <p className="text-sm">Step-by-step structure, drilling specific techniques, clear start/finish.</p>
              </div>

              <div className="border-l-2 border-emerald-500/50 pl-4">
                <h3 className="font-bold text-white mb-1">Plans</h3>
                <p className="text-sm text-zinc-400 mb-2">Best for structured weekly growth.</p>
                <p className="text-sm">Feel like a program, weekly structure, "What should I do today?" solved.</p>
              </div>

              <div className="border-l-2 border-amber-500/50 pl-4">
                <h3 className="font-bold text-white mb-1">Auto</h3>
                <p className="text-sm text-zinc-400 mb-2">Best for "Just Press Play".</p>
                <p className="text-sm">App decides for you, variety without randomness, purposeful but low-effort.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">How to Keep the Streak</h2>
            <p>A streak is kept by making practice smaller and more consistent. Not by making it bigger.</p>
            <ul className="space-y-3 my-6">
              <li>Lower the minimum. 5–10 minutes is enough.</li>
              <li>Protect the habit, not the perfect workout.</li>
              <li>Never miss twice. If you skip today, tomorrow is non-negotiable.</li>
              <li>End with a "win" (a clean take, a better bend).</li>
            </ul>
            <p className="italic text-cyan-400">
              A streak isn't about grinding. It's about identity: "I'm someone who practices guitar."
            </p>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Finish & Report</h2>
            <p>
              The most underrated part of a guitar practice routine is the ending. Most people stop playing, put the guitar down, and move on. This creates a mental pattern where practice feels unfinished.
            </p>
            <p>
              When you finish & report, you close the loop: you confirm the session happened, record the time, build a history of effort, and reinforce consistency.
            </p>

            <CTASection />

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">How to See Progress</h2>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-3">Activity Proof</h3>
            <p className="text-sm">See the consistency — more days practiced, longer streaks, fewer gaps.</p>

            <h3 className="text-lg font-bold text-white mt-8 mb-3">Attribute Proof</h3>
            <p className="text-sm mb-4">See the skill development:</p>
            <ul className="text-sm space-y-2">
              <li><span className="text-cyan-400 font-mono">Rhythm</span> — Alternate picking & timing</li>
              <li><span className="text-purple-400 font-mono">Lead</span> — Bends & vibrato logging</li>
              <li><span className="text-emerald-400 font-mono">Theory</span> — Chord changes focus</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Quick Examples: Time Budgets</h2>
            
            <div className="space-y-6 my-8">
              <div>
                <h3 className="font-bold text-white mb-2">15 min — Minimum Effective Dose</h3>
                <p className="text-sm text-zinc-500 mb-2">Start: Timer</p>
                <ul className="text-sm space-y-1">
                  <li>3 min: warm-up (slow + clean)</li>
                  <li>8 min: one technique</li>
                  <li>4 min: musical application</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">30 min — Balanced Daily Routine</h3>
                <p className="text-sm text-zinc-500 mb-2">Start: Exercise or Plan</p>
                <ul className="text-sm space-y-1">
                  <li>5 min: warm-up</li>
                  <li>10 min: technique block</li>
                  <li>10 min: song section</li>
                  <li>5 min: free play</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">45 min — Structured Growth Day</h3>
                <p className="text-sm text-zinc-500 mb-2">Start: Plan or Auto</p>
                <ul className="text-sm space-y-1">
                  <li>7 min: warm-up + timing</li>
                  <li>15 min: deep technique</li>
                  <li>15 min: repertoire learning</li>
                  <li>8 min: creativity</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-16 mb-4">Start Today</h2>
            <p>
              Don't redesign your routine. Don't chase the perfect plan. Just run the loop:<br/>
              <span className="text-cyan-400 font-medium">Start → Focus → Finish & Report → Repeat.</span>
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
