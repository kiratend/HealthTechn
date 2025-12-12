// auth-protect.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
  authDomain: "healthtechn-c15da.firebaseapp.com",
  projectId: "healthtechn-c15da",
  storageBucket: "healthtechn-c15da.appspot.com",
  messagingSenderId: "508561693923",
  appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Protect page - redirect if not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// Update logout function to use Firebase Auth
window.logoutUser = function(event) {
  if (event) event.preventDefault();
  if (!confirm("Are you sure you want to log out?")) return;

  signOut(auth).then(() => {
    showToast("You have been logged out successfully.", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }).catch((error) => {
    console.error("Logout error:", error);
    showToast("Logout failed. Please try again.", "danger");
  });
};