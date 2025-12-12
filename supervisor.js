// =======================
// SUPERVISOR DASHBOARD JS
// =======================

// -----------------------
// Firebase Setup (Firestore only)
// -----------------------

// Use config from firebase-config.js if provided
const firebaseConfig = window.firebaseConfig || {
    apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
    authDomain: "healthtechn-c15da.firebaseapp.com",
    projectId: "healthtechn-c15da",
    storageBucket: "healthtechn-c15da.appspot.com",
    messagingSenderId: "508561693923",
    appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};

function initFirebase() {
    if (!window.firebase) {
        console.warn("Firebase SDK not loaded. Check your HTML <script> tags.");
        return null;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    if (!firebase.firestore) {
        console.warn("Firestore SDK not loaded. Import firebase-firestore.js.");
        return null;
    }

    return firebase.firestore();
}

// -----------------------
// Local Sample Data (Employees & Supplies)
// -----------------------

let employees = [
    { name: "John Doe", role: "Manager", status: "Active" },
    { name: "Jane Smith", role: "Supervisor", status: "Pending Approval" },
    { name: "Robert Brown", role: "Technician", status: "Active" },
    { name: "Sarah Johnson", role: "Nurse", status: "Pending Approval" },
    { name: "Michael Williams", role: "Pharmacist", status: "Active" }
];

let supplies = [
    { item: "Medical Masks", stock: 120, status: "Adequate", lastOrdered: "2023-10-15" },
    { item: "Disposable Gloves", stock: 45, status: "Low Stock", lastOrdered: "2023-10-10" },
    { item: "Syringes", stock: 200, status: "Adequate", lastOrdered: "2023-10-05" },
    { item: "Sanitizers", stock: 30, status: "Critical", lastOrdered: "2023-10-18" },
    { item: "Bandages", stock: 85, status: "Adequate", lastOrdered: "2023-10-12" }
];

// All quotation requests from Firestore will be stored here
let notifications = [];

// -----------------------
// FIRESTORE LISTENERS & TEST
// -----------------------

function initializeFirebaseListeners() {
    const db = initFirebase();
    if (!db) return;

    console.log("🔥 initFirebaseListeners called");

    // TEST: direct read of /quotation to verify connection
    db.collection("quotation").get()
        .then(snap => {
            console.log("🔥 TEST /quotation docs:", snap.size);
            snap.forEach(d => console.log("🔥 DOC:", d.id, d.data()));

            if (snap.size === 0) {
                showAlert("Firestore connected, pero walang dokumento sa 'quotation' collection.", "warning");
            } else {
                showAlert(`Firestore OK ✔ – ${snap.size} quotation doc(s) loaded.`, "success");
            }
        })
        .catch(err => {
            console.error("🔥 TEST ERROR:", err);
            showAlert("Firestore error: " + err.message, "danger");
        });

    const quotationCol = db.collection("quotation");

    // Initial load (NO orderBy; Date is string)
    quotationCol.get()
        .then(snapshot => {
            notifications = [];
            console.log("Initial quotation load, docs:", snapshot.size);

            snapshot.forEach(doc => {
                const data = doc.data();
                const notif = mapQuotationToNotification(doc.id, data);
                notifications.push(notif);
            });

            console.log("After initial load, notifications:", notifications.length);
            loadNotifications();
            updateProcurementCounts();
        })
        .catch(err => {
            console.error("Error loading quotations:", err);
            showAlert("Error loading quotations: " + err.message, "danger");
        });

    // Real-time updates
    quotationCol.onSnapshot(snapshot => {
        console.log("onSnapshot changes:", snapshot.docChanges().length);
        snapshot.docChanges().forEach(change => {
            const doc = change.doc;
            const data = doc.data();
            const existingIndex = notifications.findIndex(n => n.firebaseKey === doc.id);

            if (change.type === "added") {
                if (existingIndex !== -1) return;
                const notif = mapQuotationToNotification(doc.id, data);
                notifications.unshift(notif);
            }

            if (change.type === "modified") {
                if (existingIndex === -1) return;
                const notif = mapQuotationToNotification(doc.id, data);
                notifications[existingIndex] = notif;
            }

            if (change.type === "removed") {
                notifications = notifications.filter(n => n.firebaseKey !== doc.id);
            }
        });

        console.log("Notifications array now has", notifications.length, "items");
        loadNotifications();
        updateProcurementCounts();
    });
}

// Convert Firestore document fields → unified notification object
function mapQuotationToNotification(docId, data) {
    const amount = data.AMOUNT ?? data.amount ?? data.total ?? 0;
    const quotationId = data.quotationid ?? data.quotationId ?? docId;
    const hospital =
        data.HOSPITAL ??
        data.HOSPTITAL ??
        data.hospital ??
        "";
    const nameDesc =
        data["NAME/DESC"] ??
        data.NAME_DESC ??
        data.nameDesc ??
        "";
    const qty = data.QTY ?? data.qty ?? 0;
    const requestor =
        data.REQUESTOR ??
        data["REQUESTOR "] ??
        data.requestor ??
        data.REQUESTOR_NAME ??
        "";

    // Handle Date as Timestamp OR string
    let ts;
    if (data.Date instanceof firebase.firestore.Timestamp) {
        ts = data.Date.toDate();
    } else if (data.timestamp instanceof firebase.firestore.Timestamp) {
        ts = data.timestamp.toDate();
    } else if (typeof data.Date === "string") {
        ts = new Date(data.Date);
        if (isNaN(ts.getTime())) ts = new Date();
    } else {
        ts = new Date();
    }

    return {
        id: notifications.length + 1,
        firebaseKey: docId,
        title: `Quotation ${quotationId}`,
        message:
            `Hospital: ${hospital}\n` +
            `Item: ${nameDesc}\n` +
            `Qty: ${qty}\n` +
            `Amount: ₱${amount}`,
        type: "purchase-request",
        priority: data.priority || "high",
        sender: requestor || "Procurement Department",
        timestamp: ts,
        read: data.read === true,
        requestId: quotationId,
        hospital: hospital,
        receiver: data.receiver || "",
        total: amount || 0,
        items: data.items || [],
        status: data.status || "pending",
        requestedBy: requestor || "",
        description: data.description || nameDesc || "",
        date: data.date || ts.toISOString().split("T")[0]
    };
}

// -----------------------
// APPROVE REQUESTS MODAL
// -----------------------

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

// -----------------------
// PROCUREMENT / QUOTATION LIST
// -----------------------

function loadProcurementRequests() {
    const requestsContainer = document.getElementById('requests-container');
    if (!requestsContainer) return;

    requestsContainer.innerHTML = '';

    // For now: show ALL notifications (lahat ng quotation docs)
    const procurementRequests = notifications;
    console.log("loadProcurementRequests, count:", procurementRequests.length);

    if (procurementRequests.length === 0) {
        requestsContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                <h5 class="text-muted">No Pending Procurement / Quotation Requests</h5>
                <p class="text-muted">All requests have been processed.</p>
            </div>
        `;
        return;
    }

    procurementRequests.forEach(notification => {
        const requestItem = document.createElement('div');
        requestItem.className =
            `request-item border rounded p-3 mb-3 ` +
            `${notification.status === 'info-requested' ? 'border-warning' : 'border-primary'}`;

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

            notification.items.forEach((item) => {
                const itemTotal = (item.price || 0) * (item.quantity || 0);
                itemsHtml += `
                    <tr>
                        <td><strong>${item.name || 'N/A'}</strong></td>
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
            itemsHtml = '<p class="text-muted">No item details provided.</p>';
        }

        requestItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h6 class="mb-1 text-primary">${notification.title || 'Procurement / Quotation Request'}</h6>
                    <p class="mb-1"><strong>Request ID:</strong> ${notification.requestId}</p>
                </div>
                <div class="text-end">
                    <span class="badge bg-${notification.priority === 'high'
                        ? 'danger'
                        : notification.priority === 'medium'
                            ? 'warning'
                            : 'info'}">
                        ${(notification.priority || 'medium').toUpperCase()} PRIORITY
                    </span>
                    ${notification.status === 'info-requested'
                        ? '<span class="badge bg-warning ms-1">INFO REQUESTED</span>'
                        : ''}
                </div>
            </div>

            <div class="row small mb-2">
                <div class="col-md-6">
                    <p class="mb-1"><strong>Requested By:</strong> ${notification.requestedBy || 'Unknown'}</p>
                    <p class="mb-1"><strong>Hospital:</strong> ${notification.hospital || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Date:</strong> ${notification.date || 'Unknown'}</p>
                    <p class="mb-1"><strong>Receiver:</strong> ${notification.receiver || 'N/A'}</p>
                </div>
            </div>

            <div class="mb-2">
                <strong>Description:</strong>
                <p class="mb-1">${notification.description || 'No description provided'}</p>
            </div>

            <div class="mb-3">
                <strong>Items Requested:</strong>
                ${itemsHtml}
            </div>

            <div class="d-flex justify-content-between align-items-center border-top pt-3">
                <h5 class="text-success mb-0">Total: ₱${(notification.total || 0).toLocaleString()}</h5>
                <div class="action-buttons">
                    <button class="btn btn-success me-1" onclick="approveProcurementRequest('${notification.firebaseKey}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-warning me-1" onclick="requestMoreInfo('${notification.firebaseKey}')">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>
                    <button class="btn btn-danger" onclick="rejectProcurementRequest('${notification.firebaseKey}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `;

        requestsContainer.appendChild(requestItem);
    });

    updateProcurementCounts();
}

// -----------------------
// APPROVE / REJECT / MORE INFO
// -----------------------

let currentApprovalRequestKey = null;

function approveProcurementRequest(requestKey) {
    const db = initFirebase();
    if (!db) return;

    currentApprovalRequestKey = requestKey;
    const requestRef = db.collection("quotation").doc(requestKey);

    requestRef.get()
        .then(doc => {
            if (!doc.exists) {
                showAlert('Request not found.', 'danger');
                return;
            }

            const data = doc.data();
            displayApprovalDetails(data, requestKey);

            const modalElement = document.getElementById('approvalDetailsModal');
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
        })
        .catch(err => {
            console.error("Error loading request details:", err);
            showAlert('Error loading request details. Please try again.', 'danger');
        });
}

function displayApprovalDetails(data, requestKey) {
    const contentDiv = document.getElementById('approvalDetailsContent');
    if (!contentDiv) return;

    let ts;
    if (data.Date instanceof firebase.firestore.Timestamp) {
        ts = data.Date.toDate();
    } else if (data.timestamp instanceof firebase.firestore.Timestamp) {
        ts = data.timestamp.toDate();
    } else if (typeof data.Date === "string") {
        ts = new Date(data.Date);
        if (isNaN(ts.getTime())) ts = new Date();
    } else {
        ts = new Date();
    }

    const timestamp = ts.toLocaleString();
    const date = data.date || ts.toISOString().split('T')[0];

    const amount = data.AMOUNT ?? data.amount ?? data.total ?? 0;
    const quotationId = data.quotationid ?? data.quotationId ?? requestKey;
    const hospital =
        data.HOSPITAL ??
        data.HOSPTITAL ??
        data.hospital ??
        "N/A";
    const receiver = data.receiver || "N/A";
    const requestedBy =
        data.REQUESTOR ??
        data.requestedBy ??
        data.sender ??
        "N/A";
    const description =
        data.description ??
        data["NAME/DESC"] ??
        data.NAME_DESC ??
        data.nameDesc ??
        "No description provided";

    let itemsHtml = '';
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        itemsHtml = `
            <div class="table-responsive mt-3">
                <table class="table table-bordered">
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

        data.items.forEach((item) => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            itemsHtml += `
                <tr>
                    <td><strong>${item.name || 'N/A'}</strong></td>
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
        itemsHtml = '<p class="text-muted">No item details provided.</p>';
    }

    contentDiv.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-hashtag me-1"></i>Request / Quotation ID</h6>
                <p class="mb-0"><strong>${quotationId}</strong></p>
            </div>
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-calendar me-1"></i>Date</h6>
                <p class="mb-0"><strong>${date}</strong></p>
            </div>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-hospital me-1"></i>Hospital</h6>
                <p class="mb-0"><strong>${hospital}</strong></p>
            </div>
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-user me-1"></i>Receiver / Customer</h6>
                <p class="mb-0"><strong>${receiver}</strong></p>
            </div>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-user-tie me-1"></i>Requested By</h6>
                <p class="mb-0"><strong>${requestedBy}</strong></p>
            </div>
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-exclamation-circle me-1"></i>Priority</h6>
                <p class="mb-0">
                    <span class="badge bg-danger">HIGH</span>
                </p>
            </div>
        </div>

        <div class="mb-3">
            <h6 class="text-muted mb-1"><i class="fas fa-align-left me-1"></i>Description</h6>
            <p class="mb-0">${description}</p>
        </div>

        <div class="mb-3">
            <h6 class="text-muted mb-2"><i class="fas fa-boxes me-1"></i>Items</h6>
            ${itemsHtml}
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-clock me-1"></i>Submitted At</h6>
                <p class="mb-0"><small>${timestamp}</small></p>
            </div>
            <div class="col-md-6 mb-3">
                <h6 class="text-muted mb-1"><i class="fas fa-money-bill-wave me-1"></i>Total Amount</h6>
                <h4 class="mb-0 text-success">₱${(amount || 0).toLocaleString()}</h4>
            </div>
        </div>

        <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Note:</strong> Review all details above before confirming approval. This action cannot be undone.
        </div>
    `;
}

function confirmApproveRequest() {
    if (!currentApprovalRequestKey) {
        showAlert('Error: No request selected for approval.', 'danger');
        return;
    }

    const db = initFirebase();
    if (!db) return;

    const requestKey = currentApprovalRequestKey;
    const requestRef = db.collection("quotation").doc(requestKey);
    const approvedRef = db.collection("approvedProcurementRequests").doc();

    const confirmBtn = document.getElementById('confirmApproveBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Approving...';
    }

    requestRef.get()
        .then(doc => {
            if (!doc.exists) throw new Error("Request not found");

            const data = doc.data();
            const approvedPayload = {
                ...data,
                status: 'approved',
                approvedBy: 'Supervisor',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                read: true,
                sourceKey: requestKey
            };

            return approvedRef.set(approvedPayload);
        })
        .then(() => {
            return requestRef.update({
                status: 'approved',
                approvedBy: 'Supervisor',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                read: true
            });
        })
        .then(() => {
            const modalElement = document.getElementById('approvalDetailsModal');
            if (modalElement) {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                } else {
                    modalElement.classList.remove('show');
                    modalElement.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                }
            }

            showAlert('Procurement / quotation request approved successfully!', 'success');

            const notification = notifications.find(n => n.firebaseKey === requestKey);
            if (notification) {
                notification.status = 'approved';
                notification.read = true;
                loadNotifications();
                updateProcurementCounts();
                loadProcurementRequests();
            }

            currentApprovalRequestKey = null;
        })
        .catch(err => {
            console.error("Error approving request:", err);
            showAlert('Error approving request. Please try again.', 'danger');

            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-check me-1"></i>Confirm Approval';
            }
        });
}

function rejectProcurementRequest(requestKey) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;

    const db = initFirebase();
    if (!db) return;

    const requestRef = db.collection("quotation").doc(requestKey);

    requestRef.update({
        status: 'rejected',
        rejectedBy: 'Supervisor',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectionReason: reason,
        read: true
    })
        .then(() => {
            showAlert('Procurement / quotation request rejected successfully!', 'info');

            const notification = notifications.find(n => n.firebaseKey === requestKey);
            if (notification) {
                notification.status = 'rejected';
                notification.read = true;
                loadNotifications();
                updateProcurementCounts();
                loadProcurementRequests();
            }
        })
        .catch(err => {
            console.error("Error rejecting request:", err);
            showAlert('Error rejecting request. Please try again.', 'danger');
        });
}

function requestMoreInfo(requestKey) {
    const infoRequest = prompt('What additional information do you need?');
    if (infoRequest === null) return;

    const db = initFirebase();
    if (!db) return;

    const requestRef = db.collection("quotation").doc(requestKey);

    requestRef.update({
        status: 'info-requested',
        infoRequestedBy: 'Supervisor',
        infoRequestedAt: firebase.firestore.FieldValue.serverTimestamp(),
        infoRequest: infoRequest
    })
        .then(() => {
            showAlert('Information request sent successfully!', 'info');

            const notification = notifications.find(n => n.firebaseKey === requestKey);
            if (notification) {
                notification.status = 'info-requested';
                loadNotifications();
                updateProcurementCounts();
                loadProcurementRequests();
            }
        })
        .catch(err => {
            console.error("Error requesting information:", err);
            showAlert('Error requesting information. Please try again.', 'danger');
        });
}

function updateProcurementCounts() {
    const procurementRequests = notifications;
    const pendingRequests = procurementRequests.filter(
        n => n.status === 'pending' || !n.status
    );

    const pendingEl = document.getElementById('pending-approvals');
    const procurementEl = document.getElementById('procurement-requests');

    console.log("updateProcurementCounts -> total:", procurementRequests.length, "pending:", pendingRequests.length);

    if (pendingEl) pendingEl.textContent = pendingRequests.length;
    if (procurementEl) procurementEl.textContent = procurementRequests.length;
}

// -----------------------
// EMPLOYEES & SUPPLIES (unchanged)
// -----------------------

function loadEmployees() {
    const employeeList = document.getElementById("supervisor-list");
    if (!employeeList) return;

    employeeList.innerHTML = "";

    employees.forEach((employee, index) => {
        const statusClass = employee.status === "Active" ? "status-active" : "status-pending";
        const statusBadge = `<span class="status-badge ${statusClass}">${employee.status}</span>`;

        const row = `
            <tr>
                <td>${employee.name}</td>
                <td>${employee.role}</td>
                <td>${statusBadge}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-success me-1" onclick="approveEmployee(${index})" title="Approve">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewEmployee(${index})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        employeeList.innerHTML += row;
    });

    const totalEmpEl = document.getElementById("total-employees");
    const empCountEl = document.getElementById("employee-count");

    if (totalEmpEl) totalEmpEl.textContent = employees.length;
    if (empCountEl) empCountEl.textContent = `${employees.length} employees`;

    updateProcurementCounts();
}

function loadSupplies() {
    const supplyList = document.getElementById("supply-list");
    if (!supplyList) return;

    supplyList.innerHTML = "";

    supplies.forEach((supply, index) => {
        const statusClass = supply.status === "Adequate" ? "status-active" : "status-pending";
        const statusBadge = `<span class="status-badge ${statusClass}">${supply.status}</span>`;

        const row = `
            <tr>
                <td>${supply.item}</td>
                <td>${supply.stock}</td>
                <td>${statusBadge}</td>
                <td>${supply.lastOrdered}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-success me-1" onclick="reorderSupply(${index})" title="Reorder">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewSupply(${index})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>`;
        supplyList.innerHTML += row;
    });

    const supplyCountEl = document.getElementById("supply-count");
    if (supplyCountEl) supplyCountEl.textContent = `${supplies.length} items`;
}

// -----------------------
// NOTIFICATION DROPDOWN
// -----------------------

function loadNotifications() {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;

    notificationList.innerHTML = "";

    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <li class="px-3 py-2 text-muted small">No notifications.</li>
        `;
    } else {
        const sortedNotifications = [...notifications].sort(
            (a, b) => b.timestamp - a.timestamp
        );
        const recentNotifications = sortedNotifications.slice(0, 5);

        recentNotifications.forEach(notification => {
            const timeAgo = getTimeAgo(notification.timestamp);
            const unreadClass = notification.read ? "" : "unread";
            const priorityBadge = `
                <span class="notification-priority priority-${notification.priority}">
                    ${(notification.priority || '').toUpperCase()}
                </span>`;

            let statusHtml = '';
            if (notification.status) {
                const statusClass =
                    notification.status === 'approved'
                        ? 'success'
                        : notification.status === 'rejected'
                            ? 'danger'
                            : 'warning';
                statusHtml = `
                    <div class="mt-1">
                        <small><strong>Status:</strong>
                        <span class="badge bg-${statusClass}">${notification.status.toUpperCase()}</span></small>
                    </div>`;
            }

            let actionsHtml = `
                <button class="btn btn-sm ${notification.read ? "btn-outline-secondary" : "btn-primary"} me-1"
                    onclick="event.stopPropagation(); markAsRead('${notification.firebaseKey}')">
                    ${notification.read ? "Mark as Unread" : "Mark as Read"}
                </button>
                <button class="btn btn-sm btn-outline-danger"
                    onclick="event.stopPropagation(); deleteNotification('${notification.firebaseKey}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;

            if (!notification.status || notification.status === 'pending' || notification.status === 'info-requested') {
                actionsHtml =
                    `<button class="btn btn-sm btn-success me-1"
                        onclick="event.stopPropagation(); approveProcurementRequest('${notification.firebaseKey}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger me-1"
                        onclick="event.stopPropagation(); rejectProcurementRequest('${notification.firebaseKey}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn btn-sm btn-warning me-1"
                        onclick="event.stopPropagation(); requestMoreInfo('${notification.firebaseKey}')">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>` + actionsHtml;
            }

            notificationList.innerHTML += `
                <li>
                    <div class="notification-item ${unreadClass} ${notification.type}"
                        onclick="viewNotification('${notification.firebaseKey}')">
                        <div class="d-flex justify-content-between">
                            <strong>${notification.title}</strong>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                        <div class="mt-1">${(notification.message || "").replace(/\n/g, "<br>")}</div>
                        <div class="d-flex justify-content-between mt-1">
                            <small><i class="fas fa-user-tie"></i> ${notification.sender}</small>
                            ${priorityBadge}
                        </div>
                        ${statusHtml}
                        <div class="notification-actions mt-2">
                            ${actionsHtml}
                        </div>
                    </div>
                </li>
            `;
        });
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    const notifCountEl = document.getElementById("notification-count");
    if (notifCountEl) notifCountEl.textContent = unreadCount;

    console.log("loadNotifications -> notifications:", notifications.length, "unread:", unreadCount);
}

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

function markAsRead(firebaseKey) {
    const notification = notifications.find(n => n.firebaseKey === firebaseKey);
    if (!notification) return;

    const db = initFirebase();
    if (!db) return;

    db.collection("quotation")
        .doc(firebaseKey)
        .update({ read: !notification.read })
        .then(() => {
            notification.read = !notification.read;
            loadNotifications();
        })
        .catch(err => {
            console.error("Error updating read status:", err);
        });
}

function markAllAsRead() {
    const db = initFirebase();
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

function deleteNotification(firebaseKey) {
    const db = initFirebase();
    if (!db) return;

    db.collection("quotation")
        .doc(firebaseKey)
        .delete()
        .then(() => {
            notifications = notifications.filter(n => n.firebaseKey !== firebaseKey);
            loadNotifications();
            updateProcurementCounts();
            showAlert("Notification deleted", "info");
        })
        .catch(err => {
            console.error("Error deleting notification:", err);
            showAlert("Error deleting notification", "danger");
        });
}

function viewNotification(firebaseKey) {
    const notification = notifications.find(n => n.firebaseKey === firebaseKey);
    if (!notification) return;

    let extra = "";
    if (notification.hospital) extra += `\nHospital: ${notification.hospital}`;
    if (notification.receiver) extra += `\nReceiver: ${notification.receiver}`;
    if (notification.total) extra += `\nTotal: ₱${notification.total.toLocaleString()}`;
    if (notification.status) extra += `\nStatus: ${notification.status}`;
    if (notification.requestedBy) extra += `\nRequested By: ${notification.requestedBy}`;

    alert(
        `Notification Details:

Title: ${notification.title}
Message:
${notification.message || ""}

From: ${notification.sender}
Priority: ${notification.priority}${extra}
Time: ${notification.timestamp.toLocaleString()}`
    );

    if (!notification.read) {
        markAsRead(firebaseKey);
    }
}

// -----------------------
// OTHER UI ACTIONS
// -----------------------

function approveEmployee(index) {
    employees[index].status = "Active";
    loadEmployees();
    showAlert(`Employee ${employees[index].name} has been approved.`, "success");
}

function viewEmployee(index) {
    alert(
        `Viewing details for: ${employees[index].name}\nRole: ${employees[index].role}\nStatus: ${employees[index].status}`
    );
}

function deleteEmployee(index) {
    if (!confirm(`Are you sure you want to remove ${employees[index].name} from the system?`)) return;

    const removedEmployee = employees[index].name;
    employees.splice(index, 1);
    loadEmployees();
    showAlert(`Employee ${removedEmployee} has been removed.`, "info");
}

function reorderSupply(index) {
    supplies[index].stock += 50;
    supplies[index].lastOrdered = new Date().toISOString().split("T")[0];
    supplies[index].status = "Adequate";
    loadSupplies();
    showAlert(`Successfully reordered ${supplies[index].item}. Stock updated.`, "success");
}

function viewSupply(index) {
    alert(
        `Supply Details:\nItem: ${supplies[index].item}\nCurrent Stock: ${supplies[index].stock}\nStatus: ${supplies[index].status}\nLast Ordered: ${supplies[index].lastOrdered}`
    );
}

function approveAllEmployees() {
    const pendingEmployees = employees.filter(emp => emp.status === "Pending Approval");
    if (pendingEmployees.length === 0) {
        showAlert("No pending approvals at this time.", "info");
        return;
    }

    if (!confirm(`Approve all ${pendingEmployees.length} pending employees?`)) return;

    employees.forEach(emp => {
        if (emp.status === "Pending Approval") {
            emp.status = "Active";
        }
    });
    loadEmployees();
    showAlert("All pending employees have been approved.", "success");
}

function viewReports() {
    alert("Loading performance reports...");
}

function generateReport() {
    const reportData = {
        title: "Supervisor Activity Report",
        generated: new Date().toLocaleDateString(),
        employees: employees.length,
        pendingApprovals: employees.filter(emp => emp.status === "Pending Approval").length,
        supplies: supplies.length,
        lowStockItems: supplies.filter(s => s.status !== "Adequate").length,
        notifications: notifications.filter(n => !n.read).length,
        procurementRequests: notifications.length,
        pendingProcurement: notifications.filter(
            n => n.status === 'pending' || !n.status
        ).length
    };

    const reportSummary = `
Supervisor Activity Report:
Generated: ${reportData.generated}

Employee Summary:
- Total Employees: ${reportData.employees}
- Pending Approvals: ${reportData.pendingApprovals}

Supply Summary:
- Total Supply Items: ${reportData.supplies}
- Low/Critical Stock Items: ${reportData.lowStockItems}

Notifications:
- Unread Notifications: ${reportData.notifications}
- Total Procurement/Quotation Requests: ${reportData.procurementRequests}
- Pending Approval: ${reportData.pendingProcurement}
    `;

    alert("Supervisor Report Generated Successfully!\n\n" + reportSummary);
    showAlert("Supervisor report generated successfully!", "success");
}

function monitorSupplies() {
    const lowStockItems = supplies.filter(s => s.status !== "Adequate");
    if (lowStockItems.length === 0) {
        showAlert("All supplies are at adequate levels.", "info");
        return;
    }

    let alertMessage = "Low Stock Items:\n\n";
    lowStockItems.forEach(item => {
        alertMessage += `${item.item}: ${item.stock} units (${item.status})\n`;
    });

    alert(alertMessage);
}

function viewAllNotifications() {
    alert(`You have ${notifications.length} total notifications (${notifications.filter(n => !n.read).length} unread).`);
}

// -----------------------
// ALERT HELPER
// -----------------------

function showAlert(message, type) {
    const container = document.querySelector(".container") || document.body;

    const existingAlert = container.querySelector(".alert");
    if (existingAlert) existingAlert.remove();

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.prepend(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.classList.remove("show");
            setTimeout(() => alertDiv.remove(), 150);
        }
    }, 4000);
}

// -----------------------
// MODAL EVENTS & INIT
// -----------------------

document.addEventListener('DOMContentLoaded', () => {
    const approveModal = document.getElementById('approveRequestsModal');
    if (approveModal) {
        approveModal.addEventListener('show.bs.modal', () => {
            loadProcurementRequests();
        });
    }
});

window.approveRequest = approveRequest;
window.approveProcurementRequest = approveProcurementRequest;
window.confirmApproveRequest = confirmApproveRequest;
window.rejectProcurementRequest = rejectProcurementRequest;
window.requestMoreInfo = requestMoreInfo;
window.viewProcurementRequest = viewProcurementRequest;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.deleteNotification = deleteNotification;
window.viewNotification = viewNotification;
window.approveEmployee = approveEmployee;
window.viewEmployee = viewEmployee;
window.deleteEmployee = deleteEmployee;
window.reorderSupply = reorderSupply;
window.viewSupply = viewSupply;
window.viewReports = viewReports;
window.generateReport = generateReport;
window.monitorSupplies = monitorSupplies;
window.viewAllNotifications = viewAllNotifications;

window.onload = function () {
    loadEmployees();
    loadSupplies();
    loadNotifications();
    initializeFirebaseListeners(); // Firestore + test
    updateProcurementCounts();
};
