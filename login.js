// login.js
import { signIn, saveUserData, getUserRole } from 'firebase-integration.js';

const $ = id => document.getElementById(id);
const msgEl = $('msg');

function show(msg, type = 'info') {
  msgEl.textContent = msg;
  msgEl.style.color = type === 'error' ? 'crimson' : type === 'success' ? 'green' : 'black';
}

function setLoading(yes) {
  const b = $('loginBtn');
  if (!b) return;
  b.disabled = yes;
  b.textContent = yes ? 'Signing in...' : 'Log in';
}

function autoRoleByEmail(email) {
  const e = (email || '').toLowerCase();
  if (e === 'admin@gmail.com') return 'admin';
  if (e === 'finance@gmail.com') return 'finance';
  if (e === 'procurement@gmail.com') return 'procurement';
  if (e === 'supervisor@gmail.com') return 'supervisor';
  return null;
}

$('loginBtn').addEventListener('click', async () => {
  const email = ($('email').value || '').trim();
  const pass = ($('password').value || '').trim();
  if (!email || !pass) { show('Enter email and password', 'error'); return; }

  setLoading(true);
  show('Signing in...', 'info');

  try {
    const cred = await signIn(email, pass);
    const uid = cred.user.uid;
    console.log('[login] signed in uid=', uid);

    // check existing role
    let role = await getUserRole(uid);
    role = role ? role.toLowerCase() : null;

    // auto-assign role for known emails (safe, you provided these test accounts)
    if (!role) {
      role = autoRoleByEmail(email);
    }

    // save metadata & role (role may still be null for unknown accounts)
    await saveUserData(uid, { email, role });

    if (!role) {
      show('Logged in, but no role assigned. Ask admin to assign your role.', 'error');
      setLoading(false);
      return;
    }

    show('Login successful — redirecting...', 'success');
    setTimeout(() => {
      // redirect logic matches role names
      const map = {
        admin: 'admin.html',
        finance: 'finance.html',
        supervisor: 'supervisor.html',
        procurement: 'procurement.html'
      };
      window.location.replace(map[role] || 'login.html');
    }, 600);

  } catch (err) {
    console.error(err);
    show(err?.code ? (err.code.replace('auth/', '') + '') : 'Login failed', 'error');
    setLoading(false);
  }
});
