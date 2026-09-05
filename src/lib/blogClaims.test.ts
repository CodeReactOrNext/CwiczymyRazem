import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * Two credibility problems the 2026-09-05 audit found in the blog: the exercise
 * catalogue was quoted as "144" long after it passed 200, and several links
 * introduced as specific research pointed at the publisher's homepage.
 *
 * Both drift silently, so they get asserted here. When this fails after adding
 * exercises, update the numbers in the posts it names.
 */

const BLOG_DIR = join(__dirname, "../content/blog");

const posts = readdirSync(BLOG_DIR)
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => ({ file, raw: readFileSync(join(BLOG_DIR, file), "utf8") }));

// Everything in the library is playable: userSlice force-sets every signed-in
// user to `master`, so the `premium` flag on an exercise never gates anything.
// Only the catalogue size is a claim the posts can get wrong.
const CATALOG_SIZE = exercisesAgregat.filter(
  (exercise) => !exercise.isHiddenFromLibrary
).length;

describe("exercise counts quoted in posts", () => {
  it("matches the size of the catalogue", () => {
    const wrong: string[] = [];

    for (const { file, raw } of posts) {
      for (const match of raw.matchAll(
        /(\d+)(?:\s+\w+)? technical exercises/g
      )) {
        if (Number(match[1]) !== CATALOG_SIZE) {
          wrong.push(`${file}: "${match[0]}" (catalogue is ${CATALOG_SIZE})`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });

  it("does not split our own catalogue into a free and a paid tier", () => {
    // Riff Quest is donation-funded with no paywall, so a post promising "65 of
    // them free" would describe a product that does not exist. Competitors'
    // free tiers are a different matter and are described all over these posts,
    // so the patterns below only match claims about our own catalogue.
    const ourPaidTier =
      /\d+ free exercises|on the free tier|Pro membership|Practice Master membership|Riff Quest[^.]{0,60}\bfree tier\b/g;
    const wrong: string[] = [];

    for (const { file, raw } of posts) {
      for (const match of raw.matchAll(ourPaidTier)) {
        wrong.push(`${file}: "${match[0]}"`);
      }
    }

    expect(wrong).toEqual([]);
  });
});

describe("outbound citations", () => {
  it("links research and guides to the page that carries them, not a homepage", () => {
    // "As Mike Duffy from [Fender](https://www.fender.com/) explains" is fine —
    // the link names the publication. "[research on X](https://www.apa.org)" is
    // not: it promises a source and delivers a front page.
    const promisesASource = /\b(research|study|studies|guide|guidance|report|paper)\b/i;
    const bareDomain = /^https?:\/\/[^/]+\/?$/;
    const bad: string[] = [];

    for (const { file, raw } of posts) {
      for (const match of raw.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
        const [, label, href] = match;
        if (!promisesASource.test(label)) continue;
        if (!bareDomain.test(href)) continue;
        bad.push(`${file}: [${label}](${href})`);
      }
    }

    expect(bad).toEqual([]);
  });
});
