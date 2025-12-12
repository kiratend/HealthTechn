// Firebase Configuration and Initialization
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
firebase.initializeApp(firebaseConfig);

// Firebase Services
const auth = firebase.auth();
const database = firebase.database();

// Authentication state observer
auth.onAuthStateChanged((user) => {
  if (!user) {
    // User is not logged in, redirect to login page
    window.location.href = "login.html";
  } else {
    // User is logged in, initialize the application
    if (typeof initApp === 'function') {
      initApp();
    }
  }
});

// Export Firebase services for use in other files
window.firebaseServices = {
  auth: auth,
  database: database
};

