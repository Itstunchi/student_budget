import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyApR9WyIEN2kLFIKpo04RT5kEuYyzLo-Cs",
    authDomain: "student-budget-6cee6.firebaseapp.com",
    projectId: "student-budget-6cee6",
    storageBucket: "student-budget-6cee6.firebasestorage.app",
    messagingSenderId: "288790996246",
    appId: "1:288790996246:web:bcff24dfad8d0e85acdc37",
    measurementId: "G-829WV80053"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);