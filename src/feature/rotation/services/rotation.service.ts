import { doc, getDoc, setDoc } from "firebase/firestore";
import type { SkillsType } from "types/skillsTypes";
import { db } from "utils/firebase/client/firebase.utils";

import type {
  LastPracticedMap,
  RotationDoc,
  RotationItem,
} from "../types/rotation.types";
import { ROTATION_ITEM_TYPES } from "../types/rotation.types";
import { emptyLastPracticed } from "../utils/rotation.utils";

/** Owner-only like the rest of `settings`; `lastPracticed` is stamped by the report route. */
const rotationRef = (uid: string) =>
  doc(db, "users", uid, "settings", "rotation");

const CATEGORIES: SkillsType[] = [
  "technique",
  "theory",
  "hearing",
  "creativity",
];
const isCategory = (value: unknown): value is SkillsType =>
  CATEGORIES.some((category) => category === value);

const parseItem = (raw: unknown): RotationItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const type = ROTATION_ITEM_TYPES.find((candidate) => candidate === data.type);
  if (!type || typeof data.id !== "string" || !data.id) return null;

  return {
    type,
    id: data.id,
    addedAt: typeof data.addedAt === "number" ? data.addedAt : 0,
    ...(typeof data.title === "string" && { title: data.title }),
    ...(typeof data.artist === "string" && { artist: data.artist }),
    ...(typeof data.coverUrl === "string" && { coverUrl: data.coverUrl }),
    ...(typeof data.note === "string" && { note: data.note }),
    ...(typeof data.link === "string" && { link: data.link }),
    ...(isCategory(data.category) && { category: data.category }),
    ...(data.timer === true && { timer: true }),
  };
};

const parseLastPracticed = (raw: unknown): LastPracticedMap => {
  const parsed = emptyLastPracticed();
  if (!raw || typeof raw !== "object") return parsed;

  ROTATION_ITEM_TYPES.forEach((type) => {
    const stamps = (raw as Record<string, unknown>)[type];
    if (!stamps || typeof stamps !== "object") return;
    Object.entries(stamps as Record<string, unknown>).forEach(([id, at]) => {
      if (typeof at === "number") parsed[type][id] = at;
    });
  });
  return parsed;
};

export const getRotation = async (uid: string): Promise<RotationDoc> => {
  const snap = await getDoc(rotationRef(uid));
  const data = snap.exists() ? snap.data() : {};
  const items = Array.isArray(data.items)
    ? data.items
        .map(parseItem)
        .filter((item): item is RotationItem => item !== null)
    : [];

  return { items, lastPracticed: parseLastPracticed(data.lastPracticed) };
};

/** Firestore rejects `undefined`, so optional song fields are only written when set. */
const toStored = (item: RotationItem) => ({
  type: item.type,
  id: item.id,
  addedAt: item.addedAt,
  ...(item.title && { title: item.title }),
  ...(item.artist && { artist: item.artist }),
  ...(item.coverUrl && { coverUrl: item.coverUrl }),
  ...(item.note && { note: item.note }),
  ...(item.link && { link: item.link }),
  ...(item.category && { category: item.category }),
  ...(item.timer && { timer: true }),
});

/** Replaces the list; `lastPracticed` beside it is left alone by the merge. */
export const saveRotationItems = (uid: string, items: RotationItem[]) =>
  setDoc(rotationRef(uid), { items: items.map(toStored) }, { merge: true });

/**
 * Ticks off a custom item played without the timer. Written by the player:
 * nothing is paid out on a stamp, it only re-sorts their own list.
 */
export const stampCustomDone = (uid: string, itemId: string, at: number) =>
  setDoc(
    rotationRef(uid),
    { lastPracticed: { custom: { [itemId]: at } } },
    { merge: true },
  );
