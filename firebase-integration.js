// firebase-integration.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getDatabase, ref as dbRef, get as dbGet, update as dbUpdate, set as dbSet } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ---------- your firebase config ----------
const firebaseConfig = {
  apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
  authDomain: "healthtechn-c15da.firebaseapp.com",
  databaseURL: "https://healthtechn-c15da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthtechn-c15da",
  storageBucket: "healthtechn-c15da.appspot.com",
  messagingSenderId: "508561693923",
  appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};
// ------------------------------------------

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);

// Wrapper sign in
export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// read role (Firestore first, then RTDB)
export async function getUserRole(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(firestore, "users", uid));
    if (snap.exists()) {
      const d = snap.data();
      if (d && d.role) return String(d.role).toLowerCase();
    }
  } catch (e) {
    console.warn("[firebase-integration] Firestore read error:", e);
  }

  try {
    const snap2 = await dbGet(dbRef(rtdb, `users/${uid}`));
    if (snap2 && snap2.exists && snap2.exists()) {
      const d = snap2.val();
      if (d && d.role) return String(d.role).toLowerCase();
    }
  } catch (e) {
    console.warn("[firebase-integration] RTDB read error:", e);
  }
  return null;
}

// write metadata & role to both DBs (never write password)
export async function saveUserData(uid, { email = null, role = null } = {}) {
  if (!uid) throw new Error("uid required");
  const payloadFS = { updatedAt: serverTimestamp() };
  const payloadRT = { updatedAt: new Date().toISOString() };

  if (email) { payloadFS.email = email; payloadRT.email = email; }
  if (role) { payloadFS.role = role; payloadRT.role = role; }
  payloadRT.lastLogin = new Date().toISOString();

  // Firestore (merge)
  try {
    await setDoc(doc(firestore, "users", uid), { ...payloadFS }, { merge: true });
  } catch (e) {
    console.warn("[firebase-integration] Firestore write failed:", e);
  }

  // RTDB (update or set)
  try {
    await dbUpdate(dbRef(rtdb, `users/${uid}`), payloadRT).catch(async () => {
      await dbSet(dbRef(rtdb, `users/${uid}`), payloadRT);
    });
  } catch (e) {
    console.warn("[firebase-integration] RTDB write failed:", e);
  }
}

// listen auth state (helper)
export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function doSignOut() {
  await signOut(auth);
}
