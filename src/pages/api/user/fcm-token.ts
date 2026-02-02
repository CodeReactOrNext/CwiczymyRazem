import { db } from "utils/firebase/client/firebase.utils";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ message: "Missing userId or token" });
  }

  try {
    const userRef = doc(db, "users", userId);
    // enabling notifications by default when saving a token
    await updateDoc(userRef, {
      "fcmData.tokens": arrayUnion(token),
      "fcmData.notificationsEnabled": true,
    });

    return res.status(200).json({ message: "Token saved successfully" });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
