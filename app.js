// Firebase configuration
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

// DOM elements
const loginForm = document.getElementById("loginForm");
const signInBtn = document.getElementById("signInBtn");
const btnText = document.getElementById("btnText");
const alertPlaceholder = document.getElementById("alertPlaceholder");

/**
 * Display alert message
 * @param {string} message - The message to display
 * @param {string} type - Bootstrap alert type (danger, success, warning, etc.)
 */
function showAlert(message, type = "danger") {
    alertPlaceholder.innerHTML = `
        <div class="alert alert-${type} alert-dismissible" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}

/**
 * Set loading state for the sign in button
 * @param {boolean} loading - Whether to show loading state
 */
function setLoading(loading) {
    if (loading) {
        signInBtn.disabled = true;
        btnText.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 
            Signing in...
        `;
    } else {
        signInBtn.disabled = false;
        btnText.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In`;
    }
}

/**
 * Redirect user based on their email address
 * @param {string} email - User's email address
 */
function redirectByEmail(email) {
    const emailLower = email.toLowerCase();

    // Email to dashboard mapping
    const emailRedirects = {
        "admin@gmail.com": "admin.html",
        "procurement@gmail.com": "procurement.html", 
        "supervisor@gmail.com": "supervisor.html",
        "finance@gmail.com": "finance.html"
    };

    const redirectPage = emailRedirects[emailLower];
    
    if (redirectPage) {
        window.location.href = redirectPage;
    } else {
        // Default / unknown email
        showAlert("Your account is not assigned to a dashboard page.", "warning");
        setLoading(false);
    }
}

/**
 * Handle login form submission
 */
loginForm.addEventListener("submit", function(event) {
    event.preventDefault();
    alertPlaceholder.innerHTML = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Validation
    if (!email || !password) {
        showAlert("Please enter both email and password.", "warning");
        return;
    }

    setLoading(true);

    // Firebase authentication
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (!user) {
                throw new Error("No user returned by Firebase Auth.");
            }

            // Redirect based on email after successful login
            redirectByEmail(user.email || email);
        })
        .catch((error) => {
            console.error("Login error:", error);
            showAlert(error.message || "Login failed. Please try again.", "danger");
            setLoading(false);
        });
});

// Optional: Add enter key support for better UX
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !signInBtn.disabled) {
        loginForm.dispatchEvent(new Event('submit'));
    }
});