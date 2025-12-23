import * as firestore from "firebase/firestore";

export const firestoreStats = {
  reads: 0,
  writes: 0,
  deletes: 0,
  cacheHits: 0
};

const docCache = new Map<string, { data: any, timestamp: number }>();
const inFlightDocs = new Map<string, Promise<any>>();
const queryCache = new Map<string, { data: any, timestamp: number }>();
const inFlightQueries = new Map<string, Promise<any>>();
const CACHE_TTL = 5000; // 5 seconds
const queryKeyMap = new WeakMap<any, string>();
let queryCounter = 0;

const getQueryPath = (q: any): string => {
  if (q.path) return q.path;

  let key = queryKeyMap.get(q);
  if (!key) {
    key = `query-${++queryCounter}`;
    queryKeyMap.set(q, key);
  }
  return key;
};

const logStats = (type: string, path: string, isCacheHit = false) => {
  if (isCacheHit) {
    firestoreStats.cacheHits++;
  } else {
    if (type === 'read') firestoreStats.reads++;
    if (type === 'write') firestoreStats.writes++;
    if (type === 'delete') firestoreStats.deletes++;
  }

  const tag = isCacheHit ? 'CACHE-HIT' : type.toUpperCase();
  const color = isCacheHit ? '#4caf50' : (type === 'read' ? '#e91e63' : '#ff9800');

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `%c[Firestore.${tag}] %cPath: ${path} | Global Stats: R:${firestoreStats.reads} W:${firestoreStats.writes} CH:${firestoreStats.cacheHits}`,
      `color: ${color}; font-weight: bold`,
      "color: inherit"
    );
  }
};

export const trackedGetDocs = async <T = firestore.DocumentData>(q: firestore.Query<T>): Promise<firestore.QuerySnapshot<T>> => {
  if (q instanceof Promise || (q && typeof (q as any).then === 'function')) {
    console.error("trackedGetDocs received a Promise instead of a Query object!", q);
    throw new Error("trackedGetDocs received a Promise instead of a Query object");
  }

  const path = getQueryPath(q);
  console.log(`[Firestore.DEBUG] trackedGetDocs path: ${path}`);

  // 1. Check Short-term Cache
  const cached = queryCache.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logStats('read', path, true);
    return cached.data as firestore.QuerySnapshot<T>;
  }

  // 2. Check In-flight requests (Deduplication)
  if (inFlightQueries.has(path)) {
    logStats('read', path, true);
    return inFlightQueries.get(path) as Promise<firestore.QuerySnapshot<T>>;
  }

  // 3. Perform actual fetch
  const fetchPromise = (async () => {
    try {
      const result = await firestore.getDocs(q);
      queryCache.set(path, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      inFlightQueries.delete(path);
    }
  })();

  inFlightQueries.set(path, fetchPromise);
  logStats('read', path);
  return fetchPromise as Promise<firestore.QuerySnapshot<T>>;
};

export const trackedGetDoc = async <T = firestore.DocumentData>(docRef: firestore.DocumentReference<T>): Promise<firestore.DocumentSnapshot<T>> => {
  if (docRef instanceof Promise || (docRef && typeof (docRef as any).then === 'function')) {
    console.error("trackedGetDoc received a Promise instead of a DocumentReference!", docRef);
    throw new Error("trackedGetDoc received a Promise instead of a DocumentReference");
  }

  const path = docRef.path;
  console.log(`[Firestore.DEBUG] trackedGetDoc path: ${path}`);

  // 1. Check Short-term Cache
  const cached = docCache.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logStats('read', path, true);
    return cached.data as firestore.DocumentSnapshot<T>;
  }

  // 2. Check In-flight requests (Deduplication)
  if (inFlightDocs.has(path)) {
    logStats('read', path, true);
    return inFlightDocs.get(path) as Promise<firestore.DocumentSnapshot<T>>;
  }

  // 3. Perform actual fetch
  const fetchPromise = (async () => {
    try {
      const result = await firestore.getDoc(docRef);
      docCache.set(path, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      inFlightDocs.delete(path);
    }
  })();

  inFlightDocs.set(path, fetchPromise);
  logStats('read', path);
  return fetchPromise as Promise<firestore.DocumentSnapshot<T>>;
};

export const trackedSetDoc = async (docRef: firestore.DocumentReference, data: any, options?: firestore.SetOptions) => {
  docCache.delete(docRef.path);
  queryCache.clear(); // Safe bet: clear queries when content changes
  logStats('write', docRef.path);
  return options ? firestore.setDoc(docRef, data, options) : firestore.setDoc(docRef, data);
};

export const trackedUpdateDoc = async (docRef: firestore.DocumentReference, data: any) => {
  docCache.delete(docRef.path);
  queryCache.clear();
  logStats('write', docRef.path);
  return firestore.updateDoc(docRef, data);
};

export const trackedAddDoc = async (colRef: firestore.CollectionReference, data: any) => {
  logStats('write', colRef.path);
  return firestore.addDoc(colRef, data);
};

export const trackedDeleteDoc = async (docRef: firestore.DocumentReference) => {
  docCache.delete(docRef.path);
  queryCache.clear();
  logStats('delete', docRef.path);
  return firestore.deleteDoc(docRef);
};
