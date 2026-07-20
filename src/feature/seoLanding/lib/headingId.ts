/** Same slug rule the blog uses for `## ` headings, so ToC anchors behave identically. */
export const headingId = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
