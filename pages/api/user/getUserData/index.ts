import { NextApiRequest, NextApiResponse } from "next";
import { firebaseGetUserStats } from "../action/firebaseGetUserData";
import { firebaseCreateUserDocumentFromAuth } from "../action/createUserFromAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const user = req.body.user;
      const userAuth = await firebaseCreateUserDocumentFromAuth(user);
      const currentUserStats = await firebaseGetUserStats(userAuth);
      const userName = user.displayName!;
      res.status(200).json({
        userInfo: { displayName: userName },
        userAuth,
        currentUserStats,
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
  res.status(400);
}
