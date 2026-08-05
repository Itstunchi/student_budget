import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export const addBill = async (uid, bill) => {
  const ref = collection(db, "users", uid, "bills");

  await addDoc(ref, {
    ...bill,
    createdAt: serverTimestamp(),
  });
};

export const getBills = async (uid) => {
  const ref = collection(db, "users", uid, "bills");

  const q = query(ref, orderBy("dueDate"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deleteBill = async (uid, billId) => {
  const ref = doc(db, "users", uid, "bills", billId);

  await deleteDoc(ref);
};

export const markBillAsPaid = async (uid, billId) => {
  const ref = doc(db, "users", uid, "bills", billId);

  await updateDoc(ref, {
    status: "Paid",
    paidAt: serverTimestamp(),
  });
};

export const updateBill = async (uid, billId, updatedBill) => {
  const ref = doc(db, "users", uid, "bills", billId);

  await updateDoc(ref, updatedBill);
};