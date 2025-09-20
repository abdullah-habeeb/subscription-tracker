// js/auth.js

// Import only the functions we need to perform actions
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Import our single, prepared auth tool from the config file
import { auth } from './firebase-config.js';

// --- Get references to our HTML elements ---
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

// --- THE GATEKEEPER ---
// This checks if a user is already logged in and sends them to the main app
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'index.html';
  }
});


// --- EVENT LISTENERS with proper error handling ---

// Listen for the signup form submission
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the redirect
  } catch (error) {
    console.error("Signup Error:", error.message);
    errorMessage.textContent = error.message;
  }
});

// Listen for the login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the redirect
  } catch (error) {
    console.error("Login Error:", error.message);
    errorMessage.textContent = error.message;
  }
});