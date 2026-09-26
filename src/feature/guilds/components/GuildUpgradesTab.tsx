import { GuildFundBar } from "feature/guilds/components/GuildFundBar";
import { GuildTreasuryPanel } from "feature/guilds/components/GuildTreasuryPanel";
import { questById } from "feature/guilds/data/guildQuests";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import type { Guild, GuildQuestBoard } from "feature/guilds/types/guild.types";
import {
  GUILD_MAX_SEATS,
  GUILD_MAX_STASH_ROWS,
} from "feature/guilds/utils/guildUpgrades.utils";
import { GUILD_SEATS_PER_UPGRADE } from "feature/supporterPanel/constants/supporterPanel.constants";
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
        <h2 className='text-xl font-bold text-white'>Upgrades</h2>
        <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
          Everyone chips in, and an upgrade buys itself the moment its pot is
          full. Whatever you put in earns you{" "}
          <span className='font-semibold text-purple-300'>honor</span> to spend
          on the shelf.
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <GuildFundBar
          icon={Armchair}
          fund={guild.funds.seats}
          title='More seats'
          standing={
            freeSeats === 0
              ? `All ${guild.memberLimit} seats taken`
              : `${guild.memberCount} of ${guild.memberLimit} seats taken`
          }
          buys={`${GUILD_SEATS_PER_UPGRADE} more seats`}
          maxed={`a guild tops out at ${GUILD_MAX_SEATS} seats`}
          members={guild.members}
          tokensLeft={tokensLeft}
          busy={busy}
          onPledge={(tokens) => fund.mutate({ track: "seats", tokens })}
        />

        <GuildFundBar
          icon={Rows3}
          fund={guild.funds.stashRows}
          title='Another shelf row'
          standing={`Stash has ${guild.stashRowLimit} ${
            guild.stashRowLimit === 1 ? "row" : "rows"
          }`}
          buys='one more row'
          maxed={`a shelf tops out at ${GUILD_MAX_STASH_ROWS} rows`}
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
            ? { label: treasuryQuest.name, cost: treasuryQuest.target }
            : null
        }
        saved={treasuryQuest?.progress}
        busy={busy}
        onDeposit={(amount) => depositFame.mutate(amount)}
      />
    </div>
  );
};
