import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

const COLLECTION = "transactions";

// Add a transaction
export const addTransaction = async (uid, transaction) => {
  await addDoc(collection(db, COLLECTION), {
    uid,
    ...transaction,
    createdAt: serverTimestamp(),
  });
};

// Get all transactions for a user
export const getTransactions = async (uid) => {
  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};