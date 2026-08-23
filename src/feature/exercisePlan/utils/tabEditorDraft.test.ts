// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../types/exercise.types";
import {
  clearTabEditorDraft,
  readTabEditorDraft,
  saveTabEditorDraft,
} from "./tabEditorDraft";

const DRAFT_KEY = "tab-editor-draft";

const measures = (fret: number): TablatureMeasure[] => [
  {
    timeSignature: [4, 4],
    beats: [{ notes: [{ string: 6, fret }], duration: 0.25 }],
  },
];

describe("tabEditorDraft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads back a draft saved for the same exercise", () => {
    saveTabEditorDraft("ex-1", measures(3));
    expect(readTabEditorDraft("ex-1")).toEqual(measures(3));
  });

  it("reads back a draft saved for a new exercise", () => {
    saveTabEditorDraft(null, measures(5));
    expect(readTabEditorDraft(null)).toEqual(measures(5));
  });

  it("withholds a draft that belongs to another exercise", () => {
    saveTabEditorDraft("ex-1", measures(3));
    expect(readTabEditorDraft("ex-2")).toBeNull();
    expect(readTabEditorDraft(null)).toBeNull();
  });

  it("withholds a new exercise's draft from an edit session", () => {
    saveTabEditorDraft(null, measures(7));
    expect(readTabEditorDraft("ex-1")).toBeNull();
  });

  it("treats an untagged legacy draft as a new exercise's", () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(measures(9)));
    expect(readTabEditorDraft(null)).toEqual(measures(9));
    expect(readTabEditorDraft("ex-1")).toBeNull();
  });

  it("returns null when nothing is stored or the value is unreadable", () => {
    expect(readTabEditorDraft(null)).toBeNull();
    localStorage.setItem(DRAFT_KEY, "not json");
    expect(readTabEditorDraft(null)).toBeNull();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ exerciseId: null }));
    expect(readTabEditorDraft(null)).toBeNull();
  });

  it("clears the stored draft", () => {
    saveTabEditorDraft("ex-1", measures(3));
    clearTabEditorDraft();
    expect(readTabEditorDraft("ex-1")).toBeNull();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
