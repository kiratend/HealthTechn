// Firebase Integration Script for BloodConnect
// This script integrates Firebase Realtime Database with existing authentication

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAG6Drx2JJlBX1TGvLMWPHp_D2xBDTPIjI",
  authDomain: "bloodconnect-b5142.firebaseapp.com",
  databaseURL: "https://bloodconnect-b5142-default-rtdb.firebaseio.com",
  projectId: "bloodconnect-b5142",
  storageBucket: "bloodconnect-b5142.firebasestorage.app",
  messagingSenderId: "631993835929",
  appId: "1:631993835929:web:75554aca166e9058473308"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

// Show message function
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
  }, 5000);
}

// Enhanced signup with Realtime Database integration
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fName = document.getElementById('fName').value.trim();
    const lName = document.getElementById('lName').value.trim();
    const email = document.getElementById('rEmail').value.trim();
    const password = document.getElementById('rPassword').value;
    const role = document.getElementById('userRole').value;

    if (!role) {
      showMessage('Please select a role.', 'signUpMessage');
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user data in Firestore (existing functionality)
      await setDoc(doc(db, "users", user.uid), {
        firstName: fName,
        lastName: lName,
        email: email,
        role: role,
        createdAt: new Date()
      });

      // Store user data in Realtime Database (new functionality)
      await set(ref(database, `users/${user.uid}`), {
        firstName: fName,
        lastName: lName,
        email: email,
        role: role,
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        dateOfBirth: "",
        bloodType: role === 'donor' ? "" : "",
        isEligible: role === 'donor' ? true : null,
        lastDonationDate: role === 'donor' ? "" : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create initial notifications for new user
      const notificationRef = ref(database, `notifications/${user.uid}_welcome`);
      await set(notificationRef, {
        userId: user.uid,
        type: "system",
        title: "Welcome to BloodConnect!",
        message: `Welcome to BloodConnect! Your ${role} account has been created successfully.`,
        isRead: false,
        priority: "medium",
        actionUrl: "/dashboard",
        createdAt: new Date().toISOString()
      });

      showMessage('Account created successfully! Redirecting to login...', 'signUpMessage');
      
      // Redirect to login page after successful signup
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } catch (error) {
      showMessage(error.message, 'signUpMessage');
    }
  });
}

// Enhanced login with Realtime Database integration
const signInForm = document.getElementById('signInForm');
if (signInForm) {
  signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        // Update last login in Realtime Database
        await update(ref(database, `users/${user.uid}`), {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Redirect based on role
        if (role === 'admin') {
          window.location.href = 'admin.html';
        } else if (role === 'donor') {
          window.location.href = 'donor-dashboard.html';
        } else if (role === 'hospital') {
          window.location.href = 'hospital-dashboard.html';
        } else if (role === 'patient') {
          window.location.href = 'patient-dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } else {
        showMessage('User data not found. Please contact support.', 'signInMessage');
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        showMessage('Incorrect Email or Password', 'signInMessage');
      } else {
        showMessage(error.message, 'signInMessage');
      }
    }
  });
}

// Auth state change listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    console.log('User signed in:', user.uid);
    
    // Update user's online status in Realtime Database
    await update(ref(database, `users/${user.uid}`), {
      isOnline: true,
      lastSeen: new Date().toISOString()
    });

    // Set up real-time notifications listener
    setupNotificationsListener(user.uid);
    
  } else {
    // User is signed out
    console.log('User signed out');
  }
});

// Setup real-time notifications listener
function setupNotificationsListener(userId) {
  const notificationsRef = ref(database, `notifications`);
  
  // Listen for new notifications for this user
  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    const notifications = snapshot.val();
    if (notifications) {
      const userNotifications = Object.values(notifications).filter(notif => 
        notif.userId === userId && !notif.isRead
      );
      
      if (userNotifications.length > 0) {
        showNotificationBadge(userNotifications.length);
      }
    }
  });

  // Store unsubscribe function for cleanup
  window.notificationsUnsubscribe = unsubscribe;
}

// Show notification badge
function showNotificationBadge(count) {
  // Create or update notification badge
  let badge = document.getElementById('notification-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'notification-badge';
    badge.className = 'badge bg-danger position-absolute top-0 start-100 translate-middle';
    badge.style.cssText = 'font-size: 0.75rem; z-index: 1000;';
    
    // Find notification icon or create one
    let notificationIcon = document.querySelector('.notification-icon');
    if (!notificationIcon) {
      notificationIcon = document.createElement('i');
      notificationIcon.className = 'fa-solid fa-bell notification-icon';
      notificationIcon.style.cssText = 'position: relative; font-size: 1.2rem;';
      
      // Add to navigation
      const nav = document.querySelector('.red-cross-nav');
      if (nav) {
        const notificationLink = document.createElement('a');
        notificationLink.href = '#';
        notificationLink.className = 'position-relative';
        notificationLink.appendChild(notificationIcon);
        notificationLink.appendChild(badge);
        nav.appendChild(notificationLink);
      }
    } else {
      notificationIcon.parentNode.appendChild(badge);
    }
  }
  
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
}

// Utility functions for Realtime Database operations
window.BloodConnectUtils = {
  // Get current user data from Realtime Database
  async getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      const snapshot = await get(ref(database, `users/${user.uid}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(profileData) {
    const user = auth.currentUser;
    if (!user) return { success: false, message: 'User not authenticated' };
    
    try {
      await update(ref(database, `users/${user.uid}`), {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      await update(ref(database, `notifications/${notificationId}`), {
        isRead: true,
        readAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Get user notifications
  async getUserNotifications() {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
      const snapshot = await get(ref(database, `notifications`));
      const notifications = snapshot.val();
      if (!notifications) return [];
      
      return Object.entries(notifications)
        .filter(([id, notif]) => notif.userId === user.uid)
        .map(([id, notif]) => ({ id, ...notif }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }
};

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
  if (window.notificationsUnsubscribe) {
    window.notificationsUnsubscribe();
  }
});

console.log('Firebase Integration with Realtime Database loaded successfully!');