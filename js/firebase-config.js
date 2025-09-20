// js/firebase-config.js - FINAL CORRECTED VERSION

// Import the tools we need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNtlB_47vVwq0FByfmuacD6bZRU59BVJk", // This is your key
  authDomain: "expense-tracker-app-4f8f5.firebaseapp.com",
  projectId: "expense-tracker-app-4f8f5",
  storageBucket: "expense-tracker-app-4f8f5.appspot.com",
  messagingSenderId: "217075337508",
  appId: "1:217075337508:web:54ad6ccdeacb8165250bb1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORT the services so other files can import them. This is the crucial part.
export const auth = getAuth(app);
export const db = getFirestore(app);