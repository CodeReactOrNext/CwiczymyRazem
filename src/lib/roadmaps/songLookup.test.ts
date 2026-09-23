import { describe, expect, it, vi } from "vitest";

vi.mock("utils/firebase/api/firebase.config", () => ({ firestore: {} }));

const { normaliseSongText, pickLibrarySong } = await import("./songLookup");

const library = [
  { id: "lw", title: "Little Wing", artist: "Jimi Hendrix", coverUrl: "c.jpg" },
  { id: "lw-srv", title: "Little Wing", artist: "Stevie Ray Vaughan" },
  {
    id: "rh",
    title: "Red House (Live at Woodstock)",
    artist: "The Jimi Hendrix Experience",
  },
  { id: "hj", title: "Hey Joe", artist: "Jimi Hendrix" },
];

describe("normaliseSongText", () => {
  it("drops case, diacritics, punctuation, bracketed tails and a leading 'the'", () => {
    expect(normaliseSongText("Little Wing (Live at Fillmore)")).toBe(
      "little wing",
    );
    expect(normaliseSongText("The Jimi Hendrix Experience")).toBe(
      "jimi hendrix experience",
    );
    expect(normaliseSongText("Señorita!")).toBe("senorita");
  });
});

describe("pickLibrarySong", () => {
  it("finds the song by exact title and agreeing artist", () => {
    expect(
      pickLibrarySong(library, { title: "little wing", artist: "Hendrix" }),
    ).toBeNull();
    expect(
      pickLibrarySong(library, {
        title: "Little Wing",
        artist: "Jimi Hendrix",
      }),
    ).toEqual({
      id: "lw",
      title: "Little Wing",
      artist: "Jimi Hendrix",
      coverUrl: "c.jpg",
    });
  });

  it("tells two recordings of the same title apart by artist", () => {
    expect(
      pickLibrarySong(library, {
        title: "Little Wing",
        artist: "Stevie Ray Vaughan",
      })?.id,
    ).toBe("lw-srv");
  });

  it("lets a longer artist credit stand in for the shorter one", () => {
    expect(
      pickLibrarySong(library, { title: "Red House", artist: "Jimi Hendrix" })
        ?.id,
    ).toBe("rh");
  });

  it("returns null for a song the library does not have", () => {
    expect(
      pickLibrarySong(library, {
        title: "Voodoo Child",
        artist: "Jimi Hendrix",
      }),
    ).toBeNull();
    expect(
      pickLibrarySong(library, { title: "", artist: "Jimi Hendrix" }),
    ).toBeNull();
  });

  it("never matches on title alone when the artist disagrees", () => {
    expect(
      pickLibrarySong(library, { title: "Hey Joe", artist: "Deep Purple" }),
    ).toBeNull();
  });
});
