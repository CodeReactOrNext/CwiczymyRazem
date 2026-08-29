import { Clock, Gift, HeartHandshake, RefreshCw } from "lucide-react";
import Link from "next/link";

const DISCORD_URL = "https://discord.gg/6yJmsZW2Ne";

const FAQ = [
  {
    icon: HeartHandshake,
    q: "Why does everyone get access for free?",
    a: (
      <>
        Riff Quest stays free for everyone, full stop. When you support it you
        are not buying access for yourself, you are paying for development that
        the whole community gets to use. It works as a running total, not a
        subscription, so once a goal is reached it stays unlocked for good.
      </>
    ),
  },
  {
    icon: Clock,
    q: "How long does it take to ship one goal?",
    a: (
      <>
        It really depends on the goal. Something small can be ready in a couple
        of days, while a more demanding tier might take around two weeks. As a
        rule, the bigger the unlock the more time it needs, and I would rather
        take a few extra days than ship something half finished.
      </>
    ),
  },
  {
    icon: Gift,
    q: "What do I get in return?",
    a: (
      <>
        Tokens, and the{" "}
        <Link
          href='/supporter'
          className='text-cyan-400 transition-colors hover:text-cyan-300'>
          supporter panel
        </Link>{" "}
        to spend them in: post and back roadmap ideas, propose the gear that
        goes into the Arsenal, vote on the supporter case and next week&apos;s
        challenge, or found a guild. On top of that a special role on our{" "}
        <a
          href={DISCORD_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='text-cyan-400 transition-colors hover:text-cyan-300'>
          Discord
        </a>{" "}
        and a channel just for supporters, where you can see what I am working
        on behind the scenes. The badge is handed out by matching the email on
        the donation to your account — if you paid from another address, just{" "}
        <a
          href={DISCORD_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='text-cyan-400 transition-colors hover:text-cyan-300'>
          message me on Discord
        </a>{" "}
        so I can attach it by hand.
      </>
    ),
  },
  {
    icon: RefreshCw,
    q: "What happens when every goal is reached?",
    a: (
      <>
        When every goal has been reached the counter resets and a brand new
        roadmap goes up, built around the ideas you send in. Reaching the end is
        not a finish line, it is just the start of the next round of features.
      </>
    ),
  },
];

export const RoadmapFaq = () => {
  return (
    <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <h2 className='text-sm font-semibold text-zinc-200'>FAQ</h2>

      <div className='mt-4 space-y-6'>
        {FAQ.map(({ icon: Icon, q, a }) => (
          <div key={q} className='flex gap-3'>
            <Icon size={18} className='mt-0.5 shrink-0 text-zinc-500' />
            <div>
              <h3 className='text-sm font-semibold text-zinc-100'>{q}</h3>
              <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>
                {a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
