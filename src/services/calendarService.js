import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export const getEvents = async (uid) => {
  const q = query(
    collection(db, "users", uid, "calendarEvents"),
    orderBy("date")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addEvent = async (uid, event) => {
  await addDoc(
    collection(db, "users", uid, "calendarEvents"),
    {
      ...event,
      createdAt: serverTimestamp(),
    }
  );
};

export const updateEvent = async (
  uid,
  eventId,
  event
) => {

  await updateDoc(
    doc(db, "users", uid, "calendarEvents", eventId),
    event
  );

};

export const deleteEvent = async (
  uid,
  eventId
) => {

  await deleteDoc(
    doc(db, "users", uid, "calendarEvents", eventId)
  );

};