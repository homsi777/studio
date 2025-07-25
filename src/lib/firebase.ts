// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "al-maida-manager",
  "appId": "1:78562067993:web:9f182ea593d2804d084c88",
  "storageBucket": "al-maida-manager.appspot.com",
  "apiKey": "AIzaSyCX8uHmCBOJ6eQuNKUVnkjwvNUSzcUb2Gw",
  "authDomain": "al-maida-manager.firebaseapp.com",
  "messagingSenderId": "78562067993",
  "databaseURL": `https://al-maida-manager.firebaseio.com`
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore. This should be a single instance.
const db = getFirestore(app);

// This is the CRITICAL FIX:
// `enableIndexedDbPersistence` is a CLIENT-SIDE (BROWSER) function.
// It should not run on the server. We check for `window` to ensure it only runs in the browser.
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence is not available in this browser.');
      }
    });
}

export { db };
