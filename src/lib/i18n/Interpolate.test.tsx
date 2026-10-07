// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Interpolate } from "./Interpolate";

afterEach(cleanup);

describe("Interpolate", () => {
  it("puts nodes into the slots in the order the sentence has them", () => {
    const { container } = render(
      <Interpolate
        text='{{roadmap}}: ukończył {{step}}'
        values={{ step: <b>Step 1</b>, roadmap: <i>Blues</i> }}
      />,
    );

    expect(container.innerHTML).toBe("<i>Blues</i>: ukończył <b>Step 1</b>");
  });

  it("leaves a slot without a value as written", () => {
    const { container } = render(
      <Interpolate text='a {{missing}} b' values={{}} />,
    );

    expect(container.textContent).toBe("a {{missing}} b");
  });

  it("renders plain text untouched", () => {
    const { container } = render(<Interpolate text='no slots' values={{}} />);

    expect(container.textContent).toBe("no slots");
  });
});
