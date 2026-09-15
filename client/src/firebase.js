import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDGYYx3tpN3_DxL48W-QWwn5RUCO_3Mc0M",
  authDomain: "easyticket-417ad.firebaseapp.com",
  projectId: "easyticket-417ad",
  storageBucket: "easyticket-417ad.firebasestorage.app",
  messagingSenderId: "636411194846",
  appId: "1:636411194846:web:27533f59589a5c300c014f",
  measurementId: "G-PS8G4FXQP5"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
