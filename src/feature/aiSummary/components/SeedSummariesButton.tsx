// DEV ONLY — remove this file after testing
import { Loader2, Shuffle } from "lucide-react";
import { useState } from "react";
import { firebaseSaveDailySummary, firebaseSaveSummary } from "../services/summary.service";
import { firebaseSaveRating } from "../services/rating.service";
import type { DailySummaryResponse, SessionRatingResponse, WeeklySummaryResponse } from "../types/summary.types";

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function mondayOf(weeksAgo: number): string {
  const d = new Date();
  const day = d.getDay();
  const daysToLastMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysToLastMonday - weeksAgo * 7);
  return localDateStr(d);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const WEEKLY_SEEDS: WeeklySummaryResponse[] = [
  {
    weekScore: "excellent",
    overview: "This was an outstanding week — you practiced 6 out of 7 days with a total of over 5 hours logged. Your consistency is genuinely impressive and shows a real commitment to growth. The sessions were varied, covering technique, theory, and ear training in a balanced way. You tackled challenging material without backing down, which is exactly the mindset that separates dedicated players from casual ones. If you keep this pace, you'll notice significant jumps in fluidity within the next month.",
    strengths: "Your technique sessions were the clear highlight — you returned to fingerpicking patterns three separate times this week, which is how muscle memory actually forms. The ear training sessions on Wednesday and Friday showed real follow-through on your plan from last week. You also managed to squeeze in a theory session on a busy Thursday, which shows great discipline. The consistency of your daily practice — even shorter sessions on tough days — is a genuine strength worth celebrating.",
    areasToImprove: "Despite the strong week, your creativity time was nearly zero — only one short session on Sunday. Improvisation and creative play are essential for internalizing what you practice technically. The two longest sessions were back-to-back on Monday and Tuesday, which risks fatigue without adequate recovery. Try spacing intense sessions with lighter creative days. Also, your theory sessions tend to be under 15 minutes, which may not be enough to retain complex concepts — aim for at least 20 minutes when possible.",
    nextWeekPlan: "Next week, aim to maintain 5-6 active days but build in one pure creativity session of at least 30 minutes — no structured exercises, just improvisation. Prioritize ear training on Monday and Thursday as your anchor sessions. Keep technique sessions between 25-40 minutes to avoid diminishing returns from fatigue. Add a new song to work on that challenges your current comfort zone. Implement a 5-minute warm-up routine at the start of every session to protect your joints and focus your mind.",
    highlight: "Add one dedicated creativity session — your improvisation needs as much love as your technique.",
    bestDay: "Tuesday",
  },
  {
    weekScore: "strong",
    overview: "A solid week with 4 active days and just over 3 hours of total practice. You showed up consistently and put in quality work, especially in the middle of the week. The balance between technical and musical content was reasonable, though there's room to refine the mix. Sessions ranged from focused and purposeful to slightly scattered — paying attention to session goals before you start will sharpen this further. Overall this is the kind of week that builds a real foundation.",
    strengths: "Your Wednesday session was excellent — nearly an hour of focused technique work that clearly had a plan behind it. You revisited the same scale exercise from Monday on Friday, which is exactly the repetition needed for motor learning. Showing up on Sunday after missing Saturday shows great resilience and commitment. The points earned reflect genuine effort, not just time spent.",
    areasToImprove: "Three missed days in a row at the start of the week is a pattern to watch — it creates a mental barrier that makes starting harder. Your hearing time was very low this week at under 10 minutes total; ear training is often the most neglected but most impactful skill for a guitarist. Consider whether your sessions have a clear goal before you start, as unfocused practice time doesn't compound the way intentional practice does.",
    nextWeekPlan: "Set a firm rule: no more than two consecutive rest days. Plan your sessions Sunday evening for the whole week. Add a 15-minute ear training block to Monday and Wednesday — even interval recognition exercises count. Pick one technique exercise as your 'anchor' and return to it every session for the full week. Aim for 4.5 hours total next week as a concrete target.",
    highlight: "Break the pattern of consecutive rest days — momentum is everything at your stage.",
    bestDay: "Wednesday",
  },
  {
    weekScore: "good",
    overview: "Three active days with about 2 hours of total practice — a decent week, though not your best. The sessions you did complete were engaged and showed real effort, but the gaps between them are holding back your progress. Practice at this level keeps you from losing ground, but to actually advance you'll need to push toward 4-5 active days consistently. There were good moments here — the challenge is turning them into a pattern.",
    strengths: "The session on Thursday was particularly well-rounded with technique and theory both covered. You completed a full song run-through which is great for musical context — technique without music can feel hollow, and you avoided that trap. Your points-per-session ratio was actually quite high, suggesting the sessions you did have were focused and intentional.",
    areasToImprove: "Four rest days in a row is too long a gap at your current stage. Even 10-15 minutes of casual playing on off-days prevents the backslide that longer breaks cause. Your theory engagement was minimal — just one short session — and without regular theory input, concepts fade quickly. Also, no ear training at all this week is a significant gap; try to treat it as non-negotiable, even if just 10 minutes of interval singing.",
    nextWeekPlan: "Commit to practicing at least 5 days next week, even if 2-3 of those are short 15-minute sessions. Schedule ear training for Tuesday and Thursday — just 10-15 minutes each. Keep your theory session to a minimum of 20 minutes with a specific topic to cover. Use the weekend for longer, more exploratory sessions. Write down one specific skill you want to measurably improve by end of next week.",
    highlight: "Even 15 minutes on rest days prevents skill fade — consistency beats intensity at your stage.",
    bestDay: "Thursday",
  },
  {
    weekScore: "inconsistent",
    overview: "Two active days with a significant gap between them — this week was inconsistent, which is the pattern most damaging to long-term progress. The sessions themselves weren't bad, but the spaces between them undo much of the motor learning built up. Life gets in the way sometimes, and that's completely understandable, but it's worth identifying what caused the gaps so you can plan around them next week. You're capable of much more than this week showed.",
    strengths: "Despite only two sessions, the Saturday practice was notably long and showed real commitment. You pushed through a difficult exercise rather than switching to something easier, which is a sign of growing mental toughness. The points you earned in those two sessions were respectable — quality was there even when quantity wasn't.",
    areasToImprove: "The 5-day gap in the middle of the week is the main issue — at this point in your development, that kind of break noticeably affects your feel and fluency. No ear training or theory this week means those skills are likely regressing slightly. If this pattern repeats, it will be very hard to build momentum. Consider what's blocking you from finding even 10 minutes on busy days.",
    nextWeekPlan: "This week, prioritize streak above everything else. Even 10 minutes counts — the goal is to practice every day, not to have perfect sessions. Set a phone alarm for your practice time. Start each session with one exercise you know well to re-establish confidence. Don't try to make up for lost time with marathon sessions — steady short sessions are far more valuable right now.",
    highlight: "Restart your streak — even 10 minutes daily builds more than two long sessions per week.",
    bestDay: "Saturday",
  },
  {
    weekScore: "minimal",
    overview: "This was a very light week with minimal practice — sometimes life genuinely takes priority, and that's okay. What matters now is getting back on track without guilt or pressure. Even one short session is infinitely better than zero, and you did manage to show up at least once. The key this week is re-establishing the habit rather than trying to compensate for lost time. Your skills are still there — they just need to be woken up gently.",
    strengths: "You showed up at all, which matters. The session you did complete had genuine effort behind it. Returning after a tough week is harder than it sounds, and the fact that you did shows your commitment to this hasn't faded.",
    areasToImprove: "Very little practice means motor patterns and musical ear are likely slightly dulled. Don't try to overcorrect with an overly ambitious plan — that often leads to burnout or another skipped week. The goal is re-engagement, not perfection. Any neglected category needs attention, but don't try to address everything at once.",
    nextWeekPlan: "Next week, aim for just one thing: practice every day, even if only for 10 minutes. No pressure on content — play what feels good. By the end of the week, try to have at least 2 sessions of 30+ minutes. Revisit the last exercise you were working on before this week to reconnect with your previous progress. Be kind to yourself — progress is not linear.",
    highlight: "Re-establish the habit first — content and quality follow naturally once you're showing up daily.",
    bestDay: null,
  },
  {
    weekScore: "strong",
    overview: "A genuinely strong week with 4 active days and a healthy mix of session types. You showed up when it mattered and brought real focus to the sessions. The variety in your practice — moving between technique, theory, and ear work — is paying dividends in your overall musicianship. Your streak continues to grow which is one of the best indicators of sustainable progress. Keep this energy going and next week could be your best yet.",
    strengths: "Ear training twice this week is a significant improvement and shows you've internalized that feedback. Your longest session on Tuesday was well-paced and covered three different areas without feeling scattered. The way you returned to an exercise mid-week after struggling with it on Monday shows the kind of problem-solving mindset that accelerates growth faster than raw hours alone.",
    areasToImprove: "Wednesday's very short session suggests you were tired or unmotivated — that's fine occasionally, but worth noting. Your creativity time remains low; you tend to practice what's comfortable rather than exploring. A weekly 'free play' session where you improvise with no goal in mind would be a great addition. Theory sessions are still slightly on the short side.",
    nextWeekPlan: "Aim for 5 active days next week. Add one 20-minute free improvisation session — no structure, no goals. Keep the ear training momentum going with at least two sessions. Extend one theory session to 30 minutes with a specific concept like chord voicings or the major scale modes. Try recording one session on your phone to hear yourself from the outside — it's a game-changing perspective.",
    highlight: "Record yourself once this week — hearing your playing from the outside accelerates growth dramatically.",
    bestDay: "Tuesday",
  },
  {
    weekScore: "good",
    overview: "Three active days with a consistent spread across the week — good work. Your practice quality was high and the sessions felt intentional. The middle of the week showed particular focus, and you managed to balance technique with some ear training, which is the right instinct. You're building steadily and this week's work will show up in your playing in the coming weeks. The challenge now is to push that active day count to four.",
    strengths: "The session structure was noticeably better this week — you seem to have a clearer sense of what you want to accomplish before you start. Technique work on Wednesday was clean and methodical. Including a song run-through on Friday gave your practice musical context that technique drills alone can't provide.",
    areasToImprove: "The gaps between sessions are still slightly too long — try to find even a 10-minute slot on one of your off-days to maintain continuity. Theory was skipped entirely this week, which means you may start forgetting concepts you've already worked hard to learn. At least one 20-minute theory session next week is important.",
    nextWeekPlan: "Push for four active days next week. Schedule a 20-minute theory session on Monday before the week gets busy. On your rest days, spend just 5 minutes reviewing chord shapes or intervals — passive review counts. Add a 15-minute ear training session to Friday. End the week with a full song performance, even if imperfect, to measure your musical progress.",
    highlight: "Schedule theory on Monday — once the week starts, finding time for it gets harder every day.",
    bestDay: "Wednesday",
  },
  {
    weekScore: "excellent",
    overview: "Another exceptional week — five active days, nearly 6 hours of total practice, and genuine variety across all four categories. You're operating at a level that will produce visible results within weeks, not months. The consistency of your attendance combined with the quality of the sessions is rare and impressive. You pushed yourself on difficult material and didn't default to easy wins, which is exactly how real progress happens. This week set a new standard for you.",
    strengths: "All four practice categories had meaningful time this week — that kind of balance is extremely difficult to maintain and you pulled it off. Your ear training session on Thursday was your longest yet and that investment will pay off enormously. Creativity time was up significantly from previous weeks, showing you're not just drilling mechanics but actually making music. The Tuesday session was a masterclass in focused practice — varied, intentional, and perfectly paced.",
    areasToImprove: "At this level of practice intensity, recovery matters. Make sure you're not ignoring hand health — stretch before and after long sessions. Your shortest sessions were still 20+ minutes, which is great, but on higher-volume weeks like this one, active rest with light playing is better than full rest days. Consider whether your practice goals are evolving as your skill grows — what challenged you three months ago may now be too easy.",
    nextWeekPlan: "Maintain 5+ active days but introduce a recovery protocol: 5 minutes of hand stretches before every session. Review your practice goals — are they still at the right difficulty level? Add a new challenging piece or exercise that feels slightly out of reach. Consider a weekly self-assessment: record yourself playing something you've been working on and compare to a previous recording. Keep the creativity sessions going — you've built real momentum there.",
    highlight: "You've earned this — now raise the bar on what you're working toward, your current goals may be too easy.",
    bestDay: "Tuesday",
  },
];

const DAILY_SEEDS: DailySummaryResponse[] = [
  {
    mood: "excellent",
    summary: "Yesterday you delivered a powerhouse session — over an hour of focused work across technique and ear training with clear intent behind every exercise. Your fingerpicking patterns are becoming more fluid, and the ear training you did reinforces exactly what your hands are practicing. That kind of deliberate, connected practice is what separates rapid improvers from the rest.",
    highlight: "Practice the same exercise slower today — you'll find new details you missed.",
  },
  {
    mood: "good",
    summary: "A solid 40-minute session yesterday with meaningful work on technique and a decent theory block. You covered real ground and the variety kept the session fresh. The song run-through at the end was a nice way to contextualize the technical work — that habit of connecting exercises to actual music is worth keeping.",
    highlight: "Start today's session with the hardest exercise while your focus is sharpest.",
  },
  {
    mood: "solid",
    summary: "About 20 minutes of focused work yesterday — short but purposeful. You didn't phone it in, which matters more than the length. The technique you practiced is exactly what needs repetition to stick, and even a short session keeps that neural pathway warm. Showing up on a busy day is a skill in itself.",
    highlight: "Can you find 5 more minutes today? Compounding small sessions builds faster than you think.",
  },
  {
    mood: "light",
    summary: "Yesterday was a light one — just a brief check-in with your instrument. Sometimes that's all you have and it still counts. The important thing is you didn't skip entirely, which protects your streak and keeps the habit alive. Don't try to compensate today by cramming — just practice normally.",
    highlight: "Quality over quantity — a focused 20 minutes beats a distracted hour every time.",
  },
  {
    mood: "rest",
    summary: "No practice logged yesterday, which means today is your opportunity to get back on track. Rest is sometimes necessary, but consecutive rest days create a meaningful gap in muscle memory and ear sensitivity. Come back with an easy, enjoyable session today — something that reminds you why you love playing.",
    highlight: "Start with a song you love, not an exercise — re-ignite the joy first.",
  },
  {
    mood: "good",
    summary: "Yesterday's session was well-balanced — you hit technique and managed some ear training, which is the combination that produces the fastest musical growth. The exercise you repeated from the previous session is exactly the right instinct; repetition over days is how motor patterns cement. You're on a good trajectory right now.",
    highlight: "Record a quick voice memo of the exercise you're working on — hearing it helps your brain process it overnight.",
  },
];

const RATING_SEEDS: SessionRatingResponse[] = [
  { score: 9.1, grade: "A+", verdict: "Excellent session", feedback: "Highly focused work.", strengths: ["Great consistency", "Solid technique"], improvements: ["Add ear training"], nextSessionTip: "Try a harder exercise next time." },
  { score: 7.8, grade: "B+", verdict: "Strong session",    feedback: "Good effort overall.",  strengths: ["Good variety"],           improvements: ["More theory"],       nextSessionTip: "Review intervals for 10 minutes." },
  { score: 6.5, grade: "B-", verdict: "Decent session",   feedback: "Solid fundamentals.",   strengths: ["Clean technique"],        improvements: ["Longer sessions"],   nextSessionTip: "Slow down on difficult passages." },
  { score: 8.4, grade: "A",  verdict: "Great session",    feedback: "Well-rounded practice.", strengths: ["Balanced practice"],      improvements: ["Creativity time"],   nextSessionTip: "Improvise freely for 5 minutes." },
  { score: 5.2, grade: "C+", verdict: "Average session",  feedback: "Short but focused.",     strengths: ["Showed up"],              improvements: ["More time needed"],  nextSessionTip: "Aim for 30 minutes tomorrow." },
  { score: 9.5, grade: "S",  verdict: "Outstanding",      feedback: "Peak performance.",      strengths: ["Everything clicked"],     improvements: ["Keep this up"],      nextSessionTip: "Record yourself playing today's exercises." },
  { score: 7.2, grade: "B",  verdict: "Good session",     feedback: "Steady progress.",       strengths: ["Consistent effort"],      improvements: ["Ear training gap"],  nextSessionTip: "Add 10 min of interval training." },
  { score: 4.0, grade: "D",  verdict: "Minimal session",  feedback: "Very brief today.",       strengths: ["Picked up the guitar"],   improvements: ["More time", "Goals"], nextSessionTip: "Plan your session before starting." },
  { score: 8.0, grade: "A",  verdict: "Great session",    feedback: "Purposeful practice.",   strengths: ["Clear focus", "Good form"], improvements: ["Theory depth"],    nextSessionTip: "Review one new chord voicing." },
  { score: 6.8, grade: "B",  verdict: "Good session",     feedback: "Solid work overall.",    strengths: ["Technique improving"],    improvements: ["Creativity"],        nextSessionTip: "Spend 5 minutes improvising freely." },
  { score: 7.5, grade: "B+", verdict: "Strong session",   feedback: "Good momentum.",         strengths: ["Ear training progress"],  improvements: ["Song practice"],     nextSessionTip: "Learn the next phrase of your song." },
  { score: 5.8, grade: "C+", verdict: "Light session",    feedback: "Kept the habit alive.",  strengths: ["Consistency"],            improvements: ["Depth of practice"], nextSessionTip: "Set a timer for 20 min tomorrow." },
  { score: 8.7, grade: "A+", verdict: "Excellent session",feedback: "Very focused and varied.", strengths: ["All categories covered"], improvements: ["Recovery days"],   nextSessionTip: "Stretch your hands before and after." },
];

interface Props {
  userId: string;
}

export function SeedSummariesButton({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seed = async () => {
    setLoading(true);
    try {
      // Seed 8 weeks of weekly summaries
      for (let i = 1; i <= 8; i++) {
        const weekId = `weekly-${mondayOf(i)}`;
        const data = WEEKLY_SEEDS[(i - 1) % WEEKLY_SEEDS.length];
        await firebaseSaveSummary(userId, weekId, data);
      }

      // Seed 6 daily summaries (days 1-6 ago)
      for (let i = 1; i <= 6; i++) {
        const dayId = `daily-${daysAgo(i)}`;
        const data = DAILY_SEEDS[(i - 1) % DAILY_SEEDS.length];
        await firebaseSaveDailySummary(userId, dayId, data);
      }

      // Seed 13 daily ratings (days 1-13 ago) — for activity strip
      for (let i = 1; i <= 13; i++) {
        const ratingId = `daily-${daysAgo(i)}`;
        const data = RATING_SEEDS[(i - 1) % RATING_SEEDS.length];
        await firebaseSaveRating(userId, ratingId, data);
      }

      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={seed}
        disabled={loading || done}
        className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-violet-500 disabled:opacity-60 transition-all"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Shuffle size={16} />
        )}
        {done ? "Seeded ✓" : loading ? "Seeding..." : "[DEV] Seed summaries"}
      </button>
    </div>
  );
}
