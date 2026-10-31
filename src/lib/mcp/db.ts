import type { Firestore } from "firebase-admin/firestore";
import { firestore as untyped } from "utils/firebase/api/firebase.config";

/** The Admin SDK Firestore, typed — the shared config exports it as `any`. */
export const firestore = untyped as Firestore;
