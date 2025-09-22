// js/main.js - AGGRESSIVE AUTH DIAGNOSTICS

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js'; // Ensure this path is correct

console.log("main.js: Script started."); // DIAGNOSTIC
let currentUser = null; // Declare currentUser at the top level
let costChart;
let allSubscriptions = []; // <-- ADD THIS MISSING LINE

// --- Get HTML Elements ---
const appHeader = document.getElementById('app-header');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const addSubForm = document.getElementById('add-sub-form');
const totalMonthlyEl = document.getElementById('total-monthly');
const totalSubsEl = document.getElementById('total-subs');
const nextDueEl = document.getElementById('next-due');
const subscriptionListEl = document.getElementById('subscription-list');
const costChartCanvas = document.getElementById('cost-chart');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalBtn = document.getElementById('close-modal-btn');


// --- Auth State Listener (The Gatekeeper) ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("main.js: Auth state changed. User IS logged in:", user.email, "UID:", user.uid); // DIAGNOSTIC
    currentUser = user; // Set the global currentUser
    appHeader.classList.remove('hidden');
    userEmailSpan.textContent = user.email;
    listenForSubscriptions(user); // Start listening for this user's data
  } else {
    console.log("main.js: Auth state changed. User IS NOT logged in. Redirecting..."); // DIAGNOSTIC
    currentUser = null;
    window.location.href = 'login.html';
  }
});

// --- Firestore Data Listener ---
function listenForSubscriptions(user) {
    console.log("main.js: Setting up Firestore listener for UID:", user.uid); // DIAGNOSTIC
    const subsCollection = collection(db, 'subscriptions');
    const q = query(subsCollection, where("uid", "==", user.uid), orderBy("nextDueDate"));

    onSnapshot(q, (snapshot) => {
        console.log("main.js: Firestore snapshot received. Documents:", snapshot.docs.length); // DIAGNOSTIC
        let subscriptions = [];
        snapshot.docs.forEach((doc) => {
            subscriptions.push({ ...doc.data(), id: doc.id });
        });
        allSubscriptions = subscriptions;
        updateUI(allSubscriptions);
    }, (error) => {
        console.error("main.js: Error listening to Firestore:", error); // CRITICAL ERROR DIAGNOSTIC
        alert("Error loading subscriptions. Check console.");
    });
}

// --- Event Handler for Adding Subscription ---
async function handleAddSubscription(e) {
  console.log("main.js: Add Subscription button clicked."); // DIAGNOSTIC
  e.preventDefault();
  
  if (!currentUser) {
      console.error("main.js: ERROR: No currentUser object available. Cannot add subscription."); // CRITICAL ERROR DIAGNOSTIC
      alert("Error: Not logged in. Please log out and back in.");
      return;
  }
  console.log("main.js: Current user confirmed for add:", currentUser.email, currentUser.uid); // DIAGNOSTIC

  const subName = document.getElementById('sub-name').value;
  const subAmount = document.getElementById('sub-amount').value;
  const subCategory = document.getElementById('sub-category').value;
  const subCycle = document.getElementById('sub-cycle').value;
  const subDate = document.getElementById('sub-date').value;

  if (!subName || !subAmount || !subCategory || !subDate) {
      alert('Please fill out all fields.');
      return;
  }

  const newSubscription = {
      name: subName, amount: +subAmount, category: subCategory,
      billingCycle: subCycle, startDate: subDate,
      nextDueDate: calculateNextDueDate(subDate, subCycle),
      uid: currentUser.uid // This is CRUCIAL for security rules
  };
  console.log("main.js: Attempting to add new subscription:", newSubscription); // DIAGNOSTIC

  try {
      await addDoc(collection(db, 'subscriptions'), newSubscription);
      console.log("main.js: Subscription ADDED successfully!"); // DIAGNOSTIC
      addSubForm.reset();
  } catch (error) {
      console.error("main.js: ERROR adding subscription to Firestore:", error); // CRITICAL ERROR DIAGNOSTIC
      alert("Failed to add subscription. Check the console for details.");
  }
}

// --- Attach Event Listeners (Once, at script load) ---
if (addSubForm) { // Check if element exists before attaching listener
    addSubForm.addEventListener('submit', handleAddSubscription);
    console.log("main.js: Add Subscription form listener attached."); // DIAGNOSTIC
} else {
    console.error("main.js: ERROR: Add Subscription form element not found!"); // CRITICAL ERROR DIAGNOSTIC
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => signOut(auth));
    console.log("main.js: Logout button listener attached."); // DIAGNOSTIC
} else {
    console.error("main.js: ERROR: Logout button element not found!"); // CRITICAL ERROR DIAGNOSTIC
}

// ... (attach other listeners similarly if needed for other forms, like editForm) ...
if (editForm) {
    editForm.addEventListener('submit', handleEditSubmit);
    console.log("main.js: Edit form listener attached."); // DIAGNOSTIC
} else {
    console.error("main.js: ERROR: Edit form element not found!"); // CRITICAL ERROR DIAGNOSTIC
}
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeEditModal);
    console.log("main.js: Close modal button listener attached."); // DIAGNOSTIC
} else {
    console.error("main.js: ERROR: Close modal button element not found!"); // CRITICAL ERROR DIAGNOSTIC
}


// --- All other supporting functions ---

function calculateNextDueDate(startDate, cycle) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextDate = new Date(startDate);
    while (nextDate < today) {
        if (cycle === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (cycle === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    return nextDate.toISOString().split('T')[0];
}

function updateUI(subscriptions = []) {
    updateSubscriptionList(subscriptions);
    updateSummary(subscriptions);
    updateChart(subscriptions);
}

function updateSubscriptionList(subscriptions) {
    subscriptionListEl.innerHTML = '';
    subscriptions.forEach(sub => {
        const item = document.createElement('li');
        const formattedDate = new Date(sub.nextDueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        item.innerHTML = `<div class="sub-details"><strong>${sub.name}</strong><small>${sub.category}</small></div><div class="sub-billing"><strong>₹${Math.abs(sub.amount).toFixed(2)}</strong><small>Next: ${formattedDate}</small></div>`;
        const btnContainer = document.createElement('div');
        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-btn');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openEditModal(sub));
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = 'x';
        deleteBtn.addEventListener('click', () => removeSubscription(sub.id));
        btnContainer.appendChild(editBtn);
        btnContainer.appendChild(deleteBtn);
        item.appendChild(btnContainer);
        subscriptionListEl.appendChild(item);
    });
}

function updateSummary(subscriptions) {
    const monthlyTotal = subscriptions.reduce((total, sub) => sub.billingCycle === 'monthly' ? total + sub.amount : total + (sub.amount / 12), 0);
    totalMonthlyEl.textContent = `₹${monthlyTotal.toFixed(2)}`;
    totalSubsEl.textContent = subscriptions.length;
    if (subscriptions.length > 0) {
        const nextDueDate = new Date(subscriptions[0].nextDueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        nextDueEl.textContent = `${subscriptions[0].name} (${nextDueDate})`;
    } else {
        nextDueEl.textContent = '--';
    }
}

function updateChart(subscriptions) {
    const ctx = costChartCanvas.getContext('2d');
    const categoryCosts = subscriptions.reduce((acc, sub) => {
        const cost = sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12;
        acc[sub.category] = (acc[sub.category] || 0) + cost;
        return acc;
    }, {});
    const labels = Object.keys(categoryCosts);
    const data = Object.values(categoryCosts);
    if (costChart) { costChart.destroy(); }
    costChart = new Chart(ctx, {
        type: 'pie', data: { labels, datasets: [{ label: 'Cost per month', data, backgroundColor: generateRandomColors(labels.length), borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function generateRandomColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (360 / numColors) * i;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

function removeSubscription(id) {
    deleteDoc(doc(db, 'subscriptions', id));
}

function openEditModal(subscription) {
    editModal.classList.remove('hidden');
    document.getElementById('edit-id').value = subscription.id;
    document.getElementById('edit-name').value = subscription.name;
    document.getElementById('edit-amount').value = subscription.amount;
    document.getElementById('edit-category').value = subscription.category;
    document.getElementById('edit-date').value = subscription.startDate;
}

function closeEditModal() {
    editModal.classList.add('hidden');
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const subId = document.getElementById('edit-id').value;
    if (!subId) return;
    const originalSub = allSubscriptions.find(sub => sub.id === subId);
    if (!originalSub) return;
    const startDate = document.getElementById('edit-date').value;
    const updatedSubData = {
        name: document.getElementById('edit-name').value,
        amount: +document.getElementById('edit-amount').value,
        category: document.getElementById('edit-category').value,
        startDate,
        nextDueDate: calculateNextDueDate(startDate, originalSub.billingCycle)
    };
    try {
        await updateDoc(doc(db, 'subscriptions', subId), updatedSubData);
        closeEditModal();
    } catch (error) {
        console.error("main.js: ERROR updating document:", error); // CRITICAL ERROR DIAGNOSTIC
        alert("Failed to update subscription. Check console for details.");
    }
}