import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { todayKey } from "lib/email/cooldown";
import { markCooldown } from "lib/email/cooldownStore";
import { sendWelcomeEmail } from "lib/email/send";
import { claimPendingSupporter, hasPendingSupporter } from "lib/support/supporterGrant";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

interface UserDataRequestBody {
  idToken?: string;
  displayName?: string | null;
  photoURL?: string | null;
  /** The sign-up form's email checkbox. Only stored while there is no answer yet. */
  emailConsent?: boolean;
  /** Legacy shape: the serialized Firebase `User` (see the handler). */
  user?: {
    displayName?: string | null;
    photoURL?: string | null;
    stsTokenManager?: { accessToken?: string };
  };
}

const statisticsInitial = {
  time: { technique: 0, theory: 0, hearing: 0, creativity: 0, longestSession: 0 },
  lvl: 1,
  points: 0,
  currentLevelMaxPoints: 35,
  sessionCount: 0,
  habitsCount: 0,
  dayWithoutBreak: 0,
  maxPoints: 0,
  achievements: [],
  actualDayWithoutBreak: 0,
  lastReportDate: "",
  songLists: { wantToLearn: [], learned: [], learning: [] },
  guitarStartDate: new Date(),
  fame: 0,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const body = (req.body ?? {}) as UserDataRequestBody;
      // Clients built before the token was sent post the whole serialized
      // Firebase user, whose `stsTokenManager` carries the same ID token.
      // Accepted so tabs left open across the deploy aren't signed out.
      const idToken = body.idToken ?? body.user?.stsTokenManager?.accessToken;
      if (!idToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let decoded: DecodedIdToken;
      try {
        decoded = await auth.verifyIdToken(idToken);
      } catch {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // The uid and the address come from the verified token only. The name
      // and photo are the client's to choose (a new email account picks its
      // nick at sign-up, which no token carries) and only fill empty fields.
      const uid = decoded.uid;
      const user = {
        email: decoded.email ?? null,
        displayName: body.displayName ?? body.user?.displayName ?? decoded.name ?? null,
        photoURL: body.photoURL ?? body.user?.photoURL ?? decoded.picture ?? null,
      };

      const userDocRef = firestore.collection("users").doc(uid);
      // The parked-donation lookup only needs the address, so it rides along
      // with the profile read instead of adding a round trip after it.
      const [userSnapshot, hasPendingDonation] = await Promise.all([
        userDocRef.get(),
        hasPendingSupporter(user.email).catch((error) => {
          console.error("[supporter-claim] lookup failed for", uid, error);
          return false;
        }),
      ]);

      // Asked on the email sign-up form only; a Google sign-up arrives without
      // it and gets the in-app prompt instead.
      const signupConsent =
        typeof body.emailConsent === "boolean"
          ? {
              granted: body.emailConsent,
              source: "signup",
              updatedAt: FieldValue.serverTimestamp(),
            }
          : null;

      if (!userSnapshot.exists) {
        await userDocRef.set({
          displayName: user.displayName ?? null,
          avatar: user.photoURL ?? null,
          createdAt: new Date(),
          email: user.email ?? null,
          statistics: statisticsInitial,
          rigLevel: 0,
          ...(signupConsent && { emailConsent: signupConsent }),
        });

        if (user.email) {
          sendWelcomeEmail({
            to: user.email,
            userName: user.displayName,
          })
            .then(() => markCooldown(uid, "welcome", todayKey()))
            .catch((err) =>
              console.error("[welcome-email] failed for", user.email, err)
            );
        }
      }

      // Re-read only a document this request just created; an existing one is
      // already in hand, and every app boot waits on this route.
      const userData = userSnapshot.exists
        ? userSnapshot.data()
        : (await userDocRef.get()).data();

      if (userData) {
        const backfill: Record<string, unknown> = {};
        if (!userData.email && user.email) backfill.email = user.email;
        if (!userData.displayName && user.displayName)
          backfill.displayName = user.displayName;
        // The sign-up request can lose the race to an auto-login that created
        // the document first; the answer still belongs on it.
        if (!userData.emailConsent && signupConsent) {
          backfill.emailConsent = signupConsent;
          userData.emailConsent = signupConsent;
        }
        if (Object.keys(backfill).length > 0) {
          await userDocRef.update(backfill);
        }
      }

      // A Buy Me a Coffee donation made before this account existed (or while
      // it was logged out) waits on the donor's email. Login is the one moment
      // the two sides are both known, so the badge is handed out here. The
      // grant itself re-checks the address against Firebase Auth — the email in
      // the token only decides whether there is anything to look up.
      if (hasPendingDonation && userData?.isSupport !== true) {
        try {
          await claimPendingSupporter(uid, user.email);
        } catch (error) {
          console.error("[supporter-claim] failed for", uid, error);
        }
      }

      return res.status(200).json({
        userInfo: {
          displayName: userData?.displayName ?? user.displayName ?? null,
          avatar: userData?.avatar ?? null,
          youTubeLink: userData?.youTubeLink ?? null,
          soundCloudLink: userData?.soundCloudLink ?? null,
          band: userData?.band ?? null,
          guitarStartDate: userData?.guitarStartDate ?? null,
          selectedGuitar: userData?.selectedGuitar ?? null,
          selectedGuitarYear: userData?.selectedGuitarYear ?? null,
          selectedGuitarCountry: userData?.selectedGuitarCountry ?? null,
          // Handed over so the chat can stamp the tag onto a message without
          // re-reading the sender's document on every send.
          guildBadge: userData?.guildBadge ?? null,
          role: userData?.role ?? null,
          createdAt: userData?.createdAt ?? null,
          feedbackAskedAt: userData?.feedbackAskedAt ?? null,
          feedbackDismissCount: userData?.feedbackDismissCount ?? 0,
          feedbackLastDismissedAt: userData?.feedbackLastDismissedAt ?? null,
          favoritePlanIds: userData?.favoritePlanIds ?? [],
          favoriteExerciseIds: userData?.favoriteExerciseIds ?? [],
          favoriteSongIds: userData?.favoriteSongIds ?? [],
          // Only explicit opt-outs are stored; whether anything is sent at all
          // is `emailConsent` (see lib/email/consent).
          emailNotifications: {
            streakReminders:
              userData?.emailNotifications?.streakReminders !== false,
            seasonUpdates:
              userData?.emailNotifications?.seasonUpdates !== false,
            productUpdates:
              userData?.emailNotifications?.productUpdates !== false,
          },
          emailConsent: userData?.emailConsent
            ? {
                granted: userData.emailConsent.granted === true,
                source: userData.emailConsent.source ?? null,
              }
            : null,
        },
        userAuth: uid,
        currentUserStats: {
          ...userData?.statistics,
          skills: userData?.skills || { unlockedSkills: {} },
        },
      });
    } catch (error) {
      return res.status(500).json({ error: String(error) });
    }
  }
  return res.status(400).end();
}
