import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { DISCORD_INVITE_URL } from "constants/community";
import Link from "next/link";
import type { ReactNode } from "react";

const LINK_CLASS =
  "text-zinc-200 underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-white hover:decoration-zinc-300";

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Why does everyone get access for free?",
    a: "Riff Quest stays free for everyone, full stop. When you support it you are not buying access for yourself, you are paying for development that the whole community gets to use. It works as a running total, not a subscription, so once a goal is reached it stays unlocked for good.",
  },
  {
    q: "How long does it take to ship one goal?",
    a: "It really depends on the goal. Something small can be ready in a couple of days, while a more demanding tier might take around two weeks. As a rule, the bigger the unlock the more time it needs, and I would rather take a few extra days than ship something half finished.",
  },
  {
    q: "How does the supporter badge find my account?",
    a: (
      <>
        By matching the email on the donation to your account. If you paid from
        another address, just{" "}
        <a
          href={DISCORD_INVITE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className={LINK_CLASS}>
          message me on Discord
        </a>{" "}
        so I can attach it by hand. Tokens are spent in the{" "}
        <Link href='/supporter' className={LINK_CLASS}>
          supporter panel
        </Link>
        .
      </>
    ),
  },
  {
    q: "What happens when every goal is reached?",
    a: "The counter resets and a brand new roadmap goes up, built around the ideas you send in. Reaching the end is not a finish line, it is just the start of the next round of features.",
  },
];

/**
 * Collapsed by default: the answers matter to the person who is hesitating,
 * not to the one who already scrolled past the button, so they should not
 * add a screen of text for everyone.
 */
export const RoadmapFaq = () => {
  return (
    <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <h2 className='text-base font-semibold text-zinc-100'>Questions</h2>

      <Accordion type='single' collapsible className='mt-2 w-full'>
        {FAQ.map(({ q, a }, i) => (
          <AccordionItem key={q} value={`faq-${i}`} className='border-b-0'>
            <AccordionTrigger className='py-4 text-left text-sm font-semibold text-zinc-200 hover:text-white hover:no-underline'>
              {q}
            </AccordionTrigger>
            <AccordionContent className='max-w-3xl pb-5 text-sm leading-relaxed text-zinc-400'>
              {a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
