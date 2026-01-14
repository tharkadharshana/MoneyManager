import firebase from 'firebase/compat/app';
import { auth } from '../firebase';

export const AuthService = {
  loginWithGoogle: async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    return await auth.signInWithPopup(provider);
  },

  loginWithEmail: async (email: string, pass: string) => {
    return await auth.signInWithEmailAndPassword(email, pass);
  },

  signupWithEmail: async (email: string, pass: string) => {
    return await auth.createUserWithEmailAndPassword(email, pass);
  },

  logout: async () => {
    return await auth.signOut();
  },

  getMockUser: (): any => ({
    uid: 'guest_demo',
    displayName: 'Guest User',
    email: null,
    photoURL: null
  })
};