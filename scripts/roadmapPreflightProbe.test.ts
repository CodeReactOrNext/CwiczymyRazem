// @vitest-environment node

/**
 * Runs the roadmap preflight against the goal fixtures and reports the
 * misses: a verdict off, a question it had to ask and did not, one it must
 * not ask and did, or more questions than the goal deserves. This is how the
 * preflight prompt is tuned and how a change to the question bank is checked
 * before it ships — the picks are the whole value of the bank, and only the
 * live model can show whether they are sensible.
 *
 * Costs real money (a few tenths of a cent per goal), so it is guarded by
 * `--mode preflightprobe` and never part of `npm test`.
 *
 * Run with:
 *   npm run roadmap-preflight-probe
 *   ROADMAP_PROBE_ONLY="legato,jazz" npm run roadmap-preflight-probe
 *   ROADMAP_PROBE_REPEAT=3 npm run roadmap-preflight-probe   (each goal N times)
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const loadEnv = (name: string): string | undefined => {
  if (process.env[name]) return process.env[name];
  for (const file of [".env.development.local", ".env.local", ".env"]) {
    const envPath = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      if (!line.startsWith(`${name}=`)) continue;
      let value = line.slice(name.length + 1).trim();
      if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
      if (value) return value;
    }
  }
  return undefined;
};

const enabled = (import.meta as any).env?.MODE === "preflightprobe";

describe.skipIf(!enabled)("roadmap preflight probe", () => {
  it(
    "asks the right questions for every fixture goal",
    async () => {
      for (const name of ["OPENAI_API_KEY", "FIREBASE_SERVICE_ACCOUNT_JSON"]) {
        const value = loadEnv(name);
        if (value) process.env[name] = value;
      }
      const { GOAL_FIXTURES } =
        await import("../src/lib/roadmaps/generation/goalFixtures");
      const { runPreflight } =
        await import("../src/lib/roadmaps/generation/preflight");

      const only = (process.env.ROADMAP_PROBE_ONLY ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const repeat = Math.max(1, Number(process.env.ROADMAP_PROBE_REPEAT ?? 1));
      const fixtures = GOAL_FIXTURES.filter(
        (fixture) =>
          !only.length ||
          only.some((term) => fixture.name.toLowerCase().includes(term)),
      );

      const misses: string[] = [];
      const report: string[] = [];
      let runs = 0;
      let costUsd = 0;

      for (const fixture of fixtures) {
        for (let round = 0; round < repeat; round += 1) {
          runs += 1;
          const result = await runPreflight({
            goal: fixture.goal,
            title: fixture.title ?? null,
            level: fixture.level,
            context: null,
          });
          costUsd += result.usage?.costUsd ?? 0;
          const asked = result.questions.asked.map((q) => q.id);
          const total = asked.length + result.questions.custom.length;
          const label =
            repeat > 1 ? `${fixture.name} #${round + 1}` : fixture.name;
          const problems: string[] = [];

          if (result.verdict !== fixture.verdict) {
            problems.push(
              `verdict ${result.verdict} (wanted ${fixture.verdict})`,
            );
          }
          for (const id of fixture.mustAsk) {
            if (!asked.includes(id)) problems.push(`missing ${id}`);
          }
          for (const id of fixture.mustNotAsk) {
            if (asked.includes(id)) problems.push(`asked ${id}`);
          }
          if (
            fixture.maxQuestions !== undefined &&
            total > fixture.maxQuestions
          ) {
            problems.push(`${total} questions (max ${fixture.maxQuestions})`);
          }

          const line = `${problems.length ? "✗" : "✓"} ${label}: [${asked.join(", ")}]${
            result.questions.custom.length
              ? ` + custom: ${result.questions.custom.map((q) => `"${q.question}"`).join(", ")}`
              : ""
          }\n    ${result.verdict} — ${result.understood}${
            result.songsFound.length || result.songsMissing.length
              ? `\n    songs: found ${result.songsFound.map((s) => s.title).join(", ") || "—"}; missing ${result.songsMissing.map((s) => s.title).join(", ") || "—"}`
              : ""
          }${problems.length ? `\n    PROBLEMS: ${problems.join("; ")}` : ""}`;
          report.push(line);
          if (problems.length) misses.push(`${label}: ${problems.join("; ")}`);
        }
      }

      report.push(
        `\n${runs - misses.length}/${runs} runs clean · ~$${costUsd.toFixed(4)} spent`,
      );
      if (misses.length) report.push(`\nMISSES:\n- ${misses.join("\n- ")}`);

      // The worker's console is not always shown by the runner, so the report
      // also lands in a file — the thing to read after a run.
      const reportPath =
        process.env.ROADMAP_PROBE_REPORT ??
        path.resolve(__dirname, "roadmapPreflightProbe.report.txt");
      fs.writeFileSync(reportPath, `${report.join("\n")}\n`, "utf-8");
      console.log(report.join("\n"));
      console.log(`\nReport written to ${reportPath}`);

      // A report, not a gate: the misses are printed above for the person tuning
      // the prompt, and the run is green as long as the model answered at all.
      expect(runs).toBeGreaterThan(0);
    },
    20 * 60 * 1000,
  );
});
