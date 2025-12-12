// login-all.js
// Single-file, self-contained login module that uses your firebase config,
// writes metadata to RTDB and Firestore, reads role (Firestore -> RTDB fallback),
// and redirects based on role. Verbose console logging included.

// --- Firebase CDN imports (modular) ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getDatabase, ref as dbRef, get as dbGet, set as dbSet, update as dbUpdate } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// ----------------- YOUR FIREBASE CONFIG (from you) -----------------
const firebaseConfig = {
  apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
  authDomain: "healthtechn-c15da.firebaseapp.com",
  databaseURL: "https://healthtechn-c15da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthtechn-c15da",
  storageBucket: "healthtechn-c15da.appspot.com",
  messagingSenderId: "508561693923",
  appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};
// ------------------------------------------------------------------

// Init
const app = initializeApp(firebaseConfig);
console.log('[login-all] Firebase initialized');
const auth = getAuth(app);
const firestore = getFirestore(app);
const rtdb = getDatabase(app);

// UI helpers
const $ = id => document.getElementById(id);
function showMessage(text, { type='info', timeout=4000 } = {}) {
  const el = $('message');
  if (!el) return console.warn('[login-all] #message element not found');
  el.textContent = text;
  el.classList.remove('text-danger','text-success','text-muted');
  if (type === 'error') el.classList.add('text-danger');
  else if (type === 'success') el.classList.add('text-success');
  else el.classList.add('text-muted');
  if (timeout>0) setTimeout(()=> { if (el.textContent === text) el.textContent = ''; }, timeout);
}
function setLoading(isLoading){
  const btn = $('loginBtn');
  if(!btn) return;
  btn.disabled = isLoading;
  btn.innerHTML = isLoading ? 'Signing in...' : '<i class="fa-solid fa-right-to-bracket"></i> Log In';
}

// Role -> page mapping
const ROLE_PAGES = { admin:'admin.html', procurement:'procurement.html', finance:'finance.html', supervisor:'supervisor.html' };

// Read user data: try Firestore then RTDB
async function readUserData(uid){
  console.log('[login-all] readUserData: trying Firestore for uid=', uid);
  try {
    const docRef = doc(firestore, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      console.log('[login-all] Firestore user doc found', snap.data());
      return { source:'firestore', data: snap.data() };
    } else {
      console.log('[login-all] No Firestore doc for uid, falling back to RTDB');
    }
  } catch (err) {
    console.warn('[login-all] Firestore read error (will try RTDB):', err);
  }

  // RTDB fallback
  try {
    const rref = dbRef(rtdb, `users/${uid}`);
    const snap2 = await dbGet(rref);
    if (snap2 && snap2.exists && snap2.exists()) {
      console.log('[login-all] RTDB user node found', snap2.val());
      return { source:'rtdb', data: snap2.val() };
    } else {
      console.log('[login-all] No RTDB node for uid either');
    }
  } catch (err) {
    console.warn('[login-all] RTDB read error:', err);
  }

  return null;
}

// Write metadata: try Firestore (merge), also write RTDB
async function writeUserMetadata(uid, meta){
  if(!uid) throw new Error('uid required');
  console.log('[login-all] writeUserMetadata: uid=', uid, 'meta=', meta);
  // Firestore write (merge)
  try {
    const docRef = doc(firestore, 'users', uid);
    await setDoc(docRef, { ...meta, updatedAt: serverTimestamp() }, { merge: true });
    console.log('[login-all] Firestore metadata written');
  } catch (err) {
    console.warn('[login-all] Firestore write failed:', err);
  }

  // RTDB write (update or set)
  try {
    const rref = dbRef(rtdb, `users/${uid}`);
    // try update; fallback to set
    await dbUpdate?.(rref, meta).catch(async (e) => {
      console.warn('[login-all] RTDB update failed, trying set:', e);
      await dbSet(rref, meta);
    });
    console.log('[login-all] RTDB metadata written');
  } catch (err) {
    console.warn('[login-all] RTDB write failed:', err);
  }
}

// Redirect helper
function redirectToRole(role){
  if(!role) { window.location.replace('/'); return; }
  const r = String(role).toLowerCase();
  const target = ROLE_PAGES[r] || `${r}.html`;
  console.log('[login-all] redirecting to', target);
  window.location.replace(target);
}

// Parse auth errors nicely
function parseAuthError(err){
  const code = err && err.code ? err.code : '';
  switch(code){
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/user-not-found': return 'No user for that email.';
    case 'auth/invalid-email': return 'Invalid email.';
    case 'auth/too-many-requests': return 'Too many attempts. Try later.';
    default: return err && err.message ? err.message : 'Authentication failed.';
  }
}

// Main login handler
async function handleLogin(e){
  e?.preventDefault?.();
  const email = ($('email')?.value || '').trim();
  const pass = $('password')?.value || '';
  if(!email || !pass){ showMessage('Please enter email and password.', { type:'error' }); return; }

  setLoading(true);
  showMessage('Signing in…', { type:'info', timeout: 0 });

  try {
    console.log('[login-all] calling signInWithEmailAndPassword for', email);
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;
    console.log('[login-all] auth success uid=', user.uid, 'email=', user.email);

    // write metadata (no password)
    await writeUserMetadata(user.uid, { email: user.email, lastLogin: new Date().toISOString() }).catch(err => {
      console.warn('[login-all] metadata write error (non-blocking):', err);
    });

    // read user data (role)
    const ud = await readUserData(user.uid);
    const role = ud && ud.data && ud.data.role ? String(ud.data.role).toLowerCase() : null;
    console.log('[login-all] resolved role=', role, 'from source=', ud ? ud.source : 'none');

    if (!role) {
      showMessage('No role assigned. Contact admin.', { type:'error' });
      setLoading(false);
      return;
    }

    showMessage('Login ok — redirecting...', { type:'success', timeout: 1200 });
    setTimeout(()=> redirectToRole(role), 600);
  } catch (err) {
    console.error('[login-all] signIn error', err);
    showMessage(parseAuthError(err), { type:'error' });
    setLoading(false);
  }
}

// init
function init(){
  const btn = $('loginBtn');
  if(btn) btn.addEventListener('click', handleLogin);
  // Enter key to submit
  ['email','password'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('keydown', ev => { if(ev.key === 'Enter') handleLogin(ev); });
  });
  if ($('message')) $('message').textContent = '';
  console.log('[login-all] ready');
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
