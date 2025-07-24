// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
// This is crucial for the app to work during internet outages.
const db = getFirestore(app);
try {
  enableIndexedDbPersistence(db)
  console.log("Firestore offline persistence enabled.");
} catch (error: any) {
    if (error.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firestore offline persistence failed: multiple tabs open.');
    } else if (error.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.error('Firestore offline persistence is not supported in this browser.');
    } else {
      console.error("Firestore offline persistence initialization failed:", error);
    }
}


export { db };
