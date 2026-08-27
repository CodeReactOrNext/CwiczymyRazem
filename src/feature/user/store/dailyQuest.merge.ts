import type { DailyQuest, DailyQuestTask } from "types/api.types";

/**
 * Identity of a task inside one day's quest set. Two draws of the same template
 * are the same task, and a "practice a specific exercise" task only matches
 * when it points at the same exercise.
 */
const taskKey = (task: DailyQuestTask) =>
  task.exerciseId ? `${task.type}:${task.exerciseId}` : task.type;

/** Whether two quests carry the exact same state — used to skip pointless writes. */
export const isSameQuest = (
  a: DailyQuest | null | undefined,
  b: DailyQuest | null | undefined
): boolean => {
  if (!a || !b) return !a && !b;
  if (a.date !== b.date) return false;
  if (a.isRewardClaimed !== b.isRewardClaimed) return false;
  if (a.tasks.length !== b.tasks.length) return false;

  return a.tasks.every((task, index) => {
    const other = b.tasks[index];
    return (
      !!other &&
      task.id === other.id &&
      task.type === other.type &&
      task.title === other.title &&
      task.target === other.target &&
      task.progress === other.progress &&
      task.isCompleted === other.isCompleted &&
      (task.exerciseId ?? null) === (other.exerciseId ?? null)
    );
  });
};

/**
 * Reconciles the quest a client holds in memory with the one already stored.
 *
 * The quest lives in a single document field, so publishing it used to be a
 * blind overwrite: any client holding an older copy — a tab left open since the
 * morning, a second device, a write queued while offline — pushed that copy back
 * over newer progress, and completed tasks "reset" hours later. Merging instead
 * means progress only ever moves forward.
 *
 * `today` is the caller's local date key: on a day boundary the copy that
 * belongs to the caller's own day wins, so a stale client can never resurrect
 * yesterday's quest and a client that just rolled over can publish the new set.
 */
export const mergeDailyQuests = (
  local: DailyQuest | null | undefined,
  remote: DailyQuest | null | undefined,
  today: string
): DailyQuest | null => {
  if (!remote) return local ?? null;
  if (!local) return remote;

  if (local.date !== remote.date) {
    if (local.date === today) return local;
    if (remote.date === today) return remote;
    // Neither belongs to this device's today (a wrong clock, a device in
    // another timezone). Pick the later date so the clients converge on one
    // quest instead of overwriting each other in a loop.
    return local.date > remote.date ? local : remote;
  }

  // Same day: the stored task list is the canonical draw. Two clients that
  // generated a set at the same time must not keep swapping their own draw in,
  // so local-only tasks are dropped and their progress carried over by type.
  const localByKey = new Map(local.tasks.map((task) => [taskKey(task), task]));

  const tasks = remote.tasks.map((remoteTask) => {
    const localTask = localByKey.get(taskKey(remoteTask));
    if (!localTask) return remoteTask;

    const progress = Math.min(
      Math.max(remoteTask.progress, localTask.progress),
      remoteTask.target
    );

    return {
      ...remoteTask,
      progress,
      isCompleted:
        remoteTask.isCompleted || localTask.isCompleted || progress >= remoteTask.target,
    };
  });

  return {
    date: remote.date,
    tasks,
    isRewardClaimed: remote.isRewardClaimed || local.isRewardClaimed,
  };
};
