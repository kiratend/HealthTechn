// Firebase Configuration
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM Elements
const logoutIcon = document.querySelector('.medventory-logout-icon i');
const logoutTitle = document.querySelector('.medventory-logout-title');
const logoutSubtitle = document.querySelector('.medventory-logout-subtitle');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const actionButtons = document.getElementById('actionButtons');
const retryButton = document.getElementById('retryButton');
const redirectButton = document.getElementById('redirectButton');

// Error messages mapping
const errorMessages = {
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/too-many-requests': 'Too many requests. Please wait a moment and try again.',
    'auth/requires-recent-login': 'For security reasons, please log in again before logging out.',
    'default': 'An error occurred during logout. Please try again.'
};

// Perform logout function
function performLogout() {
    // Reset UI state
    resetUIState();
    
    // Show loading state
    setLoadingState();
    
    // Execute Firebase logout
    auth.signOut()
        .then(() => {
            // Logout successful
            handleLogoutSuccess();
        })
        .catch((error) => {
            // Logout failed
            handleLogoutError(error);
        });
}

// Reset UI to initial state
function resetUIState() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    actionButtons.style.display = 'none';
}

// Set loading state UI
function setLoadingState() {
    logoutIcon.className = 'fa-solid fa-spinner fa-spin';
    logoutTitle.textContent = 'Logging Out...';
    logoutSubtitle.textContent = 'Please wait while we securely log you out of MedVentory';
}

// Handle successful logout
function handleLogoutSuccess() {
    logoutIcon.className = 'fa-solid fa-check';
    logoutTitle.textContent = 'Logged Out Successfully';
    logoutSubtitle.textContent = 'You have been securely logged out of MedVentory';
    successMessage.style.display = 'block';
    
    // Redirect to login page after a brief delay
    setTimeout(() => {
        window.location.href = "login.html";
    }, 2000);
}

// Handle logout error
function handleLogoutError(error) {
    console.error("Logout Error:", error);
    
    // Update UI for error state
    logoutIcon.className = 'fa-solid fa-exclamation-triangle';
    logoutTitle.textContent = 'Logout Error';
    logoutSubtitle.textContent = 'We encountered an issue while logging you out';
    
    // Display appropriate error message
    const errorMessageText = errorMessages[error.code] || errorMessages['default'];
    errorText.textContent = errorMessageText;
    errorMessage.style.display = 'block';
    actionButtons.style.display = 'flex';
}

// Get error message based on error code
function getErrorMessage(errorCode) {
    return errorMessages[errorCode] || errorMessages['default'];
}

// Event listeners for action buttons
retryButton.addEventListener('click', performLogout);
redirectButton.addEventListener('click', () => {
    window.location.href = "login.html";
});

// Initialize logout process when page loads
document.addEventListener("DOMContentLoaded", performLogout);

// Handle page visibility changes (in case user switches tabs during logout)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && actionButtons.style.display === 'flex') {
        // Page became visible again and we're in error state
        // Optionally retry logout automatically
        // performLogout();
    }
});

// Export functions for potential reuse (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        performLogout,
        getErrorMessage,
        handleLogoutSuccess,
        handleLogoutError
    };
}