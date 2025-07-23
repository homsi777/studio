// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

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
const db = getFirestore(app);

// Enable Firestore offline persistence
// This is crucial for the app to work during internet outages.
// It caches data locally and syncs when the connection is back.
try {
  enableIndexedDbPersistence(db, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  }).then(() => {
    console.log("Firestore offline persistence enabled.");
  }).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Firestore offline persistence could not be enabled: Multiple tabs open?");
    } else if (err.code == 'unimplemented') {
      console.warn("Firestore offline persistence is not supported in this browser.");
    }
  });
} catch (error) {
    console.error("Error enabling Firestore offline persistence: ", error);
}


export { db };
