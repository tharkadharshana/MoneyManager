import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from '../firebase';

export const AuthService = {
  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  },

  loginWithEmail: async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
  },

  signupWithEmail: async (email: string, pass: string) => {
    return await createUserWithEmailAndPassword(auth, email, pass);
  },

  logout: async () => {
    return await signOut(auth);
  },

  getMockUser: (): User | any => ({
    uid: 'guest_demo',
    displayName: 'Guest User',
    email: null,
    photoURL: null
  })
};