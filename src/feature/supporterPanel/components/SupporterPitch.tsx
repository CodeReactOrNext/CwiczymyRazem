import { Button } from "assets/components/ui/button";
import { DISCORD_INVITE_URL } from "constants/community";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { useAccountEmail } from "feature/supporterPanel/hooks/useAccountEmail";
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
    <section className='flex flex-col items-start gap-6 rounded-lg bg-zinc-900/40 p-6 sm:p-8 md:p-10'>
      <span className='flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400'>
        <Heart size={24} fill='currentColor' />
      </span>

      <div className='space-y-3'>
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

      <Button asChild size='lg'>
        <a href={BMC_URL} target='_blank' rel='noreferrer'>
          <span className='flex items-center gap-2'>
            <Heart size={16} fill='currentColor' />
            Support the project
          </span>
        </a>
      </Button>

      <p className='max-w-2xl text-sm leading-relaxed text-zinc-500'>
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
