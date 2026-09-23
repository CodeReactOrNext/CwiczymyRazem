/**
 * What the owner of a generated roadmap can ask the coach to redo, after the
 * roadmap exists. Every action here is a model call the app pays for, so every
 * one of them costs tokens — the wallet is what keeps "regenerate until it is
 * perfect" honest.
 */
export type RefineAction =
  | "rewriteStep"
  | "swapExercise"
  | "refreshLessons"
  | "findSong"
  | "addSteps";

/** Token prices. `addStep` is per step added; the rest are per call. */
export interface RefineCosts {
  rewriteStep: number;
  swapExercise: number;
  refreshLessons: number;
  findSong: number;
  addStep: number;
}

/**
 * How the map reaches the paid endpoint. The map does not know about wallets
 * or supporters; whoever renders it in refine mode hands over a `run` that
 * charges, calls and updates the wallet on screen, plus the prices to print.
 */
export interface RefineTransport {
  run: <T>(action: RefineAction, body: Record<string, unknown>) => Promise<T>;
  costs: RefineCosts;
  /** Tokens the owner has left, to grey out what they cannot afford. Null while unknown. */
  tokensLeft: number | null;
}
