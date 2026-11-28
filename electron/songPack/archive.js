// Reader for the .psarc container a song package ships in: a table of contents
// (encrypted with a key every unpacker carries) followed by the files, each cut
// into blocks that are zlib-deflated on their own.
//
// Read-only and in memory — a package is one song, a few megabytes.
const crypto = require("crypto");
const zlib = require("zlib");

const MAGIC = "PSAR";
const HEADER_BYTES = 32;
const ENTRY_BYTES = 30;
const FLAG_ENCRYPTED_TOC = 4;

const TOC_KEY = Buffer.from("C53DB23870A1A2F71CAE64061FDD0E1157309DC85204D4C5BFDF25090DF2572C", "hex");
const TOC_IV = Buffer.from("E915AA018FEF71FC508132E4BB4CEB42", "hex");

// A package holds a few dozen files. Anything far past that is not one.
const MAX_ENTRIES = 4096;
// One song's audio is the biggest thing inside; this is a guard, not a quota.
const MAX_ENTRY_BYTES = 256 * 1024 * 1024;

/** Bytes one block length takes in the table: enough to hold `blockSize`. */
function blockLengthBytes(blockSize) {
  let bytes = 1;
  for (let limit = 256; limit < blockSize; limit *= 256) bytes++;
  return bytes;
}

function inflateBlock(block) {
  // A block that would not shrink is stored as it is, with no marker — the zlib
  // header is the only way to tell the two apart.
  if (block.length >= 2 && block[0] === 0x78) {
    try { return zlib.inflateSync(block); } catch { /* stored after all */ }
  }
  return block;
}

/**
 * Opens an archive held in memory.
 * @param {Buffer} buffer
 * @returns {{ names: string[], read: (name: string) => Buffer | null }}
 */
function readArchive(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < HEADER_BYTES || buffer.toString("latin1", 0, 4) !== MAGIC) {
    throw new Error("Not a song package.");
  }
  if (buffer.toString("latin1", 8, 12) !== "zlib") {
    throw new Error("This package uses a compression that is not supported.");
  }

  const tocLength = buffer.readUInt32BE(12);
  const entrySize = buffer.readUInt32BE(16);
  const entryCount = buffer.readUInt32BE(20);
  const blockSize = buffer.readUInt32BE(24);
  const flags = buffer.readUInt32BE(28);

  if (
    entrySize !== ENTRY_BYTES || entryCount === 0 || entryCount > MAX_ENTRIES || blockSize === 0
    || tocLength > buffer.length || tocLength < HEADER_BYTES + entryCount * ENTRY_BYTES
  ) {
    throw new Error("The song package is damaged.");
  }

  let toc = buffer.subarray(HEADER_BYTES, tocLength);
  if (flags === FLAG_ENCRYPTED_TOC) {
    const decipher = crypto.createDecipheriv("aes-256-cfb", TOC_KEY, TOC_IV);
    toc = Buffer.concat([decipher.update(toc), decipher.final()]);
  }

  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    const at = i * ENTRY_BYTES;
    entries.push({
      // The first 16 bytes are the name's MD5 — names come from the listing instead.
      firstBlock: toc.readUInt32BE(at + 16),
      length: toc.readUIntBE(at + 20, 5),
      offset: toc.readUIntBE(at + 25, 5),
    });
  }

  const lengthBytes = blockLengthBytes(blockSize);
  const blockLengths = [];
  for (let at = entryCount * ENTRY_BYTES; at + lengthBytes <= toc.length; at += lengthBytes) {
    blockLengths.push(toc.readUIntBE(at, lengthBytes));
  }

  const readEntry = (entry) => {
    if (entry.length > MAX_ENTRY_BYTES) throw new Error("The song package is damaged.");
    const chunks = [];
    let produced = 0;
    let offset = entry.offset;
    let block = entry.firstBlock;
    while (produced < entry.length) {
      const stored = blockLengths[block++];
      if (stored === undefined) throw new Error("The song package is damaged.");
      // Zero stands for a full block kept as it is.
      const size = stored === 0 ? Math.min(blockSize, buffer.length - offset) : stored;
      if (size <= 0 || offset + size > buffer.length) throw new Error("The song package is damaged.");
      const raw = buffer.subarray(offset, offset + size);
      const data = stored === 0 ? raw : inflateBlock(raw);
      chunks.push(data);
      produced += data.length;
      offset += size;
    }
    return Buffer.concat(chunks).subarray(0, entry.length);
  };

  // The first file is the listing: every other file's path, one per line, in
  // the order the table of contents has them.
  const names = readEntry(entries[0]).toString("utf8").split("\n").map((name) => name.trim());
  const byName = new Map();
  names.forEach((name, i) => {
    if (name && entries[i + 1]) byName.set(name, entries[i + 1]);
  });

  return {
    names: [...byName.keys()],
    read: (name) => {
      const entry = byName.get(name);
      return entry ? readEntry(entry) : null;
    },
  };
}

module.exports = { readArchive, TOC_KEY, TOC_IV };
