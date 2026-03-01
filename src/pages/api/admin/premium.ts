import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";

function isAuthorized(req: NextApiRequest): boolean {
  const password = req.headers["x-admin-password"] ?? req.body?.password;
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── GET  – list all premium users ──────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("role", "==", "premium"))
      );
      const users = snap.docs.map((d) => ({
        id: d.id,
        displayName: d.data().displayName ?? "Unknown",
        avatar: d.data().avatar ?? null,
        premiumUntil: d.data().premiumUntil ?? null,
      }));
      return res.status(200).json({ users });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST – grant premium ────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { userId, premiumUntil } = req.body as {
      userId?: string;
      premiumUntil?: string | null;
    };
    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
      await updateDoc(doc(db, "users", userId), {
        role: "premium",
        premiumUntil: premiumUntil || deleteField(),
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE – revoke premium ─────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { userId } = req.body as { userId?: string };
    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
      await updateDoc(doc(db, "users", userId), {
        role: "user",
        premiumUntil: deleteField(),
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
