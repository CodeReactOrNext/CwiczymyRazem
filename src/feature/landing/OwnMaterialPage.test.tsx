// @vitest-environment jsdom

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// next/font/google only works inside the Next compiler; outside it the export
// is a plain object, so hand the page the variable class it expects.
vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({
    variable: "--font-jakarta-landing",
    className: "",
  }),
}));

import { GP_EXTENSIONS } from "feature/songs/services/gp5Parser.service";
import {
  MAX_GP_FILE_SIZE_BYTES,
  MAX_USER_GP_FILES,
} from "feature/songs/services/userGpFiles.service";
import { safeNextPath } from "utils/auth/safeNextPath";

import {
  OWN_MATERIAL_FAQS,
  OWN_MATERIAL_GP_LIMITS,
  OWN_MATERIAL_META,
  OWN_MATERIAL_ROUTES,
  OWN_MATERIAL_SHOWCASE_BARS,
} from "./data/ownMaterial";
import { buildOwnMaterialProps } from "./lib/ownMaterialProps";
import { OwnMaterialPage } from "./OwnMaterialPage";

const props = buildOwnMaterialProps();
const html = renderToString(<OwnMaterialPage {...props} />);

describe("own material landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(OWN_MATERIAL_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(OWN_MATERIAL_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(OWN_MATERIAL_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("quotes the Guitar Pro library's real limits", () => {
    expect([...OWN_MATERIAL_GP_LIMITS.extensions]).toEqual([...GP_EXTENSIONS]);
    expect(OWN_MATERIAL_GP_LIMITS.maxFiles).toBe(MAX_USER_GP_FILES);
    expect(OWN_MATERIAL_GP_LIMITS.maxFileBytes).toBe(MAX_GP_FILE_SIZE_BYTES);
  });

  it("sends the signed-in destinations through sign-up", () => {
    expect(OWN_MATERIAL_ROUTES.editor).toBe("/tab-editor");
    for (const target of ["gpTabs", "myExercises"] as const) {
      const next = new URLSearchParams(
        OWN_MATERIAL_ROUTES[target].split("?")[1],
      ).get("next");
      expect(safeNextPath(next)).toBe(next);
      expect(html).toContain(
        OWN_MATERIAL_ROUTES[target].replace(/&/g, "&amp;"),
      );
    }
  });

  it("shows the generator's own harmony for the example tab", () => {
    const { showcase } = props;
    expect(showcase.bars).toHaveLength(OWN_MATERIAL_SHOWCASE_BARS);
    expect(showcase.bars.map((bar) => bar.chord)).toEqual(
      showcase.progression.slice(0, OWN_MATERIAL_SHOWCASE_BARS),
    );
    expect(showcase.parts).toContain("Drums");
    for (const bar of showcase.bars) {
      expect(html).toContain(bar.chord);
      for (const beat of bar.beats) {
        for (const note of beat.notes) {
          expect(note.string).toBeGreaterThanOrEqual(1);
          expect(note.string).toBeLessThanOrEqual(6);
        }
      }
    }
  });
});
