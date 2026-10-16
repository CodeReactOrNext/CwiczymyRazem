import type { DuelTicket } from "feature/duels/types/duel.types";
import type { FirebaseLogsDuelWaitingInterface } from "feature/logs/types/logs.type";

/**
 * The activity-feed row for a player waiting in the duel queue: "someone is
 * waiting, join in".
 *
 * Anonymous — the row carries the ticket's id and its lifetime, never who
 * queued. Its document id is the ticket's, so the transaction that pairs,
 * cancels or expires the ticket can delete the row without looking anything up.
 */

export type DuelWaitingLogDoc = Omit<
  FirebaseLogsDuelWaitingInterface,
  "id" | "reactions" | "reactionFame" | "timestamp" | "data"
> & { data: string; timestamp: string };

export const duelWaitingLogId = (ticketId: string): string =>
  `duel-waiting-${ticketId}`;

export const buildDuelWaitingLog = (
  ticket: Pick<DuelTicket, "id" | "createdAt" | "expiresAt">,
): DuelWaitingLogDoc => {
  const when = new Date(ticket.createdAt).toISOString();

  return {
    type: "duel_waiting",
    data: when,
    timestamp: when,
    ticketId: ticket.id,
    expiresAt: ticket.expiresAt,
  };
};
