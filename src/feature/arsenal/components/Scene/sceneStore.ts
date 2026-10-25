import { create } from "zustand";

import type {
  BulkScrapResult,
  FusePartsResult,
  PartId,
  PartTier,
  ScrapResult,
  WorkshopBuildResult,
  WorkshopCommissionResult,
  WorkshopModResult,
  WorkshopRepairResult,
} from "../../types/arsenal.types";
import type { TraderBuyResult } from "../../types/trader.types";
import type { SceneSubject } from "./sceneSubject";

/**
 * Every full-screen moment the arsenal plays after an action, described as data.
 *
 * A scene opens the moment the request goes out — that is its wind-up — and
 * receives `result` when the server answers, which is when it pays off. Living in
 * a store rather than in each screen is what lets the mutation hooks run it: the
 * six places that can scrap a guitar all get the same teardown without any of
 * them knowing the scene exists.
 */
export type SceneRequest =
  | {
      type: "teardown";
      /** The front few of what is being taken apart — the scene draws a stack. */
      subjects: SceneSubject[];
      /** How many are going, which can be more than the stack draws. */
      count: number;
      result?: ScrapResult | BulkScrapResult;
    }
  | {
      type: "rework";
      partId: PartId;
      tier: PartTier;
      crafts: number;
      result?: FusePartsResult;
    }
  | {
      type: "fit";
      subject: SceneSubject;
      featureId: string;
      label: string;
      result?: WorkshopModResult;
    }
  | {
      type: "delivery";
      /** Who handed it over — the bench building to order, or the counter. */
      source: "commission" | "trader";
      subject: SceneSubject;
      result?: WorkshopCommissionResult | TraderBuyResult;
    }
  | {
      /** A build level bought at the bench — and, now and then, a promotion. */
      type: "build";
      subject: SceneSubject;
      result?: WorkshopBuildResult;
    }
  | {
      type: "restore";
      subject: SceneSubject;
      /** The 0–1 condition it walked onto the bench with. */
      conditionBefore: number;
      result?: WorkshopRepairResult;
    };

export type ActiveScene = SceneRequest & { id: number };

interface SceneState {
  scene: ActiveScene | null;
  /** How many hosts are mounted. With none, `beginScene` declines. */
  hosts: number;
  nextId: number;
}

export const useSceneStore = create<SceneState>()(() => ({
  scene: null,
  hosts: 0,
  nextId: 1,
}));

/**
 * Work held back until the scene has gone — see `afterScene`. A plain module
 * array rather than store state: nothing renders from it, and it must not wake
 * the host.
 */
let deferred: (() => void)[] = [];

/** Runs everything `afterScene` held back. The host calls it once a scene has faded out. */
export const flushAfterScene = () => {
  const work = deferred;
  deferred = [];
  work.forEach((run) => run());
};

/** A host announces itself on mount, so hooks know a scene would be seen. */
export const registerSceneHost = () => {
  useSceneStore.setState((s) => ({ hosts: s.hosts + 1 }));
  return () => {
    useSceneStore.setState((s) => ({ hosts: s.hosts - 1 }));
    // Leaving the page mid-scene must not strand a refetch or a balance.
    if (useSceneStore.getState().hosts <= 0) flushAfterScene();
  };
};

/**
 * Runs `work` once scene `id` has finished and faded out — or right away when
 * there is no such scene on screen.
 *
 * For the heavy half of a mutation's success: refetching the arsenal and moving
 * the Fame balance both re-render the whole tab underneath, and doing that the
 * instant the server answers lands it on the very frames the payoff is playing
 * on. Held until the scene is gone, the main thread is free for the animation —
 * and the wallet's own count runs where the player can see it, instead of
 * behind the scene.
 */
export const afterScene = (id: number | null | undefined, work: () => void) => {
  if (id == null || useSceneStore.getState().scene?.id !== id) {
    work();
    return;
  }
  deferred.push(work);
};

/**
 * Opens a scene, or returns `null` when nothing on screen could show it — the
 * caller then falls back to the toast it always had, so an action is never
 * silent just because it ran outside the arsenal page.
 */
export const beginScene = (request: SceneRequest): number | null => {
  const { hosts, nextId } = useSceneStore.getState();
  if (hosts <= 0) return null;
  useSceneStore.setState({
    scene: { ...request, id: nextId } as ActiveScene,
    nextId: nextId + 1,
  });
  return nextId;
};

/** Hands the server's answer to the scene that is waiting for it. */
export const resolveScene = <T extends SceneRequest["result"]>(
  id: number | null | undefined,
  result: T,
) => {
  if (id == null) return;
  useSceneStore.setState((s) =>
    s.scene?.id === id ? { scene: { ...s.scene, result } as ActiveScene } : s,
  );
};

/**
 * Ends a scene on the spot — a failed request, or the player closing it. The
 * hook has already said what went wrong, and a payoff for something that did
 * not happen would be a lie.
 */
export const endScene = (id: number | null | undefined) => {
  if (id == null) return;
  useSceneStore.setState((s) => (s.scene?.id === id ? { scene: null } : s));
};
