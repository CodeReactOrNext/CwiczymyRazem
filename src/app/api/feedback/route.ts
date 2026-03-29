import { NextRequest, NextResponse } from "next/server";

type FeedbackCategory = "bug" | "idea" | "question";

const CATEGORY_META: Record<FeedbackCategory, { title: string; color: number }> = {
  bug:      { title: "🐛 Bug",    color: 0xed4245 },
  idea:     { title: "💡 Pomysł", color: 0xfee75c },
  question: { title: "❓ Pytanie", color: 0x57f287 },
};

export async function POST(req: NextRequest) {
  const { message, category, page, userName, userId } = await req.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const meta = CATEGORY_META[(category as FeedbackCategory) ?? "idea"] ?? CATEGORY_META.idea;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: meta.title,
          color: meta.color,
          fields: [
            { name: "Wiadomość", value: message.slice(0, 1024) },
            { name: "Użytkownik", value: userName ?? "anonimowy", inline: true },
            { name: "Strona", value: page ?? "—", inline: true },
            ...(userId ? [{ name: "ID", value: userId, inline: true }] : []),
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Discord error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
