import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseGetUserDocument } from "utils/firebase/client/firebase.utils";
import { firebaseCreateUserDocumentFromAuth } from "utils/user/createUserFromAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      if (!req.body.user) {
        return res.status(401).json({ error: "Please include user object." });
      }
      const user = req.body.user;
      const userAuth = await firebaseCreateUserDocumentFromAuth(user);
      const userData = await firebaseGetUserDocument(userAuth);

      return res.status(200).json({
        userInfo: {
          displayName: userData!.displayName,
          avatar: userData!.avatar,
          youTubeLink: userData!.youTubeLink,
          soundCloudLink: userData!.soundCloudLink,
          band: userData!.band,
          guitarStartDate: userData!.guitarStartDate,
        },
        userAuth,
        currentUserStats: userData!.statistics,
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
  return res.status(400).end();
}
