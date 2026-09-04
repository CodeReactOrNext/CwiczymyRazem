// @vitest-environment node

/**
 * Read-only diagnostic: why does one account not have a given achievement yet?
 *
 * Every check is a pure function of the report context, so the stored stats are
 * replayed through the real registry twice — once against an empty session and
 * once against a maximal one — which sorts the locked badges into "the stats
 * alone already qualify", "needs a particular session" and "not there yet".
 *
 * Run with:
 *   AUDIT_UID=<uid> npx vitest run --mode achievements-audit scripts/achievementsAudit.test.ts
 *
 * Guarded by `--mode achievements-audit` so a plain `npm test` skips it.
 */
import { achievementsData } from "feature/achievements/data/achievementsData";
import { EMPTY_ARSENAL_SUMMARY, summarizeArsenal } from "feature/arsenal/data/arsenalSummary";
import type { AchievementContext } from "feature/achievements/types";
import type {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import type { SongListInterface } from "src/pages/api/user/report";
import type { StatisticsDataInterface } from "types/api.types";
import { describe, it } from "vitest";

const readServiceAccountJson = (): string | undefined => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  }
  for (const file of [".env.development.local", ".env.local", ".env"]) {
    const envPath = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      if (!line.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON=")) continue;
      let value = line.slice("FIREBASE_SERVICE_ACCOUNT_JSON=".length).trim();
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }
      if (value) return value;
    }
  }
  return undefined;
};

const emptySession: ReportDataInterface = {
  reportDate: new Date(),
  totalPoints: 0,
  bonusPoints: { multiplier: 0, habitsCount: 0, additionalPoints: 0, time: 0, timePoints: 0 },
};

const emptyInput: ReportFormikInterface = {
  techniqueHours: "0", techniqueMinutes: "0",
  theoryHours: "0", theoryMinutes: "0",
  hearingHours: "0", hearingMinutes: "0",
  creativityHours: "0", creativityMinutes: "0",
  countBackDays: 0,
  reportTitle: "",
  habbits: [],
  avatarUrl: null,
};

/** The most generous session the report form can express, to probe what is session-gated. */
const maxSession: ReportDataInterface = {
  ...emptySession,
  totalPoints: 100000,
  bonusPoints: { ...emptySession.bonusPoints, habitsCount: 5 },
};

const maxInput: ReportFormikInterface = {
  ...emptyInput,
  techniqueHours: "23", techniqueMinutes: "59",
  theoryHours: "23", theoryMinutes: "59",
  hearingHours: "23", hearingMinutes: "59",
  creativityHours: "23", creativityMinutes: "59",
  habbits: ["exercise_plan", "new_things", "warmup", "metronome", "recording"],
  songId: "probe",
};

const hrs = (ms: number) => (ms / 3600000).toFixed(1);

const out: string[] = [];
const log = (line = "") => { out.push(line); };

/** Same, but with every habit unticked — `yolo` is the one check that wants an empty list. */
const maxInputNoHabits: ReportFormikInterface = { ...maxInput, habbits: [] };

const isAuditMode = (import.meta as any).env?.MODE === "achievements-audit";

(isAuditMode ? describe : describe.skip)("Achievements audit", () => {
  it("explains every locked achievement for one account", async () => {
    const uid = process.env.AUDIT_UID;
    if (!uid) throw new Error("AUDIT_UID not set");

    const serviceAccountJson = readServiceAccountJson();
    if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not found");
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountJson)) });
    }

    const firestore = admin.firestore();
    const userRef = firestore.collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) throw new Error(`No user document for uid ${uid}`);

    const statistics = snap.data()?.statistics as StatisticsDataInterface;
    const songsSnap = await userRef.collection("userSongs").get();
    const songLists: SongListInterface = { wantToLearn: [], learning: [], learned: [] };
    songsSnap.docs.forEach((d) => {
      const status = d.data().status as keyof SongListInterface;
      if (songLists[status]) songLists[status].push(d.data().songId);
    });

    const owned = new Set(statistics.achievements ?? []);
    const base = { statistics, songLists, arsenal: summarizeArsenal(snap.data()?.arsenal) };
    const ctxNow: AchievementContext = { ...base, sessionResults: emptySession, inputData: emptyInput };
    const ctxMax: AchievementContext = { ...base, sessionResults: maxSession, inputData: maxInput };
    const ctxMaxNoHabits: AchievementContext = {
      ...base,
      sessionResults: { ...maxSession, bonusPoints: { ...maxSession.bonusPoints, habitsCount: 0 } },
      inputData: maxInputNoHabits,
    };
    const maxedArsenal = {
      rigLevel: 99999,
      ownedByRarity: Object.fromEntries(
        Object.keys(EMPTY_ARSENAL_SUMMARY.ownedByRarity).map((k) => [k, 99]),
      ) as typeof EMPTY_ARSENAL_SUMMARY.ownedByRarity,
      museumCount: 99,
      countryCount: 99,
      oldestGuitarYear: 1950,
      bestSerial: 1,
      itemCount: 999,
    };
    // Probed one axis at a time, so a locked badge can be blamed on the right
    // thing: a session never logged, or gear never acquired.
    const ctxMaxGear: AchievementContext = { ...ctxNow, arsenal: maxedArsenal };
    const sessionGates = (def: (typeof achievementsData)[number]) =>
      def.check(ctxMax) || def.check(ctxMaxNoHabits);
    const gearGates = (def: (typeof achievementsData)[number]) => def.check(ctxMaxGear);

    const t = statistics.time;
    log(`\n===== ${uid} =====`);
    log(
      `lvl ${statistics.lvl} | points ${statistics.points} | sessions ${statistics.sessionCount} | habits ${statistics.habitsCount}`
    );
    log(
      `streak now ${statistics.actualDayWithoutBreak} (displayed ${statistics.streakDays ?? "-"}) | best ${statistics.dayWithoutBreak}`
    );
    log(
      `time h: technique ${hrs(t.technique)} theory ${hrs(t.theory)} hearing ${hrs(t.hearing)} creativity ${hrs(t.creativity)} | total ${hrs(t.technique + t.theory + t.hearing + t.creativity)} | longest session ${hrs(t.longestSession)}`
    );
    log(
      `songs: wantToLearn ${songLists.wantToLearn.length} learning ${songLists.learning.length} learned ${songLists.learned.length}`
    );
    log(`owned ${owned.size} / ${achievementsData.length}\n`);

    const knownIds = new Set(achievementsData.map((d) => d.id));
    log("--- OWNED (" + owned.size + ") ---");
    log("  " + [...owned].sort().join(", "));
    const stale = [...owned].filter((id) => !knownIds.has(id));
    log("");
    log("--- OWNED BUT NOT IN REGISTRY (" + stale.length + ") ---");
    log("  " + (stale.join(", ") || "(none)"));
    log("");

    const ready: string[] = [];
    const gearGated: string[] = [];
    const sessionGated: string[] = [];
    const notYet: string[] = [];
    const impossible: string[] = [];

    for (const def of achievementsData) {
      if (owned.has(def.id)) continue;
      const progress = def.getProgress ? def.getProgress(ctxNow) : undefined;
      const label = progress
        ? `${def.id} (${def.rarity}) — ${progress.current}/${progress.max}${progress.unit ? " " + progress.unit : ""}`
        : `${def.id} (${def.rarity})`;

      if (def.check(ctxNow)) ready.push(label);
      else if (gearGates(def)) gearGated.push(label);
      else if (sessionGates(def)) sessionGated.push(label);
      else if (!progress) impossible.push(label);
      else notYet.push(label);
    }

    const dump = (title: string, rows: string[]) => {
      log(`--- ${title} (${rows.length}) ---`);
      rows.forEach((r) => log("  " + r));
      log("");
    };

    dump("ALREADY QUALIFIED — will pop on the next report", ready);
    dump("GEAR-GATED — needs gear the stash does not hold", gearGated);
    dump("SESSION-GATED — needs one specific session", sessionGated);
    dump("LOCKED — real requirement not met yet", notYet);
    dump("UNREACHABLE — check is hardcoded false", impossible);

    fs.writeFileSync(process.env.AUDIT_OUT!, out.join(String.fromCharCode(10)));
  }, 120 * 1000);
});
