import { useBossCues } from "../hooks/useBossCues";

/** The fight's sound effects — nothing on screen; mounted once with the overlay. */
export const BossSounds = () => {
  useBossCues();
  return null;
};
