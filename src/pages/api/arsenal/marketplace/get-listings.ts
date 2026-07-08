import type { MarketplaceListing } from "feature/arsenal/types/marketplace.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const LISTINGS_LIMIT = 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body as { idToken: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const snapshot = await firestore
      .collection("marketplace")
      .where("status", "==", "active")
      .orderBy("listedAt", "desc")
      .limit(LISTINGS_LIMIT)
      .get();

    const listings = snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) =>
        ({ id: doc.id, ...doc.data() }) as MarketplaceListing
    );

    return res.status(200).json({ listings });
  } catch (error) {
    console.error("[marketplace/get-listings]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
