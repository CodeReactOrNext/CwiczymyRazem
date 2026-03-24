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

  // ── GET  – list all premium users (pro + master) ────────────────────────────
  if (req.method === "GET") {
    try {
      const [proSnap, masterSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "pro"))),
        getDocs(query(collection(db, "users"), where("role", "==", "master"))),
      ]);
      const users = [...proSnap.docs, ...masterSnap.docs].map((d) => ({
        id: d.id,
        displayName: d.data().displayName ?? "Unknown",
        avatar: d.data().avatar ?? null,
        role: d.data().role as "pro" | "master",
        premiumUntil: d.data().premiumUntil ?? null,
      }));
      return res.status(200).json({ users });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST – grant premium (pro or master) ────────────────────────────────────
  if (req.method === "POST") {
    const { userId, premiumUntil, plan } = req.body as {
      userId?: string;
      premiumUntil?: string | null;
      plan?: "pro" | "master";
    };
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!plan || !["pro", "master"].includes(plan)) {
      return res.status(400).json({ error: "plan must be 'pro' or 'master'" });
    }

    try {
      await updateDoc(doc(db, "users", userId), {
        role: plan,
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
