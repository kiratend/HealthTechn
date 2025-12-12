import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
  authDomain: "healthtechn-c15da.firebaseapp.com",
  databaseURL: "https://healthtechn-c15da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthtechn-c15da",
  storageBucket: "healthtechn-c15da.appspot.com",
  messagingSenderId: "p8db1YfzbCciTzOOCfiKE07G10H3",
  appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Message display helper
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (!messageDiv) return;
  messageDiv.style.display = "block";
  messageDiv.textContent = message;
  messageDiv.style.opacity = 1;
  setTimeout(() => {
    messageDiv.style.opacity = 0;
    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 500);
  }, 4000);
}

// ==================== LOGIN ONLY ====================
const signInForm = document.getElementById("signInForm");
if (signInForm) {
  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const role = userDoc.data().role;

        // Redirect based on role
        switch (role) {
          case "admin":
            window.location.href = "admin.html";
            break;
          case "procurement":
            window.location.href = "procurement.html";
            break;
          case "supervisor":
            window.location.href = "supervisor.html";
            break;
          case "finance":
            window.location.href = "finance.html";
            break;
          default:
            window.location.href = "dashboard.html";
            break;
        }
      } else {
        showMessage("User data not found. Please contact support.", "signInMessage");
      }
    } catch (error) {
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        showMessage("Incorrect email or password.", "signInMessage");
      } else {
        showMessage(error.message, "signInMessage");
      }
    }
  });
}
