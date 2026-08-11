import { describe, expect, it } from "vitest";

import {
  resolveSentryEnabled,
  resolveSentryEnvironment,
  SENTRY_DSN,
  sharedSentryOptions,
} from "./sentryOptions";

const DSN = "https://public@example.ingest.de.sentry.io/1";

describe("resolveSentryEnabled", () => {
  it("wysyła błędy z buildu produkcyjnego", () => {
    expect(resolveSentryEnabled({ dsn: DSN, nodeEnv: "production" })).toBe(true);
  });

  it("milczy w dev i w testach", () => {
    expect(resolveSentryEnabled({ dsn: DSN, nodeEnv: "development" })).toBe(
      false
    );
    expect(resolveSentryEnabled({ dsn: DSN, nodeEnv: "test" })).toBe(false);
  });

  it("nie startuje bez DSN", () => {
    expect(resolveSentryEnabled({ dsn: "", nodeEnv: "production" })).toBe(false);
    expect(resolveSentryEnabled({ nodeEnv: "production" })).toBe(false);
  });

  it("pozwala wymusić włączenie poza produkcją", () => {
    expect(
      resolveSentryEnabled({
        dsn: DSN,
        nodeEnv: "development",
        override: "true",
      })
    ).toBe(true);
    expect(
      resolveSentryEnabled({ dsn: DSN, nodeEnv: "development", override: "1" })
    ).toBe(true);
  });

  it("pozwala wyciszyć Sentry na produkcji", () => {
    expect(
      resolveSentryEnabled({
        dsn: DSN,
        nodeEnv: "production",
        override: "false",
      })
    ).toBe(false);
    expect(
      resolveSentryEnabled({ dsn: DSN, nodeEnv: "production", override: "0" })
    ).toBe(false);
  });

  it("ignoruje nieznaną wartość override", () => {
    expect(
      resolveSentryEnabled({ dsn: DSN, nodeEnv: "production", override: "yes" })
    ).toBe(true);
    expect(
      resolveSentryEnabled({ dsn: DSN, nodeEnv: "development", override: "" })
    ).toBe(false);
  });
});

describe("resolveSentryEnvironment", () => {
  it("preferuje środowisko z Vercela", () => {
    expect(
      resolveSentryEnvironment({ vercelEnv: "preview", nodeEnv: "production" })
    ).toBe("preview");
  });

  it("spada na NODE_ENV, a docelowo na development", () => {
    expect(resolveSentryEnvironment({ nodeEnv: "production" })).toBe(
      "production"
    );
    expect(resolveSentryEnvironment({})).toBe("development");
  });
});

describe("sharedSentryOptions", () => {
  it("ma komplet ustawień potrzebnych do raportowania", () => {
    expect(sharedSentryOptions.dsn).toBe(SENTRY_DSN);
    expect(sharedSentryOptions.enableLogs).toBe(true);
    expect(sharedSentryOptions.tracesSampleRate).toBe(1);
    expect(sharedSentryOptions.sendDefaultPii).toBe(true);
  });

  it("ma poprawny DSN projektu", () => {
    expect(SENTRY_DSN).toMatch(/^https:\/\/\w+@o\d+\.ingest\.\w+\.sentry\.io\/\d+$/);
  });
});
