import { PRESSABLE } from "assets/components/ui/button";

/**
 * The green key: a bench job that can run right now. Same green as the hammer mark
 * (`ReadyMark`) — the key is what the mark promised. A job that cannot run yet
 * falls back to the ordinary white/disabled key instead of going green.
 */
export const GO_KEY = `${PRESSABLE} border-b-black/30 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-50`;
