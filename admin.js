// Global variables
let supplies = [];
let notifications = [];

// Initialize the application
function initApp() {
  // Set up logout link
  document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
  
  // Load data from Firebase
  loadSupplies();
  loadNotifications();
  
  // Set up real-time listeners
  setupRealtimeListeners();
  
  // Simulate receiving new notifications (for demo purposes)
  setInterval(simulateNewNotification, 60000); // Every minute
}

// Set up real-time listeners for data changes
function setupRealtimeListeners() {
  const { database } = window.firebaseServices;
  
  // Listen for supply changes
  database.ref('supplies').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      supplies = Object.values(data);
      loadSupplies();
    } else {
      supplies = [];
      loadSupplies();
    }
  });

  // Listen for notification changes
  database.ref('notifications').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      notifications = Object.values(data);
      loadNotifications();
    } else {
      notifications = [];
      loadNotifications();
    }
  });
}

// Load supplies from Firebase
function loadSupplies() {
  const supplyList = document.getElementById("supply-list");
  supplyList.innerHTML = "";
  
  if (supplies.length === 0) {
    supplyList.innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-muted py-4">
          <i class="fas fa-box-open fa-2x mb-2"></i><br>
          No supplies found. Add your first supply item.
        </td>
      </tr>
    `;
  } else {
    supplies.forEach((item, index) => {
      supplyList.innerHTML += `
        <tr>
          <td>${item.name}</td>
          <td>${item.stock}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-success" onclick="restock(${index})">
              <i class="fas fa-plus-circle"></i> Restock
            </button>
            <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteSupply(${index})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    });
  }

  // Update dashboard summary
  document.getElementById("total-supplies").textContent = supplies.reduce((sum, item) => sum + item.stock, 0);
  document.getElementById("low-stock").textContent = supplies.filter(item => item.stock < 100).length;
}

// Load notifications from Firebase
function loadNotifications() {
  const notificationList = document.getElementById("notification-list");
  notificationList.innerHTML = "";
  
  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  
  // Display only the 5 most recent notifications in the dropdown
  const recentNotifications = sortedNotifications.slice(0, 5);
  
  if (recentNotifications.length === 0) {
    notificationList.innerHTML = `
      <li>
        <div class="notification-item text-center text-muted py-3">
          <i class="fas fa-bell-slash fa-2x mb-2"></i><br>
          No notifications
        </div>
      </li>
    `;
  } else {
    recentNotifications.forEach(notification => {
      const timeAgo = getTimeAgo(notification.timestamp);
      const unreadClass = notification.read ? "" : "unread";
      
      notificationList.innerHTML += `
        <li>
          <div class="notification-item ${unreadClass} ${notification.department}">
            <div class="d-flex justify-content-between">
              <strong>${notification.title}</strong>
              <span class="notification-time">${timeAgo}</span>
            </div>
            <div class="mt-1">${notification.message}</div>
            <div class="mt-2">
              <button class="btn btn-sm ${notification.read ? 'btn-outline-secondary' : 'btn-primary'}" onclick="markAsRead('${notification.id}')">
                ${notification.read ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteNotification('${notification.id}')">
                Delete
              </button>
            </div>
          </div>
        </li>
      `;
    });
  }
  
  // Update notification count
  const unreadCount = notifications.filter(n => !n.read).length;
  document.getElementById("notification-count").textContent = unreadCount;
  document.getElementById("unread-notifications").textContent = unreadCount;
}

// Helper function to format time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Mark notification as read/unread
function markAsRead(notificationId) {
  const { database } = window.firebaseServices;
  const notificationRef = database.ref('notifications').child(notificationId);
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification) {
    notificationRef.update({
      read: !notification.read
    });
  }
}

// Mark all notifications as read
function markAllAsRead() {
  const { database } = window.firebaseServices;
  const updates = {};
  notifications.forEach(notification => {
    if (!notification.read) {
      updates[`${notification.id}/read`] = true;
    }
  });
  
  if (Object.keys(updates).length > 0) {
    database.ref('notifications').update(updates);
  }
}

// Delete notification
function deleteNotification(notificationId) {
  const { database } = window.firebaseServices;
  database.ref('notifications').child(notificationId).remove();
}

// Restock supply item
function restock(index) {
  const { database } = window.firebaseServices;
  const supply = supplies[index];
  if (supply && supply.id) {
    database.ref('supplies').child(supply.id).update({
      stock: supply.stock + 10
    });
  }
}

// Delete supply item
function deleteSupply(index) {
  const { database } = window.firebaseServices;
  const supply = supplies[index];
  if (supply && supply.id) {
    if (confirm(`Are you sure you want to delete "${supply.name}"?`)) {
      database.ref('supplies').child(supply.id).remove();
    }
  }
}

// Add new supply item
function addSupply() {
  const { database } = window.firebaseServices;
  const name = prompt("Enter supply name:");
  if (!name) return;
  
  const stock = parseInt(prompt("Enter initial stock:"));
  if (isNaN(stock) || stock < 0) {
    alert("Invalid stock value. Please enter a valid number.");
    return;
  }
  
  // Create new supply in Firebase
  const newSupplyRef = database.ref('supplies').push();
  newSupplyRef.set({
    id: newSupplyRef.key,
    name: name,
    stock: stock
  });
}

// Logout function
function logout() {
  const { auth } = window.firebaseServices;
  auth.signOut().then(() => {
    // Sign-out successful, redirect happens in auth state listener
  }).catch((error) => {
    console.error("Logout error:", error);
    alert("Error during logout. Please try again.");
  });
}

// Other navigation functions
function manageOrders() {
  window.location.href = "manage-orders.html";
}

function viewRequests() {
  window.location.href = "purchase-requests.html";
}

function viewSystemLogs() {
  alert("System logs would be displayed here in a real application.");
}

// Simulate receiving new notifications (for demo)
function simulateNewNotification() {
  const { database } = window.firebaseServices;
  const departments = ["procurement", "finance"];
  const titles = {
    procurement: ["New Supplier Quote", "Purchase Order Update", "Inventory Audit Request"],
    finance: ["Budget Review Required", "Payment Approval Needed", "Expense Report Submitted"]
  };
  
  const department = departments[Math.floor(Math.random() * departments.length)];
  const title = titles[department][Math.floor(Math.random() * titles[department].length)];
  const messages = {
    procurement: [
      "A new supplier has submitted a quote for medical supplies",
      "Purchase order #PO-2023-0456 has been updated",
      "Quarterly inventory audit scheduled for next week"
    ],
    finance: [
      "Please review the budget allocation for Q4 medical supplies",
      "Payment for vendor MedSupply Corp requires your approval",
      "New expense report from procurement department needs review"
    ]
  };
  
  const message = messages[department][Math.floor(Math.random() * messages[department].length)];
  
  // Create new notification in Firebase
  const newNotificationRef = database.ref('notifications').push();
  newNotificationRef.set({
    id: newNotificationRef.key,
    title: title,
    message: message,
    department: department,
    timestamp: new Date().getTime(),
    read: false
  });
}

// Make functions available globally
window.initApp = initApp;
window.markAllAsRead = markAllAsRead;
window.markAsRead = markAsRead;
window.deleteNotification = deleteNotification;
window.restock = restock;
window.deleteSupply = deleteSupply;
window.addSupply = addSupply;
window.manageOrders = manageOrders;
window.viewRequests = viewRequests;
window.viewSystemLogs = viewSystemLogs;
window.logout = logout;