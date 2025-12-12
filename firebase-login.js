// login.js
// Attaches handlers to the DOM, signs in user and redirects based on role.
// This file expects firebase-integration.js to be loaded first (it imports exported functions)

import { signIn, getUserDoc, updateUserMetadata, showMessage, redirectToRolePage } from './firebase-integration.js';

// Helper: map role => page (mirror of firebase-integration mapping, but safe)
const ROLE_PAGES = {
  admin: 'admin.html',
  procurement: 'procurement.html',
  finance: 'finance.html',
  supervisor: 'supervisor.html'
};

function setLoading(isLoading) {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;
  btn.disabled = isLoading;
  btn.innerHTML = isLoading ? 'Signing in...' : '<i class="fa-solid fa-right-to-bracket"></i> Log In';
}

async function handleLogin(e) {
  e?.preventDefault?.();
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  if (!emailEl || !passEl) return console.error('login form elements missing');

  const email = (emailEl.value || '').trim();
  const password = passEl.value || '';

  if (!email || !password) {
    showMessage('Please enter both email and password.', { type: 'error' });
    return;
  }

  setLoading(true);
  showMessage('Signing in…', { type: 'info', timeout: 0 });

  try {
    const cred = await signIn(email, password);
    const user = cred.user;
    console.log('[login] signed in', user.uid, user.email);

    // Update user's lastLogin timestamp + store email & role ONLY IF you want to - NEVER store password
    try {
      await updateUserMetadata(user.uid, {
        email: user.email,
        lastLogin: new Date().toISOString()
        // role should be stored in Firestore separately and managed by admins
      });
    } catch (metaErr) {
      console.warn('[login] updateUserMetadata failed', metaErr);
      // non-blocking
    }

    // Fetch user document to determine role
    const udoc = await getUserDoc(user.uid);
    const role = (udoc && udoc.role) ? String(udoc.role).toLowerCase() : null;
    console.log('[login] user doc', udoc);

    if (!role) {
      showMessage('Your account has no role assigned. Contact admin.', { type: 'error' });
      setLoading(false);
      return;
    }

    // Redirect based on role (explicit mapping)
    const page = ROLE_PAGES[role] || `${role}.html`;
    showMessage('Login successful — redirecting...', { type: 'success', timeout: 1500 });
    // small delay for user to see message
    setTimeout(() => {
      window.location.replace(page);
    }, 600);

  } catch (err) {
    console.error('[login] signIn error', err);
    // Interpret some common error codes for friendlier messages (firebase error codes)
    const message = (err && err.code) ? parseFirebaseAuthError(err) : 'Login failed. Please try again.';
    showMessage(message, { type: 'error' });
    setLoading(false);
  }
}

function parseFirebaseAuthError(err) {
  // err.code examples: 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'
  const code = err.code || '';
  switch (code) {
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found for this email.';
    case 'auth/invalid-email':
      return 'Email address is not valid.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    default:
      // fallback to error message if provided
      return err.message || 'Authentication failed.';
  }
}

// Attach listeners when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const btn = document.getElementById('loginBtn');
  const form = document.querySelector('form'); // in case you add one later
  if (btn) btn.addEventListener('click', handleLogin);
  if (form) form.addEventListener('submit', handleLogin);

  // allow Enter to submit from inputs
  const inputs = [document.getElementById('email'), document.getElementById('password')];
  inputs.forEach(i => {
    if (!i) return;
    i.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') handleLogin(ev);
    });
  });

  // Clear any previous message
  const msg = document.getElementById('message');
  if (msg) msg.textContent = '';
}
