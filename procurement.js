// =======================
// Firebase Init
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

// Initialize Firebase only if it hasn't been initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

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
  if (!toastContainer) return;

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

  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 3000 // Increased from 1000 to 3000 for better readability
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

  // Update order counters
  const pendingEl = document.getElementById("pending-orders");
  const approvedEl = document.getElementById("approved-orders");
  const transitEl = document.getElementById("transit-orders");
  const deliveredEl = document.getElementById("delivered-orders");
  const orderCountEl = document.getElementById("order-count");

  if (pendingEl) pendingEl.textContent = orders.filter(order => order.status === "Pending").length;
  if (approvedEl) approvedEl.textContent = orders.filter(order => order.status === "Approved").length;
  if (transitEl) transitEl.textContent = orders.filter(order => order.status === "In Transit").length;
  if (deliveredEl) deliveredEl.textContent = orders.filter(order => order.status === "Delivered").length;
  if (orderCountEl) orderCountEl.textContent = `${orders.length} orders`;
}

function updateStatus(index) {
  if (index < 0 || index >= orders.length) {
      showToast("Invalid order index", "danger");
      return;
  }

  const validStatuses = ["Pending", "Approved", "In Transit", "Delivered", "Paid"];
  const currentStatus = orders[index].status;
  
  const newStatus = prompt(
      `Enter new status (${validStatuses.join(", ")}):`,
      currentStatus
  );
  
  if (!newStatus || !validStatuses.includes(newStatus)) {
      showToast("Invalid status entered", "warning");
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
      <li>
        <div class="notification-item text-center text-muted py-3">
          <i class="fas fa-bell-slash fa-2x mb-2"></i>
          <p class="mb-0">No notifications</p>
        </div>
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
  if (notifCountEl) notifCountEl.textContent = unreadCount;
}

function markAsRead(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  if (!notification) return;

  notification.read = !notification.read;
  loadNotifications();
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
  if (quotationItems.length === 0) return;
  if (!confirm("Are you sure you want to clear your quotation?")) return;

  quotationItems = [];
  updateQuotationDisplay();
  showToast("Quotation cleared", "info");
}

// SEND TO SUPERVISOR
async function generateQuotation() {
  const hospitalSelect = document.getElementById("hospitalSelect");
  const receiverNameInput = document.getElementById("receiverName");

  if (!hospitalSelect || !receiverNameInput) return;

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
  try {
      const user = firebase.auth().currentUser;
      if (user && user.email) {
          requestedBy = user.email;
      }
  } catch (e) {
      console.log("Could not get user email");
  }

  const payload = {
      title: "Purchase Request Approval Needed",
      message: `Hospital: ${hospitalSelect.value}\nReceiver: ${receiverNameInput.value}\nItems: ${itemsSummary}\nTotal: ₱${totalAmount.toLocaleString()}`,
      type: "purchase-request",
      priority: "high",
      sender: "Procurement System",
      timestamp: Date.now(),
      read: false,
      status: "pending", // Initial status - waiting for supervisor approval
      requestId,
      hospital: hospitalSelect.value,
      receiver: receiverNameInput.value,
      total: totalAmount,
      items: quotationItems,
      requestedBy: requestedBy, // Track who created the quotation
      date: new Date().toISOString().split('T')[0], // Add date field
      description: `Purchase request for ${hospitalSelect.value} - ${itemsSummary}` // Add description
  };

  try {
      const notifRef = db.ref("supervisorNotifications").push();
      await notifRef.set(payload);

      showToast(
          `Quotation generated successfully! Total: ₱${totalAmount.toLocaleString()}`,
          "success"
      );

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
      console.error("Error sending request to supervisor:", error);
      showToast("Failed to send request to supervisor. Please try again.", "danger");
  }
}

// =======================
// Open Quotation Modal
// =======================
function openQuotationModal(event) {
  if (event) event.preventDefault();
  
  const modalElement = document.getElementById("quotationModal");
  if (!modalElement) {
      console.error("Quotation modal not found!");
      showToast("Error: Quotation modal not found. Please refresh the page.", "danger");
      return;
  }

  // Small delay to ensure Bootstrap has processed the data attributes
  setTimeout(() => {
      // Try to use Bootstrap Modal API
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          try {
              let modal = bootstrap.Modal.getInstance(modalElement);
              if (!modal) {
                  modal = new bootstrap.Modal(modalElement);
              }
              modal.show();
          } catch (e) {
              console.warn("Bootstrap modal error, using fallback:", e);
              // Fallback: manually show the modal
              showModalFallback(modalElement);
          }
      } else {
          // Fallback: manually show the modal
          showModalFallback(modalElement);
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
  }, 10);
}

// Fallback function to show modal manually
function showModalFallback(modalElement) {
  modalElement.classList.add("show");
  modalElement.style.display = "block";
  modalElement.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  
  // Remove existing backdrop if any
  const existingBackdrop = document.querySelector(".modal-backdrop");
  if (existingBackdrop) existingBackdrop.remove();
  
  // Add backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop fade show";
  backdrop.onclick = function() {
      hideModalFallback(modalElement);
  };
  document.body.appendChild(backdrop);
}

// Fallback function to hide modal manually
function hideModalFallback(modalElement) {
  modalElement.classList.remove("show");
  modalElement.style.display = "none";
  modalElement.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) backdrop.remove();
}

// Function to close quotation modal
function closeQuotationModal() {
  const modalElement = document.getElementById("quotationModal");
  if (!modalElement) return;

  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      try {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
              modal.hide();
          } else {
              hideModalFallback(modalElement);
          }
      } catch (e) {
          hideModalFallback(modalElement);
      }
  } else {
      hideModalFallback(modalElement);
  }
}

// =======================
// Logout
// =======================
function logoutUser(event) {
  if (event) event.preventDefault();
  if (!confirm("Are you sure you want to log out?")) return;

  setTimeout(() => {
      showToast("You have been logged out successfully.", "success");
      setTimeout(() => {
          window.location.href = "logout.html";
      }, 1500);
  }, 500);
}

// =======================
// Missing Functions
// =======================
function manageSuppliers() {
  showToast("Supplier management feature coming soon!", "info");
}

// =======================
// Init
// =======================
window.addEventListener("load", () => {
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
      // Handle modal close events
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

      // Handle backdrop clicks
      quotationModal.addEventListener("click", function (e) {
          if (e.target === quotationModal) {
              if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                  const modal = bootstrap.Modal.getInstance(quotationModal);
                  if (modal) modal.hide();
              }
          }
      });
  }
});

// Expose global functions
window.createOrder = createOrder;
window.manageSuppliers = manageSuppliers;
window.generateReport = () => showToast("Report feature coming soon!", "info");
window.filterOrders = filterOrders;
window.updateStatus = updateStatus;
window.viewOrder = viewOrder;
window.deleteOrder = deleteOrder;
window.viewAllNotifications = () => alert("Full notifications page coming soon.");
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