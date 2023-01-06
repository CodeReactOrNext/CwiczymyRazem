import { doc, getDoc, setDoc } from "firebase/firestore";
import { shuffleUid } from "helpers/shuffleUid";
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/firebase.utils";
import { statisticsInitial } from "./common/userStatisticsInitialData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const user = JSON.parse(req.body);
      const shuffledUid = shuffleUid(user.uid);
      const userDocRef = doc(db, "users", shuffledUid);
      const userSnapshot = await getDoc(userDocRef);
      if (!userSnapshot.exists()) {
        const { displayName } = user;
        const createdAt = new Date();
        try {
          await setDoc(userDocRef, {
            displayName,
            createdAt,
            statisticsInitial,
          });
        } catch (error) {}
      }
      res.status(200).json(JSON.stringify(shuffledUid));
    } catch (error) {
      res.status(500).json({ error });
    }
  }
  res.status(400);
}
