// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, memoryLocalCache, persistentLocalCache } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "al-maida-manager",
  "appId": "1:78562067993:web:9f182ea593d2804d084c88",
  "storageBucket": "al-maida-manager.firebasestorage.app",
  "apiKey": "AIzaSyCX8uHmCBOJ6eQuNKUVnkjwvNUSzcUb2Gw",
  "authDomain": "al-maida-manager.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "78562067993"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore. This should be a single instance.
const db = getFirestore(app);

// This is the CRITICAL FIX:
// `enableIndexedDbPersistence` is a CLIENT-SIDE (BROWSER) function.
// It should not run on the server. We check for `window` to ensure it only runs in the browser.
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db)
      .then(() => console.log("Firestore offline persistence enabled."))
      .catch((error: any) => {
        if (error.code == 'failed-precondition') {
          console.warn('Firestore offline persistence failed: multiple tabs open.');
        } else if (error.code == 'unimplemented') {
          console.error('Firestore offline persistence is not supported in this browser.');
        } else {
          console.error("Firestore offline persistence initialization failed:", error);
        }
      });
  } catch(e) {
    console.error("Error enabling persistence", e);
  }
}

export { db };
