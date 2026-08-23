import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { FameIcon, PointsIcon } from "feature/challenges/components/RewardIcons";
import {
  Calendar,
  Flame,
  Gem,
  Heart,
  Music,
  Star,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
  Video,
} from "lucide-react";

/**
 * A reward figure with its currency mark. The `currency` switch earns its keep:
 * a couple of the actions below pay fame rather than points, and stamping the
 * points coin next to them is exactly the drift this page exists to prevent.
 */
const PointsValue = ({
  value,
  className,
  iconClassName,
  currency = "points",
}: {
  value: string;
  className?: string;
  iconClassName?: string;
  currency?: "points" | "fame";
}) => (
  <span className={cn("inline-flex items-center gap-1.5 font-bold", className)}>
    {value}
    {currency === "fame" ? (
      <FameIcon className={cn("h-5 w-5", iconClassName)} />
    ) : (
      <PointsIcon className={cn("h-5 w-5", iconClassName)} />
    )}
  </span>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className='mb-4'>
    <h2 className='text-base font-bold text-white tracking-wide'>{title}</h2>
    <p className='mt-0.5 text-xs text-zinc-500'>{subtitle}</p>
  </div>
);

const EarnCard = ({
  icon,
  title,
  reward,
  description,
  currency = "points",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  reward: string;
  description: string;
  currency?: "points" | "fame";
  children?: React.ReactNode;
}) => (
  <Card className='flex flex-col p-5 sm:p-6'>
    <div className='flex items-center gap-3'>
      <span className='text-zinc-600'>{icon}</span>
      <h3 className='text-[12px] font-semibold text-zinc-400 tracking-wide'>
        {title}
      </h3>
    </div>
    <PointsValue
      value={reward}
      currency={currency}
      className='mt-4 text-2xl text-white tracking-tight'
      iconClassName='h-6 w-6'
    />
    <p className='mt-2 text-xs leading-relaxed text-zinc-400'>{description}</p>
    {children}
  </Card>
);

const STREAK_STEPS = [
  { day: "Day 1", bonus: "—", active: false },
  { day: "Day 2", bonus: "+20%", active: true },
  { day: "Day 3", bonus: "+30%", active: true },
  { day: "Day 4", bonus: "+40%", active: true },
  { day: "Day 5+", bonus: "+50%", active: true, max: true },
];

const HABITS = [
  "Warm-up",
  "Metronome",
  "Learned something new",
  "Exercise plan",
  "Recording",
];

export const ScoringGuideView = () => {
  return (
    <div className='mx-auto w-full max-w-5xl space-y-10 p-4 sm:p-6'>
      {/* Ways to earn */}
      <section>
        <SectionHeader
          title='Ways to Earn Points'
          subtitle='Every action below feeds your level, the leaderboard, and the current season.'
        />
        <div className='grid gap-4 md:grid-cols-2'>
          <EarnCard
            icon={<Timer size={18} />}
            title='Practice Time'
            reward='+22 / hour'
            description='Log your practice session. Every practised hour is worth 22 points — all four categories count the same.'>
            <div className='mt-4 grid grid-cols-3 gap-2'>
              {[
                { time: "15 min", pts: "+5" },
                { time: "30 min", pts: "+11" },
                { time: "1 hour", pts: "+22" },
              ].map(({ time, pts }) => (
                <div
                  key={time}
                  className='flex flex-col items-center gap-1 rounded-lg bg-zinc-800/60 px-2 py-3'>
                  <span className='text-[11px] font-medium text-zinc-500'>{time}</span>
                  <PointsValue
                    value={pts}
                    className='text-sm text-white'
                    iconClassName='h-4 w-4'
                  />
                </div>
              ))}
            </div>
          </EarnCard>

          <EarnCard
            icon={<Heart size={18} />}
            title='Healthy Habits'
            reward='+1 each'
            description='Check off the habits you used when logging a session — up to 5 points per report.'>
            <div className='mt-4 flex flex-wrap gap-1.5'>
              {HABITS.map((habit) => (
                <span
                  key={habit}
                  className='rounded-full bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300'>
                  {habit}
                </span>
              ))}
            </div>
          </EarnCard>

          <EarnCard
            icon={<Music size={18} />}
            title='Learn a Song'
            reward='+30'
            description='Mark a song as Learned after at least 30 minutes of practice on it. Counts toward your level, not the season. Moving it back takes the points away.'
          />

          <EarnCard
            icon={<Star size={18} />}
            title='Rate Song Difficulty'
            reward='+3'
            currency='fame'
            description='Rate how hard a song is in the community library. Pays fame, not points — awarded once per song, on your first rating.'
          />

          <EarnCard
            icon={<Swords size={18} />}
            title='Daily Quests'
            reward='+10'
            description='Complete all 3 daily quest tasks on your dashboard and claim the reward. New quests every day.'
          />

          <EarnCard
            icon={<Video size={18} />}
            title='Monthly Challenge'
            reward='+50'
            description='Put a recording on a song from the current challenge board. Points pay for your first 5 songs on a board; every recording still pays fame.'
          />

          <EarnCard
            icon={<Gem size={18} />}
            title='Scale Journey Rewards'
            reward='+100'
            description='Master a full scale position on the Scale Tree for a one-time 100 points and 50 fame. Counts toward your level, not the season.'
          />
        </div>
      </section>

      {/* Streak multiplier */}
      <section>
        <SectionHeader
          title='Streak Multiplier'
          subtitle='Practice on consecutive days and your whole session (time + habits) is worth more. Skip a day and the streak resets.'
        />
        <Card className='p-5 sm:p-6'>
          <div className='grid grid-cols-5 gap-2'>
            {STREAK_STEPS.map(({ day, bonus, active, max }) => (
              <div
                key={day}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-1 py-3.5",
                  max
                    ? "border-orange-500/40 bg-orange-500/15"
                    : active
                    ? "border-transparent bg-zinc-800/80"
                    : "border-transparent bg-zinc-800/40"
                )}>
                <Flame
                  size={18}
                  className={
                    max
                      ? "fill-orange-500/30 text-orange-400"
                      : active
                      ? "text-orange-400/60"
                      : "text-zinc-600"
                  }
                />
                <span className='text-[10px] font-medium text-zinc-500'>{day}</span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    max ? "text-orange-300" : active ? "text-zinc-300" : "text-zinc-600"
                  )}>
                  {bonus}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Example */}
      <section>
        <SectionHeader
          title='Example Session'
          subtitle='30 minutes of practice, 3 healthy habits, on a 5-day streak.'
        />
        <Card className='p-5 sm:p-6'>
          <div className='flex flex-wrap items-center justify-center gap-2 text-center sm:gap-3'>
            <div className='flex min-w-[100px] flex-col items-center gap-1.5 rounded-lg bg-zinc-800/60 px-4 py-3.5'>
              <span className='text-[11px] text-zinc-500'>30 min practice</span>
              <PointsValue value='+11' className='text-base text-white' iconClassName='h-4 w-4' />
            </div>
            <span className='text-lg font-bold text-zinc-600'>+</span>
            <div className='flex min-w-[100px] flex-col items-center gap-1.5 rounded-lg bg-zinc-800/60 px-4 py-3.5'>
              <span className='text-[11px] text-zinc-500'>3 habits</span>
              <PointsValue value='+3' className='text-base text-white' iconClassName='h-4 w-4' />
            </div>
            <span className='text-lg font-bold text-zinc-600'>+</span>
            <div className='flex min-w-[100px] flex-col items-center gap-1.5 rounded-lg bg-orange-500/10 px-4 py-3.5'>
              <span className='text-[11px] text-orange-400/80'>streak +50%</span>
              <PointsValue
                value='+7'
                className='text-base text-orange-300'
                iconClassName='h-4 w-4'
              />
            </div>
            <span className='text-lg font-bold text-zinc-600'>=</span>
            <div className='flex min-w-[110px] flex-col items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-3.5'>
              <span className='text-[11px] text-cyan-400/80'>session total</span>
              <PointsValue value='+21' className='text-xl text-cyan-300' iconClassName='h-5 w-5' />
            </div>
          </div>
        </Card>
      </section>

      {/* What points do */}
      <section>
        <SectionHeader
          title='What Points Do'
          subtitle='Points are more than a number on your profile.'
        />
        <div className='grid gap-4 md:grid-cols-3'>
          {[
            {
              icon: <TrendingUp size={18} />,
              title: "Levels",
              text: "Your total points decide your level. Each level needs progressively more points.",
            },
            {
              icon: <Calendar size={18} />,
              title: "Seasons",
              text: "Practice time, habits, daily quests and challenge recordings also feed the current season. Learned songs and Scale Journey rewards stay on your lifetime total.",
            },
            {
              icon: <Trophy size={18} />,
              title: "Leaderboard",
              text: "Points place you among all Riff Quest guitarists. Consistency beats marathon sessions.",
            },
          ].map(({ icon, title, text }) => (
            <Card key={title} className='flex flex-col p-5 sm:p-6'>
              <div className='flex items-center gap-3'>
                <span className='text-zinc-600'>{icon}</span>
                <h3 className='text-[12px] font-semibold text-zinc-400 tracking-wide'>
                  {title}
                </h3>
              </div>
              <p className='mt-3 text-xs leading-relaxed text-zinc-400'>{text}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
