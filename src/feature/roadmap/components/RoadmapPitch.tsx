import { Coffee, Heart, MessagesSquare, Sparkles } from "lucide-react";

const BMC_URL = "https://buymeacoffee.com/riffquest";
const DISCORD_URL = "https://discord.gg/6yJmsZW2Ne";

const POINTS = [
  {
    icon: Sparkles,
    accent: "text-cyan-400",
    title: "You decide what's next",
    text: "Every bit of support pushes the bar above closer to the next goal. Backers also get a direct say in what I work on, so the order things get built in is genuinely up to you.",
  },
  {
    icon: Heart,
    accent: "text-amber-400",
    title: "Free for everyone",
    text: "There are no paywalls and no locked features. The people who pitch in are covering the cost so that everyone, including players who can't, gets to keep using all of it for free.",
  },
  {
    icon: MessagesSquare,
    accent: "text-emerald-400",
    title: "Built in the open",
    text: "This is a real roadmap from one guitarist, not a vague marketing promise. You can follow every step here and watch each feature actually get finished and shipped.",
  },
];

export const RoadmapPitch = () => {
  return (
    <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <h2 className='text-lg font-bold text-white'>Help build Riff Quest</h2>
      <p className='mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400'>
        Riff Quest is a one-person project that I build out in the open, just for
        guitarists. There are no investors and nothing hidden behind a paywall.
        The people who use it are the ones who decide what gets made next, and
        every coffee goes straight into building the next thing on the bar above.
      </p>
      <p className='mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400'>
        You can help by buying a coffee, or simply by joining the community and
        telling me what you want to see. Either way you are part of shaping where
        Riff Quest goes from here.
      </p>

      <div className='mt-5 grid gap-4 sm:grid-cols-3'>
        {POINTS.map(({ icon: Icon, accent, title, text }) => (
          <div key={title} className='flex flex-col gap-2'>
            <Icon size={20} className={accent} />
            <h3 className='text-sm font-semibold text-zinc-100'>{title}</h3>
            <p className='text-xs leading-relaxed text-zinc-400'>{text}</p>
          </div>
        ))}
      </div>

      {/* The primary amber CTA lives once at the top of the page, so here we
          keep only quiet text links to avoid competing calls to action. */}
      <div className='mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm'>
        <a
          href={BMC_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 font-medium text-amber-400 transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50'>
          <Coffee size={16} />
          Support Riff Quest
        </a>
        <a
          href={DISCORD_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 font-medium text-zinc-300 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
          <MessagesSquare size={16} className='text-zinc-400' />
          Join the community
        </a>
      </div>
    </section>
  );
};
