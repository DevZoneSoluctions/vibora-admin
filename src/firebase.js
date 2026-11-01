// Firebase initialization — Vibora project
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBsLX8L1apNIpWTcYzNWPCMXkK-sBaGRGM",
  authDomain: "vibora-d505c.firebaseapp.com",
  projectId: "vibora-d505c",
  storageBucket: "vibora-d505c.firebasestorage.app",
  messagingSenderId: "986844844645",
  appId: "1:986844844645:web:031eb7f91fbcb427aaec8c",
  measurementId: "G-7PVD1GHP1E"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;