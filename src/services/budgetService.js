import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export const saveBudget = async (uid, budgetData) => {
  try {

    await setDoc(
      doc(db, "users", uid),

      {
        budget: budgetData,

        updatedAt: serverTimestamp(),
      },

      { merge: true }
    );

    return { success: true };

  } catch (error) {

    console.error(error);

    return {
      success: false,
      message: error.message,
    };

  }
};

export const getBudget = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().budget;
    }

    return null;
  } catch (error) {
    console.error("Error getting budget:", error);
    return null;
  }
};