// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCWFnR9M_MCTmh0q5pmrrPSpmw36hoAOy0",
  authDomain: "applez-dch9v.firebaseapp.com",
  projectId: "applez-dch9v",
  storageBucket: "applez-dch9v.firebasestorage.app",
  messagingSenderId: "759830378563",
  appId: "1:759830378563:web:1006366156f371f580bcf6",
  measurementId: "G-ZCK3PNPT3M"
};

// Initialize Firebase
// To avoid re-initializing the app on hot-reloads, we check if it's already been initialized.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
