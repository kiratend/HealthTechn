// Global variables
let currentUser = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Firebase and load data
function initializeApp() {
    // Check authentication state
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('User logged in:', user.email);
            loadDashboardData();
            loadUsers();
            loadOrders();
            loadNotifications();
            
            // Generate sample data if database is empty (for testing)
            generateSampleData();
        } else {
            console.log('No user logged in, redirecting to login...');
            // For demo purposes, we'll continue without auth
            loadDashboardData();
            loadUsers();
            loadOrders();
            loadNotifications();
            generateSampleData();
        }
    });
}

// Generate sample data for testing
function generateSampleData() {
    // Check if sample data already exists
    database.ref('sampleDataGenerated').once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            console.log('Generating sample data...');
            
            // Sample users
            const users = {
                'user1': {
                    name: 'Dr. Sarah Johnson',
                    email: 'sarah.johnson@hospital.com',
                    role: 'Doctor',
                    status: 'active',
                    createdAt: Date.now()
                },
                'user2': {
                    name: 'Nurse Michael Chen',
                    email: 'michael.chen@hospital.com',
                    role: 'Nurse',
                    status: 'active',
                    createdAt: Date.now()
                },
                'user3': {
                    name: 'Admin Robert Smith',
                    email: 'robert.smith@hospital.com',
                    role: 'Administrator',
                    status: 'active',
                    createdAt: Date.now()
                }
            };

            // Sample supplies
            const supplies = {
                'supply1': {
                    name: 'Surgical Masks',
                    quantity: 45,
                    minQuantity: 50,
                    category: 'Protective Equipment',
                    lastUpdated: Date.now()
                },
                'supply2': {
                    name: 'Medical Gloves',
                    quantity: 120,
                    minQuantity: 100,
                    category: 'Protective Equipment',
                    lastUpdated: Date.now()
                },
                'supply3': {
                    name: 'Bandages',
                    quantity: 8,
                    minQuantity: 25,
                    category: 'Wound Care',
                    lastUpdated: Date.now()
                }
            };

            // Sample orders
            const orders = {
                'ORD-001': {
                    supplier: 'MedSupply Co.',
                    items: ['Bandages', 'Syringes', 'Gloves'],
                    orderDate: '2025-03-15',
                    deliveryDate: '2025-03-20',
                    status: 'pending',
                    totalAmount: 450.00,
                    createdAt: Date.now()
                },
                'ORD-002': {
                    supplier: 'HealthTech Supplies',
                    items: ['IV Sets', 'Masks', 'Sanitizers'],
                    orderDate: '2025-03-10',
                    deliveryDate: '2025-03-18',
                    status: 'delivered',
                    totalAmount: 780.50,
                    createdAt: Date.now()
                }
            };

            // Sample notifications
            const notifications = {
                'notif1': {
                    message: 'Low stock alert: Bandages running low (8 remaining)',
                    type: 'warning',
                    read: false,
                    timestamp: Date.now() - 3600000
                }
            };

            // Save all sample data
            const updates = {};
            updates['/users'] = users;
            updates['/supplies'] = supplies;
            updates['/orders'] = orders;
            updates['/notifications'] = notifications;
            updates['/sampleDataGenerated'] = true;

            database.ref().update(updates)
                .then(() => console.log('Sample data generated successfully'))
                .catch((error) => console.error('Error generating sample data:', error));
        }
    });
}

// Load dashboard summary data
function loadDashboardData() {
    // Load total supplies count
    database.ref('supplies').once('value')
        .then((snapshot) => {
            const supplies = snapshot.val();
            const totalSupplies = supplies ? Object.keys(supplies).length : 0;
            document.getElementById('total-supplies').textContent = totalSupplies;
        })
        .catch((error) => {
            console.error('Error loading supplies:', error);
            document.getElementById('total-supplies').textContent = '0';
        });

    // Load pending orders count
    database.ref('orders').orderByChild('status').equalTo('pending').once('value')
        .then((snapshot) => {
            const pendingOrders = snapshot.val();
            const ordersCount = pendingOrders ? Object.keys(pendingOrders).length : 0;
            document.getElementById('orders-pending').textContent = ordersCount;
        })
        .catch((error) => {
            console.error('Error loading orders:', error);
            document.getElementById('orders-pending').textContent = '0';
        });

    // Load low stock items count
    database.ref('supplies').once('value')
        .then((snapshot) => {
            const supplies = snapshot.val();
            let lowStockCount = 0;
            
            if (supplies) {
                Object.keys(supplies).forEach((supplyId) => {
                    const supply = supplies[supplyId];
                    if (supply.quantity < supply.minQuantity) {
                        lowStockCount++;
                    }
                });
            }
            
            document.getElementById('low-stock').textContent = lowStockCount;
        })
        .catch((error) => {
            console.error('Error loading low stock items:', error);
            document.getElementById('low-stock').textContent = '0';
        });

    // Load total users count
    database.ref('users').once('value')
        .then((snapshot) => {
            const users = snapshot.val();
            const totalUsers = users ? Object.keys(users).length : 0;
            document.getElementById('total-users').textContent = totalUsers;
        })
        .catch((error) => {
            console.error('Error loading users:', error);
            document.getElementById('total-users').textContent = '0';
        });
}

// Load and display users
function loadUsers() {
    database.ref('users').on('value', (snapshot) => {
        const users = snapshot.val();
        const userList = document.getElementById('user-list');
        userList.innerHTML = '';

        if (users) {
            Object.keys(users).forEach((userId) => {
                const user = users[userId];
                const userRow = createUserRow(userId, user);
                userList.appendChild(userRow);
            });
        } else {
            userList.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
        }
    }, (error) => {
        console.error('Error loading users:', error);
        document.getElementById('user-list').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading users</td></tr>';
    });
}

// Create user table row
function createUserRow(userId, user) {
    const statusClass = user.status === 'active' ? 'bg-success' : 'bg-secondary';
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${user.name || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.role || 'N/A'}</td>
        <td><span class="badge ${statusClass}">${user.status || 'inactive'}</span></td>
        <td class="text-center">
            <button class="btn btn-sm btn-outline-primary" onclick="editUser('${userId}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${userId}')">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// Save new user to Firebase - FIXED VERSION
function saveUser() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    const password = document.getElementById('userPassword').value;

    // Basic validation
    if (!name || !email || !role || !password) {
        alert('Please fill in all required fields');
        return;
    }

    console.log('Saving user:', { name, email, role, status });

    // Create user data object
    const userData = {
        name: name,
        email: email,
        role: role,
        status: status,
        password: password, // Note: In production, never store passwords in plain text
        createdAt: Date.now(),
        createdBy: currentUser ? currentUser.email : 'system'
    };

    // Generate a unique key for the user
    const newUserRef = database.ref('users').push();
    
    newUserRef.set(userData)
        .then(() => {
            console.log('User saved successfully with ID:', newUserRef.key);
            
            // Add notification for new user creation
            const notificationData = {
                message: `New user ${name} (${role}) added to the system`,
                type: 'success',
                read: false,
                timestamp: Date.now()
            };
            
            return database.ref('notifications').push().set(notificationData);
        })
        .then(() => {
            // Success - close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            document.getElementById('addUserForm').reset();
            
            // Show success message
            alert('User created successfully!');
            
            // Refresh users list
            loadUsers();
        })
        .catch((error) => {
            console.error('Error saving user to database:', error);
            alert('Error creating user: ' + error.message);
        });
}

// Load and display orders for the modal
function loadOrders() {
    database.ref('orders').orderByChild('orderDate').limitToLast(20).on('value', (snapshot) => {
        const orders = snapshot.val();
        const allOrdersList = document.getElementById('all-orders-list');
        allOrdersList.innerHTML = '';

        if (orders) {
            Object.keys(orders).forEach((orderId) => {
                const order = orders[orderId];
                const orderRow = createOrderRow(orderId, order);
                allOrdersList.appendChild(orderRow);
            });
        } else {
            allOrdersList.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
        }
    }, (error) => {
        console.error('Error loading all orders:', error);
        document.getElementById('all-orders-list').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading orders</td></tr>';
    });
}

// Create order table row
function createOrderRow(orderId, order) {
    let statusClass = 'bg-warning text-dark';
    if (order.status === 'delivered') {
        statusClass = 'bg-success';
    } else if (order.status === 'in transit') {
        statusClass = 'bg-info';
    } else if (order.status === 'cancelled') {
        statusClass = 'bg-danger';
    }

    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${orderId}</td>
        <td>${order.supplier || 'N/A'}</td>
        <td>${order.items ? order.items.join(', ') : 'N/A'}</td>
        <td>${order.orderDate || 'N/A'}</td>
        <td>${order.deliveryDate || 'Pending'}</td>
        <td><span class="badge ${statusClass}">${order.status || 'pending'}</span></td>
        <td class="text-center">
            <button class="btn btn-sm btn-outline-primary" onclick="viewOrder('${orderId}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-success" onclick="updateOrderStatus('${orderId}', 'delivered')">
                <i class="fas fa-check"></i>
            </button>
        </td>
    `;
    
    return row;
}

// Load notifications
function loadNotifications() {
    database.ref('notifications').orderByChild('timestamp').limitToLast(5).on('value', (snapshot) => {
        const notifications = snapshot.val();
        const notificationList = document.getElementById('notification-list');
        const notificationCount = document.getElementById('notification-count');
        
        notificationList.innerHTML = '';
        let unreadCount = 0;

        if (notifications) {
            Object.keys(notifications).forEach((notificationId) => {
                const notification = notifications[notificationId];
                if (!notification.read) {
                    unreadCount++;
                }
                const notificationItem = createNotificationItem(notificationId, notification);
                notificationList.appendChild(notificationItem);
            });
        } else {
            notificationList.innerHTML = '<li class="dropdown-item text-center">No notifications</li>';
        }

        notificationCount.textContent = unreadCount;
    }, (error) => {
        console.error('Error loading notifications:', error);
        document.getElementById('notification-count').textContent = '0';
    });
}

// Create notification item
function createNotificationItem(notificationId, notification) {
    const item = document.createElement('li');
    item.className = 'dropdown-item';
    item.style.cursor = 'pointer';
    item.onclick = () => markAsRead(notificationId);
    
    item.innerHTML = `
        <div class="d-flex flex-column">
            <span class="fw-bold">${notification.message}</span>
            <small class="text-muted">${formatTimestamp(notification.timestamp)}</small>
        </div>
    `;
    
    return item;
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
}

// User management functions
function editUser(userId) {
    // Implementation for edit user
    alert(`Edit user ${userId} - Implementation needed`);
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        database.ref('users/' + userId).remove()
            .then(() => {
                alert('User deleted successfully');
            })
            .catch((error) => {
                alert('Error deleting user: ' + error.message);
            });
    }
}

// Order management functions
function viewOrder(orderId) {
    alert(`View order ${orderId} - Implementation needed`);
}

function updateOrderStatus(orderId, status) {
    database.ref('orders/' + orderId).update({
        status: status,
        updatedAt: Date.now()
    })
    .then(() => {
        alert(`Order ${orderId} marked as ${status}`);
    })
    .catch((error) => {
        alert('Error updating order: ' + error.message);
    });
}

// Notification functions
function markAsRead(notificationId) {
    database.ref('notifications/' + notificationId).update({
        read: true
    });
}

function markAllAsRead() {
    database.ref('notifications').once('value')
        .then((snapshot) => {
            const notifications = snapshot.val();
            if (notifications) {
                const updates = {};
                Object.keys(notifications).forEach((notificationId) => {
                    updates[`notifications/${notificationId}/read`] = true;
                });
                database.ref().update(updates);
            }
        });
}

// Action buttons functions
function addSupply() {
    alert('Add Supply functionality - Implementation needed');
}

function placeOrder() {
    alert('Place Order functionality - Implementation needed');
}

function generateReport() {
    alert('Generate Report functionality - Implementation needed');
}

function exportOrders() {
    alert('Export Orders functionality - Implementation needed');
}

// Logout function
document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to log out?')) {
        auth.signOut()
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch((error) => {
                alert('Error signing out: ' + error.message);
            });
    }
});