import React from "react";
import Link from "next/link";
import { Card, CardContent } from "assets/components/ui/card";
import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Separator } from "assets/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Lightbulb,
  Award,
  Zap,
  BarChart3,
  Music,
  Star,
} from "lucide-react";

const PracticeHabitsView = () => {
  const articleData = {
    title: "How to Build Daily Guitar Practice Habits & Track Progress",
    subtitle: "Science-backed strategies for consistent guitar practice",
    author: "Riff Quest Team",
    date: "December 25, 2025",
    readTime: "8 min read",
    lastUpdated: "December 25, 2025",
    tags: [
      "Practice Habits",
      "Progress Tracking",
      "Habit Formation",
      "Guitar Skills",
    ],
    content: {
      intro: {
        title: "Why Building a Daily Guitar Practice Habit is Challenging",
        content: `Most guitarists want a consistent guitar routine, but daily guitar practice tends to fall apart for predictable reasons:

You don't know what to practice. "I should practice" is vague, so it's easy to skip.

You don't feel progress day-to-day. If improvement is invisible, motivation drops fast.

Life interrupts the streak. One busy day turns into a week, then a month.

Practice feels too big. If your "minimum session" is 60 minutes, you'll often do zero.

The solution isn't more discipline. It's building a practice habit that's small enough to start, clear enough to repeat, and measurable enough to feel rewarding. That's where guitar progress tracking becomes the game-changer: when you can see your consistency and improvement, daily practice stops being a struggle and starts being automatic.`,
        keyStats: [
          {
            number: "67%",
            label: "of guitarists struggle with daily practice consistency",
          },
          { number: "21", label: "days to form a habit (average)" },
          { number: "5 min", label: "minimum practice for habit building" },
        ],
      },
      science: {
        title: "The Science of Habit Formation",
        content:
          "Habits aren't built by intensity—they're built by repetition in a stable context. Research on habit formation shows that automaticity grows gradually, following a curve: early repetitions matter a lot, then the gains slow as the behavior becomes more \"default.\"\n\nA few practical takeaways for building a daily guitar practice habit:",
        points: [
          'Consistency beats perfection. Missing once doesn\'t "reset" your habit. What matters is getting back quickly.',
          'Context cues are powerful. Doing the same action in the same situation (e.g., "after coffee, I play guitar") makes practice easier to start.',
          "Rewards accelerate repetition. Not just external rewards—seeing progress and getting feedback creates a loop that makes you want to repeat the behavior.",
        ],
        sources: [
          {
            name: "European Journal of Social Psychology",
            citation: "Lally et al., 2010",
          },
          {
            name: "Journal of Personality and Social Psychology",
            citation: "Wood & Neal, 2007",
          },
          { name: "Behavioral Policy", citation: "Milkman et al., 2014" },
        ],
      },
      strategies: {
        title: "Key Strategies for Consistent Guitar Practice",
        sections: [
          {
            title: "Set Clear Goals",
            icon: Target,
            content: `A goal like "get better at guitar" sounds inspiring, but it's not actionable. The trick is to turn it into practice goals you can execute today.

Try this goal structure:

• Skill goal: "Improve alternate picking endurance."
• Metric goal: "Practice 10 minutes daily for 14 days."
• Music goal: "Learn the verse riff at 80% tempo."

This does two things:

It removes decision fatigue ("what do I do today?").
It makes progress trackable (you can measure time, sessions, tempo, or completion).

If you're building a consistent guitar routine, start with one main goal for the next 2–4 weeks, and keep everything else optional.`,
            tips: [
              "Use SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound",
              "Start with one primary goal to avoid overwhelm",
              "Review and adjust goals weekly based on progress",
            ],
          },
          {
            title: "Track Daily Progress",
            icon: BarChart3,
            content: `If you want a practice habit to stick, you need proof that you're showing up.

Daily tracking should be simple:

• Log your practice session (even a short one)
• Track time spent
• Track what you practiced (skill category or focus)

Watch your totals grow over weeks

This is exactly why guitar progress tracking works so well: it turns practice into something you can see. Over time, your brain starts protecting the streak and chasing the next milestone.

In Riff Quest, your practice shows up as clear numbers—total practice time, sessions, points—and as a visual activity history (so you can instantly spot consistency patterns). That visual feedback is the "reward" that keeps the loop going.`,
            benefits: [
              "Visual progress motivation",
              "Pattern recognition for optimization",
              "Accountability and commitment",
              "Data-driven practice decisions",
            ],
          },
          {
            title: "Habit Stacking and Consistency",
            icon: Zap,
            content: `One of the easiest ways to build a daily guitar practice habit is habit stacking:

"After I do X, I will practice guitar for Y minutes."

Examples:

• After I make coffee → I practice for 5 minutes.
• After I finish work → I practice for 10 minutes.
• After I brush my teeth → I play one exercise.

The key is choosing a trigger that already happens daily.

Then set a "minimum practice" that feels almost too easy. A consistent guitar routine is built on days when you don't feel like practicing. On those days, the goal is not to "get better"—it's to maintain the identity: I'm someone who practices daily.

A powerful rule:

Minimum = 5 minutes
Bonus = anything extra

You'll be shocked how often 5 minutes turns into 20 once the guitar is in your hands.`,
            triggers: [
              "Morning routine (coffee, breakfast)",
              "Work transitions (start/end of workday)",
              "Evening wind-down (after dinner, before bed)",
              "Existing hobbies (reading, exercise)",
            ],
          },
        ],
      },
      app: {
        title: "How Riff Quest Helps You Achieve Your Practice Goals",
        content: `Riff Quest is built around the idea that the best practice habit is one you can sustain—and that sustainability comes from clarity + tracking + motivation.

Here's how it supports daily guitar practice:`,
        features: [
          {
            title: "Practice tracking that feels rewarding",
            description:
              "Log practice time and sessions, earn points, and see your totals rise. This makes progress real, not imagined.",
            icon: TrendingUp,
            stats: "92% of users report increased motivation",
          },
          {
            title: "Track time by skill (so you practice smarter)",
            description:
              "Instead of guessing where your time goes, you can see which areas you're feeding—technique, theory, creativity, hearing—so your routine stays balanced (or intentionally focused).",
            icon: BarChart3,
            stats: "Balanced skill development tracking",
          },
          {
            title: "A clear view of consistency",
            description:
              'The activity history gives you a simple "did I show up?" view—perfect for building a daily practice habit without overthinking.',
            icon: Calendar,
            stats: "Visual streak tracking",
          },
          {
            title: "Songs + learning workflow",
            description:
              "You can keep a list of songs you want to learn and track your learning process, so practice stays connected to real music (which keeps motivation high).",
            icon: Music,
            stats: "Song-based learning progress",
          },
          {
            title: "Exercise library + suggested plans",
            description:
              "When you don't know what to do, you can pick a ready-made plan (like a warm-up block) and start immediately—removing the #1 reason people skip practice: decision fatigue.",
            icon: Lightbulb,
            stats: "Pre-built practice routines",
          },
        ],
        conclusion: `In other words: Riff Quest helps you build a practice habit by making practice obvious, easy to start, and satisfying to track—the exact ingredients habit research points to.`,
      },
      cta: {
        title: "Start Your Daily Guitar Habit Today!",
        content: `If you want to build a daily guitar practice habit that lasts, start simple and make it measurable.

Try this 7-day setup:

• Pick one goal (example: "10 minutes of technique daily").
• Choose a trigger ("after coffee" or "after work").
• Set your minimum practice (5–10 minutes).
• Track every session in Riff Quest—even the short ones.
• Review after 7 days: Are you consistent? If yes, increase time slightly. If not, reduce the minimum and make it easier.

A consistent guitar routine doesn't come from willpower. It comes from a system you can repeat—daily—and a tracker that shows you your progress so you stay motivated.

Build the habit. Track the progress. And let the streak do the heavy lifting.`,
        steps: [
          {
            number: 1,
            title: "Choose Your Goal",
            description:
              "Pick one specific practice goal for the next 2-4 weeks",
          },
          {
            number: 2,
            title: "Set Your Trigger",
            description: "Link practice to an existing daily habit",
          },
          {
            number: 3,
            title: "Start Small",
            description: "Begin with 5 minutes - make it easy to start",
          },
          {
            number: 4,
            title: "Track Everything",
            description: "Log every session, no matter how short",
          },
          {
            number: 5,
            title: "Review Weekly",
            description: "Adjust your approach based on what works",
          },
          {
            number: 6,
            title: "Scale Gradually",
            description: "Increase time as the habit becomes automatic",
          },
          {
            number: 7,
            title: "Celebrate Streaks",
            description: "Reward consistency and build momentum",
          },
        ],
      },
    },
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100'>
      {/* Navigation */}
      <div className='sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm'>
        <div className='mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-cyan-400'>
            <ArrowLeft size={16} />
            <span>Back to Riff Quest</span>
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        <header className='mb-12'>
          <div className='mb-6 flex flex-wrap gap-2'>
            {articleData.tags.map((tag) => (
              <Badge
                key={tag}
                variant='outline'
                className='border-zinc-700 text-zinc-400'>
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className='mb-4 text-3xl font-bold leading-tight text-zinc-100 md:text-5xl'>
            {articleData.title}
          </h1>

          <p className='mb-8 text-xl leading-relaxed text-zinc-400'>
            {articleData.subtitle}
          </p>

          <div className='mb-8 flex flex-wrap items-center gap-6 text-zinc-400'>
            <div className='flex items-center gap-2'>
              <User size={16} />
              <span>{articleData.author}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Calendar size={16} />
              <span>{articleData.date}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock size={16} />
              <span>{articleData.readTime}</span>
            </div>
          </div>

          {/* Key Stats */}
          <div className='mb-12'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              {articleData.content.intro.keyStats.map((stat, index) => (
                <div
                  key={index}
                  className='rounded-xl bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40 p-6 text-center'>
                  <div className='mb-2 text-3xl font-bold text-cyan-400 md:text-4xl'>
                    {stat.number}
                  </div>
                  <div className='text-sm font-medium leading-relaxed text-zinc-300'>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className='prose prose-lg prose-invert max-w-none'>
          {/* Intro Section */}
          <section className='mb-16'>
            <div>
              <div className='mb-8'>
                <h2 className='mb-6 text-2xl font-bold text-zinc-100 md:text-3xl'>
                  {articleData.content.intro.title}
                </h2>
              </div>
              <div className='mb-8 whitespace-pre-line leading-relaxed text-zinc-300'>
                {articleData.content.intro.content}
              </div>
            </div>
          </section>

          <Separator className='my-16 bg-zinc-800' />

          {/* Science Section */}
          <section className='mb-16'>
            <div>
              <div className='mb-8'>
                <h2 className='mb-6 text-2xl font-bold text-zinc-100 md:text-3xl'>
                  {articleData.content.science.title}
                </h2>
              </div>
              <div className='mb-8 leading-relaxed text-zinc-300'>
                {articleData.content.science.content}
              </div>
              {/* Chart Summary Image - Activity Summary */}
              <div className='mb-10 flex flex-col items-center'>
                <img
                  src='/practice-habits/chart-summary.png'
                  alt='Activity chart summary'
                  className='w-full max-w-full rounded-xl md:w-[600px]'
                />
                <p className='mt-3 text-center text-sm text-zinc-500'>
                  Activity summary • Chart showing exercise distribution by type
                  and time
                </p>
              </div>

              <div className='mb-8 space-y-4'>
                {articleData.content.science.points.map((point, index) => (
                  <div
                    key={index}
                    className='flex items-start gap-4 rounded-lg bg-gradient-to-r from-zinc-900/40 to-zinc-900/20 p-4'>
                    <CheckCircle
                      className='mt-0.5 flex-shrink-0 text-cyan-400'
                      size={16}
                    />
                    <p className='leading-relaxed text-zinc-300'>{point}</p>
                  </div>
                ))}
              </div>

              {/* Sources */}
              <div className='rounded-lg bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 p-6'>
                <h4 className='mb-3 font-semibold text-zinc-200'>
                  Research Sources:
                </h4>
                <ul className='space-y-2 text-sm text-zinc-400'>
                  {articleData.content.science.sources.map((source, index) => (
                    <li key={index}>
                      <span className='font-medium'>{source.name}</span> -{" "}
                      {source.citation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <Separator className='my-12 bg-zinc-800' />

          {/* Strategies Section */}
          <section className='mb-16'>
            <div>
              <div className='mb-8'>
                <h2 className='mb-6 text-2xl font-bold text-zinc-100 md:text-3xl'>
                  {articleData.content.strategies.title}
                </h2>
              </div>

              <div className='space-y-12'>
                {articleData.content.strategies.sections.map(
                  (section, index) => {
                    const IconComponent = section.icon;
                    return (
                      <div
                        key={index}
                        className='rounded-lg bg-gradient-to-br from-zinc-900/40 to-zinc-900/20 p-8'>
                        <h3 className='mb-4 flex items-center gap-3 text-xl font-semibold text-cyan-400'>
                          <IconComponent size={20} />
                          {section.title}
                        </h3>
                        <div className='mb-6 whitespace-pre-line leading-relaxed text-zinc-300'>
                          {section.content}
                        </div>

                        {/* Custom Plan Video po Set Clear Goals */}
                        {index === 0 && (
                          <div className='mb-8 flex flex-col items-center'>
                            <video
                              className='w-full max-w-2xl rounded-xl border border-cyan-500/20 bg-zinc-900 shadow-lg'
                              controls
                              preload='metadata'
                              poster='/practice-habits/chart-summary.png'>
                              <source
                                src='/practice-habits/creating-custom-plan.mp4'
                                type='video/mp4'
                              />
                              Your browser does not support the video tag.
                            </video>
                            <p className='mt-3 text-center text-sm text-zinc-500'>
                              Example: Creating your own practice plan in Riff
                              Quest
                            </p>
                          </div>
                        )}

                        {/* Additional content based on section */}
                        {section.tips && (
                          <div className='mb-6'>
                            <h4 className='mb-3 flex items-center gap-2 font-semibold text-zinc-200'>
                              <Lightbulb
                                size={16}
                                className='text-yellow-400'
                              />
                              Pro Tips:
                            </h4>
                            <ul className='space-y-2'>
                              {section.tips.map((tip, tipIndex) => (
                                <li
                                  key={tipIndex}
                                  className='flex items-start gap-2 text-sm text-zinc-300'>
                                  <Star
                                    size={14}
                                    className='mt-0.5 flex-shrink-0 text-cyan-400'
                                  />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {section.benefits && (
                          <div className='mb-6'>
                            <h4 className='mb-3 flex items-center gap-2 font-semibold text-zinc-200'>
                              <Award size={16} className='text-green-400' />
                              Benefits:
                            </h4>
                            <ul className='space-y-2'>
                              {section.benefits.map((benefit, benefitIndex) => (
                                <li
                                  key={benefitIndex}
                                  className='flex items-start gap-2 text-sm text-zinc-300'>
                                  <CheckCircle
                                    size={14}
                                    className='mt-0.5 flex-shrink-0 text-green-400'
                                  />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {section.triggers && (
                          <div className='mb-6'>
                            <h4 className='mb-3 flex items-center gap-2 font-semibold text-zinc-200'>
                              <Zap size={16} className='text-orange-400' />
                              Effective Triggers:
                            </h4>
                            <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                              {section.triggers.map((trigger, triggerIndex) => (
                                <div
                                  key={triggerIndex}
                                  className='flex items-center gap-2 text-sm text-zinc-300'>
                                  <div className='h-2 w-2 flex-shrink-0 rounded-full bg-orange-400'></div>
                                  <span>{trigger}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          <Separator className='my-12 bg-zinc-800' />

          {/* App Features Section */}
          <section className='mb-16'>
            <div>
              <div className='mb-8'>
                <h2 className='mb-6 text-2xl font-bold text-zinc-100 md:text-3xl'>
                  {articleData.content.app.title}
                </h2>
              </div>
              <div className='mb-8 leading-relaxed text-zinc-300'>
                {articleData.content.app.content}
              </div>

              <div className='grid gap-6 md:grid-cols-2'>
                {articleData.content.app.features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={index}
                      className='rounded-lg bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 p-6'>
                      <div className='mb-3 flex items-start gap-3'>
                        <IconComponent
                          className='mt-1 text-cyan-400'
                          size={20}
                        />
                        <h4 className='font-semibold text-cyan-400'>
                          {feature.title}
                        </h4>
                      </div>
                      <p className='mb-3 text-sm leading-relaxed text-zinc-300'>
                        {feature.description}
                      </p>
                      <Badge
                        variant='secondary'
                        className='bg-cyan-500/20 text-xs text-cyan-400'>
                        {feature.stats}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Large Screenshots */}
              <div className='mt-12 space-y-8'>
                <div className='overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900/60 to-zinc-900/30'>
                  <img
                    src='/practice-habits/practice-summary.png'
                    alt='Practice Summary - Track your guitar practice progress'
                    className='w-full rounded-t-xl object-cover'
                  />
                  <div className='p-6'>
                    <h3 className='mb-2 text-xl font-semibold text-zinc-200'>
                      Practice Summary Dashboard
                    </h3>
                    <p className='text-zinc-400'>
                      See your daily practice streaks, total time spent, and
                      progress across different skills. Riff Quest makes it easy
                      to track what matters most for building consistent guitar
                      habits.
                    </p>
                  </div>
                </div>

                <div className='overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900/60 to-zinc-900/30'>
                  <img
                    src='/practice-habits/song-library.png'
                    alt='Song Library - Organize your guitar learning'
                    className='w-full rounded-t-xl object-cover'
                  />
                  <div className='p-6'>
                    <h3 className='mb-2 text-xl font-semibold text-zinc-200'>
                      Song Library & Learning Tracker
                    </h3>
                    <p className='text-zinc-400'>
                      Keep all your songs in one place and track your learning
                      progress for each one. Whether you're learning classics or
                      writing originals, Riff Quest helps you stay organized and
                      motivated.
                    </p>
                  </div>
                </div>
              </div>

              <div className='mt-8 leading-relaxed text-zinc-300'>
                {articleData.content.app.conclusion}
              </div>
            </div>
          </section>

          <Separator className='my-12 bg-zinc-800' />

          {/* Call to Action */}
          <section className='mb-12'>
            <div className='rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-10'>
              <div className='mb-10 text-center'>
                <h2 className='mb-4 text-3xl font-bold text-zinc-100 md:text-4xl'>
                  {articleData.content.cta.title}
                </h2>
                <div className='mx-auto mb-6 h-1 w-16 bg-gradient-to-r from-cyan-500 to-cyan-400'></div>
                <div className='mx-auto max-w-2xl leading-relaxed text-zinc-300'>
                  {articleData.content.cta.content
                    .split("\n")
                    .slice(0, 3)
                    .join("\n")}
                </div>
              </div>

              <div className='mb-10 grid gap-8 md:grid-cols-2'>
                {articleData.content.cta.steps.slice(0, 4).map((step) => (
                  <div key={step.number} className='text-center'>
                    <div className='mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-lg font-bold text-cyan-400'>
                      {step.number}
                    </div>
                    <h3 className='mb-2 font-semibold text-zinc-200'>
                      {step.title}
                    </h3>
                    <p className='text-sm text-zinc-400'>{step.description}</p>
                  </div>
                ))}
              </div>

              <div className='text-center'>
                <Button
                  asChild
                  className='rounded-full bg-cyan-500 px-8 py-3 font-semibold text-white hover:bg-cyan-600'>
                  <Link href='/'>
                    Start Building Your Habit
                    <ExternalLink size={16} className='ml-2' />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Article Footer */}
          <footer className='mt-12 border-t border-zinc-800 pt-8'>
            <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
              <div className='text-sm text-zinc-400'>
                <p>Last updated: {articleData.lastUpdated}</p>
                <p>Written by the Riff Quest Team</p>
              </div>
              <div className='flex gap-2'>
                <Badge variant='outline' className='text-xs'>
                  8 min read
                </Badge>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
};

export default PracticeHabitsView;
