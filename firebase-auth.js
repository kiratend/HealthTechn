// Firebase Authentication for MedVentory
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update,
  onValue 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// Wait for Firebase app to be initialized
function initializeAuth() {
    if (!window.firebaseApp) {
        console.error('Firebase app not initialized');
        return null;
    }

    // Initialize Firebase Authentication and Database
    const auth = getAuth(window.firebaseApp);
    const database = getDatabase(window.firebaseApp);

    // Authentication functions
    async function loginUser(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update last login in Realtime Database
            await update(ref(database, `users/${user.uid}`), {
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isOnline: true
            });

            return { success: true, user: user };
        } catch (error) {
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.code === 'auth/wrong-password' || 
                error.code === 'auth/user-not-found' || 
                error.code === 'auth/invalid-credential') {
                errorMessage = 'Incorrect Email or Password';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async function registerUser(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user data in Realtime Database
            await set(ref(database, `users/${user.uid}`), {
                ...userData,
                email: email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isOnline: true
            });

            // Create welcome notification
            const notificationRef = ref(database, `notifications/${user.uid}_welcome`);
            await set(notificationRef, {
                userId: user.uid,
                type: "system",
                title: "Welcome to MedVentory!",
                message: `Welcome to MedVentory! Your account has been created successfully.`,
                isRead: false,
                priority: "medium",
                actionUrl: "/dashboard",
                createdAt: new Date().toISOString()
            });

            return { success: true, user: user };
        } catch (error) {
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already exists. Please use a different email.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async function logoutUser() {
        try {
            const user = auth.currentUser;
            if (user) {
                // Update user status to offline
                await update(ref(database, `users/${user.uid}`), {
                    isOnline: false,
                    lastSeen: new Date().toISOString()
                });
            }
            
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Auth state observer
    function onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    }

    // Get current user
    function getCurrentUser() {
        return auth.currentUser;
    }

    // Get user data from Realtime Database
    async function getUserData(uid) {
        try {
            const snapshot = await get(ref(database, `users/${uid}`));
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Update user profile
    async function updateUserProfile(profileData) {
        const user = auth.currentUser;
        if (!user) return { success: false, message: 'User not authenticated' };
        
        try {
            await update(ref(database, `users/${user.uid}`), {
                ...profileData,
                updatedAt: new Date().toISOString()
            });
            return { success: true, message: 'Profile updated successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Setup real-time notifications listener
    function setupNotificationsListener(userId) {
        const notificationsRef = ref(database, `notifications`);
        
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            const notifications = snapshot.val();
            if (notifications) {
                const userNotifications = Object.values(notifications).filter(notif => 
                    notif.userId === userId && !notif.isRead
                );
                
                if (userNotifications.length > 0) {
                    showNotificationBadge(userNotifications.length);
                }
            }
        });

        return unsubscribe;
    }

    // Show notification badge
    function showNotificationBadge(count) {
        let badge = document.getElementById('notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'notification-badge';
            badge.className = 'badge bg-danger position-absolute top-0 start-100 translate-middle';
            badge.style.cssText = 'font-size: 0.75rem; z-index: 1000; display: none;';
            
            // Add to navbar if it exists
            const navbar = document.querySelector('.navbar-nav');
            if (navbar) {
                const notificationItem = document.createElement('li');
                notificationItem.className = 'nav-item';
                notificationItem.innerHTML = `
                    <a class="nav-link position-relative" href="#">
                        <i class="fas fa-bell"></i>
                    </a>
                `;
                notificationItem.querySelector('a').appendChild(badge);
                navbar.appendChild(notificationItem);
            }
        }
        
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    return {
        loginUser,
        registerUser,
        logoutUser,
        onAuthChange,
        getCurrentUser,
        getUserData,
        updateUserProfile,
        setupNotificationsListener,
        database
    };
}

// Initialize auth when firebase app is ready
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseApp) {
                const auth = initializeAuth();
                resolve(auth);
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Initialize and make auth available globally
waitForFirebase().then((auth) => {
    if (auth) {
        window.firebaseAuth = auth;
        console.log('Firebase Authentication initialized for MedVentory');
        
        // Setup auth state listener
        auth.onAuthChange(async (user) => {
            if (user) {
                console.log('User signed in:', user.uid);
                
                // Setup notifications listener
                const unsubscribe = auth.setupNotificationsListener(user.uid);
                window.notificationsUnsubscribe = unsubscribe;
                
            } else {
                console.log('User signed out');
                if (window.notificationsUnsubscribe) {
                    window.notificationsUnsubscribe();
                }
            }
        });
        
        // Dispatch event that auth is ready
        window.dispatchEvent(new Event('firebaseAuthReady'));
    }
});

// Cleanup function
window.addEventListener('beforeunload', () => {
    if (window.notificationsUnsubscribe) {
        window.notificationsUnsubscribe();
    }
});