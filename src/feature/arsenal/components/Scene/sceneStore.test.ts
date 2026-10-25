import { afterEach, describe, expect, it, vi } from "vitest";

import {
  afterScene,
  beginScene,
  endScene,
  flushAfterScene,
  registerSceneHost,
  resolveScene,
  useSceneStore,
} from "./sceneStore";

const rework = {
  type: "rework" as const,
  partId: "screws" as const,
  tier: "Standard" as const,
  crafts: 1,
};

afterEach(() => {
  flushAfterScene();
  useSceneStore.setState({ scene: null, hosts: 0, nextId: 1 });
});

describe("sceneStore", () => {
  it("declines to open a scene nobody would see, so the hook keeps its toast", () => {
    expect(beginScene(rework)).toBeNull();
    expect(useSceneStore.getState().scene).toBeNull();
  });

  it("opens once a host is mounted, and stops when it unmounts", () => {
    const unregister = registerSceneHost();
    expect(beginScene(rework)).not.toBeNull();

    unregister();
    expect(beginScene(rework)).toBeNull();
  });

  it("hands the answer only to the scene that asked for it", () => {
    registerSceneHost();
    const first = beginScene(rework);
    const second = beginScene(rework);

    // A late answer for a scene already replaced must not land on the new one.
    resolveScene(first, { fameSpent: 1 } as never);
    expect(useSceneStore.getState().scene?.result).toBeUndefined();

    resolveScene(second, { fameSpent: 2 } as never);
    expect(useSceneStore.getState().scene?.result).toEqual({ fameSpent: 2 });
  });

  it("ends only its own scene", () => {
    registerSceneHost();
    const first = beginScene(rework);
    const second = beginScene(rework);

    endScene(first);
    expect(useSceneStore.getState().scene?.id).toBe(second);

    endScene(second);
    expect(useSceneStore.getState().scene).toBeNull();
  });

  it("ignores a missing id, as a hook passes when it fell back to a toast", () => {
    registerSceneHost();
    beginScene(rework);

    resolveScene(null, { fameSpent: 1 } as never);
    endScene(undefined);
    expect(useSceneStore.getState().scene).not.toBeNull();
  });
});

describe("afterScene", () => {
  it("runs right away when there is no scene to wait for", () => {
    const work = vi.fn();
    afterScene(null, work);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("holds the work until the scene has gone, then runs it once", () => {
    registerSceneHost();
    const id = beginScene(rework);
    const work = vi.fn();

    afterScene(id, work);
    expect(work).not.toHaveBeenCalled();

    // The host flushes once the scene's exit has played.
    endScene(id);
    flushAfterScene();
    flushAfterScene();
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("does not strand the work when the page goes mid-scene", () => {
    const unregister = registerSceneHost();
    const id = beginScene(rework);
    const work = vi.fn();
    afterScene(id, work);

    unregister();
    expect(work).toHaveBeenCalledTimes(1);
  });
});
