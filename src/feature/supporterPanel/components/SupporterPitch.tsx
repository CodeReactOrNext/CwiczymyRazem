/* eslint-disable @next/next/no-img-element */
import { Button } from "assets/components/ui/button";
import { DISCORD_INVITE_URL } from "constants/community";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { useAccountEmail } from "feature/supporterPanel/hooks/useAccountEmail";
import { SupporterStrip } from "feature/supportTeam/components/SupporterStrip";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { Heart } from "lucide-react";

/**
 * What somebody who hasn't donated yet sees first at /supporter: a note from
 * the person who builds the app, with his photo.
 *
 * It asks for support and says where the money goes, and nothing else. No
 * amounts, no tokens, no list of perks: this is a community-funded project, and
 * a price list at the door reads like a shop. What a donation brings back is
 * told right under it, by `RoadmapPerks`.
 *
 * The one practical thing that has to be said out here is which address to pay
 * from: a donation carrying an email the account isn't on leaves the badge off,
 * and the person it happened to is by definition looking at this page rather
 * than at the Info tab. So it sits right under the button, at body weight.
 */
export const SupporterPitch = () => {
  const { t } = useTranslation("supporter");
  const email = useAccountEmail();

  return (
    <section className='relative flex flex-col gap-5 overflow-hidden rounded-lg bg-zinc-800/40 p-3 pb-7 md:flex-row md:items-center md:gap-9 md:p-7'>
      {/* Amber, the colour the badge and the avatar ring are already in. */}
      <div className='light-tint pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent' />

      {/* The whole frame on desktop, so the guitar is in it from headstock to
          picking hand; a square cut from the top on a phone. */}
      <img
        src='/images/authors/michal-jablonski.webp'
        alt={t("panel.pitch.photo_alt")}
        width={635}
        height={689}
        className='relative aspect-square w-full shrink-0 rounded-lg object-cover object-[50%_15%] md:aspect-[635/689] md:w-[38%] md:max-w-[300px]'
      />

      <div className='relative min-w-0 px-2 md:px-0 md:py-2'>
        <h2 className='text-balance text-2xl font-bold leading-tight text-zinc-100 md:text-[28px]'>
          {t("panel.pitch.hello")}
        </h2>
        <p className='mt-3 max-w-[54ch] text-base leading-relaxed text-zinc-300'>
          {t("panel.pitch.story")}
        </p>
        <p className='mt-3 max-w-[54ch] text-base leading-relaxed text-zinc-300'>
          {t("panel.pitch.where")}
        </p>
        <p className='mt-3 text-sm text-zinc-400'>{t("panel.pitch.sign")}</p>

        <div className='mt-7 flex flex-col gap-2.5 sm:items-start'>
          <Button asChild size='xl'>
            <a href={BMC_URL} target='_blank' rel='noreferrer'>
              <Heart size={16} fill='currentColor' />
              {t("panel.pitch.support")}
            </a>
          </Button>
          <p className='text-center text-sm text-zinc-400 sm:text-left'>
            {t("hero.coffee_hint")}
          </p>
        </div>

        <p className='mt-6 max-w-[54ch] text-sm leading-relaxed text-zinc-300'>
          {email ? (
            <Interpolate
              text={t("panel.pitch.email_known")}
              values={{
                email: <span className='font-bold text-white'>{email}</span>,
              }}
            />
          ) : (
            t("panel.pitch.email")
          )}{" "}
          <span className='text-zinc-400'>
            <Interpolate
              text={t("panel.pitch.other_email")}
              values={{
                discord: (
                  <a
                    href={DISCORD_INVITE_URL}
                    target='_blank'
                    rel='noreferrer'
                    className='font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200'>
                    {t("panel.pitch.write_discord")}
                  </a>
                ),
              }}
            />
          </span>
        </p>

        {/* Faces under the ask, because this is the one spot on the page where
            they are an argument rather than a thank-you: whoever is reading
            sees who already said yes. */}
        <SupporterStrip className='mt-7 w-full' />
      </div>
    </section>
  );
};
