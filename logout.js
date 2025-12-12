import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { firebaseConfig } from "firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check login state
const userData = sessionStorage.getItem("user");
if (!userData) {
  window.location.href = "login.html";
} else {
  const user = JSON.parse(userData);
  document.getElementById("userEmail").innerText = `Logged in as: ${user.email}`;
}

// Handle logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      sessionStorage.clear();
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});
