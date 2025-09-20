// js/main.js

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

// --- Get HTML Elements ---
const appHeader = document.getElementById('app-header');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const totalMonthlyEl = document.getElementById('total-monthly');
const totalSubsEl = document.getElementById('total-subs');
const nextDueEl = document.getElementById('next-due');

const subscriptionListEl = document.getElementById('subscription-list');
const addSubForm = document.getElementById('add-sub-form');

// --- THE GATEKEEPER ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    // If user is logged in, show the app header
    appHeader.classList.remove('hidden');
    userEmailSpan.textContent = user.email;

    // Set up a real-time listener to get this user's subscriptions
    const subsCollection = collection(db, 'subscriptions');
    const q = query(subsCollection, where("uid", "==", user.uid), orderBy("nextDueDate"));

    onSnapshot(q, (snapshot) => {
        let subscriptions = [];
        snapshot.docs.forEach((doc) => {
            subscriptions.push({ ...doc.data(), id: doc.id });
        });
        
        // With the fresh data from Firestore, update the entire UI
        updateUI(subscriptions);
    });

  } else {
    // If user is not logged in, redirect to the login page
    window.location.href = 'login.html';
  }
});

// --- Add New Subscription ---
addSubForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return; // Safety check

    const subName = document.getElementById('sub-name').value;
    const subAmount = document.getElementById('sub-amount').value;
    const subCategory = document.getElementById('sub-category').value;
    const subCycle = document.getElementById('sub-cycle').value;
    const subDate = document.getElementById('sub-date').value;

    const nextDueDate = calculateNextDueDate(subDate, subCycle);

    const newSubscription = {
        name: subName,
        amount: +subAmount,
        category: subCategory,
        billingCycle: subCycle,
        startDate: subDate,
        nextDueDate: nextDueDate,
        uid: currentUser.uid // Tag the subscription with the user's ID
    };

    addDoc(collection(db, 'subscriptions'), newSubscription);
    addSubForm.reset(); // Resets the form fields
});


// --- Helper function to calculate the next due date ---
function calculateNextDueDate(startDate, cycle) {
    const today = new Date();
    let nextDate = new Date(startDate);
    
    // While the next billing date is in the past, add the billing cycle to it
    while (nextDate < today) {
        if (cycle === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (cycle === 'yearly') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
    }
    return nextDate.toISOString().split('T')[0]; // Return date in YYYY-MM-DD format
}

// --- Main function to update all visuals on the page ---
function updateUI(subscriptions = []) {
    updateSubscriptionList(subscriptions);
    updateSummary(subscriptions);
    // We will add the chart update here in the next step
}

// --- Update the list of subscriptions on the page ---
function updateSubscriptionList(subscriptions) {
    subscriptionListEl.innerHTML = ''; // Clear the list first

    subscriptions.forEach(sub => {
        const item = document.createElement('li');
        
        // Format the date for better readability
        const formattedDate = new Date(sub.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        item.innerHTML = `
            <div class="sub-details">
                <strong>${sub.name}</strong>
                <small>${sub.category}</small>
            </div>
            <div class="sub-billing">
                <strong>₹${sub.amount.toFixed(2)}</strong>
                <small>Next: ${formattedDate}</small>
            </div>
            <button class="delete-btn">x</button>
        `;

        // Add event listener to the delete button
        item.querySelector('.delete-btn').addEventListener('click', () => removeSubscription(sub.id));
        
        subscriptionListEl.appendChild(item);
    });
}

// --- Update the summary cards at the top ---
function updateSummary(subscriptions) {
    // Calculate total monthly cost
    const monthlyTotal = subscriptions.reduce((total, sub) => {
        return sub.billingCycle === 'monthly' ? total + sub.amount : total + (sub.amount / 12);
    }, 0);
    totalMonthlyEl.textContent = `₹${monthlyTotal.toFixed(2)}`;

    // Update total number of subscriptions
    totalSubsEl.textContent = subscriptions.length;

    // Find the next upcoming bill
    if (subscriptions.length > 0) {
        // The list is already sorted by date from our Firestore query
        const nextDueDate = new Date(subscriptions[0].nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        nextDueEl.textContent = `${subscriptions[0].name} (${nextDueDate})`;
    } else {
        nextDueEl.textContent = '--';
    }
}

// --- Function to delete a subscription from Firestore ---
function removeSubscription(id) {
    const subToDelete = doc(db, 'subscriptions', id);
    deleteDoc(subToDelete);
}

// --- Logout Logic ---
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});