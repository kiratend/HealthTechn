// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const passwordToggle = document.getElementById("passwordToggle");
const rememberMe = document.getElementById("rememberMe");

// Toast notification function
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    const bgColor = type === 'error' ? 'bg-danger' : 'bg-success';
    const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${bgColor} text-white`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('id', toastId);
    
    toastEl.innerHTML = `
        <div class="toast-header ${bgColor} text-white">
        <i class="fas ${icon} me-2"></i>
        <strong class="me-auto">MedVentory</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
        ${message}
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    
    // Remove toast from DOM after it hides
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Toggle password visibility
passwordToggle.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle icon
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Check for saved credentials on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedEmail = localStorage.getItem('medventory_email');
    const savedRememberMe = localStorage.getItem('medventory_remember') === 'true';
    
    if (savedEmail && savedRememberMe) {
        emailInput.value = savedEmail;
        rememberMe.checked = true;
    }
});

// Function to determine user role based on email
function determineUserRole(email) {
    // Admin role for emails containing "admin"
    if (email.includes('admin') || email.includes('administrator')) {
        return 'admin';
    }
    // Procurement role for emails containing "procurement" or "purchasing"
    else if (email.includes('procurement') || email.includes('purchasing') || email.includes('purchase')) {
        return 'procurement';
    }
    // Finance role for emails containing "finance" or "accounting"
    else if (email.includes('finance') || email.includes('accounting') || email.includes('account')) {
        return 'finance';
    }
    // Supervisor role for emails containing "supervisor" or "manager"
    else if (email.includes('supervisor') || email.includes('manager') || email.includes('lead')) {
        return 'supervisor';
    }
    // Default role
    else {
        return 'user';
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showToast("Please fill in all fields.", "error");
        return;
    }
    
    // Save remember me preference
    if (rememberMe.checked) {
        localStorage.setItem('medventory_email', email);
        localStorage.setItem('medventory_remember', 'true');
    } else {
        localStorage.removeItem('medventory_email');
        localStorage.removeItem('medventory_remember');
    }
    
    // Show loading state
    const originalText = loginButton.innerHTML;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';
    loginButton.disabled = true;
    
    try {
        // Wait for Firebase Auth to be ready
        if (!window.firebaseAuth) {
            await new Promise((resolve) => {
                window.addEventListener('firebaseAuthReady', resolve, { once: true });
            });
        }
        
        // Check if Firebase Auth is available
        if (!window.firebaseAuth || !window.firebaseAuth.loginUser) {
            throw new Error("Authentication service is not available. Please refresh the page and try again.");
        }
        
        // Firebase Authentication with your MedVentory config
        const result = await window.firebaseAuth.loginUser(email, password);
        
        if (result.success) {
            // Get user data from Realtime Database
            const userData = await window.firebaseAuth.getUserData(result.user.uid);
            
            // Determine user role (use from database or fallback to email-based detection)
            let userRole = userData?.role || determineUserRole(email);
            
            // Store session data
            const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
            const expirationTime = Date.now() + sessionDuration;
            
            localStorage.setItem('medventory_role', userRole);
            localStorage.setItem('medventory_user_email', email);
            localStorage.setItem('medventory_session_expiration', expirationTime.toString());
            localStorage.setItem('medventory_user_id', result.user.uid);
            
            // Store user data for quick access
            if (userData) {
                localStorage.setItem('medventory_user_data', JSON.stringify(userData));
            }
            
            showToast("Login successful! Redirecting...", "success");
            
            // Redirect to appropriate dashboard based on role
            setTimeout(function() {
                window.location.href = `${userRole}.html`;
            }, 1500);
        } else {
            showToast(result.error, "error");
            loginButton.innerHTML = originalText;
            loginButton.disabled = false;
        }
    } catch (error) {
        showToast("Login error: " + error.message, "error");
        loginButton.innerHTML = originalText;
        loginButton.disabled = false;
    }
}

// Initialize login form when everything is ready
function initializeLogin() {
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
}

// Wait for DOM to be fully loaded and initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
    initializeLogin();
}

// Utility functions for other pages
window.MedVentoryUtils = {
    // Get current user data
    async getCurrentUserData() {
        if (window.firebaseAuth) {
            const user = window.firebaseAuth.getCurrentUser();
            if (user) {
                return await window.firebaseAuth.getUserData(user.uid);
            }
        }
        return null;
    },

    // Update user profile
    async updateUserProfile(profileData) {
        if (window.firebaseAuth) {
            return await window.firebaseAuth.updateUserProfile(profileData);
        }
        return { success: false, message: 'Authentication not available' };
    },

    // Logout user
    async logoutUser() {
        if (window.firebaseAuth) {
            const result = await window.firebaseAuth.logoutUser();
            if (result.success) {
                // Clear local storage
                localStorage.removeItem('medventory_role');
                localStorage.removeItem('medventory_user_email');
                localStorage.removeItem('medventory_session_expiration');
                localStorage.removeItem('medventory_user_id');
                localStorage.removeItem('medventory_user_data');
                
                // Redirect to login page
                window.location.href = 'login.html';
            }
            return result;
        }
        return { success: false, message: 'Authentication not available' };
    }
};

// Make these functions available globally for other pages
window.showToast = showToast;
window.determineUserRole = determineUserRole;