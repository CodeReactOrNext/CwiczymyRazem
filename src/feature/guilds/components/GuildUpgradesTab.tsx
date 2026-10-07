import { GuildFundBar } from "feature/guilds/components/GuildFundBar";
import { GuildTreasuryPanel } from "feature/guilds/components/GuildTreasuryPanel";
import { questById } from "feature/guilds/data/guildQuests";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import { useGuildText } from "feature/guilds/hooks/useGuildText";
import type { Guild, GuildQuestBoard } from "feature/guilds/types/guild.types";
import {
  GUILD_MAX_SEATS,
  GUILD_MAX_STASH_ROWS,
} from "feature/guilds/utils/guildUpgrades.utils";
import { GUILD_SEATS_PER_UPGRADE } from "feature/supporterPanel/constants/supporterPanel.constants";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { Armchair, Rows3 } from "lucide-react";

/**
 * Everything a guild pays into, in one place.
 *
 * The seat pot used to sit on the guild's card, the shelf pot under the shelf
 * and the Fame bank under the quests — each next to the thing it was for, and
 * each lost among the panels around it. A member who wanted to put something
 * in had to remember which tab it was on. Here they are together, and nowhere
 * else: two token pots that buy themselves the moment they fill, and the Fame
 * bank that is never spent, only counted by the quests.
 */
export const GuildUpgradesTab = ({
  guild,
  board,
  fame,
  tokensLeft,
}: {
  guild: Guild;
  /** The quest board, for the treasury quest the bank counts towards, if any. */
  board: GuildQuestBoard | null;
  /** The caller's own Fame — a deposit comes out of it. */
  fame: number;
  /** The caller's tokens — a pledge comes out of them. */
  tokensLeft: number;
}) => {
  const { t } = useTranslation("guilds");
  const { questName } = useGuildText();
  const { fund, depositFame } = useGuildMutations();
  const busy = fund.isPending || depositFame.isPending;

  const freeSeats = Math.max(0, guild.memberLimit - guild.memberCount);

  const treasuryQuest = board?.active.find(
    (quest) =>
      quest.doneAt === null &&
      questById(quest.questId)?.measure.kind === "treasury",
  );

  return (
    <div className='space-y-8'>
      <div className='space-y-1.5'>
        <h2 className='text-xl font-bold text-white'>{t("tabs.upgrades")}</h2>
        <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
          <Interpolate
            text={t("upgrades.intro")}
            values={{
              honor: (
                <span className='font-semibold text-purple-300'>
                  {t("upgrades.honor")}
                </span>
              ),
            }}
          />
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <GuildFundBar
          icon={Armchair}
          fund={guild.funds.seats}
          title={t("upgrades.seats_title")}
          standing={
            freeSeats === 0
              ? t("upgrades.all_seats", { count: guild.memberLimit })
              : t("seats_taken", {
                  count: guild.memberCount,
                  limit: guild.memberLimit,
                })
          }
          buys={t("upgrades.seats_buys", { count: GUILD_SEATS_PER_UPGRADE })}
          maxed={t("upgrades.seats_max", { count: GUILD_MAX_SEATS })}
          members={guild.members}
          tokensLeft={tokensLeft}
          busy={busy}
          onPledge={(tokens) => fund.mutate({ track: "seats", tokens })}
        />

        <GuildFundBar
          icon={Rows3}
          fund={guild.funds.stashRows}
          title={t("upgrades.rows_title")}
          standing={
            guild.stashRowLimit === 1
              ? t("upgrades.rows_one")
              : t("upgrades.rows", { count: guild.stashRowLimit })
          }
          buys={t("upgrades.rows_buys")}
          maxed={t("upgrades.rows_max", { count: GUILD_MAX_STASH_ROWS })}
          members={guild.members}
          tokensLeft={tokensLeft}
          busy={busy}
          onPledge={(tokens) => fund.mutate({ track: "stashRows", tokens })}
        />
      </div>

      <GuildTreasuryPanel
        treasury={guild.treasury}
        members={guild.members}
        fame={fame}
        goal={
          treasuryQuest
            ? {
                label: questName(
                  treasuryQuest.questId,
                  treasuryQuest.name,
                  treasuryQuest.lap,
                ),
                cost: treasuryQuest.target,
              }
            : null
        }
        saved={treasuryQuest?.progress}
        busy={busy}
        onDeposit={(amount) => depositFame.mutate(amount)}
      />
    </div>
  );
};
