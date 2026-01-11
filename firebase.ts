import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDFtRrOXpmmLiI0ZDTOXFI9ZOvLZOZ_dq0",
  authDomain: "calculators-b3a5e.firebaseapp.com",
  projectId: "calculators-b3a5e",
  storageBucket: "calculators-b3a5e.firebasestorage.app",
  messagingSenderId: "37970711186",
  appId: "1:37970711186:web:953c9ce62d9b53fe738c4b",
  measurementId: "G-J2NMNS46HD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);