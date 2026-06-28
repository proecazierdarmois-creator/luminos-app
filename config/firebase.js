// config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBUSrpRrnT3meU26mD6n2XYsMhOrULtt4I",
  authDomain: "luminos-app.firebaseapp.com",
  databaseURL: "https://luminos-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "luminos-app",
  storageBucket: "luminos-app.firebasestorage.app",
  messagingSenderId: "1015372311133",
  appId: "1:1015372311133:web:3d0174730d30bd04e7bbb4"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
export const auth = getAuth(app);