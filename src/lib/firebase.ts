// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

export { db };
