import type { ChatSystemEvent } from "feature/chat/types/chat.types";
import { systemEventText } from "feature/chat/utils/systemMessages";
import type { GuildBadge } from "feature/guilds/types/guild.types";
import type { CollectionReference } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Rows the chat rooms write themselves. Admin SDK only — the rules keep clients
 * from posting anything but a plain message, so an event in a room is always
 * one that happened.
 *
 * Every writer here is fire-and-forget: the thing that happened (a quest
 * banked, a member seated) is already done, and a missing
 * chat line is not worth failing it over.
 */

/** Firestore's gRPC code for a document that already exists. */
const ALREADY_EXISTS = 6;

const guildChat = (guildId: string) =>
  firestore.collection("guilds").doc(guildId).collection("chat");

interface Author {
  uid: string;
  name: string;
  avatar: string | null;
  lvl: number;
  guildBadge: GuildBadge | null;
}

/** The parts of a user document a chat row copies, the same ones a player's own message carries. */
const authorOf = (uid: string, data: Record<string, any>): Author => ({
  uid,
  name: data.displayName || "Player",
  avatar: data.avatar ?? null,
  lvl: data.statistics?.lvl ?? data.statistics?.level ?? 0,
  guildBadge: data.guildBadge ?? null,
});

/**
 * Writes one row. With a `docId` it is written with `create`, so two requests
 * racing to announce the same thing post it once.
 */
const writeRow = async (
  room: CollectionReference,
  row: Record<string, unknown>,
  docId?: string,
): Promise<void> => {
  const data = { ...row, likes: [], timestamp: FieldValue.serverTimestamp() };
  try {
    if (docId) await room.doc(docId).create(data);
    else await room.add(data);
  } catch (error) {
    if ((error as { code?: unknown })?.code === ALREADY_EXISTS) return;
    console.error("[chatSystemMessages] could not post", room.path, error);
  }
};

const eventRow = (author: Author, event: ChatSystemEvent) => ({
  type: "system",
  userId: author.uid,
  username: author.name,
  userPhotoURL: author.avatar,
  lvl: author.lvl,
  guildBadge: author.guildBadge,
  message: systemEventText(event, author.name),
  system: event,
});

/** "Shredders reached level 4" — one row per level, however many reads bank it. */
export async function postGuildLevelUpMessage(input: {
  guildId: string;
  guildName: string;
  guildBadge: GuildBadge;
  level: number;
  quests: string[];
}): Promise<void> {
  const event: ChatSystemEvent = {
    kind: "level_up",
    guildName: input.guildName,
    level: input.level,
    quests: input.quests.slice(0, 5),
  };

  await writeRow(
    guildChat(input.guildId),
    eventRow(
      {
        uid: "system",
        name: input.guildName,
        avatar: null,
        lvl: 0,
        guildBadge: input.guildBadge,
      },
      event,
    ),
    `level-${input.level}`,
  );
}

/** "Ania joined the guild", with a Say hi button for everyone already there. */
export async function postGuildMemberJoinedMessage(
  guildId: string,
  uid: string,
): Promise<void> {
  try {
    const user = await firestore.collection("users").doc(uid).get();
    await writeRow(
      guildChat(guildId),
      eventRow(authorOf(uid, user.data() ?? {}), { kind: "member_joined" }),
    );
  } catch (error) {
    console.error("[chatSystemMessages] member joined", guildId, error);
  }
}
