import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";

interface PracticeCommentGeneratorProps {
  activityData?: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
  ratingData: ReportDataInterface;
  currentUserStats: StatisticsDataInterface;
}

export function generatePracticeComment({
  activityData = [],
  ratingData,
  currentUserStats,
}: PracticeCommentGeneratorProps): string {
  const { time: totalTime, habitsCount } = ratingData.bonusPoints;
  const streak = currentUserStats.actualDayWithoutBreak;

  const last7Days = activityData.slice(-7);
  const lastSession = last7Days.length > 0 ? last7Days[last7Days.length - 1] : null;

  const techniqueTime = lastSession?.techniqueTime || 0;
  const theoryTime = lastSession?.theoryTime || 0;
  const hearingTime = lastSession?.hearingTime || 0;
  const creativityTime = lastSession?.creativityTime || 0;

  const avgLast7Days = last7Days.length > 0
    ? last7Days.reduce((acc, day) =>
      acc + day.techniqueTime + day.theoryTime + day.hearingTime + day.creativityTime, 0
    ) / last7Days.length
    : 0;

  const maxLast7Days = last7Days.length > 0
    ? Math.max(...last7Days.map(day =>
      day.techniqueTime + day.theoryTime + day.hearingTime + day.creativityTime
    ))
    : 0;

  const isRecord = totalTime > maxLast7Days && last7Days.length >= 3;
  const isComingBack = streak === 1 && last7Days.length >= 3;
  const isLongStreak = streak >= 7;
  const isMediumStreak = streak >= 3 && streak < 7;
  const isBelowAverage = totalTime < avgLast7Days * 0.7 && avgLast7Days > 0;
  const isAboveAverage = totalTime > avgLast7Days * 1.3 && avgLast7Days > 0;
  const isShortSession = totalTime < 900000;
  const isLongSession = totalTime > 3600000;

  const skillsCount = [techniqueTime, theoryTime, hearingTime, creativityTime].filter(t => t > 0).length;
  const dominantSkill =
    techniqueTime > theoryTime && techniqueTime > hearingTime && techniqueTime > creativityTime ? 'technique' :
      theoryTime > techniqueTime && theoryTime > hearingTime && theoryTime > creativityTime ? 'theory' :
        hearingTime > techniqueTime && hearingTime > theoryTime && hearingTime > creativityTime ? 'hearing' :
          creativityTime > techniqueTime && creativityTime > theoryTime && creativityTime > hearingTime ? 'creativity' :
            null;

  const missingSkills: string[] = [];
  if (techniqueTime === 0) missingSkills.push('technique');
  if (theoryTime === 0) missingSkills.push('theory');
  if (hearingTime === 0) missingSkills.push('hearing');
  if (creativityTime === 0) missingSkills.push('creativity');

  if (isRecord) {
    const comments = [
      "🔥 Personal record! This is your longest session in the last week. That's serious dedication!",
      "New record unlocked! You just outpracticed yourself from the past 7 days. Keep this energy!",
      "This is your best session this week! Your commitment is showing real growth.",
      "Record-breaking practice today! You're raising the bar. This is how progress happens.",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (isComingBack) {
    const comments = [
      "Welcome back to the grind! The first day back is always the hardest - you crushed it.",
      "Great to see you back! Consistency beats perfection. Let's keep this momentum going.",
      "You're back! The guitar missed you. Let's rebuild that streak starting now.",
      "First step taken! Coming back after a break shows real commitment. Proud of you.",
      "Back in action! Every restart is a chance to build better habits. Let's go!",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (isLongStreak && isLongSession) {
    const comments = [
      `${streak} days strong and a ${convertMsToHM(totalTime)} session? You're a machine!`,
      `Day ${streak} of crushing it! This consistency + dedication = unstoppable.`,
      `${streak}-day streak with quality practice time. This is elite-level discipline.`,
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (isLongStreak) {
    const comments = [
      `${streak} days in a row! Your dedication is building something special. Keep going!`,
      `Week ${Math.floor(streak / 7)}+ complete! This streak is proof of your commitment.`,
      `${streak} consecutive days. You're not just practicing - you're becoming a musician.`,
      "This streak is legendary! Missing a day would feel weird now, wouldn't it?",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (skillsCount === 4) {
    const comments = [
      "All four skills today! You're building a complete, well-rounded skill set. Perfect!",
      "Technique, theory, ear, AND creativity? That's how you become a complete guitarist!",
      "Balanced practice is smart practice. Hitting all areas keeps you versatile.",
      "Full-spectrum training today! This balanced approach accelerates growth.",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (skillsCount === 1 && dominantSkill) {
    const skillMessages: Record<string, string[]> = {
      technique: [
        "Pure technique grind! Sometimes you need to focus and drill the fundamentals. Solid choice.",
        "100% technique work. Those clean, precise movements are the foundation of everything.",
        "Technique-only session! Muscle memory doesn't build itself - this matters.",
      ],
      theory: [
        "Deep dive into theory! Understanding the 'why' makes the 'how' so much clearer.",
        "All theory today! Your fretboard is about to make way more sense. Knowledge is power.",
        "Theory-focused session! You're building the map that guides your fingers.",
      ],
      hearing: [
        "Ear training exclusive! Your musical intuition is leveling up. These gains are invisible but huge.",
        "100% ear work. Your ability to hear and recognize patterns will transform your playing.",
        "All hearing today! Training your ears is like giving yourself a musical superpower.",
      ],
      creativity: [
        "Pure creativity session! This is where you find YOUR voice on the guitar. Keep experimenting!",
        "All creativity today! Improvisation and exploration - this is where the magic happens.",
        "Creativity-only practice! This is how you stop playing notes and start making music.",
      ],
    };
    return skillMessages[dominantSkill][Math.floor(Math.random() * skillMessages[dominantSkill].length)];
  }

  if (missingSkills.length === 3) {
    const practiced = ['technique', 'theory', 'hearing', 'creativity'].find(s => !missingSkills.includes(s));
    return `Laser focus on ${practiced} today! Sometimes deep work on one area beats scattered effort.`;
  }

  if (missingSkills.length === 2 && skillsCount === 2) {
    const practiced = ['technique', 'theory', 'hearing', 'creativity'].filter(s => !missingSkills.includes(s));
    return `${practiced[0]} + ${practiced[1]} combo today! Smart pairing. Next time consider ${missingSkills[0]} or ${missingSkills[1]}?`;
  }

  if (habitsCount >= 4) {
    const comments = [
      "4+ healthy habits adopted! Warmup, metronome, recording - you're doing it RIGHT.",
      "Full habit stack activated! This professional approach shows in your playing.",
      "All the good habits checked! You're not just practicing - you're practicing smart.",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (isShortSession && isMediumStreak) {
    const comments = [
      `Quick ${convertMsToHM(totalTime)} session but ${streak} days strong! Consistency > duration every time.`,
      "Short session, long streak. You're proving that showing up matters more than perfect conditions.",
      "Brief but consistent! Your streak shows you understand: small efforts compound into mastery.",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (isAboveAverage) {
    return "Above your weekly average! You're trending upward. This momentum is everything.";
  }

  if (isBelowAverage && !isShortSession) {
    return "A bit under your usual, but you still showed up. That's what matters. Consistency builds champions.";
  }

  if (isLongSession) {
    const comments = [
      `${convertMsToHM(totalTime)} session! That's serious time investing in your craft. Respect.`,
      "Over an hour! Sessions like this are where breakthroughs happen. Quality time invested.",
      "Long session grind! Your future self is thanking you for this work right now.",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  const generalComments = [
    "Solid practice session! Every minute counts toward your guitar mastery.",
    "Another day, another step forward. This is how real progress is made.",
    "Practice logged! You're building skills and discipline at the same time.",
    "Great work today! Small consistent efforts lead to extraordinary results.",
    "You showed up and put in the work. That's what separates dreamers from players.",
  ];

  return generalComments[Math.floor(Math.random() * generalComments.length)];
}

function convertMsToHM(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
