// firebase-core.js - Core Firebase initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
  authDomain: "healthtechn-c15da.firebaseapp.com",
  databaseURL: "https://healthtechn-c15da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthtechn-c15da",
  storageBucket: "healthtechn-c15da.appspot.com",
  messagingSenderId: "508561693923",
  appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };