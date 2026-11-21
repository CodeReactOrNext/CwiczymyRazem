import { promises as fs } from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";

/**
 * Where utils/audio/audioDebugLog.ts sends its recording: appended to
 * `.audio-debug/<session>.jsonl` (readings) and `<session>.pcm` (raw input,
 * 16-bit mono). Answers only under `next dev`.
 */
export const config = { api: { bodyParser: false } };

const MAX_BODY_BYTES = 8 * 1024 * 1024;

async function readBody(req: NextApiRequest): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer);
    size += buf.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== "development") { res.status(404).end(); return; }
  if (req.method !== "POST") { res.status(405).end(); return; }

  const { session, kind } = req.query;
  if (typeof session !== "string" || !/^[\w-]{1,64}$/.test(session)) { res.status(400).end(); return; }
  if (kind !== "log" && kind !== "pcm") { res.status(400).end(); return; }

  const body = await readBody(req);
  if (!body) { res.status(413).end(); return; }

  const dir = path.join(process.cwd(), ".audio-debug");
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(path.join(dir, `${session}.${kind === "log" ? "jsonl" : "pcm"}`), body);
  res.status(204).end();
}
