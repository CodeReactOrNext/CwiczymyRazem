import { Button } from "assets/components/ui/button";
import { HeroPattern } from "components/UI/HeroBanner";
import { DISCORD_INVITE_URL } from "constants/community";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { useAccountEmail } from "feature/supporterPanel/hooks/useAccountEmail";
import { SupporterStrip } from "feature/supportTeam/components/SupporterStrip";
import { Heart } from "lucide-react";

/**
 * What somebody who hasn't donated yet sees at /supporter: the door, and
 * nothing behind it.
 *
 * The panel is the pitch — a donation opens the room where riff.quest is
 * decided out loud — but what is inside the room stays inside it. The surfaces
 * and the prices live in `SupporterInfo` on the Info tab, which only a
 * supporter ever reaches.
 *
 * The one thing that has to be said out here is which address to pay from: a
 * donation carrying an email the account isn't on leaves the money parked and
 * the badge off, and the person it happened to is by definition looking at this
 * page rather than at the Info tab.
 */
export const SupporterPitch = () => {
  const email = useAccountEmail();

  return (
    <section className='relative flex flex-col items-start gap-6 overflow-hidden rounded-lg bg-zinc-900/40 p-6 sm:p-8 md:p-10'>
      {/* Amber, the colour the badge and the avatar ring are already in, so the
          door is painted like the thing behind it. Pattern and glow fade out to
          the right, leaving the copy on clean background. */}
      <HeroPattern
        variant='heart'
        className='opacity-[0.09]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
        gradient={["#fbbf24", "#f97316"]}
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent' />

      <span className='relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400'>
        <Heart size={24} fill='currentColor' />
      </span>

      <div className='relative space-y-3'>
        <h2 className='text-xl font-bold text-zinc-100'>
          A donation opens the supporter panel
        </h2>
        <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
          Behind the badge is the room where riff.quest is decided out loud. You
          watch what is being built right now, say what gets built after it,
          pick the gear that goes into the Arsenal and into the cases, and set
          the challenge the whole app plays for that week.
        </p>
      </div>

      <Button asChild size='lg' className='relative'>
        <a href={BMC_URL} target='_blank' rel='noreferrer'>
          <span className='flex items-center gap-2'>
            <Heart size={16} fill='currentColor' />
            Support the project
          </span>
        </a>
      </Button>

      {/* Faces right under the button, because this is the one spot on the page
          where they are an argument rather than a thank-you: whoever is reading
          the ask sees who already said yes. No link on the caption — the full
          wall, with names and levels, is the next thing down the page. */}
      {/* w-full, not the column's default max-content: the row has to know how
          wide the box is to wrap inside it instead of running past the edge. */}
      <SupporterStrip className='relative w-full' />

      <p className='relative max-w-2xl text-sm leading-relaxed text-zinc-500'>
        Pay with the email this account is on
        {email ? (
          <>
            {" — "}
            <span className='font-bold text-zinc-300'>{email}</span>
          </>
        ) : null}
        ; that match is what opens the panel. Donated from another address
        already? Nothing is lost —{" "}
        <a
          href={DISCORD_INVITE_URL}
          target='_blank'
          rel='noreferrer'
          className='font-bold text-zinc-400 underline underline-offset-2 hover:text-zinc-200'>
          write to me on Discord
        </a>{" "}
        and I&apos;ll attach it by hand.
      </p>
    </section>
  );
};
