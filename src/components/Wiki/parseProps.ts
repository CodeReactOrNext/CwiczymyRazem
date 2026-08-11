/**
 * Wiki articles are markdown compiled with no JSX scope, so every component prop
 * has to survive as a plain string. These helpers parse the two conventions used
 * across the wiki components — the same pipe/double-colon format the blog uses.
 */

export interface LabelledItem {
  title: string;
  description?: string;
}

/** `"A::first|B::second"` → `[{ title: "A", description: "first" }, ...]` */
export const parsePairs = (value: string): LabelledItem[] =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title, ...rest] = item.split("::");
      const description = rest.join("::").trim();
      return { title: title.trim(), description: description || undefined };
    });

/** `"A|B|C"` → `["A", "B", "C"]` */
export const parseList = (value: string): string[] =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
