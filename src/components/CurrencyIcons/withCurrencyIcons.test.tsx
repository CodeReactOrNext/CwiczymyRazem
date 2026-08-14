import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { withCurrencyIcons } from "./withCurrencyIcons";

const render = (text: string) =>
  renderToStaticMarkup(<span>{withCurrencyIcons(text)}</span>);

describe("withCurrencyIcons", () => {
  it("puts the points coin in front of a points amount", () => {
    const html = render("finishing all three pays +10 points");

    expect(html).toContain("/images/points.png");
    expect(html).toContain("+10 points");
  });

  it("puts the Fame coin in front of a Fame amount", () => {
    const html = render("300 Fame per recording");

    expect(html).toContain("/images/coin.png");
  });

  it("marks both currencies when a sentence pays both", () => {
    const html = render("a cleared box pays 100 points and 50 Fame");

    expect(html).toContain("/images/points.png");
    expect(html).toContain("/images/coin.png");
  });

  it("marks a label that is only the currency name", () => {
    expect(render("Fame")).toContain("/images/coin.png");
    expect(render("Points")).toContain("/images/points.png");
  });

  it("leaves the word alone when no amount is attached", () => {
    const html = render("points are never taken away for inactivity");

    expect(html).not.toContain("/images");
  });

  it("reaches amounts nested in markdown emphasis", () => {
    const html = renderToStaticMarkup(
      <p>
        {withCurrencyIcons([
          <strong key='a'>+40 points</strong>,
          " for a learned song",
        ])}
      </p>,
    );

    expect(html).toContain("/images/points.png");
  });

  it("does not add a second icon when run over its own output", () => {
    const once = withCurrencyIcons("pays 300 Fame");
    const twice = renderToStaticMarkup(<span>{withCurrencyIcons(once)}</span>);

    expect(twice.match(/<img src="\/images\/coin\.png"/g)).toHaveLength(1);
  });
});
