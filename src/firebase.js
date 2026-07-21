import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Aapka existing Firebase project config (job-portal-apply)
const firebaseConfig = {
  apiKey: "AIzaSyB-yNYoBgVCE0wtjLeuKghEDmGC9KZCacs",
  authDomain: "job-portal-apply.firebaseapp.com",
  projectId: "job-portal-apply",
  storageBucket: "job-portal-apply.firebasestorage.app",
  messagingSenderId: "272026794987",
  appId: "1:272026794987:web:f5804ab695bb96a68fb7ae",
  measurementId: "G-7DC0Q2G64E",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
