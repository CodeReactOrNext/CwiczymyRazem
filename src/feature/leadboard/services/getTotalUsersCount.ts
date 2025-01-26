import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getTotalUsersCount = async () => {
  const coll = collection(db, "users");
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
};