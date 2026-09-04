import { getServerDateKey } from "utils/converter";
import { getLocalDayKey } from "utils/gameLogic/localDay";

/**
 * The calendar day a daily quest belongs to, as a `YYYY-MM-DD` key, resolved in
 * the player's own timezone.
 *
 * The quest used to be stamped with the UTC day. That reads as fair — one day
 * for everyone at once — but the quest is not a shared deadline: it is a private
 * checklist for one player's own practice. Keyed to UTC it flips at 17:00 in Los
 * Angeles, i.e. in the middle of the evening those players practice in, so an
 * evening session was scored against a set the player had never seen, and the
 * set they had been looking at all afternoon vanished as they sat down. Keyed to
 * their own day it flips at their midnight, like the streak already does.
 *
 * The zone is read from the profile (`statistics.timeZone`, rewritten with every
 * report), never from the device clock, so a phone and a laptop in different
 * places still agree on which quest is current. Only a player who has never
 * filed a report has no stored zone; `getLocalDayKey` then falls back to the
 * device's own day, which is the best guess available and self-corrects with
 * their first session.
 */
export const getQuestDayKey = (
  timeZone?: string | null,
  date: Date = new Date()
): string => getLocalDayKey(date, timeZone);

/**
 * Whether a stored quest is one the player is in the middle of right now,
 * despite carrying the old UTC key.
 *
 * Quests drawn before this change are stamped with the UTC day, which for
 * anyone not on UTC names a different day than `getQuestDayKey` does. Read
 * literally, every one of them is "from another day" — so a player mid-set
 * would have it torn down and redrawn, losing whatever progress was already in
 * it. A stored key that is today's *UTC* day is by definition the set the
 * player is holding, so it gets re-stamped with their own day instead.
 *
 * Only reachable while pre-migration quests exist: once a quest carries a
 * local-day key, it equals today's UTC key only in zones where the two days
 * coincide anyway, and the second condition then rules it out.
 */
export const isPreMigrationQuestDay = (
  storedDate: string,
  questToday: string,
  date: Date = new Date()
): boolean => storedDate !== questToday && storedDate === getServerDateKey(date);
