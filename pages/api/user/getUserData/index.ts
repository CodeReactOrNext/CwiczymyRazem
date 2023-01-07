import { NextApiRequest, NextApiResponse } from "next";

import { firebaseCreateUserDocumentFromAuth } from "../action/createUserFromAuth";
import { firebaseGetUserDocument } from "utils/firebase/firebase.utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const user = req.body.user;
      const userAuth = await firebaseCreateUserDocumentFromAuth(user);
      const userData = await firebaseGetUserDocument(userAuth);
      res.status(200).json({
        userInfo: {
          displayName: userData!.displayName,
          avatar: userData!.avatar,
        },
        userAuth,
        currentUserStats: userData!.statistics,
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
  res.status(400);
}
