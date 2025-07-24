// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, memoryLocalCache } from "firebase/firestore";

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
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: 'PRIMARY'
    })
  });
  console.log("Firestore offline persistence enabled using persistentLocalCache.");
} catch (error) {
  console.error("Persistent offline cache initialization failed, falling back to in-memory cache:", error);
  // Fallback to in-memory cache if persistent fails (e.g., unsupported environment)
  db = initializeFirestore(app, {
    localCache: memoryLocalCache({})
  });
  console.log("Firestore initialized with in-memory cache as a fallback.");
}

export { db };
