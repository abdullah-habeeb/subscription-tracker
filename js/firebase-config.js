// js/firebase-config.js - FINAL CORRECTED VERSION

// Import the tools we need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7nnj_hdAzZ7q891bKAzi2a3Bq0uuTlTc",
  authDomain: "subscription-hub-19cf9.firebaseapp.com",
  projectId: "subscription-hub-19cf9",
  storageBucket: "subscription-hub-19cf9.firebasestorage.app",
  messagingSenderId: "154636560412",
  appId: "1:154636560412:web:72c29b9d5eb96eaae957d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORT the services so other files can import them. This is the crucial part.
export const auth = getAuth(app);
export const db = getFirestore(app);