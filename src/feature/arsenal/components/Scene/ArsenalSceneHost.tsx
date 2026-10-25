"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";

import { BuildScene } from "./BuildScene";
import { DeliveryScene } from "./DeliveryScene";
import { FitModScene } from "./FitModScene";
import { RestoreScene } from "./RestoreScene";
import { ReworkScene } from "./ReworkScene";
import type { ActiveScene } from "./sceneStore";
import {
  endScene,
  flushAfterScene,
  registerSceneHost,
  useSceneStore,
} from "./sceneStore";
import { TeardownScene } from "./TeardownScene";

const SceneSwitch = ({ scene }: { scene: ActiveScene }) => {
  const close = () => endScene(scene.id);

  switch (scene.type) {
    case "teardown":
      return <TeardownScene scene={scene} onClose={close} />;
    case "rework":
      return <ReworkScene scene={scene} onClose={close} />;
    case "fit":
      return <FitModScene scene={scene} onClose={close} />;
    case "delivery":
      return <DeliveryScene scene={scene} onClose={close} />;
    case "build":
      return <BuildScene scene={scene} onClose={close} />;
    case "restore":
      return <RestoreScene scene={scene} onClose={close} />;
    default:
      return null;
  }
};

/**
 * Plays whichever scene the arsenal's hooks have opened.
 *
 * Mounted once, inside the arsenal page, so a scene inherits the page's context
 * (the player's level, which the cards read) while drawing over everything.
 * Its presence is also the hooks' signal: with no host mounted they keep their
 * toasts, and an action taken anywhere else never goes silent.
 */
export const ArsenalSceneHost = () => {
  const scene = useSceneStore((s) => s.scene);

  useEffect(() => registerSceneHost(), []);

  // The refetch and the balance a scene held back run only once it has faded
  // out, so not even its exit shares frames with the tab re-rendering.
  return (
    <AnimatePresence onExitComplete={flushAfterScene}>
      {scene && <SceneSwitch key={scene.id} scene={scene} />}
    </AnimatePresence>
  );
};
