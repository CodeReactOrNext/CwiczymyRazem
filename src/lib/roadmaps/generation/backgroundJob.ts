import type {
  Roadmap,
  RoadmapPhase,
} from "feature/aiCoach/types/roadmap.types";
import type { RoadmapJobView } from "feature/supporterPanel/types/roadmapJob.types";
import { walletFromStored } from "feature/supporterPanel/utils/supporterTokens";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

import { searchLessonsForStep } from "../lessonSearch";
import { findLibrarySong, findLibrarySongsByArtist } from "../songLookup";
import { briefForModel, effectiveGoal } from "./brief";
import { describePhaseSteps } from "./descriptions";
import { findCatalogEntry } from "./exerciseCatalog";
import { matchExercisesForStep } from "./exerciseMatch";
import type { GenerationTicket } from "./generationTicket";
import {
  markTicketProgress,
  storeTicketDraft,
  storeTicketStructure,
} from "./generationTicket";
import { extractGoalArtists } from "./goalArtists";
import { goalForModel } from "./goalContext";
import {
  approved,
  awaitingApproval,
  initialJob,
  isApprovalOverdue,
  isLeaseFree,
  JOB_GIVE_UP_MS,
  type JobTicket,
  nextLessonBatch,
  nextPhaseBatch,
  type StoredRoadmapJob,
  toJobView,
  UNIT_BUDGET_MS,
  withDescribedPhases,
  withFailure,
  withFeedback,
  withLessons,
  withSkeleton,
} from "./jobPlan";
import { isRoadmapLevel, type RoadmapLevel } from "./levels";
import { GenerationError } from "./openaiJson";
import {
  playerFacts,
  type PlayerRecord,
  renderPlayerFacts,
} from "./playerFacts";
import { checkRoadmapQuality, type QualityReport } from "./qualityGate";
import {
  draftRoadmapStructure,
  finishSkeleton,
  reviewRoadmapStructure,
  reviseForStudent,
  type StructureExtras,
  toStructurePhases,
} from "./structure";
import { addUsage, emptyUsage, estimateCostUsd, UsageLedger } from "./usage";

// ⚠️ Server-only: Admin SDK. Imported by API routes, never by a component.

const COLLECTION = "roadmapGenerations";
const WALLET_FIELD = "supporterTokens";
/** Held past the advance's own deadline, so a slow final write cannot be overtaken. */
const LEASE_MARGIN_MS = 30_000;

type TicketWithJob = GenerationTicket & { job: StoredRoadmapJob };

const ticketRef = (id: string): DocumentReference =>
  firestore.collection(COLLECTION).doc(id);

const readTicketWithJob = async (id: string): Promise<TicketWithJob | null> => {
  const snap = (await ticketRef(id).get()) as DocumentSnapshot;
  const ticket = snap.exists
    ? (snap.data() as GenerationTicket & { job?: StoredRoadmapJob | null })
    : null;
  return ticket?.job ? (ticket as TicketWithJob) : null;
};

/** Firestore refuses `undefined`; the generated phases are full of optional fields. */
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const saveJob = async (id: string, job: StoredRoadmapJob) => {
  const next = { ...job, updatedAt: new Date().toISOString() };
  await ticketRef(id).update({ job: clean(next) });
  return next;
};

const levelOf = (ticket: GenerationTicket): RoadmapLevel => {
  if (!isRoadmapLevel(ticket.level)) {
    throw new GenerationError("Invalid skill level.", 400);
  }
  return ticket.level;
};

/**
 * Puts a job on a ticket that does not have one yet — right after the charge,
 * or on a ticket the old browser pipeline opened. A ticket that already has a
 * job keeps it: a double click must not restart a generation halfway through.
 */
export async function ensureJob(
  ticket: GenerationTicket,
): Promise<RoadmapJobView> {
  const existing = (ticket as JobTicket).job;
  if (existing) return toJobView({ ...ticket, job: existing });
  const job = initialJob(ticket as JobTicket, new Date());
  await ticketRef(ticket.id).update({ job: clean(job) });
  return toJobView({ ...ticket, job });
}

/** Takes the job for one advance, or answers null when somebody else holds it. */
async function acquireLease(
  id: string,
  deadline: number,
): Promise<TicketWithJob | null> {
  return firestore.runTransaction(async (tx: Transaction) => {
    const snap = (await tx.get(ticketRef(id))) as DocumentSnapshot;
    const ticket = snap.exists ? (snap.data() as TicketWithJob) : null;
    if (!ticket?.job || ticket.job.status !== "running") return null;
    if (!isLeaseFree(ticket.job, Date.now())) return null;
    const leaseUntil = deadline + LEASE_MARGIN_MS;
    tx.update(ticketRef(id), { "job.leaseUntil": leaseUntil });
    return { ...ticket, job: { ...ticket.job, leaseUntil } };
  });
}

const releaseLease = (id: string) =>
  ticketRef(id)
    .update({ "job.leaseUntil": 0 })
    .catch((error: unknown) =>
      console.error("[roadmap-job] lease release failed", id, error),
    );

const noteProgress = (id: string, stage: "review" | "revise") =>
  markTicketProgress(id, stage).catch((error) =>
    console.error("[roadmap-job] progress note failed", id, error),
  );

const addJobUsage = (job: StoredRoadmapJob, ledger: UsageLedger) => ({
  ...job,
  usage: addUsage(job.usage ?? emptyUsage(), ledger.totals()),
});

/** Songs shown to the draft at most — a list to choose from, not the library. */
const MAX_LIBRARY_SONGS = 40;

/**
 * What the draft is given beyond the goal and the brief: a few facts the app
 * has measured about the player, and the library's songs by the artists the
 * goal names — so the plan's repertoire is picked from what has a tab, rather
 * than invented and then found missing (20 named songs in the first eight
 * roadmaps were not in the library).
 *
 * Every part is optional and every failure is swallowed: this only ever makes
 * the prompt better informed, and a roadmap is not worth losing over it.
 */
async function gatherExtras(
  ticket: TicketWithJob,
  goal: string,
  ledger: UsageLedger,
): Promise<StructureExtras> {
  const [profile, librarySongs] = await Promise.all([
    userRef(ticket.uid)
      .get()
      .then((snap: DocumentSnapshot) =>
        renderPlayerFacts(playerFacts(snap.data() as PlayerRecord | undefined)),
      )
      .catch((error: unknown) => {
        console.error("[roadmap-job] profile read failed", ticket.id, error);
        return "";
      }),
    extractGoalArtists(goal, ledger)
      .then((artists) => Promise.all(artists.map(findLibrarySongsByArtist)))
      .then((lists) => lists.flat().slice(0, MAX_LIBRARY_SONGS))
      .catch((error: unknown) => {
        console.error("[roadmap-job] library songs failed", ticket.id, error);
        return [];
      }),
  ]);
  // The songs the player picked are already required by the brief.
  const picked = new Set((ticket.brief?.songs ?? []).map((song) => song.id));
  return {
    ...(profile ? { profile } : {}),
    librarySongs: librarySongs.filter((song) => !picked.has(song.id)),
  };
}

/** The quality report as the ticket keeps it — enough to read, never the whole roadmap. */
const MAX_REPORT_LINES = 40;
const trimReport = (report: QualityReport): QualityReport => ({
  problems: report.problems.slice(0, MAX_REPORT_LINES),
  warnings: report.warnings.slice(0, MAX_REPORT_LINES),
});

/** An exercise id that is no longer in the library is taken off its step. */
const withKnownExercises = (phases: RoadmapPhase[]): RoadmapPhase[] =>
  phases.map((phase) => ({
    ...phase,
    steps: phase.steps.map((step) => {
      if (!step.suggestedExerciseId) return step;
      if (findCatalogEntry(step.suggestedExerciseId)) return step;
      const bare = { ...step };
      delete bare.suggestedExerciseId;
      delete bare.exerciseRole;
      delete bare.exerciseWhy;
      delete bare.exerciseSetup;
      return bare;
    }),
  }));

/** Tells the player the roadmap they walked away from is ready. */
async function notifyReady(ticket: TicketWithJob) {
  try {
    await firestore.collection("notifications").add({
      userId: ticket.uid,
      type: "roadmap_ready",
      roadmapId: ticket.roadmapId,
      roadmapGoal: ticket.goal.slice(0, 120),
      isRead: false,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // The roadmap is saved either way; a missing bell is not worth failing it.
    console.error("[roadmap-job] notification failed", ticket.id, error);
  }
}

/** One unit of work, with the job as it stands after it. */
async function runUnit(ticket: TicketWithJob): Promise<TicketWithJob> {
  const { job } = ticket;
  const level = levelOf(ticket);
  const goal = ticket.goal.trim();
  // What the player said about themselves rides along with the goal into the
  // prompts; the saved roadmap and the lesson search keep the goal alone.
  // A brief's "focus" answer narrows the goal itself; the rest of the brief
  // travels as its own block of constraints.
  const brief = ticket.brief ?? null;
  const promptGoal = goalForModel(
    effectiveGoal(goal, brief),
    ticket.context,
    ticket.title,
  );

  switch (job.step) {
    case "draft": {
      if (ticket.draft?.length) {
        return {
          ...ticket,
          job: await saveJob(ticket.id, { ...job, step: "review" }),
        };
      }
      const ledger = new UsageLedger();
      const extras =
        ticket.extras ?? (await gatherExtras(ticket, promptGoal, ledger));
      if (!ticket.extras) {
        await ticketRef(ticket.id).update({ extras: clean(extras) });
      }
      const draft = await draftRoadmapStructure(
        promptGoal,
        level,
        ledger,
        brief,
        extras,
      );
      await storeTicketDraft(ticket.id, draft, ledger.totals());
      return {
        ...ticket,
        extras,
        draft,
        draftUsage: ledger.totals(),
        job: await saveJob(ticket.id, {
          ...job,
          step: "review",
          attempts: 0,
          error: null,
        }),
      };
    }

    case "review": {
      if (ticket.structure) {
        return {
          ...ticket,
          job: await saveJob(
            ticket.id,
            withSkeleton(job, ticket.structure.phases),
          ),
        };
      }
      if (!ticket.draft?.length) {
        return {
          ...ticket,
          job: await saveJob(ticket.id, { ...job, step: "draft" }),
        };
      }
      const ledger = new UsageLedger();
      await noteProgress(ticket.id, "review");
      const structure = await reviewRoadmapStructure(
        promptGoal,
        level,
        ticket.draft,
        {
          ledger,
          resolveSong: findLibrarySong,
          matchExercise: matchExercisesForStep,
          onRevise: () => noteProgress(ticket.id, "revise"),
          brief,
          extras: ticket.extras,
        },
      );
      const usage = ledger.totals();
      await storeTicketStructure(
        ticket.id,
        structure,
        addUsage(ticket.draftUsage ?? emptyUsage(), usage),
        usage,
      );
      // The plan stops here for its owner to read before the slow part.
      return {
        ...ticket,
        structure,
        job: await saveJob(
          ticket.id,
          awaitingApproval(
            {
              ...withSkeleton(job, structure.phases),
              attempts: 0,
              error: null,
            },
            new Date(),
          ),
        ),
      };
    }

    case "reshape": {
      const current = job.phases ?? ticket.structure?.phases ?? [];
      const feedback = job.feedback?.trim();
      if (!feedback || !current.length || !ticket.structure) {
        return { ...ticket, job: await saveJob(ticket.id, approved(job)) };
      }
      const ledger = new UsageLedger();
      await noteProgress(ticket.id, "revise");
      const options = {
        ledger,
        brief,
        extras: ticket.extras,
        resolveSong: findLibrarySong,
        matchExercise: matchExercisesForStep,
      };
      const reshaped = await reviseForStudent(
        promptGoal,
        level,
        toStructurePhases(current),
        feedback,
        options,
      );
      const finished = await finishSkeleton(
        promptGoal,
        level,
        reshaped,
        options,
      );
      const structure = {
        ...ticket.structure,
        ...finished,
        review: { ...ticket.structure.review, revised: true },
      };
      await storeTicketStructure(
        ticket.id,
        structure,
        addUsage(ticket.usage ?? emptyUsage(), ledger.totals()),
      );
      return {
        ...ticket,
        structure,
        job: await saveJob(
          ticket.id,
          awaitingApproval(
            {
              ...withSkeleton(job, structure.phases),
              attempts: 0,
              error: null,
            },
            new Date(),
          ),
        ),
      };
    }

    case "phases": {
      const skeleton = job.phases ?? [];
      const batch = nextPhaseBatch(job);
      if (!batch.length) {
        return {
          ...ticket,
          job: await saveJob(ticket.id, withDescribedPhases(job, [])),
        };
      }
      const ledger = new UsageLedger();
      // Every call reads the same skeleton: the prompt only looks at the other
      // phases' titles, so what a sibling call is writing cannot change it.
      const described: RoadmapPhase[] = await Promise.all(
        batch.map((phaseIndex) =>
          describePhaseSteps({
            goal: promptGoal,
            level,
            phases: skeleton,
            phaseIndex,
            brief: briefForModel(brief),
            ledger,
          }),
        ),
      );
      return {
        ...ticket,
        job: await saveJob(ticket.id, {
          ...addJobUsage(withDescribedPhases(job, described), ledger),
          attempts: 0,
          error: null,
        }),
      };
    }

    case "lessons": {
      const batch = nextLessonBatch(job);
      const found: Record<string, string[]> = {};
      const ledger = new UsageLedger();
      await Promise.all(
        batch.map(async ({ step }) => {
          try {
            const { lessons, usage } = await searchLessonsForStep({
              stepTitle: step.title,
              stepDescription: step.description,
              roadmapGoal: goal,
              roadmapLevel: level,
            });
            ledger.add(usage);
            found[step.id] = lessons.map((lesson) => lesson.videoId);
          } catch (error) {
            console.error("[roadmap-job] lesson search failed", step.id, error);
          }
        }),
      );
      return {
        ...ticket,
        job: await saveJob(
          ticket.id,
          addJobUsage(withLessons(job, batch.length, found), ledger),
        ),
      };
    }

    case "save": {
      const phases = withKnownExercises(job.phases ?? []);
      // The gate the admin queue has always run, now in front of every save.
      // A phase that came out without its texts is written once more; the
      // rest of what it finds is kept on the ticket, where the patterns show.
      const report = checkRoadmapQuality(phases);
      const blank = phases.filter((phase) =>
        phase.steps.some(
          (step) => !step.description.trim() || !step.successCriteria.trim(),
        ),
      );
      if (blank.length && !job.qualityRetried) {
        const redo = new Set(blank.map((phase) => phase.id));
        return {
          ...ticket,
          job: await saveJob(ticket.id, {
            ...job,
            phases,
            step: "phases",
            describedPhaseIds: job.describedPhaseIds.filter(
              (id) => !redo.has(id),
            ),
            qualityRetried: true,
          }),
        };
      }
      const now = new Date().toISOString();
      const roadmap: Roadmap = {
        id: ticket.roadmapId,
        userId: ticket.uid,
        title: ticket.title || goal.slice(0, 80),
        goal,
        level,
        createdAt: job.startedAt,
        updatedAt: now,
        phases,
        visibility: ticket.visibility,
        ...(brief ? { brief } : {}),
      };
      await firestore
        .collection("roadmaps")
        .doc(roadmap.id)
        .set(clean(roadmap));
      const done = await saveJob(ticket.id, {
        ...job,
        // The whole roadmap's bill: the skeleton on the ticket, the rest on the job.
        costUsd: estimateCostUsd(
          addUsage(ticket.usage ?? emptyUsage(), job.usage ?? {}),
        ),
        status: "done",
        attempts: 0,
        error: null,
        phases,
        quality: trimReport(report),
      });
      const finished = { ...ticket, job: done };
      await notifyReady(finished);
      return finished;
    }

    default:
      return ticket;
  }
}

/**
 * A job that will not finish: marked failed, and — once — its tokens go back
 * to the wallet. The ticket stays, so the player's tab can still read why.
 */
async function failJob(ticket: TicketWithJob, job: StoredRoadmapJob) {
  await firestore.runTransaction(async (tx: Transaction) => {
    const [snap, user] = (await Promise.all([
      tx.get(ticketRef(ticket.id)),
      tx.get(userRef(ticket.uid)),
    ])) as [DocumentSnapshot, DocumentSnapshot];
    const stored = snap.data() as TicketWithJob | undefined;
    const refundDue = !stored?.job?.refunded && ticket.tokensCharged > 0;

    if (refundDue) {
      const wallet = walletFromStored(user.data()?.[WALLET_FIELD]);
      tx.update(user.ref, {
        [WALLET_FIELD]: {
          spent: Math.max(0, wallet.spent - ticket.tokensCharged),
          granted: wallet.granted,
        },
      });
    }
    tx.update(ticketRef(ticket.id), {
      job: clean({
        ...job,
        status: "failed",
        refunded: refundDue || !!stored?.job?.refunded,
        updatedAt: new Date().toISOString(),
      }),
    });
  });
}

async function recordFailure(ticket: TicketWithJob, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";
  // A 400 is the model refusing the goal itself; asking again changes nothing.
  const permanent = error instanceof GenerationError && error.status === 400;
  const job = withFailure(ticket.job, message, permanent);
  console.error("[roadmap-job] unit failed", ticket.id, job.step, message);
  if (job.status === "failed") {
    await failJob(ticket, job);
  } else {
    await saveJob(ticket.id, job);
  }
}

export interface AdvanceOutcome {
  /** False when another advance held the job, or it was not running. */
  ran: boolean;
  view: RoadmapJobView | null;
}

/**
 * Runs the job forward until it finishes, fails a unit, or the next unit would
 * not fit before `deadline`. Safe to call from anywhere at any time: the lease
 * lets exactly one advance run a job, and each unit is saved as it ends.
 */
export async function advanceJob(
  id: string,
  deadline: number,
): Promise<AdvanceOutcome> {
  const leased = await acquireLease(id, deadline);
  if (!leased) {
    const ticket = await readTicketWithJob(id);
    return { ran: false, view: ticket ? toJobView(ticket) : null };
  }

  let ticket = leased;
  try {
    if (
      Date.now() - new Date(ticket.job.startedAt).getTime() >
      JOB_GIVE_UP_MS
    ) {
      await failJob(ticket, {
        ...ticket.job,
        error: "The generation stalled.",
      });
    } else {
      while (
        ticket.job.status === "running" &&
        Date.now() + UNIT_BUDGET_MS[ticket.job.step] <= deadline
      ) {
        ticket = await runUnit(ticket);
      }
    }
  } catch (error) {
    await recordFailure(ticket, error).catch((recordError) =>
      console.error("[roadmap-job] could not record failure", id, recordError),
    );
  } finally {
    await releaseLease(id);
  }

  const fresh = await readTicketWithJob(id);
  return { ran: true, view: fresh ? toJobView(fresh) : null };
}

/**
 * The owner's answer to the plan: yes, or — once — a note on what to change.
 * A job that is no longer waiting (the cron approved it, another tab did)
 * answers with where it stands instead of an error.
 */
export async function answerApproval(
  uid: string,
  id: string,
  feedback: string | null,
): Promise<RoadmapJobView | null> {
  return firestore.runTransaction(async (tx: Transaction) => {
    const snap = (await tx.get(ticketRef(id))) as DocumentSnapshot;
    const ticket = snap.exists ? (snap.data() as TicketWithJob) : null;
    if (!ticket?.job || ticket.uid !== uid) return null;
    if (ticket.job.status !== "awaiting_approval") return toJobView(ticket);

    const wantsChanges = !!feedback?.trim() && !ticket.job.approval?.feedbackUsed;
    const job = {
      ...(wantsChanges
        ? withFeedback(ticket.job, feedback as string)
        : approved(ticket.job)),
      updatedAt: new Date().toISOString(),
    };
    tx.update(ticketRef(id), { job: clean(job) });
    return toJobView({ ...ticket, job });
  });
}

/**
 * Plans nobody answered for: taken as approved, so a player who closed the
 * tab on the approval screen still gets their roadmap. Called by the cron
 * before it looks for idle jobs.
 */
export async function approveOverdueJobs(now = Date.now()): Promise<number> {
  const snap = await firestore
    .collection(COLLECTION)
    .where("job.status", "==", "awaiting_approval")
    .get();
  const overdue = snap.docs
    .map((doc: DocumentSnapshot) => doc.data() as TicketWithJob)
    .filter((ticket: TicketWithJob) => isApprovalOverdue(ticket.job, now));
  await Promise.all(
    overdue.map((ticket: TicketWithJob) =>
      answerApproval(ticket.uid, ticket.id, null).catch((error) =>
        console.error("[roadmap-job] auto-approve failed", ticket.id, error),
      ),
    ),
  );
  return overdue.length;
}

/** One of the player's jobs, or null when it is not theirs. */
export async function readJobFor(
  uid: string,
  id: string,
): Promise<RoadmapJobView | null> {
  const ticket = await readTicketWithJob(id);
  return ticket && ticket.uid === uid ? toJobView(ticket) : null;
}

/** The player's running job, newest first — how a reopened tab finds its way back. */
export async function findRunningJob(
  uid: string,
): Promise<RoadmapJobView | null> {
  // One equality filter, so no composite index: a player has a handful of tickets.
  const snap = await firestore
    .collection(COLLECTION)
    .where("uid", "==", uid)
    .get();
  const running = snap.docs
    .map(
      (doc: DocumentSnapshot) =>
        doc.data() as GenerationTicket & { job?: StoredRoadmapJob },
    )
    .filter(
      (
        ticket: GenerationTicket & { job?: StoredRoadmapJob },
      ): ticket is TicketWithJob =>
        ticket.job?.status === "running" ||
        ticket.job?.status === "awaiting_approval",
    )
    .sort((a: TicketWithJob, b: TicketWithJob) =>
      a.job.startedAt < b.job.startedAt ? 1 : -1,
    );
  return running[0] ? toJobView(running[0]) : null;
}

/** Ids of the running jobs nobody is advancing right now, oldest first. */
export async function findIdleJobs(now = Date.now()): Promise<string[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .where("job.status", "==", "running")
    .get();
  return snap.docs
    .map((doc: DocumentSnapshot) => doc.data() as TicketWithJob)
    .filter((ticket: TicketWithJob) => isLeaseFree(ticket.job, now))
    .sort((a: TicketWithJob, b: TicketWithJob) =>
      a.job.updatedAt < b.job.updatedAt ? -1 : 1,
    )
    .map((ticket: TicketWithJob) => ticket.id);
}
