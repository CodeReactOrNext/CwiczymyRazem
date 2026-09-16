// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PhotoBlock } from "./PhotoBlock";
import { ZoomableImages } from "./ZoomableImages";

describe("ZoomableImages", () => {
  afterEach(cleanup);

  it("opens the clicked screenshot at full size", () => {
    // Post bodies are compiled to static HTML, so the handler has to work on
    // markup this component never rendered itself.
    render(
      <ZoomableImages>
        <div
          dangerouslySetInnerHTML={{
            __html:
              '<button data-zoomable><img src="/images/blog/rocksmith/riff-quest-exercise.webp" alt="A pentatonic exercise" /></button>',
          }}
        />
      </ZoomableImages>,
    );

    fireEvent.click(screen.getByRole("button"));

    const zoomed = screen.getAllByAltText("A pentatonic exercise");
    expect(zoomed).toHaveLength(2);
    expect(zoomed[1].getAttribute("src")).toContain(
      "/images/blog/rocksmith/riff-quest-exercise.webp",
    );
  });

  it("zooms a PhotoBlock, the component the posts actually use", () => {
    render(
      <ZoomableImages>
        <PhotoBlock src='/images/blog/rocksmith/tuxguitar.webp' alt='TuxGuitar' caption='A caption' />
      </ZoomableImages>,
    );

    fireEvent.click(screen.getByRole("button", { name: /enlarge image/i }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getAllByAltText("TuxGuitar")).toHaveLength(2);
  });

  it("ignores clicks on the article's prose", () => {
    render(
      <ZoomableImages>
        <p>Rocksmith combines playing songs with following notes on screen.</p>
      </ZoomableImages>,
    );

    fireEvent.click(screen.getByText(/Rocksmith combines/));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
