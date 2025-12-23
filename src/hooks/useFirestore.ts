import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import * as firestore from "firebase/firestore";
import {
  trackedGetDoc,
  trackedGetDocs,
  trackedSetDoc,
  trackedUpdateDoc,
  trackedAddDoc,
  trackedDeleteDoc
} from "utils/firebase/client/firestoreTracking";

/**
 * Hook to fetch a single Firestore document with TanStack Query.
 */
export const useFirestoreDoc = <T = firestore.DocumentData>(
  docRef: firestore.DocumentReference<T>,
  options?: Omit<UseQueryOptions<firestore.DocumentSnapshot<T>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['firestore', 'doc', docRef.path],
    queryFn: () => trackedGetDoc(docRef),
    ...options,
  });
};

/**
 * Hook to fetch a Firestore collection/query with TanStack Query.
 * Accepts a query object and automatically handles caching/deduplication.
 */
export const useFirestoreQuery = <T = firestore.DocumentData>(
  q: firestore.Query<T>,
  options?: Omit<UseQueryOptions<firestore.QuerySnapshot<T>>, 'queryKey' | 'queryFn'>
) => {
  // We use a simplified version of the query path as part of the key.
  // The actual tracking utility already handles internal deduplication.
  return useQuery({
    queryKey: ['firestore', 'query', q.toString()],
    queryFn: () => trackedGetDocs(q),
    ...options,
  });
};

/**
 * Hook for Firestore write operations (set, update, add, delete).
 */
export const useFirestoreMutation = () => {
  const setDocMutation = useMutation({
    mutationFn: ({ docRef, data, options }: { docRef: firestore.DocumentReference, data: any, options?: firestore.SetOptions }) =>
      trackedSetDoc(docRef, data, options),
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ docRef, data }: { docRef: firestore.DocumentReference, data: any }) =>
      trackedUpdateDoc(docRef, data),
  });

  const addDocMutation = useMutation({
    mutationFn: ({ collectionRef, data }: { collectionRef: firestore.CollectionReference, data: any }) =>
      trackedAddDoc(collectionRef, data),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docRef: firestore.DocumentReference) =>
      trackedDeleteDoc(docRef),
  });

  return {
    setDoc: setDocMutation,
    updateDoc: updateDocMutation,
    addDoc: addDocMutation,
    deleteDoc: deleteDocMutation,
  };
};
