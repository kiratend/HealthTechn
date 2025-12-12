// auth-protect.js
import { auth, onAuthChange, getUserRole } from 'firebase-integration.js';

// Read required role from <body data-role="..."> on page
const required = (document.body?.dataset?.role || '').toLowerCase();

// helper redirect to login
function toLogin(msg) {
  console.warn('[auth-protect] redirecting to login:', msg);
  // optional: pass reason via query string
  window.location.replace(`login.html`);
}

// Check auth state, then role
onAuthChange(async (user) => {
  if (!user) {
    toLogin('not-signed-in');
    return;
  }
  try {
    const uid = user.uid;
    const role = await getUserRole(uid);
    if (!role) {
      // no role: redirect to login/admin page (admin will assign), you can change behavior
      toLogin('no-role');
      return;
    }
    if (!required) {
      // page didn't declare a required role — allow any signed-in user
      return;
    }
    if (role !== required) {
      // wrong role -> redirect to their correct page
      const map = { admin:'admin.html', finance:'finance.html', supervisor:'supervisor.html', procurement:'procurement.html' };
      const target = map[role] || 'login.html';
      window.location.replace(target);
    } else {
      // allowed — nothing to do
      console.log(`[auth-protect] access granted for role=${role}`);
    }
  } catch (e) {
    console.error('[auth-protect] error checking role', e);
    toLogin('error-checking-role');
  }
});
