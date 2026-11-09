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

import { MCP_PATH } from "lib/mcp/oauth/config";
import { safeNextPath } from "utils/auth/safeNextPath";

import { AiAssistantPage } from "./AiAssistantPage";
import {
  AI_ASSISTANT_APP_PATH,
  AI_ASSISTANT_CTA_HREF,
  AI_ASSISTANT_FAQS,
  AI_ASSISTANT_META,
  AI_ASSISTANT_SERVER_URL,
  AI_ASSISTANT_STEPS,
} from "./data/aiAssistant";

// React marks text/expression seams with empty comments; read the copy without them.
const html = renderToString(<AiAssistantPage />).replace(/<!-- -->/g, "");

describe("AI assistant landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(AI_ASSISTANT_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(AI_ASSISTANT_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(AI_ASSISTANT_FAQS.length).toBeGreaterThanOrEqual(3);
  });

  it("sends the CTA through sign-up to the supporter page", () => {
    const next = new URLSearchParams(AI_ASSISTANT_CTA_HREF.split("?")[1]).get(
      "next",
    );
    expect(safeNextPath(next)).toBe(AI_ASSISTANT_APP_PATH);
    expect(html).toContain(AI_ASSISTANT_CTA_HREF.replace(/&/g, "&amp;"));
  });

  it("shows the address the MCP server really answers on", () => {
    expect(new URL(AI_ASSISTANT_SERVER_URL).pathname).toBe(MCP_PATH);
    expect(html).toContain(AI_ASSISTANT_SERVER_URL);
  });

  it("says plainly that it's a supporter perk, and the rest stays free", () => {
    expect(html).toMatch(/supporter perk/i);
    expect(html).toMatch(/stays free/);
    expect(AI_ASSISTANT_STEPS[0].label).toMatch(/supporter/i);
  });

  it("quotes the daily limits the server enforces", () => {
    expect(html).toContain("Up to 35 changes a day");
    expect(html).toContain("10 of them new exercises");
  });
});
