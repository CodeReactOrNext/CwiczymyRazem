import type {
  GuildApplication,
  GuildMember,
} from "feature/guilds/types/guild.types";
import { guildSeatLimit } from "feature/guilds/utils/guildUpgrades.utils";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { badgeFor } from "lib/guild/guildBadge";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Asking to join, and the founder saying yes or no.
 *
 * An application lives under the applicant's own uid, which does the work three
 * checks would otherwise do: one request per person per guild, re-applying
 * overwrites instead of stacking, and the founder's decision addresses exactly
 * one document.
 *
 * A rejection is kept rather than deleted. Deleting it would leave the
 * applicant staring at a Join button with no idea their request was ever seen —
 * the one thing an application system exists to avoid.
 */

const GUILDS = "guilds";
const APPLICATIONS = "applications";

const APPLICATION_MESSAGE_MAX = 240;

const guildRef = (guildId: string): DocumentReference =>
  firestore.collection(GUILDS).doc(guildId);

const applicationsRef = (guildId: string) =>
  guildRef(guildId).collection(APPLICATIONS);

const applicationRef = (guildId: string, uid: string): DocumentReference =>
  applicationsRef(guildId).doc(uid);

const iso = (value: any): string | null => {
  const date = value?.toDate?.();
  return date ? date.toISOString() : null;
};

const toApplication = (doc: DocumentSnapshot): GuildApplication => {
  const data = doc.data() ?? {};
  return {
    uid: doc.id,
    displayName: data.displayName ?? "Player",
    avatar: data.avatar ?? null,
    message: data.message ?? "",
    status: data.status === "rejected" ? "rejected" : "pending",
    at: iso(data.at) ?? new Date(0).toISOString(),
  };
};

/** Everyone knocking on one guild's door, oldest first — a queue, not a stack. */
export async function readApplications(
  guildId: string,
): Promise<GuildApplication[]> {
  const snap = await applicationsRef(guildId).limit(100).get();

  return (snap.docs as DocumentSnapshot[])
    .map(toApplication)
    .sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * Where the caller's own request stands. A collection-group query keyed on the
 * applicant's uid — cheaper than reading every guild's queue to find one row,
 * and it works however many guilds there are.
 */
export async function findMyApplication(
  uid: string,
): Promise<{ guildId: string; status: "pending" | "rejected" } | null> {
  try {
    const snap = await firestore
      .collectionGroup(APPLICATIONS)
      .where("uid", "==", uid)
      .limit(1)
      .get();

    const doc = snap.docs[0] as DocumentSnapshot | undefined;
    if (!doc) return null;

    return {
      // .../guilds/{guildId}/applications/{uid}
      guildId: doc.ref.parent.parent?.id ?? "",
      status: doc.data()?.status === "rejected" ? "rejected" : "pending",
    };
  } catch (error) {
    // A missing collection-group index must not take the whole page down; the
    // applicant simply sees no outstanding request until it is created.
    console.error("[guildApplications] lookup failed", error);
    return null;
  }
}

export type ApplicationResult =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

export async function applyToGuild(
  session: PlayerSession,
  guildId: string,
  message: string,
): Promise<ApplicationResult> {
  if (!guildId) return { ok: false, status: 400, error: "Missing guild" };

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const [guild, user] = await Promise.all([
      tx.get(guildRef(guildId)),
      tx.get(userRef(session.uid)),
    ]);

    if (!guild.exists) return "missing" as const;
    if (user.data()?.guildId) return "already-in-one" as const;

    // The seats the guild has bought, not a fixed number: a full guild stops
    // taking requests until somebody widens it.
    const data = guild.data() ?? {};
    const members = (data.members ?? []) as GuildMember[];
    if (members.length >= guildSeatLimit(data.seatUpgrades)) {
      return "full" as const;
    }

    tx.set(applicationRef(guildId, session.uid), {
      // Denormalised so the founder's queue reads without a lookup per row, and
      // duplicated as `uid` so the collection-group query can find it.
      uid: session.uid,
      displayName: session.displayName,
      avatar: session.avatar,
      message: message.trim().slice(0, APPLICATION_MESSAGE_MAX),
      status: "pending",
      at: FieldValue.serverTimestamp(),
    });

    return "ok" as const;
  });

  if (outcome === "missing") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome === "already-in-one") {
    return {
      ok: false,
      status: 409,
      error: "You are already in a guild — leave it first",
    };
  }
  if (outcome === "full") {
    return { ok: false, status: 409, error: "That guild is full" };
  }

  return { ok: true };
}

/** The applicant pulling their own request, whether it is pending or turned down. */
export async function withdrawApplication(
  session: PlayerSession,
  guildId: string,
): Promise<ApplicationResult> {
  if (!guildId) return { ok: false, status: 400, error: "Missing guild" };

  await applicationRef(guildId, session.uid).delete();
  return { ok: true };
}

/**
 * The founder's decision. Accepting seats the applicant in the same transaction
 * that clears the request, so a double click cannot seat them twice, and a
 * guild that filled up while the request sat there is caught here rather than
 * going over the limit.
 */
export async function decideApplication(
  session: PlayerSession,
  guildId: string,
  applicantUid: string,
  accept: boolean,
): Promise<ApplicationResult> {
  if (!guildId || !applicantUid) {
    return { ok: false, status: 400, error: "Missing application" };
  }

  const outcome = await firestore.runTransaction(async (tx: Transaction) => {
    const [guild, application] = await Promise.all([
      tx.get(guildRef(guildId)),
      tx.get(applicationRef(guildId, applicantUid)),
    ]);

    if (!guild.exists) return "missing-guild" as const;

    const data = guild.data() ?? {};
    if (data.founderUid !== session.uid) return "not-the-founder" as const;
    if (!application.exists) return "missing-application" as const;

    if (!accept) {
      tx.update(applicationRef(guildId, applicantUid), { status: "rejected" });
      return "ok" as const;
    }

    const applicant = await tx.get(userRef(applicantUid));
    // They may have joined somewhere else while the request sat in the queue.
    if (applicant.data()?.guildId) return "applicant-moved-on" as const;

    const members = (data.members ?? []) as GuildMember[];
    if (members.length >= guildSeatLimit(data.seatUpgrades)) {
      return "full" as const;
    }
    if (members.some((member) => member.uid === applicantUid)) {
      tx.delete(applicationRef(guildId, applicantUid));
      return "ok" as const;
    }

    const details = application.data() ?? {};
    tx.update(guildRef(guildId), {
      members: [
        ...members,
        {
          uid: applicantUid,
          displayName: details.displayName ?? "Player",
          avatar: details.avatar ?? null,
        },
      ],
    });
    // Welcomed in wearing whatever the guild wears — the badge travels with
    // the seat, so the leaderboard has it the moment they are let in.
    tx.update(userRef(applicantUid), {
      guildId,
      guildBadge: badgeFor(guildId, data),
    });
    tx.delete(applicationRef(guildId, applicantUid));

    return "ok" as const;
  });

  if (outcome === "missing-guild") {
    return { ok: false, status: 404, error: "That guild is gone" };
  }
  if (outcome === "not-the-founder") {
    return {
      ok: false,
      status: 403,
      error: "Only the founder decides who joins",
    };
  }
  if (outcome === "missing-application") {
    return { ok: false, status: 404, error: "That request is gone" };
  }
  if (outcome === "applicant-moved-on") {
    return {
      ok: false,
      status: 409,
      error: "They have joined another guild since",
    };
  }
  if (outcome === "full") {
    return { ok: false, status: 409, error: "The guild is full" };
  }

  return { ok: true };
}
