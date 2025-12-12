// =======================
// Firebase Init with Firestore
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
  authDomain: "healthtechn-c15da.firebaseapp.com",
  databaseURL: "https://healthtechn-c15da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthtechn-c15da",
  storageBucket: "healthtechn-c15da.appspot.com",
  messagingSenderId: "508561693923",
  appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};

// Check if Firebase is loaded and initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore instead of Realtime Database
const db = firebase.firestore();


// =======================
// Sample Data
// =======================
let orders = [
  { id: "PO123", supplier: "MedSupplies Co.", items: "Masks, Gloves", date: "2023-10-15", status: "Pending" },
  { id: "PO124", supplier: "Global Health Ltd.", items: "Syringes, Sanitizers", date: "2023-10-10", status: "Approved" },
  { id: "PO125", supplier: "Wellness Goods Inc.", items: "Bandages, Antiseptics", date: "2023-10-05", status: "In Transit" },
  { id: "PO126", supplier: "PharmaSource Intl.", items: "Medications, IV Fluids", date: "2023-10-18", status: "Pending" },
  { id: "PO127", supplier: "Surgical Equipment Co.", items: "Surgical Kits, Instruments", date: "2023-10-12", status: "Delivered" }
];

let notifications = [
  {
      id: 1,
      title: "Budget Approval Required",
      message: "Order PO126 exceeds department budget. Please review and provide justification.",
      type: "urgent",
      priority: "high",
      sender: "Finance Supervisor",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      orderId: "PO126"
  },
  {
      id: 2,
      title: "Supplier Performance Review",
      message: "Global Health Ltd. has delayed 3 shipments this quarter. Consider alternative suppliers.",
      type: "info",
      priority: "medium",
      sender: "Procurement Supervisor",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      orderId: "PO124"
  },
  {
      id: 3,
      title: "Contract Renewal Reminder",
      message: "Contract with MedSupplies Co. expires in 15 days. Initiate renewal process.",
      type: "approval",
      priority: "medium",
      sender: "Operations Supervisor",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
      orderId: "PO123"
  },
  {
      id: 4,
      title: "Payment Received - Order PO127",
      message: "Payment for Order PO127 has been received. Amount: ₱12,500. Status updated to Paid.",
      type: "payment",
      priority: "medium",
      sender: "Finance Department",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      orderId: "PO127"
  }
];

// =======================
// Helpers
// =======================
function getTimeAgo(timestamp) {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function getToastIcon(type) {
  switch (type) {
      case "success": return "fa-check-circle";
      case "info": return "fa-info-circle";
      case "warning": return "fa-exclamation-triangle";
      case "danger": return "fa-exclamation-circle";
      default: return "fa-bell";
  }
}

function getToastTitle(type) {
  switch (type) {
      case "success": return "Success";
      case "info": return "Information";
      case "warning": return "Warning";
      case "danger": return "Error";
      default: return "Notification";
  }
}

function showToast(message, type) {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
      // Create toast container if it doesn't exist
      const container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container position-fixed top-0 end-0 p-3";
      container.style.zIndex = "1050";
      document.body.appendChild(container);
  }

  const finalToastContainer = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="toast-header">
      <i class="fas ${getToastIcon(type)} me-2"></i>
      <strong class="me-auto">${getToastTitle(type)}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  finalToastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 3000
  });

  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => {
      toast.remove();
  });
}

// =======================
// Orders
// =======================
function loadOrders() {
  const orderList = document.getElementById("order-list");
  if (!orderList) return;

  orderList.innerHTML = "";

  orders.forEach((order, index) => {
      let statusClass;
      switch (order.status) {
          case "Pending": statusClass = "status-pending"; break;
          case "Approved": statusClass = "status-approved"; break;
          case "In Transit": statusClass = "status-transit"; break;
          case "Delivered": statusClass = "status-delivered"; break;
          case "Paid": statusClass = "status-paid"; break;
          default: statusClass = "status-pending";
      }

      const statusBadge = `<span class="status-badge ${statusClass}">${order.status}</span>`;

      const row = `
      <tr>
        <td>${order.id}</td>
        <td>${order.supplier}</td>
        <td>${order.items}</td>
        <td>${order.date}</td>
        <td>${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="updateStatus(${index})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-info me-1" onclick="viewOrder(${index})">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;

      orderList.innerHTML += row;
  });

  // Update order counts
  const pendingOrdersEl = document.getElementById("pending-orders");
  const approvedOrdersEl = document.getElementById("approved-orders");
  const transitOrdersEl = document.getElementById("transit-orders");
  const deliveredOrdersEl = document.getElementById("delivered-orders");
  const orderCountEl = document.getElementById("order-count");

  if (pendingOrdersEl) pendingOrdersEl.textContent = orders.filter(order => order.status === "Pending").length;
  if (approvedOrdersEl) approvedOrdersEl.textContent = orders.filter(order => order.status === "Approved").length;
  if (transitOrdersEl) transitOrdersEl.textContent = orders.filter(order => order.status === "In Transit").length;
  if (deliveredOrdersEl) deliveredOrdersEl.textContent = orders.filter(order => order.status === "Delivered").length;
  if (orderCountEl) orderCountEl.textContent = `${orders.length} orders`;
}

function updateStatus(index) {
  if (index < 0 || index >= orders.length) {
      showToast("Invalid order index", "danger");
      return;
  }
  
  const newStatus = prompt(
      "Enter new status (Pending, Approved, In Transit, Delivered, Paid):",
      orders[index].status
  );
  if (!newStatus) return;

  const validStatuses = ["Pending", "Approved", "In Transit", "Delivered", "Paid"];
  if (!validStatuses.includes(newStatus)) {
      showToast("Invalid status. Please use: Pending, Approved, In Transit, Delivered, or Paid", "warning");
      return;
  }

  orders[index].status = newStatus;
  loadOrders();
  showToast(`Order ${orders[index].id} status updated to ${newStatus}`, "success");

  if (newStatus === "Paid") {
      addPaymentNotification(orders[index].id);
  }
}

function viewOrder(index) {
  if (index < 0 || index >= orders.length) {
      showToast("Invalid order index", "danger");
      return;
  }
  
  const order = orders[index];
  alert(
      `Order Details:\nID: ${order.id}\nSupplier: ${order.supplier}\nItems: ${order.items}\nDate: ${order.date}\nStatus: ${order.status}`
  );
}

function deleteOrder(index) {
  if (index < 0 || index >= orders.length) {
      showToast("Invalid order index", "danger");
      return;
  }
  
  if (!confirm(`Are you sure you want to delete order ${orders[index].id}?`)) return;

  const deletedId = orders[index].id;
  orders.splice(index, 1);
  loadOrders();
  showToast(`Order ${deletedId} has been deleted.`, "info");
}

function createOrder() {
  const supplierName = prompt("Enter supplier name:");
  if (!supplierName) return;

  const items = prompt("Enter items (comma separated):");
  if (!items) return;

  const orderId = "PO" + (orders.length + 123);
  const date = new Date().toISOString().split("T")[0];

  orders.push({
      id: orderId,
      supplier: supplierName,
      items,
      date,
      status: "Pending"
  });

  loadOrders();
  showToast(`Order ${orderId} created successfully!`, "success");
}

function filterOrders(type) {
  showToast(`Filtering by: ${type}`, "info");
  // Implement actual filtering logic here
}

// =======================
// Notifications
// =======================
function loadNotifications() {
  const notificationList = document.getElementById("notification-list");
  if (!notificationList) return;

  notificationList.innerHTML = "";

  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  const recentNotifications = sortedNotifications.slice(0, 5);

  if (recentNotifications.length === 0) {
      notificationList.innerHTML = `
      <li class="text-center text-muted py-3">
        <i class="fas fa-bell-slash fa-2x mb-2"></i>
        <p class="mb-0">No notifications</p>
      </li>
      `;
  } else {
      recentNotifications.forEach(notification => {
          const timeAgo = getTimeAgo(notification.timestamp);
          const unreadClass = notification.read ? "" : "unread";
          const priorityBadge = `
          <span class="notification-priority priority-${notification.priority}">
            ${notification.priority.toUpperCase()}
          </span>
        `;

          notificationList.innerHTML += `
          <li>
            <div class="notification-item ${unreadClass} ${notification.type}" onclick="viewNotification(${notification.id})">
              <div class="d-flex justify-content-between">
                <strong>${notification.title}</strong>
                <span class="notification-time">${timeAgo}</span>
              </div>
              <div class="mt-1">${notification.message}</div>
              <div class="d-flex justify-content-between mt-1">
                <small><i class="fas fa-user-tie"></i> ${notification.sender}</small>
                ${priorityBadge}
              </div>
              <div class="notification-actions">
                <button class="btn btn-sm ${notification.read ? "btn-outline-secondary" : "btn-primary"}"
                        onclick="event.stopPropagation(); markAsRead(${notification.id})">
                  ${notification.read ? "Mark as Unread" : "Mark as Read"}
                </button>
                <button class="btn btn-sm btn-outline-danger"
                        onclick="event.stopPropagation(); deleteNotification(${notification.id})">
                  Delete
                </button>
                ${notification.orderId
                  ? `<button class="btn btn-sm btn-outline-info"
                         onclick="event.stopPropagation(); viewRelatedOrder('${notification.orderId}')">
                         View Order
                       </button>`
                  : ""
              }
              </div>
            </div>
          </li>
        `;
      });
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const notifCountEl = document.getElementById("notification-count");
  if (notifCountEl) {
      notifCountEl.textContent = unreadCount;
      notifCountEl.style.display = unreadCount > 0 ? "inline-block" : "none";
  }
}

function markAsRead(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  if (!notification) return;

  notification.read = !notification.read;
  loadNotifications();
  showToast(notification.read ? "Notification marked as read" : "Notification marked as unread", "info");
}

function markAllAsRead() {
  notifications.forEach(notification => {
      notification.read = true;
  });
  loadNotifications();
  showToast("All notifications marked as read", "success");
}

function deleteNotification(notificationId) {
  notifications = notifications.filter(n => n.id !== notificationId);
  loadNotifications();
  showToast("Notification deleted", "info");
}

function viewNotification(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  if (!notification) return;

  alert(
      `Notification Details:\n\nTitle: ${notification.title}\nMessage: ${notification.message}\nFrom: ${notification.sender}\nPriority: ${notification.priority}\nTime: ${notification.timestamp.toLocaleString()}`
  );

  if (!notification.read) {
      markAsRead(notificationId);
  }
}

function viewRelatedOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
      showToast("Order not found", "warning");
      return;
  }

  alert(
      `Order Details:\nID: ${order.id}\nSupplier: ${order.supplier}\nItems: ${order.items}\nDate: ${order.date}\nStatus: ${order.status}`
  );
}

// =======================
// Payment Notification
// =======================
function addPaymentNotification(orderId) {
  const paymentNotification = {
      id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
      title: "Payment Received",
      message: `Payment for Order ${orderId} has been received.`,
      type: "payment",
      priority: "medium",
      sender: "Finance Department",
      timestamp: new Date(),
      read: false,
      orderId
  };

  notifications.unshift(paymentNotification);
  loadNotifications();
  showToast(`Payment notification added for order ${orderId}`, "success");
}

// =======================
// Quotation
// =======================
let quotationItems = [];
let quotationTotal = 0;

function addToQuotation(productName, price, unit) {
  const existingItem = quotationItems.find(item => item.name === productName);

  if (existingItem) {
      existingItem.quantity += 1;
  } else {
      quotationItems.push({
          name: productName,
          price,
          unit,
          quantity: 1
      });
  }

  updateQuotationDisplay();
  showToast(`${productName} added to quotation`, "success");
}

function updateQuotationDisplay() {
  const quotationItemsElement = document.getElementById("quotationItems");
  const quotationTotalElement = document.getElementById("quotationTotal");
  const totalAmountElement = document.getElementById("totalAmount");
  const generateQuoteBtn = document.getElementById("generateQuoteBtn");

  if (!quotationItemsElement || !quotationTotalElement || !totalAmountElement || !generateQuoteBtn) return;

  quotationItemsElement.innerHTML = "";
  quotationTotal = 0;

  if (quotationItems.length === 0) {
      quotationItemsElement.innerHTML = `
      <div class="empty-quotation text-center text-muted py-4">
        <i class="fas fa-shopping-cart fa-2x mb-2"></i>
        <p class="mb-0">Your quotation is empty</p>
        <small>Add products from above to create a quotation</small>
      </div>
    `;
      quotationTotalElement.classList.add("d-none");
      generateQuoteBtn.disabled = true;
      return;
  }

  quotationItems.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      quotationTotal += itemTotal;

      const itemElement = document.createElement("div");
      itemElement.className = "quotation-item";
      itemElement.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <strong>${item.name}</strong><br>
          <small class="text-muted">₱${item.price.toLocaleString()} / ${item.unit}</small>
          <div class="quantity-controls mt-1">
            <button class="btn btn-sm btn-outline-secondary quantity-btn" onclick="updateQuotationQuantity(${index}, -1)">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="form-control form-control-sm quantity-input"
                   value="${item.quantity}" min="1"
                   onchange="updateQuotationQuantityInput(${index}, this.value)">
            <button class="btn btn-sm btn-outline-secondary quantity-btn" onclick="updateQuotationQuantity(${index}, 1)">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold">₱${itemTotal.toLocaleString()}</div>
          <button class="btn btn-sm btn-outline-danger mt-1" onclick="removeFromQuotation(${index})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

      quotationItemsElement.appendChild(itemElement);
  });

  totalAmountElement.textContent = quotationTotal.toLocaleString();
  quotationTotalElement.classList.remove("d-none");
  generateQuoteBtn.disabled = false;
}

function updateQuotationQuantity(index, change) {
  if (index < 0 || index >= quotationItems.length) return;
  
  quotationItems[index].quantity += change;
  if (quotationItems[index].quantity < 1) {
      quotationItems[index].quantity = 1;
  }
  updateQuotationDisplay();
}

function updateQuotationQuantityInput(index, value) {
  if (index < 0 || index >= quotationItems.length) return;
  
  const quantity = parseInt(value);
  if (quantity > 0) {
      quotationItems[index].quantity = quantity;
      updateQuotationDisplay();
  }
}

function removeFromQuotation(index) {
  if (index < 0 || index >= quotationItems.length) return;
  
  const itemName = quotationItems[index].name;
  quotationItems.splice(index, 1);
  updateQuotationDisplay();
  showToast(`${itemName} removed from quotation`, "info");
}

function clearQuotation() {
  if (quotationItems.length === 0) {
      showToast("Quotation is already empty", "info");
      return;
  }
  
  if (!confirm("Are you sure you want to clear your quotation?")) return;

  quotationItems = [];
  updateQuotationDisplay();
  showToast("Quotation cleared", "info");
}

// =======================
// FIREBASE FIRESTORE FUNCTIONS
// =======================

// SEND TO SUPERVISOR using Firestore
async function generateQuotation() {
  const hospitalSelect = document.getElementById("hospitalSelect");
  const receiverNameInput = document.getElementById("receiverName");

  if (!hospitalSelect || !receiverNameInput) {
    showToast("Form elements not found", "danger");
    return;
  }

  if (!hospitalSelect.value) {
    showToast("Please select a hospital before generating the quotation.", "danger");
    return;
  }

  if (!receiverNameInput.value.trim()) {
    showToast("Please enter the receiver / customer name.", "danger");
    return;
  }

  if (!quotationItems || quotationItems.length === 0) {
    showToast("Please add at least one item to your quotation.", "danger");
    return;
  }

  const requestId = "REQ-" + Date.now();
  const itemsSummary = quotationItems
    .map(item => `${item.name} x${item.quantity}`)
    .join(", ");

  const totalAmount = quotationTotal || 0;

  // Get current user info if available
  let requestedBy = "Procurement User";
  let userId = null;
  let userEmail = null;
  try {
    const user = firebase.auth().currentUser;
    if (user) {
      requestedBy = user.email || user.displayName || "Procurement User";
      userId = user.uid;
      userEmail = user.email;
    }
  } catch (e) {
    console.log("Could not get user info:", e);
  }

  // Create Firestore document data
  const quotationData = {
    title: "Purchase Request Approval Needed",
    message: `Hospital: ${hospitalSelect.value}\nReceiver: ${receiverNameInput.value}\nItems: ${itemsSummary}\nTotal: ₱${totalAmount.toLocaleString()}`,
    type: "purchase-request",
    priority: "high",
    sender: "Procurement System",
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    read: false,
    status: "pending",
    requestId: requestId,
    hospital: hospitalSelect.value,
    receiver: receiverNameInput.value,
    total: totalAmount,
    items: quotationItems,
    requestedBy: requestedBy,
    userId: userId,
    userEmail: userEmail,
    date: new Date().toISOString().split('T')[0],
    description: `Purchase request for ${hospitalSelect.value} - ${itemsSummary}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    // Save to Firestore collection "supervisorQuotations"
    const docRef = await db.collection("quotation").add(quotationData);
    
    showToast(
      `Quotation sent to supervisor! Request ID: ${requestId}. Total: ₱${totalAmount.toLocaleString()}`,
      "success"
    );

    // Also save to a separate collection for tracking
    await db.collection("quotations").doc(quotationId).set({
      ...quotationData,
      firestoreDocId: docRef.id
    });

    const modalEl = document.getElementById("quotationModal");
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    quotationItems = [];
    updateQuotationDisplay();

    hospitalSelect.value = "";
    receiverNameInput.value = "";
    receiverNameInput.disabled = true;
  } catch (error) {
    console.error("Error sending request to supervisor via Firestore:", error);
    showToast("Failed to send request to supervisor. Please try again.", "danger");
  }
}

// =======================
// Additional Firestore Management Functions
// =======================

// Load supervisor quotations from Firestore (for supervisor dashboard)
async function loadSupervisorQuotations() {
  try {
    const querySnapshot = await db.collection("supervisorQuotations")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();
    
    const quotations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quotations.push({
        id: doc.id,
        firestoreId: doc.id,
        ...data,
        // Convert Firestore timestamp to Date if needed
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
      });
    });
    
    return quotations;
  } catch (error) {
    console.error("Error loading supervisor quotations:", error);
    showToast("Error loading quotations", "danger");
    return [];
  }
}

// Update quotation status in Firestore
async function updateQuotationStatus(quotationId, newStatus) {
  try {
    await db.collection("supervisorQuotations").doc(quotationId).update({
      status: newStatus,
      updatedAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    });
    showToast(`Quotation status updated to ${newStatus}`, "success");
    return true;
  } catch (error) {
    console.error("Error updating quotation status:", error);
    showToast("Failed to update quotation status", "danger");
    return false;
  }
}

// Delete quotation from Firestore
async function deleteQuotation(quotationId) {
  try {
    await db.collection("supervisorQuotations").doc(quotationId).delete();
    showToast("Quotation deleted successfully", "success");
    return true;
  } catch (error) {
    console.error("Error deleting quotation:", error);
    showToast("Failed to delete quotation", "danger");
    return false;
  }
}

// Load user's quotation history
async function loadUserQuotationHistory() {
  try {
    const user = firebase.auth().currentUser;
    if (!user) return [];

    const querySnapshot = await db.collection("supervisorQuotations")
      .where("userId", "==", user.uid)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();
    
    const quotations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quotations.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
      });
    });
    
    return quotations;
  } catch (error) {
    console.error("Error loading user quotation history:", error);
    return [];
  }
}

// =======================
// Open Quotation Modal
// =======================
function openQuotationModal(event) {
  event?.preventDefault();
  
  const modalElement = document.getElementById("quotationModal");
  if (!modalElement) {
      console.error("Quotation modal not found!");
      showToast("Error: Quotation modal not found. Please refresh the page.", "danger");
      return;
  }

  // Reset quotation when opening
  quotationItems = [];
  updateQuotationDisplay();
  
  // Reset form fields
  const hospitalSelect = document.getElementById("hospitalSelect");
  const receiverNameInput = document.getElementById("receiverName");
  if (hospitalSelect) hospitalSelect.value = "";
  if (receiverNameInput) {
      receiverNameInput.value = "";
      receiverNameInput.disabled = true;
  }

  // Show modal using Bootstrap
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

// Function to close quotation modal
function closeQuotationModal() {
  const modalElement = document.getElementById("quotationModal");
  if (!modalElement) return;

  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
      modal.hide();
  }
}

// =======================
// Logout
// =======================
function logoutUser(event) {
  event?.preventDefault();
  if (!confirm("Are you sure you want to log out?")) return;

  showToast("Logging out...", "info");
  setTimeout(() => {
      // Clear any user session data
      if (typeof firebase !== 'undefined' && firebase.auth) {
          firebase.auth().signOut();
      }
      
      // Redirect to login page
      window.location.href = "login.html";
  }, 1000);
}

// =======================
// Supplier Management (Placeholder)
// =======================
function manageSuppliers() {
  showToast("Supplier management feature coming soon!", "info");
}

// =======================
// Init
// =======================
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
  loadNotifications();

  // Category Filters
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach(button => {
      button.addEventListener("click", function () {
          categoryButtons.forEach(btn => btn.classList.remove("active"));
          this.classList.add("active");

          const category = this.getAttribute("data-category");
          const productItems = document.querySelectorAll(".product-item");
          const categorySections = document.querySelectorAll(".category-section");

          productItems.forEach(item => {
              if (category === "all" || item.getAttribute("data-category") === category) {
                  item.style.display = "block";
              } else {
                  item.style.display = "none";
              }
          });

          categorySections.forEach(section => {
              if (category === "all" || section.id === `${category}-category`) {
                  section.style.display = "block";
              } else {
                  section.style.display = "none";
              }
          });
      });
  });

  // Hospital → Enable receiver
  const hospitalSelect = document.getElementById("hospitalSelect");
  const receiverNameInput = document.getElementById("receiverName");
  if (hospitalSelect && receiverNameInput) {
      hospitalSelect.addEventListener("change", function () {
          if (this.value) {
              receiverNameInput.disabled = false;
              receiverNameInput.focus();
          } else {
              receiverNameInput.disabled = true;
              receiverNameInput.value = "";
          }
      });
  }

  // Setup modal close handlers
  const quotationModal = document.getElementById("quotationModal");
  if (quotationModal) {
      quotationModal.addEventListener("hidden.bs.modal", function () {
          // Reset when modal is closed
          quotationItems = [];
          updateQuotationDisplay();
          if (hospitalSelect) hospitalSelect.value = "";
          if (receiverNameInput) {
              receiverNameInput.value = "";
              receiverNameInput.disabled = true;
          }
      });
  }

  // Initialize Firestore real-time listener for supervisor quotations (if needed)
  initializeFirestoreListeners();

  console.log("Procurement system initialized with Firestore");
});

// Initialize Firestore real-time listeners
function initializeFirestoreListeners() {
  // Listen for new supervisor quotations (for real-time updates)
  try {
    db.collection("supervisorQuotations")
      .orderBy("timestamp", "desc")
      .limit(10)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            console.log("New quotation added:", change.doc.data());
            // You could trigger a notification here
          }
        });
      });
  } catch (error) {
    console.error("Error setting up Firestore listener:", error);
  }
}

// =======================
// Expose Global Functions
// =======================
window.createOrder = createOrder;
window.manageSuppliers = manageSuppliers;
window.generateReport = () => showToast("Report feature coming soon!", "info");
window.filterOrders = filterOrders;
window.updateStatus = updateStatus;
window.viewOrder = viewOrder;
window.deleteOrder = deleteOrder;
window.viewAllNotifications = () => showToast("Full notifications page coming soon!", "info");
window.markAllAsRead = markAllAsRead;
window.markAsRead = markAsRead;
window.deleteNotification = deleteNotification;
window.viewNotification = viewNotification;
window.viewRelatedOrder = viewRelatedOrder;
window.addToQuotation = addToQuotation;
window.updateQuotationQuantity = updateQuotationQuantity;
window.updateQuotationQuantityInput = updateQuotationQuantityInput;
window.removeFromQuotation = removeFromQuotation;
window.clearQuotation = clearQuotation;
window.generateQuotation = generateQuotation;
window.openQuotationModal = openQuotationModal;
window.closeQuotationModal = closeQuotationModal;
window.logoutUser = logoutUser;

// Firestore functions
window.loadSupervisorQuotations = loadSupervisorQuotations;
window.updateQuotationStatus = updateQuotationStatus;
window.deleteQuotation = deleteQuotation;
window.loadUserQuotationHistory = loadUserQuotationHistory;