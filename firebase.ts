import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDFtRrOXpmmLiI0ZDTOXFI9ZOvLZOZ_dq0",
  authDomain: "calculators-b3a5e.firebaseapp.com",
  projectId: "calculators-b3a5e",
  storageBucket: "calculators-b3a5e.firebasestorage.app",
  messagingSenderId: "37970711186",
  appId: "1:37970711186:web:953c9ce62d9b53fe738c4b",
  measurementId: "G-J2NMNS46HD"
};

// Initialize Firebase (v8 check)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();