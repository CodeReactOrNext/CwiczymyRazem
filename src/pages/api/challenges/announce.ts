import type { Challenge } from "feature/challenges/types/challenge.types";
import { submissionDocId } from "feature/challenges/types/challenge.types";
import { isChallengeLive } from "feature/challenges/utils/challengeMonth";
import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";
import {
  isChallengeDiscordConfigured,
  postChallengeRun,
} from "lib/challenges/challengeDiscord";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const CHALLENGE_ID = /^\d{4}-\d{2}$/;
/** How long one request's claim holds before a retry may post instead. */
const CLAIM_MS = 60_000;

/**
 * Has the bot post a monthly-challenge run to the community's Discord channel.
 *
 * The browser writes the run itself (see submitChallengeRecording), so it only
 * names it here: the server reads the submission back, checks it belongs to
 * the caller, and posts what is stored — never anything from the request.
 * A claim on the submission doc makes the post happen once, however many
 * times this is called.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, challengeId, songId } = (req.body ?? {}) as {
    idToken?: unknown;
    challengeId?: unknown;
    songId?: unknown;
  };
  if (typeof idToken !== "string" || !idToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (
    typeof challengeId !== "string" ||
    !CHALLENGE_ID.test(challengeId) ||
    typeof songId !== "string" ||
    !songId ||
    songId.includes("/")
  ) {
    return res.status(400).json({ error: "Bad request" });
  }

  let uid: string;
  try {
    uid = (await auth.verifyIdToken(idToken)).uid as string;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isChallengeDiscordConfigured()) {
    return res.status(200).json({ posted: false, reason: "off" });
  }

  try {
    const submissionRef = firestore
      .collection("challengeSubmissions")
      .doc(submissionDocId(challengeId, uid, songId)) as DocumentReference;
    const now = Date.now();

    const claimed = await firestore.runTransaction(
      async (tx: Transaction): Promise<DocumentData | "missing" | "done"> => {
        const snap = await tx.get(submissionRef);
        const data = snap.data();
        if (!data || data.userId !== uid) return "missing";
        if (data.discordMessageId) return "done";
        if (now - (data.discordClaimedAt ?? 0) < CLAIM_MS) return "done";
        tx.update(submissionRef, { discordClaimedAt: now });
        return data;
      },
    );

    if (claimed === "missing") {
      return res.status(404).json({ error: "Not found" });
    }
    if (claimed === "done") {
      return res.status(200).json({ posted: false, reason: "done" });
    }

    const challengeSnap = await firestore
      .collection("challenges")
      .doc(challengeId)
      .get();
    const challenge = challengeSnap.data() as Challenge | undefined;
    const song = challenge?.songs?.find((s) => s.songId === songId);
    if (!song) {
      await submissionRef.update({ discordClaimedAt: 0 });
      return res.status(404).json({ error: "Not found" });
    }

    const posted = await postChallengeRun({
      challengeId,
      isLive: isChallengeLive(challengeId),
      song,
      userId: uid,
      userName: claimed.userName || "Anonymous",
      userAvatarUrl: claimed.userAvatarUrl ?? null,
      videoUrl: claimed.videoUrl ?? "",
      title: claimed.title ?? "",
    });

    await submissionRef.update(
      posted
        ? {
            discordChannelId: posted.channelId,
            discordMessageId: posted.messageId,
          }
        : { discordClaimedAt: 0 },
    );
    return res.status(200).json({ posted: !!posted });
  } catch (error) {
    console.error("challenges/announce failed", error);
    return res.status(500).json({ error: "INTERNAL" });
  }
}
