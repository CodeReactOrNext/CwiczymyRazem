import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { getAllBlogs } from "./blog";

/**
 * `hidden: true` takes a post off the site without deleting the file. The flag is
 * only worth anything if every listing goes through getAllBlogs, so this checks
 * the filter itself against what is actually on disk.
 */

const BLOG_DIR = join(__dirname, "../content/blog");

const frontmatters = readdirSync(BLOG_DIR)
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => matter(readFileSync(join(BLOG_DIR, file), "utf8")).data);

describe("getAllBlogs", () => {
  it("leaves out posts marked hidden", () => {
    const hidden = frontmatters
      .filter((data) => data.hidden)
      .map((data) => data.slug);
    const listed = getAllBlogs().map((blog) => blog.slug);

    expect(listed.filter((slug) => hidden.includes(slug))).toEqual([]);
  });

  it("lists every post that is not hidden", () => {
    const published = frontmatters
      .filter((data) => !data.hidden)
      .map((data) => data.slug);

    expect(
      getAllBlogs()
        .map((blog) => blog.slug)
        .sort(),
    ).toEqual(published.sort());
  });

  it("returns posts newest first", () => {
    const dates = getAllBlogs().map((blog) => new Date(blog.date).getTime());

    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});
