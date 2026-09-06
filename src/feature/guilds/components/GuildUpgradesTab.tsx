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
      <div className='space-y-1'>
        <h2 className='text-lg font-bold text-zinc-100'>Upgrades</h2>
        <p className='max-w-2xl text-sm text-zinc-400'>
          Paid together. Anyone in the guild puts in, the pots buy their step
          the moment they are covered, and nothing anybody put in is ever handed
          back — it bought room the whole guild is standing in. Everything put
          in earns <span className='font-semibold text-zinc-200'>honor</span>,
          the guild&apos;s own currency, which is what gear on the shelf is
          taken for.
        </p>
      </div>

      <GuildFundBar
        fund={guild.funds.seats}
        title='More seats'
        standing={
          freeSeats === 0
            ? `Every one of the ${guild.memberLimit} seats is taken`
            : `${guild.memberCount} of ${guild.memberLimit} seats taken, room for ${freeSeats} more`
        }
        buys={`${GUILD_SEATS_PER_UPGRADE} more seats`}
        maxed={`a guild tops out at ${GUILD_MAX_SEATS} seats`}
        members={guild.members}
        tokensLeft={tokensLeft}
        busy={busy}
        onPledge={(tokens) => fund.mutate({ track: "seats", tokens })}
      />

      <GuildFundBar
        fund={guild.funds.stashRows}
        title='Another shelf row'
        standing={`The stash has ${guild.stashRowLimit} ${
          guild.stashRowLimit === 1 ? "row" : "rows"
        } of sockets`}
        buys='one more row'
        maxed={`a shelf tops out at ${GUILD_MAX_STASH_ROWS} rows`}
        members={guild.members}
        tokensLeft={tokensLeft}
        busy={busy}
        onPledge={(tokens) => fund.mutate({ track: "stashRows", tokens })}
      />

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
