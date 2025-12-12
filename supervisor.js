// =======================
// SUPERVISOR DASHBOARD JS - COMPLETE FIXED VERSION
// =======================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
    authDomain: "healthtechn-c15da.firebaseapp.com",
    projectId: "healthtechn-c15da",
    storageBucket: "healthtechn-c15da.appspot.com",
    messagingSenderId: "508561693923",
    appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
  };
  
  let db = null;
  let notifications = [];
  let currentApprovalRequestKey = null;
  
  // Initialize Firebase
  function initFirebase() {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      if (!firebase.firestore) {
        console.error("Firestore SDK not loaded!");
        showAlert("Firestore SDK not loaded. Please check script imports.", "danger");
        return null;
      }
      
      db = firebase.firestore();
      console.log("✅ Firestore initialized successfully");
      return db;
    } catch (error) {
      console.error("Firebase initialization error:", error);
      showAlert("Firebase initialization failed: " + error.message, "danger");
      return null;
    }
  }
  
  // Initialize Firebase Listeners for Quotations
  function initializeFirebaseListeners() {
    console.log("🔄 Initializing Firestore listeners...");
    
    // Initialize Firebase
    const firestore = initFirebase();
    if (!firestore) {
      console.error("❌ Firestore initialization failed");
      return;
    }
  
    console.log("🔥 Setting up real-time listener for 'quotation' collection");
  
    // Real-time listener for quotation collection
    db.collection("")
      .orderBy("Date", "desc")
      .onSnapshot(
        (snapshot) => {
          console.log("📊 Quotation snapshot received:", snapshot.size, "documents");
          
          notifications = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log("📄 Document:", doc.id, "Data:", data);
            
            const notification = mapQuotationToNotification(doc.id, data);
            notifications.push(notification);
          });
          
          console.log("📋 Total notifications loaded:", notifications.length);
          
          // Update UI
          loadNotifications();
          updateProcurementCounts();
          
          // Show notification if new quotes arrived
          const pendingQuotes = notifications.filter(n => n.status === 'pending' || !n.status);
          if (pendingQuotes.length > 0) {
            console.log("🆕 New pending quotations:", pendingQuotes.length);
          }
        },
        (error) => {
          console.error("❌ Firestore listener error:", error);
          showAlert("Error loading quotations: " + error.message, "danger");
        }
      );
  }
  
  // Map Firestore document to notification
  function mapQuotationToNotification(docId, data) {
    console.log("Mapping document to notification:", docId);
    
    // Extract data with fallbacks
    const amount = data.AMOUNT || data.amount || data.total || 0;
    const quotationId = data.quotationId || data.quotationid || docId;
    const hospital = data.HOSPITAL || data.hospital || "Unknown Hospital";
    const receiver = data.receiver || data.RECEIVER || "Unknown Receiver";
    const requestor = data.REQUESTOR || data.requestor || "Procurement Staff";
    
    // Extract items
    let items = [];
    let itemsSummary = "";
    
    if (Array.isArray(data.items)) {
      items = data.items;
      itemsSummary = data.items.map(item => 
        `${item.name || 'Item'} (${item.quantity || 0} ${item.unit || 'unit'})`
      ).join(", ");
    } else if (data.itemsSummary) {
      itemsSummary = data.itemsSummary;
    } else if (data.description) {
      itemsSummary = data.description;
    } else {
      itemsSummary = "No item details";
    }
    
    // Handle date
    let timestamp;
    if (data.Date) {
      timestamp = new Date(data.Date);
      if (isNaN(timestamp.getTime())) timestamp = new Date();
    } else {
      timestamp = new Date();
    }
    
    return {
      id: notifications.length + 1,
      firebaseKey: docId,
      title: `Quotation ${quotationId}`,
      message: `Hospital: ${hospital}\nReceiver: ${receiver}\nItems: ${itemsSummary}\nTotal: ₱${amount.toLocaleString()}`,
      type: "quotation",
      priority: data.priority || "high",
      sender: requestor,
      timestamp: timestamp,
      read: data.read === true,
      
      // Quotation data
      requestId: quotationId,
      hospital: hospital,
      receiver: receiver,
      total: amount,
      items: items,
      itemsSummary: itemsSummary,
      status: data.status || "pending",
      requestedBy: requestor,
      description: data.description || itemsSummary,
      date: data.date || timestamp.toISOString().split('T')[0],
      quotationId: quotationId
    };
  }
  
  // Load Procurement/Quotation Requests into modal
  function loadProcurementRequests() {
    console.log("Loading procurement requests for modal...");
    
    const requestsContainer = document.getElementById('requests-container');
    if (!requestsContainer) {
      console.error("❌ requests-container element not found!");
      return;
    }
  
    requestsContainer.innerHTML = '';
  
    // Filter for pending requests
    const pendingRequests = notifications.filter(n => 
      n.status === 'pending' || n.status === 'info-requested' || !n.status
    );
    
    console.log("📋 Pending requests:", pendingRequests.length);
  
    if (pendingRequests.length === 0) {
      requestsContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
          <h5 class="text-muted">No Pending Quotation Requests</h5>
          <p class="text-muted">All quotation requests have been processed.</p>
        </div>
      `;
      return;
    }
  
    pendingRequests.forEach((notification, index) => {
      const requestItem = document.createElement('div');
      requestItem.className = `request-item border rounded p-3 mb-3 ${
        notification.status === 'info-requested' ? 'border-warning' : 'border-primary'
      }`;
      
      // Build items HTML table
      let itemsHtml = '';
      
      if (notification.items && Array.isArray(notification.items) && notification.items.length > 0) {
        itemsHtml = `
          <div class="table-responsive mt-2">
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
        `;
  
        notification.items.forEach((item, idx) => {
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          itemsHtml += `
            <tr>
              <td><strong>${item.name || 'Item ' + (idx + 1)}</strong></td>
              <td>${item.quantity || 0}</td>
              <td>${item.unit || 'unit'}</td>
              <td>₱${(item.price || 0).toLocaleString()}</td>
              <td><strong>₱${itemTotal.toLocaleString()}</strong></td>
            </tr>
          `;
        });
  
        itemsHtml += `
              </tbody>
            </table>
          </div>
        `;
      } else if (notification.itemsSummary) {
        itemsHtml = `
          <div class="alert alert-info mt-2">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Items:</strong> ${notification.itemsSummary}
          </div>
        `;
      } else {
        itemsHtml = '<p class="text-muted mt-2">No item details available.</p>';
      }
  
      requestItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 class="mb-1 text-primary">
              <i class="fas fa-file-invoice-dollar me-2"></i>
              Quotation Request
            </h6>
            <p class="mb-1"><strong>Quotation ID:</strong> ${notification.quotationId || notification.requestId}</p>
          </div>
          <div class="text-end">
            <span class="badge bg-${notification.priority === 'high' ? 'danger' : 
              notification.priority === 'medium' ? 'warning' : 'info'}">
              ${(notification.priority || 'medium').toUpperCase()} PRIORITY
            </span>
            ${notification.status === 'info-requested' 
              ? '<span class="badge bg-warning ms-1">INFO REQUESTED</span>' 
              : ''}
            <span class="badge bg-secondary ms-1">${new Date(notification.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
  
        <div class="row mb-3">
          <div class="col-md-6">
            <p class="mb-1"><strong>Hospital:</strong> ${notification.hospital || 'N/A'}</p>
            <p class="mb-1"><strong>Receiver:</strong> ${notification.receiver || 'N/A'}</p>
          </div>
          <div class="col-md-6">
            <p class="mb-1"><strong>Requested By:</strong> ${notification.requestedBy || 'Unknown'}</p>
            <p class="mb-1"><strong>Date Submitted:</strong> ${notification.date || 'Unknown'}</p>
          </div>
        </div>
  
        ${notification.description ? `
        <div class="mb-3">
          <strong>Description:</strong>
          <p class="mb-1">${notification.description}</p>
        </div>
        ` : ''}
  
        <div class="mb-3">
          <strong>Items Requested:</strong>
          ${itemsHtml}
        </div>
  
        <div class="d-flex justify-content-between align-items-center border-top pt-3">
          <h5 class="text-success mb-0">
            <i class="fas fa-money-bill-wave me-1"></i>
            Total: ₱${(notification.total || 0).toLocaleString()}
          </h5>
          <div class="action-buttons">
            <button class="btn btn-success me-2" 
                    onclick="approveProcurementRequest('${notification.firebaseKey}')"
                    ${notification.status === 'info-requested' ? 'disabled' : ''}>
              <i class="fas fa-check me-1"></i> Approve
            </button>
            <button class="btn btn-warning me-2" 
                    onclick="requestMoreInfo('${notification.firebaseKey}')">
              <i class="fas fa-info-circle me-1"></i> More Info
            </button>
            <button class="btn btn-danger" 
                    onclick="rejectProcurementRequest('${notification.firebaseKey}')"
                    ${notification.status === 'info-requested' ? 'disabled' : ''}>
              <i class="fas fa-times me-1"></i> Reject
            </button>
          </div>
        </div>
      `;
  
      requestsContainer.appendChild(requestItem);
    });
  
    updateProcurementCounts();
  }
  
  // Approve Quotation Request
  function approveProcurementRequest(requestKey) {
    if (!requestKey) {
      showAlert('No request selected.', 'danger');
      return;
    }
  
    currentApprovalRequestKey = requestKey;
    
    const notification = notifications.find(n => n.firebaseKey === requestKey);
    if (!notification) {
      showAlert('Request not found in local data.', 'danger');
      return;
    }
  
    displayApprovalDetails(notification, requestKey);
    
    // Show the approval modal
    const modalElement = document.getElementById('approvalDetailsModal');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
  
  function displayApprovalDetails(notification, requestKey) {
    const contentDiv = document.getElementById('approvalDetailsContent');
    if (!contentDiv) return;
  
    let itemsHtml = '';
    if (notification.items && Array.isArray(notification.items) && notification.items.length > 0) {
      itemsHtml = `
        <div class="table-responsive mt-3">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
      `;
  
      notification.items.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        itemsHtml += `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${item.name || 'Item ' + (index + 1)}</strong></td>
            <td>${item.quantity || 0}</td>
            <td>${item.unit || 'unit'}</td>
            <td>₱${(item.price || 0).toLocaleString()}</td>
            <td><strong>₱${itemTotal.toLocaleString()}</strong></td>
          </tr>
        `;
      });
  
      itemsHtml += `
            </tbody>
          </table>
        </div>
      `;
    } else {
      itemsHtml = `
        <div class="alert alert-info mt-3">
          <i class="fas fa-info-circle me-2"></i>
          <strong>Items Summary:</strong> ${notification.itemsSummary || notification.description || 'No item details provided'}
        </div>
      `;
    }
  
    contentDiv.innerHTML = `
      <div class="row">
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-hashtag me-1"></i>Quotation ID</h6>
          <p class="mb-0"><strong>${notification.quotationId || notification.requestId}</strong></p>
        </div>
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-calendar me-1"></i>Date</h6>
          <p class="mb-0"><strong>${notification.date || new Date(notification.timestamp).toLocaleDateString()}</strong></p>
        </div>
      </div>
  
      <div class="row">
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-hospital me-1"></i>Hospital</h6>
          <p class="mb-0"><strong>${notification.hospital || 'N/A'}</strong></p>
        </div>
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-user me-1"></i>Receiver</h6>
          <p class="mb-0"><strong>${notification.receiver || 'N/A'}</strong></p>
        </div>
      </div>
  
      <div class="row">
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-user-tie me-1"></i>Requested By</h6>
          <p class="mb-0"><strong>${notification.requestedBy || 'Unknown'}</strong></p>
        </div>
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-exclamation-circle me-1"></i>Priority</h6>
          <p class="mb-0">
            <span class="badge bg-${notification.priority === 'high' ? 'danger' : 
              notification.priority === 'medium' ? 'warning' : 'info'}">
              ${(notification.priority || 'medium').toUpperCase()}
            </span>
          </p>
        </div>
      </div>
  
      ${notification.description ? `
      <div class="mb-3">
        <h6 class="text-muted mb-1"><i class="fas fa-align-left me-1"></i>Description</h6>
        <p class="mb-0">${notification.description}</p>
      </div>
      ` : ''}
  
      <div class="mb-3">
        <h6 class="text-muted mb-2"><i class="fas fa-boxes me-1"></i>Items Requested</h6>
        ${itemsHtml}
      </div>
  
      <div class="row">
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-clock me-1"></i>Submitted At</h6>
          <p class="mb-0"><small>${new Date(notification.timestamp).toLocaleString()}</small></p>
        </div>
        <div class="col-md-6 mb-3">
          <h6 class="text-muted mb-1"><i class="fas fa-money-bill-wave me-1"></i>Total Amount</h6>
          <h4 class="mb-0 text-success">₱${(notification.total || 0).toLocaleString()}</h4>
        </div>
      </div>
  
      <div class="alert alert-warning mt-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Review Carefully:</strong> Please verify all items and amounts before approving this quotation.
      </div>
    `;
  }
  
  function confirmApproveRequest() {
    if (!currentApprovalRequestKey) {
      showAlert('Error: No request selected for approval.', 'danger');
      return;
    }
  
    const requestKey = currentApprovalRequestKey;
    const confirmBtn = document.getElementById('confirmApproveBtn');
    
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Approving...';
    }
  
    // Get Firestore instance
    const firestore = initFirebase();
    if (!firestore) {
      showAlert('Firestore not initialized.', 'danger');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check me-1"></i> Confirm Approval';
      }
      return;
    }
  
    const requestRef = db.collection("quotation").doc(requestKey);
  
    requestRef.update({
      status: 'approved',
      approvedBy: 'Supervisor',
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      read: true
    })
    .then(() => {
      console.log("✅ Quotation approved:", requestKey);
      
      // Update local notification
      const notificationIndex = notifications.findIndex(n => n.firebaseKey === requestKey);
      if (notificationIndex !== -1) {
        notifications[notificationIndex].status = 'approved';
        notifications[notificationIndex].read = true;
      }
      
      // Hide modal
      const modalElement = document.getElementById('approvalDetailsModal');
      if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      }
      
      showAlert('Quotation approved successfully!', 'success');
      
      // Refresh UI
      loadNotifications();
      loadProcurementRequests();
      updateProcurementCounts();
      
      currentApprovalRequestKey = null;
    })
    .catch(err => {
      console.error("❌ Error approving quotation:", err);
      showAlert('Error approving quotation: ' + err.message, 'danger');
      
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check me-1"></i> Confirm Approval';
      }
    });
  }
  
  function rejectProcurementRequest(requestKey) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null || reason.trim() === '') {
      showAlert('Rejection cancelled or no reason provided.', 'info');
      return;
    }
  
    const firestore = initFirebase();
    if (!firestore) {
      showAlert('Firestore not initialized.', 'danger');
      return;
    }
  
    const requestRef = db.collection("quotation").doc(requestKey);
  
    requestRef.update({
      status: 'rejected',
      rejectedBy: 'Supervisor',
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason.trim(),
      read: true
    })
    .then(() => {
      console.log("✅ Quotation rejected:", requestKey);
      
      // Update local notification
      const notificationIndex = notifications.findIndex(n => n.firebaseKey === requestKey);
      if (notificationIndex !== -1) {
        notifications[notificationIndex].status = 'rejected';
        notifications[notificationIndex].read = true;
      }
      
      showAlert('Quotation rejected successfully!', 'info');
      
      // Refresh UI
      loadNotifications();
      loadProcurementRequests();
      updateProcurementCounts();
    })
    .catch(err => {
      console.error("❌ Error rejecting quotation:", err);
      showAlert('Error rejecting quotation: ' + err.message, 'danger');
    });
  }
  
  function requestMoreInfo(requestKey) {
    const infoRequest = prompt('What additional information do you need?');
    if (infoRequest === null || infoRequest.trim() === '') {
      showAlert('Info request cancelled or empty.', 'info');
      return;
    }
  
    const firestore = initFirebase();
    if (!firestore) {
      showAlert('Firestore not initialized.', 'danger');
      return;
    }
  
    const requestRef = db.collection("quotation").doc(requestKey);
  
    requestRef.update({
      status: 'info-requested',
      infoRequestedBy: 'Supervisor',
      infoRequestedAt: firebase.firestore.FieldValue.serverTimestamp(),
      infoRequest: infoRequest.trim()
    })
    .then(() => {
      console.log("✅ Info requested for quotation:", requestKey);
      
      // Update local notification
      const notificationIndex = notifications.findIndex(n => n.firebaseKey === requestKey);
      if (notificationIndex !== -1) {
        notifications[notificationIndex].status = 'info-requested';
      }
      
      showAlert('Information request sent successfully!', 'info');
      
      // Refresh UI
      loadNotifications();
      loadProcurementRequests();
      updateProcurementCounts();
    })
    .catch(err => {
      console.error("❌ Error requesting information:", err);
      showAlert('Error requesting information: ' + err.message, 'danger');
    });
  }
  
  // Update Counts
  function updateProcurementCounts() {
    const totalRequests = notifications.length;
    const pendingRequests = notifications.filter(n => 
      n.status === 'pending' || !n.status
    ).length;
    const infoRequested = notifications.filter(n => 
      n.status === 'info-requested'
    ).length;
  
    console.log("📊 Counts - Total:", totalRequests, "Pending:", pendingRequests, "Info Requested:", infoRequested);
  
    const pendingEl = document.getElementById('pending-approvals');
    const procurementEl = document.getElementById('procurement-requests');
  
    if (pendingEl) pendingEl.textContent = pendingRequests + infoRequested;
    if (procurementEl) procurementEl.textContent = totalRequests;
  }
  
  // Load notifications in dropdown
  function loadNotifications() {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;
  
    notificationList.innerHTML = "";
  
    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <li class="px-3 py-2 text-muted small">
          <i class="fas fa-bell-slash me-2"></i>No notifications
        </li>
      `;
    } else {
      // Sort by timestamp (newest first)
      const sortedNotifications = [...notifications].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Take only recent 5 for dropdown
      const recentNotifications = sortedNotifications.slice(0, 5);
  
      recentNotifications.forEach(notification => {
        const timeAgo = getTimeAgo(notification.timestamp);
        const unreadClass = notification.read ? "" : "unread";
        
        const priorityBadge = `
          <span class="badge bg-${notification.priority === 'high' ? 'danger' : 
            notification.priority === 'medium' ? 'warning' : 'info'} ms-2">
            ${(notification.priority || 'medium').toUpperCase()}
          </span>
        `;
  
        notificationList.innerHTML += `
          <li>
            <div class="notification-item ${unreadClass}" 
                 onclick="viewNotification('${notification.firebaseKey}')">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <strong class="d-block">${notification.title}</strong>
                  <small class="text-muted">
                    <i class="fas fa-hospital me-1"></i>${notification.hospital || 'Unknown Hospital'}
                  </small>
                  ${priorityBadge}
                </div>
                <small class="text-muted">${timeAgo}</small>
              </div>
              <div class="mt-2">
                <small>${(notification.message || "").replace(/\n/g, "<br>")}</small>
              </div>
              <div class="notification-actions mt-2">
                <button class="btn btn-sm ${notification.read ? 'btn-outline-secondary' : 'btn-primary'}"
                        onclick="event.stopPropagation(); markAsRead('${notification.firebaseKey}')">
                  <i class="fas fa-${notification.read ? 'envelope-open' : 'envelope'} me-1"></i>
                  ${notification.read ? 'Mark Unread' : 'Mark Read'}
                </button>
                ${notification.status === 'pending' || !notification.status ? `
                <button class="btn btn-sm btn-success ms-1"
                        onclick="event.stopPropagation(); approveProcurementRequest('${notification.firebaseKey}')">
                  <i class="fas fa-check me-1"></i>Approve
                </button>
                ` : ''}
              </div>
            </div>
          </li>
        `;
      });
    }
  
    // Update notification badge count
    const unreadCount = notifications.filter(n => !n.read).length;
    const notifCountEl = document.getElementById("notification-count");
    if (notifCountEl) {
      notifCountEl.textContent = unreadCount;
      notifCountEl.style.display = unreadCount > 0 ? 'inline' : 'none';
    }
  }
  
  // Helper functions
  function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
  
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  }
  
  function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }
  
  function markAsRead(firebaseKey) {
    const notification = notifications.find(n => n.firebaseKey === firebaseKey);
    if (!notification || !db) return;
    
    db.collection("quotation").doc(firebaseKey).update({
      read: !notification.read
    })
    .then(() => {
      notification.read = !notification.read;
      loadNotifications();
    })
    .catch(err => console.error("Error marking as read:", err));
  }
  
  function markAllAsRead() {
    if (!db) return;
  
    const batch = db.batch();
  
    notifications.forEach(notification => {
      if (!notification.read && notification.firebaseKey) {
        const notifRef = db.collection("quotation").doc(notification.firebaseKey);
        batch.update(notifRef, { read: true });
        notification.read = true;
      }
    });
  
    batch.commit()
      .then(() => {
        loadNotifications();
        showAlert("All notifications marked as read", "success");
      })
      .catch(err => {
        console.error("Error marking all as read:", err);
        showAlert("Error marking notifications as read", "danger");
      });
  }
  
  function viewNotification(firebaseKey) {
    const notification = notifications.find(n => n.firebaseKey === firebaseKey);
    if (!notification) return;
  
    alert(
      `Quotation Details:\n\nID: ${notification.quotationId}\nHospital: ${notification.hospital}\nReceiver: ${notification.receiver}\nTotal: ₱${notification.total}\nStatus: ${notification.status}\n\nClick "Approve Requests" button to view full details and take action.`
    );
  }
  
  // Modal function
  function approveRequest() {
    const modalElement = document.getElementById('approveRequestsModal');
    if (modalElement) {
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        modalElement.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
  
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.onclick = () => {
          modalElement.classList.remove('show');
          modalElement.style.display = 'none';
          backdrop.remove();
          document.body.classList.remove('modal-open');
        };
        document.body.appendChild(backdrop);
      }
    }
    loadProcurementRequests();
  }
  
  // Page initialization
  window.onload = function () {
    console.log("🔄 Supervisor dashboard loading...");
    
    // Initialize Firebase and load data
    initializeFirebaseListeners();
    
    // Load other data (employees, supplies)
    if (typeof loadEmployees === 'function') loadEmployees();
    if (typeof loadSupplies === 'function') loadSupplies();
    
    // Set up modal event listeners
    const approveModal = document.getElementById('approveRequestsModal');
    if (approveModal) {
      approveModal.addEventListener('show.bs.modal', function () {
        loadProcurementRequests();
      });
    }
    
    console.log("✅ Supervisor dashboard initialized");
  };
  
  // Export functions to global scope
  window.approveRequest = approveRequest;
  window.approveProcurementRequest = approveProcurementRequest;
  window.confirmApproveRequest = confirmApproveRequest;
  window.rejectProcurementRequest = rejectProcurementRequest;
  window.requestMoreInfo = requestMoreInfo;
  window.markAsRead = markAsRead;
  window.markAllAsRead = markAllAsRead;
  window.viewNotification = viewNotification;