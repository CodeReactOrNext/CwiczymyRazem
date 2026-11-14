import { Button } from "assets/components/ui/button";
import { DISCORD_INVITE_URL } from "constants/community";
import { TokenExchange } from "feature/supporterPanel/components/TokenExchange";
import { useAccountEmail } from "feature/supporterPanel/hooks/useAccountEmail";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { AtSign, Guitar, Map, Shield, Store } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";

/**
 * The Info tab: what a dollar turns into, what each tab of the panel is for,
 * and which email to donate with.
 *
 * No price list. Every price is printed on the button that spends it, in the
 * tab it belongs to, so a second copy here would only be one more place to go
 * out of date — and a wall of numbers was what made this tab hard to read.
 */

/** One card per tab that spends tokens, in the order the panel shows them; copy in `supporter:panel.info.surfaces`. */
const SURFACES: { id: string; icon: typeof Map }[] = [
  { id: "roadmap", icon: Map },
  { id: "gear", icon: Guitar },
  { id: "shop", icon: Store },
  { id: "guild", icon: Shield },
];

export const SupporterInfo = () => {
  const { t } = useTranslation("supporter");
  const email = useAccountEmail();

  return (
    <div className='space-y-14'>
      <TokenExchange />

      <section>
        <h2 className='text-lg font-semibold text-zinc-100'>
          {t("perks.spend_title")}
        </h2>

        <div className='mt-6 grid gap-4 md:grid-cols-2'>
          {SURFACES.map(({ id, icon: Icon }) => (
            <article key={id} className='rounded-lg bg-zinc-900/40 p-6 sm:p-7'>
              <div className='flex items-center gap-3'>
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300'>
                  <Icon size={18} />
                </span>
                <h3 className='text-base font-semibold text-zinc-100'>
                  {t(`panel.info.surfaces.${id}.title`)}
                </h3>
              </div>
              <p className='mt-4 text-sm leading-relaxed text-zinc-300'>
                {t(`panel.info.surfaces.${id}.body`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className='space-y-5 rounded-lg bg-amber-500/5 p-6 sm:p-8'>
        <h2 className='flex items-center gap-2.5 text-lg font-semibold text-zinc-100'>
          <AtSign size={18} className='text-amber-300' />
          {t("panel.info.donate_email")}
        </h2>

        <p className='max-w-2xl text-sm leading-relaxed text-zinc-300'>
          {email ? (
            <Interpolate
              text={t("panel.info.email_known")}
              values={{
                email: (
                  <span className='font-semibold text-zinc-100'>{email}</span>
                ),
              }}
            />
          ) : (
            t("panel.info.email")
          )}
        </p>

        <Button asChild variant='secondary' className='self-start'>
          <a href={DISCORD_INVITE_URL} target='_blank' rel='noreferrer'>
            <span className='flex items-center gap-2'>
              <FaDiscord size={16} />
              {t("panel.info.message_discord")}
            </span>
          </a>
        </Button>
      </section>
    </div>
  );
};
