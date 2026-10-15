import { useRef, useState } from "react";

import { MergeAnimation } from "../components/CaseOpeningModal/MergeAnimation";
import type {
  EffectDefinition,
  GuitarDefinition,
  MergeOffer,
  WorkshopKind,
} from "../types/arsenal.types";
import { useMergeDuplicates } from "./useMergeDuplicates";

export interface MergeSceneRequest {
  kind: WorkshopKind;
  /** The copy being folded away. */
  itemId: string;
  /** The model, for the artwork and the rarity colour. */
  def: GuitarDefinition | EffectDefinition;
  /** What the merge will do, as the screen computed it. */
  offer: MergeOffer;
}

interface UseMergeSceneOptions {
  /** Runs once the merge has been saved *and* the scene has played out. */
  onFinished?: () => void;
}

/**
 * Merges one duplicate and plays the scene while it does.
 *
 * The request and the scene start together and finish independently: a fast
 * connection waits for the scene, a slow one waits for the server, and
 * `onFinished` fires only when both are done. A failed request ends the scene on
 * the spot — the hook has already told the player what went wrong, and a "Merged"
 * caption over a merge that did not happen would be a lie.
 *
 * Returns the scene as an element to render, rather than owning a portal of its
 * own, so the caller decides where in the tree it lives.
 */
export const useMergeScene = ({ onFinished }: UseMergeSceneOptions = {}) => {
  // Silent: the scene says what was gained, and a toast on top says it twice.
  const { mutate } = useMergeDuplicates({ silent: true });
  const [scene, setScene] = useState<Omit<MergeSceneRequest, "itemId"> | null>(
    null,
  );
  const saved = useRef(false);
  const played = useRef(false);

  const settle = () => {
    if (!saved.current || !played.current) return;
    saved.current = false;
    played.current = false;
    setScene(null);
    onFinished?.();
  };

  const start = ({ kind, itemId, def, offer }: MergeSceneRequest) => {
    saved.current = false;
    played.current = false;
    setScene({ kind, def, offer });
    mutate(
      { kind, itemIds: [itemId] },
      {
        onSuccess: () => {
          saved.current = true;
          settle();
        },
        onError: () => setScene(null),
      },
    );
  };

  const element = scene ? (
    <MergeAnimation
      kind={scene.kind}
      def={scene.def}
      offer={scene.offer}
      onDone={() => {
        played.current = true;
        settle();
      }}
    />
  ) : null;

  return { start, element, isActive: scene !== null };
};
