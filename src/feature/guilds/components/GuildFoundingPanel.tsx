import { Button } from "assets/components/ui/button";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import { NewGuildDialog } from "feature/guilds/components/NewGuildDialog";
import { useGuildMutations, useGuilds } from "feature/guilds/hooks/useGuilds";
import { GUILD_SEATS_PER_UPGRADE } from "feature/supporterPanel/constants/supporterPanel.constants";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, Plus, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

/**
 * Founding a guild, in the panel where the tokens are.
 *
 * Only the founding. Browsing, applying, the chat, the shelf and the weekly
 * challenge all live at /guilds, where everyone can reach them — this is the
 * till, not a second shop. All that matters here is a price next to a button —
 * the wallet it spends from is drawn once, above the tabs.
 */
export const GuildFoundingPanel = ({
  wallet,
  enabled,
}: {
  wallet: SupporterWallet | undefined;
  enabled: boolean;
}) => {
  const { t } = useTranslation("guilds");
  const [isFounding, setIsFounding] = useState(false);
  const uid = useAppSelector(selectUserAuth);
  const { data, isLoading } = useGuilds(enabled);
  const { found } = useGuildMutations();

  if (isLoading || !data) {
    return (
      <div className='space-y-8'>
        <div className='h-40 animate-pulse rounded-lg bg-zinc-900/40' />
      </div>
    );
  }

  const tokensLeft = wallet?.left ?? data.tokensLeft;
  const myGuild = data.guilds.find((guild) => guild.id === data.myGuildId);
  const canAfford = tokensLeft >= data.foundingCost;

  return (
    <div className='space-y-8'>
      {myGuild ? (
        <section className='space-y-4 rounded-lg bg-zinc-900/40 p-6'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <GuildCrest logo={myGuild.logo} tag={myGuild.tag} isMine />
              <div>
                <h3 className='flex items-center gap-2 text-base font-bold text-zinc-100'>
                  {myGuild.name}
                  {myGuild.logo && (
                    <span className='rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-zinc-500'>
                      {myGuild.tag}
                    </span>
                  )}
                </h3>
                <p className='mt-0.5 inline-flex items-center gap-1.5 text-xs text-zinc-500'>
                  <Users size={12} />
                  {t("founding.seats", {
                    count: myGuild.memberCount,
                    limit: myGuild.memberLimit,
                  })}
                  {myGuild.founderUid === uid && ` · ${t("founding.yours")}`}
                </p>
              </div>
            </div>

            <Button asChild variant='ghost' className='h-9 text-zinc-300'>
              <Link href='/guilds'>
                <span className='flex items-center gap-2'>
                  {t("founding.open")}
                  <ArrowRight size={14} />
                </span>
              </Link>
            </Button>
          </div>

          <p className='text-sm text-zinc-400'>
            {myGuild.founderUid === uid
              ? t("founding.founder_note")
              : t("founding.member_note")}{" "}
            {t("founding.seats_note", { count: GUILD_SEATS_PER_UPGRADE })}
          </p>
        </section>
      ) : (
        <section className='space-y-5 rounded-lg bg-zinc-900/40 p-6'>
          <div className='flex items-start gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
              <Shield size={20} />
            </span>
            <div>
              <h3 className='flex items-center gap-1.5 text-base font-bold text-zinc-100'>
                {t("founding.title")}
                <SupportToken size={22} />
                {data.foundingCost}
              </h3>
              <p className='mt-1 max-w-xl text-sm leading-relaxed text-zinc-400'>
                {t("founding.body")}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            <Button onClick={() => setIsFounding(true)} disabled={!canAfford}>
              <span className='flex items-center gap-2'>
                <Plus size={16} />
                {canAfford ? (
                  <span className='flex items-center gap-1.5'>
                    {t("founding.cta")}
                    <SupportToken size={20} />
                    {data.foundingCost}
                  </span>
                ) : (
                  t("founding.not_enough")
                )}
              </span>
            </Button>

            <Link
              href='/guilds'
              className='text-xs text-zinc-500 transition-colors hover:text-zinc-300'>
              {t("founding.see_existing")}
            </Link>
          </div>
        </section>
      )}

      <NewGuildDialog
        open={isFounding}
        onOpenChange={setIsFounding}
        cost={data.foundingCost}
        tokensLeft={tokensLeft}
        busy={found.isPending}
        onSubmit={async (input) => {
          await found.mutateAsync(input);
        }}
      />
    </div>
  );
};
