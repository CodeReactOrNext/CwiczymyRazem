// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageTitle } from "./PageTitle";

describe("PageTitle", () => {
  afterEach(cleanup);

  it("renders the title as an h1 with its subtitle", () => {
    render(<PageTitle title='Settings' subtitle='Tune the app to your setup' />);

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeTruthy();
    expect(screen.getByText("Tune the app to your setup")).toBeTruthy();
  });

  it("can render as an h2 with actions beside it", () => {
    render(<PageTitle as='h2' title='Plans' actions={<button>New</button>} />);

    expect(screen.getByRole("heading", { level: 2, name: "Plans" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "New" })).toBeTruthy();
  });
});
